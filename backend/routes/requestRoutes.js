const express = require('express');
const router = express.Router();
const eventReqRepository = require('../repositories/eventReqRepository');
const accommodationReqRepository = require('../repositories/accommodationReqRepository');
const restaurantReqRepository = require('../repositories/restaurantReqRepository');
const attachCreator = require('../utils/attachCreator');

const repositoriesByCollection = {
  eventreq: eventReqRepository,
  accommodationreq: accommodationReqRepository,
  restaurantreq: restaurantReqRepository
};

// Get all event requests
router.get('/eventreq', async (req, res) => {
  try {
    const requests = await eventReqRepository.findAll();
    res.json(await attachCreator(requests));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get all accommodation requests
router.get('/accommodationreq', async (req, res) => {
  try {
    const requests = await accommodationReqRepository.findAll();
    res.json(await attachCreator(requests));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get all restaurant requests
router.get('/restaurantreq', async (req, res) => {
  try {
    const requests = await restaurantReqRepository.findAll();
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

    const repository = repositoriesByCollection[collection];
    if (!repository) {
      return res.status(400).json({ message: 'Invalid collection' });
    }

    const request = await repository.updateById(id, { status });
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

    const repository = repositoriesByCollection[collection];
    if (!repository) {
      return res.status(400).json({ message: 'Invalid collection' });
    }

    await repository.deleteById(id);
    res.json({ message: 'Request deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
