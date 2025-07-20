import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { StoresService } from './stores.service';
import { Store, StoreDocument } from './entities/store.entity';
import { CreateStoreDto, UpdateStoreDto } from './dto/store.dto';

const mockStore = {
  id: '1',
  name: 'Test Store',
  address: '123 Test St',
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe('StoresService', () => {
  let service: StoresService;
  let model: Model<StoreDocument>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StoresService,
        {
          provide: getModelToken(Store.name),
          useValue: {
            new: jest.fn().mockResolvedValue(mockStore),
            constructor: jest.fn().mockResolvedValue(mockStore),
            find: jest.fn(),
            findOne: jest.fn(),
            findById: jest.fn(),
            create: jest.fn(),
            findByIdAndUpdate: jest.fn(),
            findByIdAndDelete: jest.fn(),
            exec: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<StoresService>(StoresService);
    model = module.get<Model<StoreDocument>>(getModelToken(Store.name));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a store', async () => {
      const createStoreDto: CreateStoreDto = {
        name: 'New Store',
        address: '123 New St',
      };
      const expectedStore = { id: '1', ...createStoreDto };

      jest.spyOn(model, 'create').mockImplementationOnce(() => Promise.resolve(expectedStore as Store));

      const result = await service.create(createStoreDto);
      expect(result).toEqual(expectedStore);
    });
  });

  describe('findAll', () => {
    it('should return an array of stores', async () => {
      const stores = [mockStore];
      jest.spyOn(model, 'find').mockReturnValue({
        exec: jest.fn().mockResolvedValueOnce(stores),
      } as any);

      const result = await service.findAll();
      expect(result).toEqual(stores);
    });
  });

  describe('findOne', () => {
    it('should find a store by id', async () => {
      jest.spyOn(model, 'findById').mockReturnValue({
        exec: jest.fn().mockResolvedValueOnce(mockStore),
      } as any);

      const result = await service.findOne('1');
      expect(result).toEqual(mockStore);
    });
  });

  describe('update', () => {
    it('should update a store', async () => {
      const updateStoreDto: UpdateStoreDto = {
        id: '1',
        name: 'Updated Store',
        address: '123 Test St',
      };
      const updatedStore = { ...mockStore, ...updateStoreDto };

      jest.spyOn(model, 'findByIdAndUpdate').mockReturnValue({
        exec: jest.fn().mockResolvedValueOnce(updatedStore),
      } as any);

      const result = await service.update('1', updateStoreDto);
      expect(result).toEqual(updatedStore);
    });
  });

  describe('remove', () => {
    it('should remove a store', async () => {
      jest.spyOn(model, 'findByIdAndDelete').mockReturnValue({
        exec: jest.fn().mockResolvedValueOnce(mockStore),
      } as any);

      const result = await service.remove('1');
      expect(result).toEqual(mockStore);
    });
  });
});
