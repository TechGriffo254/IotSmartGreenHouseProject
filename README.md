# 🌱 IoT Greenhouse Management System

A comprehensive IoT-based greenhouse monitoring and control system built with Node.js, React, and MongoDB. This system allows real-time monitoring of environmental conditions and automated control of greenhouse devices.

## 📋 Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Configuration](#configuration)
- [Usage](#usage)
- [API Documentation](#api-documentation)
- [IoT Device Integration](#iot-device-integration)
- [Project Structure](#project-structure)
- [Contributing](#contributing)
- [License](#license)

## ✨ Features

### 🔍 Monitoring
- **Real-time sensor data** tracking (temperature, humidity, soil moisture, light levels)
- **Interactive dashboards** with charts and graphs
- **Historical data analysis** and trends
- **Multi-greenhouse support**

### 🚨 Alert System
- **Configurable thresholds** for all sensor types
- **Real-time notifications** via Socket.IO
- **Alert history and management**
- **Dynamic alert configuration** - no hardcoded values

### 🎛️ Device Control
- **Remote device management** (fans, pumps, lights, heaters)
- **Automated control** based on sensor readings
- **Device scheduling** and automation rules
- **Manual override capabilities**

### 👥 User Management
- **Role-based access control** (Admin, Operator, Viewer)
- **Multi-user support** with authentication
- **Greenhouse-specific permissions**
- **User activity tracking**

### 📱 Modern UI/UX
- **Responsive design** for mobile and desktop
- **Real-time updates** without page refresh
- **Dark/Light theme support**
- **Intuitive dashboard interface**

## 🛠️ Tech Stack

### Frontend
- **React 18** - UI framework with modern hooks
- **Tailwind CSS** - Utility-first styling
- **Recharts** - Data visualization
- **Socket.IO Client** - Real-time updates
- **Axios** - HTTP client
- **React Router** - Navigation

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MongoDB** - Database
- **Mongoose** - ODM for MongoDB
- **Socket.IO** - Real-time communication
- **JWT** - Authentication
- **bcrypt** - Password hashing

### IoT Simulation
- **ESP32 Simulator** - Device simulation
- **Multiple device simulation** - Realistic sensor data
- **HTTP & WebSocket** - Communication protocols

## 📁 Project Structure

```
IOTprojectGreenHouse/
├── backend/                 # Express.js API server
│   ├── models/             # MongoDB data models
│   ├── routes/             # API route handlers
│   ├── middleware/         # Authentication & validation
│   ├── server.js           # Main server file
│   └── package.json
├── frontend/               # React application
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── context/        # React context providers
│   │   ├── services/       # API service functions
│   │   ├── utils/          # Helper functions and constants
│   │   └── App.js          # Main React component
│   └── package.json
├── iot-simulation/         # Device simulation scripts
│   ├── simulator.js        # Single device simulator
│   ├── esp32-simulator.js  # Multi-device ESP32 simulator
│   └── package.json
└── README.md
```

## 🚀 Quick Start

### Prerequisites

- Node.js (v14 or higher)
- MongoDB (local or cloud instance)
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/iot-greenhouse-system.git
   cd iot-greenhouse-system
   ```

2. **Setup Backend**
   ```bash
   cd backend
   npm install
   cp .env.example .env
   # Edit .env with your MongoDB connection string
   npm start
   ```

3. **Setup Frontend**
   ```bash
   cd ../frontend
   npm install
   npm start
   ```

4. **Setup IoT Simulation**
   ```bash
   cd ../iot-simulation
   npm install
   npm start
   ```

### Environment Configuration

#### Backend (.env)
```env
MONGODB_URI=mongodb://localhost:27017/greenhouse
JWT_SECRET=your_jwt_secret_key
PORT=5000
NODE_ENV=development

# Sensor Thresholds
TEMP_MIN=18
TEMP_MAX=28
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

## 🤖 IoT Device Simulation

The project includes comprehensive IoT device simulation:

### Single Device Simulator
```bash
cd iot-simulation
npm start
```

### Multi-Device ESP32 Simulator
```bash
cd iot-simulation
npm run esp32
```

### Supported Sensors
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

### IoT Simulation Testing
```bash
cd iot-simulation
npm test
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

## 📝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🤝 Support

For support, email support@greenhouse-iot.com or create an issue in the GitHub repository.

## 🏆 Acknowledgments

- React team for the amazing framework
- MongoDB team for the database solution
- Socket.io team for real-time capabilities
- Tailwind CSS team for the styling framework
- All contributors and testers

## 📊 MVP Features Checklist

- [x] Real-time sensor monitoring (DHT11, LDR, Soil Moisture)
- [x] Device control (Fan, Pump, LED)
- [x] User authentication and authorization
- [x] Responsive dashboard interface
- [x] Alert system with notifications
- [x] Historical data visualization
- [x] Automated device control rules
- [x] IoT device simulation
- [x] Real-time updates via WebSocket
- [x] Mobile-responsive design
- [x] RESTful API implementation
- [x] MongoDB data persistence
- [x] Comprehensive error handling
- [x] Environment configuration
- [x] Documentation and setup guides

## 🔮 Future Enhancements

- [ ] Mobile app development
- [ ] Machine learning for predictive analytics
- [ ] Integration with actual IoT hardware
- [ ] Advanced scheduling features
- [ ] Email/SMS notifications
- [ ] Multi-greenhouse support
- [ ] Weather API integration
- [ ] Energy consumption optimization
- [ ] Cloud deployment automation
- [ ] Advanced reporting features
