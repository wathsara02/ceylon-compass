// This script can be run directly with Node.js to immediately clean up past events
require('dotenv').config();
const mongoose = require('mongoose');
const { cleanupPastEvents } = require('../utils/eventCleanup');

// Connect to MongoDB
console.log("Connecting to MongoDB...");
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
  .then(async () => {
    console.log('Connected to MongoDB, running cleanup...');
    
    try {
      // Run the cleanup function
      const result = await cleanupPastEvents();
      
      if (result.error) {
        console.error(`Error during cleanup: ${result.error.message}`);
        process.exit(1);
      }
      
      console.log(`Successfully deleted ${result.deleted} past events`);
    } catch (error) {
      console.error('Unhandled error during cleanup:', error);
      process.exit(1);
    } finally {
      // Close MongoDB connection and exit
      await mongoose.connection.close();
      console.log('MongoDB connection closed');
      process.exit(0);
    }
  })
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  }); 