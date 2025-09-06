const { MongoClient } = require('mongodb');
require('dotenv').config();
const bcrypt = require('bcrypt');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/forage-stores';

/**
 * Script to create an admin user with ACTIVE status
 * This bypasses the email verification requirement for admin accounts
 */
async function createAdminUser() {
  const client = await MongoClient.connect(MONGODB_URI);
  const db = client.db();
  
  try {
    console.log('🔧 Creating admin user...');
    
    // Check if admin already exists
    const existingAdmin = await db.collection('users').findOne({ 
      email: 'admin@forage.com' 
    });
    
    if (existingAdmin) {
      console.log('⚠️ Admin user already exists. Updating status to ACTIVE...');
      
      // Update existing admin to ACTIVE status
      await db.collection('users').updateOne(
        { email: 'admin@forage.com' },
        { 
          $set: { 
            accountStatus: 'active',
            emailVerified: true,
            emailVerificationToken: null,
            emailVerificationExpiry: null
          } 
        }
      );
      
      console.log('✅ Admin user status updated to ACTIVE');
    } else {
      // Hash the admin password
      const adminPassword = 'AdminSecure123!';
      const hashedPassword = await bcrypt.hash(adminPassword, 12);
      
      // Create new admin user
      const adminUser = {
        name: 'System Administrator',
        email: 'admin@forage.com',
        phone: '+2348000000001',
        password: hashedPassword,
        accountType: 'business',
        role: 'admin',
        accountStatus: 'active', // Set to ACTIVE to bypass verification
        city: 'Lagos',
        creditScore: 850,
        emailVerified: true, // Mark as verified
        emailVerificationToken: null,
        emailVerificationExpiry: null,
        passwordResetToken: null,
        passwordResetExpiry: null,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      await db.collection('users').insertOne(adminUser);
      console.log('✅ Admin user created successfully');
    }
    
    // Also create a wallet for the admin
    const adminWallet = await db.collection('wallets').findOne({ 
      userId: await db.collection('users').findOne({ email: 'admin@forage.com' }, { _id: 1 })._id 
    });
    
    if (!adminWallet) {
      const admin = await db.collection('users').findOne({ email: 'admin@forage.com' });
      
      await db.collection('wallets').insertOne({
        userId: admin._id,
        foodMoney: 0,
        foodPoints: 1000, // Give admin some food points
        nibiaBalance: 0,
        canWithdrawNibia: true, // Admin can withdraw
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date()
      });
      
      console.log('✅ Admin wallet created');
    }
    
    console.log('\n🎉 Admin Setup Complete!');
    console.log('📧 Email: admin@forage.com');
    console.log('🔐 Password: AdminSecure123!');
    console.log('🔑 Role: admin');
    console.log('✅ Status: active (ready to login)');
    
  } catch (error) {
    console.error('❌ Error creating admin user:', error);
  } finally {
    await client.close();
  }
}

// Run the script
if (require.main === module) {
  createAdminUser()
    .then(() => {
      console.log('\n🚀 Admin setup completed successfully!');
      process.exit(0);
    })
    .catch(error => {
      console.error('💥 Admin setup failed:', error);
      process.exit(1);
    });
}

module.exports = { createAdminUser };
