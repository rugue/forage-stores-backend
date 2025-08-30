import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { 
  IPaymentStrategy, 
  IPaymentRequest, 
  IPaymentResponse, 
  IPaymentVerification,
  IRefundRequest,
  IRefundResponse
} from '../interfaces/payment.interface';
import { PaymentMethod, PaymentStatus, PaymentGateway, RefundStatus } from '../constants/payment.constants';

@Injectable()
export class PaystackStrategy implements IPaymentStrategy {
  private readonly logger = new Logger(PaystackStrategy.name);
  private readonly baseUrl: string;
  private readonly secretKey: string;
  private readonly publicKey: string;

  constructor(private readonly configService: ConfigService) {
    this.baseUrl = this.configService.get<string>('PAYSTACK_BASE_URL', 'https://api.paystack.co');
    this.secretKey = this.configService.get<string>('PAYSTACK_SECRET_KEY', '');
    this.publicKey = this.configService.get<string>('PAYSTACK_PUBLIC_KEY', '');
  }

  supports(paymentMethod: PaymentMethod): boolean {
    const supportedMethods = [
      PaymentMethod.DEBIT_CARD,
      PaymentMethod.CREDIT_CARD,
      PaymentMethod.BANK_TRANSFER,
    ];
    return supportedMethods.includes(paymentMethod);
  }

  async initializePayment(request: IPaymentRequest): Promise<IPaymentResponse> {
    try {
      this.logger.log(`Initializing Paystack payment for order ${request.orderId}`);

      // For development, return mock response
      if (!this.secretKey) {
        this.logger.warn('Paystack secret key not configured, returning mock response');
        return this.getMockInitializationResponse(request);
      }

      // TODO: Implement actual Paystack API call
      // const response = await axios.post(
      //   `${this.baseUrl}/transaction/initialize`,
      //   {
      //     email: request.customerEmail,
      //     amount: request.amount,
      //     reference: `paystack_${request.orderId}_${Date.now()}`,
      //     currency: request.currency,
      //     metadata: request.metadata,
      //   },
      //   {
      //     headers: {
      //       Authorization: `Bearer ${this.secretKey}`,
      //       'Content-Type': 'application/json',
      //     },
      //   }
      // );

      // For now, return mock response
      return this.getMockInitializationResponse(request);
    } catch (error) {
      this.logger.error(`Paystack payment initialization failed: ${error.message}`, error.stack);
      throw new Error(`Payment initialization failed: ${error.message}`);
    }
  }

  async verifyPayment(reference: string): Promise<IPaymentVerification> {
    try {
      this.logger.log(`Verifying Paystack payment for reference ${reference}`);

      // For development, return mock response
      if (!this.secretKey) {
        this.logger.warn('Paystack secret key not configured, returning mock verification');
        return this.getMockVerificationResponse(reference);
      }

      // TODO: Implement actual Paystack verification
      // const response = await axios.get(
      //   `${this.baseUrl}/transaction/verify/${reference}`,
      //   {
      //     headers: {
      //       Authorization: `Bearer ${this.secretKey}`,
      //     },
      //   }
      // );

      // For now, return mock response
      return this.getMockVerificationResponse(reference);
    } catch (error) {
      this.logger.error(`Paystack payment verification failed: ${error.message}`, error.stack);
      throw new Error(`Payment verification failed: ${error.message}`);
    }
  }

  async processRefund(request: IRefundRequest): Promise<IRefundResponse> {
    try {
      this.logger.log(`Processing Paystack refund for transaction ${request.transactionId}`);

      // For development, return mock response
      if (!this.secretKey) {
        this.logger.warn('Paystack secret key not configured, returning mock refund');
        return this.getMockRefundResponse(request);
      }

      // TODO: Implement actual Paystack refund
      // const response = await axios.post(
      //   `${this.baseUrl}/refund`,
      //   {
      //     transaction: request.transactionId,
      //     amount: request.amount,
      //     currency: request.currency,
      //     reason: request.reason,
      //   },
      //   {
      //     headers: {
      //       Authorization: `Bearer ${this.secretKey}`,
      //       'Content-Type': 'application/json',
      //     },
      //   }
      // );

      // For now, return mock response
      return this.getMockRefundResponse(request);
    } catch (error) {
      this.logger.error(`Paystack refund failed: ${error.message}`, error.stack);
      throw new Error(`Refund processing failed: ${error.message}`);
    }
  }

  calculateFees(amount: number): number {
    // Paystack fee calculation
    // 1.5% + ₦100 (capped at ₦2,000)
    const feePercentage = 1.5;
    const baseFee = 100; // 1 Naira in kobo
    const maxFee = 2000; // 20 Naira in kobo
    
    const calculatedFee = Math.ceil((amount * feePercentage) / 100) + baseFee;
    return Math.min(calculatedFee, maxFee);
  }

  /**
   * Mock responses for development
   */
  private getMockInitializationResponse(request: IPaymentRequest): IPaymentResponse {
    const reference = `paystack_${request.orderId}_${Date.now()}`;
    
    return {
      transactionId: `paystack_txn_${Date.now()}`,
      reference,
      status: PaymentStatus.PENDING,
      gateway: PaymentGateway.PAYSTACK,
      authorizationUrl: `https://checkout.paystack.com/${reference}`,
      message: 'Payment initialization successful',
      fees: this.calculateFees(request.amount),
      netAmount: request.amount - this.calculateFees(request.amount),
    };
  }

  private getMockVerificationResponse(reference: string): IPaymentVerification {
    return {
      transactionId: `paystack_${Date.now()}`,
      reference,
      status: PaymentStatus.COMPLETED,
      amount: 50000, // Mock amount
      currency: 'NGN',
      paidAt: new Date(),
      gateway: PaymentGateway.PAYSTACK,
      gatewayResponse: {
        status: 'success',
        message: 'Payment verified successfully',
        gateway_response: 'Successful',
      },
      fees: this.calculateFees(50000),
      netAmount: 50000 - this.calculateFees(50000),
    };
  }

  private getMockRefundResponse(request: IRefundRequest): IRefundResponse {
    return {
      refundId: `ref_${Date.now()}`,
      transactionId: request.transactionId,
      amount: request.amount,
      status: RefundStatus.PROCESSING,
      gateway: PaymentGateway.PAYSTACK,
      message: 'Refund initiated successfully',
      gatewayResponse: {
        estimatedProcessingTime: '3-5 business days',
      },
    };
  }
}
