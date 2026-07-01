const express = require('express');
const router = express.Router();
const { admin } = require('../config/firebaseAdmin');
const userRepository = require('../repositories/userRepository');
const { auth } = require('../middleware/auth');

// Create the Firestore profile after the frontend has already created the
// Firebase Auth account via the client SDK (createUserWithEmailAndPassword).
router.post('/register-profile', async (req, res) => {
  try {
    const token = (req.header('Authorization') || '').replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ message: 'No authentication token, access denied' });
    }

    const decoded = await admin.auth().verifyIdToken(token);
    const { username, country, city } = req.body;

    if (!username || !country || !city) {
      return res.status(400).json({ message: 'username, country and city are required' });
    }

    const existingUsername = await userRepository.findByUsername(username);
    if (existingUsername) {
      // Roll back the orphaned Firebase Auth account created client-side
      await admin.auth().deleteUser(decoded.uid);
      return res.status(400).json({ message: 'Username already exists', field: 'username' });
    }

    await admin.auth().setCustomUserClaims(decoded.uid, { role: 'user' });

    const user = await userRepository.create(decoded.uid, {
      username,
      email: decoded.email,
      country,
      city,
      role: 'user'
    });

    res.status(201).json({
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        country: user.country,
        city: user.city,
        role: user.role
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Resolves a username to its email so the frontend can call
// signInWithEmailAndPassword with a real email address.
router.get('/resolve-login', async (req, res) => {
  try {
    const { identifier } = req.query;

    if (!identifier) {
      return res.status(400).json({ message: 'identifier is required', field: 'usernameOrEmail' });
    }

    if (identifier.includes('@')) {
      return res.json({ email: identifier });
    }

    const user = await userRepository.findByUsername(identifier);
    if (!user) {
      return res.status(404).json({
        message: 'No account found with that username or email',
        field: 'usernameOrEmail'
      });
    }

    res.json({ email: user.email });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get user profile - Protected route
router.get('/profile', auth, async (req, res) => {
  const user = req.user;
  res.json({
    id: user._id,
    username: user.username,
    email: user.email,
    country: user.country,
    city: user.city,
    role: user.role
  });
});

// Update user profile - Protected route
router.put('/profile', auth, async (req, res) => {
  try {
    const { country, city, email } = req.body;
    const updates = {};
    if (country) updates.country = country;
    if (city) updates.city = city;
    if (email) updates.email = email;

    const user = await userRepository.updateByUid(req.userId, updates);

    res.json({
      id: user._id,
      username: user.username,
      email: user.email,
      country: user.country,
      city: user.city,
      role: user.role
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
