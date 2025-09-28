// Run this script in MongoDB Shell to update all restaurants that are missing the website field

// Copy and paste this into MongoDB shell
db.restaurants.updateMany(
  { website: { $exists: false } }, 
  { $set: { website: "" } }
);

// This will add an empty website field to all restaurants that don't have one

// To run manually using mongoose:
const mongoose = require('mongoose');
const Restaurant = require('../models/Restaurant');

async function fixRestaurants() {
  try {
    // Connect to MongoDB
    await mongoose.connect('mongodb://localhost:27017/ceylon-compass', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    
    // Find all restaurants without website field
    const restaurantsToFix = await Restaurant.find({ website: { $exists: false } });
    console.log(`Found ${restaurantsToFix.length} restaurants without website field`);
    
    // Update each restaurant
    for (const restaurant of restaurantsToFix) {
      restaurant.website = '';
      await restaurant.save();
      console.log(`Fixed restaurant: ${restaurant.name}`);
    }
    
    console.log('All restaurants fixed');
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.connection.close();
  }
}

// Uncomment to run this function
// fixRestaurants(); 