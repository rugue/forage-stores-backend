const fs = require('fs');
const path = require('path');

// Import mapping for all entities
const importMappings = {
  // User entities
  "from '../../entities/user.entity'": "from '../users/entities/user.entity'",
  "from '../../../entities/user.entity'": "from '../../users/entities/user.entity'",
  
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

// Function to recursively find all TypeScript files
function findTsFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      findTsFiles(filePath, fileList);
    } else if (file.endsWith('.ts') && !file.endsWith('.d.ts')) {
      fileList.push(filePath);
    }
  });
  
  return fileList;
}

// Function to update imports in a file
function updateImportsInFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let updated = false;
    
    // Apply all mappings
    for (const [oldImport, newImport] of Object.entries(importMappings)) {
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

// Main execution
function main() {
  console.log('🚀 Starting import statement updates...\n');
  
  const modulesDir = path.join(process.cwd(), 'src', 'modules');
  
  if (!fs.existsSync(modulesDir)) {
    console.error('❌ src/modules directory not found!');
    return;
  }
  
  const filesToUpdate = findTsFiles(modulesDir);
  console.log(`📁 Found ${filesToUpdate.length} TypeScript files to check\n`);
  
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
