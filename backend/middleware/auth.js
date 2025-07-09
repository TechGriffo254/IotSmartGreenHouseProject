const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Authentication middleware
exports.auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access token is required'
      });
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    
    // Optional: Verify user still exists and is active
    const user = await User.findById(decoded.userId);
    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'User not found or inactive'
      });
    }
    
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token'
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expired'
      });
    }
    
    console.error('Auth middleware error:', error);
    res.status(500).json({
      success: false,
      message: 'Authentication failed',
      error: error.message
    });
  }
};

// Role-based authorization middleware
exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }
    
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Insufficient permissions'
      });
    }
    
    next();
  };
};

// Greenhouse access middleware
exports.checkGreenhouseAccess = (requiredPermissions = ['read']) => {
  return async (req, res, next) => {
    try {
      const { greenhouseId } = req.params;
      const userId = req.user.userId;
      
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }
      
      // Admin users have access to all greenhouses
      if (user.role === 'admin') {
        return next();
      }
      
      // Check greenhouse-specific permissions
      const greenhouseAccess = user.greenhouseAccess.find(
        access => access.greenhouseId === greenhouseId
      );
      
      if (!greenhouseAccess) {
        return res.status(403).json({
          success: false,
          message: 'Access denied to this greenhouse'
        });
      }
      
      // Check if user has required permissions
      const hasPermission = requiredPermissions.every(permission =>
        greenhouseAccess.permissions.includes(permission)
      );
      
      if (!hasPermission) {
        return res.status(403).json({
          success: false,
          message: `Insufficient permissions. Required: ${requiredPermissions.join(', ')}`
        });
      }
      
      next();
    } catch (error) {
      console.error('Greenhouse access middleware error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to check greenhouse access',
        error: error.message
      });
    }
  };
};
