# IoT Greenhouse Simulation Scripts

This directory contains simulation scripts for testing the IoT Smart Greenhouse system without physical hardware.

## Files

### `simulator.js`
Main greenhouse simulator that mimics a single IoT device with multiple sensors and actuators.

**Features:**
- DHT11 (Temperature & Humidity) simulation
- LDR (Light sensor) simulation  
- Soil moisture sensor simulation
- Fan, water pump, and LED control simulation
- Realistic sensor value generation with trends
- Device effect simulation (fan cools, pump waters, LED lights)
- Real-time communication with backend API

### `esp32-simulator.js`
Advanced multi-device ESP32 simulator that can run multiple virtual devices simultaneously.

**Features:**
- Multiple ESP32 device simulation
- Configurable sensor types per device
- Location-based device management
- Extended sensor support (pH, CO2)
- Individual device control
- Staggered data transmission

### Environment Configuration (`.env`)
Configuration file for simulation parameters:
- Backend URL connection
- Device identification
- Sensor value ranges
- Simulation timing intervals

## Usage

### Install Dependencies
```bash
npm install
```

### Run Single Device Simulator
```bash
npm start
# or
node simulator.js
```

### Run Multi-Device ESP32 Simulator
```bash
npm run esp32
# or
node esp32-simulator.js
```

### Development Mode
```bash
npm run dev
```

## Configuration

### Single Device (simulator.js)
Edit `.env` file to configure:
- `DEVICE_ID`: Unique device identifier
- `SIMULATION_INTERVAL`: Data transmission frequency (ms)
- `TEMP_MIN/MAX`: Temperature range
- `HUMIDITY_MIN/MAX`: Humidity range
- `LIGHT_MIN/MAX`: Light intensity range
- `SOIL_MOISTURE_MIN/MAX`: Soil moisture range

### Multi-Device (esp32-simulator.js)
Edit the `deviceConfigs` array in `esp32-simulator.js` to add/modify devices:

```javascript
{
    deviceId: 'esp32_greenhouse_001',
    location: 'Main Greenhouse Section A',
    sensors: ['DHT11', 'LDR', 'SOIL_MOISTURE'],
    devices: ['fan', 'pump', 'led'],
    interval: 8000
}
```

## Supported Sensors
- **DHT11**: Temperature and humidity
- **LDR**: Light intensity
- **SOIL_MOISTURE**: Soil moisture level
- **PH_SENSOR**: pH level
- **CO2_SENSOR**: CO2 concentration

## Supported Devices
- **fan**: Cooling fan
- **pump**: Water pump
- **led**: LED grow lights

## API Integration

The simulators automatically:
1. Send sensor data to `POST /api/sensors`
2. Check for device commands from `GET /api/devices`
3. Update device states based on backend commands
4. Apply realistic environmental effects

## Realistic Simulation Features

### Environmental Effects
- Fan operation reduces temperature and humidity
- Water pump increases soil moisture
- LED lights increase light levels
- Natural trends and variations in sensor readings

### Time-Based Simulation
- Light levels follow day/night cycles
- Temperature variations throughout the day
- Gradual soil moisture depletion

### Error Handling
- Network connectivity retry logic
- Graceful degradation on API errors
- Comprehensive logging and debugging

## Testing

The simulators help test:
- Real-time data visualization
- Alert system triggers
- Device automation rules
- API endpoint functionality
- WebSocket communications
- Dashboard responsiveness

## Deployment

For production testing:
1. Update `BACKEND_URL` in `.env` to point to deployed backend
2. Configure appropriate sensor ranges for your environment
3. Adjust simulation intervals based on your needs
4. Monitor logs for connectivity and data transmission

## Troubleshooting

### Common Issues
1. **Connection Error**: Check if backend server is running
2. **Authentication Error**: Ensure API endpoints don't require auth for device data
3. **Data Format Error**: Verify sensor data matches backend schema
4. **Device Command Issues**: Check device control API endpoint format

### Debug Mode
Enable debug logging by setting `DEBUG=true` in `.env` file.
