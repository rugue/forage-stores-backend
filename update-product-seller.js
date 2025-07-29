const { MongoClient, ObjectId } = require('mongodb');

async function updateProductSeller() {
  const client = new MongoClient('mongodb://localhost:27017');
  
  try {
    await client.connect();
    const db = client.db('forage-stores'); // Updated database name
    
    // Get the first user (assuming you want to assign the product to the first user)
    const user = await db.collection('users').findOne({});
    if (!user) {
      console.log('No users found. Please create a user first.');
      return;
    }
    
    console.log('Found user:', { id: user._id, email: user.email, name: user.name });
    
    // Get the product without sellerId
    const product = await db.collection('products').findOne({ sellerId: { $exists: false } });
    if (!product) {
      console.log('No product found without sellerId.');
      // Let's also check if there are any products at all
      const anyProduct = await db.collection('products').findOne({});
      if (anyProduct) {
        console.log('Found existing product with sellerId:', anyProduct.sellerId);
        console.log('Product details:', { id: anyProduct._id, name: anyProduct.name });
      } else {
        console.log('No products found in database.');
      }
      return;
    }
    
    console.log('Found product without sellerId:', { id: product._id, name: product.name });
    
    // Update the product with the user's ID as sellerId
    const result = await db.collection('products').updateOne(
      { _id: product._id },
      { $set: { sellerId: user._id } }
    );
    
    if (result.modifiedCount > 0) {
      console.log('✅ Successfully updated product with sellerId:', user._id.toString());
      console.log('Now you can filter by sellerId:', user._id.toString());
    } else {
      console.log('❌ Failed to update product');
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.close();
  }
}

updateProductSeller();
