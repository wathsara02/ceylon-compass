require('dotenv').config();
const mongoose = require('mongoose');
const Location = require('./models/Location');

const locationsData = [
  {
    country: 'Sri Lanka',
    cities: ['Colombo', 'Kandy', 'Galle', 'Jaffna', 'Anuradhapura', 'Negombo', 'Matara', 'Trincomalee', 'Batticaloa', 'Ratnapura', 'Kurunegala', 'Badulla', 'Mannar', 'Vavuniya', 'Hambantota']
  },
  {
    country: 'India',
    cities: ['Mumbai', 'Delhi', 'Bangalore', 'Chennai', 'Kolkata', 'Hyderabad', 'Pune', 'Ahmedabad', 'Jaipur', 'Surat', 'Lucknow', 'Kanpur', 'Nagpur', 'Indore', 'Thane']
  },
  {
    country: 'Maldives',
    cities: ['Male', 'Addu City', 'Fuvahmulah', 'Kulhudhuffushi', 'Thinadhoo', 'Naifaru', 'Hinnavaru', 'Mahibadhoo', 'Vilufushi', 'Eydhafushi', 'Funadhoo', 'Dhidhdhoo', 'Kudahuvadhoo', 'Veymandoo', 'Thulusdhoo']
  },
  {
    country: 'Thailand',
    cities: ['Bangkok', 'Phuket', 'Chiang Mai', 'Pattaya', 'Krabi', 'Koh Samui', 'Hua Hin', 'Ayutthaya', 'Sukhothai', 'Kanchanaburi', 'Koh Phangan', 'Koh Tao', 'Koh Lanta', 'Koh Chang', 'Koh Phi Phi']
  },
  {
    country: 'Malaysia',
    cities: ['Kuala Lumpur', 'George Town', 'Malacca City', 'Kota Kinabalu', 'Ipoh', 'Johor Bahru', 'Kuching', 'Kota Bharu', 'Miri', 'Alor Setar', 'Kuantan', 'Taiping', 'Seremban', 'Sandakan', 'Kuala Terengganu']
  }
];

async function seedLocations() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    // Clear existing data
    await Location.deleteMany({});
    console.log('Cleared existing locations');

    // Insert new data
    await Location.insertMany(locationsData);
    console.log('Successfully seeded locations data');

    // Disconnect from MongoDB
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  } catch (error) {
    console.error('Error seeding locations:', error);
    process.exit(1);
  }
}

seedLocations(); 