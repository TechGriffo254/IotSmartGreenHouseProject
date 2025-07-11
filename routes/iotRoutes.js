const express = require('express');
const router = express.Router();
const SensorData = require('../models/SensorData');
const DeviceControl = require('../models/DeviceControl');
const Alert = require('../models/Alert');

// GET /api/iot - Root endpoint for IoT API documentation and status
router.get('/', async (req, res) => {
  try {
    res.json({
      success: true,
      message: 'IoT API endpoints',
      endpoints: {
        dataUpload: 'POST /api/iot',
        deviceCommands: 'GET /api/iot/device-commands/:deviceId',
        commands: 'GET /api/iot/commands/:deviceId'
      },
      status: 'active'
    });
  } catch (error) {
    console.error('Error in IoT root endpoint:', error);
    res.status(500).json({
      success: false,
      message: 'Server error in IoT endpoint',
      error: error.message
    });
  }
});

// POST /api/iot - Main endpoint for ESP32 to send combined sensor data
router.post('/', async (req, res) => {
  try {
    const { 
      deviceId,
      greenhouseId = 'greenhouse-001',
      pincode,
      temperature,
      humidity,
      soilMoisture,
      lightIntensity,
      waterLevel,
      timestamp
    } = req.body;

    console.log('📡 ESP32 data received from device:', deviceId);
    console.log('📊 Raw sensor data:', { temperature, humidity, soilMoisture, lightIntensity, waterLevel });

    // Validate required fields
    if (!deviceId) {
      return res.status(400).json({
        success: false,
        message: 'deviceId is required'
      });
    }

    // Optional: Validate pincode for additional security
    if (pincode && pincode !== process.env.ESP32_PINCODE && pincode !== '123456') {
      console.log('⚠️ Invalid pincode from ESP32:', pincode);
      // Continue anyway for development, but log the issue
    }

    // Ensure IoT devices exist in database
    await ensureIoTDevicesExist(greenhouseId);

    // Store individual sensor readings
    const sensorPromises = [];
    const io = req.app.get('io');

    // Temperature & Humidity (DHT11)
    if (temperature !== undefined && humidity !== undefined && !isNaN(temperature) && !isNaN(humidity)) {
      const dhtData = new SensorData({
        greenhouseId,
        sensorType: 'DHT11',
        deviceId,
        location: 'Main Greenhouse',
        temperature: parseFloat(temperature),
        humidity: parseFloat(humidity),
        timestamp: new Date()
      });
      sensorPromises.push(dhtData.save());

      // Emit real-time update
      if (io) {
        io.to(`greenhouse-${greenhouseId}`).emit('sensorUpdate', {
          type: 'temperature',
          value: parseFloat(temperature),
          unit: '°C',
          timestamp: new Date()
        });
        io.to(`greenhouse-${greenhouseId}`).emit('sensorUpdate', {
          type: 'humidity',
          value: parseFloat(humidity),
          unit: '%',
          timestamp: new Date()
        });
      }
    }

    // Soil Moisture
    if (soilMoisture !== undefined && !isNaN(soilMoisture)) {
      const moistureData = new SensorData({
        greenhouseId,
        sensorType: 'SOIL_MOISTURE',
        deviceId,
        location: 'Main Greenhouse',
        soilMoisture: parseInt(soilMoisture),
        rawValue: parseInt(soilMoisture),
        timestamp: new Date()
      });
      sensorPromises.push(moistureData.save());

      // Emit real-time update
      if (io) {
        io.to(`greenhouse-${greenhouseId}`).emit('sensorUpdate', {
          type: 'soilMoisture',
          value: parseInt(soilMoisture),
          unit: 'raw',
          timestamp: new Date()
        });
      }
    }

    // Light Level (LDR)
    if (lightIntensity !== undefined && !isNaN(lightIntensity)) {
      const lightData = new SensorData({
        greenhouseId,
        sensorType: 'LDR',
        deviceId,
        location: 'Main Greenhouse',
        lightIntensity: parseInt(lightIntensity),
        rawValue: parseInt(lightIntensity),
        timestamp: new Date()
      });
      sensorPromises.push(lightData.save());

      // Emit real-time update
      if (io) {
        io.to(`greenhouse-${greenhouseId}`).emit('sensorUpdate', {
          type: 'lightLevel',
          value: parseInt(lightIntensity),
          unit: 'lux',
          timestamp: new Date()
        });
      }
    }

    // Water Level (Ultrasonic)
    if (waterLevel !== undefined && !isNaN(waterLevel) && waterLevel > 0) {
      const waterData = new SensorData({
        greenhouseId,
        sensorType: 'ULTRASONIC',
        deviceId,
        location: 'Water Tank',
        customValue: parseInt(waterLevel),
        rawValue: parseInt(waterLevel),
        timestamp: new Date()
      });
      sensorPromises.push(waterData.save());

      // Emit real-time update
      if (io) {
        io.to(`greenhouse-${greenhouseId}`).emit('sensorUpdate', {
          type: 'waterLevel',
          value: parseInt(waterLevel),
          unit: 'cm',
          timestamp: new Date()
        });
      }
    }

    // Save all sensor data
    await Promise.all(sensorPromises);

    // Check for threshold violations and create alerts
    const latestSensorData = {
      temperature: parseFloat(temperature) || 0,
      humidity: parseFloat(humidity) || 0,
      soilMoisture: parseInt(soilMoisture) || 0,
      lightIntensity: parseInt(lightIntensity) || 0,
      waterLevel: parseInt(waterLevel) || 0,
      greenhouseId
    };

    await checkThresholds(latestSensorData, io);

    // Send comprehensive sensor update to frontend
    if (io) {
      io.to(`greenhouse-${greenhouseId}`).emit('allSensorsUpdate', {
        deviceId,
        temperature: parseFloat(temperature) || 0,
        humidity: parseFloat(humidity) || 0,
        soilMoisture: parseInt(soilMoisture) || 0,
        lightIntensity: parseInt(lightIntensity) || 0,
        waterLevel: parseInt(waterLevel) || 0,
        timestamp: new Date()
      });
    }

    console.log('✅ ESP32 sensor data processed successfully');

    res.status(201).json({
      success: true,
      message: 'Sensor data received and processed successfully',
      data: {
        deviceId,
        sensorsProcessed: sensorPromises.length,
        timestamp: new Date()
      }
    });

  } catch (error) {
    console.error('❌ ESP32 data processing error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process sensor data',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// GET /api/iot/device-commands/:deviceId - Get commands for a specific IoT device
router.get('/device-commands/:deviceId', async (req, res) => {
  try {
    const { deviceId } = req.params;
    
    const device = await DeviceControl.findOne({ deviceId });
    if (!device) {
      return res.status(404).json({
        success: false,
        message: 'Device not found'
      });
    }

    // Return current device state and any pending commands
    res.json({
      success: true,
      data: {
        status: device.status,
        intensity: device.intensity,
        autoMode: device.autoMode,
        automationRules: device.automationRules,
        lastUpdate: device.updatedAt
      }
    });

  } catch (error) {
    console.error('Device commands error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get device commands',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// POST /api/iot/device-status - ESP32 reports device status changes
router.post('/device-status', async (req, res) => {
  try {
    const { 
      deviceId, 
      status, 
      autoMode, 
      greenhouseId = 'greenhouse-001',
      intensity 
    } = req.body;

    console.log(`📤 Device status update from ESP32:`, { deviceId, status, autoMode });

    // Validate required fields
    if (!deviceId || !status) {
      return res.status(400).json({
        success: false,
        message: 'deviceId and status are required'
      });
    }

    // Update device in database
    const device = await DeviceControl.findOneAndUpdate(
      { deviceId },
      { 
        status,
        autoMode: autoMode !== undefined ? autoMode : true,
        intensity: intensity !== undefined ? intensity : 100,
        lastActivated: new Date(),
        updatedAt: new Date()
      },
      { new: true, upsert: false }
    );

    if (!device) {
      return res.status(404).json({
        success: false,
        message: 'Device not found'
      });
    }

    console.log(`✅ Device ${deviceId} status updated: ${status}`);

    // Emit real-time update via Socket.IO
    const io = req.app.get('io');
    if (io) {
      io.to(`greenhouse-${device.greenhouseId}`).emit('deviceUpdate', {
        deviceId: device.deviceId,
        status: device.status,
        autoMode: device.autoMode,
        intensity: device.intensity,
        lastActivated: device.lastActivated
      });
    }

    res.json({
      success: true,
      message: 'Device status updated successfully',
      data: {
        deviceId: device.deviceId,
        status: device.status,
        autoMode: device.autoMode,
        timestamp: new Date()
      }
    });

  } catch (error) {
    console.error('Device status update error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update device status',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// POST /api/iot/bulk-data - Accept multiple sensor readings at once
router.post('/bulk-data', async (req, res) => {
  try {
    const { readings } = req.body;

    if (!Array.isArray(readings) || readings.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'readings array is required'
      });
    }

    const savedReadings = [];
    const io = req.app.get('io');

    for (const reading of readings) {
      try {
        const sensorData = new SensorData({
          ...reading,
          timestamp: reading.timestamp ? new Date(reading.timestamp) : new Date()
        });

        await sensorData.save();
        savedReadings.push(sensorData);

        // Emit real-time data
        if (io) {
          io.to(`greenhouse-${sensorData.greenhouseId}`).emit('sensorUpdate', sensorData);
        }

        // Check thresholds
        await checkThresholds(sensorData, io);

      } catch (error) {
        console.error('Error processing reading:', error);
      }
    }

    res.status(201).json({
      success: true,
      message: `Processed ${savedReadings.length} sensor readings`,
      processed: savedReadings.length,
      total: readings.length
    });

  } catch (error) {
    console.error('Bulk data error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process bulk sensor data'
    });
  }
});

// POST /api/iot - Main endpoint for ESP32 to send combined sensor data
// POST /api/iot/old-format - Keep the old endpoint for backward compatibility
router.post('/old-format', async (req, res) => {
  try {
    const { 
      deviceId,
      greenhouseId = 'greenhouse-001',
      pincode,
      temperature,
      humidity,
      soilMoisture,
      lightIntensity,
      waterLevel,
      timestamp
    } = req.body;

    console.log('📡 ESP32 data received from device:', deviceId);
    console.log('📊 Raw sensor data:', { temperature, humidity, soilMoisture, lightIntensity, waterLevel });

    // Validate required fields
    if (!deviceId) {
      return res.status(400).json({
        success: false,
        message: 'deviceId is required'
      });
    }

    // Optional: Validate pincode for additional security
    if (pincode && pincode !== process.env.ESP32_PINCODE && pincode !== '123456') {
      console.log('⚠️ Invalid pincode from ESP32:', pincode);
      // Continue anyway for development, but log the issue
    }

    // Ensure IoT devices exist in database
    await ensureIoTDevicesExist(greenhouseId);

    // Store individual sensor readings
    const sensorPromises = [];
    const io = req.app.get('io');

    // Temperature & Humidity (DHT11)
    if (temperature !== undefined && humidity !== undefined && !isNaN(temperature) && !isNaN(humidity)) {
      const dhtData = new SensorData({
        greenhouseId,
        sensorType: 'DHT11',
        deviceId,
        location: 'Main Greenhouse',
        temperature: parseFloat(temperature),
        humidity: parseFloat(humidity),
        timestamp: new Date()
      });
      sensorPromises.push(dhtData.save());

      // Emit real-time update
      if (io) {
        io.to(`greenhouse-${greenhouseId}`).emit('sensorUpdate', {
          type: 'temperature',
          value: parseFloat(temperature),
          unit: '°C',
          timestamp: new Date()
        });
        io.to(`greenhouse-${greenhouseId}`).emit('sensorUpdate', {
          type: 'humidity',
          value: parseFloat(humidity),
          unit: '%',
          timestamp: new Date()
        });
      }
    }

    // Soil Moisture
    if (soilMoisture !== undefined && !isNaN(soilMoisture)) {
      const moistureData = new SensorData({
        greenhouseId,
        sensorType: 'SOIL_MOISTURE',
        deviceId,
        location: 'Main Greenhouse',
        soilMoisture: parseInt(soilMoisture),
        rawValue: parseInt(soilMoisture),
        timestamp: new Date()
      });
      sensorPromises.push(moistureData.save());

      // Emit real-time update
      if (io) {
        io.to(`greenhouse-${greenhouseId}`).emit('sensorUpdate', {
          type: 'soilMoisture',
          value: parseInt(soilMoisture),
          unit: 'raw',
          timestamp: new Date()
        });
      }
    }

    // Light Level (LDR)
    if (lightIntensity !== undefined && !isNaN(lightIntensity)) {
      const lightData = new SensorData({
        greenhouseId,
        sensorType: 'LDR',
        deviceId,
        location: 'Main Greenhouse',
        lightIntensity: parseInt(lightIntensity),
        rawValue: parseInt(lightIntensity),
        timestamp: new Date()
      });
      sensorPromises.push(lightData.save());

      // Emit real-time update
      if (io) {
        io.to(`greenhouse-${greenhouseId}`).emit('sensorUpdate', {
          type: 'lightLevel',
          value: parseInt(lightIntensity),
          unit: 'lux',
          timestamp: new Date()
        });
      }
    }

    // Water Level (Ultrasonic)
    if (waterLevel !== undefined && !isNaN(waterLevel) && waterLevel > 0) {
      const waterData = new SensorData({
        greenhouseId,
        sensorType: 'ULTRASONIC',
        deviceId,
        location: 'Water Tank',
        customValue: parseInt(waterLevel),
        rawValue: parseInt(waterLevel),
        timestamp: new Date()
      });
      sensorPromises.push(waterData.save());

      // Emit real-time update
      if (io) {
        io.to(`greenhouse-${greenhouseId}`).emit('sensorUpdate', {
          type: 'waterLevel',
          value: parseInt(waterLevel),
          unit: 'cm',
          timestamp: new Date()
        });
      }
    }

    // Save all sensor data
    await Promise.all(sensorPromises);

    // Check for threshold violations and create alerts
    const latestSensorData = {
      temperature: parseFloat(temperature) || 0,
      humidity: parseFloat(humidity) || 0,
      soilMoisture: parseInt(soilMoisture) || 0,
      lightIntensity: parseInt(lightIntensity) || 0,
      waterLevel: parseInt(waterLevel) || 0,
      greenhouseId
    };

    await checkThresholds(latestSensorData, io);

    // Send comprehensive sensor update to frontend
    if (io) {
      io.to(`greenhouse-${greenhouseId}`).emit('allSensorsUpdate', {
        deviceId,
        temperature: parseFloat(temperature) || 0,
        humidity: parseFloat(humidity) || 0,
        soilMoisture: parseInt(soilMoisture) || 0,
        lightIntensity: parseInt(lightIntensity) || 0,
        waterLevel: parseInt(waterLevel) || 0,
        timestamp: new Date()
      });
    }

    console.log('✅ ESP32 sensor data processed successfully');

    res.status(201).json({
      success: true,
      message: 'Sensor data received and processed successfully',
      data: {
        deviceId,
        sensorsProcessed: sensorPromises.length,
        timestamp: new Date()
      }
    });

  } catch (error) {
    console.error('❌ ESP32 data processing error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process sensor data',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// GET /api/iot/commands/:deviceId - Get commands for ESP32
router.get('/commands/:deviceId', async (req, res) => {
  try {
    const { deviceId } = req.params;
    
    // Get current device control status from database
    const devices = await DeviceControl.find({ greenhouseId: 'greenhouse-001' });
    
    if (!devices || devices.length === 0) {
      return res.json({
        success: true,
        message: 'No commands available',
        commands: []
      });
    }
    
    // Prepare commands based on device statuses
    const commands = [];
    
    // Check for water pump command
    const pumpDevice = devices.find(d => d.deviceType === 'WATER_PUMP');
    if (pumpDevice) {
      commands.push({
        device: 'pump',
        action: 'control',
        state: pumpDevice.status === 'ON',
        timestamp: new Date()
      });
    }
    
    // Check for water valve command
    const valveDevice = devices.find(d => d.deviceType === 'WATER_VALVE');
    if (valveDevice) {
      commands.push({
        device: 'valve',
        action: 'control',
        state: valveDevice.status === 'ON',
        timestamp: new Date()
      });
    }
    
    // Check for fan command
    const fanDevice = devices.find(d => d.deviceType === 'FAN');
    if (fanDevice) {
      commands.push({
        device: 'fan',
        action: 'control',
        state: fanDevice.status === 'ON',
        timestamp: new Date()
      });
    }
    
    // Check for light command
    const lightDevice = devices.find(d => d.deviceType === 'LED_LIGHT');
    if (lightDevice) {
      commands.push({
        device: 'light',
        action: 'control',
        state: lightDevice.status === 'ON',
        timestamp: new Date()
      });
    }
    
    // Check for window command
    const windowDevice = devices.find(d => d.deviceType === 'WINDOW');
    if (windowDevice) {
      commands.push({
        device: 'window',
        action: 'control',
        state: windowDevice.status === 'OPEN',
        timestamp: new Date()
      });
    }
    
    // Check for auto mode settings
    const anyDevice = devices[0];
    if (anyDevice) {
      commands.push({
        action: 'autoMode',
        state: anyDevice.autoMode,
        timestamp: new Date()
      });
    }

    res.json({
      success: true,
      message: `${commands.length} commands available`,
      commands: commands
    });

  } catch (error) {
    console.error('Error retrieving commands:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve commands',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// POST /api/iot/old-format - Keep the old endpoint for backward compatibility
router.post('/old-format', async (req, res) => {
  try {
    const { 
      deviceId, 
      status, 
      autoMode, 
      greenhouseId = 'greenhouse-001',
      intensity 
    } = req.body;

    console.log(`📤 Device status update from old format:`, { deviceId, status, autoMode });

    // Validate required fields
    if (!deviceId || !status) {
      return res.status(400).json({
        success: false,
        message: 'deviceId and status are required'
      });
    }

    // Update device in database
    const device = await DeviceControl.findOneAndUpdate(
      { deviceId },
      { 
        status,
        autoMode: autoMode !== undefined ? autoMode : true,
        intensity: intensity !== undefined ? intensity : 100,
        lastActivated: new Date(),
        updatedAt: new Date()
      },
      { new: true, upsert: false }
    );

    if (!device) {
      return res.status(404).json({
        success: false,
        message: 'Device not found'
      });
    }

    console.log(`✅ Device ${deviceId} status updated (old format): ${status}`);

    // Emit real-time update via Socket.IO
    const io = req.app.get('io');
    if (io) {
      io.to(`greenhouse-${device.greenhouseId}`).emit('deviceUpdate', {
        deviceId: device.deviceId,
        status: device.status,
        autoMode: device.autoMode,
        intensity: device.intensity,
        lastActivated: device.lastActivated
      });
    }

    res.json({
      success: true,
      message: 'Device status updated successfully (old format)',
      data: {
        deviceId: device.deviceId,
        status: device.status,
        autoMode: device.autoMode,
        timestamp: new Date()
      }
    });

  } catch (error) {
    console.error('Device status update error (old format):', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update device status (old format)',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// POST /api/iot/legacy - Legacy endpoint for older devices
router.post('/legacy', async (req, res) => {
  try {
    const { 
      deviceId, 
      temperature, 
      humidity, 
      soilMoisture, 
      lightIntensity, 
      waterLevel, 
      status, 
      autoMode, 
      greenhouseId = 'greenhouse-001' 
    } = req.body;

    console.log('📡 Legacy data received from device:', deviceId);
    console.log('📊 Legacy sensor data:', { temperature, humidity, soilMoisture, lightIntensity, waterLevel });

    // Validate required fields
    if (!deviceId) {
      return res.status(400).json({
        success: false,
        message: 'deviceId is required'
      });
    }

    // Ensure IoT devices exist in database
    await ensureIoTDevicesExist(greenhouseId);

    // Store individual sensor readings
    const sensorPromises = [];
    const io = req.app.get('io');

    // Temperature & Humidity (DHT11)
    if (temperature !== undefined && humidity !== undefined && !isNaN(temperature) && !isNaN(humidity)) {
      const dhtData = new SensorData({
        greenhouseId,
        sensorType: 'DHT11',
        deviceId,
        location: 'Main Greenhouse',
        temperature: parseFloat(temperature),
        humidity: parseFloat(humidity),
        timestamp: new Date()
      });
      sensorPromises.push(dhtData.save());

      // Emit real-time update
      if (io) {
        io.to(`greenhouse-${greenhouseId}`).emit('sensorUpdate', {
          type: 'temperature',
          value: parseFloat(temperature),
          unit: '°C',
          timestamp: new Date()
        });
        io.to(`greenhouse-${greenhouseId}`).emit('sensorUpdate', {
          type: 'humidity',
          value: parseFloat(humidity),
          unit: '%',
          timestamp: new Date()
        });
      }
    }

    // Soil Moisture
    if (soilMoisture !== undefined && !isNaN(soilMoisture)) {
      const moistureData = new SensorData({
        greenhouseId,
        sensorType: 'SOIL_MOISTURE',
        deviceId,
        location: 'Main Greenhouse',
        soilMoisture: parseInt(soilMoisture),
        rawValue: parseInt(soilMoisture),
        timestamp: new Date()
      });
      sensorPromises.push(moistureData.save());

      // Emit real-time update
      if (io) {
        io.to(`greenhouse-${greenhouseId}`).emit('sensorUpdate', {
          type: 'soilMoisture',
          value: parseInt(soilMoisture),
          unit: 'raw',
          timestamp: new Date()
        });
      }
    }

    // Light Level (LDR)
    if (lightIntensity !== undefined && !isNaN(lightIntensity)) {
      const lightData = new SensorData({
        greenhouseId,
        sensorType: 'LDR',
        deviceId,
        location: 'Main Greenhouse',
        lightIntensity: parseInt(lightIntensity),
        rawValue: parseInt(lightIntensity),
        timestamp: new Date()
      });
      sensorPromises.push(lightData.save());

      // Emit real-time update
      if (io) {
        io.to(`greenhouse-${greenhouseId}`).emit('sensorUpdate', {
          type: 'lightLevel',
          value: parseInt(lightIntensity),
          unit: 'lux',
          timestamp: new Date()
        });
      }
    }

    // Water Level (Ultrasonic)
    if (waterLevel !== undefined && !isNaN(waterLevel) && waterLevel > 0) {
      const waterData = new SensorData({
        greenhouseId,
        sensorType: 'ULTRASONIC',
        deviceId,
        location: 'Water Tank',
        customValue: parseInt(waterLevel),
        rawValue: parseInt(waterLevel),
        timestamp: new Date()
      });
      sensorPromises.push(waterData.save());

      // Emit real-time update
      if (io) {
        io.to(`greenhouse-${greenhouseId}`).emit('sensorUpdate', {
          type: 'waterLevel',
          value: parseInt(waterLevel),
          unit: 'cm',
          timestamp: new Date()
        });
      }
    }

    // Save all sensor data
    await Promise.all(sensorPromises);

    // Update or create device control states for actuators
    if (actuators) {
      // Water Pump
      if (actuators.waterPump !== undefined) {
        await updateDeviceControl(
          'WATER_PUMP_001',
          greenhouseId,
          actuators.waterPump ? 'ON' : 'OFF',
          io
        );
      }

      // Window Servo
      if (actuators.window !== undefined) {
        await updateDeviceControl(
          'WINDOW_SERVO_001',
          greenhouseId,
          actuators.window ? 'OPEN' : 'CLOSED',
          io
        );
      }
    }

    // Check thresholds and create alerts if necessary
    if (sensors.temperature || sensors.humidity || sensors.soilMoisture || sensors.lightLevel) {
      await checkComprehensiveThresholds(sensors, greenhouseId, deviceId, io);
    }

    // Prepare response with any commands for the device
    const responseData = {
      success: true,
      message: 'Data received and processed',
      timestamp: new Date(),
      commands: await getDeviceCommands(deviceId, greenhouseId)
    };

    res.status(200).json(responseData);

  } catch (error) {
    console.error('❌ IoT endpoint error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process IoT data',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// POST /api/iot/status - ESP32 reports current device status
router.post('/status', async (req, res) => {
  try {
    const { 
      deviceId,
      greenhouseId = 'greenhouse-001',
      pumpState, 
      valveState,
      fanState,
      windowState,
      lightState,
      autoMode, 
      wifiConnected 
    } = req.body;

    console.log('📡 ESP32 device status update received:', req.body);

    if (!deviceId) {
      return res.status(400).json({
        success: false,
        message: 'deviceId is required'
      });
    }

    // Ensure devices exist in database
    await ensureIoTDevicesExist(greenhouseId);

    // Get the Socket.IO instance
    const io = req.app.get('io');

    // Update pump status if provided
    if (pumpState !== undefined) {
      const pump = await DeviceControl.findOne({ 
        deviceType: 'WATER_PUMP', 
        greenhouseId 
      });
      
      if (pump) {
        pump.status = pumpState ? 'ON' : 'OFF';
        await pump.save();
        
        if (io) {
          io.to(`greenhouse-${greenhouseId}`).emit('deviceUpdate', {
            deviceId: pump.deviceId,
            deviceType: 'WATER_PUMP',
            status: pump.status,
            lastUpdate: new Date()
          });
        }
      }
    }

    // Update valve status if provided - NEW
    if (valveState !== undefined) {
      const valve = await DeviceControl.findOne({ 
        deviceType: 'WATER_VALVE', 
        greenhouseId 
      });
      
      if (valve) {
        valve.status = valveState ? 'ON' : 'OFF';
        await valve.save();
        
        if (io) {
          io.to(`greenhouse-${greenhouseId}`).emit('deviceUpdate', {
            deviceId: valve.deviceId,
            deviceType: 'WATER_VALVE',
            status: valve.status,
            lastUpdate: new Date()
          });
        }
      }
    }

    // Update fan status if provided - NEW
    if (fanState !== undefined) {
      const fan = await DeviceControl.findOne({ 
        deviceType: 'FAN', 
        greenhouseId 
      });
      
      if (fan) {
        fan.status = fanState ? 'ON' : 'OFF';
        await fan.save();
        
        if (io) {
          io.to(`greenhouse-${greenhouseId}`).emit('deviceUpdate', {
            deviceId: fan.deviceId,
            deviceType: 'FAN',
            status: fan.status,
            lastUpdate: new Date()
          });
        }
      }
    }

    // Update window status if provided
    if (windowState !== undefined) {
      const window = await DeviceControl.findOne({ 
        deviceType: 'WINDOW', 
        greenhouseId 
      });
      
      if (window) {
        window.status = windowState ? 'OPEN' : 'CLOSED';
        await window.save();
        
        if (io) {
          io.to(`greenhouse-${greenhouseId}`).emit('deviceUpdate', {
            deviceId: window.deviceId,
            deviceType: 'WINDOW',
            status: window.status,
            lastUpdate: new Date()
          });
        }
      }
    }

    // Update LED light status if provided - NEW
    if (lightState !== undefined) {
      const light = await DeviceControl.findOne({ 
        deviceType: 'LED_LIGHT', 
        greenhouseId 
      });
      
      if (light) {
        light.status = lightState ? 'ON' : 'OFF';
        await light.save();
        
        if (io) {
          io.to(`greenhouse-${greenhouseId}`).emit('deviceUpdate', {
            deviceId: light.deviceId,
            deviceType: 'LED_LIGHT',
            status: light.status,
            lastUpdate: new Date()
          });
        }
      }
    }

    // Update auto mode for all devices if provided
    if (autoMode !== undefined) {
      await DeviceControl.updateMany(
        { greenhouseId },
        { $set: { autoMode } }
      );
      
      if (io) {
        io.to(`greenhouse-${greenhouseId}`).emit('autoModeUpdate', {
          greenhouseId,
          autoMode,
          timestamp: new Date()
        });
      }
    }

    res.json({
      success: true,
      message: 'Status updated successfully'
    });
  } catch (error) {
    console.error('Status update error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update status',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Helper function to update device control states
async function updateDeviceControl(deviceId, greenhouseId, status, io) {
  try {
    let device = await DeviceControl.findOne({ deviceId });
    
    if (!device) {
      // Create new device if it doesn't exist
      device = new DeviceControl({
        deviceId,
        deviceName: deviceId.replace('_', ' '),
        deviceType: deviceId.includes('PUMP') ? 'irrigation' : 'ventilation',
        greenhouseId,
        status,
        autoMode: true,
        lastActivated: status === 'ON' || status === 'OPEN' ? new Date() : device?.lastActivated
      });
    } else {
      device.status = status;
      if (status === 'ON' || status === 'OPEN') {
        device.lastActivated = new Date();
      }
    }

    await device.save();

    // Emit device update
    if (io) {
      io.to(`greenhouse-${greenhouseId}`).emit('deviceUpdate', device);
    }

    return device;
  } catch (error) {
    console.error('Error updating device control:', error);
  }
}

// Helper function to check comprehensive thresholds
async function checkComprehensiveThresholds(sensors, greenhouseId, deviceId, io) {
  const alerts = [];

  // Temperature thresholds
  if (sensors.temperature !== undefined) {
    const tempHigh = process.env.ALERT_THRESHOLD_TEMP_HIGH || 35;
    const tempLow = process.env.ALERT_THRESHOLD_TEMP_LOW || 15;
    
    if (sensors.temperature > tempHigh) {
      alerts.push({
        alertType: 'TEMPERATURE_HIGH',
        severity: sensors.temperature > 40 ? 'CRITICAL' : 'HIGH',
        message: `Temperature too high: ${sensors.temperature}°C`,
        currentValue: sensors.temperature,
        thresholdValue: tempHigh,
        sensorType: 'DHT11'
      });
    } else if (sensors.temperature < tempLow) {
      alerts.push({
        alertType: 'TEMPERATURE_LOW',
        severity: 'MEDIUM',
        message: `Temperature too low: ${sensors.temperature}°C`,
        currentValue: sensors.temperature,
        thresholdValue: tempLow,
        sensorType: 'DHT11'
      });
    }
  }

  // Humidity thresholds
  if (sensors.humidity !== undefined) {
    const humidityHigh = process.env.ALERT_THRESHOLD_HUMIDITY_HIGH || 80;
    const humidityLow = process.env.ALERT_THRESHOLD_HUMIDITY_LOW || 40;
    
    if (sensors.humidity > humidityHigh) {
      alerts.push({
        alertType: 'HUMIDITY_HIGH',
        severity: 'MEDIUM',
        message: `Humidity too high: ${sensors.humidity}%`,
        currentValue: sensors.humidity,
        thresholdValue: humidityHigh,
        sensorType: 'DHT11'
      });
    } else if (sensors.humidity < humidityLow) {
      alerts.push({
        alertType: 'HUMIDITY_LOW',
        severity: 'MEDIUM',
        message: `Humidity too low: ${sensors.humidity}%`,
        currentValue: sensors.humidity,
        thresholdValue: humidityLow,
        sensorType: 'DHT11'
      });
    }
  }

  // Soil moisture thresholds
  if (sensors.soilMoisture !== undefined) {
    const moistureLow = process.env.ALERT_THRESHOLD_SOIL_MOISTURE_LOW || 500;
    
    if (sensors.soilMoisture < moistureLow) {
      alerts.push({
        alertType: 'SOIL_MOISTURE_LOW',
        severity: 'HIGH',
        message: `Soil moisture low: ${sensors.soilMoisture}`,
        currentValue: sensors.soilMoisture,
        thresholdValue: moistureLow,
        sensorType: 'SOIL_MOISTURE'
      });
    }
  }

  // Light level thresholds
  if (sensors.lightLevel !== undefined) {
    const lightLow = process.env.ALERT_THRESHOLD_LIGHT_LOW || 200;
    
    if (sensors.lightLevel < lightLow) {
      alerts.push({
        alertType: 'LIGHT_LEVEL_LOW',
        severity: 'LOW',
        message: `Light level low: ${sensors.lightLevel}`,
        currentValue: sensors.lightLevel,
        thresholdValue: lightLow,
        sensorType: 'LDR'
      });
    }
  }

  // Water level thresholds
  if (sensors.waterLevel !== undefined && sensors.waterLevel < 10) {
    alerts.push({
      alertType: 'WATER_LEVEL_LOW',
      severity: 'CRITICAL',
      message: `Water level critical: ${sensors.waterLevel}cm`,
      currentValue: sensors.waterLevel,
      thresholdValue: 10,
      sensorType: 'ULTRASONIC'
    });
  }

  // Create and save alerts
  for (const alertData of alerts) {
    const alert = new Alert({
      greenhouseId,
      deviceId,
      ...alertData,
      timestamp: new Date(),
      status: 'ACTIVE'
    });

    await alert.save();

    // Emit alert via Socket.IO
    if (io) {
      io.to(`greenhouse-${greenhouseId}`).emit('newAlert', alert);
    }

    console.log(`🚨 Alert created: ${alertData.alertType} - ${alertData.message}`);
  }
}

// Helper function to get device commands
async function getDeviceCommands(deviceId, greenhouseId) {
  try {
    // Get any manual overrides or automation commands
    const devices = await DeviceControl.find({ 
      greenhouseId,
      $or: [
        { deviceId: 'WATER_PUMP_001' },
        { deviceId: 'WINDOW_SERVO_001' }
      ]
    });

    const commands = {};

    for (const device of devices) {
      if (device.deviceId === 'WATER_PUMP_001') {
        commands.waterPump = device.status === 'ON';
      } else if (device.deviceId === 'WINDOW_SERVO_001') {
        commands.window = device.status === 'OPEN';
      }
    }

    return commands;
  } catch (error) {
    console.error('Error getting device commands:', error);
    return {};
  }
}

// Function to check thresholds and create alerts
async function checkThresholds(sensorData, io) {
  try {
    const {
      temperature,
      humidity,
      soilMoisture,
      lightIntensity,
      waterLevel,
      greenhouseId
    } = sensorData;

    // Skip if we don't have valid sensor data
    if (temperature === undefined && humidity === undefined && soilMoisture === undefined && lightIntensity === undefined) {
      console.log('⚠️ No valid sensor data for threshold checking');
      return;
    }

    const alerts = [];

    // Temperature alerts
    if (temperature !== undefined && !isNaN(temperature)) {
      if (temperature > (process.env.ALERT_THRESHOLD_TEMP_HIGH || 35)) {
        alerts.push({
          alertType: 'TEMPERATURE_HIGH',
          message: `Temperature is too high: ${temperature}°C`,
          severity: 'HIGH',
          greenhouseId,
          sensorType: 'DHT11',
          currentValue: temperature,
          thresholdValue: process.env.ALERT_THRESHOLD_TEMP_HIGH || 35
        });
      } else if (temperature < (process.env.ALERT_THRESHOLD_TEMP_LOW || 15)) {
        alerts.push({
          alertType: 'TEMPERATURE_LOW',
          message: `Temperature is too low: ${temperature}°C`,
          severity: 'MEDIUM',
          greenhouseId,
          sensorType: 'DHT11',
          currentValue: temperature,
          thresholdValue: process.env.ALERT_THRESHOLD_TEMP_LOW || 15
        });
      }
    }

    // Humidity alerts
    if (humidity !== undefined && !isNaN(humidity)) {
      if (humidity > (process.env.ALERT_THRESHOLD_HUMIDITY_HIGH || 80)) {
        alerts.push({
          alertType: 'HUMIDITY_HIGH',
          message: `Humidity is too high: ${humidity}%`,
          severity: 'MEDIUM',
          greenhouseId,
          sensorType: 'DHT11',
          currentValue: humidity,
          thresholdValue: process.env.ALERT_THRESHOLD_HUMIDITY_HIGH || 80
        });
      } else if (humidity < (process.env.ALERT_THRESHOLD_HUMIDITY_LOW || 40)) {
        alerts.push({
          alertType: 'HUMIDITY_LOW',
          message: `Humidity is too low: ${humidity}%`,
          severity: 'MEDIUM',
          greenhouseId,
          sensorType: 'DHT11',
          currentValue: humidity,
          thresholdValue: process.env.ALERT_THRESHOLD_HUMIDITY_LOW || 40
        });
      }
    }

    // Soil moisture alerts
    if (soilMoisture !== undefined && !isNaN(soilMoisture)) {
      if (soilMoisture < (process.env.ALERT_THRESHOLD_SOIL_MOISTURE_LOW || 300)) {
        alerts.push({
          alertType: 'SOIL_MOISTURE_LOW',
          message: `Soil moisture is low: ${soilMoisture}`,
          severity: 'HIGH',
          greenhouseId,
          sensorType: 'SOIL_MOISTURE',
          currentValue: soilMoisture,
          thresholdValue: process.env.ALERT_THRESHOLD_SOIL_MOISTURE_LOW || 300
        });
      }
    }

    // Light level alerts
    if (lightIntensity !== undefined && !isNaN(lightIntensity)) {
      if (lightIntensity < (process.env.ALERT_THRESHOLD_LIGHT_LOW || 200)) {
        alerts.push({
          alertType: 'LIGHT_LEVEL_LOW',
          message: `Light level is low: ${lightIntensity} lux`,
          severity: 'LOW',
          greenhouseId,
          sensorType: 'LDR',
          currentValue: lightIntensity,
          thresholdValue: process.env.ALERT_THRESHOLD_LIGHT_LOW || 200
        });
      }
    }

    // Save alerts and emit them
    for (const alertData of alerts) {
      try {
        const alert = new Alert(alertData);
        await alert.save();
        
        if (io) {
          io.to(`greenhouse-${greenhouseId}`).emit('newAlert', alert);
        }
        
        console.log(`🚨 Alert created: ${alertData.alertType} - ${alertData.message}`);
      } catch (alertError) {
        console.error('Error creating individual alert:', alertError.message);
      }
    }

  } catch (error) {
    console.error('Error in checkThresholds:', error.message);
  }
}

// Helper function to ensure IoT devices exist in the database
async function ensureIoTDevicesExist(greenhouseId) {
  try {
    // Check if water pump device exists
    let waterPumpDevice = await DeviceControl.findOne({ deviceId: 'WATER_PUMP_001' });
    if (!waterPumpDevice) {
      waterPumpDevice = new DeviceControl({
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
      await waterPumpDevice.save();
      console.log('🔧 Created water pump device entry');
    }
    
    // Check if water valve device exists - NEW
    let waterValveDevice = await DeviceControl.findOne({ deviceId: 'WATER_VALVE_001' });
    if (!waterValveDevice) {
      waterValveDevice = new DeviceControl({
        deviceId: 'WATER_VALVE_001',
        deviceName: 'Water Valve',
        deviceType: 'WATER_VALVE',
        greenhouseId: greenhouseId,
        status: 'OFF',
        autoMode: true,
        location: 'Main Greenhouse',
        intensity: 100,
        powerConsumption: 10
      });
      await waterValveDevice.save();
      console.log('🔧 Created water valve device entry');
    }
    
    // Check if fan device exists - NEW
    let fanDevice = await DeviceControl.findOne({ deviceId: 'FAN_001' });
    if (!fanDevice) {
      fanDevice = new DeviceControl({
        deviceId: 'FAN_001',
        deviceName: 'Ventilation Fan',
        deviceType: 'FAN',
        greenhouseId: greenhouseId,
        status: 'OFF',
        autoMode: true,
        location: 'Main Greenhouse',
        intensity: 100,
        powerConsumption: 30
      });
      await fanDevice.save();
      console.log('🔧 Created fan device entry');
    }
    
    // Check if LED light device exists - NEW
    let lightDevice = await DeviceControl.findOne({ deviceId: 'LED_LIGHT_001' });
    if (!lightDevice) {
      lightDevice = new DeviceControl({
        deviceId: 'LED_LIGHT_001',
        deviceName: 'Grow Light',
        deviceType: 'LED_LIGHT',
        greenhouseId: greenhouseId,
        status: 'OFF',
        autoMode: true,
        location: 'Main Greenhouse',
        intensity: 100,
        powerConsumption: 15
      });
      await lightDevice.save();
      console.log('🔧 Created LED light device entry');
    }

    // Check if window servo device exists
    let windowDevice = await DeviceControl.findOne({ deviceId: 'WINDOW_SERVO_001' });
    if (!windowDevice) {
      windowDevice = new DeviceControl({
        deviceId: 'WINDOW_SERVO_001',
        deviceName: 'Automated Window',
        deviceType: 'WINDOW',
        greenhouseId: greenhouseId,
        status: 'CLOSED',
        autoMode: true,
        location: 'Main Greenhouse',
        intensity: 90,
        powerConsumption: 5
      });
      await windowDevice.save();
      console.log('🔧 Created window servo device entry');
    }

    return { 
      waterPumpDevice, 
      windowDevice,
      waterValveDevice,
      fanDevice,
      lightDevice
    };
  } catch (error) {
    console.error('Error ensuring IoT devices exist:', error);
    return null;
  }
}

module.exports = router;
