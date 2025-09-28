const express = require("express");
const router = express.Router();
const RestaurantReq = require("../models/RestaurantReq");
const Restaurant = require("../models/Restaurant");
const Notification = require("../models/Notification");
const { auth } = require("../middleware/auth");
const emailConfig = require('../config/emailConfig');

console.log("Loading /api/restaurantreq route");

router.post("/", auth, async (req, res) => {
  try {
    if (!req.user || !req.user._id) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    console.log('Restaurant request body:', req.body);

    const requiredFields = [
      'name', 'cuisine', 'country', 'city', 
      'address', 'description', 
      'contactNumber', 'openingHours', 'images'
    ];
    
    const missingFields = requiredFields.filter(field => !req.body[field]);
    
    if (missingFields.length > 0) {
      console.log('Missing fields:', missingFields);
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

    if (!req.body.cloudName) req.body.cloudName = 'dzetdg1sz';
    if (!req.body.uploadPreset) req.body.uploadPreset = 'restaurants';

    const restaurantReqData = {
      ...req.body,
      createdBy: req.user._id,
      status: 'pending'
    };

    const restaurantReq = new RestaurantReq(restaurantReqData);
    await restaurantReq.save();

    res.status(201).json(restaurantReq);
  } catch (error) {
    if (error.name === 'ValidationError') {
      console.error('Mongoose validation error:', error);
      return res.status(400).json({ 
        message: 'Validation error', 
        errors: error.errors,
        details: Object.values(error.errors).map(err => err.message).join(', ')
      });
    }
    console.error('Error creating restaurant request:', error);
    res.status(500).json({ 
      message: 'Server error', 
      error: error.message 
    });
  }
});

router.post("/:id/accept", auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to accept requests' });
    }

    const restaurantReq = await RestaurantReq.findById(req.params.id)
      .populate('createdBy', 'username email');
    
    if (!restaurantReq) {
      return res.status(404).json({ message: 'Restaurant request not found' });
    }

    console.log('Found restaurant request to accept:', {
      id: restaurantReq._id,
      name: restaurantReq.name,
      createdBy: restaurantReq.createdBy ? {
        id: restaurantReq.createdBy._id,
        username: restaurantReq.createdBy.username,
        email: restaurantReq.createdBy.email
      } : 'No createdBy data'
    });

    let newRestaurant;

    try {
      const mainImage = restaurantReq.images && restaurantReq.images.length > 0 
        ? restaurantReq.images[0] 
        : 'default-restaurant.jpg';
      
      const newRestaurantData = {
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
        cloudName: restaurantReq.cloudName || 'dzetdg1sz',
        uploadPreset: restaurantReq.uploadPreset || 'restaurants',
        createdBy: restaurantReq.createdBy?._id || restaurantReq.createdBy,
        status: 'approved'
      };
      
      console.log('Restaurant request website field:', restaurantReq.website);
      console.log('New restaurant website field:', newRestaurantData.website);
      
      console.log('Creating new restaurant with data:', JSON.stringify(newRestaurantData, null, 2));
      
      const Restaurant = require('../models/Restaurant');
      const restaurantSchema = Restaurant.schema.obj;
      console.log('Restaurant schema required fields:', 
        Object.keys(restaurantSchema)
          .filter(key => restaurantSchema[key].required)
          .map(key => ({ field: key, type: restaurantSchema[key].type?.name || 'unknown' }))
      );
      
      if (restaurantSchema.status) {
        console.log('Status field exists in Restaurant schema');
      } else {
        console.warn('Status field does not exist in Restaurant schema - this could cause issues');
      }
      
      newRestaurant = new Restaurant(newRestaurantData);

      const validationError = newRestaurant.validateSync();
      if (validationError) {
        console.error('Validation error:', validationError);
        return res.status(400).json({ 
          message: 'Validation error', 
          errors: validationError.errors 
        });
      }

      await newRestaurant.save();
      console.log('New restaurant saved successfully with ID:', newRestaurant._id);
    
    } catch (saveError) {
      console.error('Error saving new restaurant:', saveError);
      return res.status(500).json({ 
        message: 'Error saving restaurant', 
        error: saveError.message,
        details: saveError.toString(),
        stack: saveError.stack
      });
    }

    const userEmail = restaurantReq.createdBy && restaurantReq.createdBy.email 
      ? restaurantReq.createdBy.email 
      : null;
    
    const userId = restaurantReq.createdBy && restaurantReq.createdBy._id 
      ? restaurantReq.createdBy._id 
      : null;
      
    if (userId) {
      try {
        const notification = new Notification({
          userId: userId,
          title: 'Restaurant Request Accepted',
          type: 'restaurant_accepted',
          message: `Your restaurant "${restaurantReq.name}" has been accepted!`,
          read: false
        });
        
        await notification.save();
        console.log('Notification saved successfully');
        
        if (userEmail) {
          try {
            await emailConfig.sendEmail({
              to: userEmail,
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
            
            console.log('Email notification sent successfully');
          } catch (emailError) {
            console.error('Error sending email notification:', emailError);
          }
        } else {
          console.log('No valid email found for user, skipping email notification');
        }
      } catch (notificationError) {
        console.error('Error creating notification:', notificationError);
      }
    } else {
      console.log('No valid user ID found, skipping notifications');
    }

    try {
      await RestaurantReq.findByIdAndDelete(req.params.id);
      console.log('Original request deleted successfully');
    } catch (deleteError) {
      console.error('Error deleting original request:', deleteError);
    }

    if (!newRestaurant) {
      return res.status(500).json({ 
        message: 'Failed to create restaurant - unknown error'
      });
    }

    res.json({ 
      message: 'Restaurant request accepted and moved to restaurants',
      restaurant: newRestaurant
    });
  } catch (error) {
    console.error('Error accepting restaurant request:', error);
    res.status(500).json({ 
      message: 'Server error', 
      error: error.message,
      stack: error.stack
    });
  }
});

router.post("/:id/reject", auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to reject requests' });
    }

    const restaurantReq = await RestaurantReq.findById(req.params.id)
      .populate('createdBy', 'username email');

    if (!restaurantReq) {
      return res.status(404).json({ message: 'Restaurant request not found' });
    }

    const restaurantRequestCopy = JSON.parse(JSON.stringify(restaurantReq));

    try {
      const notification = new Notification({
        userId: restaurantReq.createdBy._id,
        type: 'restaurant_rejected',
        message: `Your restaurant "${restaurantReq.name}" has been rejected.`,
        read: false
      });
      
      await notification.save();
      
      await emailConfig.sendEmail({
        to: restaurantReq.createdBy.email,
        subject: 'Restaurant Request Rejected',
        text: `Your restaurant "${restaurantReq.name}" has been rejected. Please contact us for more information.`,
        html: `
          <h2>Restaurant Request Rejected</h2>
          <p>We're sorry, but your restaurant "${restaurantReq.name}" has been rejected.</p>
          <p>If you'd like more information or want to submit a revised request, please contact our support team.</p>
        `
      });
      
      console.log('Rejection email sent successfully');
      
    } catch (notificationError) {
      console.error('Error sending rejection notification or email:', notificationError);
    }

    const deleteResult = await RestaurantReq.findByIdAndDelete(req.params.id);
    console.log('Restaurant request deleted successfully:', deleteResult ? 'Yes' : 'No');

    res.json({ 
      message: 'Restaurant request rejected and removed',
      restaurantRequest: restaurantRequestCopy
    });
  } catch (error) {
    console.error('Error rejecting restaurant request:', error);
    res.status(500).json({ 
      message: 'Server error', 
      error: error.message 
    });
  }
});

router.get("/", auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin only.' });
    }

    const restaurantReqs = await RestaurantReq.find()
      .sort({ createdAt: -1 })
      .populate('createdBy', 'username email');

    res.json(restaurantReqs);
  } catch (error) {
    console.error('Error fetching restaurant requests:', error);
    res.status(500).json({ 
      message: 'Server error', 
      error: error.message 
    });
  }
});

router.get("/user", auth, async (req, res) => {
  try {
    const restaurantReqs = await RestaurantReq.find({ createdBy: req.user._id })
      .sort({ createdAt: -1 });

    res.json(restaurantReqs);
  } catch (error) {
    console.error('Error fetching user restaurant requests:', error);
    res.status(500).json({ 
      message: 'Server error', 
      error: error.message 
    });
  }
});

router.get("/:id", auth, async (req, res) => {
  try {
    const restaurantReq = await RestaurantReq.findById(req.params.id)
      .populate('createdBy', 'username email');

    if (!restaurantReq) {
      return res.status(404).json({ message: 'Restaurant request not found' });
    }

    if (req.user.role !== 'admin' && restaurantReq.createdBy._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json(restaurantReq);
  } catch (error) {
    console.error('Error fetching restaurant request:', error);
    res.status(500).json({ 
      message: 'Server error', 
      error: error.message 
    });
  }
});

module.exports = router; 