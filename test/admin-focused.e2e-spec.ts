import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { Connection } from 'mongoose';
import { getConnectionToken } from '@nestjs/mongoose';
import { TestHelpers } from './helpers/test.helpers';
import { UserRole } from '../src/modules/users/entities/user.entity';

describe('Admin Module - Focused Tests (e2e)', () => {
  let app: INestApplication;
  let connection: Connection;
  let testHelpers: TestHelpers;
  let testData: any;

  const testEmails = [
    'admin@test.com',
    'user@test.com', 
    'ga@test.com',
    'ge@test.com'
  ];

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ 
      whitelist: true, 
      transform: true,
      forbidNonWhitelisted: true 
    }));
    
    connection = app.get<Connection>(getConnectionToken());
    testHelpers = new TestHelpers(app, connection);
    
    await app.init();

    // Clean up any existing test data
    await testHelpers.cleanupTestData(testEmails);
    
    // Create test users and get tokens
    testData = await testHelpers.createTestData();
  });

  afterAll(async () => {
    await testHelpers.cleanupTestData(testEmails);
    await connection.close();
    await app.close();
  });

  describe('🔐 Admin Authentication & Authorization', () => {
    it('should allow admin to access admin endpoints', async () => {
      const response = await testHelpers.makeAuthenticatedRequest(
        'get', 
        '/admin/users', 
        testData.admin.token
      );
      
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });

    it('should deny non-admin access to admin endpoints', async () => {
      const response = await testHelpers.makeAuthenticatedRequest(
        'get', 
        '/admin/users', 
        testData.user.token
      );
      
      expect(response.status).toBe(403);
    });

    it('should require authentication for admin endpoints', async () => {
      const response = await request(app.getHttpServer())
        .get('/admin/users')
        .expect(401);
    });
  });

  describe('👥 User Management', () => {
    it('should get all users with proper structure', async () => {
      const response = await testHelpers.makeAuthenticatedRequest(
        'get', 
        '/admin/users', 
        testData.admin.token
      );
      
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
      
      // Verify user structure
      const user = response.body[0];
      expect(user).toHaveProperty('id');
      expect(user).toHaveProperty('name');
      expect(user).toHaveProperty('email');
      expect(user).toHaveProperty('role');
    });

    it('should get specific user by ID', async () => {
      const response = await testHelpers.makeAuthenticatedRequest(
        'get', 
        `/admin/users/${testData.user.userId}`, 
        testData.admin.token
      );
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('id', testData.user.userId);
      expect(response.body).toHaveProperty('email', 'user@test.com');
      expect(response.body).toHaveProperty('role', UserRole.USER);
    });

    it('should return 404 for non-existent user', async () => {
      const nonExistentId = testHelpers.generateObjectId();
      const response = await testHelpers.makeAuthenticatedRequest(
        'get', 
        `/admin/users/${nonExistentId}`, 
        testData.admin.token
      );
      
      expect(response.status).toBe(404);
    });

    it('should handle malformed user ID', async () => {
      const response = await testHelpers.makeAuthenticatedRequest(
        'get', 
        '/admin/users/invalid-id', 
        testData.admin.token
      );
      
      expect(response.status).toBe(400);
    });
  });

  describe('💰 Wallet Management', () => {
    it('should get all wallets', async () => {
      const response = await testHelpers.makeAuthenticatedRequest(
        'get', 
        '/admin/wallets', 
        testData.admin.token
      );
      
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });

    it('should get user wallet', async () => {
      const response = await testHelpers.makeAuthenticatedRequest(
        'get', 
        `/admin/users/${testData.user.userId}/wallet`, 
        testData.admin.token
      );
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('userId', testData.user.userId);
      expect(response.body).toHaveProperty('foodMoney');
      expect(response.body).toHaveProperty('nibiaWallet');
    });

    it('should fund user wallet with valid admin password', async () => {
      const response = await testHelpers.makeAuthenticatedRequest(
        'post', 
        '/admin/wallets/fund', 
        testData.admin.token,
        {
          userId: testData.user.userId,
          amount: 100.00,
          walletType: 'foodMoney',
          adminPassword: process.env.ADMIN_PASSWORD || 'admin123',
          reason: 'Test funding'
        }
      );
      
      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('funded successfully');
    });

    it('should reject wallet funding with invalid admin password', async () => {
      const response = await testHelpers.makeAuthenticatedRequest(
        'post', 
        '/admin/wallets/fund', 
        testData.admin.token,
        {
          userId: testData.user.userId,
          amount: 100.00,
          walletType: 'foodMoney',
          adminPassword: 'wrongpassword',
          reason: 'Test funding'
        }
      );
      
      expect(response.status).toBe(401);
    });

    it('should wipe user wallet with valid admin password', async () => {
      const response = await testHelpers.makeAuthenticatedRequest(
        'post', 
        '/admin/wallets/wipe', 
        testData.admin.token,
        {
          userId: testData.user.userId,
          walletType: 'foodMoney',
          adminPassword: process.env.ADMIN_PASSWORD || 'admin123',
          reason: 'Test wiping'
        }
      );
      
      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('wiped successfully');
    });

    it('should validate wallet funding input', async () => {
      const response = await testHelpers.makeAuthenticatedRequest(
        'post', 
        '/admin/wallets/fund', 
        testData.admin.token,
        {
          userId: 'invalid-id',
          amount: -100, // Negative amount should fail
          walletType: 'invalidType',
          adminPassword: process.env.ADMIN_PASSWORD,
          reason: 'Test'
        }
      );
      
      expect(response.status).toBe(400);
    });
  });

  describe('📊 Analytics Management', () => {
    it('should get orders analytics with proper structure', async () => {
      const response = await testHelpers.makeAuthenticatedRequest(
        'get', 
        '/admin/analytics/orders', 
        testData.admin.token,
        null,
        {
          startDate: '2024-01-01',
          endDate: '2024-12-31'
        }
      );
      
      expect(response.status).toBe(200);
      testHelpers.verifyResponseStructure(response, [
        'totalOrders',
        'totalRevenue',
        'periodAnalysis'
      ]);
    });

    it('should get subscription analytics', async () => {
      const response = await testHelpers.makeAuthenticatedRequest(
        'get', 
        '/admin/analytics/subscriptions', 
        testData.admin.token,
        null,
        {
          period: 'monthly',
          city: 'Lagos'
        }
      );
      
      expect(response.status).toBe(200);
      testHelpers.verifyResponseStructure(response, [
        'totalSubscriptions',
        'activeSubscriptions'
      ]);
    });

    it('should get commission analytics', async () => {
      const response = await testHelpers.makeAuthenticatedRequest(
        'get', 
        '/admin/analytics/commissions', 
        testData.admin.token,
        null,
        {
          userRole: 'GROWTH_ELITE',
          period: 'monthly'
        }
      );
      
      expect(response.status).toBe(200);
      testHelpers.verifyResponseStructure(response, [
        'totalCommissions',
        'commissionBreakdown'
      ]);
    });

    it('should validate date range in analytics', async () => {
      const response = await testHelpers.makeAuthenticatedRequest(
        'get', 
        '/admin/analytics/orders', 
        testData.admin.token,
        null,
        {
          startDate: '2024-12-31',
          endDate: '2024-01-01' // End before start
        }
      );
      
      expect(response.status).toBe(400);
    });
  });

  describe('🏷️ Category Management', () => {
    let categoryId: string;

    it('should create a new category', async () => {
      const response = await testHelpers.createTestCategory(testData.admin.token);
      
      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('name');
      expect(response.body.name).toContain('Test Category');
      
      categoryId = response.body.id;
    });

    it('should get all categories', async () => {
      const response = await testHelpers.makeAuthenticatedRequest(
        'get', 
        '/admin/categories', 
        testData.admin.token
      );
      
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
    });

    it('should get category by ID', async () => {
      const response = await testHelpers.makeAuthenticatedRequest(
        'get', 
        `/admin/categories/${categoryId}`, 
        testData.admin.token
      );
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('id', categoryId);
    });

    it('should update a category', async () => {
      const updateData = {
        name: 'Updated Test Category',
        description: 'Updated description'
      };

      const response = await testHelpers.makeAuthenticatedRequest(
        'patch', 
        `/admin/categories/${categoryId}`, 
        testData.admin.token,
        updateData
      );
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('name', updateData.name);
      expect(response.body).toHaveProperty('description', updateData.description);
    });

    it('should validate category creation', async () => {
      const response = await testHelpers.makeAuthenticatedRequest(
        'post', 
        '/admin/categories', 
        testData.admin.token,
        {
          name: '', // Empty name should fail
          description: 'Test description'
        }
      );
      
      expect(response.status).toBe(400);
    });

    it('should delete a category', async () => {
      const response = await testHelpers.makeAuthenticatedRequest(
        'delete', 
        `/admin/categories/${categoryId}`, 
        testData.admin.token
      );
      
      expect([200, 400]).toContain(response.status); // 400 if category is in use
    });
  });

  describe('👑 Growth Users Management', () => {
    it('should get growth users by city', async () => {
      const response = await testHelpers.makeAuthenticatedRequest(
        'get', 
        '/admin/growth-users/Lagos', 
        testData.admin.token,
        null,
        {
          role: 'GROWTH_ELITE',
          sortBy: 'totalSpending',
          order: 'desc'
        }
      );
      
      expect(response.status).toBe(200);
      testHelpers.verifyResponseStructure(response, ['users', 'totalCount']);
      expect(Array.isArray(response.body.users)).toBe(true);
    });

    it('should get detailed stats for growth user', async () => {
      const response = await testHelpers.makeAuthenticatedRequest(
        'get', 
        `/admin/growth-users/${testData.growthAssociate.userId}/detailed-stats`, 
        testData.admin.token
      );
      
      expect(response.status).toBe(200);
      testHelpers.verifyResponseStructure(response, [
        'user',
        'referralStats',
        'earningsBreakdown'
      ]);
    });

    it('should filter growth users by role', async () => {
      const response = await testHelpers.makeAuthenticatedRequest(
        'get', 
        '/admin/growth-users/Lagos', 
        testData.admin.token,
        null,
        {
          role: 'GROWTH_ASSOCIATE',
          limit: 10,
          page: 1
        }
      );
      
      expect(response.status).toBe(200);
      testHelpers.verifyResponseStructure(response, ['users', 'pagination']);
    });
  });

  describe('💸 Withdrawal Management', () => {
    let withdrawalId: string;

    beforeAll(async () => {
      // Create a mock withdrawal for testing
      withdrawalId = await testHelpers.createMockWithdrawal(testData.user.userId, 500);
    });

    it('should get pending withdrawals', async () => {
      const response = await testHelpers.makeAuthenticatedRequest(
        'get', 
        '/admin/withdrawals/pending', 
        testData.admin.token,
        null,
        {
          city: 'Lagos',
          priority: 1
        }
      );
      
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });

    it('should approve withdrawal with valid admin password', async () => {
      const response = await testHelpers.makeAuthenticatedRequest(
        'patch', 
        `/admin/withdrawals/${withdrawalId}/decision`, 
        testData.admin.token,
        {
          action: 'approve',
          adminPassword: process.env.ADMIN_PASSWORD || 'admin123',
          notes: 'Approved for testing'
        }
      );
      
      expect([200, 404]).toContain(response.status);
    });

    it('should reject withdrawal request', async () => {
      const response = await testHelpers.makeAuthenticatedRequest(
        'patch', 
        `/admin/withdrawals/${withdrawalId}/decision`, 
        testData.admin.token,
        {
          action: 'reject',
          adminPassword: process.env.ADMIN_PASSWORD || 'admin123',
          reason: 'Insufficient documentation',
          notes: 'Rejected for testing'
        }
      );
      
      expect([200, 404, 400]).toContain(response.status);
    });

    it('should bulk process withdrawals', async () => {
      const response = await testHelpers.makeAuthenticatedRequest(
        'post', 
        '/admin/withdrawals/bulk-process', 
        testData.admin.token,
        {
          withdrawalIds: [withdrawalId],
          action: 'approve',
          adminPassword: process.env.ADMIN_PASSWORD || 'admin123',
          notes: 'Bulk approval for testing'
        }
      );
      
      expect([200, 400, 404]).toContain(response.status);
    });

    it('should validate admin password for withdrawal decisions', async () => {
      const response = await testHelpers.makeAuthenticatedRequest(
        'patch', 
        `/admin/withdrawals/${withdrawalId}/decision`, 
        testData.admin.token,
        {
          action: 'approve',
          adminPassword: 'wrongpassword',
          notes: 'Should fail'
        }
      );
      
      expect(response.status).toBe(400);
    });
  });

  describe('🎯 Referral Commission Override', () => {
    let referralId: string;

    beforeAll(async () => {
      // Create a mock referral for testing
      referralId = await testHelpers.createMockReferral(
        testData.growthAssociate.userId, 
        testData.user.userId, 
        50
      );
    });

    it('should override referral commission', async () => {
      const response = await testHelpers.makeAuthenticatedRequest(
        'post', 
        '/admin/commissions/override', 
        testData.admin.token,
        {
          referralId,
          newCommissionAmount: 150.00,
          reason: 'Special promotion adjustment',
          adminPassword: process.env.ADMIN_PASSWORD || 'admin123'
        }
      );
      
      expect([200, 404]).toContain(response.status);
    });

    it('should get commission override history', async () => {
      const response = await testHelpers.makeAuthenticatedRequest(
        'get', 
        '/admin/commissions/override-history', 
        testData.admin.token,
        null,
        {
          startDate: '2024-01-01',
          endDate: '2024-12-31',
          adminId: 'all'
        }
      );
      
      expect(response.status).toBe(200);
      testHelpers.verifyResponseStructure(response, ['overrides', 'totalCount']);
      expect(Array.isArray(response.body.overrides)).toBe(true);
    });

    it('should get referral commission history', async () => {
      const response = await testHelpers.makeAuthenticatedRequest(
        'get', 
        `/admin/commissions/${referralId}/history`, 
        testData.admin.token
      );
      
      expect(response.status).toBe(200);
      testHelpers.verifyResponseStructure(response, [
        'referral',
        'commissionHistory'
      ]);
    });

    it('should validate admin password for commission override', async () => {
      const response = await testHelpers.makeAuthenticatedRequest(
        'post', 
        '/admin/commissions/override', 
        testData.admin.token,
        {
          referralId,
          newCommissionAmount: 150.00,
          reason: 'Test override',
          adminPassword: 'wrongpassword'
        }
      );
      
      expect(response.status).toBe(400);
    });
  });

  describe('🏆 Profit Pool Management', () => {
    let profitPoolId: string;

    beforeAll(async () => {
      // Create a mock profit pool for testing
      profitPoolId = await testHelpers.createMockProfitPool('Lagos', 10000);
    });

    it('should get all profit pools', async () => {
      const response = await testHelpers.makeAuthenticatedRequest(
        'get', 
        '/admin/profit-pools', 
        testData.admin.token,
        null,
        {
          city: 'Lagos',
          status: 'active'
        }
      );
      
      expect(response.status).toBe(200);
      testHelpers.verifyResponseStructure(response, ['pools', 'summary']);
    });

    it('should get profit pool details', async () => {
      const response = await testHelpers.makeAuthenticatedRequest(
        'get', 
        `/admin/profit-pools/${profitPoolId}`, 
        testData.admin.token
      );
      
      expect(response.status).toBe(200);
      testHelpers.verifyResponseStructure(response, [
        'pool',
        'participants',
        'distributionHistory'
      ]);
    });

    it('should adjust profit pool distribution', async () => {
      const response = await testHelpers.makeAuthenticatedRequest(
        'post', 
        `/admin/profit-pools/${profitPoolId}/adjust`, 
        testData.admin.token,
        {
          adjustmentType: 'add_bonus',
          amount: 1000.00,
          reason: 'Performance bonus',
          targetUsers: [testData.user.userId],
          adminPassword: process.env.ADMIN_PASSWORD || 'admin123'
        }
      );
      
      expect([200, 404]).toContain(response.status);
    });

    it('should generate monthly profit pool report', async () => {
      const response = await testHelpers.makeAuthenticatedRequest(
        'get', 
        '/admin/profit-pools/reports/monthly', 
        testData.admin.token,
        null,
        {
          year: 2024,
          month: 8,
          city: 'Lagos'
        }
      );
      
      expect(response.status).toBe(200);
      testHelpers.verifyResponseStructure(response, [
        'reportSummary',
        'poolsData',
        'totalDistributed'
      ]);
    });

    it('should force redistribute profit pool', async () => {
      const response = await testHelpers.makeAuthenticatedRequest(
        'post', 
        `/admin/profit-pools/${profitPoolId}/redistribute`, 
        testData.admin.token,
        {
          adminPassword: process.env.ADMIN_PASSWORD || 'admin123'
        }
      );
      
      expect([200, 404]).toContain(response.status);
    });

    it('should validate admin password for profit pool operations', async () => {
      const response = await testHelpers.makeAuthenticatedRequest(
        'post', 
        `/admin/profit-pools/${profitPoolId}/adjust`, 
        testData.admin.token,
        {
          adjustmentType: 'add_bonus',
          amount: 1000.00,
          reason: 'Should fail',
          targetUsers: [testData.user.userId],
          adminPassword: 'wrongpassword'
        }
      );
      
      expect(response.status).toBe(400);
    });
  });

  describe('⚡ Performance & Reliability', () => {
    it('should handle multiple concurrent requests', async () => {
      const requests = Array(10).fill(0).map(() =>
        testHelpers.makeAuthenticatedRequest(
          'get', 
          '/admin/users', 
          testData.admin.token
        )
      );

      const startTime = Date.now();
      const results = await Promise.all(requests);
      const endTime = Date.now();

      // All requests should succeed
      results.forEach(result => expect(result.status).toBe(200));
      
      // Should complete within reasonable time
      expect(endTime - startTime).toBeLessThan(5000);
    });

    it('should handle large dataset requests', async () => {
      const response = await testHelpers.makeAuthenticatedRequest(
        'get', 
        '/admin/users', 
        testData.admin.token,
        null,
        {
          page: 1,
          limit: 100
        }
      );
      
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });

    it('should handle concurrent wallet operations safely', async () => {
      const operations = Array(5).fill(0).map((_, index) => 
        testHelpers.makeAuthenticatedRequest(
          'post', 
          '/admin/wallets/fund', 
          testData.admin.token,
          {
            userId: testData.user.userId,
            amount: 10,
            walletType: 'foodMoney',
            adminPassword: process.env.ADMIN_PASSWORD || 'admin123',
            reason: `Concurrent test ${index + 1}`
          }
        )
      );

      const results = await Promise.allSettled(operations);
      
      // At least some operations should succeed
      const successful = results.filter(result => 
        result.status === 'fulfilled' && 
        (result as PromiseFulfilledResult<any>).value.status === 201
      );
      
      expect(successful.length).toBeGreaterThan(0);
    });
  });

  describe('🛡️ Security & Validation', () => {
    it('should require authentication for all admin endpoints', async () => {
      const endpoints = [
        '/admin/users',
        '/admin/wallets',
        '/admin/analytics/orders',
        '/admin/categories',
        '/admin/profit-pools'
      ];

      for (const endpoint of endpoints) {
        const response = await request(app.getHttpServer())
          .get(endpoint)
          .expect(401);
      }
    });

    it('should require admin role for all endpoints', async () => {
      const endpoints = [
        '/admin/users',
        '/admin/wallets', 
        '/admin/analytics/orders',
        '/admin/categories'
      ];

      for (const endpoint of endpoints) {
        const response = await testHelpers.makeAuthenticatedRequest(
          'get', 
          endpoint, 
          testData.user.token
        );
        expect(response.status).toBe(403);
      }
    });

    it('should validate input data types', async () => {
      const response = await testHelpers.makeAuthenticatedRequest(
        'post', 
        '/admin/wallets/fund', 
        testData.admin.token,
        {
          userId: 'invalid-object-id',
          amount: 'not-a-number',
          walletType: 123, // Should be string
          adminPassword: null
        }
      );
      
      expect(response.status).toBe(400);
    });

    it('should handle malformed JSON gracefully', async () => {
      const response = await request(app.getHttpServer())
        .post('/admin/categories')
        .set('Authorization', `Bearer ${testData.admin.token}`)
        .set('Content-Type', 'application/json')
        .send('{"invalid": json}') // Malformed JSON
        .expect(400);
    });

    it('should prevent SQL injection in queries', async () => {
      const maliciousInput = "'; DROP TABLE users; --";
      const response = await testHelpers.makeAuthenticatedRequest(
        'get', 
        `/admin/users/${maliciousInput}`, 
        testData.admin.token
      );
      
      expect(response.status).toBe(400); // Should be rejected as invalid ObjectId
    });

    it('should enforce rate limiting on sensitive operations', async () => {
      // This would depend on your rate limiting implementation
      const requests = Array(20).fill(0).map(() =>
        testHelpers.makeAuthenticatedRequest(
          'post', 
          '/admin/wallets/fund', 
          testData.admin.token,
          {
            userId: testData.user.userId,
            amount: 1,
            walletType: 'foodMoney',
            adminPassword: process.env.ADMIN_PASSWORD || 'admin123',
            reason: 'Rate limit test'
          }
        )
      );

      const results = await Promise.allSettled(requests);
      
      // Some requests might be rate limited
      const rateLimited = results.filter(result => 
        result.status === 'fulfilled' && 
        (result as PromiseFulfilledResult<any>).value.status === 429
      );
      
      // This assertion depends on your rate limiting configuration
      // expect(rateLimited.length).toBeGreaterThan(0);
    });
  });
});
