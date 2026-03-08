const express = require('express');
const router = express.Router();
const EventReq = require('../models/EventReq');
const AccommodationReq = require('../models/AccommodationReq');
const RestaurantReq = require('../models/RestaurantReq');
const User = require('../models/User');

// Get all event requests
router.get('/eventreq', async (req, res) => {
  try {
    console.log('Fetching event requests...');
    const requests = await EventReq.find()
      .lean()
      .populate({
        path: 'createdBy',
        select: 'username email',
        model: 'User'
      })
      .sort({ createdAt: -1 });
    
    // Log each request's createdBy field
    requests.forEach((req, index) => {
      console.log(`Request ${index + 1} createdBy:`, req.createdBy);
    });

    res.json(requests);
  } catch (error) {
    console.error('Error in /eventreq:', error);
    res.status(500).json({ message: error.message });
  }
});

// Get all accommodation requests
router.get('/accommodationreq', async (req, res) => {
  try {
    const requests = await AccommodationReq.find()
      .lean()
      .populate({
        path: 'createdBy',
        select: 'username email',
        model: 'User'
      })
      .sort({ createdAt: -1 });
    
    // Log each request's createdBy field
    requests.forEach((req, index) => {
      console.log(`Request ${index + 1} createdBy:`, req.createdBy);
    });

    res.json(requests);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get all restaurant requests
router.get('/restaurantreq', async (req, res) => {
  try {
    const requests = await RestaurantReq.find();
    res.json(requests);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update request status
router.put('/:collection/:id', async (req, res) => {
  try {
    const { collection, id } = req.params;
    const { status } = req.body;

    let Model;
    switch (collection) {
      case 'eventreq':
        Model = EventReq;
        break;
      case 'accommodationreq':
        Model = AccommodationReq;
        break;
      case 'restaurantreq':
        Model = RestaurantReq;
        break;
      default:
        return res.status(400).json({ message: 'Invalid collection' });
    }

    const request = await Model.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    );

    if (!request) {
      return res.status(404).json({ message: 'Request not found' });
    }

    res.json(request);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Delete request
router.delete('/:collection/:id', async (req, res) => {
  try {
    const { collection, id } = req.params;

    let Model;
    switch (collection) {
      case 'eventreq':
        Model = EventReq;
        break;
      case 'accommodationreq':
        Model = AccommodationReq;
        break;
      case 'restaurantreq':
        Model = RestaurantReq;
        break;
      default:
        return res.status(400).json({ message: 'Invalid collection' });
    }

    const request = await Model.findByIdAndDelete(id);

    if (!request) {
      return res.status(404).json({ message: 'Request not found' });
    }

    res.json({ message: 'Request deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router; 