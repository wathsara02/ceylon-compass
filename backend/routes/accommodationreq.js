const express = require("express");
const router = express.Router();
const AccommodationReq = require("../models/AccommodationReq");
const Accommodation = require("../models/Accommodation");
const Notification = require("../models/Notification");
const { auth } = require("../middleware/auth");
const emailConfig = require('../config/emailConfig');

console.log("Loading /api/accommodationreq route");

router.post("/", auth, async (req, res) => {
  try {
    if (!req.user || !req.user._id) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    console.log('Received accommodation request:', JSON.stringify(req.body));

    const requiredFields = [
      'name', 'description', 'type', 
      'country', 'city', 'address',
      'price', 'capacity', 'images', 'contactNumber'
    ];
    
    const missingFields = requiredFields.filter(field => !req.body[field]);

    if (missingFields.length > 0) {
      console.log('Missing fields:', missingFields);
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
      return res.status(400).json({ 
        message: 'At least one image is required' 
      });
    }

    const accommodationReqData = {
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
    };

    console.log('Creating accommodation request with data:', accommodationReqData);
    const accommodationReq = new AccommodationReq(accommodationReqData);
    await accommodationReq.save();

    res.status(201).json(accommodationReq);
  } catch (error) {
    if (error.name === 'ValidationError') {
      console.error('Validation error:', error.errors);
      return res.status(400).json({ 
        message: 'Validation error', 
        errors: error.errors 
      });
    }
    console.error('Error creating accommodation request:', error);
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

    const accommodationReqs = await AccommodationReq.find()
      .sort({ createdAt: -1 })
      .populate({
        path: 'createdBy',
        select: 'username email',
        model: 'User'
      });

    console.log('Fetched accommodation requests count:', accommodationReqs.length);
    if (accommodationReqs.length > 0) {
      console.log('First request ID:', accommodationReqs[0]._id);
      console.log('First request createdBy:', accommodationReqs[0].createdBy);
      if (accommodationReqs[0].createdBy) {
        console.log('Username:', accommodationReqs[0].createdBy.username);
        console.log('Email:', accommodationReqs[0].createdBy.email);
      }
    }
    
    res.json(accommodationReqs);
  } catch (error) {
    console.error('Error fetching accommodation requests:', error);
    res.status(500).json({ 
      message: 'Server error', 
      error: error.message 
    });
  }
});

router.get("/user", auth, async (req, res) => {
  try {
    const accommodationReqs = await AccommodationReq.find({ createdBy: req.user._id })
      .sort({ createdAt: -1 });

    res.json(accommodationReqs);
  } catch (error) {
    console.error('Error fetching user accommodation requests:', error);
    res.status(500).json({ 
      message: 'Server error', 
      error: error.message 
    });
  }
});

router.get("/:id", auth, async (req, res) => {
  try {
    console.log(`Fetching accommodation request with ID: ${req.params.id}`);
    
    const accommodationReq = await AccommodationReq.findById(req.params.id)
      .populate({
        path: 'createdBy',
        select: 'username email',
        model: 'User'
      });

    if (!accommodationReq) {
      return res.status(404).json({ message: 'Accommodation request not found' });
    }

    console.log('Found accommodation request:', {
      id: accommodationReq._id,
      name: accommodationReq.name,
      hasCreatedBy: !!accommodationReq.createdBy,
      createdByType: typeof accommodationReq.createdBy
    });
    
    if (accommodationReq.createdBy) {
      console.log('CreatedBy details:', {
        id: accommodationReq.createdBy._id,
        username: accommodationReq.createdBy.username,
        email: accommodationReq.createdBy.email
      });
    }

    if (req.user.role !== 'admin' && accommodationReq.createdBy && 
        accommodationReq.createdBy._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json(accommodationReq);
  } catch (error) {
    console.error('Error fetching accommodation request:', error);
    res.status(500).json({ 
      message: 'Server error', 
      error: error.message 
    });
  }
});

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

router.post("/test-accept", auth, async (req, res) => {
  console.log("Test accept endpoint hit successfully");
  console.log("User from auth middleware:", req.user);
  res.json({ success: true, message: "Test accept endpoint working" });
});

router.post("/direct-accept/:id", auth, async (req, res) => {
  try {
    console.log(`Direct accept test for ID: ${req.params.id}`);
    console.log("User from auth middleware:", req.user);
    
    const accommodationReq = await AccommodationReq.findById(req.params.id);
    
    if (!accommodationReq) {
      console.log("Accommodation request not found");
      return res.status(404).json({ message: 'Accommodation request not found' });
    }
    
    console.log("Found accommodation request:", {
      id: accommodationReq._id,
      name: accommodationReq.name
    });
    
    res.json({ 
      success: true, 
      message: "Direct accept endpoint found the accommodation request", 
      data: {
        id: accommodationReq._id,
        name: accommodationReq.name
      }
    });
  } catch (error) {
    console.error("Error in direct accept test:", error);
    res.status(500).json({ message: error.message });
  }
});

router.post("/:id/accept", auth, async (req, res) => {
  console.log(`=== Accommodation Accept Route ID=${req.params.id} ===`);
  console.log("Headers:", JSON.stringify(req.headers, null, 2));
  console.log("User:", req.user ? {
    id: req.user._id,
    role: req.user.role,
    email: req.user.email
  } : 'No user data');
  console.log("Params:", req.params);
  
  try {
    if (!req.user || req.user.role !== 'admin') {
      console.log("Not admin, rejecting request. User:", req.user);
      return res.status(403).json({ message: 'Not authorized to accept requests' });
    }

    console.log(`Accepting accommodation request with ID: ${req.params.id}`);

    const accommodationReq = await AccommodationReq.findById(req.params.id)
      .populate('createdBy', 'username email');
    
    if (!accommodationReq) {
      console.log(`Accommodation request not found with ID: ${req.params.id}`);
      return res.status(404).json({ message: 'Accommodation request not found' });
    }

    console.log('Found accommodation request to accept:', {
      id: accommodationReq._id,
      name: accommodationReq.name,
      createdBy: accommodationReq.createdBy ? {
        id: accommodationReq.createdBy._id,
        username: accommodationReq.createdBy.username,
        email: accommodationReq.createdBy.email
      } : 'No createdBy data'
    });

    const locationData = accommodationReq.location || {};
    const country = locationData.country || accommodationReq.country || '';
    const city = locationData.city || accommodationReq.city || '';
    const address = locationData.address || accommodationReq.address || '';

    console.log('Location data for new accommodation:', { country, city, address });

    const mappedType = mapAccommodationType(accommodationReq.type);
    console.log('Mapped type:', mappedType);

    const newAccommodation = new Accommodation({
      name: accommodationReq.name || 'Unnamed Accommodation',
      description: accommodationReq.description || '',
      type: mappedType,
      country: country,
      city: city,
      address: address,
      price: accommodationReq.price || 0,
      priceRange: getPriceRange(accommodationReq.price || 0),
      amenities: accommodationReq.amenities || [],
      images: accommodationReq.images || [],
      contactNumber: accommodationReq.contactNumber || '',
      email: accommodationReq.createdBy && accommodationReq.createdBy.email ? accommodationReq.createdBy.email : 'no-email@example.com',
      website: '',
      createdBy: accommodationReq.createdBy && accommodationReq.createdBy._id ? accommodationReq.createdBy._id : null,
      status: 'approved'
    });

    console.log('New accommodation data:', {
      name: newAccommodation.name,
      type: newAccommodation.type,
      country: newAccommodation.country,
      city: newAccommodation.city,
      address: newAccommodation.address
    });

    await newAccommodation.save();

    const userEmail = accommodationReq.createdBy && accommodationReq.createdBy.email 
      ? accommodationReq.createdBy.email 
      : null;
    
    const userId = accommodationReq.createdBy && accommodationReq.createdBy._id 
      ? accommodationReq.createdBy._id 
      : null;
      
    if (userId) {
      try {
        const notification = new Notification({
          userId: userId,
          title: 'Accommodation Request Accepted',
          type: 'accommodation_accepted',
          message: `Your accommodation "${accommodationReq.name}" has been accepted!`,
          read: false
        });
        
        await notification.save();
        console.log('Notification saved successfully');
        
        if (userEmail) {
          await emailConfig.sendEmail({
            to: userEmail,
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
          
          console.log('Email notification sent successfully');
        } else {
          console.log('No valid email found for user, skipping email notification');
        }
      } catch (notificationError) {
        console.error('Error sending notification or email:', notificationError);
      }
    } else {
      console.log('No valid user ID found, skipping notifications');
    }

    await AccommodationReq.findByIdAndDelete(req.params.id);

    res.json({ 
      message: 'Accommodation request accepted and moved to accommodations',
      accommodation: newAccommodation
    });
  } catch (error) {
    console.error('Error accepting accommodation request:', error);
    console.error('Error stack:', error.stack);
    if (error.name === 'ValidationError') {
      const validationErrors = Object.keys(error.errors).map(field => ({
        field,
        message: error.errors[field].message
      }));
      console.error('Validation errors:', validationErrors);
      return res.status(400).json({ 
        message: 'Validation error', 
        errors: validationErrors
      });
    }
    res.status(500).json({ 
      message: 'Server error', 
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

router.post("/:id/reject", auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to reject requests' });
    }

    const accommodationReq = await AccommodationReq.findById(req.params.id)
      .populate({
        path: 'createdBy',
        select: 'username email',
        model: 'User'
      });

    if (!accommodationReq) {
      return res.status(404).json({ message: 'Accommodation request not found' });
    }

    const accommodationRequestCopy = JSON.parse(JSON.stringify(accommodationReq));

    try {
      const notification = new Notification({
        userId: accommodationReq.createdBy._id,
        title: 'Accommodation Request Rejected',
        type: 'accommodation_rejected',
        message: `Your accommodation "${accommodationReq.name}" has been rejected.`,
        read: false
      });
      
      await notification.save();
      
      await emailConfig.sendEmail({
        to: accommodationReq.createdBy.email,
        subject: 'Accommodation Request Rejected',
        text: `Your accommodation "${accommodationReq.name}" has been rejected. Please contact us for more information.`,
        html: `
          <h2>Accommodation Request Rejected</h2>
          <p>We're sorry, but your accommodation "${accommodationReq.name}" has been rejected.</p>
          <p>If you'd like more information or want to submit a revised request, please contact our support team.</p>
        `
      });
      
      console.log('Rejection email sent successfully');
      
    } catch (notificationError) {
      console.error('Error sending rejection notification or email:', notificationError);
    }

    const deleteResult = await AccommodationReq.findByIdAndDelete(req.params.id);
    console.log('Accommodation request deleted successfully:', deleteResult ? 'Yes' : 'No');

    res.json({ 
      message: 'Accommodation request rejected and removed',
      accommodationRequest: accommodationRequestCopy
    });
  } catch (error) {
    console.error('Error rejecting accommodation request:', error);
    res.status(500).json({ 
      message: 'Server error', 
      error: error.message 
    });
  }
});

module.exports = router;