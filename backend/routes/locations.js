const express = require('express');
const router = express.Router();
const Location = require('../models/Location');
const { auth, isAdmin } = require('../middleware/auth');

// Get all countries
router.get('/countries', async (req, res) => {
  try {
    const countries = await Location.distinct('country');
    res.json(countries);
  } catch (error) {
    console.error('Error fetching countries:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get cities for a country
router.get('/cities/:country', async (req, res) => {
  const { country } = req.params;
  
  try {
    const location = await Location.findOne({ 
      country: { 
        $regex: new RegExp(`^${country}$`, 'i') 
      } 
    });
    
    if (!location) {
      return res.status(404).json({ 
        message: 'Country not found',
        requestedCountry: country 
      });
    }

    res.json(location.cities);
  } catch (error) {
    console.error('Error fetching cities:', error);
    res.status(500).json({ 
      message: 'Error fetching cities', 
      error: error.message,
      requestedCountry: country 
    });
  }
});

// Test route (no auth required)
router.get('/test', async (req, res) => {
  console.log('[LOCATIONS] Test route accessed');
  res.json({ message: 'Locations API is working', timestamp: new Date().toISOString() });
});

// Get all locations (admin only)
router.get('/all', auth, isAdmin, async (req, res) => {
  console.log('[LOCATIONS] All locations request received');
  console.log('[LOCATIONS] User:', req.user ? `${req.user.username} (${req.user.role})` : 'No user');
  
  try {
    const locations = await Location.find().sort({ country: 1 });
    console.log(`[LOCATIONS] Found ${locations.length} locations`);
    res.json(locations);
  } catch (error) {
    console.error('[LOCATIONS] Error fetching all locations:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Add a new country (admin only)
router.post('/country', auth, isAdmin, async (req, res) => {
  try {
    const { country, cities } = req.body;
    
    if (!country) {
      return res.status(400).json({ message: 'Country name is required' });
    }
    
    // Check if country already exists
    const existingCountry = await Location.findOne({ country });
    if (existingCountry) {
      return res.status(400).json({ message: 'Country already exists' });
    }
    
    // Create new location
    const newLocation = new Location({
      country,
      cities: cities || []
    });
    
    await newLocation.save();
    
    res.status(201).json(newLocation);
  } catch (error) {
    console.error('Error adding country:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Add city to a country (admin only)
router.post('/city/:country', auth, isAdmin, async (req, res) => {
  try {
    const { country } = req.params;
    const { city } = req.body;
    
    if (!city) {
      return res.status(400).json({ message: 'City name is required' });
    }
    
    // Find the country
    const location = await Location.findOne({ country });
    if (!location) {
      return res.status(404).json({ message: 'Country not found' });
    }
    
    // Check if city already exists
    if (location.cities.includes(city)) {
      return res.status(400).json({ message: 'City already exists in this country' });
    }
    
    // Add city to the country
    location.cities.push(city);
    await location.save();
    
    res.json(location);
  } catch (error) {
    console.error('Error adding city:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete a country (admin only)
router.delete('/country/:country', auth, isAdmin, async (req, res) => {
  try {
    const { country } = req.params;
    
    // Find and delete the country
    const deletedLocation = await Location.findOneAndDelete({ country });
    
    if (!deletedLocation) {
      return res.status(404).json({ message: 'Country not found' });
    }
    
    res.json({ message: 'Country deleted successfully', deletedLocation });
  } catch (error) {
    console.error('Error deleting country:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete a city from a country (admin only)
router.delete('/city/:country/:city', auth, isAdmin, async (req, res) => {
  try {
    const { country, city } = req.params;
    
    // Find the country
    const location = await Location.findOne({ country });
    if (!location) {
      return res.status(404).json({ message: 'Country not found' });
    }
    
    // Check if city exists
    if (!location.cities.includes(city)) {
      return res.status(404).json({ message: 'City not found in this country' });
    }
    
    // Remove city from the country
    location.cities = location.cities.filter(c => c !== city);
    await location.save();
    
    res.json({ message: 'City deleted successfully', location });
  } catch (error) {
    console.error('Error deleting city:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router; 