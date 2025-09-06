const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

/**
 * Migration runner script
 * This script runs all pending database migrations
 */

// Colors for console output
const colors = {
  RED: '\x1b[31m',
  GREEN: '\x1b[32m',
  YELLOW: '\x1b[33m',
  NC: '\x1b[0m' // No Color
};

function log(color, message) {
  console.log(`${colors[color]}${message}${colors.NC}`);
}

async function runMigrations() {
  log('GREEN', '🔄 Starting database migrations...');

  // Set environment
  const nodeEnv = process.env.NODE_ENV || 'development';
  log('YELLOW', `Environment: ${nodeEnv}`);

  // Check if MongoDB is accessible
  log('YELLOW', '📊 Checking database connection...');

  // List of migration files to run
  const migrations = [
    'setup-profit-pool-collection.js',
    'add-nibia-withdrawal-to-wallets.js',
    'add-referrer-id-to-users.js'
  ];

  log('YELLOW', '🚀 Running migrations...');

  for (const migration of migrations) {
    const migrationPath = path.join(__dirname, migration);
    
    if (fs.existsSync(migrationPath)) {
      log('YELLOW', `Running migration: ${migration}`);
      
      try {
        execSync(`node "${migrationPath}"`, { 
          stdio: 'inherit',
          env: process.env 
        });
        log('GREEN', `✅ Migration completed: ${migration}`);
      } catch (error) {
        log('RED', `❌ Migration failed: ${migration}`);
        log('RED', error.message);
        process.exit(1);
      }
    } else {
      log('YELLOW', `⚠️ Migration not found: ${migration}`);
    }
  }

  log('GREEN', '🎉 All migrations completed successfully!');
}

// Run migrations if this file is executed directly
if (require.main === module) {
  runMigrations().catch((error) => {
    log('RED', `❌ Migration process failed: ${error.message}`);
    process.exit(1);
  });
}

module.exports = { runMigrations };
