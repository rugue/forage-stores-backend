const fs = require('fs');
const path = require('path');

// Define the import mappings
const importMappings = {
  // User entity mappings
  "from '../../entities/user.entity'": "from '../users/entities/user.entity'",
  "from '../../../entities/user.entity'": "from '../../users/entities/user.entity'",
  
  // Product entity mappings
  "from '../../entities/product.entity'": "from '../products/entities/product.entity'",
  "from '../../../entities/product.entity'": "from '../../products/entities/product.entity'",
  
  // Order entity mappings
  "from '../../entities/order.entity'": "from '../orders/entities/order.entity'",
  "from '../../../entities/order.entity'": "from '../../orders/entities/order.entity'",
  
  // Wallet entity mappings
  "from '../../entities/wallet.entity'": "from '../wallets/entities/wallet.entity'",
  "from '../../../entities/wallet.entity'": "from '../../wallets/entities/wallet.entity'",
  
  // Notification entity mappings
  "from '../../entities/notification.entity'": "from '../notifications/entities/notification.entity'",
  "from '../../../entities/notification.entity'": "from '../../notifications/entities/notification.entity'",
  
  // Auction entity mappings
  "from '../../entities/auction.entity'": "from '../auctions/entities/auction.entity'",
  "from '../../../entities/auction.entity'": "from '../../auctions/entities/auction.entity'",
  
  // Store entity mappings
  "from '../../entities/store.entity'": "from '../stores/entities/store.entity'",
  "from '../../../entities/store.entity'": "from '../../stores/entities/store.entity'",
  
  // Delivery entity mappings
  "from '../../entities/delivery.entity'": "from '../delivery/entities/delivery.entity'",
  "from '../../../entities/delivery.entity'": "from '../../delivery/entities/delivery.entity'",
  
  // Rider entity mappings
  "from '../../entities/rider.entity'": "from '../delivery/entities/rider.entity'",
  "from '../../../entities/rider.entity'": "from '../../delivery/entities/rider.entity'",
  
  // Referral entity mappings
  "from '../../entities/referral.entity'": "from '../referrals/entities/referral.entity'",
  "from '../../../entities/referral.entity'": "from '../../referrals/entities/referral.entity'",
  
  // Subscription entity mappings
  "from '../../entities/subscription.entity'": "from '../subscriptions/entities/subscription.entity'",
  "from '../../../entities/subscription.entity'": "from '../../subscriptions/entities/subscription.entity'",
  
  // Support entity mappings
  "from '../../entities/support-ticket.entity'": "from '../support/entities/support-ticket.entity'",
  "from '../../../entities/support-ticket.entity'": "from '../../support/entities/support-ticket.entity'",
  "from '../../entities/ticket-message.entity'": "from '../support/entities/ticket-message.entity'",
  "from '../../../entities/ticket-message.entity'": "from '../../support/entities/ticket-message.entity'",
  
  // Price lock entity mappings
  "from '../../entities/price-lock.entity'": "from '../products/entities/price-lock.entity'",
  "from '../../../entities/price-lock.entity'": "from '../../products/entities/price-lock.entity'",
};

function updateImportsInFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let updated = false;
    
    for (const [oldImport, newImport] of Object.entries(importMappings)) {
      if (content.includes(oldImport)) {
        content = content.replace(new RegExp(oldImport.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), newImport);
        updated = true;
      }
    }
    
    if (updated) {
      fs.writeFileSync(filePath, content);
      console.log(`Updated imports in: ${filePath}`);
    }
  } catch (error) {
    console.error(`Error updating ${filePath}:`, error.message);
  }
}

function walkDirectory(dir) {
  const files = fs.readdirSync(dir);
  
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory() && !file.includes('node_modules') && !file.includes('.git')) {
      walkDirectory(filePath);
    } else if (file.endsWith('.ts') && !file.endsWith('.d.ts')) {
      updateImportsInFile(filePath);
    }
  }
}

// Start from src directory
const srcDir = path.join(__dirname, 'src');
console.log('Starting import updates...');
walkDirectory(srcDir);
console.log('Import updates completed!');
