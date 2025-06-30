import {
  Injectable,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { RegisterDto, LoginDto } from './dto';
import { User } from '../../entities/user.entity';
import { JwtPayload } from './jwt.strategy';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  async register(
    registerDto: RegisterDto,
  ): Promise<{ user: User; accessToken: string }> {
    try {
      // Check if user already exists
      const existingUser = await this.usersService.findByEmail(
        registerDto.email,
      );
      if (existingUser) {
        throw new ConflictException('User with this email already exists');
      }

      // Create user
      const user = await this.usersService.create(registerDto);

      // Generate JWT token
      const payload: JwtPayload = {
        sub: (user as any)._id.toString(),
        email: user.email,
        role: user.role,
        accountType: user.accountType,
      };

      const accessToken = this.jwtService.sign(payload);

      return {
        user,
        accessToken,
      };
    } catch (error) {
      if (error instanceof ConflictException) {
        throw error;
      }
      throw new ConflictException('Registration failed');
    }
  }

  async login(
    loginDto: LoginDto,
  ): Promise<{ user: User; accessToken: string }> {
    const user = await this.validateUser(loginDto);

    const payload: JwtPayload = {
      sub: (user as any)._id.toString(),
      email: user.email,
      role: user.role,
      accountType: user.accountType,
    };

    const accessToken = this.jwtService.sign(payload);

    // Remove password from response
    const userResponse = user.toObject();
    delete userResponse.password;

    return {
      user: userResponse,
      accessToken,
    };
  }

  async validateUser(loginDto: LoginDto): Promise<any> {
    let user;

    // Find user by email or phone
    if (loginDto.email) {
      user = await this.usersService.findByEmail(loginDto.email);
    } else if (loginDto.phone) {
      user = await this.usersService.findByPhone(loginDto.phone);
    }

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Validate password
    const isPasswordValid = await this.usersService.validatePassword(
      loginDto.password,
      user.password,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return user;
  }

  async refreshToken(userId: string): Promise<{ accessToken: string }> {
    const user = await this.usersService.findOne(userId);

    const payload: JwtPayload = {
      sub: (user as any)._id.toString(),
      email: user.email,
      role: user.role,
      accountType: user.accountType,
    };

    const accessToken = this.jwtService.sign(payload);

    return { accessToken };
  }
}
