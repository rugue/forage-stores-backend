// MongoDB initialization script for development
// This script runs when the MongoDB container starts for the first time

db = db.getSiblingDB('forage-stores');

// Create application user
db.createUser({
  user: 'forage-app',
  pwd: 'forage-app-password',
  roles: [
    {
      role: 'readWrite',
      db: 'forage-stores'
    }
  ]
});

// Create collections with basic indexes
db.createCollection('users');
db.users.createIndex({ email: 1 }, { unique: true });
db.users.createIndex({ phone: 1 }, { unique: true });
db.users.createIndex({ createdAt: 1 });

db.createCollection('products');
db.products.createIndex({ name: 1 });
db.products.createIndex({ category: 1 });
db.products.createIndex({ city: 1 });
db.products.createIndex({ sellerId: 1 });
db.products.createIndex({ isActive: 1 });

db.createCollection('orders');
db.orders.createIndex({ userId: 1 });
db.orders.createIndex({ sellerId: 1 });
db.orders.createIndex({ status: 1 });
db.orders.createIndex({ createdAt: 1 });

db.createCollection('wallets');
db.wallets.createIndex({ userId: 1 }, { unique: true });

db.createCollection('referrals');
db.referrals.createIndex({ referrerId: 1 });
db.referrals.createIndex({ referredUserId: 1 });

db.createCollection('auctions');
db.auctions.createIndex({ productId: 1 });
db.auctions.createIndex({ status: 1 });
db.auctions.createIndex({ endTime: 1 });

db.createCollection('deliveries');
db.deliveries.createIndex({ orderId: 1 });
db.deliveries.createIndex({ riderId: 1 });
db.deliveries.createIndex({ status: 1 });

db.createCollection('notifications');
db.notifications.createIndex({ userId: 1 });
db.notifications.createIndex({ type: 1 });
db.notifications.createIndex({ createdAt: 1 });

db.createCollection('support-tickets');
db.support-tickets.createIndex({ userId: 1 });
db.support-tickets.createIndex({ status: 1 });

db.createCollection('subscriptions');
db.subscriptions.createIndex({ userId: 1 });
db.subscriptions.createIndex({ status: 1 });

print('✅ Database initialization completed for development environment');
