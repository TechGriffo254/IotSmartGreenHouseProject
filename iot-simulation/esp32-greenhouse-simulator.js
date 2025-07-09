/*
 * ESP32 Greenhouse IoT Simulator
 * Simulates the greenhouse controller sending data to the backend
 * This can be used for testing without actual hardware
 */

const http = require('http');

// Configuration
const serverURL = 'localhost';
const serverPort = 5000;
const deviceId = 'ESP32_GREENHOUSE_001';
const sendInterval = 10000; // Send data every 10 seconds

// Simulated sensor ranges
const sensorRanges = {
  temperature: { min: 18, max: 35 },
  humidity: { min: 40, max: 85 },
  soilMoisture: { min: 200, max: 800 },
  lightLevel: { min: 100, max: 3000 },
  waterLevel: { min: 5, max: 50 }
};

// Simulated device states
let deviceStates = {
  waterPump: false,
  window: false
};

console.log('🌱 ESP32 Greenhouse Simulator Starting...');
console.log(`📡 Sending data to: http://${serverURL}:${serverPort}/api/iot`);
console.log(`🔄 Update interval: ${sendInterval/1000} seconds\n`);

function generateSensorData() {
  return {
    temperature: randomFloat(sensorRanges.temperature.min, sensorRanges.temperature.max),
    humidity: randomFloat(sensorRanges.humidity.min, sensorRanges.humidity.max),
    soilMoisture: randomInt(sensorRanges.soilMoisture.min, sensorRanges.soilMoisture.max),
    lightLevel: randomInt(sensorRanges.lightLevel.min, sensorRanges.lightLevel.max),
    waterLevel: randomInt(sensorRanges.waterLevel.min, sensorRanges.waterLevel.max)
  };
}

function simulateDeviceLogic(sensors) {
  // Auto water pump control
  if (sensors.soilMoisture < 400 && !deviceStates.waterPump) {
    deviceStates.waterPump = true;
    console.log('💧 Auto: Starting water pump (soil moisture low)');
  } else if (sensors.soilMoisture > 600 && deviceStates.waterPump) {
    deviceStates.waterPump = false;
    console.log('💧 Auto: Stopping water pump (soil moisture OK)');
  }

  // Auto window control
  if ((sensors.temperature > 30 || sensors.lightLevel < 500) && !deviceStates.window) {
    deviceStates.window = true;
    console.log('🪟 Auto: Opening window (temp high or light low)');
  } else if (sensors.temperature < 25 && sensors.lightLevel > 1500 && deviceStates.window) {
    deviceStates.window = false;
    console.log('🪟 Auto: Closing window (conditions normal)');
  }
}

function sendDataToServer() {
  const sensors = generateSensorData();
  
  // Simulate device control logic
  simulateDeviceLogic(sensors);

  const payload = {
    deviceId: deviceId,
    timestamp: Date.now(),
    sensors: sensors,
    actuators: deviceStates,
    status: {
      wifiSignal: randomInt(-80, -40),
      uptime: Math.floor(process.uptime())
    }
  };

  const postData = JSON.stringify(payload);

  const options = {
    hostname: serverURL,
    port: serverPort,
    path: '/api/iot',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData)
    }
  };

  console.log('📊 Sensor Data:');
  console.log(`🌡️  Temperature: ${sensors.temperature.toFixed(1)}°C`);
  console.log(`💧 Humidity: ${sensors.humidity.toFixed(1)}%`);
  console.log(`🌱 Soil Moisture: ${sensors.soilMoisture}`);
  console.log(`☀️  Light Level: ${sensors.lightLevel}`);
  console.log(`🚰 Water Level: ${sensors.waterLevel}cm`);
  console.log(`🔧 Pump: ${deviceStates.waterPump ? 'ON' : 'OFF'}, Window: ${deviceStates.window ? 'OPEN' : 'CLOSED'}`);

  const req = http.request(options, (res) => {
    let responseData = '';

    res.on('data', (chunk) => {
      responseData += chunk;
    });

    res.on('end', () => {
      if (res.statusCode === 200 || res.statusCode === 201) {
        try {
          const response = JSON.parse(responseData);
          console.log('✅ Data sent successfully');
          
          // Handle remote commands
          if (response.commands) {
            if (response.commands.waterPump !== undefined && response.commands.waterPump !== deviceStates.waterPump) {
              deviceStates.waterPump = response.commands.waterPump;
              console.log(`🔄 Remote command: Water pump ${deviceStates.waterPump ? 'ON' : 'OFF'}`);
            }
            if (response.commands.window !== undefined && response.commands.window !== deviceStates.window) {
              deviceStates.window = response.commands.window;
              console.log(`🔄 Remote command: Window ${deviceStates.window ? 'OPEN' : 'CLOSED'}`);
            }
          }
        } catch (error) {
          console.log('⚠️  Could not parse server response');
        }
      } else {
        console.log(`❌ Server error: ${res.statusCode}`);
        console.log(responseData);
      }
      console.log('─'.repeat(50));
    });
  });

  req.on('error', (error) => {
    console.error('❌ Request error:', error.message);
    console.log('─'.repeat(50));
  });

  req.write(postData);
  req.end();
}

// Helper functions
function randomFloat(min, max) {
  return Math.random() * (max - min) + min;
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Start simulation
console.log('🚀 Starting simulation...\n');
sendDataToServer(); // Send immediately
setInterval(sendDataToServer, sendInterval);

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Simulation stopped');
  process.exit(0);
});
