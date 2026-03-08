const mongoose = require('mongoose');
require('dotenv').config();

async function checkDatabaseConnection() {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGO_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });

        console.log('✅ Successfully connected to MongoDB.');
        
        // Get connection status
        const state = mongoose.connection.readyState;
        console.log(`Connection state: ${state === 1 ? 'Connected' : 'Not connected'}`);
        
        // Get database information
        const db = mongoose.connection.db;
        const collections = await db.listCollections().toArray();
        console.log('\nAvailable collections:');
        collections.forEach(collection => {
            console.log(`- ${collection.name}`);
        });

    } catch (error) {
        console.error('❌ Database connection error:', error.message);
        process.exit(1);
    } finally {
        // Close the connection
        await mongoose.connection.close();
        process.exit(0);
    }
}

checkDatabaseConnection(); 