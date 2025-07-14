// controllers/deviceController.js
const DeviceControl = require("../models/DeviceControl");
const DeviceControlLog = require("../models/DeviceControlLog");

exports.getDevices = async (req, res) => {
  try {
    const { greenhouseId } = req.params;
    const devices = await DeviceControl.getDevicesByGreenhouse(greenhouseId);
    res.json({ success: true, data: devices, count: devices.length });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to fetch devices", error: error.message });
  }
};

exports.createDevice = async (req, res) => {
  try {
    const device = new DeviceControl(req.body);
    await device.save();
    req.app.get("io").to(`greenhouse-${device.greenhouseId}`).emit("deviceAdded", device);
    res.status(201).json({ success: true, data: device, message: "Device created successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to create device", error: error.message });
  }
};

exports.updateDevice = async (req, res) => {
  try {
    const { deviceId } = req.params;
    const updates = req.body;
    const device = await DeviceControl.findOne({ deviceId });
    if (!device) return res.status(404).json({ success: false, message: "Device not found" });

    Object.keys(updates).forEach((key) => { if (updates[key] !== undefined) device[key] = updates[key]; });
    if (updates.status === "ON") device.lastActivated = new Date();

    await device.save();
    req.app.get("io").to(`greenhouse-${device.greenhouseId}`).emit("deviceUpdate", device);
    res.json({ success: true, data: device, message: "Device updated successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to update device", error: error.message });
  }
};

exports.toggleDevice = async (req, res) => {
  try {
    const { deviceId } = req.params;
    const device = await DeviceControl.findOne({ deviceId });
    if (!device) return res.status(404).json({ success: false, message: "Device not found" });

    await device.toggle();
    req.app.get("io").to(`greenhouse-${device.greenhouseId}`).emit("deviceUpdate", device);
    res.json({ success: true, data: device, message: `Device ${device.status.toLowerCase()} successfully` });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to toggle device", error: error.message });
  }
};

exports.setAutomation = async (req, res) => {
  try {
    const { deviceId } = req.params;
    const { automationRules, autoMode } = req.body;
    const device = await DeviceControl.findOne({ deviceId });
    if (!device) return res.status(404).json({ success: false, message: "Device not found" });

    if (automationRules) device.automationRules = { ...device.automationRules, ...automationRules };
    if (autoMode !== undefined) device.autoMode = autoMode;

    await device.save();
    req.app.get("io").to(`greenhouse-${device.greenhouseId}`).emit("deviceUpdate", device);
    res.json({ success: true, data: device, message: "Automation rules updated successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to update automation rules", error: error.message });
  }
};

exports.getStats = async (req, res) => {
  try {
    const { greenhouseId } = req.params;
    const stats = await DeviceControl.aggregate([
      { $match: { greenhouseId } },
      { $group: {
          _id: "$deviceType",
          totalDevices: { $sum: 1 },
          activeDevices: { $sum: { $cond: [{ $eq: ["$status", "ON"] }, 1, 0] } },
          autoModeDevices: { $sum: { $cond: ["$autoMode", 1, 0] } },
          totalPowerConsumption: { $sum: "$powerConsumption" },
        } }
    ]);

    const overall = await DeviceControl.aggregate([
      { $match: { greenhouseId } },
      { $group: {
          _id: null,
          totalDevices: { $sum: 1 },
          totalActiveDevices: { $sum: { $cond: [{ $eq: ["$status", "ON"] }, 1, 0] } },
          totalPowerConsumption: { $sum: "$powerConsumption" },
          totalAutoModeDevices: { $sum: { $cond: ["$autoMode", 1, 0] } },
        } }
    ]);

    res.json({ success: true, data: { byType: stats, overall: overall[0] || {} } });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to fetch stats", error: error.message });
  }
};

exports.deleteDevice = async (req, res) => {
  try {
    const { deviceId } = req.params;
    const device = await DeviceControl.findOneAndDelete({ deviceId });
    if (!device) return res.status(404).json({ success: false, message: "Device not found" });
    req.app.get("io").to(`greenhouse-${device.greenhouseId}`).emit("deviceRemoved", { deviceId });
    res.json({ success: true, message: "Device deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to delete device", error: error.message });
  }
};

exports.manualControl = async (req, res) => {
  try {
    const { deviceId } = req.params;
    const { action, value } = req.body;
    const device = await DeviceControl.findOne({ deviceId });
    if (!device) return res.status(404).json({ success: false, message: "Device not found" });

    let newStatus = device.status;
    let message = "";

    switch (action) {
      case "turn_on": newStatus = "ON"; device.lastActivated = new Date(); message = `${device.deviceName} turned on`; break;
      case "turn_off": newStatus = "OFF"; message = `${device.deviceName} turned off`; break;
      case "open": newStatus = "OPEN"; device.lastActivated = new Date(); message = `${device.deviceName} opened`; break;
      case "close": newStatus = "CLOSED"; message = `${device.deviceName} closed`; break;
      case "toggle":
        newStatus = device.deviceType === "SERVO"
          ? (device.status === "OPEN" ? "CLOSED" : "OPEN")
          : (device.status === "ON" ? "OFF" : "ON");
        message = `${device.deviceName} ${newStatus.toLowerCase()}`;
        if (newStatus === "ON" || newStatus === "OPEN") device.lastActivated = new Date();
        break;
      case "set_intensity":
        if (value !== undefined) {
          device.intensity = Math.max(0, Math.min(100, value));
          message = `${device.deviceName} intensity set to ${device.intensity}%`;
        }
        break;
      case "set_auto_mode":
        device.autoMode = value !== undefined ? value : !device.autoMode;
        message = `${device.deviceName} auto mode ${device.autoMode ? "enabled" : "disabled"}`;
        break;
      default:
        return res.status(400).json({ success: false, message: "Invalid action" });
    }

    device.status = newStatus;
    await device.save();

    const controlLog = {
      deviceId: device.deviceId,
      deviceName: device.deviceName,
      deviceType: device.deviceType,
      action,
      previousStatus: device.status,
      newStatus,
      intensity: device.intensity,
      controlSource: "manual",
      userId: req.user.id,
      username: req.user.username,
      timestamp: new Date(),
      greenhouseId: device.greenhouseId,
    };

    try { await DeviceControlLog.logControl(controlLog); } catch (e) { console.error("Log error:", e); }

    const io = req.app.get("io");
    io.to(`greenhouse-${device.greenhouseId}`).emit("deviceUpdate", device);
    io.to(`greenhouse-${device.greenhouseId}`).emit("deviceControlled", { device, action, user: req.user.username, timestamp: new Date() });

    res.json({ success: true, data: device, message, controlLog });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to control device", error: error.message });
  }
};

exports.getHistory = async (req, res) => {
  try {
    const { greenhouseId } = req.params;
    const { deviceId, limit = 50, startDate, endDate } = req.query;
    const filters = { greenhouseId };
    if (deviceId) filters.deviceId = deviceId;
    if (startDate) filters.startDate = startDate;
    if (endDate) filters.endDate = endDate;
    const history = await DeviceControlLog.getControlHistory(filters, parseInt(limit));
    res.json({ success: true, data: history, count: history.length });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to fetch control history", error: error.message });
  }
};

exports.setupDevices = async (req, res) => {
  try {
    const { greenhouseId = "greenhouse-001" } = req.body;
    const devices = [];
    let waterPump = await DeviceControl.findOne({ deviceId: "WATER_PUMP_001" });
    if (!waterPump) {
      waterPump = new DeviceControl({ deviceId: "WATER_PUMP_001", deviceName: "Smart Water Pump", deviceType: "WATER_PUMP", greenhouseId, status: "OFF", autoMode: true, location: "Main Greenhouse", intensity: 100, powerConsumption: 25 });
      await waterPump.save(); devices.push(waterPump);
    }
    let windowServo = await DeviceControl.findOne({ deviceId: "WINDOW_SERVO_001" });
    if (!windowServo) {
      windowServo = new DeviceControl({ deviceId: "WINDOW_SERVO_001", deviceName: "Automated Window", deviceType: "SERVO", greenhouseId, status: "CLOSED", autoMode: true, location: "Main Greenhouse", intensity: 90, powerConsumption: 5 });
      await windowServo.save(); devices.push(windowServo);
    }
    devices.forEach(d => req.app.get("io").to(`greenhouse-${greenhouseId}`).emit("deviceAdded", d));
    res.json({ success: true, message: `Created ${devices.length} IoT devices`, data: devices, allDevices: await DeviceControl.find({ greenhouseId }) });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to setup IoT devices", error: error.message });
  }
};

exports.setupDevicesPublic = async (req, res) => {
  req.user = { id: "public", username: "PublicTest" }; 
  return exports.setupDevices(req, res);
};
