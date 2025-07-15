const express = require("express");
const Devicerouter = express.Router();
const { auth } = require("../middleware/auth");
const { validateDeviceControl } = require("../middleware/validation");
const deviceController = require("../controllers/deviceController");

// Device CRUD
Devicerouter.get("/:greenhouseId", auth, deviceController.getDevices);
Devicerouter.post("/", auth, validateDeviceControl, deviceController.createDevice);
Devicerouter.put("/:deviceId", auth, deviceController.updateDevice);
Devicerouter.delete("/:deviceId", auth, deviceController.deleteDevice);

// Toggle & Automation
Devicerouter.post("/:deviceId/toggle", auth, deviceController.toggleDevice);
Devicerouter.post("/:deviceId/automation", auth, deviceController.setAutomation);

// Stats & Control
Devicerouter.get("/stats/:greenhouseId", auth, deviceController.getStats);
Devicerouter.post("/:deviceId/control", auth, deviceController.manualControl);
Devicerouter.get("/control-history/:greenhouseId", auth, deviceController.getHistory);

// Setup devices (with and without auth)
Devicerouter.post("/setup-iot-devices", auth, deviceController.setupDevices);
Devicerouter.post("/setup-iot-devices-public", deviceController.setupDevicesPublic);

module.exports = Devicerouter;
