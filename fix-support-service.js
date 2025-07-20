// Fix for support.service.ts TypeScript errors
const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src/modules/support/support.service.ts');
let content = fs.readFileSync(filePath, 'utf8');

// Add Schema.Types import
content = content.replace(
  'import { Model, Types, Document } from \'mongoose\';',
  'import { Model, Types, Document, Schema } from \'mongoose\';'
);

// Fix getDocumentId method
content = content.replace(
  '  private getDocumentId(doc: any): any {',
  '  private getDocumentId(doc: any): Schema.Types.ObjectId {' 
);

// Fix return statement in getDocumentId
content = content.replace(
  '    return doc;',
  '    return doc as unknown as Schema.Types.ObjectId;'
);

// Fix all push statements
content = content.replace(
  /ticket\.messages\.push\(this\.getDocumentId\(savedMessage\)\)/g,
  'ticket.messages.push(this.getDocumentId(savedMessage))'
);

// Fix User _id access - line 128
content = content.replace(
  'if ((ticket.userId as any)._id && (ticket.userId as any)._id.toString() !== userId && user.role !== UserRole.ADMIN) {',
  'if ((ticket.userId as any)?._id && (ticket.userId as any)._id.toString() !== userId && user.role !== UserRole.ADMIN) {'
);

// Fix User _id access - line 221
content = content.replace(
  'return (message.senderId as any)._id && (message.senderId as any)._id.toString() !== userId && !message.isRead;',
  'return (message.senderId as any)?._id && (message.senderId as any)._id.toString() !== userId && !message.isRead;'
);

// Write the updated content back to the file
fs.writeFileSync(filePath, content);

console.log('Successfully fixed TypeScript errors in support.service.ts');
