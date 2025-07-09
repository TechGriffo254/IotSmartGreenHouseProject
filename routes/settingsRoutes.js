const express = require('express');
const Settings = require('../models/Settings');
const { auth } = require('../middleware/auth');
const router = express.Router();

// Get user settings for a greenhouse
router.get('/:greenhouseId', auth, async (req, res) => {
  try {
    const { greenhouseId } = req.params;
    const userId = req.user.userId; // Use userId instead of id

    let settings = await Settings.findOne({ userId, greenhouseId });
    
    // If no settings exist, create default settings with null thresholds
    if (!settings) {
      settings = new Settings({
        userId,
        greenhouseId,
        alertThresholds: {
          temperature: { high: null, low: null },
          humidity: { high: null, low: null },
          soilMoisture: { low: null },
          lightLevel: { low: null }
        }
      });
      await settings.save();
    }

    res.json(settings);
  } catch (error) {
    console.error('Error fetching settings:', error);
    res.status(500).json({ message: 'Failed to fetch settings' });
  }
});

// Update alert thresholds
router.put('/:greenhouseId/thresholds', auth, async (req, res) => {
  try {
    const { greenhouseId } = req.params;
    const userId = req.user.userId; // Use userId instead of id
    const { alertThresholds } = req.body;

    const settings = await Settings.findOneAndUpdate(
      { userId, greenhouseId },
      { 
        $set: { 
          alertThresholds,
          updatedAt: new Date()
        }
      },
      { 
        new: true, 
        upsert: true,
        runValidators: true
      }
    );

    res.json({
      message: 'Alert thresholds updated successfully',
      settings
    });
  } catch (error) {
    console.error('Error updating thresholds:', error);
    res.status(500).json({ message: 'Failed to update alert thresholds' });
  }
});

// Update system settings
router.put('/:greenhouseId/system', auth, async (req, res) => {
  try {
    const { greenhouseId } = req.params;
    const userId = req.user.userId; // Use userId instead of id
    const { systemSettings } = req.body;

    const settings = await Settings.findOneAndUpdate(
      { userId, greenhouseId },
      { 
        $set: { 
          systemSettings,
          updatedAt: new Date()
        }
      },
      { 
        new: true, 
        upsert: true,
        runValidators: true
      }
    );

    res.json({
      message: 'System settings updated successfully',
      settings
    });
  } catch (error) {
    console.error('Error updating system settings:', error);
    res.status(500).json({ message: 'Failed to update system settings' });
  }
});

// Update device settings
router.put('/:greenhouseId/devices', auth, async (req, res) => {
  try {
    const { greenhouseId } = req.params;
    const userId = req.user.userId; // Use userId instead of id
    const { deviceSettings } = req.body;

    const settings = await Settings.findOneAndUpdate(
      { userId, greenhouseId },
      { 
        $set: { 
          deviceSettings,
          updatedAt: new Date()
        }
      },
      { 
        new: true, 
        upsert: true,
        runValidators: true
      }
    );

    res.json({
      message: 'Device settings updated successfully',
      settings
    });
  } catch (error) {
    console.error('Error updating device settings:', error);
    res.status(500).json({ message: 'Failed to update device settings' });
  }
});

// Reset settings to defaults (with null thresholds)
router.post('/:greenhouseId/reset', auth, async (req, res) => {
  try {
    const { greenhouseId } = req.params;
    const userId = req.user.userId; // Use userId instead of id

    const defaultSettings = {
      userId,
      greenhouseId,
      alertThresholds: {
        temperature: { high: null, low: null },
        humidity: { high: null, low: null },
        soilMoisture: { low: null },
        lightLevel: { low: null }
      },
      systemSettings: {
        dataRetentionDays: 30,
        updateInterval: 5,
        autoBackup: true,
        maintenanceMode: false
      },
      deviceSettings: {
        autoControl: false,
        controlSensitivity: 'medium'
      }
    };

    const settings = await Settings.findOneAndUpdate(
      { userId, greenhouseId },
      defaultSettings,
      { 
        new: true, 
        upsert: true,
        runValidators: true
      }
    );

    res.json({
      message: 'Settings reset to defaults',
      settings
    });
  } catch (error) {
    console.error('Error resetting settings:', error);
    res.status(500).json({ message: 'Failed to reset settings' });
  }
});

module.exports = router;
