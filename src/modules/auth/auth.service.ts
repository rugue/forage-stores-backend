import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import {
  RegisterDto,
  LoginDto,
  ForgotPasswordDto,
  ResetPasswordDto,
  VerifyEmailDto,
  ResendVerificationDto,
} from './dto';
import { User, AccountStatus } from '../users/entities/user.entity';
import { JwtPayload } from './jwt.strategy';
import { TokenBlacklistService } from './token-blacklist.service';
import { AuthEmailService } from './services/auth-email.service';
import * as crypto from 'crypto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private tokenBlacklistService: TokenBlacklistService,
    private authEmailService: AuthEmailService,
  ) {}

  async register(
    registerDto: RegisterDto,
  ): Promise<{ user: User; accessToken: string; message: string }> {
    try {
      // Check if user already exists
      const existingUser = await this.usersService.findByEmail(
        registerDto.email,
      );
      if (existingUser) {
        throw new ConflictException('User with this email already exists');
      }

      // Generate email verification token
      const emailVerificationToken = crypto.randomBytes(32).toString('hex');
      const emailVerificationExpiry = new Date();
      emailVerificationExpiry.setHours(emailVerificationExpiry.getHours() + 24); // 24 hours expiry

      // Create user with verification token
      const userData = {
        ...registerDto,
        emailVerificationToken,
        emailVerificationExpiry,
        accountStatus: AccountStatus.PENDING,
      };
      
      const user = await this.usersService.create(userData);

      // Send verification email
      await this.authEmailService.sendEmailVerification(user, emailVerificationToken);

      // Generate JWT token (but account is still pending)
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
        message: 'Registration successful. Please check your email to verify your account.',
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
  ): Promise<{ user: User; accessToken: string; warning?: string }> {
    const user = await this.validateUser(loginDto);

    // Check account status
    if (user.accountStatus === AccountStatus.SUSPENDED) {
      throw new UnauthorizedException('Account is suspended. Please contact support.');
    }

    if (user.accountStatus === AccountStatus.BANNED) {
      throw new UnauthorizedException('Account is permanently banned.');
    }

    if (user.accountStatus === AccountStatus.DEACTIVATED) {
      throw new UnauthorizedException('Account is deactivated. Please reactivate your account.');
    }

    let warning: string | undefined;
    if (user.accountStatus === AccountStatus.PENDING) {
      warning = 'Account is pending email verification. Some features may be limited.';
    }

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

    const response: { user: User; accessToken: string; warning?: string } = {
      user: userResponse,
      accessToken,
    };

    if (warning) {
      response.warning = warning;
    }

    return response;
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

  async validateUserById(userId: string): Promise<User> {
    const user = await this.usersService.findOne(userId);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }
    return user;
  }

  async generateAccessToken(user: any): Promise<string> {
    const payload: JwtPayload = {
      sub: (user._id || user.id)?.toString(),
      email: user.email,
      role: user.role,
      accountType: user.accountType,
    };

    return this.jwtService.sign(payload);
  }

  async logout(token: string): Promise<{ message: string }> {
    // Decode the token to get expiration time
    try {
      const decoded = this.jwtService.decode(token.replace('Bearer ', '')) as any;
      const expiresAt = new Date(decoded.exp * 1000); // Convert from seconds to milliseconds
      
      await this.tokenBlacklistService.addToBlacklist(token, expiresAt);
      return { message: 'Logout successful' };
    } catch (error) {
      // If token can't be decoded, still consider logout successful
      return { message: 'Logout successful' };
    }
  }

  async isTokenBlacklisted(token: string): Promise<boolean> {
    return this.tokenBlacklistService.isBlacklisted(token);
  }

  // Email Verification Methods
  async verifyEmail(verifyEmailDto: VerifyEmailDto): Promise<{ message: string }> {
    const { token } = verifyEmailDto;

    const user = await this.usersService.findByEmailVerificationToken(token);
    if (!user) {
      throw new BadRequestException('Invalid or expired verification token');
    }

    if (user.emailVerificationExpiry < new Date()) {
      throw new BadRequestException('Verification token has expired');
    }

    if (user.emailVerified) {
      throw new BadRequestException('Email is already verified');
    }

    // Update user account
    await this.usersService.updateUserVerification((user as any)._id.toString(), {
      emailVerified: true,
      accountStatus: AccountStatus.ACTIVE,
      emailVerificationToken: undefined,
      emailVerificationExpiry: undefined,
    });

    // Send welcome email
    await this.authEmailService.sendAccountActivated(user);

    return { message: 'Email verified successfully. Your account is now active!' };
  }

  async resendEmailVerification(
    resendDto: ResendVerificationDto,
  ): Promise<{ message: string }> {
    const user = await this.usersService.findByEmail(resendDto.email);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.emailVerified) {
      throw new BadRequestException('Email is already verified');
    }

    // Generate new verification token
    const emailVerificationToken = crypto.randomBytes(32).toString('hex');
    const emailVerificationExpiry = new Date();
    emailVerificationExpiry.setHours(emailVerificationExpiry.getHours() + 24);

    await this.usersService.updateUserVerification((user as any)._id.toString(), {
      emailVerificationToken,
      emailVerificationExpiry,
    });

    // Send verification email
    await this.authEmailService.sendEmailVerification(user, emailVerificationToken);

    return { message: 'Verification email sent successfully' };
  }

  // Password Reset Methods
  async forgotPassword(forgotPasswordDto: ForgotPasswordDto): Promise<{ message: string }> {
    const { email } = forgotPasswordDto;

    const user = await this.usersService.findByEmail(email);
    if (!user) {
      // Don't reveal if user exists or not for security
      return { message: 'If an account with that email exists, we have sent a password reset link.' };
    }

    // Generate password reset token
    const passwordResetToken = crypto.randomBytes(32).toString('hex');
    const passwordResetExpiry = new Date();
    passwordResetExpiry.setHours(passwordResetExpiry.getHours() + 1); // 1 hour expiry

    await this.usersService.updatePasswordResetToken((user as any)._id.toString(), {
      passwordResetToken,
      passwordResetExpiry,
    });

    // Send password reset email
    await this.authEmailService.sendPasswordReset(user, passwordResetToken);

    return { message: 'If an account with that email exists, we have sent a password reset link.' };
  }

  async resetPassword(resetPasswordDto: ResetPasswordDto): Promise<{ message: string }> {
    const { token, newPassword } = resetPasswordDto;

    const user = await this.usersService.findByPasswordResetToken(token);
    if (!user) {
      throw new BadRequestException('Invalid or expired reset token');
    }

    if (user.passwordResetExpiry < new Date()) {
      throw new BadRequestException('Reset token has expired');
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update user password and clear reset token
    await this.usersService.updatePasswordAndClearToken((user as any)._id.toString(), {
      password: hashedPassword,
      passwordResetToken: undefined,
      passwordResetExpiry: undefined,
    });

    return { message: 'Password reset successfully' };
  }

  // Account Status Management
  async suspendAccount(userId: string): Promise<{ message: string }> {
    await this.usersService.updateAccountStatus(userId, AccountStatus.SUSPENDED);
    return { message: 'Account suspended successfully' };
  }

  async activateAccount(userId: string): Promise<{ message: string }> {
    await this.usersService.updateAccountStatus(userId, AccountStatus.ACTIVE);
    return { message: 'Account activated successfully' };
  }

  async deactivateAccount(userId: string): Promise<{ message: string }> {
    await this.usersService.updateAccountStatus(userId, AccountStatus.DEACTIVATED);
    return { message: 'Account deactivated successfully' };
  }
}
