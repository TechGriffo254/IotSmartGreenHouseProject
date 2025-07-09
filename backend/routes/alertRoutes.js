const express = require('express');
const router = express.Router();
const Alert = require('../models/Alert');
const { auth } = require('../middleware/auth');

// GET /api/alerts/:greenhouseId - Get alerts for a greenhouse
router.get('/:greenhouseId', auth, async (req, res) => {
  try {
    const { greenhouseId } = req.params;
    const { status = 'all', limit = 50, page = 1 } = req.query;
    
    let query = { greenhouseId };
    
    if (status === 'active') {
      query.isResolved = false;
    } else if (status === 'resolved') {
      query.isResolved = true;
    }
    
    const skip = (page - 1) * limit;
    
    const alerts = await Alert.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(skip);
    
    const totalCount = await Alert.countDocuments(query);
    
    res.json({
      success: true,
      data: alerts,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: totalCount,
        pages: Math.ceil(totalCount / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching alerts:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch alerts',
      error: error.message
    });
  }
});

// GET /api/alerts/active/:greenhouseId - Get active alerts
router.get('/active/:greenhouseId', auth, async (req, res) => {
  try {
    const { greenhouseId } = req.params;
    const activeAlerts = await Alert.getActiveAlerts(greenhouseId);
    
    res.json({
      success: true,
      data: activeAlerts,
      count: activeAlerts.length
    });
  } catch (error) {
    console.error('Error fetching active alerts:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch active alerts',
      error: error.message
    });
  }
});

// PUT /api/alerts/:alertId/resolve - Resolve an alert
router.put('/:alertId/resolve', auth, async (req, res) => {
  try {
    const { alertId } = req.params;
    const { actionTaken } = req.body;
    
    const alert = await Alert.findById(alertId);
    if (!alert) {
      return res.status(404).json({
        success: false,
        message: 'Alert not found'
      });
    }
    
    if (alert.isResolved) {
      return res.status(400).json({
        success: false,
        message: 'Alert is already resolved'
      });
    }
    
    await alert.resolve(req.user.username, actionTaken);
    
    const io = req.app.get('io');
    io.to(`greenhouse-${alert.greenhouseId}`).emit('alertResolved', alert);
    
    res.json({
      success: true,
      data: alert,
      message: 'Alert resolved successfully'
    });
  } catch (error) {
    console.error('Error resolving alert:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to resolve alert',
      error: error.message
    });
  }
});

// POST /api/alerts/:greenhouseId - Create manual alert
router.post('/:greenhouseId', auth, async (req, res) => {
  try {
    const { greenhouseId } = req.params;
    const alertData = {
      ...req.body,
      greenhouseId
    };
    
    const alert = new Alert(alertData);
    await alert.save();
    
    const io = req.app.get('io');
    io.to(`greenhouse-${greenhouseId}`).emit('newAlert', alert);
    
    res.status(201).json({
      success: true,
      data: alert,
      message: 'Alert created successfully'
    });
  } catch (error) {
    console.error('Error creating alert:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create alert',
      error: error.message
    });
  }
});

// GET /api/alerts/stats/:greenhouseId - Get alert statistics
router.get('/stats/:greenhouseId', auth, async (req, res) => {
  try {
    const { greenhouseId } = req.params;
    const { hours = 24 } = req.query;
    
    const startTime = new Date(Date.now() - hours * 60 * 60 * 1000);
    
    const stats = await Alert.aggregate([
      {
        $match: {
          greenhouseId,
          createdAt: { $gte: startTime }
        }
      },
      {
        $group: {
          _id: {
            alertType: '$alertType',
            severity: '$severity'
          },
          count: { $sum: 1 },
          resolved: {
            $sum: { $cond: ['$isResolved', 1, 0] }
          }
        }
      }
    ]);
    
    const severityStats = await Alert.aggregate([
      {
        $match: {
          greenhouseId,
          createdAt: { $gte: startTime }
        }
      },
      {
        $group: {
          _id: '$severity',
          count: { $sum: 1 },
          resolved: {
            $sum: { $cond: ['$isResolved', 1, 0] }
          }
        }
      }
    ]);
    
    const totalStats = await Alert.aggregate([
      {
        $match: {
          greenhouseId,
          createdAt: { $gte: startTime }
        }
      },
      {
        $group: {
          _id: null,
          totalAlerts: { $sum: 1 },
          totalResolved: {
            $sum: { $cond: ['$isResolved', 1, 0] }
          },
          totalActive: {
            $sum: { $cond: [{ $eq: ['$isResolved', false] }, 1, 0] }
          }
        }
      }
    ]);
    
    res.json({
      success: true,
      data: {
        byTypeAndSeverity: stats,
        bySeverity: severityStats,
        overall: totalStats[0] || {
          totalAlerts: 0,
          totalResolved: 0,
          totalActive: 0
        }
      },
      timeRange: { hours: parseInt(hours), from: startTime }
    });
  } catch (error) {
    console.error('Error fetching alert stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch alert statistics',
      error: error.message
    });
  }
});

// DELETE /api/alerts/:alertId - Delete an alert
router.delete('/:alertId', auth, async (req, res) => {
  try {
    const { alertId } = req.params;
    
    const alert = await Alert.findByIdAndDelete(alertId);
    if (!alert) {
      return res.status(404).json({
        success: false,
        message: 'Alert not found'
      });
    }
    
    const io = req.app.get('io');
    io.to(`greenhouse-${alert.greenhouseId}`).emit('alertDeleted', { alertId });
    
    res.json({
      success: true,
      message: 'Alert deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting alert:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete alert',
      error: error.message
    });
  }
});

module.exports = router;
