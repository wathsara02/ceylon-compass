// routes/events.js
const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const Event = require("../models/Event");
const { auth } = require("../middleware/auth");  // Import auth middleware

// Get all events with optional location filter - PUBLIC ROUTE
router.get("/", async (req, res) => {
  try {
    const { country, city, showAll, sort } = req.query;
    
    // Create date for today at 00:00:00 local time
    const currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0);
    
    // Base query - only show approved events and filter out past events
    let query = { 
      status: 'approved',
      date: { $gte: currentDate } // Only show events from today onwards
    };
    
    // Filter by location if not showing all
    if (!showAll) {
      if (country) query.country = country;
      if (city) query.city = city;
    }
    
    // Determine sort order
    const sortDirection = sort === 'desc' ? -1 : 1;
    
    console.log("Fetching events with query:", query);
    console.log("Sort order:", sort || 'asc');
    
    const events = await Event.find(query).sort({ date: sortDirection });
    console.log(`Found ${events.length} events`);
    res.json(events);
  } catch (error) {
    console.error("Error fetching events:", error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get event by ID - PUBLIC ROUTE
router.get("/:id", async (req, res) => {
  const { id } = req.params;
  
  // Validate MongoDB ID
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: "Invalid event ID format" });
  }

  try {
    const event = await Event.findById(id);
    
    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    res.json(event);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// The rest of the routes need authentication

// Create a new event (user submission)
router.post("/", auth, async (req, res) => {
  try {
    const userId = req.user._id; // Use _id from auth middleware
    
    const event = new Event({
      ...req.body,
      createdBy: userId,
      status: 'pending' // All new events start as pending
    });
    
    await event.save();
    res.status(201).json(event);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update an event (admin or creator only)
router.put("/:id", auth, async (req, res) => {
  try {
    const userId = req.user._id; // Use _id from auth middleware
    const userRole = req.user.role; // From auth middleware
    
    const event = await Event.findById(req.params.id);
    
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }
    
    // Only allow admin or event creator to update
    if (userRole !== 'admin' && (!event.createdBy || event.createdBy.toString() !== userId.toString())) {
      return res.status(403).json({ message: 'Not authorized to update this event' });
    }
    
    // Log request body
    console.log('Update event request:', {
      id: req.params.id,
      userId: userId,
      userRole: userRole,
      requestBody: req.body,
      currentEvent: event
    });
    
    // Update fields (use spread operator to apply all fields from request body)
    const updatedEvent = {
      ...event.toObject(),
      ...req.body
    };
    
    // Ensure createdBy and status aren't overwritten unless by admin
    if (userRole !== 'admin') {
      updatedEvent.createdBy = event.createdBy;
      updatedEvent.status = event.status;
    }
    
    const result = await Event.findByIdAndUpdate(
      req.params.id, 
      updatedEvent,
      { new: true, runValidators: true }
    );
    
    res.json(result);
  } catch (error) {
    console.error('Error updating event:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete an event (admin or creator only)
router.delete("/:id", auth, async (req, res) => {
  try {
    const userId = req.user._id; // Use _id from auth middleware
    const userRole = req.user.role; // From auth middleware
    
    const event = await Event.findById(req.params.id);
    
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }
    
    // Only allow admin or event creator to delete
    if (userRole !== 'admin' && (!event.createdBy || event.createdBy.toString() !== userId.toString())) {
      return res.status(403).json({ message: 'Not authorized to delete this event' });
    }
    
    await Event.findByIdAndDelete(req.params.id);
    res.json({ message: 'Event deleted successfully' });
  } catch (error) {
    console.error('Error deleting event:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get user's submitted events
router.get("/user/submissions", auth, async (req, res) => {
  try {
    const userId = req.user._id; // Use _id from auth middleware
    
    const events = await Event.find({ createdBy: userId }).sort({ createdAt: -1 });
    res.json(events);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get pending events (admin only)
router.get("/admin/pending", auth, async (req, res) => {
  try {
    const userRole = req.user.role; // From auth middleware
    
    if (userRole !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to view pending events' });
    }
    
    const events = await Event.find({ status: 'pending' }).sort({ createdAt: -1 });
    res.json(events);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
