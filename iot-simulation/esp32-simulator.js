const axios = require('axios');
require('dotenv').config();

/**
 * ESP32 Device Simulator
 * Simulates multiple ESP32 devices with different sensor configurations
 */
class ESP32Simulator {
    constructor(deviceConfig) {
        this.deviceId = deviceConfig.deviceId;
        this.location = deviceConfig.location;
        this.sensorTypes = deviceConfig.sensors;
        this.deviceTypes = deviceConfig.devices;
        this.backendUrl = process.env.BACKEND_URL || 'http://localhost:5000';
        this.interval = deviceConfig.interval || 10000;
        
        // Initialize sensor states
        this.sensorStates = {};
        this.deviceStates = {};
        
        this.initializeSensors();
        this.initializeDevices();
        
        this.isRunning = false;
        this.intervalId = null;
    }

    initializeSensors() {
        this.sensorTypes.forEach(sensorType => {
            switch (sensorType) {
                case 'DHT11':
                    this.sensorStates.temperature = 20 + Math.random() * 10;
                    this.sensorStates.humidity = 50 + Math.random() * 20;
                    break;
                case 'LDR':
                    this.sensorStates.light = Math.random() * 100;
                    break;
                case 'SOIL_MOISTURE':
                    this.sensorStates.soilMoisture = 30 + Math.random() * 40;
                    break;
                case 'PH_SENSOR':
                    this.sensorStates.ph = 6.0 + Math.random() * 2.0;
                    break;
                case 'CO2_SENSOR':
                    this.sensorStates.co2 = 400 + Math.random() * 200;
                    break;
            }
        });
    }

    initializeDevices() {
        this.deviceTypes.forEach(deviceType => {
            this.deviceStates[deviceType] = false;
        });
    }

    generateSensorReading(sensorType) {
        switch (sensorType) {
            case 'DHT11':
                // Temperature: add realistic variation
                this.sensorStates.temperature += (Math.random() - 0.5) * 2;
                this.sensorStates.temperature = Math.max(15, Math.min(40, this.sensorStates.temperature));
                
                // Humidity: add realistic variation
                this.sensorStates.humidity += (Math.random() - 0.5) * 3;
                this.sensorStates.humidity = Math.max(30, Math.min(90, this.sensorStates.humidity));
                
                return {
                    temperature: Math.round(this.sensorStates.temperature * 10) / 10,
                    humidity: Math.round(this.sensorStates.humidity * 10) / 10
                };
                
            case 'LDR':
                // Light: simulate day/night cycle
                const hour = new Date().getHours();
                let baseLight = 0;
                if (hour >= 6 && hour <= 18) {
                    baseLight = 60 + Math.sin((hour - 6) * Math.PI / 12) * 40;
                } else {
                    baseLight = 5 + Math.random() * 10;
                }
                
                this.sensorStates.light = baseLight + (Math.random() - 0.5) * 10;
                this.sensorStates.light = Math.max(0, Math.min(100, this.sensorStates.light));
                
                return {
                    light: Math.round(this.sensorStates.light * 10) / 10
                };
                
            case 'SOIL_MOISTURE':
                // Soil moisture: gradually decreases, increases with pump
                if (this.deviceStates.pump) {
                    this.sensorStates.soilMoisture += 2;
                } else {
                    this.sensorStates.soilMoisture -= 0.5;
                }
                
                this.sensorStates.soilMoisture += (Math.random() - 0.5) * 1;
                this.sensorStates.soilMoisture = Math.max(10, Math.min(80, this.sensorStates.soilMoisture));
                
                return {
                    soilMoisture: Math.round(this.sensorStates.soilMoisture * 10) / 10
                };
                
            case 'PH_SENSOR':
                this.sensorStates.ph += (Math.random() - 0.5) * 0.2;
                this.sensorStates.ph = Math.max(5.5, Math.min(8.5, this.sensorStates.ph));
                
                return {
                    ph: Math.round(this.sensorStates.ph * 100) / 100
                };
                
            case 'CO2_SENSOR':
                this.sensorStates.co2 += (Math.random() - 0.5) * 50;
                this.sensorStates.co2 = Math.max(300, Math.min(800, this.sensorStates.co2));
                
                return {
                    co2: Math.round(this.sensorStates.co2)
                };
                
            default:
                return {};
        }
    }

    generateAllSensorData() {
        let allSensorData = {
            deviceId: this.deviceId,
            greenhouseId: 'greenhouse-001',
            timestamp: new Date().toISOString()
        };
        
        this.sensorTypes.forEach(sensorType => {
            const reading = this.generateSensorReading(sensorType);
            // Flatten the sensor data to match backend expectations
            Object.assign(allSensorData, reading);
        });
        
        // Map sensor names to match backend expectations
        if (allSensorData.light !== undefined) {
            allSensorData.lightIntensity = allSensorData.light;
            delete allSensorData.light;
        }
        
        return allSensorData;
    }

    async sendData(data) {
        try {
            const response = await axios.post(`${this.backendUrl}/api/iot`, data, {
                headers: {
                    'Content-Type': 'application/json'
                },
                timeout: 5000
            });
            
            console.log(`[${this.deviceId}] Data sent successfully`);
            return response.data;
        } catch (error) {
            console.error(`[${this.deviceId}] Error sending data:`, error.message);
        }
    }

    async checkCommands() {
        try {
            const response = await axios.get(`${this.backendUrl}/api/iot/device-commands/${this.deviceId}`, {
                timeout: 5000
            });
            
            if (response.data && response.data.length > 0) {
                response.data.forEach(command => {
                    if (this.deviceStates.hasOwnProperty(command.deviceType)) {
                        this.deviceStates[command.deviceType] = command.status;
                        console.log(`[${this.deviceId}] ${command.deviceType}: ${command.status ? 'ON' : 'OFF'}`);
                    }
                });
            }
        } catch (error) {
            console.error(`[${this.deviceId}] Error checking commands:`, error.message);
        }
    }

    async run() {
        if (!this.isRunning) return;
        
        try {
            await this.checkCommands();
            const data = this.generateAllSensorData();
            
            console.log(`[${this.deviceId}] Generated data:`, JSON.stringify(data, null, 2));
            
            await this.sendData(data);
            
            console.log(`[${this.deviceId}] Data sent successfully`);
            
        } catch (error) {
            console.error(`[${this.deviceId}] Error in run loop:`, error.message);
        }
        
        this.intervalId = setTimeout(() => this.run(), this.interval);
    }

    start() {
        if (this.isRunning) return;
        
        console.log(`[${this.deviceId}] Starting ESP32 simulator at ${this.location}`);
        console.log(`[${this.deviceId}] Sensors:`, this.sensorTypes);
        console.log(`[${this.deviceId}] Devices:`, this.deviceTypes);
        
        this.isRunning = true;
        this.run();
    }

    stop() {
        if (!this.isRunning) return;
        
        console.log(`[${this.deviceId}] Stopping ESP32 simulator`);
        this.isRunning = false;
        
        if (this.intervalId) {
            clearTimeout(this.intervalId);
            this.intervalId = null;
        }
    }
}

// Device configurations
const deviceConfigs = [
    {
        deviceId: 'esp32_greenhouse_001',
        location: 'Main Greenhouse Section A',
        sensors: ['DHT11', 'LDR', 'SOIL_MOISTURE'],
        devices: ['fan', 'pump', 'led'],
        interval: 8000
    },
    {
        deviceId: 'esp32_greenhouse_002',
        location: 'Main Greenhouse Section B',
        sensors: ['DHT11', 'SOIL_MOISTURE', 'PH_SENSOR'],
        devices: ['pump', 'led'],
        interval: 10000
    },
    {
        deviceId: 'esp32_nursery_001',
        location: 'Nursery Area',
        sensors: ['DHT11', 'LDR', 'CO2_SENSOR'],
        devices: ['fan', 'led'],
        interval: 12000
    }
];

// Create and manage multiple ESP32 simulators
class MultiDeviceManager {
    constructor() {
        this.devices = [];
        this.isRunning = false;
    }

    addDevice(config) {
        const device = new ESP32Simulator(config);
        this.devices.push(device);
        return device;
    }

    startAll() {
        console.log('Starting all ESP32 device simulators...');
        this.isRunning = true;
        this.devices.forEach(device => device.start());
    }

    stopAll() {
        console.log('Stopping all ESP32 device simulators...');
        this.isRunning = false;
        this.devices.forEach(device => device.stop());
    }
}

// Export for use in other files
module.exports = { ESP32Simulator, MultiDeviceManager };

// Run directly if this file is executed
if (require.main === module) {
    const manager = new MultiDeviceManager();
    
    // Add all device configurations
    deviceConfigs.forEach(config => {
        manager.addDevice(config);
    });
    
    // Handle graceful shutdown
    process.on('SIGINT', () => {
        console.log('\nReceived SIGINT, shutting down all devices...');
        manager.stopAll();
        process.exit(0);
    });

    process.on('SIGTERM', () => {
        console.log('\nReceived SIGTERM, shutting down all devices...');
        manager.stopAll();
        process.exit(0);
    });

    // Start all devices
    manager.startAll();
}
