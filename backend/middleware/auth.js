const jwt = require('jsonwebtoken');
const User = require('../models/User');

const auth = async (req, res, next) => {
  console.log(`[AUTH] Processing request for ${req.method} ${req.url}`);
  
  try {
    let token = req.header('Authorization');
    
    if (token && token.startsWith('Bearer ')) {
      token = token.replace('Bearer ', '');
    }
    
    console.log(`[AUTH] Raw token: ${token ? (token.substring(0, 10) + '...') : 'none'}`);
    
    if (!token) {
      console.log('[AUTH] No token provided');
      return res.status(401).json({ message: 'No authentication token, access denied' });
    }
    
    console.log('[AUTH] Token exists, verifying...');
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    if (!decoded || !decoded.userId) {
      console.log('[AUTH] Invalid token structure');
      return res.status(401).json({ message: 'Invalid token structure' });
    }
    
    console.log(`[AUTH] Token valid for userId: ${decoded.userId}`);
    
    const user = await User.findById(decoded.userId);
    
    if (!user) {
      console.log('[AUTH] User not found in database');
      return res.status(401).json({ message: 'Token is valid but user not found' });
    }
    
    console.log(`[AUTH] User found: ${user.username}, role: ${user.role}`);
    
    req.user = user;
    req.userId = decoded.userId;
    
    next();
  } catch (error) {
    console.log('[AUTH] Error in auth middleware:', error.message);
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: 'Invalid token' });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token expired' });
    }
    res.status(401).json({ message: 'Token is not valid' });
  }
};

const isAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Access denied. Admin only.' });
  }
  next();
};

module.exports = { auth, isAdmin }; 