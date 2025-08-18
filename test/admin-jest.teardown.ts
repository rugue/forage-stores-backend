/**
 * Global teardown for admin tests
 * This script runs once after all tests have completed
 */

import { MongoClient } from 'mongodb';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

// Load test environment variables
dotenv.config({ path: '.env.test' });

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/forage-test';
const LOG_DIR = path.join(__dirname, '../logs');

module.exports = async () => {
  console.log('\n📝 Admin Test Suite: Global teardown...');
  
  // Connect to MongoDB
  const client = await MongoClient.connect(MONGODB_URI);
  const db = client.db();
  
  try {
    // Log test collections statistics before cleanup
    console.log('🔍 Database collections before cleanup:');
    const collections = await db.listCollections().toArray();
    
    if (collections.length > 0) {
      for (const collection of collections) {
        const count = await db.collection(collection.name).countDocuments();
        console.log(`  - ${collection.name}: ${count} documents`);
      }
    } else {
      console.log('  No collections found');
    }
    
    // Clean up test data if requested via environment variable
    if (process.env.ADMIN_TEST_CLEAN === 'true') {
      console.log('\n🧹 Cleaning up admin test data...');
      
      // List of collections that should be cleaned after admin tests
      const testCollections = [
        'admin_users',
        'users',
        'wallets',
        'categories',
        'products', 
        'profit_pools',
        'referrals',
        'withdrawals',
        'orders',
        'subscriptions'
      ];
      
      for (const collection of testCollections) {
        if (collections.find(c => c.name === collection)) {
          // Using a safer approach without regex or string operations
          // Delete documents based on test ID prefix convention
          const deleteResult = await db.collection(collection).deleteMany({
            $or: [
              { isTestData: true },  // If we explicitly marked test data
              { createdForTest: { $exists: true } } // Another possible test flag
            ]
          });
          
          console.log(`  - Note: For ${collection}, only explicitly marked test data was removed`);
          
          // Log that for proper cleanup, data should be marked as test data
          if (deleteResult.deletedCount === 0) {
            console.log(`  - Tip: Mark test data with { isTestData: true } for proper cleanup`);
          }
          console.log(`  - Cleaned ${collection}: ${deleteResult.deletedCount} documents removed`);
        }
      }
    } else {
      console.log('\n⏩ Skipping database cleanup (set ADMIN_TEST_CLEAN=true to clean)');
    }
    
    // Create logs directory if it doesn't exist
    if (!fs.existsSync(LOG_DIR)) {
      fs.mkdirSync(LOG_DIR, { recursive: true });
    }
    
    // Write teardown log
    const date = new Date();
    const logFilename = path.join(
      LOG_DIR, 
      `admin-teardown-${date.toISOString().replace(/[:.]/g, '-')}.log`
    );
    
    fs.writeFileSync(
      logFilename,
      `Admin test teardown completed at ${date.toISOString()}\n` +
      `MongoDB URI: ${MONGODB_URI}\n` +
      `Clean mode: ${process.env.ADMIN_TEST_CLEAN === 'true' ? 'Yes' : 'No'}\n` +
      `Collections: ${collections.map(c => c.name).join(', ')}\n`
    );
    
    console.log(`\n✅ Admin Test Suite: Teardown complete. Log written to ${logFilename}`);
    
  } catch (error) {
    console.error('\n❌ Admin Test Suite: Teardown error:', error);
    throw error;
  } finally {
    await client.close();
    console.log('📊 Admin Test Suite: MongoDB connection closed');
  }
};
