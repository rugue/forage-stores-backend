import { Injectable } from '@nestjs/common';
import { IPaymentStrategy } from '../interfaces/payment.interface';
import { PaystackStrategy } from './paystack.strategy';
import { PaymentGateway, PaymentMethod } from '../constants/payment.constants';

@Injectable()
export class PaymentStrategyFactory {
  private readonly strategies: Map<string, IPaymentStrategy> = new Map();

  constructor(
    private readonly paystackStrategy: PaystackStrategy,
  ) {
    // Initialize strategy mappings
    this.strategies.set(PaymentGateway.PAYSTACK, paystackStrategy);
    this.strategies.set('PAYSTACK', paystackStrategy);
  }

  /**
   * Get payment strategy based on gateway
   */
  getGatewayStrategy(gateway: PaymentGateway): IPaymentStrategy {
    const strategy = this.strategies.get(gateway);
    if (!strategy) {
      throw new Error(`Unsupported payment gateway: ${gateway}. Strategy not implemented yet.`);
    }
    return strategy;
  }

  /**
   * Get payment strategy based on payment method
   */
  getMethodStrategy(method: PaymentMethod): IPaymentStrategy {
    let strategyKey: string;
    
    switch (method) {
      case PaymentMethod.FOOD_MONEY:
      case PaymentMethod.WALLET_TRANSFER:
        strategyKey = 'WALLET';
        break;
      case PaymentMethod.FOOD_POINTS:
        strategyKey = 'FOOD_POINTS';
        break;
      case PaymentMethod.DEBIT_CARD:
      case PaymentMethod.CREDIT_CARD:
      case PaymentMethod.BANK_TRANSFER:
        // Default to Paystack for card/bank payments
        strategyKey = PaymentGateway.PAYSTACK;
        break;
      default:
        throw new Error(`Unsupported payment method: ${method}`);
    }

    const strategy = this.strategies.get(strategyKey);
    if (!strategy) {
      throw new Error(`Payment strategy for method ${method} not implemented yet.`);
    }
    return strategy;
  }

  /**
   * Get all available strategies
   */
  getAllStrategies(): IPaymentStrategy[] {
    return Array.from(this.strategies.values());
  }

  /**
   * Get strategy by name
   */
  getStrategyByName(name: string): IPaymentStrategy {
    const strategy = this.strategies.get(name.toUpperCase());
    if (!strategy) {
      throw new Error(`Unknown payment strategy: ${name}. Strategy not implemented yet.`);
    }
    return strategy;
  }

  /**
   * Register a payment strategy
   */
  registerStrategy(key: string, strategy: IPaymentStrategy): void {
    this.strategies.set(key, strategy);
  }

  /**
   * Check if a strategy is available
   */
  hasStrategy(key: string): boolean {
    return this.strategies.has(key);
  }
}
