const express = require("express");
const router = express.Router();
const restaurantRepository = require("../repositories/restaurantRepository");
const { auth } = require("../middleware/auth");

// GET /api/restaurants - Get all restaurants with optional location filter
router.get("/", async (req, res) => {
  try {
    const { country, city, showAll } = req.query;
    const filters = showAll ? {} : { country, city };

    const restaurants = await restaurantRepository.findAll(filters);
    res.json(restaurants);
  } catch (error) {
    console.error('Error fetching restaurants:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// GET /api/restaurants/:id - Get single restaurant
router.get("/:id", async (req, res) => {
  try {
    const restaurant = await restaurantRepository.findById(req.params.id);
    if (!restaurant) {
      return res.status(404).json({ message: 'Restaurant not found' });
    }

    if (!restaurant.website) {
      restaurant.website = '';
    }

    res.json(restaurant);
  } catch (error) {
    console.error('Error fetching restaurant by ID:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// POST /api/restaurants - Add new restaurant (protected)
router.post("/", auth, async (req, res) => {
  try {
    const restaurant = await restaurantRepository.create({
      ...req.body,
      createdBy: req.user._id,
      status: 'approved'
    });
    res.status(201).json(restaurant);
  } catch (error) {
    console.error('Error creating restaurant:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// PUT /api/restaurants/:id - Update restaurant (protected - admin or creator only)
router.put("/:id", auth, async (req, res) => {
  try {
    const userId = req.user._id;
    const userRole = req.user.role;

    const restaurant = await restaurantRepository.findById(req.params.id);
    if (!restaurant) {
      return res.status(404).json({ message: 'Restaurant not found' });
    }

    if (userRole !== 'admin' && restaurant.createdBy !== userId) {
      return res.status(403).json({ message: 'Not authorized to update this restaurant' });
    }

    const updates = { ...req.body };
    if (userRole !== 'admin') {
      delete updates.createdBy;
      delete updates.status;
    }

    const result = await restaurantRepository.updateById(req.params.id, updates);
    res.json(result);
  } catch (error) {
    console.error('Error updating restaurant:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// DELETE /api/restaurants/:id - Delete restaurant (protected - admin or creator only)
router.delete("/:id", auth, async (req, res) => {
  try {
    const userId = req.user._id;
    const userRole = req.user.role;

    const restaurant = await restaurantRepository.findById(req.params.id);
    if (!restaurant) {
      return res.status(404).json({ message: 'Restaurant not found' });
    }

    if (userRole !== 'admin' && restaurant.createdBy !== userId) {
      return res.status(403).json({ message: 'Not authorized to delete this restaurant' });
    }

    await restaurantRepository.deleteById(req.params.id);
    res.json({ message: 'Restaurant deleted successfully' });
  } catch (error) {
    console.error('Error deleting restaurant:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Add a review to a restaurant (protected)
router.post('/:id/reviews', auth, async (req, res) => {
  try {
    const { rating, comment } = req.body;
    const restaurant = await restaurantRepository.addReview(req.params.id, {
      userId: req.user._id,
      rating,
      comment
    });

    if (!restaurant) {
      return res.status(404).json({ message: 'Restaurant not found' });
    }

    res.json(restaurant);
  } catch (error) {
    console.error('Error adding review to restaurant:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
