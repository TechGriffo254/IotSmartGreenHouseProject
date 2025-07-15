const express = require("express");
const Settingrouter = express.Router();
const settingsController = require("../controllers/settingsController");
const { auth } = require("../middleware/auth");

Settingrouter.get("/:greenhouseId", auth, settingsController.getSettings);
Settingrouter.put("/:greenhouseId/thresholds", auth, settingsController.updateThresholds);
Settingrouter.put("/:greenhouseId/system", auth, settingsController.updateSystemSettings);
Settingrouter.put("/:greenhouseId/devices", auth, settingsController.updateDeviceSettings);
Settingrouter.post("/:greenhouseId/reset", auth, settingsController.resetSettings);

module.exports = Settingrouter;
