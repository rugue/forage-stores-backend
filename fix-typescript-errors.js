// This script will fix the TypeScript errors in the support.service.ts file
const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src/modules/support/support.service.ts');
let content = fs.readFileSync(filePath, 'utf8');

// Replace occurrences of ticket.messages.push(savedMessage._id)
content = content.replace(/ticket\.messages\.push\(savedMessage\._id\)/g, 'ticket.messages.push(this.getDocumentId(savedMessage))');

// Write the updated content back to the file
fs.writeFileSync(filePath, content);

console.log('Successfully fixed TypeScript errors in support.service.ts');
