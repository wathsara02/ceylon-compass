const express = require("express");
const router = express.Router();
const eventRepository = require("../repositories/eventRepository");
const { auth } = require("../middleware/auth");

// Get all events with optional location filter - PUBLIC ROUTE
router.get("/", async (req, res) => {
  try {
    const { country, city, showAll, sort } = req.query;

    const currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0);

    const sortDirection = sort === 'desc' ? 'desc' : 'asc';

    const events = await eventRepository.findApproved({
      country: showAll ? undefined : country,
      city: showAll ? undefined : city,
      fromDate: currentDate,
      sortDirection
    });

    res.json(events);
  } catch (error) {
    console.error("Error fetching events:", error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get event by ID - PUBLIC ROUTE
router.get("/:id", async (req, res) => {
  try {
    const event = await eventRepository.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }
    res.json(event);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Create a new event (user submission)
router.post("/", auth, async (req, res) => {
  try {
    const event = await eventRepository.create({
      ...req.body,
      createdBy: req.user._id,
      status: 'pending'
    });
    res.status(201).json(event);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update an event (admin or creator only)
router.put("/:id", auth, async (req, res) => {
  try {
    const userId = req.user._id;
    const userRole = req.user.role;

    const event = await eventRepository.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    if (userRole !== 'admin' && event.createdBy !== userId) {
      return res.status(403).json({ message: 'Not authorized to update this event' });
    }

    const updates = { ...req.body };
    if (userRole !== 'admin') {
      delete updates.createdBy;
      delete updates.status;
    }

    const result = await eventRepository.updateById(req.params.id, updates);
    res.json(result);
  } catch (error) {
    console.error('Error updating event:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete an event (admin or creator only)
router.delete("/:id", auth, async (req, res) => {
  try {
    const userId = req.user._id;
    const userRole = req.user.role;

    const event = await eventRepository.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    if (userRole !== 'admin' && event.createdBy !== userId) {
      return res.status(403).json({ message: 'Not authorized to delete this event' });
    }

    await eventRepository.deleteById(req.params.id);
    res.json({ message: 'Event deleted successfully' });
  } catch (error) {
    console.error('Error deleting event:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get user's submitted events
router.get("/user/submissions", auth, async (req, res) => {
  try {
    const events = await eventRepository.findByCreatedBy(req.user._id);
    res.json(events);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get pending events (admin only)
router.get("/admin/pending", auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to view pending events' });
    }

    const events = await eventRepository.findByStatus('pending');
    res.json(events);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
