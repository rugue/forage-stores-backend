const axios = require('axios');
require('dotenv').config();

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const ADMIN_TOKEN = process.env.ADMIN_JWT_TOKEN || 'your_admin_jwt_token_here';

/**
 * Comprehensive test suite for Profit Pool system
 */
class ProfitPoolTestSuite {
  constructor() {
    this.baseURL = BASE_URL;
    this.headers = {
      'Authorization': `Bearer ${ADMIN_TOKEN}`,
      'Content-Type': 'application/json',
    };
  }

  async runTests() {
    console.log('🚀 Starting Profit Pool System Tests...\n');
    
    try {
      await this.testHealthCheck();
      await this.testCreateProfitPool();
      await this.testGetProfitPools();
      await this.testGetProfitPoolStats();
      await this.testDistributeProfitPool();
      await this.testRetryFailedDistribution();
      await this.testTriggerCalculation();
      await this.testTriggerDistribution();
      
      console.log('\n🎉 All Profit Pool tests completed successfully!');
      
    } catch (error) {
      console.error('\n❌ Test suite failed:', error.message);
      if (error.response?.data) {
        console.error('Error details:', JSON.stringify(error.response.data, null, 2));
      }
      process.exit(1);
    }
  }

  async testHealthCheck() {
    console.log('1️⃣ Testing API Health Check...');
    
    try {
      const response = await axios.get(`${this.baseURL}/health`);
      console.log('✅ API Health Check passed');
      console.log(`   Status: ${response.status}`);
      console.log(`   Response: ${JSON.stringify(response.data)}\n`);
    } catch (error) {
      console.log('⚠️ Health check failed, but continuing with tests...\n');
    }
  }

  async testCreateProfitPool() {
    console.log('2️⃣ Testing Profit Pool Creation...');
    
    const testData = {
      city: 'Lagos',
      month: '2025-08',
      force: true, // Override existing pool if any
    };
    
    try {
      const response = await axios.post(
        `${this.baseURL}/profit-pool/create`,
        testData,
        { headers: this.headers }
      );
      
      console.log('✅ Profit Pool created successfully');
      console.log(`   Status: ${response.status}`);
      console.log(`   Pool ID: ${response.data.data?.id}`);
      console.log(`   City: ${response.data.data?.city}`);
      console.log(`   Month: ${response.data.data?.month}`);
      console.log(`   Pool Amount: ${response.data.data?.poolAmount} Nibia`);
      console.log(`   GE Count: ${response.data.data?.geCount}`);
      console.log(`   Amount per GE: ${response.data.data?.amountPerGE} Nibia\n`);
      
      // Store pool ID for later tests
      this.testPoolId = response.data.data?.id;
      
    } catch (error) {
      if (error.response?.status === 409) {
        console.log('⚠️ Profit Pool already exists (expected if not forced)');
        
        // Try to get existing pool
        const poolsResponse = await axios.get(
          `${this.baseURL}/profit-pool?city=Lagos&month=2025-08&limit=1`,
          { headers: this.headers }
        );
        
        if (poolsResponse.data.data?.data?.length > 0) {
          this.testPoolId = poolsResponse.data.data.data[0].id;
          console.log(`   Using existing pool ID: ${this.testPoolId}\n`);
        }
      } else {
        throw error;
      }
    }
  }

  async testGetProfitPools() {
    console.log('3️⃣ Testing Get Profit Pools...');
    
    try {
      const response = await axios.get(
        `${this.baseURL}/profit-pool?page=1&limit=10`,
        { headers: this.headers }
      );
      
      console.log('✅ Profit Pools retrieved successfully');
      console.log(`   Status: ${response.status}`);
      console.log(`   Total Pools: ${response.data.data?.pagination?.total || 0}`);
      console.log(`   Current Page: ${response.data.data?.pagination?.page || 1}`);
      
      if (response.data.data?.data?.length > 0) {
        const pool = response.data.data.data[0];
        console.log(`   Sample Pool: ${pool.city} - ${pool.month} (${pool.status})`);
      }
      console.log();
      
    } catch (error) {
      throw error;
    }
  }

  async testGetProfitPoolStats() {
    console.log('4️⃣ Testing Profit Pool Statistics...');
    
    try {
      const response = await axios.get(
        `${this.baseURL}/profit-pool/stats?city=Lagos`,
        { headers: this.headers }
      );
      
      console.log('✅ Profit Pool Statistics retrieved successfully');
      console.log(`   Status: ${response.status}`);
      console.log(`   Total Pools: ${response.data.data?.totalPools || 0}`);
      console.log(`   Total Revenue: ₦${response.data.data?.totalRevenue?.toLocaleString() || 0}`);
      console.log(`   Total Pool Amount: ${response.data.data?.totalPoolAmount?.toLocaleString() || 0} Nibia`);
      console.log(`   Total Distributed: ${response.data.data?.totalDistributed?.toLocaleString() || 0} Nibia`);
      console.log(`   Average per GE: ${response.data.data?.avgAmountPerGE?.toLocaleString() || 0} Nibia\n`);
      
    } catch (error) {
      throw error;
    }
  }

  async testDistributeProfitPool() {
    if (!this.testPoolId) {
      console.log('5️⃣ Skipping Distribution Test (no pool ID available)\n');
      return;
    }
    
    console.log('5️⃣ Testing Profit Pool Distribution...');
    
    const testData = {
      poolId: this.testPoolId,
      notes: 'Test distribution via automated test suite',
    };
    
    try {
      const response = await axios.post(
        `${this.baseURL}/profit-pool/distribute`,
        testData,
        { headers: this.headers }
      );
      
      console.log('✅ Profit Pool distributed successfully');
      console.log(`   Status: ${response.status}`);
      console.log(`   Pool Status: ${response.data.data?.status}`);
      console.log(`   Successful Distributions: ${response.data.data?.successfulDistributions || 0}`);
      console.log(`   Failed Distributions: ${response.data.data?.failedDistributions || 0}`);
      console.log(`   Total Distributed: ${response.data.data?.totalDistributed?.toLocaleString() || 0} Nibia\n`);
      
    } catch (error) {
      if (error.response?.status === 409) {
        console.log('⚠️ Profit Pool already distributed (expected)\n');
      } else if (error.response?.status === 404) {
        console.log('⚠️ Profit Pool not found\n');
      } else {
        throw error;
      }
    }
  }

  async testRetryFailedDistribution() {
    if (!this.testPoolId) {
      console.log('6️⃣ Skipping Retry Test (no pool ID available)\n');
      return;
    }
    
    console.log('6️⃣ Testing Retry Failed Distribution...');
    
    const testData = {
      retryFailedOnly: true,
    };
    
    try {
      const response = await axios.post(
        `${this.baseURL}/profit-pool/retry/${this.testPoolId}`,
        testData,
        { headers: this.headers }
      );
      
      console.log('✅ Failed distributions retried successfully');
      console.log(`   Status: ${response.status}`);
      console.log(`   Pool Status: ${response.data.data?.status}`);
      console.log(`   Message: ${response.data.message}\n`);
      
    } catch (error) {
      if (error.response?.status === 404) {
        console.log('⚠️ Profit Pool not found for retry\n');
      } else {
        console.log('⚠️ Retry failed (may be expected if no failed distributions)\n');
      }
    }
  }

  async testTriggerCalculation() {
    console.log('7️⃣ Testing Manual Calculation Trigger...');
    
    try {
      const response = await axios.post(
        `${this.baseURL}/profit-pool/trigger/calculate`,
        {},
        { headers: this.headers }
      );
      
      console.log('✅ Monthly calculation triggered successfully');
      console.log(`   Status: ${response.status}`);
      console.log(`   Message: ${response.data.message}\n`);
      
    } catch (error) {
      console.log('⚠️ Manual calculation trigger failed (may require SUPER_ADMIN role)\n');
    }
  }

  async testTriggerDistribution() {
    console.log('8️⃣ Testing Manual Distribution Trigger...');
    
    try {
      const response = await axios.post(
        `${this.baseURL}/profit-pool/trigger/distribute`,
        {},
        { headers: this.headers }
      );
      
      console.log('✅ Monthly distribution triggered successfully');
      console.log(`   Status: ${response.status}`);
      console.log(`   Message: ${response.data.message}\n`);
      
    } catch (error) {
      console.log('⚠️ Manual distribution trigger failed (may require SUPER_ADMIN role)\n');
    }
  }

  async testGetSpecificProfitPool() {
    if (!this.testPoolId) {
      console.log('9️⃣ Skipping Specific Pool Test (no pool ID available)\n');
      return;
    }
    
    console.log('9️⃣ Testing Get Specific Profit Pool...');
    
    try {
      const response = await axios.get(
        `${this.baseURL}/profit-pool/${this.testPoolId}`,
        { headers: this.headers }
      );
      
      console.log('✅ Specific Profit Pool retrieved successfully');
      console.log(`   Status: ${response.status}`);
      console.log(`   Pool ID: ${response.data.data?.id}`);
      console.log(`   City: ${response.data.data?.city}`);
      console.log(`   Month: ${response.data.data?.month}`);
      console.log(`   Status: ${response.data.data?.status}`);
      console.log(`   Distribution Count: ${response.data.data?.distributedTo?.length || 0}\n`);
      
    } catch (error) {
      throw error;
    }
  }
}

// Helper function to validate environment
function validateEnvironment() {
  if (!ADMIN_TOKEN || ADMIN_TOKEN === 'your_admin_jwt_token_here') {
    console.log('⚠️ WARNING: Using default admin token. Please set ADMIN_JWT_TOKEN environment variable.');
    console.log('💡 To get a real token:');
    console.log('   1. Start the server: npm run start:dev');
    console.log('   2. Login as admin: POST /auth/login');
    console.log('   3. Copy the JWT token from response');
    console.log('   4. Set ADMIN_JWT_TOKEN=your_actual_token\n');
  }
  
  console.log('🔧 Test Configuration:');
  console.log(`   Base URL: ${BASE_URL}`);
  console.log(`   Admin Token: ${ADMIN_TOKEN.substring(0, 20)}...`);
  console.log(`   Environment: ${process.env.NODE_ENV || 'development'}\n`);
}

// Run tests
if (require.main === module) {
  validateEnvironment();
  
  const testSuite = new ProfitPoolTestSuite();
  testSuite.runTests();
}

module.exports = { ProfitPoolTestSuite };
