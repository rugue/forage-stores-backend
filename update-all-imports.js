const fs = require('fs');
const path = require('path');
const glob = require('glob');

// Import mapping for all entities
const importMappings = {
  // User entities
  "from '../../entities/user.entity'": "from '../users/entities/user.entity'",
  "from '../../../entities/user.entity'": "from '../../users/entities/user.entity'",
  "from './entities/user.entity'": "from '../users/entities/user.entity'",
  
  // Product entities
  "from '../../entities/product.entity'": "from '../products/entities/product.entity'",
  "from '../../../entities/product.entity'": "from '../../products/entities/product.entity'",
  
  // Price lock entities (part of products)
  "from '../../entities/price-lock.entity'": "from '../products/entities/price-lock.entity'",
  "from '../../../entities/price-lock.entity'": "from '../../products/entities/price-lock.entity'",
  
  // Order entities
  "from '../../entities/order.entity'": "from '../orders/entities/order.entity'",
  "from '../../../entities/order.entity'": "from '../../orders/entities/order.entity'",
  
  // Wallet entities
  "from '../../entities/wallet.entity'": "from '../wallets/entities/wallet.entity'",
  "from '../../../entities/wallet.entity'": "from '../../wallets/entities/wallet.entity'",
  
  // Notification entities
  "from '../../entities/notification.entity'": "from '../notifications/entities/notification.entity'",
  "from '../../../entities/notification.entity'": "from '../../notifications/entities/notification.entity'",
  
  // Store entities
  "from '../../entities/store.entity'": "from '../stores/entities/store.entity'",
  "from '../../../entities/store.entity'": "from '../../stores/entities/store.entity'",
  
  // Auction entities
  "from '../../entities/auction.entity'": "from '../auctions/entities/auction.entity'",
  "from '../../../entities/auction.entity'": "from '../../auctions/entities/auction.entity'",
  
  // Delivery entities
  "from '../../entities/delivery.entity'": "from '../delivery/entities/delivery.entity'",
  "from '../../../entities/delivery.entity'": "from '../../delivery/entities/delivery.entity'",
  
  // Rider entities (part of delivery)
  "from '../../entities/rider.entity'": "from '../delivery/entities/rider.entity'",
  "from '../../../entities/rider.entity'": "from '../../delivery/entities/rider.entity'",
  
  // Referral entities
  "from '../../entities/referral.entity'": "from '../referrals/entities/referral.entity'",
  "from '../../../entities/referral.entity'": "from '../../referrals/entities/referral.entity'",
  
  // Subscription entities
  "from '../../entities/subscription.entity'": "from '../subscriptions/entities/subscription.entity'",
  "from '../../../entities/subscription.entity'": "from '../../subscriptions/entities/subscription.entity'",
  
  // Support entities
  "from '../../entities/support-ticket.entity'": "from '../support/entities/support-ticket.entity'",
  "from '../../../entities/support-ticket.entity'": "from '../../support/entities/support-ticket.entity'",
  "from '../../entities/ticket-message.entity'": "from '../support/entities/ticket-message.entity'",
  "from '../../../entities/ticket-message.entity'": "from '../../support/entities/ticket-message.entity'",
};

// Special mappings for auth module (uses different path structure)
const authModuleMappings = {
  "from '../../entities/user.entity'": "from '../users/entities/user.entity'",
};

// Function to update imports in a file
function updateImportsInFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let updated = false;
    
    // Choose the right mapping based on module
    const mappings = filePath.includes('/auth/') ? 
      { ...importMappings, ...authModuleMappings } : 
      importMappings;
    
    // Apply all mappings
    for (const [oldImport, newImport] of Object.entries(mappings)) {
      if (content.includes(oldImport)) {
        content = content.replace(new RegExp(oldImport.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), newImport);
        updated = true;
      }
    }
    
    if (updated) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`✅ Updated: ${filePath}`);
      return true;
    }
    
    return false;
  } catch (error) {
    console.error(`❌ Error updating ${filePath}:`, error.message);
    return false;
  }
}

// Function to find all TypeScript files that might need updates
function findFilesToUpdate() {
  const patterns = [
    'src/modules/**/*.ts',
    'src/modules/**/*.dto.ts',
    'src/modules/**/*.service.ts',
    'src/modules/**/*.controller.ts',
    'src/modules/**/*.module.ts',
    'src/modules/**/*.spec.ts',
  ];
  
  let allFiles = [];
  patterns.forEach(pattern => {
    const files = glob.sync(pattern, { cwd: process.cwd() });
    allFiles = allFiles.concat(files);
  });
  
  // Remove duplicates and filter out files that don't exist
  return [...new Set(allFiles)].filter(file => fs.existsSync(file));
}

// Main execution
function main() {
  console.log('🚀 Starting import statement updates...\n');
  
  const filesToUpdate = findFilesToUpdate();
  console.log(`📁 Found ${filesToUpdate.length} files to check\n`);
  
  let updatedCount = 0;
  let errorCount = 0;
  
  filesToUpdate.forEach(file => {
    try {
      if (updateImportsInFile(file)) {
        updatedCount++;
      }
    } catch (error) {
      console.error(`❌ Error processing ${file}:`, error.message);
      errorCount++;
    }
  });
  
  console.log('\n📊 SUMMARY:');
  console.log(`✅ Files updated: ${updatedCount}`);
  console.log(`❌ Errors: ${errorCount}`);
  console.log(`📄 Total files checked: ${filesToUpdate.length}`);
  
  if (updatedCount > 0) {
    console.log('\n🎉 Import statements successfully updated!');
    console.log('💡 Next steps:');
    console.log('   1. Run: npm run build');
    console.log('   2. Run: npm run test');
    console.log('   3. Fix any remaining compilation errors');
  } else {
    console.log('\n✅ No files needed updates (imports may already be correct)');
  }
}

// Run the script
main();
