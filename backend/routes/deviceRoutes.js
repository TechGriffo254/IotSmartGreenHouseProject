const express = require('express');
const router = express.Router();
const DeviceControl = require('../models/DeviceControl');
const { auth } = require('../middleware/auth');
const { validateDeviceControl } = require('../middleware/validation');

// GET /api/devices/:greenhouseId - Get all devices for a greenhouse
router.get('/:greenhouseId', auth, async (req, res) => {
  try {
    const { greenhouseId } = req.params;
    const devices = await DeviceControl.getDevicesByGreenhouse(greenhouseId);
    
    res.json({
      success: true,
      data: devices,
      count: devices.length
    });
  } catch (error) {
    console.error('Error fetching devices:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch devices',
      error: error.message
    });
  }
});

// POST /api/devices - Create a new device
router.post('/', auth, validateDeviceControl, async (req, res) => {
  try {
    const device = new DeviceControl(req.body);
    await device.save();
    
    const io = req.app.get('io');
    io.to(`greenhouse-${device.greenhouseId}`).emit('deviceAdded', device);
    
    res.status(201).json({
      success: true,
      data: device,
      message: 'Device created successfully'
    });
  } catch (error) {
    console.error('Error creating device:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create device',
      error: error.message
    });
  }
});

// PUT /api/devices/:deviceId - Update device status or settings
router.put('/:deviceId', auth, async (req, res) => {
  try {
    const { deviceId } = req.params;
    const updates = req.body;
    
    const device = await DeviceControl.findOne({ deviceId });
    if (!device) {
      return res.status(404).json({
        success: false,
        message: 'Device not found'
      });
    }
    
    // Update device properties
    Object.keys(updates).forEach(key => {
      if (updates[key] !== undefined) {
        device[key] = updates[key];
      }
    });
    
    if (updates.status === 'ON') {
      device.lastActivated = new Date();
    }
    
    await device.save();
    
    const io = req.app.get('io');
    io.to(`greenhouse-${device.greenhouseId}`).emit('deviceUpdate', device);
    
    res.json({
      success: true,
      data: device,
      message: 'Device updated successfully'
    });
  } catch (error) {
    console.error('Error updating device:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update device',
      error: error.message
    });
  }
});

// POST /api/devices/:deviceId/toggle - Toggle device on/off
router.post('/:deviceId/toggle', auth, async (req, res) => {
  try {
    const { deviceId } = req.params;
    
    const device = await DeviceControl.findOne({ deviceId });
    if (!device) {
      return res.status(404).json({
        success: false,
        message: 'Device not found'
      });
    }
    
    await device.toggle();
    
    const io = req.app.get('io');
    io.to(`greenhouse-${device.greenhouseId}`).emit('deviceUpdate', device);
    
    res.json({
      success: true,
      data: device,
      message: `Device ${device.status.toLowerCase()} successfully`
    });
  } catch (error) {
    console.error('Error toggling device:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to toggle device',
      error: error.message
    });
  }
});

// POST /api/devices/:deviceId/automation - Set automation rules
router.post('/:deviceId/automation', auth, async (req, res) => {
  try {
    const { deviceId } = req.params;
    const { automationRules, autoMode } = req.body;
    
    const device = await DeviceControl.findOne({ deviceId });
    if (!device) {
      return res.status(404).json({
        success: false,
        message: 'Device not found'
      });
    }
    
    if (automationRules) {
      device.automationRules = { ...device.automationRules, ...automationRules };
    }
    
    if (autoMode !== undefined) {
      device.autoMode = autoMode;
    }
    
    await device.save();
    
    const io = req.app.get('io');
    io.to(`greenhouse-${device.greenhouseId}`).emit('deviceUpdate', device);
    
    res.json({
      success: true,
      data: device,
      message: 'Automation rules updated successfully'
    });
  } catch (error) {
    console.error('Error updating automation rules:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update automation rules',
      error: error.message
    });
  }
});

// GET /api/devices/stats/:greenhouseId - Get device usage statistics
router.get('/stats/:greenhouseId', auth, async (req, res) => {
  try {
    const { greenhouseId } = req.params;
    
    const stats = await DeviceControl.aggregate([
      { $match: { greenhouseId } },
      {
        $group: {
          _id: '$deviceType',
          totalDevices: { $sum: 1 },
          activeDevices: {
            $sum: { $cond: [{ $eq: ['$status', 'ON'] }, 1, 0] }
          },
          autoModeDevices: {
            $sum: { $cond: ['$autoMode', 1, 0] }
          },
          totalPowerConsumption: { $sum: '$powerConsumption' }
        }
      }
    ]);
    
    const totalStats = await DeviceControl.aggregate([
      { $match: { greenhouseId } },
      {
        $group: {
          _id: null,
          totalDevices: { $sum: 1 },
          totalActiveDevices: {
            $sum: { $cond: [{ $eq: ['$status', 'ON'] }, 1, 0] }
          },
          totalPowerConsumption: { $sum: '$powerConsumption' },
          totalAutoModeDevices: {
            $sum: { $cond: ['$autoMode', 1, 0] }
          }
        }
      }
    ]);
    
    res.json({
      success: true,
      data: {
        byType: stats,
        overall: totalStats[0] || {
          totalDevices: 0,
          totalActiveDevices: 0,
          totalPowerConsumption: 0,
          totalAutoModeDevices: 0
        }
      }
    });
  } catch (error) {
    console.error('Error fetching device stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch device statistics',
      error: error.message
    });
  }
});

// DELETE /api/devices/:deviceId - Delete a device
router.delete('/:deviceId', auth, async (req, res) => {
  try {
    const { deviceId } = req.params;
    
    const device = await DeviceControl.findOneAndDelete({ deviceId });
    if (!device) {
      return res.status(404).json({
        success: false,
        message: 'Device not found'
      });
    }
    
    const io = req.app.get('io');
    io.to(`greenhouse-${device.greenhouseId}`).emit('deviceRemoved', { deviceId });
    
    res.json({
      success: true,
      message: 'Device deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting device:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete device',
      error: error.message
    });
  }
});

module.exports = router;
