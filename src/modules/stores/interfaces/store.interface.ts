export interface IStore {
  id: string;
  name: string;
  description?: string;
  address: string;
  phone?: string;
  email?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IStoreService {
  create(data: Partial<IStore>): Promise<IStore>;
  findAll(): Promise<IStore[]>;
  findOne(id: string): Promise<IStore>;
  update(id: string, data: Partial<IStore>): Promise<IStore>;
  remove(id: string): Promise<IStore>;
}
