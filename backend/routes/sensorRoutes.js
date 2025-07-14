const express = require("express");
const router = express.Router();

const {
  getLatestReadings,
  getHistoricalData,
  postSensorData,
  getSensorStats,
} = require("../controllers/sensorsControllers");

const { auth } = require("../middleware/auth");
const { validateSensorData } = require("../middleware/validation");

// Routes
router.get("/latest/:greenhouseId", auth, getLatestReadings);
router.get("/historical/:greenhouseId", auth, getHistoricalData);
router.post("/data", validateSensorData, postSensorData);
router.get("/stats/:greenhouseId", auth, getSensorStats);

module.exports = router;
