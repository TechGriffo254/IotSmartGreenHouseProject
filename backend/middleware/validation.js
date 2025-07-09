const Joi = require('joi');

// Validation for sensor data
exports.validateSensorData = (req, res, next) => {
  const schema = Joi.object({
    greenhouseId: Joi.string().default('greenhouse-001'),
    sensorType: Joi.string().valid('DHT11', 'LDR', 'SOIL_MOISTURE').required(),
    temperature: Joi.number().min(-40).max(80).when('sensorType', {
      is: 'DHT11',
      then: Joi.required(),
      otherwise: Joi.optional()
    }),
    humidity: Joi.number().min(0).max(100).when('sensorType', {
      is: 'DHT11',
      then: Joi.required(),
      otherwise: Joi.optional()
    }),
    lightIntensity: Joi.number().min(0).max(1024).when('sensorType', {
      is: 'LDR',
      then: Joi.required(),
      otherwise: Joi.optional()
    }),
    soilMoisture: Joi.number().min(0).max(100).when('sensorType', {
      is: 'SOIL_MOISTURE',
      then: Joi.required(),
      otherwise: Joi.optional()
    }),
    deviceId: Joi.string().required(),
    location: Joi.string().default('Main Greenhouse'),
    timestamp: Joi.date().default(Date.now)
  });

  const { error, value } = schema.validate(req.body);
  
  if (error) {
    return res.status(400).json({
      success: false,
      message: 'Validation error',
      details: error.details.map(detail => detail.message)
    });
  }
  
  req.body = value;
  next();
};

// Validation for device control
exports.validateDeviceControl = (req, res, next) => {
  const schema = Joi.object({
    greenhouseId: Joi.string().default('greenhouse-001'),
    deviceType: Joi.string().valid('FAN', 'WATER_PUMP', 'HEATER', 'LED_LIGHT', 'COOLING_SYSTEM').required(),
    deviceName: Joi.string().min(2).max(50).required(),
    deviceId: Joi.string().required(),
    status: Joi.string().valid('ON', 'OFF', 'AUTO').default('OFF'),
    intensity: Joi.number().min(0).max(100).default(0),
    autoMode: Joi.boolean().default(false),
    powerConsumption: Joi.number().min(0).default(0),
    location: Joi.string().default('Main Greenhouse'),
    automationRules: Joi.object({
      temperatureHigh: Joi.number().min(-40).max(80).allow(null),
      temperatureLow: Joi.number().min(-40).max(80).allow(null),
      humidityHigh: Joi.number().min(0).max(100).allow(null),
      humidityLow: Joi.number().min(0).max(100).allow(null),
      soilMoistureLow: Joi.number().min(0).max(100).allow(null),
      lightLevelLow: Joi.number().min(0).max(1024).allow(null)
    }).default({})
  });

  const { error, value } = schema.validate(req.body);
  
  if (error) {
    return res.status(400).json({
      success: false,
      message: 'Validation error',
      details: error.details.map(detail => detail.message)
    });
  }
  
  req.body = value;
  next();
};

// Validation for user registration
exports.validateRegister = (req, res, next) => {
  const schema = Joi.object({
    username: Joi.string().alphanum().min(3).max(30).required(),
    email: Joi.string().email().required(),
    password: Joi.string().min(6).max(128).required(),
    role: Joi.string().valid('admin', 'operator', 'viewer').default('operator')
  });

  const { error, value } = schema.validate(req.body);
  
  if (error) {
    return res.status(400).json({
      success: false,
      message: 'Validation error',
      details: error.details.map(detail => detail.message)
    });
  }
  
  req.body = value;
  next();
};

// Validation for user login
exports.validateLogin = (req, res, next) => {
  const schema = Joi.object({
    username: Joi.string().required(),
    password: Joi.string().required()
  });

  const { error, value } = schema.validate(req.body);
  
  if (error) {
    return res.status(400).json({
      success: false,
      message: 'Validation error',
      details: error.details.map(detail => detail.message)
    });
  }
  
  req.body = value;
  next();
};

// Validation for alert creation
exports.validateAlert = (req, res, next) => {
  const schema = Joi.object({
    alertType: Joi.string().valid(
      'TEMPERATURE_HIGH', 
      'TEMPERATURE_LOW', 
      'HUMIDITY_HIGH', 
      'HUMIDITY_LOW',
      'SOIL_MOISTURE_LOW',
      'LIGHT_LEVEL_LOW',
      'DEVICE_MALFUNCTION',
      'POWER_CONSUMPTION_HIGH',
      'SENSOR_OFFLINE'
    ).required(),
    severity: Joi.string().valid('LOW', 'MEDIUM', 'HIGH', 'CRITICAL').default('MEDIUM'),
    message: Joi.string().min(5).max(500).required(),
    currentValue: Joi.number().required(),
    thresholdValue: Joi.number().required(),
    sensorType: Joi.string().valid('DHT11', 'LDR', 'SOIL_MOISTURE', 'DEVICE').required(),
    deviceId: Joi.string().optional()
  });

  const { error, value } = schema.validate(req.body);
  
  if (error) {
    return res.status(400).json({
      success: false,
      message: 'Validation error',
      details: error.details.map(detail => detail.message)
    });
  }
  
  req.body = value;
  next();
};
