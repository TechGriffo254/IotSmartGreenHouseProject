const express = require("express");
const router = express.Router();
const { auth } = require("../middleware/auth");
const { validateDeviceControl } = require("../middleware/validation");
const deviceController = require("../controllers/deviceController");

// Device CRUD
router.get("/:greenhouseId", auth, deviceController.getDevices);
router.post("/", auth, validateDeviceControl, deviceController.createDevice);
router.put("/:deviceId", auth, deviceController.updateDevice);
router.delete("/:deviceId", auth, deviceController.deleteDevice);

// Toggle & Automation
router.post("/:deviceId/toggle", auth, deviceController.toggleDevice);
router.post("/:deviceId/automation", auth, deviceController.setAutomation);

// Stats & Control
router.get("/stats/:greenhouseId", auth, deviceController.getStats);
router.post("/:deviceId/control", auth, deviceController.manualControl);
router.get("/control-history/:greenhouseId", auth, deviceController.getHistory);

// Setup devices (with and without auth)
router.post("/setup-iot-devices", auth, deviceController.setupDevices);
router.post("/setup-iot-devices-public", deviceController.setupDevicesPublic);

module.exports = router;
