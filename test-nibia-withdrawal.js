const axios = require('axios');

// Configuration
const BASE_URL = 'http://localhost:3000';
const TEST_CONFIG = {
  // These need to be replaced with real JWT tokens from your system
  GA_USER_TOKEN: 'your_growth_associate_jwt_token_here',
  GE_USER_TOKEN: 'your_growth_elite_jwt_token_here', 
  ADMIN_TOKEN: 'your_admin_jwt_token_here',
  ADMIN_PASSWORD: 'your_admin_password_here'
};

class WithdrawalSystemTester {
  constructor() {
    this.results = [];
  }

  async makeRequest(method, url, data = null, token = null, expectError = false) {
    try {
      const config = {
        method,
        url: `${BASE_URL}${url}`,
        headers: token ? { 'Authorization': `Bearer ${token}` } : {},
        ...(data && { data })
      };

      const response = await axios(config);
      
      if (!expectError) {
        console.log(`✅ ${method} ${url} - SUCCESS`);
        console.log(`   Response: ${response.status} ${response.statusText}`);
        if (response.data) {
          console.log(`   Data:`, JSON.stringify(response.data, null, 2).substring(0, 200) + '...');
        }
      }
      
      return response.data;
    } catch (error) {
      if (expectError) {
        console.log(`✅ ${method} ${url} - EXPECTED ERROR`);
        console.log(`   Error: ${error.response?.status} ${error.response?.data?.message || error.message}`);
        return error.response?.data;
      } else {
        console.log(`❌ ${method} ${url} - FAILED`);
        console.log(`   Error: ${error.response?.status} ${error.response?.data?.message || error.message}`);
        return null;
      }
    }
  }

  async testUserWithdrawalFlow() {
    console.log('\n🧪 Testing User Withdrawal Flow (GA/GE Users)');
    console.log('=' .repeat(60));

    // Test 1: Create withdrawal request as GA user
    console.log('\n1. Creating withdrawal request as GA user...');
    const withdrawalRequest = await this.makeRequest(
      'POST', 
      '/wallets/withdrawals/request',
      {
        nibiaAmount: 1000,
        userReason: 'Test withdrawal request'
      },
      TEST_CONFIG.GA_USER_TOKEN
    );

    if (withdrawalRequest) {
      this.results.push({ test: 'GA Withdrawal Request', status: 'PASS', id: withdrawalRequest.id });

      // Test 2: Get user's withdrawal requests
      console.log('\n2. Getting user withdrawal requests...');
      await this.makeRequest(
        'GET',
        '/wallets/withdrawals/my-requests',
        null,
        TEST_CONFIG.GA_USER_TOKEN
      );

      // Test 3: Get specific withdrawal request details
      console.log('\n3. Getting specific withdrawal request...');
      await this.makeRequest(
        'GET',
        `/wallets/withdrawals/${withdrawalRequest.id}`,
        null,
        TEST_CONFIG.GA_USER_TOKEN
      );
    }

    // Test 4: Try to create withdrawal as regular user (should fail)
    console.log('\n4. Testing regular user withdrawal (should fail)...');
    await this.makeRequest(
      'POST',
      '/wallets/withdrawals/request',
      { nibiaAmount: 500 },
      'regular_user_token', // This should be a regular user token
      true // Expect error
    );
  }

  async testAdminWithdrawalManagement() {
    console.log('\n🛠️  Testing Admin Withdrawal Management');
    console.log('=' .repeat(60));

    // Test 1: Get all withdrawal requests
    console.log('\n1. Getting all withdrawal requests (admin)...');
    const allRequests = await this.makeRequest(
      'GET',
      '/wallets/withdrawals/admin/all?status=pending',
      null,
      TEST_CONFIG.ADMIN_TOKEN
    );

    // Test 2: Get withdrawal statistics
    console.log('\n2. Getting withdrawal statistics...');
    await this.makeRequest(
      'GET',
      '/wallets/withdrawals/admin/stats',
      null,
      TEST_CONFIG.ADMIN_TOKEN
    );

    // Test 3: Process withdrawal request (if we have one)
    if (allRequests && allRequests.requests && allRequests.requests.length > 0) {
      const requestToProcess = allRequests.requests[0];
      console.log(`\n3. Processing withdrawal request ${requestToProcess.id}...`);
      
      await this.makeRequest(
        'PATCH',
        `/wallets/withdrawals/admin/${requestToProcess.id}/process`,
        {
          action: 'approved',
          adminNotes: 'Test approval - automated test',
          adminPassword: TEST_CONFIG.ADMIN_PASSWORD
        },
        TEST_CONFIG.ADMIN_TOKEN
      );
    }

    // Test 4: Enable withdrawal for a user
    console.log('\n4. Testing manual withdrawal enable...');
    await this.makeRequest(
      'POST',
      '/wallets/withdrawals/admin/enable-withdrawal/test_user_id',
      null,
      TEST_CONFIG.ADMIN_TOKEN
    );
  }

  async testWithdrawalLimits() {
    console.log('\n⚖️  Testing Withdrawal Limits and Validation');
    console.log('=' .repeat(60));

    // Test 1: Try withdrawal above single transaction limit
    console.log('\n1. Testing single transaction limit (should fail)...');
    await this.makeRequest(
      'POST',
      '/wallets/withdrawals/request',
      { nibiaAmount: 150000 }, // Above 100k limit
      TEST_CONFIG.GA_USER_TOKEN,
      true
    );

    // Test 2: Try withdrawal with insufficient balance
    console.log('\n2. Testing insufficient balance (should fail)...');
    await this.makeRequest(
      'POST',
      '/wallets/withdrawals/request',
      { nibiaAmount: 999999 }, // Very high amount
      TEST_CONFIG.GA_USER_TOKEN,
      true
    );

    // Test 3: Try minimum valid withdrawal
    console.log('\n3. Testing minimum withdrawal amount...');
    await this.makeRequest(
      'POST',
      '/wallets/withdrawals/request',
      { nibiaAmount: 1 },
      TEST_CONFIG.GA_USER_TOKEN
    );
  }

  async testGESpecificFeatures() {
    console.log('\n👑 Testing Growth Elite Specific Features');
    console.log('=' .repeat(60));

    // Test 1: Create GE withdrawal request (higher priority)
    console.log('\n1. Creating GE withdrawal request (higher priority)...');
    await this.makeRequest(
      'POST',
      '/wallets/withdrawals/request',
      {
        nibiaAmount: 5000,
        userReason: 'GE priority withdrawal test'
      },
      TEST_CONFIG.GE_USER_TOKEN
    );

    // Test 2: Get GE user requests
    console.log('\n2. Getting GE user withdrawal history...');
    await this.makeRequest(
      'GET',
      '/wallets/withdrawals/my-requests',
      null,
      TEST_CONFIG.GE_USER_TOKEN
    );
  }

  async runAllTests() {
    console.log('🚀 Starting Nibia Withdrawal System Tests');
    console.log('=' .repeat(80));
    
    // Check if tokens are configured
    if (TEST_CONFIG.GA_USER_TOKEN === 'your_growth_associate_jwt_token_here') {
      console.log('❌ Please configure real JWT tokens in TEST_CONFIG before running tests');
      console.log('   You need tokens for GA user, GE user, and admin user');
      return;
    }

    try {
      await this.testUserWithdrawalFlow();
      await this.testAdminWithdrawalManagement();
      await this.testWithdrawalLimits();
      await this.testGESpecificFeatures();

      console.log('\n📊 Test Summary');
      console.log('=' .repeat(40));
      this.results.forEach(result => {
        console.log(`${result.status === 'PASS' ? '✅' : '❌'} ${result.test}`);
      });

    } catch (error) {
      console.error('❌ Test suite failed:', error);
    }
  }

  // Helper method to create test users and get their tokens
  async setupTestEnvironment() {
    console.log('🔧 Setting up test environment...');
    
    // This would typically:
    // 1. Create test GA and GE users
    // 2. Fund their wallets with Nibia
    // 3. Get their authentication tokens
    // 4. Return the tokens for use in tests
    
    console.log('⚠️  Test environment setup not implemented in this demo');
    console.log('   In a real scenario, you would:');
    console.log('   1. Create GA/GE test users via API');
    console.log('   2. Fund their Nibia wallets');
    console.log('   3. Get JWT tokens for authentication');
  }
}

// Test Data Examples
const EXAMPLE_TEST_SCENARIOS = {
  validWithdrawal: {
    nibiaAmount: 1000,
    userReason: 'Emergency cash needed'
  },
  
  invalidWithdrawal: {
    nibiaAmount: 150000, // Above limit
    userReason: 'Large withdrawal attempt'
  },
  
  adminApproval: {
    action: 'approved',
    adminNotes: 'User verified, withdrawal approved',
    adminPassword: 'admin_password'
  },
  
  adminRejection: {
    action: 'rejected', 
    adminNotes: 'Suspicious activity detected',
    adminPassword: 'admin_password'
  }
};

// Run tests if called directly
if (require.main === module) {
  const tester = new WithdrawalSystemTester();
  tester.runAllTests()
    .then(() => console.log('\n✅ All tests completed'))
    .catch(error => console.error('\n❌ Test execution failed:', error));
}

module.exports = { 
  WithdrawalSystemTester,
  EXAMPLE_TEST_SCENARIOS,
  TEST_CONFIG 
};
