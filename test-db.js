// Simple test to check products and users
const { MongoClient } = require('mongodb');

async function test() {
  try {
    const client = new MongoClient('mongodb://localhost:27017');
    await client.connect();
    console.log('Connected to MongoDB successfully!');
    
    const db = client.db('forage-stores');
    
    // List all databases
    const adminDb = client.db().admin();
    const dbs = await adminDb.listDatabases();
    console.log('Available databases:', dbs.databases.map(db => db.name));
    
    // Check collections in the main database
    const collections = await db.listCollections().toArray();
    console.log('Collections in forage-stores:', collections.map(c => c.name));
    
    // Count documents
    const productCount = await db.collection('products').countDocuments();
    const userCount = await db.collection('users').countDocuments();
    
    console.log(`Products: ${productCount}, Users: ${userCount}`);
    
    // Show first product
    const product = await db.collection('products').findOne({});
    console.log('First product:', product);
    
    // Show first user
    const user = await db.collection('users').findOne({});
    console.log('First user:', user);
    
    await client.close();
  } catch (error) {
    console.error('Error:', error.message);
  }
}

test();
