const mongoose = require('mongoose');

const alertSchema = new mongoose.Schema({
  greenhouseId: {
    type: String,
    required: true,
    default: 'greenhouse-001'
  },
  alertType: {
    type: String,
    required: true,
    enum: [
      'TEMPERATURE_HIGH', 
      'TEMPERATURE_LOW', 
      'HUMIDITY_HIGH', 
      'HUMIDITY_LOW',
      'SOIL_MOISTURE_LOW',
      'LIGHT_LEVEL_LOW',
      'WATER_LEVEL_LOW',
      'DEVICE_MALFUNCTION',
      'POWER_CONSUMPTION_HIGH',
      'SENSOR_OFFLINE'
    ]
  },
  severity: {
    type: String,
    enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
    default: 'MEDIUM'
  },
  message: {
    type: String,
    required: true
  },
  currentValue: {
    type: Number,
    required: true
  },
  thresholdValue: {
    type: Number,
    required: true
  },
  sensorType: {
    type: String,
    enum: ['DHT11', 'LDR', 'SOIL_MOISTURE', 'ULTRASONIC', 'DEVICE'],
    required: true
  },
  isResolved: {
    type: Boolean,
    default: false
  },
  resolvedAt: {
    type: Date
  },
  resolvedBy: {
    type: String
  },
  autoResolved: {
    type: Boolean,
    default: false
  },
  actionTaken: {
    type: String
  },
  deviceId: {
    type: String
  }
}, {
  timestamps: true
});

// Index for efficient queries
alertSchema.index({ greenhouseId: 1, createdAt: -1 });
alertSchema.index({ isResolved: 1, severity: 1 });

// Virtual for alert age
alertSchema.virtual('alertAge').get(function() {
  return Math.floor((Date.now() - this.createdAt) / (1000 * 60));
});

// Method to resolve alert
alertSchema.methods.resolve = function(resolvedBy, actionTaken) {
  this.isResolved = true;
  this.resolvedAt = new Date();
  this.resolvedBy = resolvedBy;
  this.actionTaken = actionTaken;
  return this.save();
};

// Static method to get active alerts
alertSchema.statics.getActiveAlerts = function(greenhouseId) {
  return this.find({ 
    greenhouseId, 
    isResolved: false 
  }).sort({ severity: 1, createdAt: -1 });
};

// Static method to get recent alerts
alertSchema.statics.getRecentAlerts = function(greenhouseId, hours = 24) {
  const startTime = new Date(Date.now() - hours * 60 * 60 * 1000);
  return this.find({
    greenhouseId,
    createdAt: { $gte: startTime }
  }).sort({ createdAt: -1 });
};

module.exports = mongoose.model('Alert', alertSchema);
