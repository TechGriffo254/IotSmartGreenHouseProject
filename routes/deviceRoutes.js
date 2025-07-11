const express = require('express');
const router = express.Router();
const DeviceControl = require('../models/DeviceControl');
const DeviceControlLog = require('../models/DeviceControlLog');
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

// POST /api/devices/:deviceId/control - Manual device control from frontend
router.post('/:deviceId/control', auth, async (req, res) => {
  try {
    const { deviceId } = req.params;
    const { action, value } = req.body; // action: 'turn_on', 'turn_off', 'set_intensity', etc.
    
    console.log(`🎛️ Manual control request for device: ${deviceId}, action: ${action}`);
    
    const device = await DeviceControl.findOne({ deviceId });
    if (!device) {
      return res.status(404).json({
        success: false,
        message: 'Device not found'
      });
    }

    let newStatus = device.status;
    let message = '';

    switch (action) {
      case 'turn_on':
        newStatus = 'ON';
        message = `${device.deviceName} turned on`;
        device.lastActivated = new Date();
        break;
      case 'turn_off':
        newStatus = 'OFF';
        message = `${device.deviceName} turned off`;
        break;
      case 'open':
        newStatus = 'OPEN';
        message = `${device.deviceName} opened`;
        device.lastActivated = new Date();
        break;
      case 'close':
        newStatus = 'CLOSED';
        message = `${device.deviceName} closed`;
        break;
      case 'toggle':
        if (device.deviceType === 'SERVO') {
          newStatus = device.status === 'OPEN' ? 'CLOSED' : 'OPEN';
        } else {
          newStatus = device.status === 'ON' ? 'OFF' : 'ON';
        }
        message = `${device.deviceName} ${newStatus.toLowerCase()}`;
        if (newStatus === 'ON' || newStatus === 'OPEN') {
          device.lastActivated = new Date();
        }
        break;
      case 'set_intensity':
        if (value !== undefined) {
          device.intensity = Math.max(0, Math.min(100, value));
          message = `${device.deviceName} intensity set to ${device.intensity}%`;
        }
        break;
      case 'set_auto_mode':
        device.autoMode = value !== undefined ? value : !device.autoMode;
        message = `${device.deviceName} auto mode ${device.autoMode ? 'enabled' : 'disabled'}`;
        break;
      default:
        return res.status(400).json({
          success: false,
          message: 'Invalid action'
        });
    }

    device.status = newStatus;
    await device.save();

    // Create a control log entry
    const controlLogData = {
      deviceId: device.deviceId,
      deviceName: device.deviceName,
      deviceType: device.deviceType,
      action: action,
      previousStatus: device.status,
      newStatus: newStatus,
      intensity: device.intensity,
      controlSource: 'manual',
      userId: req.user.id,
      username: req.user.username,
      timestamp: new Date(),
      greenhouseId: device.greenhouseId
    };

    // Save control log to database
    try {
      await DeviceControlLog.logControl(controlLogData);
      console.log('📝 Device control logged to database');
    } catch (logError) {
      console.error('Error saving control log:', logError);
    }

    // Emit real-time update
    const io = req.app.get('io');
    if (io) {
      io.to(`greenhouse-${device.greenhouseId}`).emit('deviceUpdate', device);
      io.to(`greenhouse-${device.greenhouseId}`).emit('deviceControlled', {
        device: device,
        action: action,
        user: req.user.username,
        timestamp: new Date()
      });
    }

    res.json({
      success: true,
      data: device,
      message: message,
      controlLog: controlLogData
    });

  } catch (error) {
    console.error('Error controlling device:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to control device',
      error: error.message
    });
  }
});

// GET /api/devices/control-history/:greenhouseId - Get device control history
router.get('/control-history/:greenhouseId', auth, async (req, res) => {
  try {
    const { greenhouseId } = req.params;
    const { deviceId, limit = 50, startDate, endDate } = req.query;
    
    const filters = { greenhouseId };
    if (deviceId) filters.deviceId = deviceId;
    if (startDate) filters.startDate = startDate;
    if (endDate) filters.endDate = endDate;
    
    const history = await DeviceControlLog.getControlHistory(filters, parseInt(limit));
    
    res.json({
      success: true,
      data: history,
      count: history.length
    });
  } catch (error) {
    console.error('Error fetching control history:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch control history',
      error: error.message
    });
  }
});

// POST /api/devices/setup-iot-devices - Setup ESP32 IoT devices in database
router.post('/setup-iot-devices', auth, async (req, res) => {
  try {
    const { greenhouseId = 'greenhouse-001' } = req.body;
    
    console.log('🔧 Setting up IoT devices for greenhouse:', greenhouseId);
    
    const devices = [];
    
    // Create or update water pump device
    let waterPump = await DeviceControl.findOne({ deviceId: 'WATER_PUMP_001' });
    if (!waterPump) {
      waterPump = new DeviceControl({
        deviceId: 'WATER_PUMP_001',
        deviceName: 'Smart Water Pump',
        deviceType: 'WATER_PUMP',
        greenhouseId: greenhouseId,
        status: 'OFF',
        autoMode: true,
        location: 'Main Greenhouse',
        intensity: 100,
        powerConsumption: 25
      });
      await waterPump.save();
      devices.push(waterPump);
      console.log('✅ Created Smart Water Pump device');
    }
    
    // Create or update window servo device  
    let windowServo = await DeviceControl.findOne({ deviceId: 'WINDOW_SERVO_001' });
    if (!windowServo) {
      windowServo = new DeviceControl({
        deviceId: 'WINDOW_SERVO_001',
        deviceName: 'Automated Window',
        deviceType: 'SERVO',
        greenhouseId: greenhouseId,
        status: 'CLOSED',
        autoMode: true,
        location: 'Main Greenhouse',
        intensity: 90,
        powerConsumption: 5
      });
      await windowServo.save();
      devices.push(windowServo);
      console.log('✅ Created Automated Window device');
    }
    
    // Emit updates to connected clients
    const io = req.app.get('io');
    if (io) {
      devices.forEach(device => {
        io.to(`greenhouse-${device.greenhouseId}`).emit('deviceAdded', device);
      });
    }
    
    res.json({
      success: true,
      message: `Created ${devices.length} IoT devices`,
      data: devices,
      allDevices: await DeviceControl.find({ greenhouseId })
    });
    
  } catch (error) {
    console.error('Error setting up IoT devices:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to setup IoT devices',
      error: error.message
    });
  }
});

// POST /api/devices/setup-iot-devices-public - Public endpoint to setup IoT devices
router.post('/setup-iot-devices-public', async (req, res) => {
  try {
    const greenhouseId = req.body.greenhouseId || 'greenhouse-001';
    
    // Water pump
    let waterPump = await DeviceControl.findOne({ deviceId: 'WATER_PUMP_001' });
    if (!waterPump) {
      waterPump = new DeviceControl({
        deviceId: 'WATER_PUMP_001',
        deviceName: 'Water Pump',
        deviceType: 'WATER_PUMP',
        status: 'OFF',
        greenhouseId,
        location: 'Main Greenhouse',
        powerConsumption: 25,
        autoMode: true,
      });
      await waterPump.save();
    }
    
    // Water valve - NEW
    let waterValve = await DeviceControl.findOne({ deviceId: 'WATER_VALVE_001' });
    if (!waterValve) {
      waterValve = new DeviceControl({
        deviceId: 'WATER_VALVE_001',
        deviceName: 'Irrigation Valve',
        deviceType: 'WATER_VALVE',
        status: 'OFF',
        greenhouseId,
        location: 'Main Greenhouse',
        powerConsumption: 10,
        autoMode: true,
      });
      await waterValve.save();
    }
    
    // Window control
    let window = await DeviceControl.findOne({ deviceId: 'WINDOW_SERVO_001' });
    if (!window) {
      window = new DeviceControl({
        deviceId: 'WINDOW_SERVO_001',
        deviceName: 'Window Control',
        deviceType: 'WINDOW',
        status: 'CLOSED',
        greenhouseId,
        location: 'Main Greenhouse',
        powerConsumption: 5,
        autoMode: true,
      });
      await window.save();
    }
    
    // Fan - NEW
    let fan = await DeviceControl.findOne({ deviceId: 'FAN_001' });
    if (!fan) {
      fan = new DeviceControl({
        deviceId: 'FAN_001',
        deviceName: 'Ventilation Fan',
        deviceType: 'FAN',
        status: 'OFF',
        greenhouseId,
        location: 'Main Greenhouse',
        powerConsumption: 30,
        autoMode: true,
      });
      await fan.save();
    }
    
    // LED Grow Light - NEW
    let light = await DeviceControl.findOne({ deviceId: 'LED_LIGHT_001' });
    if (!light) {
      light = new DeviceControl({
        deviceId: 'LED_LIGHT_001',
        deviceName: 'LED Grow Light',
        deviceType: 'LED_LIGHT',
        status: 'OFF',
        greenhouseId,
        location: 'Main Greenhouse',
        powerConsumption: 15,
        autoMode: true,
        intensity: 100
      });
      await light.save();
    }
    
    // Send real-time update via Socket.IO
    const io = req.app.get('io');
    if (io) {
      io.to(`greenhouse-${greenhouseId}`).emit('devicesSetup', {
        message: 'IoT devices have been set up',
        count: 5,
        timestamp: new Date()
      });
    }
    
    res.json({
      success: true,
      message: 'IoT devices initialized successfully',
      devices: [waterPump, waterValve, window, fan, light]
    });
  } catch (error) {
    console.error('Error setting up IoT devices:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to setup IoT devices',
      error: error.message
    });
  }
});

// POST /api/devices/set-all-auto-mode - Set auto mode for all devices
router.post('/set-all-auto-mode', auth, async (req, res) => {
  try {
    const { autoMode } = req.body;
    
    if (autoMode === undefined) {
      return res.status(400).json({
        success: false,
        message: 'autoMode parameter is required'
      });
    }
    
    // Update all devices
    await DeviceControl.updateMany(
      {}, // Match all devices
      { $set: { autoMode: Boolean(autoMode) } }
    );
    
    const updatedDevices = await DeviceControl.find({});
    
    // Send real-time update via Socket.IO
    const io = req.app.get('io');
    if (io) {
      io.emit('autoModeUpdate', {
        autoMode: Boolean(autoMode),
        timestamp: new Date()
      });
      
      // Also emit individual device updates
      for (const device of updatedDevices) {
        io.to(`greenhouse-${device.greenhouseId}`).emit('deviceUpdate', {
          deviceId: device.deviceId,
          deviceType: device.deviceType,
          autoMode: Boolean(autoMode),
          lastUpdate: new Date()
        });
      }
    }
    
    // Create control log for this global change
    const controlLog = new DeviceControlLog({
      action: 'set_global_auto_mode',
      newStatus: autoMode ? 'ENABLED' : 'DISABLED',
      previousStatus: !autoMode ? 'ENABLED' : 'DISABLED',
      controlSource: 'manual',
      userId: req.user.id,
      username: req.user.username,
      timestamp: new Date(),
      greenhouseId: 'all'
    });
    await controlLog.save();
    
    res.json({
      success: true,
      message: `Auto mode ${autoMode ? 'enabled' : 'disabled'} for all devices`,
      count: updatedDevices.length
    });
  } catch (error) {
    console.error('Error setting global auto mode:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to set auto mode for all devices',
      error: error.message
    });
  }
});

module.exports = router;
