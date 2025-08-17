const { MongoClient } = require('mongodb');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/forage-stores';

async function addNibiaWithdrawEnabledToWallets() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    
    const db = client.db();
    const walletsCollection = db.collection('wallets');
    const usersCollection = db.collection('users');
    
    // First, add nibiaWithdrawEnabled field to all wallets (default: false)
    console.log('Adding nibiaWithdrawEnabled field to all wallets...');
    const walletUpdateResult = await walletsCollection.updateMany(
      { nibiaWithdrawEnabled: { $exists: false } },
      { $set: { nibiaWithdrawEnabled: false } }
    );
    console.log(`Updated ${walletUpdateResult.modifiedCount} wallets with nibiaWithdrawEnabled: false`);
    
    // Find all GA and GE users
    const gaGeUsers = await usersCollection.find({
      role: { $in: ['growth_associate', 'growth_elite'] }
    }).toArray();
    
    console.log(`Found ${gaGeUsers.length} GA/GE users`);
    
    // Enable withdrawal for GA/GE users
    let enabledCount = 0;
    for (const user of gaGeUsers) {
      const result = await walletsCollection.updateOne(
        { userId: user._id },
        { $set: { nibiaWithdrawEnabled: true } }
      );
      
      if (result.modifiedCount > 0) {
        enabledCount++;
        console.log(`Enabled withdrawal for ${user.role} user: ${user.name} (${user.email})`);
      }
    }
    
    console.log(`\nMigration Summary:`);
    console.log(`- Total wallets processed: ${walletUpdateResult.modifiedCount}`);
    console.log(`- GA/GE users found: ${gaGeUsers.length}`);
    console.log(`- Withdrawal enabled for: ${enabledCount} users`);
    
    // Create indexes for better performance
    console.log('\nCreating indexes...');
    await walletsCollection.createIndex({ nibiaWithdrawEnabled: 1 });
    console.log('Created index on nibiaWithdrawEnabled field');
    
    console.log('\n✅ Migration completed successfully!');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await client.close();
  }
}

// Run the migration
if (require.main === module) {
  addNibiaWithdrawEnabledToWallets()
    .then(() => {
      console.log('Migration script completed');
      process.exit(0);
    })
    .catch(error => {
      console.error('Migration script failed:', error);
      process.exit(1);
    });
}

module.exports = { addNibiaWithdrawEnabledToWallets };
