const { admin } = require('../config/firebaseAdmin');
const userRepository = require('../repositories/userRepository');

const auth = async (req, res, next) => {
  try {
    let token = req.header('Authorization');

    if (token && token.startsWith('Bearer ')) {
      token = token.replace('Bearer ', '');
    }

    if (!token) {
      return res.status(401).json({ message: 'No authentication token, access denied' });
    }

    const decoded = await admin.auth().verifyIdToken(token);
    const user = await userRepository.findByUid(decoded.uid);

    if (!user) {
      return res.status(401).json({ message: 'Token is valid but user not found' });
    }

    req.user = user;
    req.userId = decoded.uid;

    next();
  } catch (error) {
    console.log('[AUTH] Error in auth middleware:', error.message);

    if (error.code === 'auth/id-token-expired') {
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
