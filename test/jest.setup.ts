// Jest setup file for e2e tests
import { config } from 'dotenv';

// Load test environment variables
config({ path: '.env.test' });

// Set test timeout
jest.setTimeout(30000);

// Global test constants
global.testConstants = {
  adminPassword: process.env.ADMIN_PASSWORD || 'admin123',
  jwtSecret: process.env.JWT_SECRET || 'test-jwt-secret-key-for-testing-only',
  mongoUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/forage-test-db'
};

// Mock console.log in tests to reduce noise
const originalLog = console.log;
console.log = (...args: any[]) => {
  if (process.env.VERBOSE_TESTS === 'true') {
    originalLog(...args);
  }
};

// Global error handler for unhandled promises
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

afterEach(() => {
  // Reset any module mocks after each test
  jest.clearAllMocks();
});

beforeAll(async () => {
  // Ensure test database is properly set up
  console.log('🚀 Starting e2e test suite...');
});

afterAll(async () => {
  console.log('✅ E2e test suite completed');
});
