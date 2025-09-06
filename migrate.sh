#!/bin/bash

# Migration runner shell script
# This script runs all pending database migrations

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}🔄 Starting database migrations...${NC}"

# Set environment
NODE_ENV=${NODE_ENV:-development}
echo -e "${YELLOW}Environment: ${NODE_ENV}${NC}"

# Check if MongoDB is accessible
echo -e "${YELLOW}📊 Checking database connection...${NC}"

# Load environment variables
if [ -f .env ]; then
  export $(cat .env | grep -v '#' | xargs)
fi

# Run migrations
echo -e "${YELLOW}🚀 Running migrations...${NC}"

# Run each migration script
migrations=(
  "setup-profit-pool-collection.js"
  "add-nibia-withdrawal-to-wallets.js"
  "add-referrer-id-to-users.js"
)

for migration in "${migrations[@]}"; do
  if [ -f "migrations/$migration" ]; then
    echo -e "${YELLOW}Running migration: $migration${NC}"
    node "migrations/$migration"
    
    if [ $? -eq 0 ]; then
      echo -e "${GREEN}✅ Migration completed: $migration${NC}"
    else
      echo -e "${RED}❌ Migration failed: $migration${NC}"
      exit 1
    fi
  else
    echo -e "${YELLOW}⚠️ Migration not found: $migration${NC}"
  fi
done

echo -e "${GREEN}🎉 All migrations completed successfully!${NC}"
