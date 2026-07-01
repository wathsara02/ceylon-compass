const express = require("express");
const router = express.Router();
const restaurantReqRepository = require("../repositories/restaurantReqRepository");
const restaurantRepository = require("../repositories/restaurantRepository");
const notificationRepository = require("../repositories/notificationRepository");
const userRepository = require("../repositories/userRepository");
const attachCreator = require("../utils/attachCreator");
const { auth } = require("../middleware/auth");
const emailConfig = require('../config/emailConfig');

router.post("/", auth, async (req, res) => {
  try {
    const requiredFields = [
      'name', 'cuisine', 'country', 'city',
      'address', 'description',
      'contactNumber', 'openingHours', 'images'
    ];

    const missingFields = requiredFields.filter(field => !req.body[field]);
    if (missingFields.length > 0) {
      return res.status(400).json({
        message: 'Missing required fields',
        fields: missingFields
      });
    }

    if (!Array.isArray(req.body.images) || req.body.images.length === 0) {
      return res.status(400).json({
        message: 'At least one image is required'
      });
    }

    const restaurantReq = await restaurantReqRepository.create({
      ...req.body,
      createdBy: req.user._id,
      status: 'pending'
    });

    res.status(201).json(restaurantReq);
  } catch (error) {
    console.error('Error creating restaurant request:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.post("/:id/accept", auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to accept requests' });
    }

    const restaurantReq = await restaurantReqRepository.findById(req.params.id);
    if (!restaurantReq) {
      return res.status(404).json({ message: 'Restaurant request not found' });
    }

    const creator = await userRepository.findByUid(restaurantReq.createdBy);
    const mainImage = restaurantReq.images && restaurantReq.images.length > 0
      ? restaurantReq.images[0]
      : 'default-restaurant.jpg';

    const newRestaurant = await restaurantRepository.create({
      name: restaurantReq.name,
      description: restaurantReq.description,
      cuisine: restaurantReq.cuisine,
      address: restaurantReq.address,
      city: restaurantReq.city,
      country: restaurantReq.country,
      contactNumber: restaurantReq.contactNumber || '',
      openingHours: restaurantReq.openingHours || '',
      website: restaurantReq.website || '',
      image: mainImage,
      images: restaurantReq.images || [],
      createdBy: restaurantReq.createdBy,
      status: 'approved'
    });

    if (creator) {
      try {
        await notificationRepository.create({
          userId: creator._id,
          title: 'Restaurant Request Accepted',
          type: 'restaurant_accepted',
          message: `Your restaurant "${restaurantReq.name}" has been accepted!`
        });

        if (creator.email) {
          await emailConfig.sendEmail({
            to: creator.email,
            subject: 'Restaurant Request Accepted',
            text: `Your restaurant "${restaurantReq.name}" has been accepted! You can now see it on our platform.`,
            html: `
              <h2>Restaurant Request Accepted</h2>
              <p>Congratulations! Your restaurant "${restaurantReq.name}" has been accepted and is now live on our platform.</p>
              <p>Details:</p>
              <ul>
                <li><strong>Name:</strong> ${restaurantReq.name}</li>
                <li><strong>Cuisine:</strong> ${restaurantReq.cuisine}</li>
                <li><strong>Location:</strong> ${restaurantReq.address}, ${restaurantReq.city}, ${restaurantReq.country}</li>
              </ul>
              <p>Thank you for contributing to our platform!</p>
            `
          });
        }
      } catch (notificationError) {
        console.error('Error sending notification or email:', notificationError);
      }
    }

    await restaurantReqRepository.deleteById(req.params.id);

    res.json({
      message: 'Restaurant request accepted and moved to restaurants',
      restaurant: newRestaurant
    });
  } catch (error) {
    console.error('Error accepting restaurant request:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.post("/:id/reject", auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to reject requests' });
    }

    const restaurantReq = await restaurantReqRepository.findById(req.params.id);
    if (!restaurantReq) {
      return res.status(404).json({ message: 'Restaurant request not found' });
    }

    const creator = await userRepository.findByUid(restaurantReq.createdBy);

    try {
      if (creator) {
        await notificationRepository.create({
          userId: creator._id,
          type: 'restaurant_rejected',
          message: `Your restaurant "${restaurantReq.name}" has been rejected.`
        });

        if (creator.email) {
          await emailConfig.sendEmail({
            to: creator.email,
            subject: 'Restaurant Request Rejected',
            text: `Your restaurant "${restaurantReq.name}" has been rejected. Please contact us for more information.`,
            html: `
              <h2>Restaurant Request Rejected</h2>
              <p>We're sorry, but your restaurant "${restaurantReq.name}" has been rejected.</p>
              <p>If you'd like more information or want to submit a revised request, please contact our support team.</p>
            `
          });
        }
      }
    } catch (notificationError) {
      console.error('Error sending rejection notification or email:', notificationError);
    }

    await restaurantReqRepository.deleteById(req.params.id);

    res.json({
      message: 'Restaurant request rejected and removed',
      restaurantRequest: restaurantReq
    });
  } catch (error) {
    console.error('Error rejecting restaurant request:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.get("/", auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin only.' });
    }

    const restaurantReqs = await restaurantReqRepository.findAll();
    res.json(await attachCreator(restaurantReqs));
  } catch (error) {
    console.error('Error fetching restaurant requests:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.get("/user", auth, async (req, res) => {
  try {
    const restaurantReqs = await restaurantReqRepository.findByCreatedBy(req.user._id);
    res.json(restaurantReqs);
  } catch (error) {
    console.error('Error fetching user restaurant requests:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.get("/:id", auth, async (req, res) => {
  try {
    const restaurantReq = await restaurantReqRepository.findById(req.params.id);
    if (!restaurantReq) {
      return res.status(404).json({ message: 'Restaurant request not found' });
    }

    if (req.user.role !== 'admin' && restaurantReq.createdBy !== req.user._id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json(await attachCreator(restaurantReq));
  } catch (error) {
    console.error('Error fetching restaurant request:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
