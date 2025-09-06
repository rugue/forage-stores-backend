// MongoDB initialization script for production
// This script runs when the MongoDB container starts for the first time in production

db = db.getSiblingDB('forage-stores');

// Create application user with limited permissions
db.createUser({
  user: 'forage-prod-app',
  pwd: process.env.MONGO_APP_PASSWORD || 'change-this-password-in-production',
  roles: [
    {
      role: 'readWrite',
      db: 'forage-stores'
    }
  ]
});

// Create backup user
db.createUser({
  user: 'forage-backup',
  pwd: process.env.MONGO_BACKUP_PASSWORD || 'change-this-backup-password',
  roles: [
    {
      role: 'read',
      db: 'forage-stores'
    }
  ]
});

// Create collections with optimized indexes for production
db.createCollection('users');
db.users.createIndex({ email: 1 }, { unique: true });
db.users.createIndex({ phone: 1 }, { unique: true });
db.users.createIndex({ role: 1 });
db.users.createIndex({ city: 1 });
db.users.createIndex({ isActive: 1 });
db.users.createIndex({ createdAt: 1 });
db.users.createIndex({ lastLogin: 1 });

db.createCollection('products');
db.products.createIndex({ name: 1 });
db.products.createIndex({ category: 1 });
db.products.createIndex({ city: 1 });
db.products.createIndex({ sellerId: 1 });
db.products.createIndex({ isActive: 1 });
db.products.createIndex({ price: 1 });
db.products.createIndex({ createdAt: 1 });
db.products.createIndex({ 
  name: 'text', 
  description: 'text' 
}, { 
  name: 'product_text_search' 
});

db.createCollection('orders');
db.orders.createIndex({ userId: 1 });
db.orders.createIndex({ sellerId: 1 });
db.orders.createIndex({ status: 1 });
db.orders.createIndex({ paymentStatus: 1 });
db.orders.createIndex({ createdAt: 1 });
db.orders.createIndex({ totalAmount: 1 });
db.orders.createIndex({ city: 1 });

db.createCollection('wallets');
db.wallets.createIndex({ userId: 1 }, { unique: true });
db.wallets.createIndex({ foodMoney: 1 });
db.wallets.createIndex({ foodPoints: 1 });

db.createCollection('referrals');
db.referrals.createIndex({ referrerId: 1 });
db.referrals.createIndex({ referredUserId: 1 });
db.referrals.createIndex({ status: 1 });
db.referrals.createIndex({ createdAt: 1 });

db.createCollection('auctions');
db.auctions.createIndex({ productId: 1 });
db.auctions.createIndex({ status: 1 });
db.auctions.createIndex({ endTime: 1 });
db.auctions.createIndex({ currentBid: 1 });

db.createCollection('deliveries');
db.deliveries.createIndex({ orderId: 1 });
db.deliveries.createIndex({ riderId: 1 });
db.deliveries.createIndex({ status: 1 });
db.deliveries.createIndex({ assignedAt: 1 });
db.deliveries.createIndex({ deliveredAt: 1 });

db.createCollection('notifications');
db.notifications.createIndex({ userId: 1 });
db.notifications.createIndex({ type: 1 });
db.notifications.createIndex({ isRead: 1 });
db.notifications.createIndex({ createdAt: 1 });

db.createCollection('support-tickets');
db.support-tickets.createIndex({ userId: 1 });
db.support-tickets.createIndex({ status: 1 });
db.support-tickets.createIndex({ priority: 1 });
db.support-tickets.createIndex({ createdAt: 1 });

db.createCollection('subscriptions');
db.subscriptions.createIndex({ userId: 1 });
db.subscriptions.createIndex({ status: 1 });
db.subscriptions.createIndex({ nextDelivery: 1 });

db.createCollection('profit-pools');
db.profitPools.createIndex({ month: 1 }, { unique: true });
db.profitPools.createIndex({ status: 1 });

// Create audit trail collection for production
db.createCollection('audit-trail');
db.auditTrail.createIndex({ userId: 1 });
db.auditTrail.createIndex({ action: 1 });
db.auditTrail.createIndex({ timestamp: 1 });
db.auditTrail.createIndex({ ipAddress: 1 });

print('✅ Production database initialization completed');
print('🔒 Security: Application and backup users created');
print('📊 Performance: Optimized indexes created');
print('🔍 Audit: Audit trail collection ready');
