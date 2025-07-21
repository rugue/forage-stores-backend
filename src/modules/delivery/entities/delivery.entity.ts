import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import {
  IDeliveryDocument,
  IRiderDocument,
  IDeliveryLocation,
  ITimeLog,
  IStatusHistory,
  IVehicle,
  IVerificationDocument,
  IDeliveryStats,
  DeliveryStatus,
  PaymentStatus,
  RiderStatus,
  VehicleType,
} from '../interfaces/delivery.interface';
import { DELIVERY_CONSTANTS, DELIVERY_DEFAULTS, RIDER_DEFAULTS } from '../constants/delivery.constants';

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
export class DeliveryLocation extends Document implements IDeliveryLocation {
  @Prop({ required: true, type: String })
  address: string;

  @Prop({ required: true, type: String })
  city: string;

  @Prop({ required: true, type: String })
  state: string;

  @Prop({ required: false, type: [Number] })
  coordinates?: number[];

  @Prop({ required: false, type: String })
  instructions?: string;
}

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
export class TimeLog extends Document implements ITimeLog {
  @Prop({ required: false, type: Date })
  assignedAt?: Date;

  @Prop({ required: false, type: Date })
  respondedAt?: Date;

  @Prop({ required: false, type: Date })
  pickedUpAt?: Date;

  @Prop({ required: false, type: Date })
  deliveredAt?: Date;

  @Prop({ required: false, type: Date })
  confirmedAt?: Date;

  @Prop({ required: false, type: Date })
  paymentReleasedAt?: Date;
}

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
export class StatusHistory extends Document implements IStatusHistory {
  @Prop({ required: true, enum: Object.values(DeliveryStatus) })
  status: DeliveryStatus;

  @Prop({ required: true, type: Date, default: Date.now })
  timestamp: Date;

  @Prop({ required: false, type: String })
  notes?: string;

  @Prop({ required: false, type: Types.ObjectId, ref: 'User' })
  updatedBy?: Types.ObjectId;
}

@Schema({ 
  collection: DELIVERY_CONSTANTS.DELIVERY_COLLECTION,
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
export class Delivery extends Document implements IDeliveryDocument {
  @Prop({ 
    required: true, 
    type: Types.ObjectId, 
    ref: 'Order',
    unique: true,
    index: true
  })
  orderId: Types.ObjectId;

  @Prop({ 
    required: false, 
    type: Types.ObjectId, 
    ref: 'Rider',
    index: true
  })
  riderId?: Types.ObjectId;

  @Prop({ 
    required: true, 
    type: Types.ObjectId, 
    ref: 'User',
    index: true
  })
  customerId: Types.ObjectId;

  @Prop({ 
    required: true, 
    enum: Object.values(DeliveryStatus), 
    default: DELIVERY_DEFAULTS.status,
    index: true
  })
  status: DeliveryStatus;

  @Prop({ required: true, type: DeliveryLocation })
  pickupLocation: IDeliveryLocation;

  @Prop({ required: true, type: DeliveryLocation })
  deliveryLocation: IDeliveryLocation;

  @Prop({ required: true, type: Number, min: 0 })
  distance: number;

  @Prop({ required: true, type: Number, min: 0 })
  deliveryFee: number;

  @Prop({ required: true, type: Number, min: 0 })
  riderPayment: number;

  @Prop({ 
    required: true, 
    enum: Object.values(PaymentStatus), 
    default: DELIVERY_DEFAULTS.paymentStatus,
    index: true
  })
  paymentStatus: PaymentStatus;

  @Prop({ required: false, type: String })
  paymentRef?: string;

  @Prop({ required: true, type: TimeLog, default: {} })
  timeLogs: ITimeLog;

  @Prop({ required: true, type: [StatusHistory], default: [] })
  statusHistory: IStatusHistory[];

  @Prop({ required: false, type: Number, min: 1, max: 5 })
  rating?: number;

  @Prop({ required: false, type: String })
  feedback?: string;

  @Prop({ required: false, type: Date, index: true })
  acceptanceExpiryTime?: Date;

  @Prop({ required: true, type: Boolean, default: DELIVERY_DEFAULTS.seenByRider })
  seenByRider: boolean;

  @Prop({ required: false, type: String })
  notes?: string;

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
    return [
      DeliveryStatus.PENDING_ASSIGNMENT,
      DeliveryStatus.PENDING_ACCEPTANCE,
      DeliveryStatus.ACCEPTED,
      DeliveryStatus.PICKED_UP,
      DeliveryStatus.IN_TRANSIT,
      DeliveryStatus.DELIVERED
    ].includes(this.status);
  }

  get isCompleted(): boolean {
    return this.status === DeliveryStatus.COMPLETED;
  }

  get isCancelled(): boolean {
    return [
      DeliveryStatus.CANCELLED,
      DeliveryStatus.DECLINED,
      DeliveryStatus.EXPIRED
    ].includes(this.status);
  }
}

// Rider-related schemas
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
export class Vehicle extends Document implements IVehicle {
  @Prop({ required: true, enum: Object.values(VehicleType) })
  type: VehicleType;

  @Prop({ required: false, type: String })
  model?: string;

  @Prop({ required: false, type: String })
  licensePlate?: string;

  @Prop({ required: false, type: Number })
  year?: number;

  @Prop({ required: false, type: String })
  color?: string;
}

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
export class VerificationDocument extends Document implements IVerificationDocument {
  @Prop({ required: true, type: String })
  documentType: string;

  @Prop({ required: true, type: String })
  documentNumber: string;

  @Prop({ required: false, type: Date })
  issueDate?: Date;

  @Prop({ required: false, type: Date })
  expiryDate?: Date;

  @Prop({ required: true, type: String, default: 'pending' })
  status: string;

  @Prop({ required: false, type: String })
  documentUrl?: string;
}

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
export class DeliveryStats extends Document implements IDeliveryStats {
  @Prop({ required: true, type: Number, default: 0, min: 0 })
  completedDeliveries: number;

  @Prop({ required: true, type: Number, default: 0, min: 0 })
  cancelledDeliveries: number;

  @Prop({ required: true, type: Number, default: 0, min: 0 })
  rejectedDeliveries: number;

  @Prop({ required: true, type: Number, default: 0, min: 0 })
  averageDeliveryTime: number;

  @Prop({ required: true, type: Number, default: 0, min: 0 })
  averageRating: number;

  @Prop({ required: true, type: Number, default: 0, min: 0 })
  totalRatings: number;

  @Prop({ required: true, type: Number, default: 0, min: 0 })
  totalEarnings: number;
}

@Schema({ 
  collection: DELIVERY_CONSTANTS.RIDER_COLLECTION,
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
export class Rider extends Document implements IRiderDocument {
  @Prop({ 
    required: true, 
    type: Types.ObjectId, 
    ref: 'User', 
    unique: true,
    index: true
  })
  userId: Types.ObjectId;

  @Prop({ 
    required: true, 
    enum: Object.values(RiderStatus), 
    default: RIDER_DEFAULTS.status,
    index: true
  })
  status: RiderStatus;

  @Prop({ required: true, type: Vehicle })
  vehicle: IVehicle;

  @Prop({ required: false, type: [Number] })
  currentLocation?: number[];

  @Prop({ required: false, type: [String], default: [] })
  serviceAreas: string[];

  @Prop({ 
    required: true, 
    type: Number, 
    default: RIDER_DEFAULTS.maxDeliveryDistance,
    min: 1
  })
  maxDeliveryDistance: number;

  @Prop({ 
    required: true, 
    type: Boolean, 
    default: RIDER_DEFAULTS.isAvailable,
    index: true
  })
  isAvailable: boolean;

  @Prop({ 
    required: true, 
    type: Boolean, 
    default: RIDER_DEFAULTS.isOnDelivery,
    index: true
  })
  isOnDelivery: boolean;

  @Prop({ required: true, type: [VerificationDocument], default: [] })
  verificationDocuments: IVerificationDocument[];

  @Prop({ required: true, type: DeliveryStats, default: {} })
  deliveryStats: IDeliveryStats;

  @Prop({ required: true, type: Number, default: 0, min: 0 })
  securityDeposit: number;

  @Prop({ required: false, type: String })
  accountNumber?: string;

  @Prop({ required: false, type: String })
  bankName?: string;

  @Prop({ required: false, type: String })
  accountName?: string;

  @Prop({ required: false, type: String })
  notes?: string;

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
  get isVerified(): boolean {
    return this.status === RiderStatus.ACTIVE;
  }

  get canAcceptDeliveries(): boolean {
    return this.isVerified && this.isAvailable && !this.isOnDelivery;
  }
}

export const DeliveryLocationSchema = SchemaFactory.createForClass(DeliveryLocation);
export const TimeLogSchema = SchemaFactory.createForClass(TimeLog);
export const StatusHistorySchema = SchemaFactory.createForClass(StatusHistory);
export const DeliverySchema = SchemaFactory.createForClass(Delivery);
export const VehicleSchema = SchemaFactory.createForClass(Vehicle);
export const VerificationDocumentSchema = SchemaFactory.createForClass(VerificationDocument);
export const DeliveryStatsSchema = SchemaFactory.createForClass(DeliveryStats);
export const RiderSchema = SchemaFactory.createForClass(Rider);

// Delivery pre-save middleware
DeliverySchema.pre('save', function(next) {
  const delivery = this as IDeliveryDocument;
  
  // If it's a new document or the status has changed
  if (delivery.isNew || delivery.isModified('status')) {
    const status = delivery.status;
    const statusUpdate = {
      status,
      timestamp: new Date(),
      notes: `Status changed to ${status}`
    };
    
    // Add to status history
    delivery.statusHistory.push(statusUpdate);
    
    // Update time logs based on status
    const now = new Date();
    
    if (status === DeliveryStatus.PENDING_ACCEPTANCE && !delivery.timeLogs.assignedAt) {
      delivery.timeLogs.assignedAt = now;
      
      // Set acceptance expiry time (3 minutes from now)
      const expiryTime = new Date(now);
      expiryTime.setMinutes(expiryTime.getMinutes() + 3);
      delivery.acceptanceExpiryTime = expiryTime;
    }
    else if (status === DeliveryStatus.ACCEPTED || status === DeliveryStatus.DECLINED) {
      delivery.timeLogs.respondedAt = now;
    }
    else if (status === DeliveryStatus.PICKED_UP) {
      delivery.timeLogs.pickedUpAt = now;
    }
    else if (status === DeliveryStatus.DELIVERED) {
      delivery.timeLogs.deliveredAt = now;
    }
    else if (status === DeliveryStatus.COMPLETED) {
      delivery.timeLogs.confirmedAt = now;
    }
  }
  
  // If payment status has changed to RELEASED
  if (delivery.isModified('paymentStatus') && delivery.paymentStatus === PaymentStatus.RELEASED) {
    delivery.timeLogs.paymentReleasedAt = new Date();
  }
  
  next();
});

// Indexes for better query performance
DeliverySchema.index({ orderId: 1 }, { unique: true });
DeliverySchema.index({ riderId: 1 });
DeliverySchema.index({ customerId: 1 });
DeliverySchema.index({ status: 1 });
DeliverySchema.index({ paymentStatus: 1 });
DeliverySchema.index({ createdAt: -1 });
DeliverySchema.index({ acceptanceExpiryTime: 1 });
DeliverySchema.index({ 'pickupLocation.city': 1 });
DeliverySchema.index({ 'deliveryLocation.city': 1 });

RiderSchema.index({ userId: 1 }, { unique: true });
RiderSchema.index({ status: 1 });
RiderSchema.index({ isAvailable: 1 });
RiderSchema.index({ isOnDelivery: 1 });
RiderSchema.index({ securityDeposit: 1 });
RiderSchema.index({ serviceAreas: 1 });
RiderSchema.index({ 'vehicle.type': 1 });
RiderSchema.index({ currentLocation: '2dsphere' });
