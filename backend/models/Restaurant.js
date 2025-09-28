const mongoose = require("mongoose");

const restaurantSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: true,
    trim: true 
  },
  image: { 
    type: String, 
    required: true 
  },
  cuisine: { 
    type: String, 
    required: true 
  },
  country: { 
    type: String, 
    required: true 
  },
  city: { 
    type: String, 
    required: true 
  },
  address: { 
    type: String, 
    required: true 
  },
  description: { 
    type: String,
    required: true
  },
  website: {
    type: String,
    trim: true
  },
  rating: { 
    type: Number, 
    min: 0, 
    max: 5, 
    default: 0 
  },
  contactNumber: { 
    type: String,
    required: true
  },
  images: [{
    type: String
  }],
  openingHours: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'approved'
  },
  reviews: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    rating: Number,
    comment: String,
    date: {
      type: Date,
      default: Date.now
    }
  }],
  createdAt: {
    type: Date,
    default: Date.now
  },
  cloudName: {
    type: String,
    required: true
  },
  uploadPreset: {
    type: String,
    required: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model("Restaurant", restaurantSchema); 