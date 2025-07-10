# 🌱 Smart Greenhouse IoT Management System

[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-18+-blue.svg)](https://reactjs.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-6+-green.svg)](https://mongodb.com/)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Deployment](https://img.shields.io/badge/Deployed-Koyeb-blue.svg)](https://open-lauryn-ina-9662925b.koyeb.app/)

A comprehensive, production-ready IoT greenhouse monitoring and control system featuring real-time sensor data tracking, automated device control, and intelligent alerting. Built with modern web technologies and deployed on cloud infrastructure.

## 🌟 Live Demo

- **Frontend Web App**: [https://iot-smart-green-house-project.vercel.app/](https://iot-smart-green-house-project.vercel.app/)
- **Backend API**: [https://open-lauryn-ina-9662925b.koyeb.app/](https://open-lauryn-ina-9662925b.koyeb.app/)
- **API Health**: [https://open-lauryn-ina-9662925b.koyeb.app/api/health](https://open-lauryn-ina-9662925b.koyeb.app/api/health)
- **GitHub Repository**: [TechGriffo254/IotSmartGreenHouseProject](https://github.com/TechGriffo254/IotSmartGreenHouseProject)

## 📋 Table of Contents

- [Features](#-features)
- [Tech Stack](#️-tech-stack)
- [Architecture](#-architecture)
- [Quick Start](#-quick-start)
- [Production Deployment](#-production-deployment)
- [API Documentation](#-api-documentation)
- [IoT Device Integration](#-iot-device-integration)
- [Development Guide](#-development-guide)
- [Project Structure](#-project-structure)
- [Environment Configuration](#-environment-configuration)
- [Troubleshooting](#-troubleshooting)
- [Contributing](#-contributing)
- [License](#-license)

## ✨ Features

### 🔍 Real-Time Monitoring
- **Multi-sensor support**: Temperature, humidity, soil moisture, light levels
- **Interactive dashboards** with live charts and visualizations
- **Historical data analysis** with configurable time ranges
- **Multi-greenhouse management** with location-based organization
- **WebSocket-based real-time updates** (no page refresh needed)

### 🚨 Intelligent Alert System
- **Dynamic threshold configuration** - fully customizable alert limits
- **Multi-level alerting**: Info, Warning, Critical, Emergency
- **Real-time notifications** via Socket.IO and browser notifications
- **Alert history and analytics** with filtering and search
- **Email notifications** (configurable)
- **Auto-resolution** when conditions normalize

### 🎛️ Advanced Device Control
- **Remote device management**: Fans, pumps, irrigation, lighting, heating
- **Automated control logic** based on sensor readings and schedules
- **Manual override capabilities** with safety locks
- **Device scheduling** and automation rules
- **Energy usage tracking** and optimization
- **Failsafe mechanisms** for critical systems

### 👥 Enterprise-Grade User Management
- **Role-based access control**: Admin, Operator, Viewer roles
- **Multi-tenant architecture** with greenhouse-specific permissions
- **JWT-based authentication** with refresh tokens
- **User activity auditing** and session management
- **API key management** for IoT devices

### 📱 Modern User Experience
- **Responsive design** optimized for mobile, tablet, and desktop
- **Progressive Web App (PWA)** capabilities
- **Dark/Light theme support** with system preference detection
- **Offline functionality** with data synchronization
- **Keyboard shortcuts** for power users

## 🛠️ Tech Stack

### Backend Infrastructure
- **Node.js 18+** - Runtime environment with latest features
- **Express.js 4.18+** - Fast, minimal web framework
- **MongoDB Atlas** - Cloud-native database with replication
- **Mongoose 8.0+** - Modern ODM with TypeScript support
- **Socket.IO 4.7+** - Real-time bidirectional communication
- **JWT (jsonwebtoken)** - Stateless authentication
- **bcryptjs** - Secure password hashing
- **Helmet** - Security middleware
- **Express Rate Limit** - DDoS protection
- **Joi** - Data validation and sanitization

### Frontend Technology
- **React 18** - Modern UI framework with concurrent features
- **Tailwind CSS 3.0+** - Utility-first styling framework
- **Recharts** - Responsive chart library
- **Socket.IO Client** - Real-time frontend updates
- **Axios** - Promise-based HTTP client
- **React Router v6** - Declarative routing
- **React Context API** - State management
- **React Hot Toast** - Beautiful notifications
- **Date-fns** - Modern date utility library

### IoT & Hardware Integration
- **ESP32/Arduino** - Real hardware sensor data collection
- **DHT11/DHT22** - Temperature and humidity sensors
- **Soil Moisture Sensors** - Real-time soil condition monitoring
- **LDR/Light Sensors** - Ambient light level detection
- **Ultrasonic Sensors** - Water level monitoring
- **Relay Modules** - Device control (pumps, fans, lights)
- **Servo Motors** - Window/vent control automation
- **Production-Ready Arduino Code** - Copy-paste ready for hardware deployment
- **HTTP/HTTPS** - RESTful API communication with backend
- **WebSocket** - Real-time device control and updates
- **Modular sensor framework** - Extensible sensor types

### DevOps & Deployment
- **Koyeb** - Cloud platform deployment
- **GitHub Actions** - CI/CD pipeline
- **MongoDB Atlas** - Managed database service
- **Node.js Process Manager** - Production process management
- **Environment-based configuration** - Development/Production separation

## 🏗️ Architecture

### System Overview
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   IoT Devices   │◄──►│   Backend API   │◄──►│   Frontend UI   │
│   (ESP32 Sim)   │    │   (Node.js)     │    │    (React)      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
        │                       │                       │
        │              ┌─────────────────┐              │
        └─────────────►│   MongoDB       │◄─────────────┘
                       │   (Database)    │
                       └─────────────────┘
```

### Data Flow Architecture
1. **IoT Devices** → Send sensor data via HTTP POST to `/api/iot/data`
2. **Backend** → Validates, stores data, broadcasts via Socket.IO
3. **Frontend** → Receives real-time updates, displays in dashboard
4. **Users** → Control devices via Frontend → Backend → IoT Devices

### Security Architecture
- **JWT Authentication** - Stateless token-based auth
- **Role-Based Access Control** - Granular permissions
- **Input Validation** - Joi schema validation
- **Rate Limiting** - DDoS protection
- **CORS Protection** - Cross-origin request filtering
- **Helmet Security** - HTTP header protection

## � Quick Start

### Prerequisites
- **Node.js 16+** ([Download](https://nodejs.org/))
- **MongoDB** (Local installation or [MongoDB Atlas](https://www.mongodb.com/cloud/atlas))
- **Git** ([Download](https://git-scm.com/))

### 1. Clone Repository
```bash
git clone https://github.com/TechGriffo254/IotSmartGreenHouseProject.git
cd IotSmartGreenHouseProject
```

### 2. Backend Setup
```bash
# Navigate to backend directory
cd backend

# Install dependencies
npm install

# Create environment file
cp .env.example .env

# Edit .env with your configuration
# (See Environment Configuration section below)

# Start development server
npm run dev
```

### 3. Frontend Setup
```bash
# Open new terminal and navigate to frontend
cd frontend

# Install dependencies
npm install

# Start development server
npm start
```

### 4. Access Application
- **Frontend**: [http://localhost:3000](http://localhost:3000)
- **Backend API**: [http://localhost:5000](http://localhost:5000)
- **API Health**: [http://localhost:5000/api/health](http://localhost:5000/api/health)

### 4. Arduino Hardware Setup
For real hardware integration:
1. **Upload the Arduino code** to your ESP32/Arduino Uno
2. **Configure WiFi credentials** in the Arduino code
3. **Connect sensors** according to the pin configuration
4. **Monitor Serial output** to verify connectivity
5. **View real-time data** in the web dashboard

## 🌐 Production Deployment

### Live Production Environment
- **Frontend Web App**: [https://iot-smart-green-house-project.vercel.app/](https://iot-smart-green-house-project.vercel.app/)
- **Backend API**: [https://open-lauryn-ina-9662925b.koyeb.app/](https://open-lauryn-ina-9662925b.koyeb.app/)
- **Deployment Platforms**: Vercel (Frontend) + Koyeb (Backend)
- **Database**: MongoDB Atlas (Production Cluster)
- **Environment**: Production-optimized with security hardening

### Deploy Your Own Instance

#### Option 1: Deploy to Koyeb (Recommended)
1. **Fork the repository** on GitHub
2. **Sign up for Koyeb** at [koyeb.com](https://www.koyeb.com/)
3. **Connect your GitHub repository**
4. **Configure deployment settings**:
   ```
   Build Command: npm install
   Run Command: npm start
   Port: 8080
   ```
5. **Set environment variables** (see Environment Configuration)
6. **Deploy** and get your production URL

#### Option 2: Deploy Frontend to Vercel (Recommended for Frontend)
```bash
# Install Vercel CLI
npm install -g vercel

# Login to Vercel
vercel login

# Navigate to frontend directory
cd frontend

# Deploy (follow prompts)
vercel --prod
```

**Vercel Configuration:**
- **Root Directory**: `frontend`
- **Build Command**: `npm run build`
- **Output Directory**: `build`
- **Environment Variables**: Set in Vercel dashboard
  ```env
  REACT_APP_API_URL=https://open-lauryn-ina-9662925b.koyeb.app/api
  REACT_APP_WS_URL=https://open-lauryn-ina-9662925b.koyeb.app
  ```
- **Live URL**: [https://iot-smart-green-house-project.vercel.app/](https://iot-smart-green-house-project.vercel.app/)

#### Option 3: Deploy Backend to Heroku
```bash
# Install Heroku CLI
npm install -g heroku

# Login to Heroku
heroku login

# Create Heroku app
heroku create your-greenhouse-app

# Set environment variables
heroku config:set NODE_ENV=production
heroku config:set MONGODB_URI=your_mongodb_uri
heroku config:set JWT_SECRET=your_jwt_secret

# Deploy
git push heroku main
```

#### Option 4: Deploy to DigitalOcean/AWS/GCP
See [DEPLOYMENT.md](DEPLOYMENT.md) for detailed cloud deployment guides.

### Production Checklist
- [ ] MongoDB Atlas cluster configured
- [ ] Environment variables properly set
- [ ] JWT secrets are cryptographically secure
- [ ] CORS origins configured for your domain
- [ ] SSL/TLS certificates configured
- [ ] Monitoring and logging set up
- [ ] Backup strategy implemented
HUMIDITY_MIN=50
HUMIDITY_MAX=70
SOIL_MOISTURE_MIN=40
SOIL_MOISTURE_MAX=70
LIGHT_MIN=200
LIGHT_MAX=800
```

#### Frontend (.env)
```env
REACT_APP_API_URL=http://localhost:5000
REACT_APP_WS_URL=http://localhost:5000
```

#### IoT Simulation (.env)
```env
BACKEND_URL=http://localhost:5000
DEVICE_ID=greenhouse_001
SIMULATION_INTERVAL=5000
DEBUG=true
```

## 📊 Features Overview

### Dashboard
- Real-time sensor data visualization
- Quick stats overview
- Device status monitoring
- Alert notifications

### Sensor Monitoring
- Temperature and humidity tracking
- Light level monitoring
- Soil moisture measurement
- Historical data charts
- Threshold-based alerts

### Device Control
- Manual device operation
- Automated rule-based control
- Device scheduling
- Power consumption tracking

### Alert System
- Real-time environmental alerts
- Device malfunction notifications
- Customizable alert thresholds
- Alert acknowledgment and management

### Analytics
- Historical data analysis
- Trend identification
- Environmental reports
- Device usage statistics

### Settings
- User profile management
- **Dynamic Alert Thresholds** - All sensor thresholds are configurable via UI, no hardcoded values
- System configuration
- Device automation settings
- Notification preferences

## 🎛️ Dynamic Configuration System

This system is designed with NO hardcoded sensor threshold values. All alert thresholds are:

- **User-configurable**: Set via Settings page in the UI
- **Greenhouse-specific**: Different thresholds for different greenhouses
- **Dynamically loaded**: Frontend loads current thresholds from API
- **Extensible**: Easy to add new sensor types and thresholds
- **Database-driven**: All settings stored in MongoDB Settings collection

### Available Threshold Settings:
- Temperature: High/Low thresholds (°C)
- Humidity: High/Low thresholds (%)
- Soil Moisture: Low threshold (%)
- Light Level: Low threshold (lux)

### Settings API:
- `GET /api/settings/:greenhouseId` - Get settings for greenhouse
- `PUT /api/settings/:greenhouseId/thresholds` - Update alert thresholds
- `PUT /api/settings/:greenhouseId/system` - Update system settings
- `POST /api/settings/:greenhouseId/reset` - Reset to defaults

## 🔧 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/profile` - Get user profile
- `PUT /api/auth/profile` - Update user profile

### Sensors
- `GET /api/sensors` - Get sensor data
- `POST /api/sensors` - Add sensor reading
- `GET /api/sensors/latest` - Get latest readings
- `GET /api/sensors/stats` - Get sensor statistics

### Devices
- `GET /api/devices` - Get all devices
- `POST /api/devices` - Create device
- `PUT /api/devices/:id` - Update device
- `DELETE /api/devices/:id` - Delete device
- `POST /api/devices/:id/control` - Control device

### Alerts
- `GET /api/alerts` - Get all alerts
- `POST /api/alerts/:id/acknowledge` - Acknowledge alert
- `POST /api/alerts/:id/dismiss` - Dismiss alert

### Settings
- `GET /api/settings/:greenhouseId` - Get settings for greenhouse
- `PUT /api/settings/:greenhouseId/thresholds` - Update alert thresholds
- `PUT /api/settings/:greenhouseId/system` - Update system settings
- `PUT /api/settings/:greenhouseId/devices` - Update device settings
- `POST /api/settings/:greenhouseId/reset` - Reset settings to defaults

### IoT Device Integration
- `POST /api/iot/sensor-data` - Submit sensor readings from IoT devices
- `GET /api/iot/device-commands/:deviceId` - Get commands for specific device
- `POST /api/iot/device-status` - Update device status from IoT device
- `POST /api/iot/bulk-data` - Submit bulk sensor data

## 🔌 WebSocket Events

### Client Events
- `sensor_data` - New sensor readings
- `device_status` - Device status changes
- `alert_created` - New alert created
- `alert_updated` - Alert status updated

## 🔌 Arduino Hardware Integration

This project is designed for **real ESP32/Arduino hardware** collecting actual sensor data from your greenhouse environment.

### Required Hardware
- **ESP32 Development Board** (recommended) or Arduino with WiFi module
- **DHT11/DHT22** - Temperature and humidity sensor
- **Soil Moisture Sensor** - Analog soil moisture detection
- **LDR (Light Dependent Resistor)** - Light level monitoring
- **HC-SR04 Ultrasonic Sensor** - Water level measurement
- **Relay Module** - For controlling water pumps, fans, etc.
- **Servo Motor** - For window/vent automation
- **Jumper wires and breadboard** for connections

### Arduino Code Setup

1. **Install Arduino IDE Libraries**:
   ```
   - ESP32 Board Package
   - ArduinoJson by Benoit Blanchon
   - DHT sensor library by Adafruit
   - ESP32Servo by Kevin Harrington
   ```

2. **Use the Production-Ready Code**:
   - Copy the complete code from `arduino/ESP32_Greenhouse_Production.ino`
   - Update WiFi credentials in the code
   - The backend URL is pre-configured for the live Koyeb deployment

3. **Hardware Wiring**:
   ```
   DHT11 Data Pin    → GPIO 4
   Soil Moisture     → GPIO 34 (Analog)
   LDR Light Sensor  → GPIO 35 (Analog)
   Ultrasonic Trig   → GPIO 12
   Ultrasonic Echo   → GPIO 14
   Water Pump Relay  → GPIO 26
   Window Servo      → GPIO 27
   ```

4. **Upload and Monitor**:
   - Select your ESP32 board in Arduino IDE
   - Upload the code
   - Open Serial Monitor (115200 baud)
   - Watch real-time data being sent to the backend!

### Supported Real Sensors
- **DHT11**: Temperature and humidity
- **LDR**: Light intensity
- **Soil Moisture**: Soil moisture level
- **pH Sensor**: pH level monitoring
- **CO2 Sensor**: CO2 concentration

### Supported Devices
- **Fan**: Temperature and humidity control
- **Water Pump**: Irrigation control
- **LED Lights**: Supplemental lighting
- **Heater**: Temperature control
- **Cooling System**: Advanced cooling

## 📱 Mobile Responsiveness

The application is fully responsive and works seamlessly across:
- Desktop computers
- Tablets
- Mobile phones
- Different screen orientations

## 🔒 Security Features

- JWT-based authentication
- Password hashing with bcrypt
- Protected API routes
- Input validation and sanitization
- CORS configuration
- Environment variable protection

## 🧪 Testing

### Frontend Testing
```bash
cd frontend
npm test
```

### Backend Testing
```bash
cd backend
npm test
```

### Arduino Hardware Testing

1. **Upload Arduino Code**:
   ```bash
   # Use Arduino IDE to upload ESP32_Greenhouse_Production.ino
   # Monitor Serial output at 115200 baud
   ```

2. **Verify Data Flow**:
   ```bash
   # Check backend logs for incoming sensor data
   curl https://open-lauryn-ina-9662925b.koyeb.app/api/sensor-data
   ```

## 📈 Performance Optimization

- Efficient data polling strategies
- Optimized chart rendering
- Lazy loading of components
- Proper state management
- Database query optimization

## 🚀 Deployment

### Production Build
```bash
# Frontend
cd frontend
npm run build

# Backend
cd backend
npm run build
```

### Docker Deployment
```bash
docker-compose up -d
```

### Environment-specific Configurations
- Development: Hot reloading, debug mode
- Production: Optimized builds, error tracking
- Testing: Mock data, isolated environments

## 🛠️ Development

### Code Structure Guidelines
- Component-based architecture
- Separation of concerns
- Reusable utility functions
- Consistent naming conventions
- Comprehensive error handling

### Adding New Features
1. Create feature branch
2. Implement backend API endpoints
3. Add frontend components
4. Update IoT simulation if needed
5. Add tests
6. Update documentation

## 📚 API Documentation

### Base URL
- **Development**: `http://localhost:5000/api`
- **Production**: `https://open-lauryn-ina-9662925b.koyeb.app/api`

### Authentication
All protected endpoints require a JWT token in the Authorization header:
```
Authorization: Bearer <your_jwt_token>
```

### API Endpoints

#### Authentication Endpoints
```http
POST /api/auth/register     # Register new user
POST /api/auth/login        # User login
POST /api/auth/logout       # User logout
GET  /api/auth/profile      # Get user profile
PUT  /api/auth/profile      # Update user profile
```

#### Sensor Data Endpoints
```http
GET  /api/sensors                    # Get all sensor data
GET  /api/sensors/:deviceId         # Get data for specific device
GET  /api/sensors/:deviceId/latest   # Get latest sensor reading
POST /api/sensors                    # Add new sensor data (IoT devices)
GET  /api/sensors/analytics/:period # Get analytics data
```

#### Device Control Endpoints
```http
GET  /api/devices                    # Get all devices
GET  /api/devices/:deviceId          # Get specific device
POST /api/devices                    # Register new device
PUT  /api/devices/:deviceId          # Update device settings
POST /api/devices/:deviceId/control  # Control device (on/off/auto)
GET  /api/devices/:deviceId/logs     # Get device control logs
```

#### Alert Management Endpoints
```http
GET  /api/alerts                     # Get all alerts
GET  /api/alerts/active              # Get active alerts
POST /api/alerts                     # Create new alert rule
PUT  /api/alerts/:alertId            # Update alert rule
DELETE /api/alerts/:alertId          # Delete alert rule
POST /api/alerts/:alertId/acknowledge # Acknowledge alert
```

#### IoT Device Endpoints
```http
POST /api/iot/data                   # Submit sensor data
POST /api/iot/register               # Register new IoT device
GET  /api/iot/commands/:deviceId     # Get pending commands
POST /api/iot/heartbeat              # Device heartbeat
```

#### Settings Endpoints
```http
GET  /api/settings                   # Get system settings
PUT  /api/settings                   # Update system settings
GET  /api/settings/thresholds        # Get alert thresholds
PUT  /api/settings/thresholds        # Update alert thresholds
```

#### System Endpoints
```http
GET  /api/health                     # System health check
GET  /                               # API information
```

### Request/Response Examples

#### Register User
```http
POST /api/auth/register
Content-Type: application/json

{
  "username": "admin",
  "email": "admin@greenhouse.com",
  "password": "securepassword123",
  "role": "admin"
}
```

#### Submit Sensor Data
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
  "timestamp": "2024-12-07T10:30:00Z"
}
```

#### Control Device
```http
POST /api/devices/fan_001/control
Authorization: Bearer <token>
Content-Type: application/json

{
  "action": "on",
  "duration": 300,
  "reason": "High temperature detected"
}
```

### Error Responses
```json
{
  "success": false,
  "message": "Error description",
  "error": "Detailed error information",
  "timestamp": "2024-12-07T10:30:00Z"
}
```

### Rate Limiting
- **General API**: 100 requests per 15 minutes per IP
- **Authentication**: 5 requests per 15 minutes per IP
- **IoT Data**: 1000 requests per hour per device

## 🔌 IoT Device Integration

### ESP32 Integration

#### Hardware Requirements
- **ESP32 Development Board**
- **DHT22** (Temperature & Humidity sensor)
- **Soil Moisture Sensor**
- **LDR** (Light Dependent Resistor)
- **Relay Modules** (for device control)
- **WiFi Connection**

#### Arduino Code Example
```cpp
#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include <DHT.h>

const char* ssid = "your_wifi_ssid";
const char* password = "your_wifi_password";
const char* serverURL = "https://open-lauryn-ina-9662925b.koyeb.app/api/iot/data";
const char* deviceId = "greenhouse_001";
const char* pincode = "123456";

DHT dht(2, DHT22);

void setup() {
  Serial.begin(115200);
  WiFi.begin(ssid, password);
  dht.begin();
  
  while (WiFi.status() != WL_CONNECTED) {
    delay(1000);
    Serial.println("Connecting to WiFi...");
  }
}

void loop() {
  float temperature = dht.readTemperature();
  float humidity = dht.readHumidity();
  int soilMoisture = analogRead(A0);
  int lightLevel = analogRead(A1);
  
  sendSensorData(temperature, humidity, soilMoisture, lightLevel);
  delay(30000); // Send data every 30 seconds
}

void sendSensorData(float temp, float hum, int soil, int light) {
  HTTPClient http;
  http.begin(serverURL);
  http.addHeader("Content-Type", "application/json");
  
  StaticJsonDocument<300> doc;
  doc["deviceId"] = deviceId;
  doc["location"] = "greenhouse_a";
  doc["pincode"] = pincode;
  doc["sensorData"]["temperature"] = temp;
  doc["sensorData"]["humidity"] = hum;
  doc["sensorData"]["soilMoisture"] = soil;
  doc["sensorData"]["lightLevel"] = light;
  
  String jsonString;
  serializeJson(doc, jsonString);
  
  int httpResponseCode = http.POST(jsonString);
  
  if (httpResponseCode > 0) {
    String response = http.getString();
    Serial.println("Data sent successfully: " + response);
  } else {
    Serial.println("Error sending data: " + String(httpResponseCode));
  }
  
  http.end();
}
```

### Device Simulation
For testing without physical hardware:

```bash
# Start single device simulator
cd iot-simulation
npm run single

# Start multi-device simulator
npm run multiple

# Custom device configuration
node esp32-simulator.js --devices 5 --interval 5000
```

### Supported Sensor Types
| Sensor Type | Unit | Range | Accuracy |
|-------------|------|-------|----------|
| Temperature | °C | -40 to 80 | ±0.5°C |
| Humidity | % | 0 to 100 | ±3% |
| Soil Moisture | % | 0 to 100 | ±2% |
| Light Level | Lux | 0 to 65535 | ±5% |
| pH Level | pH | 0 to 14 | ±0.1 |
| EC Level | µS/cm | 0 to 5000 | ±2% |

## 💻 Development Guide

### Project Structure
```
IotSmartGreenHouseProject/
├── 📁 backend/                      # Node.js API Server
│   ├── 📁 models/                   # MongoDB Schemas
│   │   ├── Alert.js                 # Alert model
│   │   ├── DeviceControl.js         # Device control model
│   │   ├── SensorData.js            # Sensor data model
│   │   ├── Settings.js              # System settings model
│   │   └── User.js                  # User model
│   ├── 📁 routes/                   # API Route Handlers
│   │   ├── alertRoutes.js           # Alert management
│   │   ├── authRoutes.js            # Authentication
│   │   ├── deviceRoutes.js          # Device control
│   │   ├── iotRoutes.js             # IoT data ingestion
│   │   ├── sensorRoutes.js          # Sensor data queries
│   │   └── settingsRoutes.js        # System settings
│   ├── 📁 middleware/               # Express Middleware
│   │   ├── auth.js                  # JWT authentication
│   │   └── validation.js            # Input validation
│   ├── server.js                    # Main server file
│   ├── package.json                 # Dependencies
│   └── .env                         # Environment variables
├── 📁 frontend/                     # React Application
│   ├── 📁 public/                   # Static files
│   ├── 📁 src/
│   │   ├── 📁 components/           # React Components
│   │   │   ├── 📁 auth/             # Authentication components
│   │   │   ├── 📁 Dashboard/        # Dashboard components
│   │   │   ├── 📁 Devices/          # Device management
│   │   │   ├── 📁 Sensors/          # Sensor displays
│   │   │   └── 📁 common/           # Shared components
│   │   ├── 📁 context/              # React Context
│   │   │   ├── AuthContext.js       # Authentication state
│   │   │   ├── SocketContext.js     # WebSocket connection
│   │   │   └── ToastContext.js      # Notifications
│   │   ├── 📁 services/             # API Services
│   │   │   ├── api.js               # HTTP client setup
│   │   │   └── dataService.js       # Data fetching
│   │   ├── 📁 utils/                # Utilities
│   │   │   ├── constants.js         # App constants
│   │   │   ├── helpers.js           # Helper functions
│   │   │   └── sensorUtils.js       # Sensor calculations
│   │   ├── App.js                   # Main React component
│   │   └── index.js                 # App entry point
│   ├── package.json                 # Frontend dependencies
│   └── tailwind.config.js           # Tailwind configuration
├── 📁 iot-simulation/               # Device Simulation
│   ├── esp32-simulator.js           # Multi-device simulator
│   ├── simulator.js                 # Single device simulator
│   ├── package.json                 # Simulation dependencies
│   └── README.md                    # Simulation documentation
├── 📁 docs/                         # Documentation
│   ├── API.md                       # API documentation
│   ├── DEPLOYMENT.md                # Deployment guides
│   └── DEVELOPMENT.md               # Development setup
├── 📄 README.md                     # This file
├── 📄 LICENSE                       # MIT License
└── 📄 .gitignore                    # Git ignore rules
```

### Development Workflow

#### 1. Local Development Setup
```bash
# Install all dependencies
npm run install:all

# Start all services in development mode
npm run dev:all

# Or start services individually
npm run dev:backend    # Backend only
npm run dev:frontend   # Frontend only
npm run dev:simulator  # IoT simulator only
```

#### 2. Code Quality & Testing
```bash
# Run linting
npm run lint

# Run tests
npm run test

# Run type checking (if TypeScript)
npm run type-check

# Format code
npm run format
```

#### 3. Database Management
```bash
# Seed database with sample data
npm run db:seed

# Reset database
npm run db:reset

# Backup database
npm run db:backup
```

### Environment Configuration

#### Development Environment (.env)
```env
# Server Configuration
NODE_ENV=development
PORT=5000

# Database
MONGODB_URI=mongodb://localhost:27017/greenhouse_dev

# Authentication
JWT_SECRET=your_development_jwt_secret_key_here
JWT_EXPIRE=7d

# IoT Configuration
ESP32_PINCODE=123456
DEVICE_UPDATE_INTERVAL=5000

# Alert Thresholds
ALERT_THRESHOLD_TEMP_HIGH=35
ALERT_THRESHOLD_TEMP_LOW=15
ALERT_THRESHOLD_HUMIDITY_HIGH=80
ALERT_THRESHOLD_HUMIDITY_LOW=40
ALERT_THRESHOLD_SOIL_MOISTURE_LOW=30
ALERT_THRESHOLD_LIGHT_LOW=200

# Email Configuration (Optional)
EMAIL_SERVICE=gmail
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password

# Logging
LOG_LEVEL=debug
LOG_FILE=logs/greenhouse.log
```

#### Production Environment (.env.production)
```env
# Server Configuration
NODE_ENV=production
PORT=8080

# Database (MongoDB Atlas)
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/greenhouse?retryWrites=true&w=majority

# Authentication (Use strong secrets in production)
JWT_SECRET=your_super_secure_production_jwt_secret_minimum_32_characters
JWT_EXPIRE=7d

# IoT Configuration
ESP32_PINCODE=production_secure_pincode

# Alert Thresholds (Production values)
ALERT_THRESHOLD_TEMP_HIGH=32
ALERT_THRESHOLD_TEMP_LOW=18
ALERT_THRESHOLD_HUMIDITY_HIGH=75
ALERT_THRESHOLD_HUMIDITY_LOW=45
ALERT_THRESHOLD_SOIL_MOISTURE_LOW=35
ALERT_THRESHOLD_LIGHT_LOW=300

# Security
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Monitoring
LOG_LEVEL=info
ENABLE_MONITORING=true
```

## 🐛 Troubleshooting

### Common Issues and Solutions

#### 1. MongoDB Connection Issues
**Problem**: `MongoError: connect ECONNREFUSED`
**Solution**:
```bash
# Check if MongoDB is running
brew services start mongodb-community  # macOS
sudo systemctl start mongod             # Linux
net start MongoDB                      # Windows

# Verify connection string
echo $MONGODB_URI
```

#### 2. Frontend Not Loading
**Problem**: React app shows blank page
**Solution**:
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install

# Check for port conflicts
lsof -ti:3000 | xargs kill -9
```

#### 3. Socket.IO Connection Failed
**Problem**: Real-time updates not working
**Solution**:
```javascript
// Check CORS configuration in server.js
app.use(cors({
  origin: ['http://localhost:3000', 'your-frontend-domain'],
  credentials: true
}));
```

#### 4. IoT Simulator Not Sending Data
**Problem**: No sensor data appearing in dashboard
**Solution**:
```bash
# Check simulator logs
cd iot-simulation
DEBUG=* node simulator.js

# Verify API endpoint
curl -X POST http://localhost:5000/api/iot/data \
  -H "Content-Type: application/json" \
  -d '{"deviceId":"test","pincode":"123456","sensorData":{"temperature":25}}'
```

#### 5. Authentication Issues
**Problem**: JWT token errors
**Solution**:
```bash
# Verify JWT secret is set
echo $JWT_SECRET

# Clear browser localStorage
// In browser console:
localStorage.clear()
```

#### 6. Vercel Authentication Issues
**Problem**: Login fails on Vercel deployment but works locally
**Solution**:
```bash
# 1. Check Environment Variables in Vercel Dashboard
# Make sure these are set correctly:
REACT_APP_API_URL=https://open-lauryn-ina-9662925b.koyeb.app/api
REACT_APP_WS_URL=https://open-lauryn-ina-9662925b.koyeb.app

# 2. Verify CORS settings in backend server.js
# Ensure your Vercel URL is in allowedOrigins array

# 3. Check browser console for CORS errors
# Open Developer Tools → Console tab

# 4. Test API directly
curl -X POST https://open-lauryn-ina-9662925b.koyeb.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password"}'
```

**Common fixes:**
- Redeploy frontend after environment variable changes
- Clear browser cache and localStorage
- Ensure backend includes your Vercel domain in CORS
- Check that API calls use `/api` path correctly
```

### Performance Optimization

#### Backend Optimization
- **Database Indexing**: Ensure proper indexes on frequently queried fields
- **Caching**: Implement Redis for caching frequently accessed data
- **Connection Pooling**: Configure MongoDB connection pooling
- **Compression**: Enable gzip compression for API responses

#### Frontend Optimization
- **Code Splitting**: Implement lazy loading for components
- **Memoization**: Use React.memo and useMemo for expensive operations
- **Bundle Analysis**: Analyze and optimize bundle sizes
- **PWA Features**: Enable service workers for offline functionality

### Monitoring and Logging

#### Application Monitoring
```bash
# Install monitoring tools
npm install winston morgan helmet

# Set up application monitoring
const winston = require('winston');
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' })
  ]
});
```

#### Health Checks
Monitor these endpoints for system health:
- `/api/health` - Overall system health
- `/api/health/database` - Database connectivity
- `/api/health/memory` - Memory usage
- `/api/health/disk` - Disk space

## 🤝 Contributing

We welcome contributions to the Smart Greenhouse IoT project! Please follow these guidelines:

### Development Setup
1. **Fork the repository** on GitHub
2. **Clone your fork** locally
3. **Create a feature branch** from `main`
4. **Make your changes** with proper commit messages
5. **Test your changes** thoroughly
6. **Submit a pull request**

### Coding Standards
- **ESLint**: Follow the configured ESLint rules
- **Prettier**: Use Prettier for code formatting
- **Commit Messages**: Use conventional commit format
- **Documentation**: Update documentation for new features
- **Tests**: Add tests for new functionality

### Pull Request Process
1. Update documentation if needed
2. Add/update tests for new features
3. Ensure all tests pass
4. Update CHANGELOG.md
5. Request review from maintainers

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **MongoDB** for the excellent database platform
- **React Team** for the amazing frontend framework
- **Socket.IO** for real-time communication capabilities
- **Tailwind CSS** for the utility-first CSS framework
- **Koyeb** for the seamless deployment platform
- **ESP32 Community** for IoT development resources

## 📞 Support

- **GitHub Issues**: [Create an issue](https://github.com/TechGriffo254/IotSmartGreenHouseProject/issues)
- **Documentation**: Check the [docs](docs/) folder
- **Email**: techgriffo254@gmail.com

---

<div align="center">
  <p>Made with ❤️ by <a href="https://github.com/TechGriffo254">TechGriffo254</a></p>
  <p>⭐ Star this repository if you find it helpful!</p>
</div>
