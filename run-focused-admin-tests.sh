#!/bin/bash

# Generate a unique test ID for this test run to ensure isolation
export ADMIN_TEST_RUN_ID="test-run-$(date +%s)-$(openssl rand -hex 4)"
echo "🔑 Test Run ID: $ADMIN_TEST_RUN_ID"

# Create necessary directories
mkdir -p logs reports

# Set environment variables
export NODE_ENV=test
export ADMIN_TEST_SEED=true
export ADMIN_TEST_CLEAN=true

echo "🧪 Running focused admin tests..."

# Run the tests with Jest
npx jest -c test/jest-admin.config.json --verbose --detectOpenHandles --testMatch "**/admin-focused.e2e-spec.ts" "$@"

# Capture exit code
TEST_EXIT_CODE=$?

echo "📊 Test run complete with exit code: $TEST_EXIT_CODE"

# Generate HTML report if not already done
if [ ! -f "reports/admin-test-report.html" ]; then
  echo "📄 Generating HTML report..."
  npx jest-html-reporter --outputPath="reports/admin-test-report.html"
fi

# Write test run info to log
echo "Test Run ID: $ADMIN_TEST_RUN_ID" > "logs/admin-test-run-$(date +%Y%m%d-%H%M%S).log"
echo "Date: $(date)" >> "logs/admin-test-run-$(date +%Y%m%d-%H%M%S).log"
echo "Exit Code: $TEST_EXIT_CODE" >> "logs/admin-test-run-$(date +%Y%m%d-%H%M%S).log"

exit $TEST_EXIT_CODE
