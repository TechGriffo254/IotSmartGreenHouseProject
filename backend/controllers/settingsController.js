const Settings = require("../models/Settings");

exports.getSettings = async (req, res) => {
  try {
    const { greenhouseId } = req.params;
    const userId = req.user.userId;

    let settings = await Settings.findOne({ userId, greenhouseId });

    if (!settings) {
      settings = new Settings({
        userId,
        greenhouseId,
        alertThresholds: {
          temperature: { high: null, low: null },
          humidity: { high: null, low: null },
          soilMoisture: { low: null },
          lightLevel: { low: null },
        },
      });
      await settings.save();
    }

    res.json(settings);
  } catch (error) {
    console.error("Error fetching settings:", error);
    res.status(500).json({ message: "Failed to fetch settings" });
  }
};

exports.updateThresholds = async (req, res) => {
  try {
    const { greenhouseId } = req.params;
    const userId = req.user.userId;
    const { alertThresholds } = req.body;

    const settings = await Settings.findOneAndUpdate(
      { userId, greenhouseId },
      {
        $set: {
          alertThresholds,
          updatedAt: new Date(),
        },
      },
      { new: true, upsert: true, runValidators: true }
    );

    res.json({
      message: "Alert thresholds updated successfully",
      settings,
    });
  } catch (error) {
    console.error("Error updating thresholds:", error);
    res.status(500).json({ message: "Failed to update alert thresholds" });
  }
};

exports.updateSystemSettings = async (req, res) => {
  try {
    const { greenhouseId } = req.params;
    const userId = req.user.userId;
    const { systemSettings } = req.body;

    const settings = await Settings.findOneAndUpdate(
      { userId, greenhouseId },
      {
        $set: {
          systemSettings,
          updatedAt: new Date(),
        },
      },
      { new: true, upsert: true, runValidators: true }
    );

    res.json({
      message: "System settings updated successfully",
      settings,
    });
  } catch (error) {
    console.error("Error updating system settings:", error);
    res.status(500).json({ message: "Failed to update system settings" });
  }
};

exports.updateDeviceSettings = async (req, res) => {
  try {
    const { greenhouseId } = req.params;
    const userId = req.user.userId;
    const { deviceSettings } = req.body;

    const settings = await Settings.findOneAndUpdate(
      { userId, greenhouseId },
      {
        $set: {
          deviceSettings,
          updatedAt: new Date(),
        },
      },
      { new: true, upsert: true, runValidators: true }
    );

    res.json({
      message: "Device settings updated successfully",
      settings,
    });
  } catch (error) {
    console.error("Error updating device settings:", error);
    res.status(500).json({ message: "Failed to update device settings" });
  }
};

exports.resetSettings = async (req, res) => {
  try {
    const { greenhouseId } = req.params;
    const userId = req.user.userId;

    const defaultSettings = {
      userId,
      greenhouseId,
      alertThresholds: {
        temperature: { high: null, low: null },
        humidity: { high: null, low: null },
        soilMoisture: { low: null },
        lightLevel: { low: null },
      },
      systemSettings: {
        dataRetentionDays: 30,
        updateInterval: 5,
        autoBackup: true,
        maintenanceMode: false,
      },
      deviceSettings: {
        autoControl: false,
        controlSensitivity: "medium",
      },
    };

    const settings = await Settings.findOneAndUpdate(
      { userId, greenhouseId },
      defaultSettings,
      { new: true, upsert: true, runValidators: true }
    );

    res.json({
      message: "Settings reset to defaults",
      settings,
    });
  } catch (error) {
    console.error("Error resetting settings:", error);
    res.status(500).json({ message: "Failed to reset settings" });
  }
};
