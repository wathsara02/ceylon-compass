const mongoose = require('mongoose');
const User = require('../models/User');
const bcrypt = require('bcrypt');
require('dotenv').config();

async function createAdminUser() {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGO_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });

        console.log('✅ Connected to MongoDB.');

        // Delete existing admin user if exists
        await User.deleteOne({ username: 'admin' });
        console.log('Removed existing admin user if any.');

        // Create admin user
        const adminUser = new User({
            username: 'admin',
            email: 'admin@example.com',
            password: 'admin123', // This will be hashed by the pre-save middleware
            country: 'Sri Lanka',
            city: 'Colombo',
            role: 'admin'
        });

        await adminUser.save();
        console.log('✅ Admin user created successfully!');
        console.log('Username: admin');
        console.log('Password: admin123');

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await mongoose.connection.close();
        process.exit(0);
    }
}

createAdminUser(); 