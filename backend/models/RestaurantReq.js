const mongoose = require("mongoose");

const restaurantReqSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
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
  contactNumber: {
    type: String,
    required: true
  },
  openingHours: {
    type: String,
    required: true
  },
  images: [{
    type: String,
    required: true
  }],
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

module.exports = mongoose.model("RestaurantReq", restaurantReqSchema, "restaurantreq"); 