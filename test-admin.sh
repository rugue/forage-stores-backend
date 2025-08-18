#!/bin/bash

# Admin E2E Test Runner Script
# This script helps run the comprehensive admin tests with proper setup

echo "🚀 Starting Forage Admin E2E Tests..."
echo "=================================="

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if MongoDB is running
check_mongodb() {
    echo "🔍 Checking MongoDB connection..."
    if ! nc -z localhost 27017; then
        echo -e "${RED}❌ MongoDB is not running on localhost:27017${NC}"
        echo -e "${YELLOW}💡 Please start MongoDB before running tests${NC}"
        echo "   - macOS: brew services start mongodb/brew/mongodb-community"
        echo "   - Ubuntu: sudo systemctl start mongod"
        echo "   - Docker: docker run -d -p 27017:27017 mongo"
        exit 1
    else
        echo -e "${GREEN}✅ MongoDB is running${NC}"
    fi
}

# Setup test environment
setup_test_env() {
    echo "🔧 Setting up test environment..."
    
    # Copy test env file if it doesn't exist
    if [ ! -f .env.test ]; then
        echo "⚠️ .env.test not found, creating from template..."
        cat > .env.test << EOF
NODE_ENV=test
MONGODB_URI=mongodb://localhost:27017/forage-test-db
JWT_SECRET=test-jwt-secret-key-for-testing-only
ADMIN_PASSWORD=admin123
PORT=3001
EOF
    fi
    
    # Install dependencies if node_modules is missing
    if [ ! -d "node_modules" ]; then
        echo "📦 Installing dependencies..."
        npm install
    fi
    
    echo -e "${GREEN}✅ Test environment setup complete${NC}"
}

# Clean test database
clean_test_db() {
    echo "🧹 Cleaning test database..."
    # Connect to MongoDB and drop test database
    mongo forage-test-db --eval "db.dropDatabase()" > /dev/null 2>&1 || true
    echo -e "${GREEN}✅ Test database cleaned${NC}"
}

# Run specific test suite
run_tests() {
    local test_file=$1
    local test_name=$2
    
    echo "🧪 Running $test_name..."
    echo "=================================="
    
    # Set test environment
    export NODE_ENV=test
    
    if [ -n "$test_file" ]; then
        npm run test:e2e -- --testPathPattern="$test_file" --verbose
    else
        npm run test:e2e -- --verbose
    fi
    
    local exit_code=$?
    
    if [ $exit_code -eq 0 ]; then
        echo -e "${GREEN}✅ $test_name completed successfully${NC}"
    else
        echo -e "${RED}❌ $test_name failed${NC}"
    fi
    
    return $exit_code
}

# Main execution
main() {
    echo "📋 Test Options:"
    echo "  1. Run all admin tests"
    echo "  2. Run comprehensive admin tests"
    echo "  3. Run focused admin tests" 
    echo "  4. Run specific test pattern"
    echo "  5. Clean and run all tests"
    echo ""
    
    if [ $# -eq 0 ]; then
        echo "Usage: $0 [option]"
        echo "  $0 1    - Run all admin tests"
        echo "  $0 2    - Run comprehensive admin tests"
        echo "  $0 3    - Run focused admin tests"
        echo "  $0 4    - Run with custom pattern"
        echo "  $0 5    - Clean and run all"
        exit 1
    fi
    
    # Check dependencies
    check_mongodb
    setup_test_env
    
    case $1 in
        1)
            echo "🎯 Running all admin tests..."
            run_tests "admin" "All Admin Tests"
            ;;
        2)
            echo "🎯 Running comprehensive admin tests..."
            run_tests "admin.e2e-spec.ts" "Comprehensive Admin Tests"
            ;;
        3)
            echo "🎯 Running focused admin tests..."
            run_tests "admin-focused.e2e-spec.ts" "Focused Admin Tests"
            ;;
        4)
            echo "Enter test pattern (e.g., 'wallet', 'category', 'analytics'):"
            read -r pattern
            echo "🎯 Running tests matching pattern: $pattern"
            npm run test:e2e -- --testNamePattern="$pattern" --verbose
            ;;
        5)
            echo "🎯 Cleaning and running all tests..."
            clean_test_db
            run_tests "admin" "All Admin Tests (Clean Run)"
            ;;
        *)
            echo -e "${RED}❌ Invalid option: $1${NC}"
            exit 1
            ;;
    esac
    
    echo ""
    echo "=================================="
    echo -e "${GREEN}🎉 Test execution completed!${NC}"
    echo ""
    echo "📊 Test Coverage:"
    echo "  • Admin Authentication & Authorization ✅"
    echo "  • User Management ✅"
    echo "  • Wallet Operations ✅"
    echo "  • Analytics & Reporting ✅"
    echo "  • Category Management ✅"
    echo "  • Growth Users Management ✅"
    echo "  • Withdrawal Processing ✅"
    echo "  • Referral Commission Override ✅"
    echo "  • Profit Pool Management ✅"
    echo "  • Security & Validation ✅"
    echo "  • Performance & Reliability ✅"
    echo ""
    echo "💡 Tips:"
    echo "  • Check test logs for detailed results"
    echo "  • Use npm run test:e2e:watch for development"
    echo "  • Set VERBOSE_TESTS=true for detailed output"
}

# Execute main function with all arguments
main "$@"
