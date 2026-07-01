const express = require('express');
const router = express.Router();
const locationRepository = require('../repositories/locationRepository');
const { auth, isAdmin } = require('../middleware/auth');

// Get all countries
router.get('/countries', async (req, res) => {
  try {
    const countries = await locationRepository.findAllCountries();
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
    const location = await locationRepository.findByCountry(country);
    if (!location) {
      return res.status(404).json({ message: 'Country not found', requestedCountry: country });
    }

    res.json(location.cities);
  } catch (error) {
    console.error('Error fetching cities:', error);
    res.status(500).json({ message: 'Error fetching cities', error: error.message, requestedCountry: country });
  }
});

// Test route (no auth required)
router.get('/test', async (req, res) => {
  res.json({ message: 'Locations API is working', timestamp: new Date().toISOString() });
});

// Get all locations (admin only)
router.get('/all', auth, isAdmin, async (req, res) => {
  try {
    const locations = await locationRepository.findAll();
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

    const existingCountry = await locationRepository.findByCountry(country);
    if (existingCountry) {
      return res.status(400).json({ message: 'Country already exists' });
    }

    const newLocation = await locationRepository.create(country, cities || []);
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

    const location = await locationRepository.findByCountry(country);
    if (!location) {
      return res.status(404).json({ message: 'Country not found' });
    }

    if (location.cities.includes(city)) {
      return res.status(400).json({ message: 'City already exists in this country' });
    }

    const updated = await locationRepository.addCity(country, city);
    res.json(updated);
  } catch (error) {
    console.error('Error adding city:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete a country (admin only)
router.delete('/country/:country', auth, isAdmin, async (req, res) => {
  try {
    const { country } = req.params;
    const location = await locationRepository.findByCountry(country);
    if (!location) {
      return res.status(404).json({ message: 'Country not found' });
    }

    await locationRepository.deleteByCountry(country);
    res.json({ message: 'Country deleted successfully', deletedLocation: location });
  } catch (error) {
    console.error('Error deleting country:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete a city from a country (admin only)
router.delete('/city/:country/:city', auth, isAdmin, async (req, res) => {
  try {
    const { country, city } = req.params;
    const location = await locationRepository.findByCountry(country);
    if (!location) {
      return res.status(404).json({ message: 'Country not found' });
    }

    if (!location.cities.includes(city)) {
      return res.status(404).json({ message: 'City not found in this country' });
    }

    const updated = await locationRepository.removeCity(country, city);
    res.json({ message: 'City deleted successfully', location: updated });
  } catch (error) {
    console.error('Error deleting city:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
