const mongoose = require('mongoose');

const sensorDataSchema = new mongoose.Schema({
  greenhouseId: {
    type: String,
    required: true,
    default: 'greenhouse-001'
  },
  sensorType: {
    type: String,
    required: true,
    enum: ['DHT11', 'LDR', 'SOIL_MOISTURE', 'ULTRASONIC']
  },
  // DHT11 sensor data
  temperature: {
    type: Number,
    min: -40,
    max: 80
  },
  humidity: {
    type: Number,
    min: 0,
    max: 100
  },
  // LDR sensor data
  lightIntensity: {
    type: Number,
    min: 0,
    max: 10000  // Increased for raw ADC values
  },
  // Soil moisture sensor data (raw ADC values)
  soilMoisture: {
    type: Number,
    min: 0,
    max: 4095  // ESP32 ADC max value
  },
  // Custom value for other sensors like ultrasonic
  customValue: {
    type: Number
  },
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  },
  location: {
    type: String,
    default: 'Main Greenhouse'
  },
  deviceId: {
    type: String,
    required: true
  }
}, {
  timestamps: true
});

// Index for efficient queries
sensorDataSchema.index({ greenhouseId: 1, timestamp: -1 });
sensorDataSchema.index({ sensorType: 1, timestamp: -1 });

// Virtual for data age in minutes
sensorDataSchema.virtual('dataAge').get(function() {
  return Math.floor((Date.now() - this.timestamp) / (1000 * 60));
});

// Static method to get latest readings
sensorDataSchema.statics.getLatestReadings = function(greenhouseId) {
  return this.aggregate([
    { $match: { greenhouseId } },
    { $sort: { timestamp: -1 } },
    {
      $group: {
        _id: '$sensorType',
        latestData: { $first: '$$ROOT' }
      }
    },
    { $replaceRoot: { newRoot: '$latestData' } }
  ]);
};

// Static method to get historical data
sensorDataSchema.statics.getHistoricalData = function(greenhouseId, hours = 24) {
  const startTime = new Date(Date.now() - hours * 60 * 60 * 1000);
  return this.find({
    greenhouseId,
    timestamp: { $gte: startTime }
  }).sort({ timestamp: 1 });
};

module.exports = mongoose.model('SensorData', sensorDataSchema);
