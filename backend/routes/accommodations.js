const express = require('express');
const router = express.Router();
const accommodationRepository = require('../repositories/accommodationRepository');
const { auth } = require('../middleware/auth');

// Get all accommodations with optional filters
router.get('/', async (req, res) => {
  try {
    const { country, city, showAll, minPrice, maxPrice, priceRange } = req.query;

    const accommodations = await accommodationRepository.findApproved({
      country: showAll ? undefined : country,
      city: showAll ? undefined : city,
      priceRange,
      minPrice,
      maxPrice
    });

    res.json(accommodations);
  } catch (error) {
    console.error('Error fetching accommodations:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get accommodation by ID
router.get('/:id', async (req, res) => {
  try {
    const accommodation = await accommodationRepository.findById(req.params.id);
    if (!accommodation) {
      return res.status(404).json({ message: 'Accommodation not found' });
    }
    res.json(accommodation);
  } catch (error) {
    console.error('Error fetching accommodation by ID:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Create a new accommodation (user submission)
router.post('/', auth, async (req, res) => {
  try {
    const accommodation = await accommodationRepository.create({
      ...req.body,
      createdBy: req.user._id,
      status: 'pending'
    });
    res.status(201).json(accommodation);
  } catch (error) {
    console.error('Error creating accommodation:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update an accommodation (admin or creator only)
router.put('/:id', auth, async (req, res) => {
  try {
    const userId = req.user._id;
    const userRole = req.user.role;

    const accommodation = await accommodationRepository.findById(req.params.id);
    if (!accommodation) {
      return res.status(404).json({ message: 'Accommodation not found' });
    }

    if (userRole !== 'admin' && accommodation.createdBy !== userId) {
      return res.status(403).json({ message: 'Not authorized to update this accommodation' });
    }

    const updates = { ...req.body };
    if (userRole !== 'admin') {
      delete updates.createdBy;
      delete updates.status;
    }

    const result = await accommodationRepository.updateById(req.params.id, updates);
    res.json(result);
  } catch (error) {
    console.error('Error updating accommodation:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete an accommodation (admin or creator only)
router.delete('/:id', auth, async (req, res) => {
  try {
    const userId = req.user._id;
    const userRole = req.user.role;

    const accommodation = await accommodationRepository.findById(req.params.id);
    if (!accommodation) {
      return res.status(404).json({ message: 'Accommodation not found' });
    }

    if (userRole !== 'admin' && accommodation.createdBy !== userId) {
      return res.status(403).json({ message: 'Not authorized to delete this accommodation' });
    }

    await accommodationRepository.deleteById(req.params.id);
    res.json({ message: 'Accommodation deleted successfully' });
  } catch (error) {
    console.error('Error deleting accommodation:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get user's submitted accommodations
router.get('/user/submissions', auth, async (req, res) => {
  try {
    const accommodations = await accommodationRepository.findByCreatedBy(req.user._id);
    res.json(accommodations);
  } catch (error) {
    console.error('Error fetching user submissions:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get pending accommodations (admin only)
router.get('/admin/pending', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to view pending accommodations' });
    }

    const accommodations = await accommodationRepository.findByStatus('pending');
    res.json(accommodations);
  } catch (error) {
    console.error('Error fetching pending accommodations:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
