const { MongoClient } = require('mongodb');
require('dotenv').config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/forage-backend';

/**
 * Migration: Setup Profit Pool Collection
 * This script creates the profit pool collection with proper indexes
 */
async function migrateProfitPoolCollection() {
  console.log('🚀 Starting Profit Pool Collection Migration...');
  
  const client = new MongoClient(MONGO_URI);
  
  try {
    await client.connect();
    console.log('✅ Connected to MongoDB');
    
    const db = client.db();
    const profitPoolsCollection = db.collection('profitpools');
    
    // Create indexes for performance
    console.log('📊 Creating indexes for profit pools collection...');
    
    // Unique compound index for city + month
    await profitPoolsCollection.createIndex(
      { city: 1, month: 1 },
      { 
        unique: true,
        name: 'city_month_unique',
        background: true 
      }
    );
    console.log('✅ Created unique index: city_month_unique');
    
    // Status and creation date index
    await profitPoolsCollection.createIndex(
      { status: 1, createdAt: -1 },
      { 
        name: 'status_created',
        background: true 
      }
    );
    console.log('✅ Created index: status_created');
    
    // Distribution date index
    await profitPoolsCollection.createIndex(
      { distributedAt: 1 },
      { 
        name: 'distributed_at',
        background: true 
      }
    );
    console.log('✅ Created index: distributed_at');
    
    // User ID index for distribution tracking
    await profitPoolsCollection.createIndex(
      { 'distributedTo.userId': 1 },
      { 
        name: 'distribution_user_id',
        background: true 
      }
    );
    console.log('✅ Created index: distribution_user_id');
    
    // City index for filtering
    await profitPoolsCollection.createIndex(
      { city: 1 },
      { 
        name: 'city_filter',
        background: true 
      }
    );
    console.log('✅ Created index: city_filter');
    
    // Month index for date filtering
    await profitPoolsCollection.createIndex(
      { month: 1 },
      { 
        name: 'month_filter',
        background: true 
      }
    );
    console.log('✅ Created index: month_filter');
    
    // Verify indexes
    const indexes = await profitPoolsCollection.indexes();
    console.log('📋 Current indexes:');
    indexes.forEach((index, i) => {
      console.log(`   ${i + 1}. ${index.name}: ${JSON.stringify(index.key)}`);
    });
    
    // Optional: Create a sample profit pool for testing
    const sampleExists = await profitPoolsCollection.findOne({ month: '2025-08' });
    if (!sampleExists) {
      console.log('💡 Creating sample profit pool data...');
      
      const sampleProfitPool = {
        city: 'Lagos',
        month: '2025-08',
        totalRevenue: 10000000, // 10 million NGN
        poolAmount: 100000, // 1% = 100,000 Nibia
        geCount: 5,
        amountPerGE: 20000, // 20,000 Nibia each
        distributedTo: [
          {
            userId: null, // Will be populated with real user IDs
            userName: 'Sample GE 1',
            userEmail: 'ge1@example.com',
            nibiaAmount: 20000,
            credited: false,
          },
          {
            userId: null,
            userName: 'Sample GE 2',
            userEmail: 'ge2@example.com',
            nibiaAmount: 20000,
            credited: false,
          },
        ],
        status: 'calculated',
        totalDistributed: 0,
        successfulDistributions: 0,
        failedDistributions: 0,
        metadata: {
          orderCount: 2500,
          averageOrderValue: 4000,
          revenueGrowthPercent: 15.5,
          calculationDuration: 2500,
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      // Only insert if we're in development mode
      if (process.env.NODE_ENV !== 'production') {
        await profitPoolsCollection.insertOne(sampleProfitPool);
        console.log('✅ Created sample profit pool for testing');
      }
    }
    
    // Get collection stats
    const stats = await db.stats();
    const collectionStats = await profitPoolsCollection.stats();
    
    console.log('📈 Collection Statistics:');
    console.log(`   Database: ${db.databaseName}`);
    console.log(`   Collection: profitpools`);
    console.log(`   Documents: ${collectionStats.count || 0}`);
    console.log(`   Size: ${(collectionStats.size || 0) / 1024} KB`);
    console.log(`   Indexes: ${collectionStats.nindexes || 0}`);
    
    console.log('🎉 Profit Pool Collection Migration completed successfully!');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await client.close();
    console.log('🔒 Database connection closed');
  }
}

// Run migration
if (require.main === module) {
  migrateProfitPoolCollection();
}

module.exports = { migrateProfitPoolCollection };
