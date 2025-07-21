import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import {
  IReferralDocument,
  ICommissionHistoryDocument,
  CommissionType,
  ReferralStatus,
  ReferralTier,
  ICommissionHistory,
} from '../interfaces/referral.interface';
import { REFERRAL_CONSTANTS, REFERRAL_DEFAULTS, REFERRAL_TIER_CONFIG } from '../constants/referral.constants';

@Schema({ 
  timestamps: true, 
  _id: false,
  toJSON: {
    transform: (doc, ret) => {
      ret.id = ret._id;
      delete ret._id;
      delete ret.__v;
      return ret;
    },
  },
})
export class CommissionHistory extends Document implements ICommissionHistoryDocument {
  @Prop({ 
    required: true, 
    type: Types.ObjectId, 
    ref: 'Order',
    index: true
  })
  orderId: Types.ObjectId;

  @Prop({ 
    required: true, 
    type: Number, 
    min: 0 
  })
  amount: number;

  @Prop({ 
    required: true, 
    enum: Object.values(CommissionType) 
  })
  type: CommissionType;

  @Prop({ 
    required: true, 
    type: Date, 
    default: Date.now,
    index: true
  })
  date: Date;

  @Prop({ 
    required: true, 
    type: Number, 
    min: 0 
  })
  orderAmount: number;

  @Prop({ 
    required: true, 
    type: Number, 
    min: 0, 
    max: 100 
  })
  commissionPercentage: number;

  @Prop({ 
    required: true, 
    type: Boolean, 
    default: false 
  })
  isProcessed: boolean;

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
}

@Schema({ 
  collection: REFERRAL_CONSTANTS.COLLECTION_NAME,
  timestamps: true,
  toJSON: {
    transform: (doc, ret) => {
      ret.id = ret._id;
      delete ret._id;
      delete ret.__v;
      return ret;
    },
  },
})
export class Referral extends Document implements IReferralDocument {
  @Prop({ 
    required: true, 
    type: Types.ObjectId, 
    ref: 'User',
    index: true
  })
  referrerId: Types.ObjectId;

  @Prop({ 
    required: true, 
    type: Types.ObjectId, 
    ref: 'User',
    unique: true,
    index: true
  })
  referredUserId: Types.ObjectId;

  @Prop({ 
    required: true, 
    type: Date, 
    default: Date.now,
    index: true
  })
  referralDate: Date;

  @Prop({ 
    required: false, 
    type: Date 
  })
  signUpDate?: Date;

  @Prop({ 
    required: true, 
    enum: Object.values(ReferralStatus), 
    default: REFERRAL_DEFAULTS.status,
    index: true
  })
  status: ReferralStatus;

  @Prop({ 
    required: false, 
    type: String,
    index: true
  })
  referralCode?: string;

  @Prop({ 
    required: true, 
    type: Number, 
    default: REFERRAL_DEFAULTS.totalCommissionsEarned,
    min: 0 
  })
  totalCommissionsEarned: number;

  @Prop({ 
    required: true, 
    type: Number, 
    default: REFERRAL_DEFAULTS.purchaseCount,
    min: 0 
  })
  purchaseCount: number;

  @Prop({ 
    required: true, 
    type: Boolean, 
    default: REFERRAL_DEFAULTS.isCommissionCompleted 
  })
  isCommissionCompleted: boolean;

  @Prop({ 
    required: true, 
    type: [Object], 
    default: REFERRAL_DEFAULTS.commissionHistory 
  })
  commissionHistory: ICommissionHistory[];

  @Prop({ 
    required: true, 
    enum: Object.values(ReferralTier), 
    default: REFERRAL_DEFAULTS.tier,
    index: true
  })
  tier: ReferralTier;

  @Prop({ 
    required: false, 
    type: Date,
    index: true
  })
  expiryDate?: Date;

  @Prop({ 
    required: false, 
    type: Date 
  })
  lastPurchaseDate?: Date;

  @Prop({ 
    required: true, 
    type: Number, 
    default: REFERRAL_DEFAULTS.bonusMultiplier,
    min: 1
  })
  bonusMultiplier: number;

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

  // Virtual properties
  get isActive(): boolean {
    return this.status === ReferralStatus.ACTIVE && !this.isExpired;
  }

  get isExpired(): boolean {
    if (!this.expiryDate) return false;
    return new Date() > this.expiryDate;
  }

  get canEarnCommission(): boolean {
    return this.isActive && !this.isCommissionCompleted;
  }

  get currentTierConfig() {
    return REFERRAL_TIER_CONFIG[this.tier];
  }

  // Method to calculate commission for an order
  calculateCommission(orderAmount: number): number {
    if (!this.canEarnCommission) return 0;
    if (orderAmount < REFERRAL_CONSTANTS.MIN_ORDER_AMOUNT_FOR_COMMISSION) return 0;

    const config = this.currentTierConfig;
    const baseCommission = (orderAmount * config.commissionPercentage) / 100;
    const bonusAmount = baseCommission * (this.bonusMultiplier - 1);
    return Math.min(baseCommission + bonusAmount, REFERRAL_CONSTANTS.MAX_COMMISSION_PER_ORDER);
  }

  // Method to add commission to history
  addCommission(orderId: Types.ObjectId, orderAmount: number, commissionType: CommissionType): void {
    const amount = this.calculateCommission(orderAmount);
    if (amount > 0) {
      const commission: ICommissionHistory = {
        orderId,
        amount,
        type: commissionType,
        date: new Date(),
        orderAmount,
        commissionPercentage: this.currentTierConfig.commissionPercentage,
        isProcessed: false,
      };
      
      this.commissionHistory.push(commission);
      this.totalCommissionsEarned += amount;
      this.purchaseCount += 1;
      this.lastPurchaseDate = new Date();

      // Check if commission is completed
      if (this.purchaseCount >= REFERRAL_CONSTANTS.PURCHASES_REQUIRED_FOR_COMPLETION) {
        this.isCommissionCompleted = true;
        this.status = ReferralStatus.COMPLETED;
      }
    }
  }

  // Method to upgrade tier
  upgradeTier(newTier: ReferralTier): void {
    if (Object.values(ReferralTier).indexOf(newTier) > Object.values(ReferralTier).indexOf(this.tier)) {
      this.tier = newTier;
      this.bonusMultiplier = REFERRAL_TIER_CONFIG[newTier].bonusMultiplier;
      
      // Extend expiry date for higher tiers
      const config = REFERRAL_TIER_CONFIG[newTier];
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + config.expiryDays);
      this.expiryDate = expiryDate;
    }
  }
}

export const CommissionHistorySchema = SchemaFactory.createForClass(CommissionHistory);
export const ReferralSchema = SchemaFactory.createForClass(Referral);

// Pre-save middleware for referral
ReferralSchema.pre('save', function (next) {
  const referral = this as IReferralDocument;
  
  // Set expiry date if not set
  if (!referral.expiryDate && referral.isNew) {
    const expiryDate = new Date(referral.referralDate);
    expiryDate.setDate(expiryDate.getDate() + REFERRAL_CONSTANTS.REFERRAL_EXPIRY_DAYS);
    referral.expiryDate = expiryDate;
  }

  // Update status based on expiry
  if (referral.isExpired && referral.status === ReferralStatus.ACTIVE) {
    referral.status = ReferralStatus.EXPIRED;
  }

  // Update sign-up date if status changes to active
  if (referral.isModified('status') && referral.status === ReferralStatus.ACTIVE && !referral.signUpDate) {
    referral.signUpDate = new Date();
  }

  next();
});

// Indexes for better query performance
ReferralSchema.index({ referrerId: 1 });
ReferralSchema.index({ referredUserId: 1 }, { unique: true });
ReferralSchema.index({ status: 1 });
ReferralSchema.index({ tier: 1 });
ReferralSchema.index({ referralDate: -1 });
ReferralSchema.index({ expiryDate: 1 });
ReferralSchema.index({ isCommissionCompleted: 1 });
ReferralSchema.index({ referralCode: 1 });
ReferralSchema.index({ lastPurchaseDate: -1 });
ReferralSchema.index({ totalCommissionsEarned: -1 });

// Compound indexes
ReferralSchema.index({ referrerId: 1, status: 1 });
ReferralSchema.index({ status: 1, tier: 1 });
ReferralSchema.index({ referrerId: 1, isCommissionCompleted: 1 });
