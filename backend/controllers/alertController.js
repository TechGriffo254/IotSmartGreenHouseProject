const Alert = require("../models/Alert");

exports.getAlerts = async (req, res) => {
  try {
    const { greenhouseId } = req.params;
    const { status = "all", limit = 50, page = 1 } = req.query;
    let query = { greenhouseId };

    if (status === "active") query.isResolved = false;
    else if (status === "resolved") query.isResolved = true;

    const skip = (page - 1) * limit;
    const alerts = await Alert.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(skip);
    const totalCount = await Alert.countDocuments(query);

    res.json({
      success: true,
      data: alerts,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: totalCount,
        pages: Math.ceil(totalCount / limit),
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch alerts",
      error: error.message,
    });
  }
};

exports.getActiveAlerts = async (req, res) => {
  try {
    const { greenhouseId } = req.params;
    const activeAlerts = await Alert.getActiveAlerts(greenhouseId);

    res.json({
      success: true,
      data: activeAlerts,
      count: activeAlerts.length,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch active alerts",
      error: error.message,
    });
  }
};

exports.resolveAlert = async (req, res) => {
  try {
    const { alertId } = req.params;
    const { actionTaken } = req.body;

    const alert = await Alert.findById(alertId);
    if (!alert) return res.status(404).json({ success: false, message: "Alert not found" });
    if (alert.isResolved)
      return res.status(400).json({ success: false, message: "Alert is already resolved" });

    await alert.resolve(req.user.username, actionTaken);

    const io = req.app.get("io");
    io.to(`greenhouse-${alert.greenhouseId}`).emit("alertResolved", alert);

    res.json({
      success: true,
      data: alert,
      message: "Alert resolved successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to resolve alert",
      error: error.message,
    });
  }
};

exports.createAlert = async (req, res) => {
  try {
    const { greenhouseId } = req.params;
    const alertData = { ...req.body, greenhouseId };

    const alert = new Alert(alertData);
    await alert.save();

    const io = req.app.get("io");
    io.to(`greenhouse-${greenhouseId}`).emit("newAlert", alert);

    res.status(201).json({
      success: true,
      data: alert,
      message: "Alert created successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to create alert",
      error: error.message,
    });
  }
};

exports.getAlertStats = async (req, res) => {
  try {
    const { greenhouseId } = req.params;
    const { hours = 24 } = req.query;

    const startTime = new Date(Date.now() - hours * 60 * 60 * 1000);

    const stats = await Alert.aggregate([
      { $match: { greenhouseId, createdAt: { $gte: startTime } } },
      {
        $group: {
          _id: { alertType: "$alertType", severity: "$severity" },
          count: { $sum: 1 },
          resolved: { $sum: { $cond: ["$isResolved", 1, 0] } },
        },
      },
    ]);

    const severityStats = await Alert.aggregate([
      { $match: { greenhouseId, createdAt: { $gte: startTime } } },
      {
        $group: {
          _id: "$severity",
          count: { $sum: 1 },
          resolved: { $sum: { $cond: ["$isResolved", 1, 0] } },
        },
      },
    ]);

    const totalStats = await Alert.aggregate([
      { $match: { greenhouseId, createdAt: { $gte: startTime } } },
      {
        $group: {
          _id: null,
          totalAlerts: { $sum: 1 },
          totalResolved: { $sum: { $cond: ["$isResolved", 1, 0] } },
          totalActive: { $sum: { $cond: [{ $eq: ["$isResolved", false] }, 1, 0] } },
        },
      },
    ]);

    res.json({
      success: true,
      data: {
        byTypeAndSeverity: stats,
        bySeverity: severityStats,
        overall: totalStats[0] || {
          totalAlerts: 0,
          totalResolved: 0,
          totalActive: 0,
        },
      },
      timeRange: { hours: parseInt(hours), from: startTime },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch alert statistics",
      error: error.message,
    });
  }
};

exports.deleteAlert = async (req, res) => {
  try {
    const { alertId } = req.params;

    const alert = await Alert.findByIdAndDelete(alertId);
    if (!alert) return res.status(404).json({ success: false, message: "Alert not found" });

    const io = req.app.get("io");
    io.to(`greenhouse-${alert.greenhouseId}`).emit("alertDeleted", { alertId });

    res.json({ success: true, message: "Alert deleted successfully" });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to delete alert",
      error: error.message,
    });
  }
};
