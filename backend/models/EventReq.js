const mongoose = require("mongoose");
const User = require('./User');

const eventReqSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
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
  date: {
    type: Date,
    required: true
  },
  time: {
    type: String,
    required: true
  },
  organizer: {
    name: {
      type: String,
      required: true
    },
    contactNumber: {
      type: String,
      required: true
    },
    email: {
      type: String,
      required: true
    }
  },
  image: {
    type: String,
    required: true
  },
  category: {
    type: String,
    required: true
  },
  price: {
    type: Number,
    default: 0
  },
  capacity: {
    type: Number,
    required: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
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

// Add index for createdBy field
eventReqSchema.index({ createdBy: 1 });

module.exports = mongoose.model("EventReq", eventReqSchema, "eventreq"); 