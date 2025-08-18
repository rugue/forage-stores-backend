# Forage Stores Backend: Admin E2E Test Suite Guide

## Overview
This document provides guidance on running and maintaining the enhanced E2E test suite for the admin module of Forage Stores Backend.

## Test Architecture

### Key Components
1. **Test Files**
   - `admin.e2e-spec.ts`: Complete admin feature tests
   - `admin-focused.e2e-spec.ts`: Targeted tests for specific features
   
2. **Test Helpers**
   - `test.helpers.ts`: Core test utilities
   - `admin-test-utils.ts`: Admin-specific utilities
   
3. **Global Setup/Teardown**
   - `admin-jest.setup.ts`: Pre-test environment setup
   - `admin-jest.teardown.ts`: Post-test cleanup
   
4. **Runner Scripts**
   - `run-admin-tests.sh`: Main test runner
   - `run-focused-admin-tests.sh`: Quick targeted test runner

## Recent Improvements

### 1. Enhanced User Creation & Authentication
- Unique email generation with timestamps and random strings
- Token refresh mechanism for expired tokens
- Rate limiting handling with exponential backoff
- Improved error reporting for auth failures

### 2. Test Data Isolation
- Unique test run IDs to isolate data between test runs
- Test markers added directly to database records (bypassing API validation)
- Comprehensive data cleanup across multiple collections

### 3. Rate Limiting Prevention
- Automatic delays between API calls
- Exponential backoff for retries on 429 responses
- Configurable retry counts for failed requests

### 4. Test Reliability
- Better error messages for debugging
- Authentication failure recovery
- Automatic cleanup of test data

## Known Issues & Workarounds

### API Validation Rejects Test Markers
The API's validation system (using ValidationPipe with whitelist:true) rejects additional properties like `isTestData` and `testRunId`. 

**Workaround**: The helper functions now:
1. Send only valid data to the API endpoints
2. After successful creation, update the MongoDB documents directly to add test markers

### Rate Limiting
The API implements rate limiting which can affect test runs.

**Workaround**:
- Added delays between requests
- Implemented retry logic with backoff
- Added specific retry logic for 429 responses

## Running Tests

### Full Admin Test Suite
```bash
./run-admin-tests.sh --all
```

### Focused Tests for Specific Features
```bash
./run-focused-admin-tests.sh --testNamePattern="should allow admin to access"
```

### With Database Cleanup
```bash
ADMIN_TEST_CLEAN=true ./run-admin-tests.sh --all
```

### With Seed Data
```bash
ADMIN_TEST_SEED=true ./run-admin-tests.sh --all
```

## Development Guidelines

### Adding New Tests
1. Follow the pattern in existing tests
2. Use the TestHelpers class for consistent data creation and cleanup
3. Add unique test IDs to all created data
4. Use test markers for easy cleanup
5. Add appropriate delays to prevent rate limiting

### Best Practices
1. Always mark test data for cleanup
2. Use unique identifiers for all test entities
3. Implement retry logic for flaky operations
4. Clean up test data after tests
5. Use focused tests during development

## Troubleshooting

### Tests Fail with 401 Unauthorized
- Check token expiration settings
- Verify the auth endpoints are functioning
- Review the makeAuthenticatedRequest implementation

### Tests Fail with 429 Too Many Requests
- Increase delays between requests
- Reduce parallel test execution
- Add more backoff to retry logic

### Test Data Not Being Cleaned Up
- Verify test markers are being added correctly
- Check that cleanup is running with correct filters
- Set ADMIN_TEST_CLEAN=true when running tests
