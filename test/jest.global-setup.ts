// Global setup for e2e tests
export default async function globalSetup() {
  // Set test environment variables
  process.env.NODE_ENV = 'test';
  process.env.ADMIN_PASSWORD = 'admin123'; // Test admin password
  process.env.JWT_SECRET = 'test-jwt-secret-key-for-testing-only';
  process.env.MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/forage-test-db';
  
  console.log('🧪 Test environment setup complete');
  console.log('📦 MongoDB URI:', process.env.MONGODB_URI);
}
