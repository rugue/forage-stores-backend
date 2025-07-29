// Test script to verify automatic sellerId assignment
// This simulates what happens when you create a product

const { Types } = require('mongoose');

function simulateProductCreation(createProductDto, userId, userRole) {
  console.log('=== Simulating Product Creation ===');
  console.log('Input:');
  console.log('- createProductDto.sellerId:', createProductDto.sellerId || 'NOT PROVIDED');
  console.log('- userId:', userId);
  console.log('- userRole:', userRole);
  console.log('');
  
  try {
    // If user is not admin, set sellerId to current user
    if (userRole !== 'admin' && !createProductDto.sellerId) {
      createProductDto.sellerId = userId;
      console.log('✅ Step 1: sellerId automatically set to userId:', userId);
    } else if (createProductDto.sellerId) {
      console.log('📝 Step 1: sellerId already provided:', createProductDto.sellerId);
    }

    // Only admin can create products for other sellers
    if (userRole !== 'admin' && createProductDto.sellerId && createProductDto.sellerId !== userId) {
      throw new Error('403 Forbidden: You can only create products for yourself');
    } else {
      console.log('✅ Step 2: Permission check passed');
    }

    // Convert sellerId to ObjectId if it's a string
    const productData = {
      ...createProductDto,
      sellerId: createProductDto.sellerId ? createProductDto.sellerId : undefined,
    };
    
    console.log('✅ Step 3: Final productData.sellerId:', productData.sellerId);
    console.log('✅ Result: Product would be saved with sellerId =', productData.sellerId);
    
  } catch (error) {
    console.log('❌ Error:', error.message);
  }
  
  console.log('=====================================\n');
}

// Test scenarios
const userId = '6887e979193e051560861753';

console.log('TEST 1: Regular user creates product WITHOUT sellerId');
simulateProductCreation(
  { name: 'Test Product', price: 100 }, // No sellerId provided
  userId,
  'user'
);

console.log('TEST 2: Regular user tries to create product WITH different sellerId');
simulateProductCreation(
  { name: 'Test Product', sellerId: 'different-user-id', price: 100 },
  userId,
  'user'
);

console.log('TEST 3: Admin creates product WITH specific sellerId');
simulateProductCreation(
  { name: 'Test Product', sellerId: 'another-user-id', price: 100 },
  userId,
  'admin'
);

console.log('TEST 4: Admin creates product WITHOUT sellerId');
simulateProductCreation(
  { name: 'Test Product', price: 100 }, // No sellerId provided
  userId,
  'admin'
);
