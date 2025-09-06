const fs = require('fs');
const path = require('path');

// Define the fixes needed for each file
const fixes = {
  'src/modules/referrals/entities/commission.entity.ts': [
    { find: /(@Prop\(\s*{\s*[^}]*?)index:\s*true\s*,?\s*([^}]*}\s*\)\s*\n\s*userId:)/g, replace: '$1$2' },
    { find: /(@Prop\(\s*{\s*[^}]*?)index:\s*true\s*,?\s*([^}]*}\s*\)\s*\n\s*orderId\?:)/g, replace: '$1$2' },
    { find: /(@Prop\(\s*{\s*[^}]*?)index:\s*true\s*,?\s*([^}]*}\s*\)\s*\n\s*referredUserId\?:)/g, replace: '$1$2' },
    { find: /(@Prop\(\s*{\s*[^}]*?)index:\s*true\s*,?\s*([^}]*}\s*\)\s*\n\s*type:)/g, replace: '$1$2' },
    { find: /(@Prop\(\s*{\s*[^}]*?)index:\s*true\s*,?\s*([^}]*}\s*\)\s*\n\s*status:)/g, replace: '$1$2' },
    { find: /(@Prop\(\s*{\s*[^}]*?)index:\s*true\s*,?\s*([^}]*}\s*\)\s*\n\s*city:)/g, replace: '$1$2' },
    { find: /(@Prop\(\s*{\s*[^}]*?)index:\s*true\s*,?\s*([^}]*}\s*\)\s*\n\s*earnedAt:)/g, replace: '$1$2' },
    { find: /(@Prop\(\s*{\s*[^}]*?)index:\s*true\s*,?\s*([^}]*}\s*\)\s*\n\s*createdAt:)/g, replace: '$1$2' }
  ],
  'src/modules/users/entities/user.entity.ts': [
    { find: /(@Prop\(\s*{\s*[^}]*?)index:\s*true\s*,?\s*([^}]*}\s*\)\s*\n\s*referrerId\?:)/g, replace: '$1$2' }
  ]
};

console.log('🔧 Fixing duplicate indexes...\n');

Object.keys(fixes).forEach(filePath => {
  const fullPath = path.join(__dirname, filePath);
  
  if (!fs.existsSync(fullPath)) {
    console.log(`⚠️  File not found: ${filePath}`);
    return;
  }
  
  console.log(`📁 Processing: ${filePath}`);
  
  let content = fs.readFileSync(fullPath, 'utf8');
  let modified = false;
  
  fixes[filePath].forEach(({ find, replace }) => {
    const before = content;
    content = content.replace(find, replace);
    if (content !== before) {
      modified = true;
      console.log('  ✓ Removed duplicate index');
    }
  });
  
  if (modified) {
    // Clean up any trailing commas or spacing issues
    content = content
      .replace(/,(\s*})/g, '$1') // Remove trailing commas before closing braces
      .replace(/{\s*,/g, '{ ') // Remove leading commas after opening braces
      .replace(/,\s*,/g, ','); // Remove double commas
    
    fs.writeFileSync(fullPath, content, 'utf8');
    console.log(`  ✅ Fixed ${filePath}\n`);
  } else {
    console.log(`  ℹ️  No changes needed in ${filePath}\n`);
  }
});

console.log('🎉 Duplicate index fix completed!');
