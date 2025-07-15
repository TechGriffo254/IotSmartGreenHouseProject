const express = require("express");
const Sensorrouter = express.Router();

const {
  getLatestReadings,
  getHistoricalData,
  postSensorData,
  getSensorStats,
} = require("../controllers/sensorsControllers");

const { auth } = require("../middleware/auth");
const { validateSensorData } = require("../middleware/validation");

// Routes
Sensorrouter.get("/latest/:greenhouseId", auth, getLatestReadings);
Sensorrouter.get("/historical/:greenhouseId", auth, getHistoricalData);
Sensorrouter.post("/data", validateSensorData, postSensorData);
Sensorrouter.get("/stats/:greenhouseId", auth, getSensorStats);

module.exports = Sensorrouter;
