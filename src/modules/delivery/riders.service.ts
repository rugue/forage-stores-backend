import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Rider, RiderDocument, RiderStatus } from '../../entities/rider.entity';
import { User, UserDocument, UserRole } from '../../entities/user.entity';
import { Wallet, WalletDocument } from '../../entities/wallet.entity';
import {
  CreateRiderDto,
  UpdateRiderDto,
  AddVerificationDocumentDto,
  VerifyDocumentDto,
  UpdateLocationDto,
  RiderFilterDto,
  UpdateSecurityDepositDto,
} from './dto';

@Injectable()
export class RidersService {
  private readonly logger = new Logger(RidersService.name);
  private readonly MINIMUM_SECURITY_DEPOSIT = 70000; // N70,000

  constructor(
    @InjectModel(Rider.name) private riderModel: Model<RiderDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Wallet.name) private walletModel: Model<WalletDocument>,
  ) {}

  async create(createRiderDto: CreateRiderDto): Promise<Rider> {
    const { userId } = createRiderDto;

    // Check if user exists and has the right role
    const user = await this.userModel.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Check if rider profile already exists for user
    const existingRider = await this.riderModel.findOne({ userId: new Types.ObjectId(userId) });
    if (existingRider) {
      throw new BadRequestException('Rider profile already exists for this user');
    }

    // Create rider with pending verification status
    const rider = new this.riderModel({
      ...createRiderDto,
      userId: new Types.ObjectId(userId),
      status: RiderStatus.PENDING_VERIFICATION,
      isAvailable: false,
      isOnDelivery: false,
      deliveryStats: {
        completedDeliveries: 0,
        cancelledDeliveries: 0,
        rejectedDeliveries: 0,
        averageDeliveryTime: 0,
        averageRating: 0,
        totalRatings: 0,
        totalEarnings: 0,
      },
    });

    // Set user role to include RIDER
    await this.userModel.updateOne(
      { _id: userId },
      { $addToSet: { roles: UserRole.RIDER } }
    );

    return rider.save();
  }

  async findAll(filterDto: RiderFilterDto = {}): Promise<Rider[]> {
    const {
      status,
      isAvailable,
      city,
      vehicleType,
      minSecurityDeposit,
      notOnDelivery,
    } = filterDto;

    const filter: any = {};

    if (status) {
      filter.status = status;
    }

    if (isAvailable !== undefined) {
      filter.isAvailable = isAvailable;
    }

    if (city) {
      filter.serviceAreas = city;
    }

    if (vehicleType) {
      filter['vehicle.type'] = vehicleType;
    }

    if (minSecurityDeposit !== undefined) {
      filter.securityDeposit = { $gte: minSecurityDeposit };
    }

    if (notOnDelivery) {
      filter.isOnDelivery = false;
    }

    return this.riderModel.find(filter).exec();
  }

  async findOne(id: string): Promise<Rider> {
    const rider = await this.riderModel.findById(id);
    if (!rider) {
      throw new NotFoundException('Rider not found');
    }
    return rider;
  }

  async findByUserId(userId: string): Promise<Rider> {
    const rider = await this.riderModel.findOne({ userId: new Types.ObjectId(userId) });
    if (!rider) {
      throw new NotFoundException('Rider not found');
    }
    return rider;
  }

  async findEligibleRiders(city: string): Promise<Rider[]> {
    // Find available riders in the same city with required security deposit
    return this.riderModel.find({
      serviceAreas: city,
      status: RiderStatus.ACTIVE,
      isAvailable: true,
      isOnDelivery: false,
      securityDeposit: { $gte: this.MINIMUM_SECURITY_DEPOSIT },
    }).exec();
  }

  async update(id: string, updateRiderDto: UpdateRiderDto): Promise<Rider> {
    const rider = await this.riderModel.findById(id);
    if (!rider) {
      throw new NotFoundException('Rider not found');
    }

    // Update the rider
    Object.assign(rider, updateRiderDto);
    return rider.save();
  }

  async addVerificationDocument(
    id: string,
    addDocumentDto: AddVerificationDocumentDto,
  ): Promise<Rider> {
    const rider = await this.riderModel.findById(id);
    if (!rider) {
      throw new NotFoundException('Rider not found');
    }

    // Add the document to the rider's verification documents
    rider.verificationDocuments.push({
      ...addDocumentDto.document,
      status: 'pending',
    });

    return rider.save();
  }

  async verifyDocument(
    id: string,
    documentIndex: number,
    verifyDocumentDto: VerifyDocumentDto,
  ): Promise<Rider> {
    const rider = await this.riderModel.findById(id);
    if (!rider) {
      throw new NotFoundException('Rider not found');
    }

    if (!rider.verificationDocuments[documentIndex]) {
      throw new NotFoundException('Document not found');
    }

    // Update the document status
    rider.verificationDocuments[documentIndex].status = verifyDocumentDto.status;

    // Check if all documents are verified, update rider status
    const allVerified = rider.verificationDocuments.every(
      (doc) => doc.status === 'verified',
    );

    if (allVerified && rider.status === RiderStatus.PENDING_VERIFICATION) {
      rider.status = RiderStatus.ACTIVE;
      this.logger.log(`Rider ${id} activated after document verification`);
    }

    return rider.save();
  }

  async updateLocation(
    id: string,
    updateLocationDto: UpdateLocationDto,
  ): Promise<Rider> {
    const rider = await this.riderModel.findById(id);
    if (!rider) {
      throw new NotFoundException('Rider not found');
    }

    // Update location and availability
    rider.currentLocation = updateLocationDto.currentLocation;
    
    if (updateLocationDto.isAvailable !== undefined) {
      rider.isAvailable = updateLocationDto.isAvailable;
    }

    return rider.save();
  }

  async updateSecurityDeposit(
    id: string,
    updateDepositDto: UpdateSecurityDepositDto,
  ): Promise<Rider> {
    const rider = await this.riderModel.findById(id);
    if (!rider) {
      throw new NotFoundException('Rider not found');
    }

    // Update security deposit
    rider.securityDeposit = updateDepositDto.securityDeposit;

    return rider.save();
  }

  async setDeliveryStatus(
    id: string,
    isOnDelivery: boolean,
  ): Promise<Rider> {
    const rider = await this.riderModel.findById(id);
    if (!rider) {
      throw new NotFoundException('Rider not found');
    }

    rider.isOnDelivery = isOnDelivery;
    // If rider is now on delivery, they're not available for new deliveries
    if (isOnDelivery) {
      rider.isAvailable = false;
    }

    return rider.save();
  }

  async updateStats(
    id: string,
    statsUpdate: Partial<{
      completedDelivery: boolean;
      cancelledDelivery: boolean;
      rejectedDelivery: boolean;
      deliveryTime: number; // in minutes
      rating: number;
      earnings: number;
    }>,
  ): Promise<Rider> {
    const rider = await this.riderModel.findById(id);
    if (!rider) {
      throw new NotFoundException('Rider not found');
    }

    // Update delivery counts
    if (statsUpdate.completedDelivery) {
      rider.deliveryStats.completedDeliveries += 1;
    }
    if (statsUpdate.cancelledDelivery) {
      rider.deliveryStats.cancelledDeliveries += 1;
    }
    if (statsUpdate.rejectedDelivery) {
      rider.deliveryStats.rejectedDeliveries += 1;
    }

    // Update delivery time
    if (statsUpdate.deliveryTime) {
      const totalDeliveries = rider.deliveryStats.completedDeliveries;
      // Recalculate average delivery time
      if (totalDeliveries > 1) {
        rider.deliveryStats.averageDeliveryTime = 
          (rider.deliveryStats.averageDeliveryTime * (totalDeliveries - 1) + statsUpdate.deliveryTime) / totalDeliveries;
      } else {
        rider.deliveryStats.averageDeliveryTime = statsUpdate.deliveryTime;
      }
    }

    // Update rating
    if (statsUpdate.rating) {
      rider.deliveryStats.totalRatings += 1;
      const totalRatings = rider.deliveryStats.totalRatings;
      // Recalculate average rating
      rider.deliveryStats.averageRating =
        (rider.deliveryStats.averageRating * (totalRatings - 1) + statsUpdate.rating) / totalRatings;
    }

    // Update earnings
    if (statsUpdate.earnings) {
      rider.deliveryStats.totalEarnings += statsUpdate.earnings;
    }

    return rider.save();
  }

  async checkSecurityDepositRequirement(id: string): Promise<{
    isEligible: boolean;
    currentDeposit: number;
    requiredDeposit: number;
    shortfall: number;
  }> {
    const rider = await this.riderModel.findById(id);
    if (!rider) {
      throw new NotFoundException('Rider not found');
    }

    const currentDeposit = rider.securityDeposit;
    const isEligible = currentDeposit >= this.MINIMUM_SECURITY_DEPOSIT;
    const shortfall = isEligible ? 0 : this.MINIMUM_SECURITY_DEPOSIT - currentDeposit;

    return {
      isEligible,
      currentDeposit,
      requiredDeposit: this.MINIMUM_SECURITY_DEPOSIT,
      shortfall,
    };
  }

  async delete(id: string): Promise<void> {
    const rider = await this.riderModel.findById(id);
    if (!rider) {
      throw new NotFoundException('Rider not found');
    }

    // Remove rider role from user
    await this.userModel.updateOne(
      { _id: rider.userId },
      { $pull: { roles: UserRole.RIDER } }
    );

    await this.riderModel.findByIdAndDelete(id);
  }
}
