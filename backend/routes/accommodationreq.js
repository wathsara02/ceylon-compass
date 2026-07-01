const express = require("express");
const router = express.Router();
const accommodationReqRepository = require("../repositories/accommodationReqRepository");
const accommodationRepository = require("../repositories/accommodationRepository");
const notificationRepository = require("../repositories/notificationRepository");
const userRepository = require("../repositories/userRepository");
const attachCreator = require("../utils/attachCreator");
const { auth } = require("../middleware/auth");
const emailConfig = require('../config/emailConfig');

const getPriceRange = (price) => {
  if (price <= 50) return '$';
  if (price <= 100) return '$$';
  if (price <= 200) return '$$$';
  return '$$$$';
};

const mapAccommodationType = (type) => {
  switch (type.toLowerCase()) {
    case 'hotel':
      return 'Hotel';
    case 'hostel':
      return 'Hostel';
    case 'apartment':
      return 'Apartment';
    case 'guesthouse':
      return 'Guest House';
    case 'resort':
    default:
      return 'Other';
  }
};

router.post("/", auth, async (req, res) => {
  try {
    const requiredFields = [
      'name', 'description', 'type',
      'country', 'city', 'address',
      'price', 'capacity', 'images', 'contactNumber'
    ];

    const missingFields = requiredFields.filter(field => !req.body[field]);
    if (missingFields.length > 0) {
      return res.status(400).json({
        message: 'Missing required fields',
        fields: missingFields
      });
    }

    if (typeof req.body.price !== 'number' || req.body.price <= 0) {
      return res.status(400).json({ message: 'Price must be a positive number' });
    }

    if (typeof req.body.capacity !== 'number' || req.body.capacity <= 0 || !Number.isInteger(req.body.capacity)) {
      return res.status(400).json({ message: 'Capacity must be a positive integer' });
    }

    if (!Array.isArray(req.body.images) || req.body.images.length === 0) {
      return res.status(400).json({ message: 'At least one image is required' });
    }

    const accommodationReq = await accommodationReqRepository.create({
      name: req.body.name,
      description: req.body.description,
      type: req.body.type,
      location: {
        country: req.body.country,
        city: req.body.city,
        address: req.body.address
      },
      price: req.body.price,
      capacity: req.body.capacity,
      amenities: req.body.amenities || [],
      images: req.body.images,
      contactNumber: req.body.contactNumber,
      createdBy: req.user._id,
      status: 'pending'
    });

    res.status(201).json(accommodationReq);
  } catch (error) {
    console.error('Error creating accommodation request:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.get("/", auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin only.' });
    }

    const accommodationReqs = await accommodationReqRepository.findAll();
    res.json(await attachCreator(accommodationReqs));
  } catch (error) {
    console.error('Error fetching accommodation requests:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.get("/user", auth, async (req, res) => {
  try {
    const accommodationReqs = await accommodationReqRepository.findByCreatedBy(req.user._id);
    res.json(accommodationReqs);
  } catch (error) {
    console.error('Error fetching user accommodation requests:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.get("/:id", auth, async (req, res) => {
  try {
    const accommodationReq = await accommodationReqRepository.findById(req.params.id);
    if (!accommodationReq) {
      return res.status(404).json({ message: 'Accommodation request not found' });
    }

    if (req.user.role !== 'admin' && accommodationReq.createdBy !== req.user._id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json(await attachCreator(accommodationReq));
  } catch (error) {
    console.error('Error fetching accommodation request:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.post("/:id/accept", auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to accept requests' });
    }

    const accommodationReq = await accommodationReqRepository.findById(req.params.id);
    if (!accommodationReq) {
      return res.status(404).json({ message: 'Accommodation request not found' });
    }

    const creator = await userRepository.findByUid(accommodationReq.createdBy);
    const locationData = accommodationReq.location || {};
    const country = locationData.country || '';
    const city = locationData.city || '';
    const address = locationData.address || '';
    const mappedType = mapAccommodationType(accommodationReq.type);

    const newAccommodation = await accommodationRepository.create({
      name: accommodationReq.name || 'Unnamed Accommodation',
      description: accommodationReq.description || '',
      type: mappedType,
      country,
      city,
      address,
      price: accommodationReq.price || 0,
      priceRange: getPriceRange(accommodationReq.price || 0),
      amenities: accommodationReq.amenities || [],
      images: accommodationReq.images || [],
      contactNumber: accommodationReq.contactNumber || '',
      email: creator?.email || 'no-email@example.com',
      website: '',
      createdBy: accommodationReq.createdBy,
      status: 'approved'
    });

    if (creator) {
      try {
        await notificationRepository.create({
          userId: creator._id,
          title: 'Accommodation Request Accepted',
          type: 'accommodation_accepted',
          message: `Your accommodation "${accommodationReq.name}" has been accepted!`
        });

        if (creator.email) {
          await emailConfig.sendEmail({
            to: creator.email,
            subject: 'Accommodation Request Accepted',
            text: `Your accommodation "${accommodationReq.name}" has been accepted! You can now see it on our platform.`,
            html: `
              <h2>Accommodation Request Accepted</h2>
              <p>Congratulations! Your accommodation "${accommodationReq.name}" has been accepted and is now live on our platform.</p>
              <p>Details:</p>
              <ul>
                <li><strong>Name:</strong> ${accommodationReq.name}</li>
                <li><strong>Type:</strong> ${mappedType}</li>
                <li><strong>Location:</strong> ${address}, ${city}, ${country}</li>
                <li><strong>Price:</strong> $${accommodationReq.price}</li>
              </ul>
              <p>Thank you for contributing to our platform!</p>
            `
          });
        }
      } catch (notificationError) {
        console.error('Error sending notification or email:', notificationError);
      }
    }

    await accommodationReqRepository.deleteById(req.params.id);

    res.json({
      message: 'Accommodation request accepted and moved to accommodations',
      accommodation: newAccommodation
    });
  } catch (error) {
    console.error('Error accepting accommodation request:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.post("/:id/reject", auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to reject requests' });
    }

    const accommodationReq = await accommodationReqRepository.findById(req.params.id);
    if (!accommodationReq) {
      return res.status(404).json({ message: 'Accommodation request not found' });
    }

    const creator = await userRepository.findByUid(accommodationReq.createdBy);

    try {
      if (creator) {
        await notificationRepository.create({
          userId: creator._id,
          title: 'Accommodation Request Rejected',
          type: 'accommodation_rejected',
          message: `Your accommodation "${accommodationReq.name}" has been rejected.`
        });

        if (creator.email) {
          await emailConfig.sendEmail({
            to: creator.email,
            subject: 'Accommodation Request Rejected',
            text: `Your accommodation "${accommodationReq.name}" has been rejected. Please contact us for more information.`,
            html: `
              <h2>Accommodation Request Rejected</h2>
              <p>We're sorry, but your accommodation "${accommodationReq.name}" has been rejected.</p>
              <p>If you'd like more information or want to submit a revised request, please contact our support team.</p>
            `
          });
        }
      }
    } catch (notificationError) {
      console.error('Error sending rejection notification or email:', notificationError);
    }

    await accommodationReqRepository.deleteById(req.params.id);

    res.json({
      message: 'Accommodation request rejected and removed',
      accommodationRequest: accommodationReq
    });
  } catch (error) {
    console.error('Error rejecting accommodation request:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
