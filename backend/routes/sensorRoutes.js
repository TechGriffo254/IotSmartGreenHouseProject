const express = require('express');
const router = express.Router();
const SensorData = require('../models/SensorData');
const Alert = require('../models/Alert');
const { auth } = require('../middleware/auth');
const { validateSensorData } = require('../middleware/validation');

// GET /api/sensors/latest/:greenhouseId - Get latest sensor readings
router.get('/latest/:greenhouseId', auth, async (req, res) => {
  try {
    const { greenhouseId } = req.params;
    const latestReadings = await SensorData.getLatestReadings(greenhouseId);
    
    res.json({
      success: true,
      data: latestReadings,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching latest readings:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch latest sensor readings',
      error: error.message
    });
  }
});

// GET /api/sensors/historical/:greenhouseId - Get historical sensor data
router.get('/historical/:greenhouseId', auth, async (req, res) => {
  try {
    const { greenhouseId } = req.params;
    const { hours = 24, sensorType } = req.query;
    
    let query = { greenhouseId };
    if (sensorType) {
      query.sensorType = sensorType;
    }
    
    const startTime = new Date(Date.now() - hours * 60 * 60 * 1000);
    query.timestamp = { $gte: startTime };
    
    const historicalData = await SensorData.find(query)
      .sort({ timestamp: 1 })
      .limit(1000); // Limit to prevent overwhelming response
    
    res.json({
      success: true,
      data: historicalData,
      count: historicalData.length,
      timeRange: { hours: parseInt(hours), from: startTime }
    });
  } catch (error) {
    console.error('Error fetching historical data:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch historical sensor data',
      error: error.message
    });
  }
});

// POST /api/sensors/data - Add new sensor reading (for IoT devices)
router.post('/data', validateSensorData, async (req, res) => {
  try {
    const sensorData = new SensorData(req.body);
    await sensorData.save();
    
    // Emit real-time data via Socket.IO
    const io = req.app.get('io');
    io.to(`greenhouse-${sensorData.greenhouseId}`).emit('sensorUpdate', sensorData);
    
    // Check for alerts
    await checkAndCreateAlerts(sensorData, io);
    
    res.status(201).json({
      success: true,
      data: sensorData,
      message: 'Sensor data recorded successfully'
    });
  } catch (error) {
    console.error('Error saving sensor data:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to save sensor data',
      error: error.message
    });
  }
});

// GET /api/sensors/stats/:greenhouseId - Get sensor statistics
router.get('/stats/:greenhouseId', auth, async (req, res) => {
  try {
    const { greenhouseId } = req.params;
    const { hours = 24 } = req.query;
    
    const startTime = new Date(Date.now() - hours * 60 * 60 * 1000);
    
    const stats = await SensorData.aggregate([
      {
        $match: {
          greenhouseId,
          timestamp: { $gte: startTime }
        }
      },
      {
        $group: {
          _id: '$sensorType',
          avgTemperature: { $avg: '$temperature' },
          maxTemperature: { $max: '$temperature' },
          minTemperature: { $min: '$temperature' },
          avgHumidity: { $avg: '$humidity' },
          maxHumidity: { $max: '$humidity' },
          minHumidity: { $min: '$humidity' },
          avgLightIntensity: { $avg: '$lightIntensity' },
          maxLightIntensity: { $max: '$lightIntensity' },
          minLightIntensity: { $min: '$lightIntensity' },
          avgSoilMoisture: { $avg: '$soilMoisture' },
          maxSoilMoisture: { $max: '$soilMoisture' },
          minSoilMoisture: { $min: '$soilMoisture' },
          count: { $sum: 1 }
        }
      }
    ]);
    
    res.json({
      success: true,
      data: stats,
      timeRange: { hours: parseInt(hours), from: startTime }
    });
  } catch (error) {
    console.error('Error fetching sensor stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch sensor statistics',
      error: error.message
    });
  }
});

// Function to check thresholds and create alerts
async function checkAndCreateAlerts(sensorData, io) {
  const alerts = [];
  
  // Temperature alerts
  if (sensorData.temperature !== undefined) {
    if (sensorData.temperature > process.env.ALERT_THRESHOLD_TEMP_HIGH) {
      alerts.push({
        greenhouseId: sensorData.greenhouseId,
        alertType: 'TEMPERATURE_HIGH',
        severity: 'HIGH',
        message: `Temperature is too high: ${sensorData.temperature}°C`,
        currentValue: sensorData.temperature,
        thresholdValue: process.env.ALERT_THRESHOLD_TEMP_HIGH,
        sensorType: sensorData.sensorType,
        deviceId: sensorData.deviceId
      });
    } else if (sensorData.temperature < process.env.ALERT_THRESHOLD_TEMP_LOW) {
      alerts.push({
        greenhouseId: sensorData.greenhouseId,
        alertType: 'TEMPERATURE_LOW',
        severity: 'HIGH',
        message: `Temperature is too low: ${sensorData.temperature}°C`,
        currentValue: sensorData.temperature,
        thresholdValue: process.env.ALERT_THRESHOLD_TEMP_LOW,
        sensorType: sensorData.sensorType,
        deviceId: sensorData.deviceId
      });
    }
  }
  
  // Humidity alerts
  if (sensorData.humidity !== undefined) {
    if (sensorData.humidity > process.env.ALERT_THRESHOLD_HUMIDITY_HIGH) {
      alerts.push({
        greenhouseId: sensorData.greenhouseId,
        alertType: 'HUMIDITY_HIGH',
        severity: 'MEDIUM',
        message: `Humidity is too high: ${sensorData.humidity}%`,
        currentValue: sensorData.humidity,
        thresholdValue: process.env.ALERT_THRESHOLD_HUMIDITY_HIGH,
        sensorType: sensorData.sensorType,
        deviceId: sensorData.deviceId
      });
    } else if (sensorData.humidity < process.env.ALERT_THRESHOLD_HUMIDITY_LOW) {
      alerts.push({
        greenhouseId: sensorData.greenhouseId,
        alertType: 'HUMIDITY_LOW',
        severity: 'MEDIUM',
        message: `Humidity is too low: ${sensorData.humidity}%`,
        currentValue: sensorData.humidity,
        thresholdValue: process.env.ALERT_THRESHOLD_HUMIDITY_LOW,
        sensorType: sensorData.sensorType,
        deviceId: sensorData.deviceId
      });
    }
  }
  
  // Soil moisture alerts
  if (sensorData.soilMoisture !== undefined && sensorData.soilMoisture < process.env.ALERT_THRESHOLD_SOIL_MOISTURE_LOW) {
    alerts.push({
      greenhouseId: sensorData.greenhouseId,
      alertType: 'SOIL_MOISTURE_LOW',
      severity: 'HIGH',
      message: `Soil moisture is too low: ${sensorData.soilMoisture}%`,
      currentValue: sensorData.soilMoisture,
      thresholdValue: process.env.ALERT_THRESHOLD_SOIL_MOISTURE_LOW,
      sensorType: sensorData.sensorType,
      deviceId: sensorData.deviceId
    });
  }
  
  // Light intensity alerts
  if (sensorData.lightIntensity !== undefined && sensorData.lightIntensity < process.env.ALERT_THRESHOLD_LIGHT_LOW) {
    alerts.push({
      greenhouseId: sensorData.greenhouseId,
      alertType: 'LIGHT_LEVEL_LOW',
      severity: 'MEDIUM',
      message: `Light level is too low: ${sensorData.lightIntensity}`,
      currentValue: sensorData.lightIntensity,
      thresholdValue: process.env.ALERT_THRESHOLD_LIGHT_LOW,
      sensorType: sensorData.sensorType,
      deviceId: sensorData.deviceId
    });
  }
  
  // Save alerts and emit via Socket.IO
  for (const alertData of alerts) {
    try {
      const alert = new Alert(alertData);
      await alert.save();
      io.to(`greenhouse-${alert.greenhouseId}`).emit('newAlert', alert);
    } catch (error) {
      console.error('Error creating alert:', error);
    }
  }
}

module.exports = router;
