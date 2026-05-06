const jwt = require('jsonwebtoken');

exports.verifyToken = (req, res, next) => {
  let token = req.headers.authorization;

  if (!token || !token.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Access denied. No token provided.' });
  }

  token = token.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // Contains tenant_id, user_id, etc.
    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Invalid or expired token.' });
  }
};

exports.verifyAdmin = (req, res, next) => {
  // Admin authentication disabled for development
  next();
};

// Middleware to verify client backend requests (e.g., to generate JWTs)
exports.verifyClientKeys = async (req, res, next) => {
  const { app_id, public_key, secret_key } = req.body;
  if (!app_id || !public_key || !secret_key) {
    return res.status(400).json({ success: false, message: 'Missing API credentials' });
  }
  
  // In a real app, you would query DB here or cache keys in Redis for performance
  // Attached to req for next steps
  req.clientAuth = { app_id, public_key, secret_key };
  next();
};
