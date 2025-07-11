const mongoose = require('mongoose');

const deviceControlSchema = new mongoose.Schema({
  greenhouseId: {
    type: String,
    required: true,
    default: 'greenhouse-001'
  },
  deviceType: {
    type: String,
    required: true,
    enum: ['FAN', 'WATER_PUMP', 'WATER_VALVE', 'HEATER', 'LED_LIGHT', 'COOLING_SYSTEM', 'irrigation', 'ventilation', 'SERVO', 'WINDOW']
  },
  deviceName: {
    type: String,
    required: true
  },
  deviceId: {
    type: String,
    required: true,
    unique: true
  },
  status: {
    type: String,
    enum: ['ON', 'OFF', 'AUTO', 'OPEN', 'CLOSED'],
    default: 'OFF'
  },
  intensity: {
    type: Number,
    min: 0,
    max: 100,
    default: 0
  },
  autoMode: {
    type: Boolean,
    default: false
  },
  lastActivated: {
    type: Date,
    default: Date.now
  },
  powerConsumption: {
    type: Number,
    default: 0 // in watts
  },
  location: {
    type: String,
    default: 'Main Greenhouse'
  },
  // Automation rules
  automationRules: {
    temperatureHigh: {
      type: Number,
      default: null
    },
    temperatureLow: {
      type: Number,
      default: null
    },
    humidityHigh: {
      type: Number,
      default: null
    },
    humidityLow: {
      type: Number,
      default: null
    },
    soilMoistureLow: {
      type: Number,
      default: null
    },
    lightLevelLow: {
      type: Number,
      default: null
    }
  }
}, {
  timestamps: true
});

// Index for efficient queries
deviceControlSchema.index({ greenhouseId: 1, deviceType: 1 });

// Virtual for device runtime
deviceControlSchema.virtual('isActive').get(function() {
  return this.status === 'ON';
});

// Method to toggle device
deviceControlSchema.methods.toggle = function() {
  this.status = this.status === 'ON' ? 'OFF' : 'ON';
  if (this.status === 'ON') {
    this.lastActivated = new Date();
  }
  return this.save();
};

// Static method to get all devices by greenhouse
deviceControlSchema.statics.getDevicesByGreenhouse = function(greenhouseId) {
  return this.find({ greenhouseId }).sort({ deviceType: 1, deviceName: 1 });
};

module.exports = mongoose.model('DeviceControl', deviceControlSchema);
