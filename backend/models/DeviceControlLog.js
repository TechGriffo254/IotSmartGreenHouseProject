const mongoose = require('mongoose');

const deviceControlLogSchema = new mongoose.Schema({
  greenhouseId: {
    type: String,
    required: true,
    default: 'greenhouse-001'
  },
  deviceId: {
    type: String,
    required: true
  },
  deviceName: {
    type: String,
    required: true
  },
  deviceType: {
    type: String,
    required: true
  },
  action: {
    type: String,
    required: true,
    enum: ['turn_on', 'turn_off', 'open', 'close', 'toggle', 'set_intensity', 'set_auto_mode', 'manual_override', 'auto_control']
  },
  previousStatus: {
    type: String,
    required: true
  },
  newStatus: {
    type: String,
    required: true
  },
  intensity: {
    type: Number,
    min: 0,
    max: 100
  },
  controlSource: {
    type: String,
    enum: ['manual', 'automation', 'iot_device', 'schedule'],
    default: 'manual'
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  username: {
    type: String
  },
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  },
  notes: {
    type: String
  }
}, {
  timestamps: true
});

// Indexes for efficient querying
deviceControlLogSchema.index({ greenhouseId: 1, timestamp: -1 });
deviceControlLogSchema.index({ deviceId: 1, timestamp: -1 });
deviceControlLogSchema.index({ userId: 1, timestamp: -1 });

// Static method to log device control
deviceControlLogSchema.statics.logControl = async function(logData) {
  try {
    const log = new this(logData);
    await log.save();
    return log;
  } catch (error) {
    console.error('Error saving device control log:', error);
    throw error;
  }
};

// Static method to get control history
deviceControlLogSchema.statics.getControlHistory = async function(filters = {}, limit = 50) {
  try {
    const query = {};
    
    if (filters.greenhouseId) query.greenhouseId = filters.greenhouseId;
    if (filters.deviceId) query.deviceId = filters.deviceId;
    if (filters.userId) query.userId = filters.userId;
    if (filters.controlSource) query.controlSource = filters.controlSource;
    
    // Date range filter
    if (filters.startDate || filters.endDate) {
      query.timestamp = {};
      if (filters.startDate) query.timestamp.$gte = new Date(filters.startDate);
      if (filters.endDate) query.timestamp.$lte = new Date(filters.endDate);
    }
    
    return await this.find(query)
      .sort({ timestamp: -1 })
      .limit(limit)
      .populate('userId', 'username email')
      .lean();
  } catch (error) {
    console.error('Error fetching control history:', error);
    throw error;
  }
};

module.exports = mongoose.model('DeviceControlLog', deviceControlLogSchema);
