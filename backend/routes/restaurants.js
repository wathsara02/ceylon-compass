const express = require("express");
const router = express.Router();
const Restaurant = require("../models/Restaurant");
const { auth } = require("../middleware/auth");  // Import auth middleware

// GET /api/restaurants - Get all restaurants with optional location filter
router.get("/", async (req, res) => {
  try {
    const { country, city, showAll } = req.query;
    
    let query = {}; // Start with empty query without status filtering
    
    // Filter by location if not showing all
    if (!showAll) {
      if (country) query.country = country;
      if (city) query.city = city;
    }
    
    console.log('Restaurant query:', JSON.stringify(query));
    const restaurants = await Restaurant.find(query);
    console.log(`Found ${restaurants.length} restaurants`);
    res.json(restaurants);
  } catch (error) {
    console.error('Error fetching restaurants:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// GET /api/restaurants/:id - Get single restaurant
router.get("/:id", async (req, res) => {
  try {
    const restaurant = await Restaurant.findById(req.params.id);
    if (!restaurant) {
      return res.status(404).json({ message: 'Restaurant not found' });
    }
    
    // Ensure website field is always present (even if empty)
    const restaurantData = restaurant.toObject();
    if (!restaurantData.website) {
      restaurantData.website = ''; // Provide empty string rather than undefined
    }
    
    res.json(restaurantData);
  } catch (error) {
    console.error('Error fetching restaurant by ID:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// POST /api/restaurants - Add new restaurant (protected)
router.post("/", auth, async (req, res) => {
  try {
    const userId = req.user._id; // Use _id from auth middleware
    
    const restaurant = new Restaurant({
      ...req.body,
      createdBy: userId,
      status: 'approved' // New restaurants are approved by default when created directly
    });
    
    await restaurant.save();
    res.status(201).json(restaurant);
  } catch (error) {
    console.error('Error creating restaurant:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// PUT /api/restaurants/:id - Update restaurant (protected - admin or creator only)
router.put("/:id", auth, async (req, res) => {
  try {
    const userId = req.user._id; // Use _id from auth middleware
    const userRole = req.user.role; // From auth middleware
    
    const restaurant = await Restaurant.findById(req.params.id);
    
    if (!restaurant) {
      return res.status(404).json({ message: 'Restaurant not found' });
    }
    
    // Only allow admin or restaurant creator to update
    if (userRole !== 'admin' && (!restaurant.createdBy || restaurant.createdBy.toString() !== userId.toString())) {
      return res.status(403).json({ message: 'Not authorized to update this restaurant' });
    }
    
    // Log request body for debugging
    console.log('Update restaurant request:', {
      id: req.params.id,
      userId: userId,
      userRole: userRole,
      requestBody: req.body
    });
    
    // Update fields (use spread operator to apply all fields from request body)
    const updatedRestaurant = {
      ...restaurant.toObject(),
      ...req.body
    };
    
    // Ensure createdBy and status aren't overwritten unless by admin
    if (userRole !== 'admin') {
      updatedRestaurant.createdBy = restaurant.createdBy;
      updatedRestaurant.status = restaurant.status;
    }
    
    const result = await Restaurant.findByIdAndUpdate(
      req.params.id, 
      updatedRestaurant,
      { new: true, runValidators: true }
    );
    
    res.json(result);
  } catch (error) {
    console.error('Error updating restaurant:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// DELETE /api/restaurants/:id - Delete restaurant (protected - admin or creator only)
router.delete("/:id", auth, async (req, res) => {
  try {
    const userId = req.user._id; // Use _id from auth middleware
    const userRole = req.user.role; // From auth middleware
    
    const restaurant = await Restaurant.findById(req.params.id);
    
    if (!restaurant) {
      return res.status(404).json({ message: 'Restaurant not found' });
    }
    
    // Only allow admin or restaurant creator to delete
    if (userRole !== 'admin' && (!restaurant.createdBy || restaurant.createdBy.toString() !== userId.toString())) {
      return res.status(403).json({ message: 'Not authorized to delete this restaurant' });
    }
    
    await Restaurant.findByIdAndDelete(req.params.id);
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
    const userId = req.user._id; // From auth middleware
    
    const restaurant = await Restaurant.findById(req.params.id);
    
    if (!restaurant) {
      return res.status(404).json({ message: 'Restaurant not found' });
    }
    
    // Add review
    restaurant.reviews.push({
      user: userId,
      rating,
      comment
    });
    
    // Update average rating
    const totalRating = restaurant.reviews.reduce((sum, review) => sum + review.rating, 0);
    restaurant.rating = totalRating / restaurant.reviews.length;
    
    await restaurant.save();
    
    res.json(restaurant);
  } catch (error) {
    console.error('Error adding review to restaurant:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router; 