import { PipeTransform, Injectable, BadRequestException } from '@nestjs/common';
import { WALLET_CONSTANTS } from '../constants/wallet.constants';

@Injectable()
export class BalanceValidationPipe implements PipeTransform {
  transform(value: any) {
    if (!value || typeof value !== 'object') {
      throw new BadRequestException('Invalid balance update data');
    }

    const { amount, walletType } = value;

    // Validate amount
    if (typeof amount !== 'number' || amount <= 0) {
      throw new BadRequestException('Amount must be a positive number');
    }

    // Check minimum transaction amount
    if (amount < WALLET_CONSTANTS.MIN_TRANSACTION_AMOUNT) {
      throw new BadRequestException(
        `Amount must be at least ₦${WALLET_CONSTANTS.MIN_TRANSACTION_AMOUNT}`,
      );
    }

    // Check maximum transaction amount
    if (amount > WALLET_CONSTANTS.MAX_TRANSACTION_AMOUNT) {
      throw new BadRequestException(
        `Amount cannot exceed ₦${WALLET_CONSTANTS.MAX_TRANSACTION_AMOUNT}`,
      );
    }

    // Validate wallet type
    const validWalletTypes = ['foodMoney', 'foodPoints', 'foodSafe'];
    if (!validWalletTypes.includes(walletType)) {
      throw new BadRequestException(`Invalid wallet type. Must be one of: ${validWalletTypes.join(', ')}`);
    }

    return value;
  }
}

@Injectable()
export class WithdrawalValidationPipe implements PipeTransform {
  transform(value: any) {
    if (!value || typeof value !== 'object') {
      throw new BadRequestException('Invalid withdrawal data');
    }

    const { nibiaAmount } = value;

    // Validate amount
    if (typeof nibiaAmount !== 'number' || nibiaAmount <= 0) {
      throw new BadRequestException('Nibia amount must be a positive number');
    }

    // Check minimum withdrawal amount
    if (nibiaAmount < WALLET_CONSTANTS.MIN_WITHDRAWAL_AMOUNT) {
      throw new BadRequestException(
        `Minimum withdrawal amount is ${WALLET_CONSTANTS.MIN_WITHDRAWAL_AMOUNT} Nibia`,
      );
    }

    // Check maximum withdrawal amount
    if (nibiaAmount > WALLET_CONSTANTS.MAX_WITHDRAWAL_AMOUNT) {
      throw new BadRequestException(
        `Maximum withdrawal amount is ${WALLET_CONSTANTS.MAX_WITHDRAWAL_AMOUNT} Nibia`,
      );
    }

    return value;
  }
}

@Injectable()
export class TransferValidationPipe implements PipeTransform {
  transform(value: any) {
    if (!value || typeof value !== 'object') {
      throw new BadRequestException('Invalid transfer data');
    }

    const { amount, toUserId } = value;

    // Validate amount
    if (typeof amount !== 'number' || amount <= 0) {
      throw new BadRequestException('Transfer amount must be a positive number');
    }

    // Check minimum transfer amount
    if (amount < WALLET_CONSTANTS.MIN_TRANSACTION_AMOUNT) {
      throw new BadRequestException(
        `Minimum transfer amount is ₦${WALLET_CONSTANTS.MIN_TRANSACTION_AMOUNT}`,
      );
    }

    // Check maximum transfer amount
    if (amount > WALLET_CONSTANTS.MAX_TRANSACTION_AMOUNT) {
      throw new BadRequestException(
        `Maximum transfer amount is ₦${WALLET_CONSTANTS.MAX_TRANSACTION_AMOUNT}`,
      );
    }

    // Validate recipient user ID
    if (!toUserId || typeof toUserId !== 'string' || toUserId.trim().length === 0) {
      throw new BadRequestException('Valid recipient user ID is required');
    }

    return value;
  }
}
