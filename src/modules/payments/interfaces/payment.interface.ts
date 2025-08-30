import { PaymentType, PaymentMethod, PaymentStatus, PaymentGateway, TransactionType, RefundStatus } from '../constants/payment.constants';

export interface IPaymentGatewayConfig {
  baseUrl: string;
  publicKey: string;
  secretKey: string;
  webhookSecret: string;
  supportedMethods: string[];
  feeCalculation: (amount: number) => number;
}

export interface IPaymentRequest {
  orderId: string;
  userId: string;
  amount: number;
  currency: string;
  paymentMethod: PaymentMethod;
  paymentType: PaymentType;
  metadata?: Record<string, any>;
  callbackUrl?: string;
  redirectUrl?: string;
}

export interface IPaymentResponse {
  transactionId: string;
  reference: string;
  status: PaymentStatus;
  gateway: PaymentGateway;
  gatewayResponse?: any;
  authorizationUrl?: string;
  message: string;
  fees?: number;
  netAmount?: number;
}

export interface IPaymentVerification {
  transactionId: string;
  reference: string;
  status: PaymentStatus;
  amount: number;
  currency: string;
  paidAt?: Date;
  gateway: PaymentGateway;
  gatewayResponse: any;
  fees: number;
  netAmount: number;
}

export interface IRefundRequest {
  transactionId: string;
  amount?: number; // Partial refund if specified
  reason: string;
  requestedBy: string;
  metadata?: Record<string, any>;
}

export interface IRefundResponse {
  refundId: string;
  transactionId: string;
  amount: number;
  status: RefundStatus;
  gateway: PaymentGateway;
  gatewayResponse?: any;
  message: string;
}

export interface IWebhookEvent {
  event: string;
  data: any;
  gateway: PaymentGateway;
  signature: string;
  timestamp: Date;
}

export interface IPaymentStrategy {
  supports(paymentMethod: PaymentMethod): boolean;
  initializePayment(request: IPaymentRequest): Promise<IPaymentResponse>;
  verifyPayment(reference: string): Promise<IPaymentVerification>;
  processRefund(request: IRefundRequest): Promise<IRefundResponse>;
  calculateFees(amount: number): number;
}

export interface IReconciliationRecord {
  date: Date;
  gateway: PaymentGateway;
  totalTransactions: number;
  totalAmount: number;
  totalFees: number;
  successfulTransactions: number;
  failedTransactions: number;
  discrepancies: IReconciliationDiscrepancy[];
  status: 'PENDING' | 'COMPLETED' | 'FAILED';
}

export interface IReconciliationDiscrepancy {
  transactionId: string;
  localStatus: PaymentStatus;
  gatewayStatus: string;
  localAmount: number;
  gatewayAmount: number;
  description: string;
}

export interface IPaymentPlan {
  type: PaymentType;
  totalAmount: number;
  downPayment?: number;
  installments?: IInstallmentPlan[];
  dueDate?: Date;
  creditLimit?: number;
}

export interface IInstallmentPlan {
  installmentNumber: number;
  amount: number;
  dueDate: Date;
  status: 'PENDING' | 'PAID' | 'OVERDUE' | 'SKIPPED';
  paidAt?: Date;
  transactionId?: string;
}

export interface IPaymentAnalytics {
  period: string;
  totalTransactions: number;
  totalAmount: number;
  totalFees: number;
  successRate: number;
  averageTransactionValue: number;
  paymentMethodBreakdown: Record<PaymentMethod, number>;
  gatewayBreakdown: Record<PaymentGateway, number>;
  failureReasons: Record<string, number>;
}

export interface ITransactionFeeCalculator {
  calculatePaystackFee(amount: number): number;
  calculateFlutterwaveFee(amount: number): number;
  calculateInternalFee(amount: number): number;
  calculateTotalFee(amount: number, gateway: PaymentGateway): number;
}

export interface IPaymentRetryJob {
  transactionId: string;
  orderId: string;
  userId: string;
  amount: number;
  paymentMethod: PaymentMethod;
  retryCount: number;
  maxRetries: number;
  lastError?: string;
  nextRetryAt: Date;
}

export interface IWebhookValidator {
  validatePaystackSignature(payload: string, signature: string): boolean;
  validateFlutterwaveSignature(payload: string, signature: string): boolean;
  validateTimestamp(timestamp: number, tolerance: number): boolean;
}
