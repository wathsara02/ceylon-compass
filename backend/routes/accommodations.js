const express = require('express');
const router = express.Router();
const Accommodation = require('../models/Accommodation');
const { auth } = require('../middleware/auth'); // Import auth middleware

// Get all accommodations with optional filters
router.get('/', async (req, res) => {
  try {
    const { country, city, showAll, minPrice, maxPrice, priceRange } = req.query;
    
    let query = { status: 'approved' }; // Only show approved accommodations by default
    
    // Filter by location if not showing all
    if (!showAll) {
      if (country) query.country = country;
      if (city) query.city = city;
    }
    
    // Filter by price range
    if (priceRange) {
      query.priceRange = priceRange;
    } else if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = Number(minPrice);
      if (maxPrice) query.price.$lte = Number(maxPrice);
    }
    
    const accommodations = await Accommodation.find(query).sort({ price: 1 });
    res.json(accommodations);
  } catch (error) {
    console.error('Error fetching accommodations:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get accommodation by ID
router.get('/:id', async (req, res) => {
  try {
    const accommodation = await Accommodation.findById(req.params.id);
    
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
    const userId = req.user._id; // From auth middleware
    
    const accommodation = new Accommodation({
      ...req.body,
      createdBy: userId,
      status: 'pending' // All new accommodations start as pending
    });
    
    await accommodation.save();
    res.status(201).json(accommodation);
  } catch (error) {
    console.error('Error creating accommodation:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update an accommodation (admin or creator only)
router.put('/:id', auth, async (req, res) => {
  try {
    const userId = req.user._id; // From auth middleware
    const userRole = req.user.role; // From auth middleware
    
    const accommodation = await Accommodation.findById(req.params.id);
    
    if (!accommodation) {
      return res.status(404).json({ message: 'Accommodation not found' });
    }
    
    // Only allow admin or accommodation creator to update
    if (userRole !== 'admin' && (!accommodation.createdBy || accommodation.createdBy.toString() !== userId.toString())) {
      return res.status(403).json({ message: 'Not authorized to update this accommodation' });
    }
    
    // Log request body for debugging
    console.log('Update accommodation request:', {
      id: req.params.id,
      userId: userId,
      userRole: userRole,
      requestBody: req.body
    });
    
    // Handle location data properly
    let updatedAccommodation = {
      ...accommodation.toObject(),
      ...req.body
    };
    
    // Ensure createdBy and status aren't overwritten unless by admin
    if (userRole !== 'admin') {
      updatedAccommodation.createdBy = accommodation.createdBy;
      updatedAccommodation.status = accommodation.status;
    }
    
    // Ensure proper formatting of location data if it exists
    if (updatedAccommodation.location && typeof updatedAccommodation.location === 'object') {
      if (!updatedAccommodation.location.coordinates && (updatedAccommodation.location.latitude || updatedAccommodation.location.longitude)) {
        updatedAccommodation.location = {
          type: 'Point',
          coordinates: [
            parseFloat(updatedAccommodation.location.longitude || 0),
            parseFloat(updatedAccommodation.location.latitude || 0)
          ]
        };
      }
    }
    
    const result = await Accommodation.findByIdAndUpdate(
      req.params.id,
      updatedAccommodation,
      { new: true, runValidators: true }
    );
    
    res.json(result);
  } catch (error) {
    console.error('Error updating accommodation:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete an accommodation (admin or creator only)
router.delete('/:id', auth, async (req, res) => {
  try {
    const userId = req.user._id; // From auth middleware
    const userRole = req.user.role; // From auth middleware
    
    const accommodation = await Accommodation.findById(req.params.id);
    
    if (!accommodation) {
      return res.status(404).json({ message: 'Accommodation not found' });
    }
    
    // Only allow admin or accommodation creator to delete
    if (userRole !== 'admin' && (!accommodation.createdBy || accommodation.createdBy.toString() !== userId.toString())) {
      return res.status(403).json({ message: 'Not authorized to delete this accommodation' });
    }
    
    await Accommodation.findByIdAndDelete(req.params.id);
    res.json({ message: 'Accommodation deleted successfully' });
  } catch (error) {
    console.error('Error deleting accommodation:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get user's submitted accommodations
router.get('/user/submissions', auth, async (req, res) => {
  try {
    const userId = req.user._id; // From auth middleware
    
    const accommodations = await Accommodation.find({ createdBy: userId }).sort({ createdAt: -1 });
    res.json(accommodations);
  } catch (error) {
    console.error('Error fetching user submissions:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get pending accommodations (admin only)
router.get('/admin/pending', auth, async (req, res) => {
  try {
    const userRole = req.user.role; // From auth middleware
    
    if (userRole !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to view pending accommodations' });
    }
    
    const accommodations = await Accommodation.find({ status: 'pending' }).sort({ createdAt: -1 });
    res.json(accommodations);
  } catch (error) {
    console.error('Error fetching pending accommodations:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;