import { AccountType, UserRole } from '../entities/user.entity';

export interface IUser {
  id: string;
  name: string;
  email: string;
  phone?: string;
  password: string;
  accountType: AccountType;
  role: UserRole;
  city?: string;
  referralCode?: string;
  creditScore?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface IUserService {
  create(data: CreateUserRequest): Promise<IUser>;
  findAll(): Promise<IUser[]>;
  findOne(id: string): Promise<IUser>;
  findByEmail(email: string): Promise<IUser>;
  update(id: string, data: UpdateUserRequest): Promise<IUser>;
  remove(id: string): Promise<IUser>;
  updateCreditScore(id: string, score: number): Promise<IUser>;
}

export interface CreateUserRequest {
  name: string;
  email: string;
  phone?: string;
  password: string;
  accountType?: AccountType;
  role?: UserRole;
  city?: string;
  referralCode?: string;
}

export interface UpdateUserRequest {
  name?: string;
  email?: string;
  phone?: string;
  accountType?: AccountType;
  city?: string;
  referralCode?: string;
}
