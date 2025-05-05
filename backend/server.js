require('dotenv').config(); // add this at the top of your file

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const { auth, isAdmin } = require('./middleware/auth');
const requestRoutes = require('./routes/requestRoutes');
const emailConfig = require('./config/emailConfig');
const { cleanupPastEvents } = require('./utils/eventCleanup');

// Create Express app
const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logger middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Add specific logging for locations routes
app.use('/api/locations', (req, res, next) => {
  console.log(`[LOCATIONS API] ${req.method} ${req.url} - Headers:`, JSON.stringify(req.headers));
  next();
});

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Initialize email service
emailConfig.initializeTransporter();

// Connect to MongoDB
console.log("Mongo URI:", process.env.MONGO_URI);
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
  .then(() => {
    console.log('Connected to MongoDB');
    
    // Run initial cleanup of past events
    cleanupPastEvents()
      .then(result => {
        console.log(`Initial cleanup completed. Deleted ${result.deleted} past events.`);
      })
      .catch(err => {
        console.error('Error during initial event cleanup:', err);
      });

    // Set up recurring daily cleanup
    setInterval(() => {
      cleanupPastEvents()
        .then(result => {
          console.log(`Scheduled cleanup completed. Deleted ${result.deleted} past events.`);
        })
        .catch(err => {
          console.error('Error during scheduled event cleanup:', err);
        });
    }, 24 * 60 * 60 * 1000); // Run every 24 hours
  })
  .catch(err => console.error('MongoDB connection error:', err));

// Create a dedicated email route for testing
app.post('/api/email/send', auth, isAdmin, async (req, res) => {
  try {
    const { to, subject, text, html } = req.body;
    
    if (!to || !subject || (!text && !html)) {
      return res.status(400).json({ message: 'Missing required email fields' });
    }
    
    const info = await emailConfig.sendEmail({
      to,
      subject,
      text,
      html
    });
    
    res.json({ message: 'Email sent successfully', messageId: info.messageId });
  } catch (error) {
    console.error('Error in email route:', error);
    res.status(500).json({ message: 'Error sending email', error: error.message });
  }
});

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/locations', require('./routes/locations'));
app.use('/api/restaurants', require('./routes/restaurants'));
app.use('/api/restaurantreq', auth, require('./routes/restaurantreq'));
app.use('/api/events', require('./routes/events'));
app.use('/api/eventreq', auth, require('./routes/eventreq'));
app.use('/api/accommodations', require('./routes/accommodations'));
app.use('/api/accommodationreq', auth, require('./routes/accommodationreq'));
app.use('/api/admin', auth, isAdmin, require('./routes/admin'));
app.use('/api/notifications', auth, require('./routes/notifications'));
app.use('/api/contact', require('./routes/contact'));
app.use('/api', requestRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!', error: err.message });
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});