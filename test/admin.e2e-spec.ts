import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { ConfigService } from '@nestjs/config';
import { Connection, Types } from 'mongoose';
import { getConnectionToken } from '@nestjs/mongoose';
import { UserRole } from '../src/modules/users/entities/user.entity';

describe('Admin Module (e2e)', () => {
  let app: INestApplication;
  let connection: Connection;
  let adminToken: string;
  let regularUserToken: string;
  let testUserId: string;
  let testWalletId: string;
  let testCategoryId: string;
  let testProductId: string;
  let testReferralId: string;
  let testWithdrawalId: string;
  let testProfitPoolId: string;

  const adminUser = {
    name: 'Test Admin',
    email: 'admin@test.com',
    password: 'AdminPass123!',
    role: UserRole.ADMIN
  };

  const regularUser = {
    name: 'Test User',
    email: 'user@test.com',
    password: 'UserPass123!',
    role: UserRole.USER
  };

  const growthAssociate = {
    name: 'Growth Associate',
    email: 'ga@test.com',
    password: 'GAPass123!',
    role: UserRole.GROWTH_ASSOCIATE
  };

  const testCategory = {
    name: 'Test Category',
    description: 'Test category for admin tests',
    image: 'https://example.com/category.jpg'
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    
    connection = app.get<Connection>(getConnectionToken());
    await app.init();

    // Clean up existing test data
    await cleanupTestData();
  });

  afterAll(async () => {
    await cleanupTestData();
    await connection.close();
    await app.close();
  });

  describe('Admin Authentication & Registration', () => {
    it('should register admin user successfully', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send(adminUser)
        .expect(201);

      expect(response.body).toHaveProperty('user');
      expect(response.body).toHaveProperty('accessToken');
      expect(response.body.user.role).toBe(UserRole.ADMIN);
      expect(response.body.user.email).toBe(adminUser.email);
      
      adminToken = response.body.accessToken;
    });

    it('should register regular user for testing', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send(regularUser)
        .expect(201);

      testUserId = response.body.user.id;
      regularUserToken = response.body.accessToken;
    });

    it('should register growth associate for testing', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send(growthAssociate)
        .expect(201);

      expect(response.body.user.role).toBe(UserRole.GROWTH_ASSOCIATE);
    });

    it('should login admin successfully', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: adminUser.email,
          password: adminUser.password
        })
        .expect(200);

      expect(response.body).toHaveProperty('accessToken');
      expect(response.body.user.role).toBe(UserRole.ADMIN);
    });

    it('should not allow non-admin to access admin endpoints', async () => {
      await request(app.getHttpServer())
        .get('/admin/users')
        .set('Authorization', `Bearer ${regularUserToken}`)
        .expect(403);
    });
  });

  describe('User Management', () => {
    it('should get all users (admin only)', async () => {
      const response = await request(app.getHttpServer())
        .get('/admin/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
    });

    it('should get user by ID', async () => {
      const response = await request(app.getHttpServer())
        .get(`/admin/users/${testUserId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('id', testUserId);
      expect(response.body).toHaveProperty('email', regularUser.email);
      expect(response.body).toHaveProperty('role', UserRole.USER);
    });

    it('should return 404 for non-existent user', async () => {
      const nonExistentId = '64f8b1234567890123456789';
      await request(app.getHttpServer())
        .get(`/admin/users/${nonExistentId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);
    });
  });

  describe('Wallet Management', () => {
    beforeAll(async () => {
      // Create a test wallet for the user (this would normally happen during user registration)
      const walletResponse = await request(app.getHttpServer())
        .get(`/admin/users/${testUserId}/wallet`)
        .set('Authorization', `Bearer ${adminToken}`);
      
      if (walletResponse.status === 200) {
        testWalletId = walletResponse.body.id;
      }
    });

    it('should get all wallets', async () => {
      const response = await request(app.getHttpServer())
        .get('/admin/wallets')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });

    it('should get user wallet', async () => {
      const response = await request(app.getHttpServer())
        .get(`/admin/users/${testUserId}/wallet`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('userId', testUserId);
      expect(response.body).toHaveProperty('foodMoney');
      expect(response.body).toHaveProperty('nibiaWallet');
    });

    it('should fund user wallet with valid admin password', async () => {
      const fundDto = {
        userId: testUserId,
        amount: 100.00,
        walletType: 'foodMoney',
        adminPassword: process.env.ADMIN_PASSWORD || 'admin123',
        reason: 'Test funding'
      };

      const response = await request(app.getHttpServer())
        .post('/admin/wallets/fund')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(fundDto)
        .expect(201);

      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('funded successfully');
    });

    it('should not fund wallet with invalid admin password', async () => {
      const fundDto = {
        userId: testUserId,
        amount: 100.00,
        walletType: 'foodMoney',
        adminPassword: 'wrongpassword',
        reason: 'Test funding'
      };

      await request(app.getHttpServer())
        .post('/admin/wallets/fund')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(fundDto)
        .expect(401);
    });

    it('should wipe user wallet with valid admin password', async () => {
      const wipeDto = {
        userId: testUserId,
        walletType: 'foodMoney',
        adminPassword: process.env.ADMIN_PASSWORD || 'admin123',
        reason: 'Test wiping'
      };

      const response = await request(app.getHttpServer())
        .post('/admin/wallets/wipe')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(wipeDto)
        .expect(201);

      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('wiped successfully');
    });
  });

  describe('Analytics Management', () => {
    it('should get orders analytics', async () => {
      const response = await request(app.getHttpServer())
        .get('/admin/analytics/orders')
        .set('Authorization', `Bearer ${adminToken}`)
        .query({
          startDate: '2024-01-01',
          endDate: '2024-12-31'
        })
        .expect(200);

      expect(response.body).toHaveProperty('totalOrders');
      expect(response.body).toHaveProperty('totalRevenue');
      expect(response.body).toHaveProperty('periodAnalysis');
    });

    it('should get subscription analytics', async () => {
      const response = await request(app.getHttpServer())
        .get('/admin/analytics/subscriptions')
        .set('Authorization', `Bearer ${adminToken}`)
        .query({
          period: 'monthly',
          city: 'Lagos'
        })
        .expect(200);

      expect(response.body).toHaveProperty('totalSubscriptions');
      expect(response.body).toHaveProperty('activeSubscriptions');
    });

    it('should get commission analytics', async () => {
      const response = await request(app.getHttpServer())
        .get('/admin/analytics/commissions')
        .set('Authorization', `Bearer ${adminToken}`)
        .query({
          userRole: 'GROWTH_ELITE',
          period: 'monthly'
        })
        .expect(200);

      expect(response.body).toHaveProperty('totalCommissions');
      expect(response.body).toHaveProperty('commissionBreakdown');
    });

    it('should filter analytics by date range', async () => {
      const startDate = '2024-01-01';
      const endDate = '2024-06-30';
      
      const response = await request(app.getHttpServer())
        .get('/admin/analytics/orders')
        .set('Authorization', `Bearer ${adminToken}`)
        .query({ startDate, endDate })
        .expect(200);

      expect(response.body.periodAnalysis).toHaveProperty('startDate');
      expect(response.body.periodAnalysis).toHaveProperty('endDate');
    });
  });

  describe('Category Management', () => {
    it('should create a new category', async () => {
      const response = await request(app.getHttpServer())
        .post('/admin/categories')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(testCategory)
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('name', testCategory.name);
      expect(response.body).toHaveProperty('description', testCategory.description);
      
      testCategoryId = response.body.id;
    });

    it('should get all categories', async () => {
      const response = await request(app.getHttpServer())
        .get('/admin/categories')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
    });

    it('should get category by ID', async () => {
      const response = await request(app.getHttpServer())
        .get(`/admin/categories/${testCategoryId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('id', testCategoryId);
      expect(response.body).toHaveProperty('name', testCategory.name);
    });

    it('should update a category', async () => {
      const updateData = {
        name: 'Updated Test Category',
        description: 'Updated description'
      };

      const response = await request(app.getHttpServer())
        .patch(`/admin/categories/${testCategoryId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body).toHaveProperty('name', updateData.name);
      expect(response.body).toHaveProperty('description', updateData.description);
    });

    it('should validate category creation with invalid data', async () => {
      const invalidCategory = {
        name: '', // Empty name should fail validation
        description: 'Test description'
      };

      await request(app.getHttpServer())
        .post('/admin/categories')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(invalidCategory)
        .expect(400);
    });
  });

  describe('Price History Management', () => {
    let testProductId: string;

    beforeAll(async () => {
      // Create a test product first (assuming products endpoint exists)
      // For now, we'll mock a product ID
      testProductId = '64f8b1234567890123456789';
    });

    it('should get product price history', async () => {
      const response = await request(app.getHttpServer())
        .get(`/admin/products/${testProductId}/price-history`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });

    it('should add price history and update product price', async () => {
      const priceHistoryDto = {
        productId: testProductId,
        newPrice: 1500.00,
        previousPrice: 1200.00,
        reason: 'Price increase due to inflation',
        effectiveDate: new Date().toISOString()
      };

      const response = await request(app.getHttpServer())
        .post('/admin/products/price-history')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(priceHistoryDto)
        .expect(201);

      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('Price history added');
    });
  });

  describe('Growth Users Management', () => {
    it('should get growth users by city', async () => {
      const response = await request(app.getHttpServer())
        .get('/admin/growth-users/Lagos')
        .set('Authorization', `Bearer ${adminToken}`)
        .query({
          role: 'GROWTH_ELITE',
          sortBy: 'totalSpending',
          order: 'desc'
        })
        .expect(200);

      expect(response.body).toHaveProperty('users');
      expect(response.body).toHaveProperty('totalCount');
      expect(Array.isArray(response.body.users)).toBe(true);
    });

    it('should get detailed stats for a growth user', async () => {
      // Using testUserId as growth user for testing
      const response = await request(app.getHttpServer())
        .get(`/admin/growth-users/${testUserId}/detailed-stats`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('user');
      expect(response.body).toHaveProperty('referralStats');
      expect(response.body).toHaveProperty('earningsBreakdown');
    });

    it('should filter growth users by role', async () => {
      const response = await request(app.getHttpServer())
        .get('/admin/growth-users/Lagos')
        .set('Authorization', `Bearer ${adminToken}`)
        .query({
          role: 'GROWTH_ASSOCIATE',
          limit: 10,
          page: 1
        })
        .expect(200);

      expect(response.body).toHaveProperty('users');
      expect(response.body).toHaveProperty('pagination');
    });
  });

  describe('Nibia Withdrawal Management', () => {
    it('should get pending withdrawals', async () => {
      const response = await request(app.getHttpServer())
        .get('/admin/withdrawals/pending')
        .set('Authorization', `Bearer ${adminToken}`)
        .query({
          city: 'Lagos',
          priority: 1
        })
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });

    it('should process withdrawal decision (approve)', async () => {
      // Mock withdrawal ID for testing
      const withdrawalId = '64f8b1234567890123456789';
      
      const decisionDto = {
        action: 'approve',
        adminPassword: process.env.ADMIN_PASSWORD || 'admin123',
        notes: 'Approved for testing'
      };

      const response = await request(app.getHttpServer())
        .patch(`/admin/withdrawals/${withdrawalId}/decision`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(decisionDto);

      // Expect either success or 404 for non-existent withdrawal
      expect([200, 404]).toContain(response.status);
    });

    it('should process withdrawal decision (reject)', async () => {
      const withdrawalId = '64f8b1234567890123456789';
      
      const decisionDto = {
        action: 'reject',
        adminPassword: process.env.ADMIN_PASSWORD || 'admin123',
        reason: 'Insufficient documentation',
        notes: 'Rejected for testing'
      };

      const response = await request(app.getHttpServer())
        .patch(`/admin/withdrawals/${withdrawalId}/decision`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(decisionDto);

      expect([200, 404]).toContain(response.status);
    });

    it('should bulk process withdrawals', async () => {
      const bulkDto = {
        withdrawalIds: ['64f8b1234567890123456789', '64f8b1234567890123456790'],
        action: 'approve',
        adminPassword: process.env.ADMIN_PASSWORD || 'admin123',
        notes: 'Bulk approval for testing'
      };

      const response = await request(app.getHttpServer())
        .post('/admin/withdrawals/bulk-process')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(bulkDto);

      // Expect either success or validation error
      expect([200, 400, 404]).toContain(response.status);
    });

    it('should not process withdrawal with invalid admin password', async () => {
      const withdrawalId = '64f8b1234567890123456789';
      
      const decisionDto = {
        action: 'approve',
        adminPassword: 'wrongpassword',
        notes: 'Should fail'
      };

      await request(app.getHttpServer())
        .patch(`/admin/withdrawals/${withdrawalId}/decision`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(decisionDto)
        .expect(400);
    });
  });

  describe('Referral Commission Override', () => {
    it('should override referral commission', async () => {
      const referralId = '64f8b1234567890123456789';
      
      const overrideDto = {
        referralId,
        newCommissionAmount: 150.00,
        reason: 'Special promotion adjustment',
        adminPassword: process.env.ADMIN_PASSWORD || 'admin123'
      };

      const response = await request(app.getHttpServer())
        .post('/admin/commissions/override')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(overrideDto);

      // Expect either success or 404 for non-existent referral
      expect([200, 404]).toContain(response.status);
    });

    it('should get commission override history', async () => {
      const response = await request(app.getHttpServer())
        .get('/admin/commissions/override-history')
        .set('Authorization', `Bearer ${adminToken}`)
        .query({
          startDate: '2024-01-01',
          endDate: '2024-12-31',
          adminId: 'all'
        })
        .expect(200);

      expect(response.body).toHaveProperty('overrides');
      expect(response.body).toHaveProperty('totalCount');
      expect(Array.isArray(response.body.overrides)).toBe(true);
    });

    it('should get referral commission history', async () => {
      const referralId = '64f8b1234567890123456789';
      
      const response = await request(app.getHttpServer())
        .get(`/admin/commissions/${referralId}/history`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('referral');
      expect(response.body).toHaveProperty('commissionHistory');
      expect(Array.isArray(response.body.commissionHistory)).toBe(true);
    });

    it('should validate override with invalid admin password', async () => {
      const overrideDto = {
        referralId: '64f8b1234567890123456789',
        newCommissionAmount: 150.00,
        reason: 'Test override',
        adminPassword: 'wrongpassword'
      };

      await request(app.getHttpServer())
        .post('/admin/commissions/override')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(overrideDto)
        .expect(400);
    });
  });

  describe('Profit Pool Management', () => {
    it('should get all profit pools', async () => {
      const response = await request(app.getHttpServer())
        .get('/admin/profit-pools')
        .set('Authorization', `Bearer ${adminToken}`)
        .query({
          city: 'Lagos',
          status: 'active'
        })
        .expect(200);

      expect(response.body).toHaveProperty('pools');
      expect(response.body).toHaveProperty('summary');
      expect(Array.isArray(response.body.pools)).toBe(true);
    });

    it('should get profit pool details', async () => {
      const poolId = '64f8b1234567890123456789';
      
      const response = await request(app.getHttpServer())
        .get(`/admin/profit-pools/${poolId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('pool');
      expect(response.body).toHaveProperty('participants');
      expect(response.body).toHaveProperty('distributionHistory');
    });

    it('should adjust profit pool distribution', async () => {
      const poolId = '64f8b1234567890123456789';
      
      const adjustmentDto = {
        adjustmentType: 'add_bonus',
        amount: 1000.00,
        reason: 'Performance bonus',
        targetUsers: [testUserId],
        adminPassword: process.env.ADMIN_PASSWORD || 'admin123'
      };

      const response = await request(app.getHttpServer())
        .post(`/admin/profit-pools/${poolId}/adjust`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(adjustmentDto);

      expect([200, 404]).toContain(response.status);
    });

    it('should generate monthly profit pool report', async () => {
      const response = await request(app.getHttpServer())
        .get('/admin/profit-pools/reports/monthly')
        .set('Authorization', `Bearer ${adminToken}`)
        .query({
          year: 2024,
          month: 8,
          city: 'Lagos'
        })
        .expect(200);

      expect(response.body).toHaveProperty('reportSummary');
      expect(response.body).toHaveProperty('poolsData');
      expect(response.body).toHaveProperty('totalDistributed');
    });

    it('should force redistribute profit pool', async () => {
      const poolId = '64f8b1234567890123456789';
      
      const response = await request(app.getHttpServer())
        .post(`/admin/profit-pools/${poolId}/redistribute`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          adminPassword: process.env.ADMIN_PASSWORD || 'admin123'
        });

      expect([200, 404]).toContain(response.status);
    });

    it('should not adjust pool with invalid admin password', async () => {
      const poolId = '64f8b1234567890123456789';
      
      const adjustmentDto = {
        adjustmentType: 'add_bonus',
        amount: 1000.00,
        reason: 'Should fail',
        targetUsers: [testUserId],
        adminPassword: 'wrongpassword'
      };

      await request(app.getHttpServer())
        .post(`/admin/profit-pools/${poolId}/adjust`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(adjustmentDto)
        .expect(400);
    });
  });

  describe('Security & Validation Tests', () => {
    it('should require authentication for all admin endpoints', async () => {
      const endpoints = [
        '/admin/users',
        '/admin/wallets',
        '/admin/analytics/orders',
        '/admin/categories',
        '/admin/profit-pools'
      ];

      for (const endpoint of endpoints) {
        await request(app.getHttpServer())
          .get(endpoint)
          .expect(401);
      }
    });

    it('should require admin role for all admin endpoints', async () => {
      const endpoints = [
        '/admin/users',
        '/admin/wallets',
        '/admin/analytics/orders',
        '/admin/categories'
      ];

      for (const endpoint of endpoints) {
        await request(app.getHttpServer())
          .get(endpoint)
          .set('Authorization', `Bearer ${regularUserToken}`)
          .expect(403);
      }
    });

    it('should validate request bodies for POST endpoints', async () => {
      // Test category creation with invalid data
      await request(app.getHttpServer())
        .post('/admin/categories')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({}) // Empty body
        .expect(400);

      // Test wallet funding with invalid data
      await request(app.getHttpServer())
        .post('/admin/wallets/fund')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          userId: 'invalid-id',
          amount: -100, // Negative amount
          walletType: 'invalid-type'
        })
        .expect(400);
    });

    it('should handle malformed ObjectIds gracefully', async () => {
      const invalidId = 'not-an-object-id';
      
      await request(app.getHttpServer())
        .get(`/admin/users/${invalidId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(400);
    });

    it('should require admin password for sensitive operations', async () => {
      const sensitiveEndpoints = [
        {
          method: 'post',
          path: '/admin/wallets/fund',
          body: {
            userId: testUserId,
            amount: 100,
            walletType: 'foodMoney',
            reason: 'Test'
          }
        },
        {
          method: 'post',
          path: '/admin/wallets/wipe',
          body: {
            userId: testUserId,
            walletType: 'foodMoney',
            reason: 'Test'
          }
        }
      ];

      for (const endpoint of sensitiveEndpoints) {
        await request(app.getHttpServer())
          [endpoint.method](endpoint.path)
          .set('Authorization', `Bearer ${adminToken}`)
          .send(endpoint.body) // Missing adminPassword
          .expect(400);
      }
    });
  });

  describe('Edge Cases & Error Handling', () => {
    it('should handle concurrent wallet operations', async () => {
      const fundOperations = Array(5).fill(0).map((_, index) => 
        request(app.getHttpServer())
          .post('/admin/wallets/fund')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            userId: testUserId,
            amount: 10,
            walletType: 'foodMoney',
            adminPassword: process.env.ADMIN_PASSWORD || 'admin123',
            reason: `Concurrent test ${index + 1}`
          })
      );

      const results = await Promise.allSettled(fundOperations);
      
      // At least some operations should succeed
      const successful = results.filter(result => 
        result.status === 'fulfilled' && result.value.status === 201
      );
      
      expect(successful.length).toBeGreaterThan(0);
    });

    it('should handle large dataset pagination', async () => {
      const response = await request(app.getHttpServer())
        .get('/admin/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .query({
          page: 1,
          limit: 1000 // Large limit
        })
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });

    it('should handle invalid date ranges in analytics', async () => {
      await request(app.getHttpServer())
        .get('/admin/analytics/orders')
        .set('Authorization', `Bearer ${adminToken}`)
        .query({
          startDate: '2024-12-31',
          endDate: '2024-01-01' // End before start
        })
        .expect(400);
    });

    it('should handle database connection errors gracefully', async () => {
      // This test would require mocking the database connection
      // For now, we'll test with invalid data that might cause DB errors
      
      const response = await request(app.getHttpServer())
        .get('/admin/users/000000000000000000000000') // Valid ObjectId format but non-existent
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);

      expect(response.body).toHaveProperty('message');
    });
  });

  describe('Performance Tests', () => {
    it('should handle multiple simultaneous requests', async () => {
      const requests = Array(10).fill(0).map(() =>
        request(app.getHttpServer())
          .get('/admin/users')
          .set('Authorization', `Bearer ${adminToken}`)
      );

      const startTime = Date.now();
      const results = await Promise.all(requests);
      const endTime = Date.now();

      // All requests should succeed
      results.forEach(result => expect(result.status).toBe(200));
      
      // Should complete within reasonable time (adjust threshold as needed)
      expect(endTime - startTime).toBeLessThan(5000); // 5 seconds
    });

    it('should handle large response payloads', async () => {
      const response = await request(app.getHttpServer())
        .get('/admin/analytics/orders')
        .set('Authorization', `Bearer ${adminToken}`)
        .query({
          startDate: '2020-01-01',
          endDate: '2024-12-31'
        })
        .expect(200);

      expect(response.body).toBeDefined();
      // Response should be received within reasonable time
    });
  });

  // Cleanup function to remove test data
  async function cleanupTestData() {
    try {
      if (connection && connection.readyState === 1) {
        // Clean up test users
        await connection.collection('users').deleteMany({
          email: { $in: [adminUser.email, regularUser.email, growthAssociate.email] }
        });

        // Clean up test categories
        if (testCategoryId) {
          await connection.collection('categories').deleteOne({ _id: new Types.ObjectId(testCategoryId) });
        }

        // Clean up test wallets
        await connection.collection('wallets').deleteMany({
          userId: { $in: [testUserId] }
        });

        // Clean up other test data as needed
        await connection.collection('pricehistories').deleteMany({
          productId: testProductId
        });
      }
    } catch (error) {
      console.log('Cleanup error (non-critical):', error.message);
    }
  }
});
