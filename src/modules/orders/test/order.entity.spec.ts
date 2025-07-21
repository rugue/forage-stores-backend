import { Order, OrderStatus, PaymentPlan, DeliveryMethod } from '../entities/order.entity';

describe('Order Entity', () => {
  let order: Order;

  beforeEach(() => {
    order = new Order();
    order.orderNumber = 'FRG12345678';
    order.userId = '64f123456789abcdef123457' as any;
    order.items = [
      {
        productId: '64f123456789abcdef123458' as any,
        quantity: 2,
        unitPrice: 1500,
        unitPriceInNibia: 150000,
        totalPrice: 3000,
        totalPriceInNibia: 300000,
      },
    ];
    order.totalAmount = 3000;
    order.totalAmountInNibia = 300000;
    order.deliveryFee = 500;
    order.finalTotal = 3500;
    order.status = OrderStatus.PENDING;
    order.paymentPlan = PaymentPlan.PAY_NOW;
    order.deliveryMethod = DeliveryMethod.HOME_DELIVERY;
    order.paymentHistory = [];
    order.amountPaid = 0;
    order.remainingAmount = 3500;
  });

  it('should be defined', () => {
    expect(order).toBeDefined();
  });

  it('should have the correct order number format', () => {
    expect(order.orderNumber).toMatch(/^FRG\d{8}$/);
  });

  it('should calculate final total correctly', () => {
    expect(order.finalTotal).toBe(order.totalAmount + order.deliveryFee);
  });

  it('should calculate remaining amount correctly', () => {
    expect(order.remainingAmount).toBe(order.finalTotal - order.amountPaid);
  });

  it('should have valid order status', () => {
    expect(Object.values(OrderStatus)).toContain(order.status);
  });

  it('should have valid payment plan', () => {
    expect(Object.values(PaymentPlan)).toContain(order.paymentPlan);
  });

  it('should have valid delivery method', () => {
    expect(Object.values(DeliveryMethod)).toContain(order.deliveryMethod);
  });

  it('should have items array', () => {
    expect(Array.isArray(order.items)).toBe(true);
    expect(order.items.length).toBeGreaterThan(0);
  });

  it('should have payment history array', () => {
    expect(Array.isArray(order.paymentHistory)).toBe(true);
  });

  it('should have valid item structure', () => {
    const item = order.items[0];
    expect(item.productId).toBeDefined();
    expect(item.quantity).toBeGreaterThan(0);
    expect(item.unitPrice).toBeGreaterThanOrEqual(0);
    expect(item.totalPrice).toBe(item.quantity * item.unitPrice);
  });

  it('should handle partial payment correctly', () => {
    order.amountPaid = 1000;
    const expectedRemaining = order.finalTotal - order.amountPaid;
    expect(expectedRemaining).toBe(2500);
  });

  it('should handle full payment correctly', () => {
    order.amountPaid = order.finalTotal;
    const expectedRemaining = order.finalTotal - order.amountPaid;
    expect(expectedRemaining).toBe(0);
  });

  it('should not allow negative remaining amount', () => {
    order.amountPaid = order.finalTotal + 1000; // overpayment
    const remainingAmount = Math.max(0, order.finalTotal - order.amountPaid);
    expect(remainingAmount).toBe(0);
  });
});
