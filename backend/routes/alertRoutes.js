const express = require("express");
const router = express.Router();
const alertController = require("../controllers/alertController");
const { auth } = require("../middleware/auth");

router.get("/:greenhouseId", auth, alertController.getAlerts);
router.get("/active/:greenhouseId", auth, alertController.getActiveAlerts);
router.put("/:alertId/resolve", auth, alertController.resolveAlert);
router.post("/:greenhouseId", auth, alertController.createAlert);
router.get("/stats/:greenhouseId", auth, alertController.getAlertStats);
router.delete("/:alertId", auth, alertController.deleteAlert);

module.exports = router;
