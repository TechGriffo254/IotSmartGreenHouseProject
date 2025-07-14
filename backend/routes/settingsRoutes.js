const express = require("express");
const router = express.Router();
const settingsController = require("../controllers/settingsController");
const { auth } = require("../middleware/auth");

router.get("/:greenhouseId", auth, settingsController.getSettings);
router.put("/:greenhouseId/thresholds", auth, settingsController.updateThresholds);
router.put("/:greenhouseId/system", auth, settingsController.updateSystemSettings);
router.put("/:greenhouseId/devices", auth, settingsController.updateDeviceSettings);
router.post("/:greenhouseId/reset", auth, settingsController.resetSettings);

module.exports = router;
