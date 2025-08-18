import { Connection, connect } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { Types } from 'mongoose';
import { UserRole } from '../../src/modules/users/entities/user.entity';

// Define global variables
let mongoConnection: Connection;

async function createTestUser(connection: Connection, userData: any): Promise<string> {
  try {
    const userCollection = connection.collection('users');
    
    // Hash the password
    const hashedPassword = await bcrypt.hash(userData.password, 10);
    
    // Create the user
    const result = await userCollection.insertOne({
      _id: new Types.ObjectId(),
      name: userData.name,
      email: userData.email,
      password: hashedPassword,
      role: userData.role,
      city: userData.city || 'Lagos',
      createdAt: new Date(),
      updatedAt: new Date()
    });
    
    return result.insertedId.toString();
  } catch (error) {
    console.error(`Error creating test user ${userData.email}:`, error);
    throw error;
  }
}

async function createTestWallet(connection: Connection, userId: string): Promise<string> {
  try {
    const walletCollection = connection.collection('wallets');
    
    const result = await walletCollection.insertOne({
      _id: new Types.ObjectId(),
      userId: new Types.ObjectId(userId),
      foodMoney: 0,
      nibiaWallet: 0,
      withdrawalEnabled: false,
      createdAt: new Date(),
      updatedAt: new Date()
    });
    
    return result.insertedId.toString();
  } catch (error) {
    console.error(`Error creating test wallet for ${userId}:`, error);
    throw error;
  }
}

async function createTestCategory(
  connection: Connection,
  name: string = 'Test Category',
  description: string = 'Test Category Description'
): Promise<string> {
  try {
    const categoryCollection = connection.collection('categories');
    
    const result = await categoryCollection.insertOne({
      _id: new Types.ObjectId(),
      name,
      description,
      image: 'https://example.com/category.jpg',
      createdAt: new Date(),
      updatedAt: new Date()
    });
    
    return result.insertedId.toString();
  } catch (error) {
    console.error(`Error creating test category:`, error);
    throw error;
  }
}

// Setup function to run before all tests
export async function setupAdminTests(): Promise<void> {
  console.log('🔧 Setting up admin test environment...');
  
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/forage-test-db';
    mongoConnection = (await connect(mongoUri)).connection;
    console.log('✅ Connected to MongoDB');
    
    // Clean existing test data
    await cleanupTestData();
    
    // Create test admin user
    const adminUser = {
      name: 'Test Admin',
      email: 'admin@test.com',
      password: 'AdminPass123!',
      role: UserRole.ADMIN
    };
    const adminUserId = await createTestUser(mongoConnection, adminUser);
    
    // Create regular test user
    const regularUser = {
      name: 'Test User',
      email: 'user@test.com',
      password: 'UserPass123!',
      role: UserRole.USER
    };
    const regularUserId = await createTestUser(mongoConnection, regularUser);
    
    // Create growth associate
    const growthAssociateUser = {
      name: 'Test Growth Associate',
      email: 'ga@test.com',
      password: 'GAPass123!',
      role: UserRole.GROWTH_ASSOCIATE
    };
    const gaUserId = await createTestUser(mongoConnection, growthAssociateUser);
    
    // Create wallets for all users
    await createTestWallet(mongoConnection, adminUserId);
    await createTestWallet(mongoConnection, regularUserId);
    await createTestWallet(mongoConnection, gaUserId);
    
    // Create test category
    await createTestCategory(mongoConnection);
    
    console.log('✅ Test data setup completed');
  } catch (error) {
    console.error('❌ Error setting up admin test environment:', error);
    throw error;
  }
}

// Cleanup function to run after all tests
export async function cleanupTestData(): Promise<void> {
  if (!mongoConnection) return;
  
  try {
    console.log('🧹 Cleaning up test data...');
    
    // List of collections to clean
    const collections = [
      'users',
      'wallets',
      'categories',
      'products',
      'referrals',
      'withdrawals',
      'profitpools',
      'pricehistories'
    ];
    
    // Clean each collection
    for (const collectionName of collections) {
      try {
        const collection = mongoConnection.collection(collectionName);
        await collection.deleteMany({ 
          $or: [
            { email: { $in: ['admin@test.com', 'user@test.com', 'ga@test.com'] } },
            { name: /^Test/ },
            { createdAt: { $gte: new Date(Date.now() - 3600000) } } // Last hour
          ]
        });
      } catch (error) {
        console.error(`Error cleaning ${collectionName}:`, error);
      }
    }
    
    console.log('✅ Test data cleanup completed');
  } catch (error) {
    console.error('❌ Error cleaning up test data:', error);
  }
}

// Function to close connections after all tests
export async function teardownAdminTests(): Promise<void> {
  try {
    if (mongoConnection) {
      await cleanupTestData();
      await mongoConnection.close();
      console.log('✅ MongoDB connection closed');
    }
  } catch (error) {
    console.error('❌ Error closing MongoDB connection:', error);
  }
}
