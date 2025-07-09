const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  greenhouseId: {
    type: String,
    required: true
  },
  alertThresholds: {
    temperature: {
      high: {
        type: Number,
        default: null  // No hardcoded values - let user set these
      },
      low: {
        type: Number,
        default: null
      }
    },
    humidity: {
      high: {
        type: Number,
        default: null
      },
      low: {
        type: Number,
        default: null
      }
    },
    soilMoisture: {
      low: {
        type: Number,
        default: null
      }
    },
    lightLevel: {
      low: {
        type: Number,
        default: null
      }
    }
  },
  systemSettings: {
    dataRetentionDays: {
      type: Number,
      default: 30
    },
    updateInterval: {
      type: Number,
      default: 5  // seconds
    },
    autoBackup: {
      type: Boolean,
      default: true
    },
    maintenanceMode: {
      type: Boolean,
      default: false
    }
  },
  deviceSettings: {
    autoControl: {
      type: Boolean,
      default: false
    },
    controlSensitivity: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'medium'
    }
  }
}, {
  timestamps: true
});

// Ensure one settings document per user per greenhouse
settingsSchema.index({ userId: 1, greenhouseId: 1 }, { unique: true });

module.exports = mongoose.model('Settings', settingsSchema);
