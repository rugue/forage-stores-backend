import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { Connection, Types } from 'mongoose';
import { UserRole } from '../../src/modules/users/entities/user.entity';

export class TestHelpers {
  private app: INestApplication;
  private connection: Connection;
  private lastAuthInfo: { email: string; password: string } | null = null;

  constructor(app: INestApplication, connection: Connection) {
    this.app = app;
    this.connection = connection;
  }

  /**
   * Register and login a user with specific role
   * Adds unique timestamp and random string to email to prevent conflicts
   * Stores test metadata internally without sending to API
   */
  async createUserAndGetToken(userData: {
    name: string;
    email: string;
    password: string;
    role: UserRole;
  }): Promise<{ token: string; userId: string; user: any }> {
    // Add timestamp and random string to email to ensure uniqueness
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 8);
    const uniqueEmail = userData.email.replace('@', `-${timestamp}-${randomString}@`);
    
    // Create request data (without test metadata that would be rejected by API)
    const uniqueUserData = { 
      ...userData, 
      email: uniqueEmail
    };
    
    // Track test metadata internally (we'll store this separately)
    const testMetadata = {
      isTestData: true,
      testRunId: process.env.ADMIN_TEST_RUN_ID || `test-run-${timestamp}`,
      originalEmail: userData.email,
      testTimestamp: timestamp
    };
    
    // Store auth info for potential token refresh
    this.lastAuthInfo = {
      email: uniqueEmail,
      password: userData.password
    };
    
    // Check if user already exists
    try {
      // Try to login first - if user exists with this email, use it
      const loginResponse = await request(this.app.getHttpServer())
        .post('/auth/login')
        .send({
          email: uniqueEmail,
          password: userData.password
        });
      
      if (loginResponse.status === 200) {
        console.log(`User with email ${uniqueEmail} already exists, reusing`);
        
        const result = {
          token: loginResponse.body.accessToken,
          userId: loginResponse.body.user.id,
          user: loginResponse.body.user
        };
        
        // Add test metadata to MongoDB after successful login
        try {
          await this.connection.collection('users').updateOne(
            { _id: new Types.ObjectId(result.userId) },
            { $set: { 
                isTestData: true, 
                testRunId: testMetadata.testRunId 
              } 
            }
          );
        } catch (e) {
          console.log(`Note: Couldn't mark existing user as test data: ${e.message}`);
        }
        
        return result;
      }
    } catch (e) {
      // If login fails, continue with registration
      console.log(`Creating new user with email ${uniqueEmail}`);
    }
    
    // Add a small delay before registration to avoid rate limiting
    await this.sleep(300);
    
    // Register user (without test metadata)
    const registerResponse = await request(this.app.getHttpServer())
      .post('/auth/register')
      .send(uniqueUserData);

    if (registerResponse.status !== 201) {
      throw new Error(`Failed to register user: ${JSON.stringify(registerResponse.body)}`);
    }

    // Add a small delay before login to avoid rate limiting
    await this.sleep(300);

    // Login user
    const loginResponse = await request(this.app.getHttpServer())
      .post('/auth/login')
      .send({
        email: uniqueEmail,
        password: userData.password
      });

    if (loginResponse.status !== 200) {
      throw new Error(`Failed to login user: ${JSON.stringify(loginResponse.body)}`);
    }

    console.log(`Successfully created and logged in user: ${uniqueEmail}`);

    const result = {
      token: loginResponse.body.accessToken,
      userId: loginResponse.body.user.id,
      user: loginResponse.body.user
    };
    
    // Mark the newly registered user as test data directly in the database
    // This avoids validation issues with the API endpoints
    try {
      await this.connection.collection('users').updateOne(
        { _id: new Types.ObjectId(result.userId) },
        { 
          $set: { 
            isTestData: true, 
            testRunId: process.env.ADMIN_TEST_RUN_ID || testMetadata.testRunId
          } 
        }
      );
      console.log(`Marked user ${uniqueEmail} as test data in database`);
    } catch (e) {
      console.log(`Note: Couldn't mark user as test data: ${e.message}`);
    }

    return result;
  }

  /**
   * Create test data for various entities
   * Uses a unique test run ID for isolation
   */
  async createTestData() {
    const testData: any = {};
    
    // Use the global test run ID if available, or create a new one
    const testRunId = process.env.ADMIN_TEST_RUN_ID || `test-run-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
    testData.testRunId = testRunId;
    
    console.log(`Creating test data with ID: ${testRunId}`);

    // Create test users
    try {
      console.log('Creating admin test user...');
      testData.admin = await this.createUserAndGetToken({
        name: `Test Admin ${testRunId}`,
        email: `admin@test.com`,
        password: 'AdminPass123!',
        role: UserRole.ADMIN
      });
      
      console.log('Creating regular test user...');
      testData.user = await this.createUserAndGetToken({
        name: `Test User ${testRunId}`,
        email: `user@test.com`,
        password: 'UserPass123!',
        role: UserRole.USER
      });

      console.log('Creating growth associate test user...');
      testData.growthAssociate = await this.createUserAndGetToken({
        name: `Growth Associate ${testRunId}`,
        email: `ga@test.com`,
        password: 'GAPass123!',
        role: UserRole.GROWTH_ASSOCIATE
      });

      console.log('Creating growth elite test user...');
      testData.growthElite = await this.createUserAndGetToken({
        name: `Growth Elite ${testRunId}`,
        email: `ge@test.com`,
        password: 'GEPass123!',
        role: UserRole.GROWTH_ELITE
      });
      
      // Store user emails for cleanup
      testData.emails = [
        testData.admin.user.email,
        testData.user.user.email,
        testData.growthAssociate.user.email,
        testData.growthElite.user.email
      ];

    } catch (error) {
      console.error('Failed to create test users:', error.message);
      throw error;
    }

    return testData;
  }

  /**
   * Clean up test data from database
   * Enhanced with improved isolation and test run ID tracking
   */
  async cleanupTestData(testEmails?: string[]) {
    try {
      if (this.connection && this.connection.readyState === 1) {
        // Get current test run ID from env or generate one
        const testRunId = process.env.ADMIN_TEST_RUN_ID || '';
        const testRunFilter = testRunId ? { testRunId } : {};
        
        console.log(`Cleaning up test data${testRunId ? ` for run ID: ${testRunId}` : ''}...`);
        
        // If no specific emails provided, clean up all test data
        const emailFilter = testEmails?.length 
          ? { email: { $in: testEmails } }
          : { 
              $or: [
                { isTestData: true }, 
                { email: /-([\d]+)-([a-z0-9]+)@/ },
                testRunId ? { testRunId } : {}
              ] 
            };
        
        // Clean up users
        const deleteResult = await this.connection.collection('users').deleteMany(emailFilter);
        console.log(`Cleaned up ${deleteResult.deletedCount} test users`);

        // Find any remaining test users by email pattern
        const users = await this.connection.collection('users').find(emailFilter).toArray();
        const userIds = users.map(user => user._id);

        // Collections to clean up
        const collections = [
          'wallets', 'orders', 'referrals', 'withdrawals', 
          'categories', 'products', 'pricehistories',
          'profit_pools', 'subscriptions', 'notifications'
        ];

        // Clean up related collections
        for (const collection of collections) {
          try {
            if (this.connection.db.collection(collection)) {
              const filter = {
                $or: [
                  { isTestData: true },
                  userIds.length > 0 ? { userId: { $in: userIds } } : {},
                  collection === 'referrals' && userIds.length > 0 ? { referrerId: { $in: userIds } } : {},
                  collection === 'referrals' && userIds.length > 0 ? { referredUserId: { $in: userIds } } : {},
                  collection === 'categories' || collection === 'products' ? { name: /^Test/ } : {},
                  testRunId ? { testRunId } : {}
                ].filter(condition => Object.keys(condition).length > 0) // Remove empty conditions
              };

              const result = await this.connection.collection(collection).deleteMany(filter);
              console.log(`Cleaned up ${result.deletedCount} test ${collection}`);
            }
          } catch (err) {
            console.log(`Note: Collection ${collection} may not exist or had cleaning error: ${err.message}`);
          }
        }
        const productsResult = await this.connection.collection('products').deleteMany({
          $or: [
            { name: /^Test/ },
            { isTestData: true }
          ]
        });
        console.log(`Cleaned up ${productsResult.deletedCount} test products`);

        // Clean up price history
        const priceHistoryResult = await this.connection.collection('pricehistories').deleteMany({
          $or: [
            { productId: /^64f8b1234567890123456/ },
            { isTestData: true }
          ]
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
   * Make authenticated request with built-in rate limiting and retry
   * Enhanced with exponential backoff and token refreshing
   */
  async makeAuthenticatedRequest(
    method: 'get' | 'post' | 'patch' | 'delete',
    endpoint: string,
    token: string,
    body?: any,
    query?: any,
    retries: number = 3
  ) {
    // Add a small delay to prevent rate limiting
    await this.sleep(250);
    
    let req = request(this.app.getHttpServer())[method](endpoint)
      .set('Authorization', `Bearer ${token}`);

    if (query) {
      req = req.query(query);
    }

    if (body && (method === 'post' || method === 'patch')) {
      req = req.send(body);
    }

    try {
      const response = await req;
      
      // Handle rate limiting with exponential backoff
      if (response.status === 429 && retries > 0) {
        console.log(`Rate limited on ${endpoint}, waiting to retry... (${retries} retries left)`);
        // Exponential backoff: wait longer with each retry
        await this.sleep(1000 * Math.pow(2, 3 - retries));
        return this.makeAuthenticatedRequest(method, endpoint, token, body, query, retries - 1);
      }
      
      // Handle token expiration (401 Unauthorized)
      if (response.status === 401 && retries > 0 && response.body?.message?.includes('expired')) {
        console.log('Token expired, attempting to refresh...');
        
        // Extract user info from token (assuming email/password in body or saved in instance)
        // This is a simplified approach - you might need to adjust based on your auth system
        try {
          if (this.lastAuthInfo) {
            const refreshResponse = await request(this.app.getHttpServer())
              .post('/auth/login')
              .send({
                email: this.lastAuthInfo.email,
                password: this.lastAuthInfo.password
              });
            
            if (refreshResponse.status === 200) {
              console.log('Successfully refreshed token');
              return this.makeAuthenticatedRequest(
                method, 
                endpoint, 
                refreshResponse.body.accessToken, 
                body, 
                query, 
                retries - 1
              );
            }
          }
        } catch (refreshError) {
          console.log('Failed to refresh token:', refreshError.message);
        }
      }
      
      return response;
    } catch (error) {
      // Handle rate limiting with exponential backoff
      if (error?.status === 429 && retries > 0) {
        console.log(`Rate limited on ${endpoint}, waiting to retry... (${retries} retries left)`);
        // Exponential backoff: wait longer with each retry
        await this.sleep(1000 * Math.pow(2, 3 - retries));
        return this.makeAuthenticatedRequest(method, endpoint, token, body, query, retries - 1);
      }
      
      // Handle token expiration in error case
      if (error?.status === 401 && retries > 0) {
        console.log('Possible auth error, retry with delay:', error.message);
        await this.sleep(500);
        return this.makeAuthenticatedRequest(method, endpoint, token, body, query, retries - 1);
      }
      
      throw error;
    }
  }

  /**
   * Create test wallet with initial balance
   */
  async createTestWallet(userId: string, initialBalance: number = 1000, token: string) {
    // Add a small delay to prevent rate limiting
    await this.sleep(300);
    
    return this.makeAuthenticatedRequest('post', '/admin/wallets/fund', token, {
      userId,
      amount: initialBalance,
      walletType: 'foodMoney',
      adminPassword: process.env.ADMIN_PASSWORD || 'AdminPass123!',
      reason: 'Test wallet creation',
      isTestData: true  // Mark as test data for cleanup
    });
  }

  /**
   * Create test category
   */
  async createTestCategory(token: string, categoryData?: Partial<any>) {
    const timestamp = Date.now();
    const testRunId = process.env.ADMIN_TEST_RUN_ID || `test-run-${timestamp}`;
    
    // Category data for API (without test markers that might be rejected)
    const defaultCategory = {
      name: `Test Category ${timestamp}`,
      description: 'Test category for e2e tests',
      image: 'https://example.com/test-category.jpg'
    };

    // Add a small delay to prevent rate limiting
    await this.sleep(300);

    // Create category via API
    const response = await this.makeAuthenticatedRequest('post', '/admin/categories', token, {
      ...defaultCategory,
      ...categoryData
    });
    
    // Mark as test data directly in database
    if (response.status === 201 && response.body && response.body.id) {
      try {
        await this.connection.collection('categories').updateOne(
          { _id: new Types.ObjectId(response.body.id) },
          { 
            $set: { 
              isTestData: true, 
              testRunId: testRunId 
            } 
          }
        );
        console.log(`Marked category ${response.body.name} as test data in database`);
      } catch (e) {
        console.log(`Note: Couldn't mark category as test data: ${e.message}`);
      }
    }
    
    return response;
  }

  /**
   * Create test product
   */
  async createTestProduct(token: string, categoryId: string, productData?: Partial<any>) {
    const timestamp = Date.now();
    const testRunId = process.env.ADMIN_TEST_RUN_ID || `test-run-${timestamp}`;
    
    // Product data for API (without test markers that might be rejected)
    const defaultProduct = {
      name: `Test Product ${timestamp}`,
      description: 'Test product for e2e tests',
      price: 1000,
      category: categoryId,
      images: ['https://example.com/test-product.jpg'],
      inStock: true,
      stockQuantity: 100
    };

    // Add a small delay to prevent rate limiting
    await this.sleep(300);

    // Create product via API
    const response = await this.makeAuthenticatedRequest('post', '/products', token, {
      ...defaultProduct,
      ...productData
    });
    
    // Mark as test data directly in database
    if (response.status === 201 && response.body && response.body.id) {
      try {
        await this.connection.collection('products').updateOne(
          { _id: new Types.ObjectId(response.body.id) },
          { 
            $set: { 
              isTestData: true, 
              testRunId: testRunId 
            } 
          }
        );
        console.log(`Marked product ${response.body.name} as test data in database`);
      } catch (e) {
        console.log(`Note: Couldn't mark product as test data: ${e.message}`);
      }
    }
    
    return response;
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
      updatedAt: new Date(),
      isTestData: true,  // Mark as test data for cleanup
      testRunId: Date.now().toString() // Add test run ID for isolation
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
      updatedAt: new Date(),
      isTestData: true,  // Mark as test data for cleanup
      testRunId: Date.now().toString() // Add test run ID for isolation
    };

    await this.connection.collection('referrals').insertOne(referral);
    return referral._id.toString();
  }

  /**
   * Create mock profit pool
   */
  async createMockProfitPool(city: string = 'Lagos', totalAmount: number = 10000) {
    const testRunId = Date.now().toString();
    const profitPool = {
      _id: new Types.ObjectId(),
      city: `${city}-${testRunId}`, // Make city unique for isolation
      totalAmount,
      status: 'active',
      participants: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      isTestData: true,  // Mark as test data for cleanup
      testRunId // Add test run ID for isolation
    };

    await this.connection.collection('profitpools').insertOne(profitPool);
    return profitPool._id.toString();
  }
}
