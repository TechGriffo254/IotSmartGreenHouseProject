const express = require("express");
const Alertrouter = express.Router();
const alertController = require("../controllers/alertController");
const { auth } = require("../middleware/auth");

Alertrouter.get("/:greenhouseId", auth, alertController.getAlerts);
Alertrouter.get("/active/:greenhouseId", auth, alertController.getActiveAlerts);
Alertrouter.put("/:alertId/resolve", auth, alertController.resolveAlert);
Alertrouter.post("/:greenhouseId", auth, alertController.createAlert);
Alertrouter.get("/stats/:greenhouseId", auth, alertController.getAlertStats);
Alertrouter.delete("/:alertId", auth, alertController.deleteAlert);

module.exports = Alertrouter;
