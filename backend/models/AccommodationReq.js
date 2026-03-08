const mongoose = require("mongoose");
const User = require('./User');

const accommodationReqSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  type: {
    type: String,
    required: true,
    enum: ['hotel', 'apartment', 'resort', 'hostel', 'guesthouse']
  },
  location: {
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
    }
  },
  price: {
    type: Number,
    required: true
  },
  capacity: {
    type: Number,
    required: true
  },
  amenities: [{
    type: String
  }],
  images: [{
    type: String,
    required: true
  }],
  contactNumber: {
    type: String,
    required: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Add index for createdBy field for better performance
accommodationReqSchema.index({ createdBy: 1 });

module.exports = mongoose.model("AccommodationReq", accommodationReqSchema, "accommodationreq");