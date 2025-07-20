import { Test, TestingModule } from '@nestjs/testing';
import { StoresController } from './stores.controller';
import { StoresService } from './stores.service';
import { CreateStoreDto, UpdateStoreDto } from './dto/store.dto';
import { Store } from './entities/store.entity';

// Mock service implementation
const mockStoresService = {
  create: jest.fn(),
  findAll: jest.fn(),
  findOne: jest.fn(),
  update: jest.fn(),
  remove: jest.fn(),
};

describe('StoresController', () => {
  let controller: StoresController;
  let service: StoresService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [StoresController],
      providers: [
        {
          provide: StoresService,
          useValue: mockStoresService,
        },
      ],
    }).compile();

    controller = module.get<StoresController>(StoresController);
    service = module.get<StoresService>(StoresService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create a store', async () => {
      const dto: CreateStoreDto = {
        name: 'Test Store',
        address: '123 Test St',
      };
      const expected: Partial<Store> = {
        id: '1',
        ...dto,
      };

      jest.spyOn(service, 'create').mockResolvedValue(expected as Store);

      const result = await controller.create(dto);
      expect(result).toBe(expected);
      expect(service.create).toHaveBeenCalledWith(dto);
    });
  });

  describe('findAll', () => {
    it('should return an array of stores', async () => {
      const expected = [{ id: '1', name: 'Test Store' }];
      jest.spyOn(service, 'findAll').mockResolvedValue(expected as Store[]);

      const result = await controller.findAll();
      expect(result).toBe(expected);
      expect(service.findAll).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should return a store by id', async () => {
      const expected = { id: '1', name: 'Test Store' };
      jest.spyOn(service, 'findOne').mockResolvedValue(expected as Store);

      const result = await controller.findOne('1');
      expect(result).toBe(expected);
      expect(service.findOne).toHaveBeenCalledWith('1');
    });
  });

  describe('update', () => {
    it('should update a store', async () => {
      const dto: UpdateStoreDto = {
        id: '1',
        name: 'Updated Store',
        address: '123 Test St',
      };
      const expected = { ...dto };
      jest.spyOn(service, 'update').mockResolvedValue(expected as Store);

      const result = await controller.update('1', dto);
      expect(result).toBe(expected);
      expect(service.update).toHaveBeenCalledWith('1', dto);
    });
  });

  describe('remove', () => {
    it('should remove a store', async () => {
      const expected = { id: '1', name: 'Test Store' };
      jest.spyOn(service, 'remove').mockResolvedValue(expected as Store);

      const result = await controller.remove('1');
      expect(result).toBe(expected);
      expect(service.remove).toHaveBeenCalledWith('1');
    });
  });
});
