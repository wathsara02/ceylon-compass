const express = require('express');
const router = express.Router();
const eventReqRepository = require('../repositories/eventReqRepository');
const eventRepository = require('../repositories/eventRepository');
const notificationRepository = require('../repositories/notificationRepository');
const userRepository = require('../repositories/userRepository');
const attachCreator = require('../utils/attachCreator');
const { auth } = require('../middleware/auth');
const emailConfig = require('../config/emailConfig');

// Create a new event request
router.post("/", auth, async (req, res) => {
  try {
    const requiredFields = [
      'title', 'description', 'date', 'time',
      'country', 'city', 'address', 'organizer',
      'category', 'image', 'capacity'
    ];
    const missingFields = requiredFields.filter(field => !req.body[field]);

    if (missingFields.length > 0) {
      return res.status(400).json({
        message: 'Missing required fields',
        fields: missingFields
      });
    }

    const eventReq = await eventReqRepository.create({
      ...req.body,
      createdBy: req.user._id,
      status: 'pending'
    });

    res.status(201).json(eventReq);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get all event requests (admin only)
router.get("/", auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin only.' });
    }

    const eventReqs = await eventReqRepository.findAll();
    res.json(await attachCreator(eventReqs));
  } catch (error) {
    console.error('Error fetching event requests:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get all pending event requests (admin only)
router.get("/pending", auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to view pending requests' });
    }

    const eventReqs = await eventReqRepository.findByStatus('pending');
    res.json(await attachCreator(eventReqs));
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update event request status (admin only)
router.put("/:id/status", auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to update request status' });
    }

    const { status } = req.body;
    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const eventReq = await eventReqRepository.updateById(req.params.id, { status });
    if (!eventReq) {
      return res.status(404).json({ message: 'Event request not found' });
    }

    res.json(eventReq);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Accept event request and move to events collection (admin only)
router.post("/:id/accept", auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to accept requests' });
    }

    const eventReq = await eventReqRepository.findById(req.params.id);
    if (!eventReq) {
      return res.status(404).json({ message: 'Event request not found' });
    }

    const creator = await userRepository.findByUid(eventReq.createdBy);

    const newEvent = await eventRepository.create({
      title: eventReq.title,
      description: eventReq.description,
      date: eventReq.date,
      time: eventReq.time,
      country: eventReq.country,
      city: eventReq.city,
      address: eventReq.address,
      organizer: {
        name: eventReq.organizer.name,
        contactNumber: eventReq.organizer.contactNumber,
        email: eventReq.organizer.email
      },
      image: eventReq.image,
      category: eventReq.category,
      price: eventReq.price || 0,
      capacity: eventReq.capacity,
      createdBy: eventReq.createdBy,
      status: 'approved'
    });

    if (creator) {
      try {
        await notificationRepository.create({
          userId: creator._id,
          title: 'Event Request Accepted',
          type: 'event_accepted',
          message: `Your event "${eventReq.title}" has been accepted!`
        });

        if (creator.email) {
          const formattedDate = new Date(eventReq.date.toDate ? eventReq.date.toDate() : eventReq.date).toLocaleDateString();
          await emailConfig.sendEmail({
            to: creator.email,
            subject: 'Event Request Accepted',
            text: `Your event "${eventReq.title}" has been accepted! You can now see it on our platform.`,
            html: `
              <h2>Event Request Accepted</h2>
              <p>Congratulations! Your event "${eventReq.title}" has been accepted and is now live on our platform.</p>
              <p>Details:</p>
              <ul>
                <li><strong>Title:</strong> ${eventReq.title}</li>
                <li><strong>Date:</strong> ${formattedDate}</li>
                <li><strong>Time:</strong> ${eventReq.time}</li>
                <li><strong>Location:</strong> ${eventReq.address}, ${eventReq.city}, ${eventReq.country}</li>
                <li><strong>Organizer:</strong> ${eventReq.organizer.name}</li>
                <li><strong>Category:</strong> ${eventReq.category}</li>
              </ul>
              <p>Thank you for contributing to our platform!</p>
            `
          });
        }
      } catch (notificationError) {
        console.error('Error sending notification or email:', notificationError);
      }
    }

    await eventReqRepository.deleteById(req.params.id);

    res.json({
      message: 'Event request accepted and moved to events',
      event: newEvent
    });
  } catch (error) {
    console.error('Error accepting event request:', error);
    res.status(500).json({
      message: 'Server error while accepting event request',
      error: error.message
    });
  }
});

// Reject event request (admin only)
router.post("/:id/reject", auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to reject requests' });
    }

    const eventReq = await eventReqRepository.findById(req.params.id);
    if (!eventReq) {
      return res.status(404).json({ message: 'Event request not found' });
    }

    const creator = await userRepository.findByUid(eventReq.createdBy);

    if (creator) {
      try {
        await notificationRepository.create({
          userId: creator._id,
          type: 'event_rejected',
          message: `Your event "${eventReq.title}" has been rejected.`
        });

        if (creator.email) {
          await emailConfig.sendEmail({
            to: creator.email,
            subject: 'Event Request Rejected',
            text: `Your event "${eventReq.title}" has been rejected. Please contact us for more information.`,
            html: `
              <h2>Event Request Rejected</h2>
              <p>We're sorry, but your event "${eventReq.title}" has been rejected.</p>
              <p>If you'd like more information or want to submit a revised request, please contact our support team at ${process.env.EMAIL_USER}.</p>
            `
          });
        }
      } catch (notificationError) {
        console.error('Error sending rejection notification or email:', notificationError);
      }
    }

    await eventReqRepository.deleteById(req.params.id);

    res.json({
      message: 'Event request rejected and removed',
      eventRequest: eventReq
    });
  } catch (error) {
    console.error('Error rejecting event request:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
