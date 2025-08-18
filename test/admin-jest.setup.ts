/**
 * Global setup for admin tests
 * This script runs once before any tests start
 */

import { MongoClient, ObjectId } from 'mongodb';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';
import * as crypto from 'crypto';

// Load test environment variables
dotenv.config({ path: '.env.test' });

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/forage-test';
const LOG_DIR = path.join(__dirname, '../logs');

// Generate a unique test run ID
const TEST_RUN_ID = `test-run-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;

module.exports = async () => {
  console.log('\n📝 Admin Test Suite: Global setup...');
  console.log(`🔑 Test Run ID: ${TEST_RUN_ID}`);
  
  // Set environment variable for test run ID
  process.env.ADMIN_TEST_RUN_ID = TEST_RUN_ID;
  
  // Connect to MongoDB
  const client = await MongoClient.connect(MONGODB_URI);
  const db = client.db();
  
  try {
    // Create logs directory if it doesn't exist
    if (!fs.existsSync(LOG_DIR)) {
      fs.mkdirSync(LOG_DIR, { recursive: true });
    }
    
    // Check if we need to create seed data for tests
    if (process.env.ADMIN_TEST_SEED === 'true') {
      console.log('\n🌱 Creating seed data for admin tests...');
      
      // Create a test admin user with MongoDB ObjectId
      const adminId = new ObjectId();
      const adminTestId = `test-admin-${TEST_RUN_ID}`;
      
      const adminUser = {
        email: `test-admin-${TEST_RUN_ID}@example.com`,
        password: '$2b$10$4sVYNfIjKbJ/AMXZ5RyUIOPTDfvnE9xWEEV/cOlr1.eyUFOCxdMsi', // hashed 'testPassword123'
        role: 'admin',
        isTestData: true,
        testId: adminTestId, // Store string ID as a field for reference
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      const adminResult = await db.collection('users').insertOne(adminUser);
      console.log(`  - Created test admin user: ${adminUser.email}`);
      
      // Create a test regular user
      const userId = new ObjectId();
      const userTestId = `test-user-${TEST_RUN_ID}`;
      
      const regularUser = {
        email: `test-user-${TEST_RUN_ID}@example.com`,
        password: '$2b$10$4sVYNfIjKbJ/AMXZ5RyUIOPTDfvnE9xWEEV/cOlr1.eyUFOCxdMsi', // hashed 'testPassword123'
        role: 'user',
        isTestData: true,
        testId: userTestId,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      const userResult = await db.collection('users').insertOne(regularUser);
      console.log(`  - Created test regular user: ${regularUser.email}`);
      
      // Create a test wallet for the regular user
      const walletId = new ObjectId();
      const walletTestId = `test-wallet-${TEST_RUN_ID}`;
      
      const wallet = {
        userId: userResult.insertedId,
        balance: 0,
        isTestData: true,
        testId: walletTestId,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      const walletResult = await db.collection('wallets').insertOne(wallet);
      console.log(`  - Created test wallet for user`);
      
      // Create test categories
      const category1Id = new ObjectId();
      const category2Id = new ObjectId();
      const category1TestId = `test-category-1-${TEST_RUN_ID}`;
      const category2TestId = `test-category-2-${TEST_RUN_ID}`;
      
      const categories = [
        {
          name: 'Test Category 1',
          description: 'Test category description 1',
          isTestData: true,
          testId: category1TestId,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          name: 'Test Category 2',
          description: 'Test category description 2',
          isTestData: true,
          testId: category2TestId,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];
      
      const categoryResult = await db.collection('categories').insertMany(categories);
      console.log(`  - Created ${categories.length} test categories`);
      
      // Create test profit pools
      const poolId = new ObjectId();
      const poolTestId = `test-profit-pool-${TEST_RUN_ID}`;
      
      const profitPool = {
        name: 'Test Profit Pool',
        totalAmount: 1000,
        distributionRules: {
          referrers: 0.5,
          platform: 0.3,
          charity: 0.2
        },
        isTestData: true,
        testId: poolTestId,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      const poolResult = await db.collection('profit_pools').insertOne(profitPool);
      console.log(`  - Created test profit pool`);
      
      // Get the inserted IDs
      const insertedIds = {
        adminId: adminResult.insertedId,
        userId: userResult.insertedId,
        walletId: walletResult.insertedId,
        categoryIds: Object.values(categoryResult.insertedIds),
        poolId: poolResult.insertedId
      };
      
      // Log the test data information for reference
      const setupData = {
        testRunId: TEST_RUN_ID,
        adminUser: {
          id: adminResult.insertedId.toString(),
          testId: adminTestId,
          email: adminUser.email
        },
        regularUser: {
          id: userResult.insertedId.toString(),
          testId: userTestId,
          email: regularUser.email
        },
        wallet: {
          id: walletResult.insertedId.toString(),
          testId: walletTestId
        },
        categories: [
          {
            id: categoryResult.insertedIds[0].toString(),
            testId: category1TestId,
            name: categories[0].name
          },
          {
            id: categoryResult.insertedIds[1].toString(),
            testId: category2TestId,
            name: categories[1].name
          }
        ],
        profitPool: {
          id: poolResult.insertedId.toString(),
          testId: poolTestId,
          name: profitPool.name
        }
      };
      
      // Save setup data to file for reference during tests
      fs.writeFileSync(
        path.join(LOG_DIR, `admin-test-setup-${TEST_RUN_ID}.json`),
        JSON.stringify(setupData, null, 2)
      );
      
      console.log('\n✅ Admin Test Suite: Seed data created successfully');
    } else {
      console.log('\n⏩ Skipping seed data creation (set ADMIN_TEST_SEED=true to create seed data)');
    }
    
    // Write setup log
    const date = new Date();
    const logFilename = path.join(
      LOG_DIR, 
      `admin-setup-${date.toISOString().replace(/[:.]/g, '-')}.log`
    );
    
    fs.writeFileSync(
      logFilename,
      `Admin test setup completed at ${date.toISOString()}\n` +
      `MongoDB URI: ${MONGODB_URI}\n` +
      `Test Run ID: ${TEST_RUN_ID}\n` +
      `Seed mode: ${process.env.ADMIN_TEST_SEED === 'true' ? 'Yes' : 'No'}\n`
    );
    
    console.log(`\n✅ Admin Test Suite: Setup complete. Log written to ${logFilename}`);
    
  } catch (error) {
    console.error('\n❌ Admin Test Suite: Setup error:', error);
    throw error;
  } finally {
    await client.close();
    console.log('📊 Admin Test Suite: MongoDB connection closed');
  }
};
