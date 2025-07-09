// Sensor thresholds and configuration
export const SENSOR_THRESHOLDS = {
  temperature: {
    optimal: { min: 18, max: 28 },
    warning: { min: 15, max: 32 },
    critical: { min: 10, max: 40 }
  },
  humidity: {
    optimal: { min: 50, max: 70 },
    warning: { min: 40, max: 80 },
    critical: { min: 30, max: 90 }
  },
  soilMoisture: {
    optimal: { min: 40, max: 70 },
    warning: { min: 30, max: 80 },
    critical: { min: 20, max: 90 }
  },
  light: {
    optimal: { min: 200, max: 800 },
    warning: { min: 100, max: 1000 },
    critical: { min: 50, max: 1200 }
  },
  ph: {
    optimal: { min: 6.0, max: 7.5 },
    warning: { min: 5.5, max: 8.0 },
    critical: { min: 5.0, max: 8.5 }
  },
  co2: {
    optimal: { min: 400, max: 600 },
    warning: { min: 350, max: 800 },
    critical: { min: 300, max: 1000 }
  }
};

// Device types and configurations
export const DEVICE_TYPES = {
  FAN: {
    label: 'Ventilation Fan',
    icon: '🌀',
    description: 'Controls air circulation and temperature',
    powerRating: '25W',
    category: 'cooling'
  },
  WATER_PUMP: {
    label: 'Water Pump',
    icon: '💧',
    description: 'Manages irrigation and soil moisture',
    powerRating: '50W',
    category: 'irrigation'
  },
  LED_LIGHT: {
    label: 'LED Grow Light',
    icon: '💡',
    description: 'Provides supplemental lighting',
    powerRating: '30W',
    category: 'lighting'
  },
  HEATER: {
    label: 'Space Heater',
    icon: '🔥',
    description: 'Maintains optimal temperature',
    powerRating: '100W',
    category: 'heating'
  },
  COOLING_SYSTEM: {
    label: 'Cooling System',
    icon: '❄️',
    description: 'Advanced temperature control',
    powerRating: '150W',
    category: 'cooling'
  }
};

// Alert severity levels
export const ALERT_SEVERITY = {
  LOW: {
    label: 'Low',
    color: 'text-yellow-600 bg-yellow-100',
    priority: 1
  },
  MEDIUM: {
    label: 'Medium',
    color: 'text-orange-600 bg-orange-100',
    priority: 2
  },
  HIGH: {
    label: 'High',
    color: 'text-red-600 bg-red-100',
    priority: 3
  },
  CRITICAL: {
    label: 'Critical',
    color: 'text-red-800 bg-red-200',
    priority: 4
  }
};

// Alert types
export const ALERT_TYPES = {
  TEMPERATURE_HIGH: {
    label: 'High Temperature',
    icon: '🌡️',
    description: 'Temperature above optimal range'
  },
  TEMPERATURE_LOW: {
    label: 'Low Temperature',
    icon: '🥶',
    description: 'Temperature below optimal range'
  },
  HUMIDITY_HIGH: {
    label: 'High Humidity',
    icon: '💨',
    description: 'Humidity above optimal range'
  },
  HUMIDITY_LOW: {
    label: 'Low Humidity',
    icon: '🏜️',
    description: 'Humidity below optimal range'
  },
  SOIL_MOISTURE_LOW: {
    label: 'Low Soil Moisture',
    icon: '🌱',
    description: 'Soil moisture below optimal range'
  },
  LIGHT_LOW: {
    label: 'Insufficient Light',
    icon: '☀️',
    description: 'Light level below optimal range'
  },
  DEVICE_OFFLINE: {
    label: 'Device Offline',
    icon: '🔌',
    description: 'Device not responding'
  },
  SYSTEM_ERROR: {
    label: 'System Error',
    icon: '⚠️',
    description: 'System malfunction detected'
  }
};

// Chart colors for different data series
export const CHART_COLORS = {
  temperature: '#EF4444', // Red
  humidity: '#3B82F6',    // Blue
  soilMoisture: '#10B981', // Green
  light: '#F59E0B',       // Yellow
  ph: '#8B5CF6',          // Purple
  co2: '#6B7280'          // Gray
};

// Time intervals for data aggregation
export const TIME_INTERVALS = {
  '1h': {
    label: 'Last Hour',
    minutes: 60,
    groupBy: 'minute'
  },
  '6h': {
    label: 'Last 6 Hours',
    minutes: 360,
    groupBy: 'hour'
  },
  '24h': {
    label: 'Last 24 Hours',
    minutes: 1440,
    groupBy: 'hour'
  },
  '7d': {
    label: 'Last 7 Days',
    minutes: 10080,
    groupBy: 'day'
  },
  '30d': {
    label: 'Last 30 Days',
    minutes: 43200,
    groupBy: 'day'
  }
};

// Default dashboard settings
export const DEFAULT_SETTINGS = {
  theme: 'light',
  notifications: {
    push: true,
    email: false,
    sms: false
  },
  dashboard: {
    refreshInterval: 30000, // 30 seconds
    showQuickStats: true,
    showCharts: true,
    defaultTimeRange: '24h'
  },
  sensors: {
    temperatureUnit: 'celsius',
    showRawValues: false,
    alertsEnabled: true
  },
  devices: {
    autoMode: false,
    confirmActions: true,
    showPowerConsumption: true
  }
};

// API endpoints
export const API_ENDPOINTS = {
  SENSORS: '/api/sensors',
  DEVICES: '/api/devices',
  ALERTS: '/api/alerts',
  AUTH: '/api/auth',
  ANALYTICS: '/api/analytics'
};

// WebSocket events
export const WS_EVENTS = {
  SENSOR_DATA: 'sensor_data',
  DEVICE_STATUS: 'device_status',
  ALERT_CREATED: 'alert_created',
  ALERT_UPDATED: 'alert_updated',
  CONNECTION_STATUS: 'connection_status'
};

// Automation rules
export const AUTOMATION_RULES = {
  TEMPERATURE_CONTROL: {
    conditions: [
      { sensor: 'temperature', operator: '>', action: 'activate_fan' },
      { sensor: 'temperature', operator: '<', action: 'activate_heater' }
    ]
  },
  HUMIDITY_CONTROL: {
    conditions: [
      { sensor: 'humidity', operator: '>', action: 'activate_fan' },
      { sensor: 'humidity', operator: '<', action: 'activate_humidifier' }
    ]
  },
  IRRIGATION_CONTROL: {
    conditions: [
      { sensor: 'soilMoisture', operator: '<', action: 'activate_pump' }
    ]
  },
  LIGHTING_CONTROL: {
    conditions: [
      { sensor: 'light', operator: '<', action: 'activate_led' }
    ]
  }
};

// Greenhouse zones/locations
export const GREENHOUSE_ZONES = [
  'Main Greenhouse',
  'Nursery Area',
  'Propagation Section',
  'Storage Area',
  'External Sensors'
];

// User roles and permissions
export const USER_ROLES = {
  ADMIN: {
    label: 'Administrator',
    permissions: ['read', 'write', 'delete', 'manage_users', 'system_config']
  },
  MANAGER: {
    label: 'Manager',
    permissions: ['read', 'write', 'device_control']
  },
  OPERATOR: {
    label: 'Operator',
    permissions: ['read', 'device_control']
  },
  VIEWER: {
    label: 'Viewer',
    permissions: ['read']
  }
};

// Export all constants as default
export default {
  SENSOR_THRESHOLDS,
  DEVICE_TYPES,
  ALERT_SEVERITY,
  ALERT_TYPES,
  CHART_COLORS,
  TIME_INTERVALS,
  DEFAULT_SETTINGS,
  API_ENDPOINTS,
  WS_EVENTS,
  AUTOMATION_RULES,
  GREENHOUSE_ZONES,
  USER_ROLES
};
