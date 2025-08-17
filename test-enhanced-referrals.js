/**
 * Test script to verify the enhanced referrals system
 * Run this after the system is deployed to ensure everything works
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:3000'; // Adjust as needed
const API_URL = `${BASE_URL}/api`;

// Mock user credentials (replace with actual test user tokens)
const ADMIN_TOKEN = 'your-admin-jwt-token';
const USER_TOKEN = 'your-user-jwt-token';

const headers = {
  'Content-Type': 'application/json',
};

const adminHeaders = {
  ...headers,
  'Authorization': `Bearer ${ADMIN_TOKEN}`,
};

const userHeaders = {
  ...headers,
  'Authorization': `Bearer ${USER_TOKEN}`,
};

async function testEnhancedReferrals() {
  console.log('🚀 Testing Enhanced Referrals System...\n');

  try {
    // Test 1: Get growth statistics (admin)
    console.log('1. Testing growth statistics (admin endpoint)...');
    try {
      const growthStats = await axios.get(`${API_URL}/referrals/growth/stats`, {
        headers: adminHeaders,
      });
      console.log('✅ Growth stats:', growthStats.data);
    } catch (error) {
      console.log('❌ Growth stats failed:', error.response?.data || error.message);
    }

    // Test 2: Check user's growth qualification
    console.log('\n2. Testing user growth qualification...');
    try {
      const qualification = await axios.get(`${API_URL}/referrals/growth/qualification`, {
        headers: userHeaders,
      });
      console.log('✅ User qualification:', qualification.data);
    } catch (error) {
      console.log('❌ User qualification failed:', error.response?.data || error.message);
    }

    // Test 3: Get user's commissions
    console.log('\n3. Testing user commissions...');
    try {
      const commissions = await axios.get(`${API_URL}/referrals/commissions`, {
        headers: userHeaders,
      });
      console.log('✅ User commissions:', commissions.data.length, 'commissions found');
    } catch (error) {
      console.log('❌ User commissions failed:', error.response?.data || error.message);
    }

    // Test 4: Get user's commission statistics
    console.log('\n4. Testing user commission statistics...');
    try {
      const commissionStats = await axios.get(`${API_URL}/referrals/commissions/stats`, {
        headers: userHeaders,
      });
      console.log('✅ Commission stats:', commissionStats.data);
    } catch (error) {
      console.log('❌ Commission stats failed:', error.response?.data || error.message);
    }

    // Test 5: Get user's referral stats (existing endpoint)
    console.log('\n5. Testing user referral statistics...');
    try {
      const referralStats = await axios.get(`${API_URL}/referrals/stats`, {
        headers: userHeaders,
      });
      console.log('✅ Referral stats:', referralStats.data);
    } catch (error) {
      console.log('❌ Referral stats failed:', error.response?.data || error.message);
    }

    // Test 6: Generate referral code (existing endpoint)
    console.log('\n6. Testing referral code generation...');
    try {
      const referralCode = await axios.get(`${API_URL}/referrals/generate-code`, {
        headers: userHeaders,
      });
      console.log('✅ Referral code:', referralCode.data);
    } catch (error) {
      console.log('❌ Referral code generation failed:', error.response?.data || error.message);
    }

    // Test 7: Check all qualifications (admin endpoint)
    console.log('\n7. Testing qualification check for all users (admin)...');
    try {
      const qualificationCheck = await axios.post(`${API_URL}/referrals/growth/check-all-qualifications`, {}, {
        headers: adminHeaders,
      });
      console.log('✅ Qualification check results:', qualificationCheck.data);
    } catch (error) {
      console.log('❌ Qualification check failed:', error.response?.data || error.message);
    }

    // Test 8: Process pending commissions (admin endpoint)
    console.log('\n8. Testing pending commission processing (admin)...');
    try {
      const pendingCommissions = await axios.post(`${API_URL}/referrals/admin/process-pending-commissions`, {}, {
        headers: adminHeaders,
      });
      console.log('✅ Processed commissions:', pendingCommissions.data);
    } catch (error) {
      console.log('❌ Pending commission processing failed:', error.response?.data || error.message);
    }

    console.log('\n🎉 Enhanced Referrals System test completed!');

  } catch (error) {
    console.error('💥 Test suite failed:', error.message);
  }
}

// Helper function to create test data
async function createTestData() {
  console.log('🛠️  Creating test data...\n');

  // This would need actual implementation based on your system
  // You might want to create:
  // 1. Test users with different roles
  // 2. Test referrals
  // 3. Test orders
  // 4. Test commissions

  console.log('ℹ️  Test data creation not implemented in this script');
  console.log('   Please manually create test data or implement this function');
}

// Run the test
if (require.main === module) {
  console.log('Enhanced Referrals System Test Suite');
  console.log('===================================\n');
  
  console.log('⚠️  Please ensure:');
  console.log('   1. The server is running');
  console.log('   2. You have valid JWT tokens');
  console.log('   3. Test users and data exist');
  console.log('   4. Database is properly migrated\n');

  // Uncomment to create test data first
  // createTestData().then(() => {
  //   return testEnhancedReferrals();
  // });

  testEnhancedReferrals();
}

module.exports = { testEnhancedReferrals, createTestData };
