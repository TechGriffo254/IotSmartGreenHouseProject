// Date and time utilities
export const formatDate = (date) => {
  if (!date) return '';
  const d = new Date(date);
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

export const formatTime = (date) => {
  if (!date) return '';
  const d = new Date(date);
  return d.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit'
  });
};

export const formatDateTime = (date) => {
  if (!date) return '';
  const d = new Date(date);
  return d.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

export const getRelativeTime = (date) => {
  if (!date) return '';
  const now = new Date();
  const past = new Date(date);
  const diffMs = now - past;
  
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  
  if (diffMinutes < 1) return 'Just now';
  if (diffMinutes < 60) return `${diffMinutes} minute${diffMinutes > 1 ? 's' : ''} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  
  return formatDate(date);
};

// Number formatting utilities
export const formatNumber = (num, decimals = 1) => {
  if (num === null || num === undefined) return 'N/A';
  return Number(num).toFixed(decimals);
};

export const formatPercentage = (num, decimals = 1) => {
  if (num === null || num === undefined) return 'N/A';
  return `${Number(num).toFixed(decimals)}%`;
};

export const formatTemperature = (temp, unit = 'C') => {
  if (temp === null || temp === undefined) return 'N/A';
  return `${Number(temp).toFixed(1)}°${unit}`;
};

// Sensor value utilities
export const getSensorStatus = (value, thresholds) => {
  if (!thresholds) return 'normal';
  
  if (value < thresholds.low) return 'low';
  if (value > thresholds.high) return 'high';
  return 'normal';
};

export const getSensorColor = (status) => {
  const colors = {
    low: 'text-blue-600',
    normal: 'text-green-600',
    high: 'text-red-600',
    critical: 'text-red-800'
  };
  return colors[status] || 'text-gray-600';
};

export const getSensorBgColor = (status) => {
  const colors = {
    low: 'bg-blue-100',
    normal: 'bg-green-100',
    high: 'bg-red-100',
    critical: 'bg-red-200'
  };
  return colors[status] || 'bg-gray-100';
};

// Device utilities
export const getDeviceIcon = (deviceType) => {
  const icons = {
    FAN: '🌀',
    WATER_PUMP: '💧',
    LED_LIGHT: '💡',
    HEATER: '🔥',
    COOLING_SYSTEM: '❄️'
  };
  return icons[deviceType] || '⚙️';
};

export const getDeviceStatusColor = (status) => {
  return status ? 'text-green-600' : 'text-gray-400';
};

export const getDeviceStatusText = (status) => {
  return status ? 'ON' : 'OFF';
};

// Alert utilities
export const getAlertSeverityColor = (severity) => {
  const colors = {
    low: 'text-yellow-600 bg-yellow-100',
    medium: 'text-orange-600 bg-orange-100',
    high: 'text-red-600 bg-red-100',
    critical: 'text-red-800 bg-red-200'
  };
  return colors[severity] || 'text-gray-600 bg-gray-100';
};

export const getAlertIcon = (type) => {
  const icons = {
    temperature: '🌡️',
    humidity: '💨',
    soil_moisture: '🌱',
    light: '☀️',
    device: '⚙️',
    system: '🖥️'
  };
  return icons[type] || '⚠️';
};

// Data processing utilities
export const groupDataByTimeInterval = (data, interval = 'hour') => {
  if (!data || !Array.isArray(data)) return [];
  
  const groupedData = {};
  
  data.forEach(item => {
    const date = new Date(item.timestamp);
    let key;
    
    switch (interval) {
      case 'minute':
        key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
        break;
      case 'hour':
        key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:00`;
        break;
      case 'day':
        key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
        break;
      default:
        key = date.toISOString();
    }
    
    if (!groupedData[key]) {
      groupedData[key] = [];
    }
    groupedData[key].push(item);
  });
  
  return Object.keys(groupedData).map(key => ({
    timestamp: key,
    data: groupedData[key]
  }));
};

export const calculateAverage = (data, field) => {
  if (!data || !Array.isArray(data) || data.length === 0) return 0;
  
  const values = data.map(item => {
    if (field.includes('.')) {
      const fields = field.split('.');
      let value = item;
      for (const f of fields) {
        value = value?.[f];
      }
      return value;
    }
    return item[field];
  }).filter(val => val !== null && val !== undefined && !isNaN(val));
  
  if (values.length === 0) return 0;
  
  return values.reduce((sum, val) => sum + Number(val), 0) / values.length;
};

export const findMinMax = (data, field) => {
  if (!data || !Array.isArray(data) || data.length === 0) {
    return { min: 0, max: 0 };
  }
  
  const values = data.map(item => {
    if (field.includes('.')) {
      const fields = field.split('.');
      let value = item;
      for (const f of fields) {
        value = value?.[f];
      }
      return value;
    }
    return item[field];
  }).filter(val => val !== null && val !== undefined && !isNaN(val))
    .map(val => Number(val));
  
  if (values.length === 0) return { min: 0, max: 0 };
  
  return {
    min: Math.min(...values),
    max: Math.max(...values)
  };
};

// Validation utilities
export const validateSensorValue = (value, type) => {
  if (value === null || value === undefined || isNaN(value)) {
    return { isValid: false, error: 'Invalid sensor value' };
  }
  
  const ranges = {
    temperature: { min: -50, max: 100 },
    humidity: { min: 0, max: 100 },
    light: { min: 0, max: 100000 },
    soilMoisture: { min: 0, max: 100 },
    ph: { min: 0, max: 14 },
    co2: { min: 0, max: 5000 }
  };
  
  const range = ranges[type];
  if (!range) {
    return { isValid: true };
  }
  
  if (value < range.min || value > range.max) {
    return {
      isValid: false,
      error: `${type} value must be between ${range.min} and ${range.max}`
    };
  }
  
  return { isValid: true };
};

// Local storage utilities
export const saveToLocalStorage = (key, data) => {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    console.error('Error saving to localStorage:', error);
  }
};

export const loadFromLocalStorage = (key, defaultValue = null) => {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (error) {
    console.error('Error loading from localStorage:', error);
    return defaultValue;
  }
};

export const removeFromLocalStorage = (key) => {
  try {
    localStorage.removeItem(key);
  } catch (error) {
    console.error('Error removing from localStorage:', error);
  }
};

// Chart data utilities
export const prepareChartData = (rawData, xField, yField, timeFormat = 'time') => {
  if (!rawData || !Array.isArray(rawData)) return [];
  
  return rawData.map(item => {
    let xValue = item[xField];
    
    if (timeFormat !== 'raw' && xValue) {
      const date = new Date(xValue);
      switch (timeFormat) {
        case 'time':
          xValue = formatTime(date);
          break;
        case 'date':
          xValue = formatDate(date);
          break;
        case 'datetime':
          xValue = formatDateTime(date);
          break;
        default:
          xValue = date.toISOString();
      }
    }
    
    let yValue = item[yField];
    if (yField.includes('.')) {
      const fields = yField.split('.');
      yValue = item;
      for (const field of fields) {
        yValue = yValue?.[field];
      }
    }
    
    return {
      x: xValue,
      y: Number(yValue) || 0,
      ...item
    };
  });
};
