const { MongoClient, ObjectId } = require('mongodb');

async function fixMissingSellerId() {
  const client = new MongoClient('mongodb://localhost:27017');
  
  try {
    await client.connect();
    const db = client.db('forage-stores');
    
    // Find the user
    const user = await db.collection('users').findOne({});
    if (!user) {
      console.log('No user found');
      return;
    }
    
    console.log('User found:', { id: user._id.toString(), email: user.email });
    
    // Find products without sellerId
    const productsWithoutSeller = await db.collection('products').find({ 
      sellerId: { $exists: false } 
    }).toArray();
    
    console.log('Products without sellerId:', productsWithoutSeller.length);
    
    if (productsWithoutSeller.length === 0) {
      console.log('All products already have sellerId');
      return;
    }
    
    // Update all products without sellerId
    const result = await db.collection('products').updateMany(
      { sellerId: { $exists: false } },
      { $set: { sellerId: user._id } }
    );
    
    console.log(`✅ Updated ${result.modifiedCount} products with sellerId: ${user._id.toString()}`);
    
    // Verify the fix
    const allProducts = await db.collection('products').find({}).toArray();
    console.log('\nAll products now:');
    allProducts.forEach(product => {
      console.log(`- ${product.name}: sellerId = ${product.sellerId ? product.sellerId.toString() : 'MISSING'}`);
    });
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.close();
  }
}

fixMissingSellerId();
