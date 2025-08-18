import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { Connection, Types } from 'mongoose';
import { UserRole } from '../../src/modules/users/entities/user.entity';

export class TestHelpers {
  private app: INestApplication;
  private connection: Connection;

  constructor(app: INestApplication, connection: Connection) {
    this.app = app;
    this.connection = connection;
  }

  /**
   * Register and login a user with specific role
   */
  async createUserAndGetToken(userData: {
    name: string;
    email: string;
    password: string;
    role: UserRole;
  }): Promise<{ token: string; userId: string; user: any }> {
    // Register user
    const registerResponse = await request(this.app.getHttpServer())
      .post('/auth/register')
      .send(userData);

    if (registerResponse.status !== 201) {
      throw new Error(`Failed to register user: ${registerResponse.body.message}`);
    }

    // Login user
    const loginResponse = await request(this.app.getHttpServer())
      .post('/auth/login')
      .send({
        email: userData.email,
        password: userData.password
      });

    if (loginResponse.status !== 200) {
      throw new Error(`Failed to login user: ${loginResponse.body.message}`);
    }

    return {
      token: loginResponse.body.accessToken,
      userId: loginResponse.body.user.id,
      user: loginResponse.body.user
    };
  }

  /**
   * Create test data for various entities
   */
  async createTestData() {
    const testData: any = {};

    // Create test users
    try {
      testData.admin = await this.createUserAndGetToken({
        name: 'Test Admin',
        email: 'admin@test.com',
        password: 'AdminPass123!',
        role: UserRole.ADMIN
      });

      testData.user = await this.createUserAndGetToken({
        name: 'Test User',
        email: 'user@test.com',
        password: 'UserPass123!',
        role: UserRole.USER
      });

      testData.growthAssociate = await this.createUserAndGetToken({
        name: 'Growth Associate',
        email: 'ga@test.com',
        password: 'GAPass123!',
        role: UserRole.GROWTH_ASSOCIATE
      });

      testData.growthElite = await this.createUserAndGetToken({
        name: 'Growth Elite',
        email: 'ge@test.com',
        password: 'GEPass123!',
        role: UserRole.GROWTH_ELITE
      });

    } catch (error) {
      console.error('Failed to create test users:', error.message);
      throw error;
    }

    return testData;
  }

  /**
   * Clean up test data from database
   */
  async cleanupTestData(testEmails: string[]) {
    try {
      if (this.connection && this.connection.readyState === 1) {
        // Clean up users
        await this.connection.collection('users').deleteMany({
          email: { $in: testEmails }
        });

        // Clean up associated wallets
        const users = await this.connection.collection('users').find({
          email: { $in: testEmails }
        }).toArray();

        const userIds = users.map(user => user._id);

        // Clean up wallets
        await this.connection.collection('wallets').deleteMany({
          userId: { $in: userIds }
        });

        // Clean up other test collections
        await this.connection.collection('categories').deleteMany({
          name: /^Test/
        });

        await this.connection.collection('products').deleteMany({
          name: /^Test/
        });

        await this.connection.collection('orders').deleteMany({
          userId: { $in: userIds }
        });

        await this.connection.collection('referrals').deleteMany({
          $or: [
            { referrerId: { $in: userIds } },
            { referredUserId: { $in: userIds } }
          ]
        });

        await this.connection.collection('pricehistories').deleteMany({
          productId: /^64f8b1234567890123456/
        });

        console.log('✅ Test data cleanup completed');
      }
    } catch (error) {
      console.log('⚠️ Cleanup error (non-critical):', error.message);
    }
  }

  /**
   * Wait for a condition to be true (useful for async operations)
   */
  async waitFor(condition: () => Promise<boolean>, timeout: number = 5000): Promise<void> {
    const start = Date.now();
    
    while (Date.now() - start < timeout) {
      if (await condition()) {
        return;
      }
      await this.sleep(100);
    }
    
    throw new Error(`Condition not met within ${timeout}ms`);
  }

  /**
   * Sleep utility
   */
  sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Generate test ObjectId
   */
  generateObjectId(): string {
    return new Types.ObjectId().toString();
  }

  /**
   * Make authenticated request
   */
  async makeAuthenticatedRequest(
    method: 'get' | 'post' | 'patch' | 'delete',
    endpoint: string,
    token: string,
    body?: any,
    query?: any
  ) {
    let req = request(this.app.getHttpServer())[method](endpoint)
      .set('Authorization', `Bearer ${token}`);

    if (query) {
      req = req.query(query);
    }

    if (body && (method === 'post' || method === 'patch')) {
      req = req.send(body);
    }

    return req;
  }

  /**
   * Create test wallet with initial balance
   */
  async createTestWallet(userId: string, initialBalance: number = 1000, token: string) {
    return this.makeAuthenticatedRequest('post', '/admin/wallets/fund', token, {
      userId,
      amount: initialBalance,
      walletType: 'foodMoney',
      adminPassword: process.env.ADMIN_PASSWORD || 'admin123',
      reason: 'Test wallet creation'
    });
  }

  /**
   * Create test category
   */
  async createTestCategory(token: string, categoryData?: Partial<any>) {
    const defaultCategory = {
      name: `Test Category ${Date.now()}`,
      description: 'Test category for e2e tests',
      image: 'https://example.com/test-category.jpg'
    };

    return this.makeAuthenticatedRequest('post', '/admin/categories', token, {
      ...defaultCategory,
      ...categoryData
    });
  }

  /**
   * Create test product
   */
  async createTestProduct(token: string, categoryId: string, productData?: Partial<any>) {
    const defaultProduct = {
      name: `Test Product ${Date.now()}`,
      description: 'Test product for e2e tests',
      price: 1000,
      category: categoryId,
      images: ['https://example.com/test-product.jpg'],
      inStock: true,
      stockQuantity: 100
    };

    return this.makeAuthenticatedRequest('post', '/products', token, {
      ...defaultProduct,
      ...productData
    });
  }

  /**
   * Verify response structure
   */
  verifyResponseStructure(response: any, expectedFields: string[]) {
    for (const field of expectedFields) {
      expect(response.body).toHaveProperty(field);
    }
  }

  /**
   * Verify pagination structure
   */
  verifyPaginationStructure(response: any) {
    expect(response.body).toHaveProperty('data');
    expect(response.body).toHaveProperty('pagination');
    expect(response.body.pagination).toHaveProperty('page');
    expect(response.body.pagination).toHaveProperty('limit');
    expect(response.body.pagination).toHaveProperty('totalPages');
    expect(response.body.pagination).toHaveProperty('totalItems');
  }

  /**
   * Create mock withdrawal request
   */
  async createMockWithdrawal(userId: string, amount: number = 500) {
    const withdrawal = {
      _id: new Types.ObjectId(),
      userId: new Types.ObjectId(userId),
      amount,
      status: 'pending',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    await this.connection.collection('withdrawals').insertOne(withdrawal);
    return withdrawal._id.toString();
  }

  /**
   * Create mock referral
   */
  async createMockReferral(referrerId: string, referredUserId: string, commission: number = 50) {
    const referral = {
      _id: new Types.ObjectId(),
      referrerId: new Types.ObjectId(referrerId),
      referredUserId: new Types.ObjectId(referredUserId),
      commission,
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    await this.connection.collection('referrals').insertOne(referral);
    return referral._id.toString();
  }

  /**
   * Create mock profit pool
   */
  async createMockProfitPool(city: string = 'Lagos', totalAmount: number = 10000) {
    const profitPool = {
      _id: new Types.ObjectId(),
      city,
      totalAmount,
      status: 'active',
      participants: [],
      createdAt: new Date(),
      updatedAt: new Date()
    };

    await this.connection.collection('profitpools').insertOne(profitPool);
    return profitPool._id.toString();
  }
}
