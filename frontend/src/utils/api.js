// API service for making HTTP requests
import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Configure axios defaults
axios.defaults.baseURL = API_BASE_URL;

// Request interceptor to add auth token
axios.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const apiService = {
  // Sensor data
  getLatestSensorData: (greenhouseId) =>
    axios.get(`/sensors/latest/${greenhouseId}`),
  
  getHistoricalSensorData: (greenhouseId, params = {}) =>
    axios.get(`/sensors/historical/${greenhouseId}`, { params }),
  
  getSensorStats: (greenhouseId, params = {}) =>
    axios.get(`/sensors/stats/${greenhouseId}`, { params }),

  // Device control
  getDevices: (greenhouseId) =>
    axios.get(`/devices/${greenhouseId}`),
  
  createDevice: (deviceData) =>
    axios.post('/devices', deviceData),
  
  updateDevice: (deviceId, updates) =>
    axios.put(`/devices/${deviceId}`, updates),
  
  toggleDevice: (deviceId) =>
    axios.post(`/devices/${deviceId}/toggle`),
  
  deleteDevice: (deviceId) =>
    axios.delete(`/devices/${deviceId}`),
  
  getDeviceStats: (greenhouseId) =>
    axios.get(`/devices/stats/${greenhouseId}`),

  // Alerts
  getAlerts: (greenhouseId, params = {}) =>
    axios.get(`/alerts/${greenhouseId}`, { params }),
  
  getActiveAlerts: (greenhouseId) =>
    axios.get(`/alerts/active/${greenhouseId}`),
  
  resolveAlert: (alertId, actionTaken) =>
    axios.put(`/alerts/${alertId}/resolve`, { actionTaken }),
  
  createAlert: (greenhouseId, alertData) =>
    axios.post(`/alerts/${greenhouseId}`, alertData),
  
  getAlertStats: (greenhouseId, params = {}) =>
    axios.get(`/alerts/stats/${greenhouseId}`, { params }),

  // Authentication
  login: (credentials) =>
    axios.post('/auth/login', credentials),
  
  register: (userData) =>
    axios.post('/auth/register', userData),
  
  getProfile: () =>
    axios.get('/auth/me'),
  
  updateProfile: (profileData) =>
    axios.put('/auth/profile', profileData),
  
  changePassword: (passwordData) =>
    axios.post('/auth/change-password', passwordData),

  // Settings
  getSettings: (greenhouseId) =>
    axios.get(`/settings/${greenhouseId}`),
  
  updateThresholds: (greenhouseId, alertThresholds) =>
    axios.put(`/settings/${greenhouseId}/thresholds`, { alertThresholds }),
  
  updateSystemSettings: (greenhouseId, systemSettings) =>
    axios.put(`/settings/${greenhouseId}/system`, { systemSettings }),
  
  updateDeviceSettings: (greenhouseId, deviceSettings) =>
    axios.put(`/settings/${greenhouseId}/devices`, { deviceSettings }),
  
  resetSettings: (greenhouseId) =>
    axios.post(`/settings/${greenhouseId}/reset`),

  // System health
  getSystemHealth: () =>
    axios.get('/health'),
};

export default apiService;
