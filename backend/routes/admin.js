const express = require('express');
const router = express.Router();
const eventRepository = require('../repositories/eventRepository');
const accommodationRepository = require('../repositories/accommodationRepository');
const restaurantRepository = require('../repositories/restaurantRepository');
const userRepository = require('../repositories/userRepository');
const { cleanupPastEvents } = require('../utils/eventCleanup');

// Middleware to check if user is admin
const isAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Access denied. Admin only.' });
  }
  next();
};

router.use(isAdmin);

// Get dashboard statistics
router.get('/dashboard', async (req, res) => {
  try {
    const [
      allUsers,
      totalEvents,
      totalAccommodations,
      allRestaurants,
      pendingEvents,
      pendingAccommodations
    ] = await Promise.all([
      userRepository.findAll(),
      eventRepository.countByStatus('approved'),
      accommodationRepository.countByStatus('approved'),
      restaurantRepository.findAll(),
      eventRepository.countByStatus('pending'),
      accommodationRepository.countByStatus('pending')
    ]);

    res.json({
      totalUsers: allUsers.length,
      totalEvents,
      totalAccommodations,
      totalRestaurants: allRestaurants.length,
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
      eventRepository.findByStatus('pending'),
      accommodationRepository.findByStatus('pending')
    ]);

    res.json({ events: pendingEvents, accommodations: pendingAccommodations });
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

    const event = await eventRepository.updateById(req.params.id, { status });
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

    const accommodation = await accommodationRepository.updateById(req.params.id, { status });
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
    const users = await userRepository.findAll();
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get a specific user by ID
router.get('/users/:id', async (req, res) => {
  try {
    const user = await userRepository.findByUid(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete a user (and cascade-delete their events/accommodations, matching prior Mongo behavior)
router.delete('/users/:id', async (req, res) => {
  try {
    const user = await userRepository.findByUid(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const [userEvents] = await Promise.all([
      eventRepository.findByCreatedBy(req.params.id),
      accommodationRepository.deleteByCreatedBy(req.params.id)
    ]);
    await Promise.all(userEvents.map((event) => eventRepository.deleteById(event._id)));
    await userRepository.deleteByUid(req.params.id);

    res.json({ message: 'User and all their submissions deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Cleanup past events
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
    res.status(500).json({ message: 'Error processing cleanup request', error: error.message });
  }
});

module.exports = router;
