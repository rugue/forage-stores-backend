import {
  Injectable,
  NotFoundException,
  ConflictException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { User, UserDocument } from '../users/entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UpdatePasswordDto } from './dto/update-password.dto';

@Injectable()
export class UsersService {
  constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) {}

  async create(createUserDto: CreateUserDto): Promise<User> {
    try {
      // Hash password before saving
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(
        createUserDto.password,
        saltRounds,
      );

      // Generate referral code if not provided
      const referralCode =
        createUserDto.referralCode || this.generateReferralCode();

      const userData = {
        ...createUserDto,
        password: hashedPassword,
        referralCode,
      };

      const createdUser = new this.userModel(userData);
      const savedUser = await createdUser.save();

      // Remove password from response
      const userResponse = savedUser.toObject();
      delete userResponse.password;
      return userResponse;
    } catch (error) {
      if (error.code === 11000) {
        const field = Object.keys(error.keyPattern)[0];
        throw new ConflictException(`${field} already exists`);
      }
      throw error;
    }
  }

  async findAll(): Promise<User[]> {
    return this.userModel.find().select('-password').exec();
  }

  async findOne(id: string): Promise<User> {
    const user = await this.userModel.findById(id).select('-password').exec();
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    return user;
  }

  async findByEmail(email: string): Promise<UserDocument> {
    return this.userModel.findOne({ email }).exec();
  }

  async findByPhone(phone: string): Promise<UserDocument> {
    return this.userModel.findOne({ phone }).exec();
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<User> {
    try {
      const updatedUser = await this.userModel
        .findByIdAndUpdate(id, updateUserDto, { new: true })
        .select('-password')
        .exec();

      if (!updatedUser) {
        throw new NotFoundException(`User with ID ${id} not found`);
      }

      return updatedUser;
    } catch (error) {
      if (error.code === 11000) {
        const field = Object.keys(error.keyPattern)[0];
        throw new ConflictException(`${field} already exists`);
      }
      throw error;
    }
  }

  async updatePassword(
    id: string,
    updatePasswordDto: UpdatePasswordDto,
  ): Promise<{ message: string }> {
    const user = await this.userModel.findById(id).exec();
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(
      updatePasswordDto.currentPassword,
      user.password,
    );
    if (!isCurrentPasswordValid) {
      throw new UnauthorizedException('Current password is incorrect');
    }

    // Hash new password
    const saltRounds = 10;
    const hashedNewPassword = await bcrypt.hash(
      updatePasswordDto.newPassword,
      saltRounds,
    );

    // Update password
    await this.userModel
      .findByIdAndUpdate(id, { password: hashedNewPassword })
      .exec();

    return { message: 'Password updated successfully' };
  }

  async remove(id: string): Promise<User> {
    const deletedUser = await this.userModel
      .findByIdAndDelete(id)
      .select('-password')
      .exec();
    if (!deletedUser) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    return deletedUser;
  }

  async findByRole(role: string): Promise<User[]> {
    return this.userModel.find({ role }).select('-password').exec();
  }

  async findByAccountType(accountType: string): Promise<User[]> {
    return this.userModel.find({ accountType }).select('-password').exec();
  }

  async findByCity(city: string): Promise<User[]> {
    return this.userModel.find({ city }).select('-password').exec();
  }

  async updateCreditScore(id: string, creditScore: number): Promise<User> {
    const updatedUser = await this.userModel
      .findByIdAndUpdate(id, { creditScore }, { new: true })
      .select('-password')
      .exec();

    if (!updatedUser) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    return updatedUser;
  }

  private generateReferralCode(): string {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = 'REF';
    for (let i = 0; i < 6; i++) {
      result += characters.charAt(
        Math.floor(Math.random() * characters.length),
      );
    }
    return result;
  }

  async validatePassword(
    password: string,
    hashedPassword: string,
  ): Promise<boolean> {
    return bcrypt.compare(password, hashedPassword);
  }

  // Email Verification Methods
  async findByEmailVerificationToken(token: string): Promise<User | null> {
    return this.userModel.findOne({ 
      emailVerificationToken: token,
      emailVerificationExpiry: { $gt: new Date() }
    }).exec();
  }

  async updateUserVerification(userId: string, updateData: {
    emailVerified?: boolean;
    accountStatus?: string;
    emailVerificationToken?: string;
    emailVerificationExpiry?: Date;
  }): Promise<User> {
    const user = await this.userModel.findByIdAndUpdate(
      userId,
      { $set: updateData },
      { new: true }
    ).exec();
    
    if (!user) {
      throw new NotFoundException('User not found');
    }
    
    return user;
  }

  // Password Reset Methods
  async findByPasswordResetToken(token: string): Promise<User | null> {
    return this.userModel.findOne({
      passwordResetToken: token,
      passwordResetExpiry: { $gt: new Date() }
    }).exec();
  }

  async updatePasswordResetToken(userId: string, updateData: {
    passwordResetToken?: string;
    passwordResetExpiry?: Date;
  }): Promise<User> {
    const user = await this.userModel.findByIdAndUpdate(
      userId,
      { $set: updateData },
      { new: true }
    ).exec();
    
    if (!user) {
      throw new NotFoundException('User not found');
    }
    
    return user;
  }

  async updatePasswordAndClearToken(userId: string, updateData: {
    password: string;
    passwordResetToken?: string;
    passwordResetExpiry?: Date;
  }): Promise<User> {
    const user = await this.userModel.findByIdAndUpdate(
      userId,
      { 
        $set: updateData,
        $unset: {
          passwordResetToken: 1,
          passwordResetExpiry: 1
        }
      },
      { new: true }
    ).exec();
    
    if (!user) {
      throw new NotFoundException('User not found');
    }
    
    return user;
  }

  // Account Status Management
  async updateAccountStatus(userId: string, status: string): Promise<User> {
    const user = await this.userModel.findByIdAndUpdate(
      userId,
      { accountStatus: status },
      { new: true }
    ).exec();
    
    if (!user) {
      throw new NotFoundException('User not found');
    }
    
    return user;
  }

  async findByAccountStatus(status: string): Promise<User[]> {
    return this.userModel.find({ accountStatus: status }).exec();
  }

  async findActiveUsers(): Promise<User[]> {
    return this.userModel.find({ accountStatus: 'active' }).exec();
  }

  async findPendingUsers(): Promise<User[]> {
    return this.userModel.find({ accountStatus: 'pending' }).exec();
  }
}
