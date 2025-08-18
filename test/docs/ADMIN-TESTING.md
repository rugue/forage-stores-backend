# Admin Module Testing Guide

This guide provides comprehensive information on testing the Forage Store Backend admin module.

## Overview

The admin module tests cover all features from registration to feature-specific tests, ensuring complete functionality and security.

## Test Coverage

The tests cover the following areas:

- **Authentication & Authorization**
  - Admin registration
  - Login
  - Role-based access control

- **User Management**
  - Listing users
  - Getting user details
  - User filtering

- **Wallet Management**
  - Listing wallets
  - Getting wallet details
  - Funding wallets
  - Wiping wallets

- **Analytics**
  - Orders analytics
  - Subscription analytics
  - Commission analytics
  - Time period filtering

- **Category Management**
  - Creating categories
  - Updating categories
  - Deleting categories
  - Listing categories

- **Price History Management**
  - Getting product price history
  - Adding price history records

- **Growth Users Management**
  - Getting growth users by city
  - Detailed stats for growth users
  - Filtering by role

- **Withdrawal Management**
  - Getting pending withdrawals
  - Processing withdrawal decisions
  - Bulk processing withdrawals

- **Referral Commission Override**
  - Overriding commissions
  - Getting commission override history
  - Getting specific referral history

- **Profit Pool Management**
  - Getting all profit pools
  - Getting specific pool details
  - Adjusting pool distributions
  - Generating reports

- **Security & Validation Tests**
  - Authentication requirements
  - Role requirements
  - Input validation
  - Error handling

## Running Tests

You can run the admin tests using our comprehensive test runner script:

```bash
# Make the script executable
chmod +x ./run-admin-tests.sh

# Show help and options
./run-admin-tests.sh --help

# Run all admin tests
./run-admin-tests.sh --all

# Run a specific module test
./run-admin-tests.sh --module wallets

# Run with specific pattern
./run-admin-tests.sh --pattern "fund wallet"

# Run with clean database
./run-admin-tests.sh --all --clean

# Generate coverage report
./run-admin-tests.sh --all --coverage --report
```

## Test Configuration

The admin tests use a specific Jest configuration file at `test/jest-admin.config.json`. This configuration includes:

- Coverage reporting
- HTML report generation
- XML report generation for CI/CD systems
- Jest setup and teardown scripts

## Test Environment

Tests run against a dedicated test database to avoid affecting production data. The environment is configured using:

- `.env.test` file for environment variables
- MongoDB test database
- Mock data generation for testing

## Test Utilities

We provide several utility functions to help with testing:

- `helpers/test.helpers.ts`: General test helper functions
- `helpers/admin-test-setup.ts`: Admin-specific setup and teardown

## Adding New Tests

When adding new admin tests:

1. Add the test to the appropriate describe block in `admin.e2e-spec.ts` or `admin-focused.e2e-spec.ts`
2. If adding a new feature, consider creating a dedicated describe block
3. Update the test runner script if necessary
4. Update this documentation with details of the new tests

## Best Practices

- Test each endpoint for success and failure cases
- Test authorization requirements thoroughly
- Test validation rules for all inputs
- Test edge cases (empty lists, large datasets, etc.)
- Use meaningful test descriptions

## CI/CD Integration

The admin tests are integrated with CI/CD pipelines:

```yaml
# Example CI config snippet
test-admin:
  script:
    - ./run-admin-tests.sh --all --coverage --report
  artifacts:
    paths:
      - coverage/admin
      - reports/
```

## Troubleshooting

Common issues:

- **MongoDB connection errors**: Ensure MongoDB is running on localhost:27017
- **Authentication failures**: Verify test user credentials and JWT configuration
- **Test data issues**: Run with --clean flag to reset test data

For more help, check the logs in the `admin-test-log-*.log` file generated during test runs.

---

Last updated: August 18, 2025
