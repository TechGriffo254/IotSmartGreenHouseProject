// Utility functions for sensor data processing and validation

export const sensorUtils = {
  // Validate sensor reading ranges
  validateSensorData: (sensorType, data) => {
    const validations = {
      DHT11: {
        temperature: { min: -40, max: 80, unit: '°C' },
        humidity: { min: 0, max: 100, unit: '%' }
      },
      LDR: {
        lightIntensity: { min: 0, max: 1024, unit: 'lux' }
      },
      SOIL_MOISTURE: {
        soilMoisture: { min: 0, max: 100, unit: '%' }
      }
    };

    const sensorValidation = validations[sensorType];
    if (!sensorValidation) return { valid: false, errors: ['Unknown sensor type'] };

    const errors = [];
    Object.keys(sensorValidation).forEach(field => {
      if (data[field] !== undefined) {
        const value = data[field];
        const { min, max } = sensorValidation[field];
        
        if (value < min || value > max) {
          errors.push(`${field} value ${value} is outside valid range (${min}-${max})`);
        }
      }
    });

    return { valid: errors.length === 0, errors };
  },

  // Check if sensor data is within optimal ranges
  isOptimalRange: (sensorType, field, value) => {
    const optimalRanges = {
      temperature: { min: 18, max: 25 },
      humidity: { min: 50, max: 70 },
      soilMoisture: { min: 40, max: 80 },
      lightIntensity: { min: 200, max: 800 }
    };

    const range = optimalRanges[field];
    if (!range) return null;

    return value >= range.min && value <= range.max;
  },

  // Get status based on sensor value
  getSensorStatus: (sensorType, field, value, lastUpdate) => {
    // Check if data is recent (within 5 minutes)
    const dataAge = lastUpdate ? Math.floor((Date.now() - new Date(lastUpdate)) / (1000 * 60)) : Infinity;
    
    if (dataAge > 5) return 'offline';
    if (dataAge > 2) return 'warning';

    // Check if value is in optimal range
    const isOptimal = sensorUtils.isOptimalRange(sensorType, field, value);
    if (isOptimal === null) return 'online';
    
    return isOptimal ? 'online' : 'warning';
  },

  // Format sensor value for display
  formatSensorValue: (value, unit, precision = 1) => {
    if (value === null || value === undefined) return '---';
    
    const numValue = parseFloat(value);
    if (isNaN(numValue)) return '---';
    
    return `${numValue.toFixed(precision)}${unit ? ` ${unit}` : ''}`;
  },

  // Calculate trend from historical data
  calculateTrend: (historicalData, field, timeWindow = 30) => {
    if (!historicalData || historicalData.length < 2) return 'stable';
    
    const now = Date.now();
    const windowStart = now - (timeWindow * 60 * 1000); // timeWindow in minutes
    
    const recentData = historicalData
      .filter(item => new Date(item.timestamp) >= windowStart && item[field] !== undefined)
      .map(item => ({ time: new Date(item.timestamp), value: item[field] }))
      .sort((a, b) => a.time - b.time);
    
    if (recentData.length < 2) return 'stable';
    
    const firstValue = recentData[0].value;
    const lastValue = recentData[recentData.length - 1].value;
    const change = lastValue - firstValue;
    const changePercent = Math.abs(change / firstValue) * 100;
    
    // Consider significant if change is more than 5%
    if (changePercent < 5) return 'stable';
    
    return change > 0 ? 'up' : 'down';
  },

  // Get alert level based on sensor value
  getAlertLevel: (sensorType, field, value) => {
    const thresholds = {
      temperature: {
        critical: { high: 40, low: 10 },
        high: { high: 35, low: 15 },
        medium: { high: 30, low: 18 }
      },
      humidity: {
        critical: { high: 95, low: 20 },
        high: { high: 85, low: 30 },
        medium: { high: 80, low: 40 }
      },
      soilMoisture: {
        critical: { low: 15 },
        high: { low: 25 },
        medium: { low: 35 }
      },
      lightIntensity: {
        medium: { low: 100 },
        low: { low: 200 }
      }
    };

    const fieldThresholds = thresholds[field];
    if (!fieldThresholds) return null;

    // Check critical thresholds
    if (fieldThresholds.critical) {
      if (fieldThresholds.critical.high && value > fieldThresholds.critical.high) return 'critical';
      if (fieldThresholds.critical.low && value < fieldThresholds.critical.low) return 'critical';
    }

    // Check high thresholds
    if (fieldThresholds.high) {
      if (fieldThresholds.high.high && value > fieldThresholds.high.high) return 'high';
      if (fieldThresholds.high.low && value < fieldThresholds.high.low) return 'high';
    }

    // Check medium thresholds
    if (fieldThresholds.medium) {
      if (fieldThresholds.medium.high && value > fieldThresholds.medium.high) return 'medium';
      if (fieldThresholds.medium.low && value < fieldThresholds.medium.low) return 'medium';
    }

    return null; // No alert needed
  }
};

export const deviceUtils = {
  // Get device icon based on type
  getDeviceIcon: (deviceType) => {
    const icons = {
      FAN: '🌪️',
      WATER_PUMP: '💧',
      LED_LIGHT: '💡',
      HEATER: '🔥',
      COOLING_SYSTEM: '❄️'
    };
    return icons[deviceType] || '⚡';
  },

  // Get device status color
  getStatusColor: (status) => {
    const colors = {
      ON: 'bg-green-500',
      OFF: 'bg-gray-400',
      AUTO: 'bg-blue-500',
      ERROR: 'bg-red-500'
    };
    return colors[status] || 'bg-gray-400';
  },

  // Check if device should be automated based on sensor data
  shouldAutomate: (device, sensorData) => {
    if (!device.autoMode || !device.automationRules) return null;

    const rules = device.automationRules;
    const recommendations = [];

    // Temperature-based automation
    if (sensorData.temperature !== undefined) {
      if (rules.temperatureHigh && sensorData.temperature > rules.temperatureHigh) {
        if (device.deviceType === 'FAN' || device.deviceType === 'COOLING_SYSTEM') {
          recommendations.push({ action: 'ON', reason: 'High temperature detected' });
        }
      }
      if (rules.temperatureLow && sensorData.temperature < rules.temperatureLow) {
        if (device.deviceType === 'HEATER') {
          recommendations.push({ action: 'ON', reason: 'Low temperature detected' });
        }
      }
    }

    // Humidity-based automation
    if (sensorData.humidity !== undefined) {
      if (rules.humidityHigh && sensorData.humidity > rules.humidityHigh) {
        if (device.deviceType === 'FAN') {
          recommendations.push({ action: 'ON', reason: 'High humidity detected' });
        }
      }
    }

    // Soil moisture-based automation
    if (sensorData.soilMoisture !== undefined) {
      if (rules.soilMoistureLow && sensorData.soilMoisture < rules.soilMoistureLow) {
        if (device.deviceType === 'WATER_PUMP') {
          recommendations.push({ action: 'ON', reason: 'Low soil moisture detected' });
        }
      }
    }

    // Light level-based automation
    if (sensorData.lightIntensity !== undefined) {
      if (rules.lightLevelLow && sensorData.lightIntensity < rules.lightLevelLow) {
        if (device.deviceType === 'LED_LIGHT') {
          recommendations.push({ action: 'ON', reason: 'Low light level detected' });
        }
      }
    }

    return recommendations.length > 0 ? recommendations[0] : null;
  }
};

export const dataUtils = {
  // Format timestamp for display
  formatTimestamp: (timestamp, format = 'short') => {
    const date = new Date(timestamp);
    
    if (format === 'short') {
      return date.toLocaleTimeString();
    } else if (format === 'long') {
      return date.toLocaleString();
    } else if (format === 'date') {
      return date.toLocaleDateString();
    }
    
    return date.toISOString();
  },

  // Group sensor data by time intervals
  groupByTimeInterval: (data, intervalMinutes = 60) => {
    const grouped = {};
    
    data.forEach(item => {
      const timestamp = new Date(item.timestamp);
      const intervalStart = new Date(
        timestamp.getFullYear(),
        timestamp.getMonth(),
        timestamp.getDate(),
        Math.floor(timestamp.getHours() * 60 / intervalMinutes) * intervalMinutes / 60,
        Math.floor(timestamp.getMinutes() / intervalMinutes) * intervalMinutes
      );
      
      const key = intervalStart.toISOString();
      
      if (!grouped[key]) {
        grouped[key] = {
          timestamp: intervalStart,
          values: [],
          count: 0
        };
      }
      
      grouped[key].values.push(item);
      grouped[key].count++;
    });
    
    // Calculate averages for each interval
    Object.keys(grouped).forEach(key => {
      const group = grouped[key];
      const values = group.values;
      
      if (values.length > 0) {
        group.temperature = values.reduce((sum, v) => sum + (v.temperature || 0), 0) / values.filter(v => v.temperature !== undefined).length;
        group.humidity = values.reduce((sum, v) => sum + (v.humidity || 0), 0) / values.filter(v => v.humidity !== undefined).length;
        group.lightIntensity = values.reduce((sum, v) => sum + (v.lightIntensity || 0), 0) / values.filter(v => v.lightIntensity !== undefined).length;
        group.soilMoisture = values.reduce((sum, v) => sum + (v.soilMoisture || 0), 0) / values.filter(v => v.soilMoisture !== undefined).length;
      }
    });
    
    return Object.values(grouped).sort((a, b) => a.timestamp - b.timestamp);
  },

  // Calculate statistics for sensor data
  calculateStats: (data, field) => {
    const values = data.map(item => item[field]).filter(val => val !== undefined && val !== null);
    
    if (values.length === 0) {
      return { min: 0, max: 0, avg: 0, count: 0 };
    }
    
    const min = Math.min(...values);
    const max = Math.max(...values);
    const avg = values.reduce((sum, val) => sum + val, 0) / values.length;
    
    return { min, max, avg, count: values.length };
  }
};

export default { sensorUtils, deviceUtils, dataUtils };
