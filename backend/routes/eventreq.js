const express = require("express");
const router = express.Router();
const EventReq = require("../models/EventReq");
const Event = require("../models/Event");
const Notification = require("../models/Notification");
const { auth } = require("../middleware/auth");
const emailConfig = require('../config/emailConfig');

// Create a new event request
router.post("/", auth, async (req, res) => {
  try {
    if (!req.user || !req.user._id) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    // Validate required fields
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

    const eventReqData = {
      ...req.body,
      createdBy: req.user._id,
      status: 'pending'
    };

    const eventReq = new EventReq(eventReqData);
    await eventReq.save();

    res.status(201).json(eventReq);
  } catch (error) {
    if (error.name === 'ValidationError') {
      return res.status(400).json({ 
        message: 'Validation error', 
        errors: error.errors 
      });
    }
    res.status(500).json({ 
      message: 'Server error', 
      error: error.message 
    });
  }
});

// Get all event requests (admin only)
router.get("/", auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin only.' });
    }

    const eventReqs = await EventReq.find()
      .sort({ createdAt: -1 })
      .populate('createdBy', 'username email');

    res.json(eventReqs);
  } catch (error) {
    console.error('Error fetching event requests:', error);
    res.status(500).json({ 
      message: 'Server error', 
      error: error.message 
    });
  }
});

// Get all pending event requests (admin only)
router.get("/pending", auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to view pending requests' });
    }

    const eventReqs = await EventReq.find({ status: 'pending' })
      .sort({ createdAt: -1 })
      .populate('createdBy', 'username email');

    res.json(eventReqs);
  } catch (error) {
    res.status(500).json({ 
      message: 'Server error', 
      error: error.message 
    });
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

    const eventReq = await EventReq.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );

    if (!eventReq) {
      return res.status(404).json({ message: 'Event request not found' });
    }

    res.json(eventReq);
  } catch (error) {
    res.status(500).json({ 
      message: 'Server error', 
      error: error.message 
    });
  }
});

// Accept event request and move to events collection (admin only)
router.post("/:id/accept", auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to accept requests' });
    }

    // Find the event request and populate the user info
    const eventReq = await EventReq.findById(req.params.id)
      .populate('createdBy', 'username email');
    
    if (!eventReq) {
      return res.status(404).json({ message: 'Event request not found' });
    }

    console.log('Found event request to accept:', {
      id: eventReq._id,
      title: eventReq.title,
      createdBy: eventReq.createdBy ? {
        id: eventReq.createdBy._id,
        username: eventReq.createdBy.username,
        email: eventReq.createdBy.email
      } : 'No createdBy data'
    });

    // Debug: Log the full eventReq object
    console.log('Full eventReq:', JSON.stringify(eventReq, null, 2));

    // Create new event from the request data
    const newEventData = {
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
      createdBy: eventReq.createdBy._id,
      status: 'approved'
    };

    // Debug: Log the data being used to create the new event
    console.log('Attempting to create new event with data:', JSON.stringify(newEventData, null, 2));

    const newEvent = new Event(newEventData);

    // Debug: Log validation errors if any
    const validationError = newEvent.validateSync();
    if (validationError) {
      console.error('Validation error:', validationError);
      return res.status(400).json({ 
        message: 'Event validation failed', 
        errors: validationError.errors 
      });
    }

    // Save the new event
    await newEvent.save();
    console.log('New event saved successfully:', newEvent._id);

    // Make sure we have a valid user email before attempting to send notifications
    const userEmail = eventReq.createdBy && eventReq.createdBy.email 
      ? eventReq.createdBy.email 
      : null;
    
    const userId = eventReq.createdBy && eventReq.createdBy._id 
      ? eventReq.createdBy._id 
      : null;
      
    if (userId) {
      try {
        // Create notification
        const notification = new Notification({
          userId: userId,
          title: 'Event Request Accepted',
          type: 'event_accepted',
          message: `Your event "${eventReq.title}" has been accepted!`,
          read: false
        });
        
        await notification.save();
        console.log('Notification saved successfully');
        
        // Only attempt to send email if we have a valid email address
        if (userEmail) {
          // Format date for email
          const formattedDate = new Date(eventReq.date).toLocaleDateString();
          
          // Send email notification using the centralized email config
          await emailConfig.sendEmail({
            to: userEmail,
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
          
          console.log('Email notification sent successfully');
        } else {
          console.log('No valid email found for user, skipping email notification');
        }
      } catch (notificationError) {
        // Log error but don't fail the overall request
        console.error('Error sending notification or email:', notificationError);
      }
    } else {
      console.log('No valid user ID found, skipping notifications');
    }

    // Delete the original request
    await EventReq.findByIdAndDelete(req.params.id);

    res.json({ 
      message: 'Event request accepted and moved to events',
      event: newEvent
    });
  } catch (error) {
    console.error('Error accepting event request:', error);
    
    // More detailed error information
    if (error.name === 'ValidationError') {
      return res.status(400).json({ 
        message: 'Validation error', 
        errors: error.errors 
      });
    }
    
    if (error.name === 'CastError') {
      return res.status(400).json({ 
        message: 'Invalid ID format',
        error: error.message
      });
    }
    
    if (error.code === 11000) {
      return res.status(400).json({ 
        message: 'Duplicate key error',
        error: error.message
      });
    }
    
    // Send a more informative error response
    res.status(500).json({ 
      message: 'Server error while accepting event request', 
      error: error.message,
      stack: process.env.NODE_ENV === 'production' ? undefined : error.stack
    });
  }
});

// Reject event request (admin only)
router.post("/:id/reject", auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to reject requests' });
    }

    // Find the event request
    const eventReq = await EventReq.findById(req.params.id)
      .populate('createdBy', 'username email');

    if (!eventReq) {
      return res.status(404).json({ message: 'Event request not found' });
    }

    // Store a copy of the event request data for the response
    const eventRequestCopy = JSON.parse(JSON.stringify(eventReq));

    // Make sure we have a valid user before proceeding with notifications
    if (eventReq.createdBy && eventReq.createdBy._id) {
      try {
        // Create notification
        const notification = new Notification({
          userId: eventReq.createdBy._id,
          type: 'event_rejected',
          message: `Your event "${eventReq.title}" has been rejected.`,
          read: false
        });
        
        await notification.save();
        
        // Only send email if we have a valid email address
        if (eventReq.createdBy.email) {
          // Send email notification using the centralized email config
          await emailConfig.sendEmail({
            to: eventReq.createdBy.email,
            subject: 'Event Request Rejected',
            text: `Your event "${eventReq.title}" has been rejected. Please contact us for more information.`,
            html: `
              <h2>Event Request Rejected</h2>
              <p>We're sorry, but your event "${eventReq.title}" has been rejected.</p>
              <p>If you'd like more information or want to submit a revised request, please contact our support team at ${process.env.EMAIL_USER}.</p>
            `
          });
          
          console.log('Rejection email sent successfully');
        } else {
          console.log('No valid email found for user, skipping email notification');
        }
      } catch (notificationError) {
        // Log error but don't fail the overall request
        console.error('Error sending rejection notification or email:', notificationError);
      }
    } else {
      console.log('No valid user ID found, skipping notifications');
    }

    // Delete the event request
    const deleteResult = await EventReq.findByIdAndDelete(req.params.id);
    console.log('Event request deleted successfully:', deleteResult ? 'Yes' : 'No');

    res.json({ 
      message: 'Event request rejected and removed',
      eventRequest: eventRequestCopy
    });
  } catch (error) {
    console.error('Error rejecting event request:', error);
    res.status(500).json({ 
      message: 'Server error', 
      error: error.message 
    });
  }
});

module.exports = router;
