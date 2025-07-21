import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { AdminRole, AdminPermission, IAdminDocument } from '../interfaces/admin.interface';
import { ADMIN_CONSTANTS, ADMIN_DEFAULTS } from '../constants/admin.constants';

@Schema({
  collection: ADMIN_CONSTANTS.COLLECTION_NAME,
  timestamps: true,
  toJSON: {
    transform: (doc, ret) => {
      ret.id = ret._id;
      delete ret._id;
      delete ret.__v;
      delete ret.password;
      return ret;
    },
  },
})
export class Admin extends Document implements IAdminDocument {
  @Prop({
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    index: true,
  })
  email: string;

  @Prop({
    required: true,
    trim: true,
    minlength: 2,
    maxlength: 50,
  })
  name: string;

  @Prop({
    required: true,
    select: false, // Exclude from queries by default
  })
  password: string;

  @Prop({
    type: String,
    enum: Object.values(AdminRole),
    default: ADMIN_DEFAULTS.role,
    index: true,
  })
  role: AdminRole;

  @Prop({
    type: [String],
    enum: Object.values(AdminPermission),
    default: ADMIN_DEFAULTS.permissions,
  })
  permissions: AdminPermission[];

  @Prop({
    type: Boolean,
    default: ADMIN_DEFAULTS.isActive,
    index: true,
  })
  isActive: boolean;

  @Prop({
    type: Date,
    index: true,
  })
  lastLogin?: Date;

  @Prop({
    type: Number,
    default: ADMIN_DEFAULTS.loginAttempts,
  })
  loginAttempts: number;

  @Prop({
    type: Date,
    index: true,
  })
  lockedUntil?: Date;

  @Prop({
    type: Date,
  })
  passwordChangedAt?: Date;

  @Prop({
    type: Date,
    default: Date.now,
    index: true,
  })
  createdAt: Date;

  @Prop({
    type: Date,
    default: Date.now,
  })
  updatedAt: Date;

  // Virtual for checking if account is locked
  get isLocked(): boolean {
    return !!(this.lockedUntil && this.lockedUntil > new Date());
  }

  // Method to increment login attempts
  async incLoginAttempts(): Promise<Admin> {
    // If we have a previous lock that has expired, restart at 1
    if (this.lockedUntil && this.lockedUntil < new Date()) {
      return this.updateOne({
        $unset: { lockedUntil: 1 },
        $set: { loginAttempts: 1 },
      });
    }

    const updates: any = { $inc: { loginAttempts: 1 } };

    // Check if we need to lock the account
    if (this.loginAttempts + 1 >= ADMIN_CONSTANTS.MAX_LOGIN_ATTEMPTS && !this.isLocked) {
      updates.$set = { lockedUntil: Date.now() + ADMIN_CONSTANTS.LOCK_TIME };
    }

    return this.updateOne(updates);
  }

  // Method to reset login attempts
  async resetLoginAttempts(): Promise<Admin> {
    return this.updateOne({
      $unset: { loginAttempts: 1, lockedUntil: 1 },
      $set: { lastLogin: new Date() },
    });
  }

  // Method to compare password
  async comparePassword(candidatePassword: string): Promise<boolean> {
    return bcrypt.compare(candidatePassword, this.password);
  }

  // Method to hash password
  static async hashPassword(password: string): Promise<string> {
    const salt = await bcrypt.genSalt(10);
    return bcrypt.hash(password, salt);
  }

  // Method to check if password was changed after JWT was issued
  changedPasswordAfter(JWTTimestamp: number): boolean {
    if (this.passwordChangedAt) {
      const changedTimestamp = parseInt(
        (this.passwordChangedAt.getTime() / 1000).toString(),
        10,
      );
      return JWTTimestamp < changedTimestamp;
    }
    return false;
  }
}

export const AdminSchema = SchemaFactory.createForClass(Admin);

// Pre-save middleware to hash password
AdminSchema.pre('save', async function (next) {
  const admin = this as IAdminDocument;

  // Only run this function if password was actually modified
  if (!admin.isModified('password')) return next();

  // Hash the password with cost of 12
  admin.password = await Admin.hashPassword(admin.password);

  // Set password changed timestamp
  admin.passwordChangedAt = new Date();

  next();
});

// Index for compound queries
AdminSchema.index({ email: 1, isActive: 1 });
AdminSchema.index({ role: 1, isActive: 1 });
AdminSchema.index({ createdAt: -1 });
