const axios = require('axios');
const WebSocket = require('ws');
require('dotenv').config();

class GreenhouseSimulator {
    constructor() {
        this.deviceId = process.env.DEVICE_ID || 'greenhouse_001';
        this.backendUrl = process.env.BACKEND_URL || 'http://localhost:5000';
        this.interval = parseInt(process.env.SIMULATION_INTERVAL) || 5000;
        this.debug = process.env.DEBUG === 'true';
        
        // Sensor ranges
        this.ranges = {
            temperature: {
                min: parseFloat(process.env.TEMP_MIN) || 15,
                max: parseFloat(process.env.TEMP_MAX) || 35
            },
            humidity: {
                min: parseFloat(process.env.HUMIDITY_MIN) || 40,
                max: parseFloat(process.env.HUMIDITY_MAX) || 80
            },
            light: {
                min: parseFloat(process.env.LIGHT_MIN) || 0,
                max: parseFloat(process.env.LIGHT_MAX) || 100
            },
            soilMoisture: {
                min: parseFloat(process.env.SOIL_MOISTURE_MIN) || 20,
                max: parseFloat(process.env.SOIL_MOISTURE_MAX) || 80
            }
        };

        // Current sensor states
        this.currentState = {
            temperature: 22,
            humidity: 60,
            light: 50,
            soilMoisture: 45,
            fanStatus: false,
            pumpStatus: false,
            ledStatus: false
        };

        // Simulation trends
        this.trends = {
            temperature: 0.1,
            humidity: -0.2,
            light: 0.5,
            soilMoisture: -0.1
        };

        this.isRunning = false;
        this.intervalId = null;
    }

    log(message) {
        if (this.debug) {
            console.log(`[${new Date().toISOString()}] ${message}`);
        }
    }

    generateRealisticValue(sensorType, currentValue) {
        const range = this.ranges[sensorType];
        const trend = this.trends[sensorType];
        
        // Add some randomness and trend
        let newValue = currentValue + trend + (Math.random() - 0.5) * 2;
        
        // Apply realistic constraints
        if (newValue < range.min) {
            newValue = range.min + Math.random() * 2;
            this.trends[sensorType] = Math.abs(this.trends[sensorType]);
        } else if (newValue > range.max) {
            newValue = range.max - Math.random() * 2;
            this.trends[sensorType] = -Math.abs(this.trends[sensorType]);
        }

        // Occasionally change trend
        if (Math.random() < 0.1) {
            this.trends[sensorType] = (Math.random() - 0.5) * 0.5;
        }

        return Math.round(newValue * 100) / 100;
    }

    simulateDeviceEffects() {
        // Fan affects temperature and humidity
        if (this.currentState.fanStatus) {
            this.currentState.temperature = Math.max(
                this.currentState.temperature - 0.5,
                this.ranges.temperature.min
            );
            this.currentState.humidity = Math.max(
                this.currentState.humidity - 0.3,
                this.ranges.humidity.min
            );
        }

        // Water pump affects soil moisture
        if (this.currentState.pumpStatus) {
            this.currentState.soilMoisture = Math.min(
                this.currentState.soilMoisture + 1.0,
                this.ranges.soilMoisture.max
            );
        }

        // LED affects light levels
        if (this.currentState.ledStatus) {
            this.currentState.light = Math.min(
                this.currentState.light + 0.8,
                this.ranges.light.max
            );
        }
    }

    generateSensorData() {
        // Apply device effects first
        this.simulateDeviceEffects();

        // Generate new sensor values
        this.currentState.temperature = this.generateRealisticValue('temperature', this.currentState.temperature);
        this.currentState.humidity = this.generateRealisticValue('humidity', this.currentState.humidity);
        this.currentState.light = this.generateRealisticValue('light', this.currentState.light);
        this.currentState.soilMoisture = this.generateRealisticValue('soilMoisture', this.currentState.soilMoisture);

        return {
            deviceId: this.deviceId,
            timestamp: new Date().toISOString(),
            sensors: {
                temperature: this.currentState.temperature,
                humidity: this.currentState.humidity,
                light: this.currentState.light,
                soilMoisture: this.currentState.soilMoisture
            },
            devices: {
                fan: this.currentState.fanStatus,
                pump: this.currentState.pumpStatus,
                led: this.currentState.ledStatus
            }
        };
    }

    async sendSensorData(data) {
        try {
            const response = await axios.post(`${this.backendUrl}/api/sensors`, data, {
                headers: {
                    'Content-Type': 'application/json'
                },
                timeout: 5000
            });
            
            this.log(`Sensor data sent successfully: ${JSON.stringify(data.sensors)}`);
            return response.data;
        } catch (error) {
            console.error('Error sending sensor data:', error.message);
            if (error.response) {
                console.error('Response data:', error.response.data);
            }
        }
    }

    async checkDeviceCommands() {
        try {
            const response = await axios.get(`${this.backendUrl}/api/devices`, {
                timeout: 5000
            });
            
            if (response.data && response.data.length > 0) {
                const latestCommands = response.data.filter(device => device.deviceId === this.deviceId);
                
                latestCommands.forEach(command => {
                    if (command.deviceType === 'fan') {
                        this.currentState.fanStatus = command.status;
                        this.log(`Fan ${command.status ? 'ON' : 'OFF'}`);
                    } else if (command.deviceType === 'pump') {
                        this.currentState.pumpStatus = command.status;
                        this.log(`Pump ${command.status ? 'ON' : 'OFF'}`);
                    } else if (command.deviceType === 'led') {
                        this.currentState.ledStatus = command.status;
                        this.log(`LED ${command.status ? 'ON' : 'OFF'}`);
                    }
                });
            }
        } catch (error) {
            console.error('Error checking device commands:', error.message);
        }
    }

    async simulationLoop() {
        if (!this.isRunning) return;

        try {
            // Check for device commands
            await this.checkDeviceCommands();

            // Generate and send sensor data
            const sensorData = this.generateSensorData();
            await this.sendSensorData(sensorData);

            // Log current state
            if (this.debug) {
                console.log('Current State:', {
                    sensors: sensorData.sensors,
                    devices: sensorData.devices
                });
            }

        } catch (error) {
            console.error('Error in simulation loop:', error.message);
        }

        // Schedule next iteration
        this.intervalId = setTimeout(() => this.simulationLoop(), this.interval);
    }

    start() {
        if (this.isRunning) {
            console.log('Simulator is already running');
            return;
        }

        console.log(`Starting IoT Greenhouse Simulator...`);
        console.log(`Device ID: ${this.deviceId}`);
        console.log(`Backend URL: ${this.backendUrl}`);
        console.log(`Simulation Interval: ${this.interval}ms`);
        console.log('Sensor Ranges:', this.ranges);

        this.isRunning = true;
        this.simulationLoop();
    }

    stop() {
        if (!this.isRunning) {
            console.log('Simulator is not running');
            return;
        }

        console.log('Stopping IoT Greenhouse Simulator...');
        this.isRunning = false;
        
        if (this.intervalId) {
            clearTimeout(this.intervalId);
            this.intervalId = null;
        }
    }

    // Manual device control for testing
    setDeviceStatus(deviceType, status) {
        if (deviceType === 'fan') {
            this.currentState.fanStatus = status;
        } else if (deviceType === 'pump') {
            this.currentState.pumpStatus = status;
        } else if (deviceType === 'led') {
            this.currentState.ledStatus = status;
        }
        this.log(`Manual control: ${deviceType} ${status ? 'ON' : 'OFF'}`);
    }
}

// Export for use in other files
module.exports = GreenhouseSimulator;

// Run directly if this file is executed
if (require.main === module) {
    const simulator = new GreenhouseSimulator();
    
    // Handle graceful shutdown
    process.on('SIGINT', () => {
        console.log('\nReceived SIGINT, shutting down gracefully...');
        simulator.stop();
        process.exit(0);
    });

    process.on('SIGTERM', () => {
        console.log('\nReceived SIGTERM, shutting down gracefully...');
        simulator.stop();
        process.exit(0);
    });

    // Start the simulator
    simulator.start();
}
