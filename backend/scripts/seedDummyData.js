require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const Location = require('../models/Location');
const Restaurant = require('../models/Restaurant');
const Event = require('../models/Event');
const Accommodation = require('../models/Accommodation');

const MONGODB_URI = process.env.MONGO_URI;

if (!MONGODB_URI) {
    console.error("MONGO_URI not set. Please set it in backend/.env");
    process.exit(1);
}

async function seedDB() {
    try {
        console.log("Connecting to database at:", MONGODB_URI);
        await mongoose.connect(MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        console.log('Connected to MongoDB');

        // Create a dummy admin user if not exists
        let adminUser = await User.findOne({ email: 'admin@ceyloncompass.dummy' });
        if (!adminUser) {
            adminUser = await User.create({
                username: 'admin_dummy',
                email: 'admin@ceyloncompass.dummy',
                password: 'password123',
                country: 'Sri Lanka',
                city: 'Colombo',
                role: 'admin'
            });
            console.log('Created dummy admin user');
        }

        // Seed Location
        const locations = [
            {
                country: 'Sri Lanka',
                cities: ['Colombo', 'Kandy', 'Galle', 'Ella', 'Matara', 'Nuwara Eliya']
            }
        ];

        for (const loc of locations) {
            await Location.findOneAndUpdate({ country: loc.country }, loc, { upsert: true });
        }
        console.log('Seeded locations');

        // Seed Restaurant
        await Restaurant.deleteMany({ name: 'The Royal Colombo Cookhouse' });
        await Restaurant.create({
            name: 'The Royal Colombo Cookhouse',
            image: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&q=80',
            cuisine: 'Authentic Sri Lankan',
            country: 'Sri Lanka',
            city: 'Colombo',
            address: '45 Galle Face Terrace, Colombo 03',
            description: 'Experience the real taste of Sri Lanka with our authentic spices and heritage recipes passed down over generations.',
            contactNumber: '+94 11 234 5678',
            openingHours: '11:00 AM - 11:00 PM',
            status: 'approved',
            cloudName: 'dummyCloud',
            uploadPreset: 'dummyPreset',
            images: [
                'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&q=80',
                'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&q=80'
            ],
            rating: 4.8
        });
        console.log('Seeded restaurants');

        // Seed Event
        await Event.deleteMany({ title: 'Galle Literary Festival 2026' });
        await Event.create({
            title: 'Galle Literary Festival 2026',
            description: 'Join authors, thinkers, and artists from around the world to celebrate literature and arts at the historic Galle Fort.',
            country: 'Sri Lanka',
            city: 'Galle',
            address: 'Galle Dutch Fort',
            date: new Date('2026-05-15'),
            time: '09:00 AM',
            organizer: {
                name: 'Galle Arts Council',
                contactNumber: '+94 91 123 4567',
                email: 'info@galleliterary.dummy'
            },
            image: 'https://images.unsplash.com/photo-1544928147-79a2dbc1f389?auto=format&fit=crop&q=80',
            category: 'Arts & Culture',
            price: 2500,
            capacity: 1000,
            createdBy: adminUser._id,
            status: 'approved'
        });
        console.log('Seeded events');

        // Seed Accommodation
        await Accommodation.deleteMany({ name: 'Ella Nine Arches View Resort' });
        await Accommodation.create({
            name: 'Ella Nine Arches View Resort',
            description: 'Wake up to the spectacular view of the Nine Arches Bridge from the comfort of your private luxury villa in the misty hills of Ella.',
            country: 'Sri Lanka',
            city: 'Ella',
            address: 'Demodara, Ella Hills',
            price: 12000,
            priceRange: '$$$',
            type: 'Hotel',
            amenities: ['Free WiFi', 'Breakfast Included', 'Mountain View', 'Hiking Trails', 'Restaurant'],
            images: [
                'https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&q=80',
                'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&q=80'
            ],
            contactNumber: '+94 57 234 5678',
            email: 'reservations@ellaresort.dummy',
            website: 'www.ellaresort.dummy',
            createdBy: adminUser._id,
            status: 'approved'
        });
        console.log('Seeded accommodations');

        console.log("Seeding complete!");
        process.exit(0);
    } catch (error) {
        console.error("Error seeding DB:", error);
        process.exit(1);
    }
}

seedDB();
