const express = require('express');
const router = express.Router();
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const { auth } = require('../middleware/auth');
const { sendPasswordResetEmail } = require('../config/email');

// Register a new user
router.post('/register', async (req, res) => {
  try {
    const { username, email, password, country, city } = req.body;
    
    // Check if username already exists
    const existingUsername = await User.findOne({ username });
    if (existingUsername) {
      return res.status(400).json({ 
        message: 'Username already exists',
        field: 'username'
      });
    }
    
    // Check if email already exists
    const existingEmail = await User.findOne({ email });
    if (existingEmail) {
      return res.status(400).json({ 
        message: 'Email already exists',
        field: 'email'
      });
    }
    
    // Create new user
    const user = new User({
      username,
      email,
      password,
      country,
      city
    });
    
    await user.save();
    
    // Generate JWT token
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
    
    res.status(201).json({
      token,
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

// Login user
router.post('/login', async (req, res) => {
  try {
    const { usernameOrEmail, password } = req.body;
    console.log('Login attempt received:', {
      usernameOrEmail,
      hasPassword: !!password
    });
    
    if (!usernameOrEmail || !password) {
      console.log('Missing credentials:', { usernameOrEmail: !!usernameOrEmail, password: !!password });
      return res.status(400).json({ 
        message: 'Username/email and password are required',
        field: !usernameOrEmail ? 'usernameOrEmail' : 'password'
      });
    }
    
    // Find user by either username or email
    const user = await User.findOne({
      $or: [
        { username: usernameOrEmail },
        { email: usernameOrEmail }
      ]
    });
    
    if (!user) {
      console.log('No user found with:', usernameOrEmail);
      return res.status(400).json({ 
        message: 'No account found with that username or email',
        field: 'usernameOrEmail'
      });
    }
    
    console.log('User found:', {
      id: user._id,
      username: user.username,
      email: user.email
    });
    
    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      console.log('Password mismatch for user:', user.username);
      return res.status(400).json({ 
        message: 'Incorrect password',
        field: 'password'
      });
    }
    
    console.log('Password verified, generating token');
    // Generate JWT token
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
    
    res.json({
      token,
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
    console.error('Login error:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    res.status(500).json({ 
      message: 'Server error', 
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Get user profile - Protected route
router.get('/profile', auth, async (req, res) => {
  try {
    const user = req.user;
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.json({
      id: user._id,
      username: user.username,
      email: user.email,
      country: user.country,
      city: user.city,
      role: user.role
    });
  } catch (error) {
    console.error('Profile error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update user password - Protected route
router.put('/profile/password', auth, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    console.log('Password update request received for user:', req.userId);
    
    // Basic validation
    if (!currentPassword || !newPassword) {
      console.log('Missing password fields');
      return res.status(400).json({ message: 'Both current and new passwords are required' });
    }

    if (newPassword.length < 6) {
      console.log('New password too short');
      return res.status(400).json({ message: 'New password must be at least 6 characters long' });
    }

    // Get user from database
    const user = await User.findById(req.userId);
    if (!user) {
      console.log('User not found:', req.userId);
      return res.status(404).json({ message: 'User not found' });
    }

    console.log('Found user, checking current password');
    // Check current password
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      console.log('Current password is incorrect');
      return res.status(400).json({ message: 'Current password is incorrect' });
    }

    console.log('Current password verified, updating password');
    // Update user's password
    user.password = newPassword;  // The pre-save hook will hash this
    await user.save();

    console.log('Password updated successfully');
    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    console.error('Password update error:', {
      error: error.message,
      stack: error.stack,
      userId: req.userId
    });
    res.status(500).json({ 
      message: 'Failed to update password',
      error: error.message 
    });
  }
});

// Update user profile - Protected route
router.put('/profile', auth, async (req, res) => {
  try {
    const user = req.user;
    const { country, city, email } = req.body;
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Update fields
    if (country) user.country = country;
    if (city) user.city = city;
    if (email) user.email = email;
    
    await user.save();
    
    res.json({
      id: user._id,
      username: user.username,
      email: user.email,
      country: user.country,
      city: user.city,
      role: user.role
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Forgot Password
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    console.log('Forgot password request received for email:', email);
    
    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      console.log('No user found with email:', email);
      return res.status(404).json({ message: 'No account found with that email' });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(20).toString('hex');
    const resetExpires = Date.now() + 3600000; // 1 hour from now

    // Save reset token to user
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = resetExpires;
    await user.save();

    console.log('Reset token generated for user:', user._id);
    
    // Send reset email
    const emailSent = await sendPasswordResetEmail(user.email, resetToken);
    if (!emailSent) {
      console.error('Failed to send reset email to:', email);
      return res.status(500).json({ message: 'Failed to send reset email' });
    }

    console.log('Reset email sent successfully to:', email);
    res.json({ message: 'Password reset email sent' });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Reset Password
router.post('/reset-password/:token', async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;
    console.log('Reset password request received for token:', token);

    // Find user with valid reset token
    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() }
    });

    if (!user) {
      console.log('Invalid or expired reset token');
      return res.status(400).json({ message: 'Invalid or expired reset token' });
    }

    // Update password
    user.password = password;
    user.resetPasswordToken = null;
    user.resetPasswordExpires = null;
    await user.save();

    console.log('Password reset successfully for user:', user._id);
    res.json({ message: 'Password has been reset successfully' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router; 