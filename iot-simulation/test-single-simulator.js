const { ESP32Simulator } = require('./esp32-simulator');

// Create a single device for testing
const testDevice = new ESP32Simulator({
    deviceId: 'ESP32_GREENHOUSE_001',
    location: 'Main Greenhouse Section A',
    sensors: ['DHT11', 'LDR', 'SOIL_MOISTURE'],
    devices: ['fan', 'pump', 'led'],
    interval: 15000
});

console.log('🚀 Starting single test device...');
testDevice.start();

// Stop after 30 seconds
setTimeout(() => {
    console.log('⏹️ Stopping test device...');
    testDevice.stop();
    process.exit(0);
}, 30000);
