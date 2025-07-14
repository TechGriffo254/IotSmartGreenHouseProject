const SensorData = require("../models/SensorData");
const Alert = require("../models/Alert");

const getLatestReadings = async (req, res) => {
  try {
    const { greenhouseId } = req.params;
    const latestReadings = await SensorData.getLatestReadings(greenhouseId);

    res.json({
      success: true,
      data: latestReadings,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error fetching latest readings:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch latest sensor readings",
      error: error.message,
    });
  }
};

const getHistoricalData = async (req, res) => {
  try {
    const { greenhouseId } = req.params;
    const { hours = 24, sensorType } = req.query;

    let query = { greenhouseId };
    if (sensorType) query.sensorType = sensorType;

    const startTime = new Date(Date.now() - hours * 60 * 60 * 1000);
    query.timestamp = { $gte: startTime };

    const historicalData = await SensorData.find(query)
      .sort({ timestamp: 1 })
      .limit(1000);

    res.json({
      success: true,
      data: historicalData,
      count: historicalData.length,
      timeRange: { hours: parseInt(hours), from: startTime },
    });
  } catch (error) {
    console.error("Error fetching historical data:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch historical sensor data",
      error: error.message,
    });
  }
};

const postSensorData = async (req, res) => {
  try {
    const sensorData = new SensorData(req.body);
    await sensorData.save();

    const io = req.app.get("io");
    io.to(`greenhouse-${sensorData.greenhouseId}`).emit("sensorUpdate", sensorData);

    await checkAndCreateAlerts(sensorData, io);

    res.status(201).json({
      success: true,
      data: sensorData,
      message: "Sensor data recorded successfully",
    });
  } catch (error) {
    console.error("Error saving sensor data:", error);
    res.status(500).json({
      success: false,
      message: "Failed to save sensor data",
      error: error.message,
    });
  }
};

const getSensorStats = async (req, res) => {
  try {
    const { greenhouseId } = req.params;
    const { hours = 24 } = req.query;
    const startTime = new Date(Date.now() - hours * 60 * 60 * 1000);

    const stats = await SensorData.aggregate([
      {
        $match: {
          greenhouseId,
          timestamp: { $gte: startTime },
        },
      },
      {
        $group: {
          _id: "$sensorType",
          avgTemperature: { $avg: "$temperature" },
          maxTemperature: { $max: "$temperature" },
          minTemperature: { $min: "$temperature" },
          avgHumidity: { $avg: "$humidity" },
          maxHumidity: { $max: "$humidity" },
          minHumidity: { $min: "$humidity" },
          avgLightIntensity: { $avg: "$lightIntensity" },
          maxLightIntensity: { $max: "$lightIntensity" },
          minLightIntensity: { $min: "$lightIntensity" },
          avgSoilMoisture: { $avg: "$soilMoisture" },
          maxSoilMoisture: { $max: "$soilMoisture" },
          minSoilMoisture: { $min: "$soilMoisture" },
          count: { $sum: 1 },
        },
      },
    ]);

    res.json({
      success: true,
      data: stats,
      timeRange: { hours: parseInt(hours), from: startTime },
    });
  } catch (error) {
    console.error("Error fetching sensor stats:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch sensor statistics",
      error: error.message,
    });
  }
};

// Internal function
async function checkAndCreateAlerts(sensorData, io) {
  const alerts = [];

  // === Threshold checks (temperature, humidity, etc.)
  if (sensorData.temperature > process.env.ALERT_THRESHOLD_TEMP_HIGH) {
    alerts.push({
      greenhouseId: sensorData.greenhouseId,
      alertType: "TEMPERATURE_HIGH",
      severity: "HIGH",
      message: `Temperature is too high: ${sensorData.temperature}°C`,
      currentValue: sensorData.temperature,
      thresholdValue: process.env.ALERT_THRESHOLD_TEMP_HIGH,
      sensorType: sensorData.sensorType,
      deviceId: sensorData.deviceId,
    });
  }

  // Additional alert conditions here: temperature low, humidity, soil, light...

  for (const alertData of alerts) {
    try {
      const alert = new Alert(alertData);
      await alert.save();
      io.to(`greenhouse-${alert.greenhouseId}`).emit("newAlert", alert);
    } catch (error) {
      console.error("Error creating alert:", error);
    }
  }
}

module.exports = {
  getLatestReadings,
  getHistoricalData,
  postSensorData,
  getSensorStats,
};
