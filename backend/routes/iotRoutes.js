const express = require('express');
const router = express.Router();
const SensorData = require('../models/SensorData');
const DeviceControl = require('../models/DeviceControl');
const Alert = require('../models/Alert');

// POST /api/iot/sensor-data - Simplified endpoint for IoT devices to send sensor data
router.post('/sensor-data', async (req, res) => {
  try {
    const { 
      deviceId, 
      sensorType, 
      temperature, 
      humidity, 
      lightIntensity, 
      soilMoisture,
      greenhouseId = 'greenhouse-001',
      location = 'Main Greenhouse'
    } = req.body;

    // Validate required fields
    if (!deviceId || !sensorType) {
      return res.status(400).json({
        success: false,
        message: 'deviceId and sensorType are required'
      });
    }

    // Create sensor data object
    const sensorData = new SensorData({
      greenhouseId,
      sensorType,
      deviceId,
      location,
      temperature: sensorType === 'DHT11' ? temperature : undefined,
      humidity: sensorType === 'DHT11' ? humidity : undefined,
      lightIntensity: sensorType === 'LDR' ? lightIntensity : undefined,
      soilMoisture: sensorType === 'SOIL_MOISTURE' ? soilMoisture : undefined,
      timestamp: new Date()
    });

    await sensorData.save();

    // Emit real-time data via Socket.IO if available
    const io = req.app.get('io');
    if (io) {
      io.to(`greenhouse-${sensorData.greenhouseId}`).emit('sensorUpdate', sensorData);
    }

    // Check for threshold violations and create alerts
    await checkThresholds(sensorData, io);

    res.status(201).json({
      success: true,
      message: 'Sensor data received and processed',
      data: {
        id: sensorData._id,
        timestamp: sensorData.timestamp
      }
    });

  } catch (error) {
    console.error('IoT sensor data error:', error);
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
      message: 'Failed to get device commands'
    });
  }
});

// POST /api/iot/device-status - IoT device reports its current status
router.post('/device-status', async (req, res) => {
  try {
    const { 
      deviceId, 
      status, 
      intensity, 
      powerConsumption,
      errorCode,
      lastActivated
    } = req.body;

    if (!deviceId) {
      return res.status(400).json({
        success: false,
        message: 'deviceId is required'
      });
    }

    const device = await DeviceControl.findOne({ deviceId });
    if (!device) {
      return res.status(404).json({
        success: false,
        message: 'Device not found'
      });
    }

    // Update device status
    if (status !== undefined) device.status = status;
    if (intensity !== undefined) device.intensity = intensity;
    if (powerConsumption !== undefined) device.powerConsumption = powerConsumption;
    if (lastActivated) device.lastActivated = new Date(lastActivated);

    await device.save();

    // Emit device update via Socket.IO
    const io = req.app.get('io');
    if (io) {
      io.to(`greenhouse-${device.greenhouseId}`).emit('deviceUpdate', device);
    }

    // Create alert if device reports an error
    if (errorCode) {
      const alert = new Alert({
        greenhouseId: device.greenhouseId,
        alertType: 'DEVICE_MALFUNCTION',
        severity: 'HIGH',
        message: `Device ${device.deviceName} reported error code: ${errorCode}`,
        currentValue: errorCode,
        thresholdValue: 0,
        sensorType: 'DEVICE',
        deviceId: device.deviceId
      });
      
      await alert.save();
      
      if (io) {
        io.to(`greenhouse-${device.greenhouseId}`).emit('newAlert', alert);
      }
    }

    res.json({
      success: true,
      message: 'Device status updated successfully'
    });

  } catch (error) {
    console.error('Device status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update device status'
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

// POST /api/iot - Comprehensive endpoint for ESP32 greenhouse controller
router.post('/', async (req, res) => {
  try {
    const { 
      deviceId,
      timestamp,
      sensors,
      actuators,
      status,
      greenhouseId = 'greenhouse-001'
    } = req.body;

    // Validate required fields
    if (!deviceId || !sensors) {
      return res.status(400).json({
        success: false,
        message: 'deviceId and sensors data are required'
      });
    }

    console.log('📡 IoT data received from device:', deviceId);
    console.log('📊 Sensor data:', sensors);
    console.log('🔧 Actuator states:', actuators);

    // Store individual sensor readings
    const sensorPromises = [];
    const io = req.app.get('io');

    // Temperature & Humidity (DHT11)
    if (sensors.temperature !== undefined && sensors.humidity !== undefined) {
      const dhtData = new SensorData({
        greenhouseId,
        sensorType: 'DHT11',
        deviceId,
        location: 'Main Greenhouse',
        temperature: sensors.temperature,
        humidity: sensors.humidity,
        timestamp: new Date()
      });
      sensorPromises.push(dhtData.save());

      // Emit real-time update
      if (io) {
        io.to(`greenhouse-${greenhouseId}`).emit('sensorUpdate', {
          type: 'temperature',
          value: sensors.temperature,
          unit: '°C',
          timestamp: new Date()
        });
        io.to(`greenhouse-${greenhouseId}`).emit('sensorUpdate', {
          type: 'humidity',
          value: sensors.humidity,
          unit: '%',
          timestamp: new Date()
        });
      }
    }

    // Soil Moisture
    if (sensors.soilMoisture !== undefined) {
      const moistureData = new SensorData({
        greenhouseId,
        sensorType: 'SOIL_MOISTURE',
        deviceId,
        location: 'Main Greenhouse',
        soilMoisture: sensors.soilMoisture,
        timestamp: new Date()
      });
      sensorPromises.push(moistureData.save());

      // Emit real-time update
      if (io) {
        io.to(`greenhouse-${greenhouseId}`).emit('sensorUpdate', {
          type: 'soilMoisture',
          value: sensors.soilMoisture,
          unit: 'raw',
          timestamp: new Date()
        });
      }
    }

    // Light Level (LDR)
    if (sensors.lightLevel !== undefined) {
      const lightData = new SensorData({
        greenhouseId,
        sensorType: 'LDR',
        deviceId,
        location: 'Main Greenhouse',
        lightIntensity: sensors.lightLevel,
        timestamp: new Date()
      });
      sensorPromises.push(lightData.save());

      // Emit real-time update
      if (io) {
        io.to(`greenhouse-${greenhouseId}`).emit('sensorUpdate', {
          type: 'lightLevel',
          value: sensors.lightLevel,
          unit: 'lux',
          timestamp: new Date()
        });
      }
    }

    // Water Level (Ultrasonic)
    if (sensors.waterLevel !== undefined) {
      const waterData = new SensorData({
        greenhouseId,
        sensorType: 'ULTRASONIC',
        deviceId,
        location: 'Water Tank',
        customValue: sensors.waterLevel,
        timestamp: new Date()
      });
      sensorPromises.push(waterData.save());

      // Emit real-time update
      if (io) {
        io.to(`greenhouse-${greenhouseId}`).emit('sensorUpdate', {
          type: 'waterLevel',
          value: sensors.waterLevel,
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
    if (sensors.temperature > process.env.ALERT_THRESHOLD_TEMP_HIGH || 35) {
      alerts.push({
        alertType: 'TEMPERATURE_HIGH',
        severity: sensors.temperature > 40 ? 'CRITICAL' : 'HIGH',
        message: `Temperature too high: ${sensors.temperature}°C`
      });
    } else if (sensors.temperature < (process.env.ALERT_THRESHOLD_TEMP_LOW || 15)) {
      alerts.push({
        alertType: 'TEMPERATURE_LOW',
        severity: 'MEDIUM',
        message: `Temperature too low: ${sensors.temperature}°C`
      });
    }
  }

  // Humidity thresholds
  if (sensors.humidity !== undefined) {
    if (sensors.humidity > (process.env.ALERT_THRESHOLD_HUMIDITY_HIGH || 80)) {
      alerts.push({
        alertType: 'HUMIDITY_HIGH',
        severity: 'MEDIUM',
        message: `Humidity too high: ${sensors.humidity}%`
      });
    } else if (sensors.humidity < (process.env.ALERT_THRESHOLD_HUMIDITY_LOW || 40)) {
      alerts.push({
        alertType: 'HUMIDITY_LOW',
        severity: 'MEDIUM',
        message: `Humidity too low: ${sensors.humidity}%`
      });
    }
  }

  // Soil moisture thresholds
  if (sensors.soilMoisture !== undefined) {
    if (sensors.soilMoisture < (process.env.ALERT_THRESHOLD_SOIL_MOISTURE_LOW || 30)) {
      alerts.push({
        alertType: 'SOIL_MOISTURE_LOW',
        severity: 'HIGH',
        message: `Soil moisture low: ${sensors.soilMoisture}`
      });
    }
  }

  // Light level thresholds
  if (sensors.lightLevel !== undefined) {
    if (sensors.lightLevel < (process.env.ALERT_THRESHOLD_LIGHT_LOW || 200)) {
      alerts.push({
        alertType: 'LIGHT_LOW',
        severity: 'LOW',
        message: `Light level low: ${sensors.lightLevel}`
      });
    }
  }

  // Water level thresholds
  if (sensors.waterLevel !== undefined && sensors.waterLevel < 10) {
    alerts.push({
      alertType: 'WATER_LEVEL_LOW',
      severity: 'CRITICAL',
      message: `Water level critical: ${sensors.waterLevel}cm`
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
  const alerts = [];
  
  // Temperature thresholds
  if (sensorData.temperature !== undefined) {
    const tempHigh = parseFloat(process.env.ALERT_THRESHOLD_TEMP_HIGH) || 35;
    const tempLow = parseFloat(process.env.ALERT_THRESHOLD_TEMP_LOW) || 15;
    
    if (sensorData.temperature > tempHigh) {
      alerts.push({
        greenhouseId: sensorData.greenhouseId,
        alertType: 'TEMPERATURE_HIGH',
        severity: sensorData.temperature > tempHigh + 5 ? 'CRITICAL' : 'HIGH',
        message: `Temperature is ${sensorData.temperature}°C (threshold: ${tempHigh}°C)`,
        currentValue: sensorData.temperature,
        thresholdValue: tempHigh,
        sensorType: sensorData.sensorType,
        deviceId: sensorData.deviceId
      });
    } else if (sensorData.temperature < tempLow) {
      alerts.push({
        greenhouseId: sensorData.greenhouseId,
        alertType: 'TEMPERATURE_LOW',
        severity: sensorData.temperature < tempLow - 5 ? 'CRITICAL' : 'HIGH',
        message: `Temperature is ${sensorData.temperature}°C (threshold: ${tempLow}°C)`,
        currentValue: sensorData.temperature,
        thresholdValue: tempLow,
        sensorType: sensorData.sensorType,
        deviceId: sensorData.deviceId
      });
    }
  }
  
  // Humidity thresholds
  if (sensorData.humidity !== undefined) {
    const humidityHigh = parseFloat(process.env.ALERT_THRESHOLD_HUMIDITY_HIGH) || 80;
    const humidityLow = parseFloat(process.env.ALERT_THRESHOLD_HUMIDITY_LOW) || 40;
    
    if (sensorData.humidity > humidityHigh) {
      alerts.push({
        greenhouseId: sensorData.greenhouseId,
        alertType: 'HUMIDITY_HIGH',
        severity: 'MEDIUM',
        message: `Humidity is ${sensorData.humidity}% (threshold: ${humidityHigh}%)`,
        currentValue: sensorData.humidity,
        thresholdValue: humidityHigh,
        sensorType: sensorData.sensorType,
        deviceId: sensorData.deviceId
      });
    } else if (sensorData.humidity < humidityLow) {
      alerts.push({
        greenhouseId: sensorData.greenhouseId,
        alertType: 'HUMIDITY_LOW',
        severity: 'MEDIUM',
        message: `Humidity is ${sensorData.humidity}% (threshold: ${humidityLow}%)`,
        currentValue: sensorData.humidity,
        thresholdValue: humidityLow,
        sensorType: sensorData.sensorType,
        deviceId: sensorData.deviceId
      });
    }
  }
  
  // Soil moisture thresholds
  if (sensorData.soilMoisture !== undefined) {
    const moistureLow = parseFloat(process.env.ALERT_THRESHOLD_SOIL_MOISTURE_LOW) || 30;
    
    if (sensorData.soilMoisture < moistureLow) {
      alerts.push({
        greenhouseId: sensorData.greenhouseId,
        alertType: 'SOIL_MOISTURE_LOW',
        severity: sensorData.soilMoisture < moistureLow / 2 ? 'CRITICAL' : 'HIGH',
        message: `Soil moisture is ${sensorData.soilMoisture}% (threshold: ${moistureLow}%)`,
        currentValue: sensorData.soilMoisture,
        thresholdValue: moistureLow,
        sensorType: sensorData.sensorType,
        deviceId: sensorData.deviceId
      });
    }
  }
  
  // Light intensity thresholds
  if (sensorData.lightIntensity !== undefined) {
    const lightLow = parseFloat(process.env.ALERT_THRESHOLD_LIGHT_LOW) || 200;
    
    if (sensorData.lightIntensity < lightLow) {
      alerts.push({
        greenhouseId: sensorData.greenhouseId,
        alertType: 'LIGHT_LEVEL_LOW',
        severity: 'MEDIUM',
        message: `Light level is ${sensorData.lightIntensity} lux (threshold: ${lightLow} lux)`,
        currentValue: sensorData.lightIntensity,
        thresholdValue: lightLow,
        sensorType: sensorData.sensorType,
        deviceId: sensorData.deviceId
      });
    }
  }
  
  // Save alerts and emit via Socket.IO
  for (const alertData of alerts) {
    try {
      // Check if similar alert already exists and is not resolved
      const existingAlert = await Alert.findOne({
        greenhouseId: alertData.greenhouseId,
        alertType: alertData.alertType,
        deviceId: alertData.deviceId,
        isResolved: false,
        createdAt: { $gte: new Date(Date.now() - 10 * 60 * 1000) } // Within last 10 minutes
      });
      
      if (!existingAlert) {
        const alert = new Alert(alertData);
        await alert.save();
        
        if (io) {
          io.to(`greenhouse-${alert.greenhouseId}`).emit('newAlert', alert);
        }
      }
    } catch (error) {
      console.error('Error creating alert:', error);
    }
  }
}

module.exports = router;
