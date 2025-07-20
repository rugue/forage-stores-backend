// Integration script for task functions
const fs = require('fs');
const path = require('path');

// Services to be updated with their extensions
const services = [
  {
    main: 'src/modules/subscriptions/subscriptions.service.ts',
    ext: 'src/modules/subscriptions/subscriptions.service.ext.ts',
    methodsToAdd: ['sendPayLaterReminders', 'sendDropReminders']
  },
  {
    main: 'src/modules/auctions/auctions.service.ts',
    ext: 'src/modules/auctions/auctions.service.ext.ts',
    methodsToAdd: ['processEndedAuctions']
  },
  {
    main: 'src/modules/products/products.service.ts',
    ext: 'src/modules/products/products.service.ext.ts',
    methodsToAdd: ['expirePriceLocks']
  },
  {
    main: 'src/modules/notifications/notifications.service.ts',
    ext: 'src/modules/notifications/notifications.service.ext.ts',
    methodsToAdd: [
      'sendPaymentReminder', 
      'sendDropReminder', 
      'sendAuctionWinNotification', 
      'sendAuctionRefundNotification', 
      'sendPriceLockExpiryNotification'
    ]
  }
];

console.log('Starting integration of scheduled task methods...');

services.forEach(service => {
  try {
    if (!fs.existsSync(service.ext)) {
      console.log(`Extension file ${service.ext} does not exist. Skipping.`);
      return;
    }

    // Read the extension file content
    const extContent = fs.readFileSync(service.ext, 'utf8');
    
    // Extract methods to be added
    const methodsCode = service.methodsToAdd.map(methodName => {
      const methodRegex = new RegExp(`async ${methodName}\\([^}]*\\}`, 's');
      const match = extContent.match(methodRegex);
      return match ? match[0] : null;
    }).filter(Boolean);
    
    if (methodsCode.length === 0) {
      console.log(`No methods found in ${service.ext}. Skipping.`);
      return;
    }
    
    // Read the main service file
    let mainContent = fs.readFileSync(service.main, 'utf8');
    
    // Find the end of the class (last closing brace)
    const lastBraceIndex = mainContent.lastIndexOf('}');
    
    if (lastBraceIndex === -1) {
      console.log(`Could not find end of class in ${service.main}. Skipping.`);
      return;
    }
    
    // Insert new methods before the end of the class
    const newContent = mainContent.substring(0, lastBraceIndex) + 
      '\n\n  // Added methods for scheduled tasks\n  ' +
      methodsCode.join('\n\n  ') +
      '\n' +
      mainContent.substring(lastBraceIndex);
    
    // Write the updated content back to the main file
    fs.writeFileSync(service.main, newContent);
    
    console.log(`Updated ${service.main} with ${methodsCode.length} methods from ${service.ext}`);
  } catch (err) {
    console.error(`Error updating ${service.main}:`, err);
  }
});

// Update ProductsModule to include the PriceLock schema
try {
  const productsModulePath = 'src/modules/products/products.module.ts';
  let productsModuleContent = fs.readFileSync(productsModulePath, 'utf8');
  
  // Check if PriceLock is already imported
  if (!productsModuleContent.includes('PriceLock')) {
    // Add import for PriceLock
    productsModuleContent = productsModuleContent.replace(
      "import { Product, ProductSchema } from '../../entities/product.entity';",
      "import { Product, ProductSchema } from '../../entities/product.entity';\nimport { PriceLock, PriceLockSchema } from '../../entities/price-lock.entity';"
    );
    
    // Add schema to forFeature
    productsModuleContent = productsModuleContent.replace(
      "MongooseModule.forFeature([{ name: Product.name, schema: ProductSchema }])",
      "MongooseModule.forFeature([\n      { name: Product.name, schema: ProductSchema },\n      { name: PriceLock.name, schema: PriceLockSchema }\n    ])"
    );
    
    fs.writeFileSync(productsModulePath, productsModuleContent);
    console.log(`Updated ${productsModulePath} with PriceLock schema`);
  }
} catch (err) {
  console.error('Error updating products.module.ts:', err);
}

console.log('Integration of scheduled task methods completed!');
