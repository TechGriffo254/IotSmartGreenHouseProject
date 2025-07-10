# API Documentation

## Base URLs
- **Development**: `http://localhost:5000/api`
- **Production**: `https://open-lauryn-ina-9662925b.koyeb.app/api`

## Authentication

All protected endpoints require a JWT token in the Authorization header:
```
Authorization: Bearer <your_jwt_token>
```

## Response Format

### Success Response
```json
{
  "success": true,
  "data": {
    // Response data
  },
  "message": "Operation successful",
  "timestamp": "2024-12-07T10:30:00Z"
}
```

### Error Response
```json
{
  "success": false,
  "message": "Error description",
  "error": "Detailed error information",
  "timestamp": "2024-12-07T10:30:00Z"
}
```

## Authentication Endpoints

### Register User
```http
POST /api/auth/register
Content-Type: application/json

{
  "username": "john_doe",
  "email": "john@example.com",
  "password": "securepassword123",
  "firstName": "John",
  "lastName": "Doe",
  "role": "operator"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "64a1b2c3d4e5f6789abcdef0",
      "username": "john_doe",
      "email": "john@example.com",
      "role": "operator"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "securepassword123"
}
```

### Get Profile
```http
GET /api/auth/profile
Authorization: Bearer <token>
```

### Update Profile
```http
PUT /api/auth/profile
Authorization: Bearer <token>
Content-Type: application/json

{
  "firstName": "John",
  "lastName": "Doe Updated",
  "email": "john.updated@example.com"
}
```

## Sensor Data Endpoints

### Get All Sensor Data
```http
GET /api/sensors?page=1&limit=50&deviceId=greenhouse_001&startDate=2024-01-01&endDate=2024-12-31
Authorization: Bearer <token>
```

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 50, max: 100)
- `deviceId` (optional): Filter by specific device
- `startDate` (optional): Start date (ISO format)
- `endDate` (optional): End date (ISO format)
- `sensorType` (optional): Filter by sensor type (temperature, humidity, soilMoisture, lightLevel)

### Get Latest Sensor Reading
```http
GET /api/sensors/:deviceId/latest
Authorization: Bearer <token>
```

### Submit Sensor Data (IoT Devices)
```http
POST /api/sensors
Content-Type: application/json

{
  "deviceId": "greenhouse_001",
  "location": "greenhouse_a",
  "sensorData": {
    "temperature": 25.5,
    "humidity": 65.2,
    "soilMoisture": 45.8,
    "lightLevel": 750,
    "phLevel": 6.8,
    "ecLevel": 1200
  },
  "timestamp": "2024-12-07T10:30:00Z"
}
```

### Get Analytics Data
```http
GET /api/sensors/analytics/:period?deviceId=greenhouse_001&metric=temperature
Authorization: Bearer <token>
```

**Path Parameters:**
- `period`: `hour`, `day`, `week`, `month`, `year`

**Query Parameters:**
- `deviceId`: Specific device ID
- `metric`: Specific sensor metric

## Device Control Endpoints

### Get All Devices
```http
GET /api/devices
Authorization: Bearer <token>
```

### Get Specific Device
```http
GET /api/devices/:deviceId
Authorization: Bearer <token>
```

### Register New Device
```http
POST /api/devices
Authorization: Bearer <token>
Content-Type: application/json

{
  "deviceId": "fan_001",
  "name": "Exhaust Fan 1",
  "type": "fan",
  "location": "greenhouse_a",
  "capabilities": ["on", "off", "auto"],
  "maxPower": 100,
  "energyRating": "A+"
}
```

### Control Device
```http
POST /api/devices/:deviceId/control
Authorization: Bearer <token>
Content-Type: application/json

{
  "action": "on",
  "duration": 300,
  "power": 75,
  "reason": "High temperature detected",
  "scheduled": false
}
```

**Actions:**
- `on`: Turn device on
- `off`: Turn device off
- `auto`: Enable automatic control
- `schedule`: Set up scheduled operation

### Get Device Control Logs
```http
GET /api/devices/:deviceId/logs?startDate=2024-01-01&endDate=2024-12-31
Authorization: Bearer <token>
```

## Alert Management Endpoints

### Get All Alerts
```http
GET /api/alerts?status=active&severity=critical&page=1&limit=50
Authorization: Bearer <token>
```

**Query Parameters:**
- `status`: `active`, `resolved`, `acknowledged`
- `severity`: `info`, `warning`, `critical`, `emergency`
- `deviceId`: Filter by device
- `alertType`: Filter by alert type

### Create Alert Rule
```http
POST /api/alerts
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "High Temperature Alert",
  "description": "Triggers when temperature exceeds threshold",
  "conditions": {
    "sensorType": "temperature",
    "operator": "greater_than",
    "threshold": 35,
    "duration": 300
  },
  "severity": "critical",
  "actions": {
    "notification": true,
    "email": true,
    "deviceControl": {
      "deviceId": "fan_001",
      "action": "on"
    }
  },
  "enabled": true
}
```

### Update Alert Rule
```http
PUT /api/alerts/:alertId
Authorization: Bearer <token>
Content-Type: application/json

{
  "enabled": false,
  "conditions": {
    "threshold": 40
  }
}
```

### Acknowledge Alert
```http
POST /api/alerts/:alertId/acknowledge
Authorization: Bearer <token>
Content-Type: application/json

{
  "reason": "Manually checked - false alarm",
  "userId": "64a1b2c3d4e5f6789abcdef0"
}
```

## IoT Device Endpoints

### Submit Sensor Data
```http
POST /api/iot/data
Content-Type: application/json

{
  "deviceId": "greenhouse_001",
  "location": "greenhouse_a",
  "pincode": "123456",
  "sensorData": {
    "temperature": 25.5,
    "humidity": 65.2,
    "soilMoisture": 45.8,
    "lightLevel": 750
  },
  "deviceStatus": {
    "battery": 85,
    "signalStrength": -45,
    "uptime": 86400
  },
  "timestamp": "2024-12-07T10:30:00Z"
}
```

### Register IoT Device
```http
POST /api/iot/register
Content-Type: application/json

{
  "deviceId": "greenhouse_002",
  "deviceType": "esp32",
  "location": "greenhouse_b",
  "pincode": "654321",
  "capabilities": {
    "sensors": ["temperature", "humidity", "soilMoisture"],
    "actuators": ["fan", "pump"]
  },
  "firmware": "1.2.3"
}
```

### Get Device Commands
```http
GET /api/iot/commands/:deviceId
```

### Send Device Heartbeat
```http
POST /api/iot/heartbeat
Content-Type: application/json

{
  "deviceId": "greenhouse_001",
  "status": "online",
  "uptime": 86400,
  "firmware": "1.2.3",
  "freeMemory": 32768
}
```

## Settings Endpoints

### Get System Settings
```http
GET /api/settings
Authorization: Bearer <token>
```

### Update System Settings
```http
PUT /api/settings
Authorization: Bearer <token>
Content-Type: application/json

{
  "systemName": "Smart Greenhouse Farm",
  "timezone": "UTC",
  "units": {
    "temperature": "celsius",
    "pressure": "pascal"
  },
  "notifications": {
    "email": true,
    "push": true,
    "sms": false
  }
}
```

### Get Alert Thresholds
```http
GET /api/settings/thresholds
Authorization: Bearer <token>
```

### Update Alert Thresholds
```http
PUT /api/settings/thresholds
Authorization: Bearer <token>
Content-Type: application/json

{
  "temperature": {
    "min": 18,
    "max": 32,
    "critical_min": 10,
    "critical_max": 40
  },
  "humidity": {
    "min": 40,
    "max": 80,
    "critical_min": 20,
    "critical_max": 95
  },
  "soilMoisture": {
    "min": 30,
    "max": 90,
    "critical_min": 10,
    "critical_max": 100
  }
}
```

## System Endpoints

### Health Check
```http
GET /api/health
```

**Response:**
```json
{
  "status": "OK",
  "timestamp": "2024-12-07T10:30:00Z",
  "uptime": 86400,
  "database": {
    "status": "connected",
    "readyState": 1,
    "name": "greenhouse"
  },
  "memory": {
    "used": "45.2 MB",
    "free": "512.8 MB"
  },
  "version": "1.0.0"
}
```

### API Information
```http
GET /
```

## WebSocket Events

### Client to Server Events

#### Join Greenhouse
```javascript
socket.emit('join-greenhouse', 'greenhouse_001');
```

#### Device Control
```javascript
socket.emit('device-control', {
  deviceId: 'fan_001',
  action: 'on',
  greenhouseId: 'greenhouse_001'
});
```

### Server to Client Events

#### Sensor Data Update
```javascript
socket.on('sensorDataUpdate', (data) => {
  console.log('New sensor data:', data);
});
```

#### Alert Notification
```javascript
socket.on('newAlert', (alert) => {
  console.log('New alert:', alert);
});
```

#### Device Status Update
```javascript
socket.on('deviceStatusUpdate', (status) => {
  console.log('Device status changed:', status);
});
```

## Rate Limiting

| Endpoint Category | Rate Limit | Window |
|------------------|------------|---------|
| Authentication | 5 requests | 15 minutes |
| General API | 100 requests | 15 minutes |
| IoT Data | 1000 requests | 1 hour |
| Device Control | 50 requests | 5 minutes |

## Error Codes

| Code | Description |
|------|-------------|
| 400 | Bad Request - Invalid input data |
| 401 | Unauthorized - Invalid or missing token |
| 403 | Forbidden - Insufficient permissions |
| 404 | Not Found - Resource doesn't exist |
| 409 | Conflict - Resource already exists |
| 422 | Unprocessable Entity - Validation failed |
| 429 | Too Many Requests - Rate limit exceeded |
| 500 | Internal Server Error - Server issue |
| 503 | Service Unavailable - Temporary server issue |

## Pagination

For endpoints that return lists, pagination is supported:

```http
GET /api/sensors?page=2&limit=25
```

**Response includes pagination metadata:**
```json
{
  "success": true,
  "data": [...],
  "pagination": {
    "current_page": 2,
    "total_pages": 10,
    "total_items": 250,
    "items_per_page": 25,
    "has_next": true,
    "has_prev": true
  }
}
```

## Data Validation

All input data is validated using Joi schemas. Common validation rules:

- **Email**: Must be valid email format
- **Password**: Minimum 8 characters, at least one number
- **Device ID**: Alphanumeric, underscore allowed, max 50 chars
- **Sensor Values**: Numeric, within realistic ranges
- **Timestamps**: ISO 8601 format

## Security Headers

All API responses include security headers:
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `X-XSS-Protection: 1; mode=block`
- `Strict-Transport-Security: max-age=31536000`
