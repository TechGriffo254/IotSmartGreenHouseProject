import api from './api';

export const sensorService = {
  // Get all sensor data
  getAllSensorData: async (params = {}) => {
    const response = await api.get('/api/sensors', { params });
    return response.data;
  },

  // Get sensor data by device ID
  getSensorDataByDevice: async (deviceId, params = {}) => {
    const response = await api.get(`/api/sensors/device/${deviceId}`, { params });
    return response.data;
  },

  // Get latest sensor readings
  getLatestReadings: async () => {
    const response = await api.get('/api/sensors/latest');
    return response.data;
  },

  // Get sensor statistics
  getSensorStats: async (timeframe = '24h') => {
    const response = await api.get(`/api/sensors/stats?timeframe=${timeframe}`);
    return response.data;
  },

  // Send sensor data (for testing)
  sendSensorData: async (data) => {
    const response = await api.post('/api/sensors', data);
    return response.data;
  }
};

export const deviceService = {
  // Get all devices
  getAllDevices: async () => {
    const response = await api.get('/api/devices');
    return response.data;
  },

  // Get device by ID
  getDeviceById: async (deviceId) => {
    const response = await api.get(`/api/devices/${deviceId}`);
    return response.data;
  },

  // Create new device
  createDevice: async (deviceData) => {
    const response = await api.post('/api/devices', deviceData);
    return response.data;
  },

  // Update device
  updateDevice: async (deviceId, deviceData) => {
    const response = await api.put(`/api/devices/${deviceId}`, deviceData);
    return response.data;
  },

  // Delete device
  deleteDevice: async (deviceId) => {
    const response = await api.delete(`/api/devices/${deviceId}`);
    return response.data;
  },

  // Control device (turn on/off)
  controlDevice: async (deviceId, status, mode = 'manual') => {
    const response = await api.post(`/api/devices/${deviceId}/control`, {
      status,
      mode
    });
    return response.data;
  },

  // Update device automation settings
  updateAutomation: async (deviceId, automationData) => {
    const response = await api.post(`/api/devices/${deviceId}/automation`, automationData);
    return response.data;
  },

  // Get device control history
  getDeviceHistory: async (deviceId, params = {}) => {
    const response = await api.get(`/api/devices/${deviceId}/history`, { params });
    return response.data;
  }
};

export const alertService = {
  // Get all alerts
  getAllAlerts: async (params = {}) => {
    const response = await api.get('/api/alerts', { params });
    return response.data;
  },

  // Get active alerts
  getActiveAlerts: async () => {
    const response = await api.get('/api/alerts/active');
    return response.data;
  },

  // Acknowledge alert
  acknowledgeAlert: async (alertId) => {
    const response = await api.post(`/api/alerts/${alertId}/acknowledge`);
    return response.data;
  },

  // Dismiss alert
  dismissAlert: async (alertId) => {
    const response = await api.post(`/api/alerts/${alertId}/dismiss`);
    return response.data;
  },

  // Get alert statistics
  getAlertStats: async (timeframe = '7d') => {
    const response = await api.get(`/api/alerts/stats?timeframe=${timeframe}`);
    return response.data;
  }
};

export const authService = {
  // Login
  login: async (credentials) => {
    const response = await api.post('/api/auth/login', credentials);
    return response.data;
  },

  // Register
  register: async (userData) => {
    const response = await api.post('/api/auth/register', userData);
    return response.data;
  },

  // Get user profile
  getProfile: async () => {
    const response = await api.get('/api/auth/profile');
    return response.data;
  },

  // Update user profile
  updateProfile: async (userData) => {
    const response = await api.put('/api/auth/profile', userData);
    return response.data;
  },

  // Change password
  changePassword: async (passwordData) => {
    const response = await api.post('/api/auth/change-password', passwordData);
    return response.data;
  },

  // Logout
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }
};

export const analyticsService = {
  // Get dashboard analytics
  getDashboardAnalytics: async (timeframe = '24h') => {
    const response = await api.get(`/api/analytics/dashboard?timeframe=${timeframe}`);
    return response.data;
  },

  // Get sensor trends
  getSensorTrends: async (sensorType, timeframe = '7d') => {
    const response = await api.get(`/api/analytics/trends/${sensorType}?timeframe=${timeframe}`);
    return response.data;
  },

  // Get device usage statistics
  getDeviceUsage: async (timeframe = '7d') => {
    const response = await api.get(`/api/analytics/device-usage?timeframe=${timeframe}`);
    return response.data;
  },

  // Get environment report
  getEnvironmentReport: async (timeframe = '30d') => {
    const response = await api.get(`/api/analytics/environment-report?timeframe=${timeframe}`);
    return response.data;
  }
};
