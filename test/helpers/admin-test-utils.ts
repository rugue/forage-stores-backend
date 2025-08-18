/**
 * Common utilities for admin tests
 * These can be imported by individual test files
 */

import * as request from 'supertest';
import * as crypto from 'crypto';
import { INestApplication } from '@nestjs/common';
import { Connection } from 'mongoose';

/**
 * Generate a unique ID for this test run
 * Used to mark and identify test data
 */
export function generateTestRunId(): string {
  return `test-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
}

/**
 * Generate a unique email to prevent conflicts
 */
export function generateUniqueEmail(baseEmail: string): string {
  const timestamp = Date.now();
  const randomString = Math.random().toString(36).substring(2, 8);
  return baseEmail.replace('@', `-${timestamp}-${randomString}@`);
}

/**
 * Get token by logging in
 */
export async function getTokenByLogin(
  app: INestApplication, 
  email: string, 
  password: string
): Promise<string | null> {
  try {
    const response = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email, password });
    
    if (response.status === 200) {
      return response.body.accessToken;
    }
    console.error('Login failed:', response.body);
    return null;
  } catch (error) {
    console.error('Login error:', error.message);
    return null;
  }
}

/**
 * Add test data markers
 * This ensures all test data is properly marked for cleanup
 */
export function addTestDataMarkers<T extends Record<string, any>>(data: T): T {
  return {
    ...data,
    isTestData: true,
    testRunId: process.env.ADMIN_TEST_RUN_ID || generateTestRunId()
  };
}

/**
 * Wait for a specified time
 */
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Check if a database is ready for testing
 */
export async function checkDatabaseConnection(connection: Connection): Promise<boolean> {
  try {
    if (connection.readyState !== 1) {
      console.log('Database not connected. Current state:', connection.readyState);
      return false;
    }
    
    // Try a simple operation to verify connection
    await connection.db.admin().ping();
    return true;
  } catch (error) {
    console.error('Database connection error:', error.message);
    return false;
  }
}
