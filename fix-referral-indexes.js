#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔧 Fixing remaining duplicate schema indexes in referral entity...');

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

// Fix the referral entity
const referralFixes = {
  file: 'src/modules/referrals/entities/referral.entity.ts',
  fixes: [
    { line: 35, description: 'Remove index: true from referrerId' },
    { line: 56, description: 'Remove index: true from referredUserId' },
    { line: 85, description: 'Remove index: true from status' },
    { line: 113, description: 'Remove index: true from tier' },
    { line: 122, description: 'Remove index: true from expiryDate' },
    { line: 130, description: 'Remove index: true from referralCode' },
    { line: 144, description: 'Remove index: true from orderId' },
    { line: 151, description: 'Remove index: true from referredUserId (second occurrence)' },
    { line: 189, description: 'Remove index: true from userId' },
    { line: 196, description: 'Remove index: true from expiresAt' },
    { line: 217, description: 'Remove index: true from createdAt' }
  ]
};

const filePath = path.join(__dirname, referralFixes.file);
const wasFixed = fixFile(filePath, referralFixes.fixes);

console.log('\n🎉 Referral entity duplicate index fix completed!');
if (wasFixed) {
  console.log('📊 Fixed referral.entity.ts');
}
console.log('\n📝 Summary:');
console.log('- Removed "index: true" from @Prop decorators in referral entity');
console.log('- Kept the explicit schema.index() calls for better compound index control');
console.log('- This will eliminate the remaining Mongoose duplicate index warnings');
console.log('\n💡 Next: Restart your server to see all warnings are gone!');
