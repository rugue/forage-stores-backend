/**
 * Migration to add referrerId field to users collection
 * and create necessary indexes for referral system
 */

const { MongoClient } = require('mongodb');

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/forage';
const DATABASE_NAME = process.env.MONGODB_DATABASE || 'forage';

async function addReferrerIdToUsers() {
  const client = new MongoClient(MONGO_URI);
  
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    
    const db = client.db(DATABASE_NAME);
    const usersCollection = db.collection('users');
    const commissionsCollection = db.collection('commissions');
    
    // Add referrerId field to users collection (will be null for existing users without referrers)
    console.log('Adding referrerId field to users collection...');
    await usersCollection.updateMany(
      { referrerId: { $exists: false } },
      { $set: { referrerId: null } }
    );
    
    // Create indexes for better query performance on users collection
    console.log('Creating indexes on users collection...');
    await usersCollection.createIndex({ referrerId: 1 }, { sparse: true });
    await usersCollection.createIndex({ city: 1 });
    await usersCollection.createIndex({ role: 1 });
    await usersCollection.createIndex({ role: 1, city: 1 });
    
    // Create commissions collection and indexes if it doesn't exist
    console.log('Ensuring commissions collection exists with proper indexes...');
    await commissionsCollection.createIndex({ userId: 1, status: 1 });
    await commissionsCollection.createIndex({ userId: 1, type: 1 });
    await commissionsCollection.createIndex({ userId: 1, city: 1 });
    await commissionsCollection.createIndex({ userId: 1, earnedAt: -1 });
    await commissionsCollection.createIndex({ orderId: 1 }, { sparse: true });
    await commissionsCollection.createIndex({ referredUserId: 1 }, { sparse: true });
    await commissionsCollection.createIndex({ city: 1, earnedAt: -1 });
    await commissionsCollection.createIndex({ status: 1, earnedAt: -1 });
    
    // Migrate existing referrals to set referrerId in users collection
    console.log('Migrating existing referrals to set referrerId in users...');
    const referralsCollection = db.collection('referrals');
    const referrals = await referralsCollection.find({}).toArray();
    
    for (const referral of referrals) {
      await usersCollection.updateOne(
        { _id: referral.referredUserId },
        { $set: { referrerId: referral.referrerId } }
      );
    }
    
    console.log(`Updated ${referrals.length} users with referrer information`);
    console.log('Migration completed successfully!');
    
  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  } finally {
    await client.close();
  }
}

// Run the migration
if (require.main === module) {
  addReferrerIdToUsers()
    .then(() => {
      console.log('Migration script completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Migration script failed:', error);
      process.exit(1);
    });
}

module.exports = { addReferrerIdToUsers };
