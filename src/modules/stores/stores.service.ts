import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Store, StoreDocument } from './entities/store.entity';
import { IStoreService } from './interfaces/store.interface';
import { CreateStoreDto, UpdateStoreDto } from './dto/store.dto';

@Injectable()
export class StoresService implements IStoreService {
  constructor(
    @InjectModel(Store.name) private storeModel: Model<StoreDocument>,
  ) {}

  async create(storeData: CreateStoreDto): Promise<Store> {
    const createdStore = new this.storeModel(storeData);
    return createdStore.save();
  }

  async findAll(): Promise<Store[]> {
    return this.storeModel.find().exec();
  }

  async findOne(id: string): Promise<Store> {
    return this.storeModel.findById(id).exec();
  }

  async update(id: string, storeData: UpdateStoreDto): Promise<Store> {
    return this.storeModel
      .findByIdAndUpdate(id, storeData, { new: true })
      .exec();
  }

  async remove(id: string): Promise<Store> {
    return this.storeModel.findByIdAndDelete(id).exec();
  }
}
