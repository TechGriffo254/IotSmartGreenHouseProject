# 🌱 Smart Greenhouse IoT Integration Guide

## Overview
Your smart greenhouse system now has complete IoT device integration with the backend. The system supports real-time sensor monitoring, automated device control, and remote management through your web dashboard.

## 📡 System Architecture

### Hardware Components
- **ESP32 Microcontroller** - Main controller
- **DHT11 Sensor** - Temperature & Humidity monitoring
- **Soil Moisture Sensor** - Soil condition monitoring
- **LDR (Light Sensor)** - Light level monitoring
- **Ultrasonic Sensor** - Water level monitoring
- **Water Pump** (Relay controlled) - Automated irrigation
- **Servo Motor** - Automated window control

### Software Components
- **Backend API** - Data processing and device management
- **MongoDB Atlas** - Cloud database for sensor data and alerts
- **Real-time Socket.IO** - Live dashboard updates
- **Web Dashboard** - Monitor and control devices remotely

## 🔧 Arduino Code

### Option 1: Full Featured (greenhouse_controller.ino)
```arduino
// Requires ArduinoJson library
// Advanced JSON parsing and response handling
// Comprehensive error handling and logging
```

### Option 2: Simplified (greenhouse_controller_simple.ino) - **RECOMMENDED**
```arduino
// No external library dependencies
// Manual JSON string construction
// Easier to upload and debug
// All core functionality included
```

## 📋 Setup Instructions

### 1. Arduino IDE Setup
1. Install ESP32 board support in Arduino IDE
2. Install required libraries:
   - WiFi (built-in)
   - HTTPClient (built-in)
   - DHT sensor library
   - ESP32Servo library

### 2. Hardware Connections
```
ESP32 Pin Connections:
├── DHT11 Data → Pin 4
├── Soil Moisture → Pin 34 (Analog)
├── LDR → Pin 35 (Analog)
├── Ultrasonic Trig → Pin 12
├── Ultrasonic Echo → Pin 14
├── Water Pump Relay → Pin 26
└── Servo Motor → Pin 27
```

### 3. Configuration
Update the Arduino code with your settings:
```arduino
// Wi-Fi credentials
const char* ssid = "Your_WiFi_Name";
const char* password = "Your_WiFi_Password";

// Backend server (your computer's IP address)
const char* serverURL = "http://YOUR_IP_ADDRESS:5000/api/iot";
```

### 4. Find Your IP Address
Run this command in PowerShell:
```powershell
ipconfig | findstr "IPv4"
```

## 🌐 API Endpoint

### POST /api/iot
**Purpose:** Receive sensor data and device states from ESP32

**Request Format:**
```json
{
  "deviceId": "ESP32_GREENHOUSE_001",
  "timestamp": 1641234567890,
  "sensors": {
    "temperature": 25.5,
    "humidity": 65.0,
    "soilMoisture": 400,
    "lightLevel": 1500,
    "waterLevel": 25
  },
  "actuators": {
    "waterPump": false,
    "window": true
  },
  "status": {
    "wifiSignal": -45,
    "uptime": 3600
  }
}
```

**Response Format:**
```json
{
  "success": true,
  "message": "Data received and processed",
  "timestamp": "2025-07-09T15:31:44.705Z",
  "commands": {
    "waterPump": true,
    "window": false
  }
}
```

## 🔄 How It Works

### 1. Sensor Data Flow
```
ESP32 → Read Sensors → Send to Backend → Store in MongoDB → Update Dashboard
```

### 2. Device Control Flow
```
Dashboard → Backend → Device Commands → ESP32 → Actuator Control
```

### 3. Real-time Updates
```
Backend → Socket.IO → Dashboard (Live sensor readings and alerts)
```

### 4. Automated Control
The ESP32 has built-in automation logic:
- **Water Pump**: Activates when soil moisture < 500
- **Window Servo**: Opens when temperature > 30°C or light < 500

## 🚨 Alert System

The system automatically creates alerts when:
- **Temperature** > 35°C or < 15°C
- **Humidity** > 80% or < 40%
- **Soil Moisture** < 500 (raw ADC value)
- **Light Level** < 200
- **Water Level** < 10cm

## 🧪 Testing with Simulator

A Node.js simulator is included for testing without hardware:

```bash
cd iot-simulation
node esp32-greenhouse-simulator.js
```

The simulator:
- Generates realistic sensor data
- Simulates device automation logic
- Tests the complete data flow
- Shows real-time communication with backend

## 📊 Dashboard Integration

Your web dashboard now shows:
- **Real-time sensor readings**
- **Device status (pump, window)**
- **Historical data charts**
- **Alert notifications**
- **Remote device control**

## 🔧 Troubleshooting

### Common Issues:

1. **WiFi Connection Failed**
   ```arduino
   // Check SSID and password
   // Ensure 2.4GHz network (ESP32 doesn't support 5GHz)
   ```

2. **Server Connection Error**
   ```arduino
   // Verify IP address in serverURL
   // Check firewall settings
   // Ensure backend is running on port 5000
   ```

3. **Sensor Reading Errors**
   ```arduino
   // Check wiring connections
   // Verify power supply (3.3V/5V)
   // Test sensors individually
   ```

### Debug Tips:
- Use Serial Monitor in Arduino IDE
- Check backend console logs
- Monitor network traffic
- Test with simulator first

## 🚀 Next Steps

1. **Upload Arduino code** to your ESP32
2. **Configure WiFi and IP settings**
3. **Connect sensors and actuators**
4. **Test with the web dashboard**
5. **Monitor real-time data and alerts**

## 📁 File Structure
```
arduino/
├── greenhouse_controller.ino          # Full featured version
├── greenhouse_controller_simple.ino   # Recommended version
└── README.md                         # This documentation

iot-simulation/
├── esp32-greenhouse-simulator.js     # Node.js testing simulator
└── README.md                         # Simulator documentation

backend/routes/
└── iotRoutes.js                      # IoT API endpoints

backend/models/
├── SensorData.js                     # Sensor data database model
├── DeviceControl.js                  # Device control database model
└── Alert.js                          # Alert system database model
```

## 🎯 Features Implemented

✅ **Real-time sensor monitoring**
✅ **Automated device control**
✅ **Remote device management**
✅ **Alert system with thresholds**
✅ **Historical data storage**
✅ **Web dashboard integration**
✅ **Socket.IO real-time updates**
✅ **MongoDB Atlas cloud storage**
✅ **Hardware simulation for testing**

Your smart greenhouse IoT system is now complete and ready for deployment! 🌱🚀
