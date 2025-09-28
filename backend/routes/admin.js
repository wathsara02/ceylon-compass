const express = require('express');
const router = express.Router();
const Event = require('../models/Event');
const Accommodation = require('../models/Accommodation');
const Restaurant = require('../models/Restaurant');
const User = require('../models/User');
const { cleanupPastEvents } = require('../utils/eventCleanup');

// Middleware to check if user is admin
const isAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Access denied. Admin only.' });
  }
  next();
};

// Apply admin middleware to all routes
router.use(isAdmin);

// Get dashboard statistics
router.get('/dashboard', async (req, res) => {
  try {
    const [
      totalUsers,
      totalEvents,
      totalAccommodations,
      totalRestaurants,
      pendingEvents,
      pendingAccommodations
    ] = await Promise.all([
      User.countDocuments(),
      Event.countDocuments({ status: 'approved' }),
      Accommodation.countDocuments({ status: 'approved' }),
      Restaurant.countDocuments(),
      Event.countDocuments({ status: 'pending' }),
      Accommodation.countDocuments({ status: 'pending' })
    ]);
    
    res.json({
      totalUsers,
      totalEvents,
      totalAccommodations,
      totalRestaurants,
      pendingEvents,
      pendingAccommodations
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get all pending submissions
router.get('/pending', async (req, res) => {
  try {
    const [pendingEvents, pendingAccommodations] = await Promise.all([
      Event.find({ status: 'pending' }).sort({ createdAt: -1 }),
      Accommodation.find({ status: 'pending' }).sort({ createdAt: -1 })
    ]);
    
    res.json({
      events: pendingEvents,
      accommodations: pendingAccommodations
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Approve or reject an event
router.put('/events/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    
    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }
    
    const event = await Event.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );
    
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }
    
    res.json(event);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Approve or reject an accommodation
router.put('/accommodations/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    
    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }
    
    const accommodation = await Accommodation.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );
    
    if (!accommodation) {
      return res.status(404).json({ message: 'Accommodation not found' });
    }
    
    res.json(accommodation);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get all users
router.get('/users', async (req, res) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 });
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get a specific user by ID
router.get('/users/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete a user
router.delete('/users/:id', async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Also delete all submissions by this user
    await Promise.all([
      Event.deleteMany({ createdBy: req.params.id }),
      Accommodation.deleteMany({ createdBy: req.params.id })
    ]);
    
    res.json({ message: 'User and all their submissions deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Add this new route to the existing file
router.post('/cleanup-past-events', async (req, res) => {
  try {
    const result = await cleanupPastEvents();
    
    if (result.error) {
      return res.status(500).json({ 
        message: 'Error cleaning up past events', 
        error: result.error.message 
      });
    }
    
    res.json({ 
      message: 'Past events cleanup completed successfully', 
      deletedCount: result.deleted 
    });
  } catch (error) {
    console.error('Error in admin cleanup route:', error);
    res.status(500).json({ 
      message: 'Error processing cleanup request', 
      error: error.message 
    });
  }
});

module.exports = router; 