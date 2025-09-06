#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔧 Fixing duplicate schema indexes safely...');

// Function to safely remove index: true from specific lines
function fixFile(filePath, fixes) {
  if (!fs.existsSync(filePath)) {
    console.log(`⚠️  File not found: ${filePath}`);
    return false;
  }

  console.log(`\n📁 Processing: ${filePath}`);
  
  let content = fs.readFileSync(filePath, 'utf8');
  let lines = content.split('\n');
  let modified = false;

  // Sort fixes by line number in reverse order to avoid line number shifts
  fixes.sort((a, b) => b.line - a.line);

  fixes.forEach(({ line, description }) => {
    const lineIndex = line - 1; // Convert to 0-based index
    
    if (lineIndex >= 0 && lineIndex < lines.length) {
      const originalLine = lines[lineIndex];
      
      if (originalLine.includes('index: true')) {
        // Remove index: true from the line
        let newLine = originalLine.replace(/,?\s*index:\s*true\s*,?/, '');
        
        // Clean up any double commas or trailing commas before closing brace
        newLine = newLine.replace(/,\s*,/g, ',').replace(/,\s*}/g, ' }');
        
        lines[lineIndex] = newLine;
        modified = true;
        console.log(`  ✓ Line ${line}: ${description}`);
      }
    }
  });

  if (modified) {
    fs.writeFileSync(filePath, lines.join('\n'), 'utf8');
    console.log(`  ✅ Fixed ${fixes.length} duplicate indexes`);
    return true;
  } else {
    console.log(`  ℹ️  No changes needed`);
    return false;
  }
}

// Files and their specific fixes based on the warnings
const fileFixes = [
  {
    file: 'src/modules/referrals/entities/commission.entity.ts',
    fixes: [
      { line: 43, description: 'Remove index: true from userId' },
      { line: 52, description: 'Remove index: true from orderId' },
      { line: 61, description: 'Remove index: true from referredUserId' },
      { line: 77, description: 'Remove index: true from type' },
      { line: 86, description: 'Remove index: true from status' },
      { line: 111, description: 'Remove index: true from city' },
      { line: 120, description: 'Remove index: true from earnedAt' }
    ]
  },
  {
    file: 'src/modules/delivery/entities/delivery.entity.ts',
    fixes: [
      { line: 130, description: 'Remove index: true from riderId' },
      { line: 138, description: 'Remove index: true from customerId' },
      { line: 146, description: 'Remove index: true from status' },
      { line: 154, description: 'Remove index: true from paymentStatus' },
      { line: 177, description: 'Remove index: true from orderId' },
      { line: 196, description: 'Remove index: true from acceptanceExpiryTime' }
    ]
  },
  {
    file: 'src/modules/delivery/entities/rider.entity.ts',
    fixes: [
      { line: 208, description: 'Remove index: true from userId' },
      { line: 358, description: 'Remove index: true from status' },
      { line: 366, description: 'Remove index: true from isAvailable' },
      { line: 391, description: 'Remove index: true from isOnDelivery' }
    ]
  },
  {
    file: 'src/modules/auctions/entities/auction.entity.ts',
    fixes: [
      { line: 49, description: 'Remove index: true from productId' },
      { line: 64, description: 'Remove index: true from status' },
      { line: 91, description: 'Remove index: true from startTime' },
      { line: 100, description: 'Remove index: true from endTime' },
      { line: 119, description: 'Remove index: true from winnerId' }
    ]
  },
  {
    file: 'src/modules/orders/entities/order.entity.ts',
    fixes: [
      { line: 538, description: 'Remove index: true from orderNumber' },
      { line: 539, description: 'Remove index: true from userId' }
    ]
  }
];

let totalFixed = 0;

fileFixes.forEach(({ file, fixes }) => {
  const filePath = path.join(__dirname, file);
  if (fixFile(filePath, fixes)) {
    totalFixed++;
  }
});

console.log('\n🎉 Duplicate index fix completed!');
console.log(`📊 Fixed ${totalFixed} files`);
console.log('\n📝 Summary:');
console.log('- Removed "index: true" from @Prop decorators where explicit .index() calls exist');
console.log('- Kept the explicit schema.index() calls for better compound index control');
console.log('- This will eliminate the Mongoose duplicate index warnings');
console.log('\n💡 Next: Restart your server to see the warnings are gone!');
