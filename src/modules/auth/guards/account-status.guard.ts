import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import { AccountStatus } from '../../users/entities/user.entity';

@Injectable()
export class AccountStatusGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new UnauthorizedException('User not authenticated');
    }

    // Check if account is active
    if (user.accountStatus === AccountStatus.SUSPENDED) {
      throw new ForbiddenException(
        'Account is suspended. Please contact support.'
      );
    }

    if (user.accountStatus === AccountStatus.BANNED) {
      throw new ForbiddenException(
        'Account is permanently banned.'
      );
    }

    if (user.accountStatus === AccountStatus.DEACTIVATED) {
      throw new ForbiddenException(
        'Account is deactivated. Please reactivate your account.'
      );
    }

    if (user.accountStatus === AccountStatus.PENDING) {
      throw new ForbiddenException(
        'Account is pending email verification. Please verify your email.'
      );
    }

    return true;
  }
}
