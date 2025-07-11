const express = require('express');
const router = express.Router();
const DeviceControl = require('../models/DeviceControl');

// POST /api/devices/setup-iot-devices-public - Create standard IoT devices (publicly accessible)
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
    
    // Water valve
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
    
    // Fan
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
    
    // LED Grow Light
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

module.exports = router;
