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
  CreateAccountDto,
  SelectAccountTypeDto,
  VerifyEmailWithCodeDto,
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
      console.log('Registration attempt for:', registerDto.email);
      
      // Check if user already exists
      const existingUser = await this.usersService.findByEmail(
        registerDto.email,
      );
      if (existingUser) {
        console.log('User already exists:', registerDto.email);
        throw new ConflictException('User with this email already exists');
      }

      // Generate 4-digit verification code (NEW: Updated to use 4-digit instead of long token)
      const emailVerificationCode = Math.floor(1000 + Math.random() * 9000).toString();
      const emailVerificationCodeExpiry = new Date();
      emailVerificationCodeExpiry.setMinutes(emailVerificationCodeExpiry.getMinutes() + 15); // 15 minutes expiry

      // Create user with 4-digit verification code
      const userData = {
        ...registerDto,
        emailVerificationCode,
        emailVerificationCodeExpiry,
        accountStatus: AccountStatus.PENDING,
      };
      
      const user = await this.usersService.create(userData);

      // Try to send 4-digit verification email (UPDATED: Use new email template)
      try {
        await this.authEmailService.sendEmailVerificationCode(user, emailVerificationCode);
      } catch (emailError) {
        console.warn('Failed to send verification email:', emailError.message);
        // Continue with registration even if email fails
      }

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
        message: 'Registration successful. Please check your email for a 4-digit verification code.',
      };
    } catch (error) {
      if (error instanceof ConflictException) {
        throw error;
      }
      
      // Log the actual error for debugging
      console.error('Registration error:', error);
      
      // Handle MongoDB duplicate key errors
      if (error.code === 11000) {
        const field = Object.keys(error.keyPattern)[0];
        throw new ConflictException(`${field} already exists`);
      }
      
      // Handle validation errors
      if (error.name === 'ValidationError') {
        const validationErrors = Object.values(error.errors).map((err: any) => err.message);
        throw new ConflictException(`Validation failed: ${validationErrors.join(', ')}`);
      }
      
      throw new ConflictException(`Registration failed: ${error.message || 'Unknown error'}`);
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

  // Email Verification Methods (UPDATED: Support both 4-digit codes and legacy tokens)
  async verifyEmail(verifyEmailDto: VerifyEmailDto): Promise<{ message: string }> {
    const { token } = verifyEmailDto;

    // Check if it's a 4-digit code format
    if (/^\d{4}$/.test(token)) {
      // It's a 4-digit code, redirect to the new verification method
      throw new BadRequestException('Please use the 4-digit verification code endpoint: /auth/verify-email-code');
    }

    // Legacy token verification (for backward compatibility)
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

    // Generate new 4-digit verification code (UPDATED: Use 4-digit instead of long token)
    const emailVerificationCode = Math.floor(1000 + Math.random() * 9000).toString();
    const emailVerificationCodeExpiry = new Date();
    emailVerificationCodeExpiry.setMinutes(emailVerificationCodeExpiry.getMinutes() + 15);

    await this.usersService.updateVerificationCode((user as any)._id.toString(), {
      emailVerificationCode,
      emailVerificationCodeExpiry,
    });

    // Send 4-digit verification email
    await this.authEmailService.sendEmailVerificationCode(user, emailVerificationCode);

    return { message: 'New 4-digit verification code sent to your email' };
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

  // SMTP Test Method (Development only)
  async testEmailConfiguration(email: string): Promise<{ message: string }> {
    try {
      // Create a test user object
      const testUser = {
        name: 'Test User',
        email: email,
      } as User;

      // Try to send a test email
      await this.authEmailService.sendEmailVerification(testUser, 'test-token-123');
      
      return { 
        message: `Test email sent successfully to ${email}. Check your inbox!`,
      };
    } catch (error) {
      console.error('SMTP Test failed:', error);
      throw new BadRequestException(`Failed to send test email: ${error.message}`);
    }
  }

  // =============================================
  // NEW STEP-BY-STEP AUTHENTICATION FLOW
  // =============================================

  /**
   * Step 1: Create basic account (without account type)
   * Product Flow: Splash → Onboarding → Create Account
   */
  async createAccount(createAccountDto: CreateAccountDto): Promise<{ 
    user: Partial<User>; 
    tempToken: string; 
    message: string;
  }> {
    try {
      console.log('Account creation attempt for:', createAccountDto.email);
      
      // Check if user already exists
      const existingUser = await this.usersService.findByEmail(createAccountDto.email);
      if (existingUser) {
        throw new ConflictException('User with this email already exists');
      }

      // Validate password confirmation
      if (createAccountDto.password !== createAccountDto.confirmPassword) {
        throw new BadRequestException('Password and confirm password do not match');
      }

      // Generate 4-digit verification code
      const emailVerificationCode = Math.floor(1000 + Math.random() * 9000).toString();
      const emailVerificationCodeExpiry = new Date();
      emailVerificationCodeExpiry.setMinutes(emailVerificationCodeExpiry.getMinutes() + 15); // 15 minutes expiry

      // Create user with verification code (without account type yet)
      // Transform firstName + lastName to name, location to city for existing User schema
      const userData = {
        name: `${createAccountDto.firstName} ${createAccountDto.lastName}`.trim(),
        firstName: createAccountDto.firstName,
        lastName: createAccountDto.lastName,
        email: createAccountDto.email,
        phone: createAccountDto.phone,
        password: createAccountDto.password,
        city: createAccountDto.location, // Map location to city field in database
        emailVerificationCode,
        emailVerificationCodeExpiry,
        accountStatus: AccountStatus.PENDING,
        emailVerified: false,
        // accountType will be set in next step
      };
      
      const user = await this.usersService.create(userData);

      // Generate temporary token for account setup flow
      const tempPayload = {
        sub: (user as any)._id.toString(),
        email: user.email,
        step: 'account_created',
        type: 'temp_token',
      };

      const tempToken = this.jwtService.sign(tempPayload, { expiresIn: '1h' });

      // Try to send 4-digit verification email
      try {
        await this.authEmailService.sendEmailVerificationCode(user, emailVerificationCode);
      } catch (emailError) {
        console.warn('Failed to send verification email:', emailError.message);
        // Continue with account creation even if email fails
      }

      return {
        user: {
          id: (user as any)._id.toString(),
          name: user.name,
          email: user.email,
          emailVerified: user.emailVerified,
          accountStatus: user.accountStatus,
        },
        tempToken,
        message: 'Account created successfully. Please check your email for a 4-digit verification code.',
      };
    } catch (error) {
      if (error instanceof ConflictException) {
        throw error;
      }
      
      console.error('Account creation error:', error);
      
      if (error.code === 11000) {
        const field = Object.keys(error.keyPattern)[0];
        throw new ConflictException(`${field} already exists`);
      }
      
      throw new BadRequestException('Account creation failed. Please try again.');
    }
  }

  /**
   * Step 2: Select account type
   * Product Flow: Create Account → Account Type Selection
   */
  async selectAccountType(
    userId: string,
    selectAccountTypeDto: SelectAccountTypeDto
  ): Promise<{ message: string; user: Partial<User> }> {
    try {
      const user = await this.usersService.findOne(userId);
      if (!user) {
        throw new NotFoundException('User not found');
      }

      // Update user with account type
      const updatedUser = await this.usersService.updateAccountType(userId, selectAccountTypeDto.accountType);

      return {
        message: 'Account type selected successfully',
        user: {
          id: userId,
          name: updatedUser.name,
          email: updatedUser.email,
          accountType: updatedUser.accountType,
          accountStatus: updatedUser.accountStatus,
        },
      };
    } catch (error) {
      console.error('Account type selection error:', error);
      throw new BadRequestException('Failed to select account type. Please try again.');
    }
  }

  /**
   * Step 3: Verify email with 4-digit code
   * Product Flow: Account Type → Verify Email (4-digits)
   */
  async verifyEmailWithCode(verifyDto: VerifyEmailWithCodeDto): Promise<{ 
    user: User; 
    accessToken: string; 
    message: string;
  }> {
    try {
      const { email, code } = verifyDto;

      const user = await this.usersService.findByEmail(email);
      if (!user) {
        throw new NotFoundException('User not found');
      }

      // Check if code matches
      if (user.emailVerificationCode !== code) {
        throw new BadRequestException('Invalid verification code');
      }

      // Check if code has expired
      if (!user.emailVerificationCodeExpiry || user.emailVerificationCodeExpiry < new Date()) {
        throw new BadRequestException('Verification code has expired. Please request a new one.');
      }

      // Verify email and activate account
      const verifiedUser = await this.usersService.verifyEmailWithCode(user._id.toString());

      // Generate JWT token for verified user
      const payload: JwtPayload = {
        sub: (verifiedUser as any)._id.toString(),
        email: verifiedUser.email,
        role: verifiedUser.role,
        accountType: verifiedUser.accountType,
      };

      const accessToken = this.jwtService.sign(payload);

      return {
        user: verifiedUser,
        accessToken,
        message: 'Email verified successfully. Account is now active.',
      };
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      
      console.error('Email verification error:', error);
      throw new BadRequestException('Email verification failed. Please try again.');
    }
  }

  /**
   * Resend 4-digit verification code
   */
  async resendVerificationCode(email: string): Promise<{ message: string }> {
    try {
      const user = await this.usersService.findByEmail(email);
      if (!user) {
        throw new NotFoundException('User not found');
      }

      if (user.emailVerified) {
        throw new BadRequestException('Email is already verified');
      }

      // Generate new 4-digit code
      const emailVerificationCode = Math.floor(1000 + Math.random() * 9000).toString();
      const emailVerificationCodeExpiry = new Date();
      emailVerificationCodeExpiry.setMinutes(emailVerificationCodeExpiry.getMinutes() + 15);

      // Update user with new code
      await this.usersService.updateVerificationCode(user._id.toString(), {
        emailVerificationCode,
        emailVerificationCodeExpiry,
      });

      // Send new verification email
      try {
        await this.authEmailService.sendEmailVerificationCode(user, emailVerificationCode);
      } catch (emailError) {
        console.error('Failed to send verification code:', emailError.message);
        throw new BadRequestException('Failed to send verification code. Please try again.');
      }

      return {
        message: 'New verification code sent to your email.',
      };
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      
      console.error('Resend verification code error:', error);
      throw new BadRequestException('Failed to resend verification code. Please try again.');
    }
  }
}
