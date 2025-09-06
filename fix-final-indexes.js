#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔧 Final fix for remaining duplicate schema indexes...');

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
    console.log(`  ✅ Fixed ${fixes.filter(fix => fix.line).length} duplicate indexes`);
    return true;
  } else {
    console.log(`  ℹ️  No changes needed`);
    return false;
  }
}

// Final comprehensive fixes
const finalFixes = [
  {
    file: 'src/modules/auctions/entities/auction.entity.ts',
    fixes: [
      { line: 165, description: 'Remove index: true from currentTopBidder' },
      { line: 180, description: 'Remove index: true from endTime' },
      { line: 187, description: 'Remove index: true from startTime' },
      { line: 195, description: 'Remove index: true from status' },
      { line: 247, description: 'Remove index: true from winnerId' },
      { line: 267, description: 'Remove index: true from createdAt' }
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
  }
];

let totalFixed = 0;

finalFixes.forEach(({ file, fixes }) => {
  const filePath = path.join(__dirname, file);
  if (fixFile(filePath, fixes)) {
    totalFixed++;
  }
});

console.log('\n🎉 Final duplicate index fix completed!');
console.log(`📊 Fixed ${totalFixed} files`);
console.log('\n📝 Summary:');
console.log('- Completed removal of all "index: true" from @Prop decorators');
console.log('- Kept the explicit schema.index() calls for better compound index control');
console.log('- This should eliminate ALL Mongoose duplicate index warnings');
console.log('\n💡 Next: Restart your server - warnings should be completely gone!');
