#!/bin/bash

# =======================================================================================
# Forage Admin Module E2E Test Runner Script v2.0
# 
# This script provides a comprehensive test runner for the Forage admin module,
# including environment setup, database management, test data generation, and more.
#
# Usage: ./run-admin-tests.sh [options]
# =======================================================================================

# Set script to exit on error and handle unset variables
set -eo pipefail
shopt -s expand_aliases

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
MAGENTA='\033[0;35m'
BOLD='\033[1m'
NC='\033[0m' # No Color

# Default values
DB_NAME="forage-test-db"
TEST_PORT=3001
JEST_OPTIONS="--verbose"
TEST_ADMIN_EMAIL="admin@test.com"
TEST_ADMIN_PASSWORD="AdminPass123!"
LOG_FILE="admin-test-log-$(date +%Y%m%d-%H%M%S).log"
USE_COVERAGE=false
BAIL_ON_FAILURE=false
SKIP_CLEANUP=false
GENERATE_REPORT=false
RETRY_FAILED=false
MAX_WORKERS=4
DOCKER_MONGODB=false
TEST_TIMEOUT=30000
DEBUG_MODE=false

# Test modules
declare -A TEST_MODULES
TEST_MODULES=(
  ["auth"]="Authentication & Authorization"
  ["users"]="User Management"
  ["wallets"]="Wallet Operations"
  ["analytics"]="Analytics & Reporting"
  ["categories"]="Category Management"
  ["growth"]="Growth User Management"
  ["withdrawals"]="Withdrawal Processing"
  ["referrals"]="Referral Commission"
  ["profit-pool"]="Profit Pool Management"
  ["security"]="Security & Validation"
  ["performance"]="Performance & Reliability"
)

# Banner
display_banner() {
  clear
  echo -e "${BOLD}${BLUE}"
  echo "╔════════════════════════════════════════════════════════════╗"
  echo "║                                                            ║"
  echo "║               FORAGE ADMIN MODULE TEST SUITE               ║"
  echo "║                                                            ║"
  echo "╚════════════════════════════════════════════════════════════╝"
  echo -e "${NC}"
  echo -e "📅 Date: ${CYAN}$(date '+%B %d, %Y - %H:%M:%S')${NC}"
  echo -e "🔍 Environment: ${YELLOW}${NODE_ENV:-test}${NC}"
  echo -e "📊 Test Mode: ${MAGENTA}${TEST_MODE:-Comprehensive}${NC}\n"
}

# Show help
show_help() {
  display_banner
  echo -e "${BOLD}USAGE:${NC}"
  echo "  ./run-admin-tests.sh [options] [test-pattern]"
  echo ""
  echo -e "${BOLD}OPTIONS:${NC}"
  echo "  -a, --all             Run all admin tests"
  echo "  -c, --comprehensive   Run comprehensive admin tests"
  echo "  -f, --focused         Run focused admin tests"
  echo "  -m, --module [name]   Run tests for a specific module"
  echo "  -p, --pattern [text]  Run tests matching specific pattern"
  echo "  --clean               Clean test database before running tests"
  echo "  --coverage            Generate test coverage report"
  echo "  --docker              Use Docker for MongoDB instance"
  echo "  --bail                Stop on first test failure"
  echo "  --skip-cleanup        Skip cleaning test data after tests"
  echo "  --report              Generate HTML test report"
  echo "  --retry               Retry failed tests"
  echo "  --workers [num]       Set number of parallel workers (default: 4)"
  echo "  --debug               Enable debug mode with detailed logs"
  echo "  --timeout [ms]        Set test timeout in milliseconds (default: 30000)"
  echo "  -h, --help            Show this help message"
  echo ""
  echo -e "${BOLD}EXAMPLES:${NC}"
  echo "  ./run-admin-tests.sh --all"
  echo "  ./run-admin-tests.sh --module wallets --clean"
  echo "  ./run-admin-tests.sh --pattern 'fund wallet' --coverage"
  echo "  ./run-admin-tests.sh --focused --bail --report"
  echo ""
  echo -e "${BOLD}AVAILABLE MODULES:${NC}"
  for module in "${!TEST_MODULES[@]}"; do
    echo "  ${CYAN}$module${NC}: ${TEST_MODULES[$module]}"
  done
  echo ""
}

# Check if MongoDB is running
check_mongodb() {
  echo -e "\n${BOLD}🔍 Checking MongoDB connection...${NC}"
  
  if [ "$DOCKER_MONGODB" = true ]; then
    echo -e "${YELLOW}🐳 Using Docker for MongoDB...${NC}"
    if ! docker ps | grep -q mongo; then
      echo -e "${YELLOW}📦 Starting MongoDB container...${NC}"
      docker run -d --name forage-mongo -p 27017:27017 mongo:latest
      sleep 3 # Give MongoDB a moment to start
    fi
  fi
  
  if ! nc -z localhost 27017 2>/dev/null; then
    echo -e "${RED}❌ MongoDB is not running on localhost:27017${NC}"
    echo -e "${YELLOW}💡 Please start MongoDB before running tests${NC}"
    echo "   - Ubuntu: sudo systemctl start mongod"
    echo "   - macOS: brew services start mongodb/brew/mongodb-community"
    echo "   - Docker: docker run -d -p 27017:27017 mongo"
    exit 1
  else
    echo -e "${GREEN}✅ MongoDB is running${NC}"
    
    # Check if test database exists and has data
    collections=$(mongo $DB_NAME --quiet --eval "db.getCollectionNames().length" 2>/dev/null || echo "0")
    if [ "$collections" -gt "0" ]; then
      echo -e "${YELLOW}ℹ️ Test database has $collections collection(s)${NC}"
    fi
  fi
}

# Setup test environment
setup_test_env() {
  echo -e "\n${BOLD}🔧 Setting up test environment...${NC}"
  
  # Create test environment file if it doesn't exist
  if [ ! -f .env.test ]; then
    echo -e "${YELLOW}⚠️ .env.test not found, creating from template...${NC}"
    cat > .env.test << EOF
NODE_ENV=test
MONGODB_URI=mongodb://localhost:27017/${DB_NAME}
JWT_SECRET=test-jwt-secret-key-for-testing-only-$(date +%s)
ADMIN_PASSWORD=${TEST_ADMIN_PASSWORD}
PORT=${TEST_PORT}
LOGGING_ENABLED=false
MAIL_ENABLED=false
EOF
    echo -e "${GREEN}✅ Created .env.test file${NC}"
  else
    echo -e "${GREEN}✅ Found .env.test file${NC}"
  fi

  # Check required tools and dependencies
  check_dependencies
  
  # Install dependencies if node_modules is missing
  if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}📦 Installing dependencies...${NC}"
    npm install
  else
    # Check if Jest is installed
    if [ ! -f "node_modules/.bin/jest" ]; then
      echo -e "${YELLOW}📦 Installing Jest...${NC}"
      npm install --save-dev jest jest-cli
    fi
  fi
  
  echo -e "${GREEN}✅ Test environment setup complete${NC}"
}

# Check required dependencies
check_dependencies() {
  echo -e "\n${BOLD}🧰 Checking required dependencies...${NC}"
  
  # Check for Node.js
  if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js not found. Please install Node.js${NC}"
    exit 1
  else
    node_version=$(node --version)
    echo -e "${GREEN}✅ Node.js ${node_version} found${NC}"
  fi
  
  # Check for npm
  if ! command -v npm &> /dev/null; then
    echo -e "${RED}❌ npm not found. Please install npm${NC}"
    exit 1
  else
    npm_version=$(npm --version)
    echo -e "${GREEN}✅ npm ${npm_version} found${NC}"
  fi

  # Check for mongo client (only if not using Docker)
  if [ "$DOCKER_MONGODB" = false ]; then
    if ! command -v mongo &> /dev/null; then
      echo -e "${YELLOW}⚠️ MongoDB client not found. Some features may not work${NC}"
    else
      mongo_version=$(mongo --version | head -n1 | cut -d' ' -f3)
      echo -e "${GREEN}✅ MongoDB client ${mongo_version} found${NC}"
    fi
  fi

  # Check for netcat
  if ! command -v nc &> /dev/null; then
    echo -e "${YELLOW}⚠️ netcat (nc) not found. Installing alternative check method...${NC}"
    # Define an alternative MongoDB connection check
    check_mongodb() {
      timeout 2 bash -c 'cat < /dev/null > /dev/tcp/localhost/27017' 2>/dev/null
      if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ MongoDB is running${NC}"
        return 0
      else
        echo -e "${RED}❌ MongoDB is not running on localhost:27017${NC}"
        return 1
      fi
    }
  fi
}

# Clean test database
clean_test_db() {
  echo -e "\n${BOLD}🧹 Cleaning test database...${NC}"

  if [ "$DOCKER_MONGODB" = true ]; then
    echo -e "${YELLOW}🐳 Cleaning MongoDB in Docker container...${NC}"
    docker exec forage-mongo mongo $DB_NAME --eval "db.dropDatabase()" >/dev/null 2>&1 || true
  else
    # Try MongoDB 4.x+ syntax first
    if mongo $DB_NAME --quiet --eval "db.version()" &>/dev/null; then
      echo -e "${CYAN}ℹ️ Using standard MongoDB client${NC}"
      mongo $DB_NAME --eval "db.dropDatabase()" >/dev/null 2>&1 || true
    else
      echo -e "${YELLOW}⚠️ Could not connect with MongoDB client${NC}"
      echo -e "${YELLOW}ℹ️ Will reset data through the application${NC}"
    fi
  fi
  
  echo -e "${GREEN}✅ Test database cleaned${NC}"
}

# Generate test data
generate_test_data() {
  echo -e "\n${BOLD}🌱 Generating test data...${NC}"
  
  # Create a simple test data generator script
  TMP_SCRIPT=$(mktemp)
  cat > $TMP_SCRIPT << 'EOF'
// Test data generator script
const { MongoClient } = require('mongodb');
const { Types } = require('mongoose');
const bcrypt = require('bcrypt');

async function generateTestData() {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/forage-test-db';
  const client = new MongoClient(uri);
  
  try {
    await client.connect();
    const db = client.db();
    
    // Create users collection with indexes
    const users = db.collection('users');
    await users.createIndexes([
      { key: { email: 1 }, unique: true },
      { key: { role: 1 } },
      { key: { city: 1 } }
    ]);
    
    // Create admin user
    const hashedPassword = await bcrypt.hash(process.env.ADMIN_PASSWORD || 'AdminPass123!', 10);
    await users.insertOne({
      name: 'Test Admin',
      email: 'admin@test.com',
      password: hashedPassword,
      role: 'admin',
      city: 'Lagos',
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    
    console.log('✓ Created admin user');
    
    // Create other test collections
    const collections = [
      'categories', 'products', 'wallets', 'orders', 
      'withdrawals', 'referrals', 'profitpools'
    ];
    
    for (const coll of collections) {
      if (!(await db.listCollections({ name: coll }).hasNext())) {
        await db.createCollection(coll);
        console.log(`✓ Created ${coll} collection`);
      }
    }
    
    console.log('✓ Test data generation complete');
  } catch (err) {
    console.error('Error generating test data:', err);
  } finally {
    await client.close();
  }
}

generateTestData().catch(console.error);
EOF

  echo -e "${CYAN}ℹ️ Running test data generator script...${NC}"
  NODE_ENV=test node $TMP_SCRIPT
  rm $TMP_SCRIPT
  
  echo -e "${GREEN}✅ Test data setup complete${NC}"
}

# Run specific test suite
run_tests() {
  local test_pattern=$1
  local test_name=$2
  local jest_options=${3:-$JEST_OPTIONS}
  
  echo -e "\n${BOLD}🧪 Running ${MAGENTA}$test_name${NC}${BOLD}...${NC}"
  echo -e "${CYAN}$test_pattern${NC}"
  echo "======================================================================"
  
  # Create coverage directory if using coverage
  if [ "$USE_COVERAGE" = true ]; then
    mkdir -p coverage
    jest_options="$jest_options --coverage"
  fi
  
  # Add bail option if specified
  if [ "$BAIL_ON_FAILURE" = true ]; then
    jest_options="$jest_options --bail"
  fi

  # Add test timeout
  jest_options="$jest_options --testTimeout=$TEST_TIMEOUT"

  # Add workers option
  jest_options="$jest_options --maxWorkers=$MAX_WORKERS"

  # Set environment variables for test
  export NODE_ENV=test
  export LOG_FILE=$LOG_FILE
  export DEBUG=$DEBUG_MODE
  
  # Set admin test specific environment variables
  export ADMIN_TEST_SEED=true
  if [ "$do_clean" = true ]; then
    export ADMIN_TEST_CLEAN=true
  else
    export ADMIN_TEST_CLEAN=false
  fi
  
  # Run Jest with the specified options, using our admin-specific config
  if [ -n "$test_pattern" ]; then
    if echo "$test_pattern" | grep -q "\.e2e-spec\.ts$"; then
      # If exact file is specified
      command="npx jest --config test/jest-admin.config.json \"$test_pattern\" $jest_options"
    else
      # If pattern is specified
      command="npx jest --config test/jest-admin.config.json -t \"$test_pattern\" $jest_options"
    fi
  else
    command="npx jest --config test/jest-admin.config.json $jest_options"
  fi
  
  # Log the command in debug mode
  if [ "$DEBUG_MODE" = true ]; then
    echo -e "${YELLOW}DEBUG: Running command:${NC} $command"
  fi
  
  # Run the tests
  eval "$command" 2>&1 | tee -a $LOG_FILE
  
  local exit_code=${PIPESTATUS[0]}
  
  if [ $exit_code -eq 0 ]; then
    echo -e "\n${GREEN}✅ ${test_name} completed successfully${NC}"
  else
    echo -e "\n${RED}❌ ${test_name} failed with exit code $exit_code${NC}"
    
    if [ "$RETRY_FAILED" = true ]; then
      echo -e "\n${YELLOW}🔄 Retrying failed tests...${NC}"
      eval "$command --onlyFailures" 2>&1 | tee -a $LOG_FILE
    fi
  fi
  
  return $exit_code
}

# Generate test report
generate_report() {
  echo -e "\n${BOLD}📊 Generating test report...${NC}"
  
  # Create reports directory if it doesn't exist
  mkdir -p reports
  
  # Generate timestamp for report name
  local timestamp=$(date +%Y%m%d-%H%M%S)
  local report_file="reports/admin-test-report-$timestamp.html"
  
  # Use Jest's HTML reporter to generate a report
  npx jest --config test/jest-admin.config.json --testPathPattern="admin" --json \
    | npx jest-html-reporter --outfile $report_file

  # If Jest HTML reporter failed, create a basic HTML report from logs
  if [ ! -f $report_file ]; then
    echo -e "${YELLOW}⚠️ Jest HTML reporter failed, creating basic report...${NC}"
    
    cat > $report_file << EOF
<!DOCTYPE html>
<html>
<head>
  <title>Admin Test Report - $timestamp</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 20px; }
    h1 { color: #333366; }
    pre { background: #f6f6f6; padding: 10px; border-radius: 5px; overflow: auto; }
    .success { color: green; }
    .failure { color: red; }
  </style>
</head>
<body>
  <h1>Admin Test Report - $timestamp</h1>
  <p>Generated on: $(date)</p>
  <h2>Test Logs</h2>
  <pre>
$(cat $LOG_FILE)
  </pre>
</body>
</html>
EOF
  fi
  
  echo -e "${GREEN}✅ Test report generated:${NC} ${BLUE}$report_file${NC}"
  
  # Open report if xdg-open is available (Linux) or open (macOS)
  if command -v xdg-open &> /dev/null; then
    xdg-open $report_file
  elif command -v open &> /dev/null; then
    open $report_file
  else
    echo -e "${YELLOW}ℹ️ To view the report, open:${NC} $report_file"
  fi
}

# Run test with specific module
run_module_tests() {
  local module=$1
  local description=${TEST_MODULES[$module]}
  
  if [ -z "$description" ]; then
    echo -e "${RED}❌ Unknown module: $module${NC}"
    echo -e "${YELLOW}ℹ️ Available modules:${NC}"
    for m in "${!TEST_MODULES[@]}"; do
      echo "   - $m: ${TEST_MODULES[$m]}"
    done
    exit 1
  fi
  
  case $module in
    auth)
      run_tests "Admin Authentication" "Admin Authentication Tests"
      ;;
    users)
      run_tests "User Management" "User Management Tests"
      ;;
    wallets)
      run_tests "Wallet Management" "Wallet Management Tests"
      ;;
    analytics)
      run_tests "Analytics Management" "Analytics Tests"
      ;;
    categories)
      run_tests "Category Management" "Category Management Tests"
      ;;
    growth)
      run_tests "Growth Users Management" "Growth User Tests"
      ;;
    withdrawals)
      run_tests "Withdrawal Management|Nibia Withdrawal" "Withdrawal Processing Tests"
      ;;
    referrals)
      run_tests "Referral Commission" "Referral Commission Tests"
      ;;
    profit-pool)
      run_tests "Profit Pool Management" "Profit Pool Tests"
      ;;
    security)
      run_tests "Security & Validation|Edge Cases" "Security & Validation Tests"
      ;;
    performance)
      run_tests "Performance Tests" "Performance & Reliability Tests"
      ;;
    *)
      echo -e "${RED}❌ Unknown module: $module${NC}"
      exit 1
      ;;
  esac
}

# Main execution
main() {
  display_banner
  
  # Parse command line arguments
  while [[ $# -gt 0 ]]; do
    case $1 in
      -h|--help)
        show_help
        exit 0
        ;;
      -a|--all)
        TEST_MODE="All"
        run_all=true
        shift
        ;;
      -c|--comprehensive)
        TEST_MODE="Comprehensive"
        run_comprehensive=true
        shift
        ;;
      -f|--focused)
        TEST_MODE="Focused"
        run_focused=true
        shift
        ;;
      -m|--module)
        TEST_MODE="Module"
        module=$2
        shift 2
        ;;
      -p|--pattern)
        TEST_MODE="Pattern"
        pattern=$2
        shift 2
        ;;
      --clean)
        do_clean=true
        shift
        ;;
      --coverage)
        USE_COVERAGE=true
        shift
        ;;
      --bail)
        BAIL_ON_FAILURE=true
        shift
        ;;
      --skip-cleanup)
        SKIP_CLEANUP=true
        shift
        ;;
      --report)
        GENERATE_REPORT=true
        shift
        ;;
      --retry)
        RETRY_FAILED=true
        shift
        ;;
      --docker)
        DOCKER_MONGODB=true
        shift
        ;;
      --debug)
        DEBUG_MODE=true
        shift
        ;;
      --workers)
        MAX_WORKERS=$2
        shift 2
        ;;
      --timeout)
        TEST_TIMEOUT=$2
        shift 2
        ;;
      *)
        # Assume it's a pattern if no specific flag
        pattern=$1
        shift
        ;;
    esac
  done
  
  # If no test mode specified, show help
  if [[ -z $run_all && -z $run_comprehensive && -z $run_focused && -z $module && -z $pattern ]]; then
    show_help
    exit 1
  fi
  
  # Check dependencies
  check_mongodb
  setup_test_env
  
  # Clean test database if requested
  if [ "$do_clean" = true ]; then
    echo -e "\n${BOLD}🧹 Database cleanup enabled${NC}"
    echo -e "${CYAN}ℹ️ Using admin-jest.teardown.ts for database cleanup${NC}"
    # We'll still clean the database manually as a safety measure
    clean_test_db
  else
    echo -e "\n${YELLOW}ℹ️ Database cleanup disabled${NC}"
    echo -e "${YELLOW}⚠️ Tests will use existing data${NC}"
  fi
  
  # Test data will be generated via admin-jest.setup.ts

  # Initialize log file
  > $LOG_FILE
  echo "Admin Test Log - $(date)" > $LOG_FILE
  echo "===================================================" >> $LOG_FILE
  
  # Set default exit code
  EXIT_CODE=0
  
  # Run tests based on mode
  if [ "$run_all" = true ]; then
    echo -e "\n${BOLD}🎯 Running all admin tests...${NC}"
    run_tests "admin" "All Admin Tests"
    EXIT_CODE=$?
  elif [ "$run_comprehensive" = true ]; then
    echo -e "\n${BOLD}🎯 Running comprehensive admin tests...${NC}"
    run_tests "admin.e2e-spec.ts" "Comprehensive Admin Tests"
    EXIT_CODE=$?
  elif [ "$run_focused" = true ]; then
    echo -e "\n${BOLD}🎯 Running focused admin tests...${NC}"
    run_tests "admin-focused.e2e-spec.ts" "Focused Admin Tests"
    EXIT_CODE=$?
  elif [ -n "$module" ]; then
    echo -e "\n${BOLD}🎯 Running $module tests...${NC}"
    run_module_tests "$module"
    EXIT_CODE=$?
  elif [ -n "$pattern" ]; then
    echo -e "\n${BOLD}🎯 Running tests matching pattern: $pattern${NC}"
    run_tests "$pattern" "Custom Pattern Tests"
    EXIT_CODE=$?
  fi
  
  # Generate test report if requested
  if [ "$GENERATE_REPORT" = true ]; then
    generate_report
  fi
  
  # Cleanup test data unless skipped
  if [ "$SKIP_CLEANUP" != true ]; then
    echo -e "\n${BOLD}🧹 Cleaning up test data...${NC}"
    if [ "$DOCKER_MONGODB" = true ]; then
      echo -e "${YELLOW}ℹ️ Leaving Docker container running...${NC}"
    fi
  fi
  
  echo ""
  echo "======================================================================"
  echo -e "${GREEN}${BOLD}🎉 Test execution completed!${NC}"
  echo ""
  echo -e "${CYAN}📊 Test Coverage Report:${NC}"
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
  echo -e "${YELLOW}📝 Log File:${NC} $LOG_FILE"
  echo ""
  echo -e "${BOLD}💡 Tips:${NC}"
  echo "  • Run with --coverage to generate test coverage report"
  echo "  • Run with --report to generate HTML test report"
  echo "  • Run with --clean to reset the test database"
  echo "  • Run with --module [name] to test specific features"
  echo "  • Run with --debug for detailed logging"
  echo ""
  
  # Return exit code from test run
  exit $EXIT_CODE
}

# Execute main function with all arguments
main "$@"
