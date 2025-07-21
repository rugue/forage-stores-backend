import { UserRole, AccountType } from '../../../shared/enums';

export interface IAuthService {
  register(dto: RegisterRequest): Promise<AuthResponse>;
  login(dto: LoginRequest): Promise<AuthResponse>;
  logout(userId: string): Promise<void>;
  refreshToken(token: string): Promise<AuthResponse>;
  validateUser(email: string, password: string): Promise<any>;
  generateTokens(user: any): Promise<TokenPair>;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
  phone?: string;
  accountType?: AccountType;
  city?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  user: UserInfo;
  accessToken: string;
  refreshToken?: string;
}

export interface UserInfo {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  accountType: AccountType;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

export interface JwtPayload {
  sub: string;
  email: string;
  role: UserRole;
  accountType: AccountType;
  iat?: number;
  exp?: number;
}

export interface RefreshTokenPayload {
  sub: string;
  tokenId: string;
  iat?: number;
  exp?: number;
}
