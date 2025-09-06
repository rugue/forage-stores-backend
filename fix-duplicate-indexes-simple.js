#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔧 Fixing duplicate schema indexes...\n');

// Simple function to remove 'index: true' from @Prop decorators where explicit indexes exist
function fixDuplicateIndexes(filePath, propertiesToFix) {
  if (!fs.existsSync(filePath)) {
    console.log(`⚠️  File not found: ${filePath}`);
    return;
  }

  console.log(`📁 Processing: ${path.relative(__dirname, filePath)}`);
  
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;

  propertiesToFix.forEach(propName => {
    // Pattern to match @Prop decorator with index: true followed by the property
    const regex = new RegExp(
      `(@Prop\\s*\\(\\s*{[^}]*?)\\s*,?\\s*index:\\s*true\\s*,?\\s*([^}]*}\\s*\\))\\s*\\n\\s*(${propName}[?]?:)`,
      'g'
    );
    
    const before = content;
    content = content.replace(regex, (match, beforeIndex, afterIndex, propDeclaration) => {
      // Clean up the @Prop decorator by removing index: true
      let cleanedBefore = beforeIndex.trim();
      let cleanedAfter = afterIndex.trim();
      
      // Remove trailing/leading commas
      cleanedAfter = cleanedAfter.replace(/^,\s*/, '').replace(/\s*,$/, '');
      
      if (cleanedBefore.endsWith(',')) {
        cleanedBefore = cleanedBefore.slice(0, -1);
      }
      
      const result = `${cleanedBefore} ${cleanedAfter})\n  ${propDeclaration}`;
      console.log(`  ✓ Removed index: true from ${propName}`);
      return result;
    });
    
    if (content !== before) {
      modified = true;
    }
  });

  if (modified) {
    // Clean up any formatting issues
    content = content
      .replace(/,(\s*})/g, '$1') // Remove trailing commas
      .replace(/{\s*,/g, '{ ') // Remove leading commas
      .replace(/,\s*,/g, ','); // Remove double commas
    
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`  ✅ Fixed duplicate indexes\n`);
  } else {
    console.log(`  ℹ️  No changes needed\n`);
  }
}

// Fix the most problematic files
const basePath = __dirname;

// Commission entity - has the most duplicates
fixDuplicateIndexes(
  path.join(basePath, 'src/modules/referrals/entities/commission.entity.ts'),
  ['userId', 'orderId', 'referredUserId', 'type', 'status', 'city', 'earnedAt']
);

// User entity
fixDuplicateIndexes(
  path.join(basePath, 'src/modules/users/entities/user.entity.ts'),
  ['referrerId']
);

// Order entity
fixDuplicateIndexes(
  path.join(basePath, 'src/modules/orders/entities/order.entity.ts'),
  ['orderNumber', 'userId', 'status']
);

// Credit check entity  
fixDuplicateIndexes(
  path.join(basePath, 'src/modules/credit-scoring/entities/credit-check.entity.ts'),
  ['userId', 'currentScore']
);

// Auction entity
fixDuplicateIndexes(
  path.join(basePath, 'src/modules/auctions/entities/auction.entity.ts'),
  ['productId', 'status', 'startTime', 'endTime', 'winnerId']
);

console.log('🎉 Duplicate index fix completed!');
console.log('\n📝 Summary:');
console.log('- Removed "index: true" from @Prop decorators where explicit schema.index() calls exist');
console.log('- Kept the explicit schema.index() calls for better query performance');
console.log('- This should eliminate most Mongoose duplicate index warnings');
console.log('\n💡 Tip: Restart your server to see the warnings disappear!');
