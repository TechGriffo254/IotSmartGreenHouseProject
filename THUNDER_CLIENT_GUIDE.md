# Thunder Client API Testing Guide

This guide will help you test the Greenhouse IoT Backend API using Thunder Client in VS Code.

## Setup

1. **Thunder Client Extension**: Already installed ✅
2. **Backend Server**: Make sure it's running on `http://localhost:5000`
3. **Import Collection**: The collection and environment are already set up in the `thunder-tests` folder

## Environment Variables

The following variables are configured in the Thunder Client environment:

- `baseURL`: `http://localhost:5000/api`
- `authToken`: Empty (will be filled after login)
- `greenhouseId`: `greenhouse-001`
- `deviceId`: `ESP32_001`

## Testing Workflow

### 1. Basic Health Check
Start with the **Health Check** request to ensure the server is running.

**Expected Response:**
```json
{
  "status": "OK",
  "timestamp": "2025-07-09T...",
  "uptime": 123.456
}
```

### 2. User Authentication

#### Register a New User
Use the **Register User** request in the Authentication folder.

**Request Body:**
```json
{
  "username": "testuser",
  "email": "test@example.com", 
  "password": "password123",
  "role": "operator"
}
```

#### Login
Use the **Login User** request with the same credentials.

**Important**: Copy the `token` from the login response and paste it into the `authToken` environment variable for authenticated requests.

### 3. IoT Data Simulation

Test sending sensor data from different types of sensors:

#### DHT11 (Temperature & Humidity)
```json
{
  "deviceId": "ESP32_001",
  "sensorType": "DHT11",
  "temperature": 24.5,
  "humidity": 65.2,
  "greenhouseId": "greenhouse-001",
  "location": "Main Greenhouse"
}
```

#### LDR (Light Sensor)
```json
{
  "deviceId": "ESP32_002", 
  "sensorType": "LDR",
  "lightIntensity": 750,
  "greenhouseId": "greenhouse-001",
  "location": "Main Greenhouse"
}
```

#### Soil Moisture Sensor
```json
{
  "deviceId": "ESP32_003",
  "sensorType": "SOIL_MOISTURE",
  "soilMoisture": 45.2,
  "greenhouseId": "greenhouse-001",
  "location": "Main Greenhouse"
}
```

### 4. Device Control

Test controlling devices like relays, pumps, fans:

```json
{
  "deviceId": "RELAY_001",
  "command": "toggle",
  "value": true,
  "greenhouseId": "greenhouse-001"
}
```

### 5. Data Retrieval (Requires Authentication)

After logging in and setting the `authToken`:

- **Get Latest Sensor Readings**: Retrieves the most recent sensor data
- **Get Historical Data**: Retrieves sensor data from the last 24 hours
- **Get Alerts**: Retrieves any alerts triggered by sensor thresholds
- **Get Devices**: Lists all registered devices

## Testing Scenarios

### Scenario 1: Basic IoT Workflow
1. Health Check
2. Send sensor data (DHT11, LDR, Soil Moisture)
3. Control a device (toggle relay)

### Scenario 2: Full Authentication Workflow  
1. Register a new user
2. Login with credentials
3. Get latest sensor readings
4. Get historical data
5. Check alerts

### Scenario 3: Threshold Testing
Send sensor data with extreme values to trigger alerts:

```json
{
  "deviceId": "ESP32_001",
  "sensorType": "DHT11", 
  "temperature": 40,  // High temperature
  "humidity": 90,     // High humidity
  "greenhouseId": "greenhouse-001"
}
```

## Expected Response Formats

### Success Response
```json
{
  "success": true,
  "data": { ... },
  "message": "Operation completed successfully"
}
```

### Error Response
```json
{
  "success": false,
  "message": "Error description",
  "error": "Detailed error info"
}
```

## Troubleshooting

1. **Server not responding**: Check if backend server is running on port 5000
2. **401 Unauthorized**: Make sure `authToken` is set in environment variables
3. **400 Bad Request**: Check request body format and required fields
4. **Database errors**: Ensure MongoDB connection is working

## Real-time Testing

The backend uses Socket.IO for real-time updates. When you send sensor data, it will be broadcast to connected clients. You can test this by:

1. Opening the frontend application
2. Sending sensor data via Thunder Client
3. Observing real-time updates in the frontend

## Collection Structure

```
Greenhouse IoT API/
├── Health Check
├── Authentication/
│   ├── Register User
│   └── Login User
├── IoT Endpoints/
│   ├── Send DHT11 Sensor Data
│   ├── Send LDR Sensor Data  
│   ├── Send Soil Moisture Data
│   └── Device Control
├── Sensors/
│   ├── Get Latest Sensor Readings
│   └── Get Historical Sensor Data
├── Devices/
│   └── Get Devices
└── Alerts/
    └── Get Alerts
```

Happy testing! 🧪
