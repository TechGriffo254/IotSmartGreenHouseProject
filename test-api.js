// API Testing Script for Greenhouse IoT Backend
// Run this script with: node test-api.js

const baseURL = 'http://localhost:5000/api';

// Helper function to make HTTP requests
async function makeRequest(url, method = 'GET', data = null, headers = {}) {
  const config = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...headers
    }
  };

  if (data) {
    config.body = JSON.stringify(data);
  }

  try {
    const response = await fetch(url, config);
    const responseData = await response.json();
    
    console.log(`\n${method} ${url}`);
    console.log(`Status: ${response.status} ${response.statusText}`);
    console.log('Response:', JSON.stringify(responseData, null, 2));
    
    return { status: response.status, data: responseData };
  } catch (error) {
    console.error(`Error making request to ${url}:`, error.message);
    return { error: error.message };
  }
}

// Test functions
async function testHealthEndpoint() {
  console.log('\n=== Testing Health Endpoint ===');
  await makeRequest(`${baseURL}/health`);
}

async function testIoTSensorData() {
  console.log('\n=== Testing IoT Sensor Data POST ===');
  
  const sensorData = {
    deviceId: 'ESP32_001',
    sensorType: 'DHT11',
    temperature: 24.5,
    humidity: 65.2,
    greenhouseId: 'greenhouse-001',
    location: 'Main Greenhouse'
  };
  
  await makeRequest(`${baseURL}/iot/sensor-data`, 'POST', sensorData);
}

async function testRegisterUser() {
  console.log('\n=== Testing User Registration ===');
  
  const userData = {
    username: 'testuser',
    email: 'test@example.com',
    password: 'password123',
    role: 'operator'
  };
  
  return await makeRequest(`${baseURL}/auth/register`, 'POST', userData);
}

async function testLoginUser() {
  console.log('\n=== Testing User Login ===');
  
  const loginData = {
    username: 'testuser',
    password: 'password123'
  };
  
  return await makeRequest(`${baseURL}/auth/login`, 'POST', loginData);
}

async function testSensorDataWithAuth(token) {
  console.log('\n=== Testing Sensor Data GET (with auth) ===');
  
  const headers = {
    'Authorization': `Bearer ${token}`
  };
  
  await makeRequest(`${baseURL}/sensors/latest/greenhouse-001`, 'GET', null, headers);
}

async function testDeviceControl() {
  console.log('\n=== Testing Device Control POST ===');
  
  const controlData = {
    deviceId: 'RELAY_001',
    command: 'toggle',
    value: true,
    greenhouseId: 'greenhouse-001'
  };
  
  await makeRequest(`${baseURL}/iot/device-control`, 'POST', controlData);
}

// Main test runner
async function runTests() {
  console.log('🧪 Starting API Tests for Greenhouse IoT Backend');
  console.log('================================================');
  
  try {
    // Test 1: Health check
    await testHealthEndpoint();
    
    // Test 2: IoT sensor data (no auth required)
    await testIoTSensorData();
    
    // Test 3: Device control (no auth required)
    await testDeviceControl();
    
    // Test 4: User registration
    const registerResult = await testRegisterUser();
    
    // Test 5: User login
    const loginResult = await testLoginUser();
    
    // Test 6: Protected endpoint with auth
    if (loginResult.data && loginResult.data.token) {
      await testSensorDataWithAuth(loginResult.data.token);
    }
    
    // Test 7: Send multiple sensor readings
    console.log('\n=== Testing Multiple Sensor Types ===');
    
    const sensorTypes = [
      {
        deviceId: 'ESP32_001',
        sensorType: 'DHT11',
        temperature: 26.3,
        humidity: 62.8
      },
      {
        deviceId: 'ESP32_002',
        sensorType: 'LDR',
        lightIntensity: 750
      },
      {
        deviceId: 'ESP32_003',
        sensorType: 'SOIL_MOISTURE',
        soilMoisture: 45.2
      }
    ];
    
    for (const sensor of sensorTypes) {
      await makeRequest(`${baseURL}/iot/sensor-data`, 'POST', sensor);
    }
    
    console.log('\n✅ All tests completed!');
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
  }
}

// Check if fetch is available (Node.js 18+)
if (typeof fetch === 'undefined') {
  console.log('Installing node-fetch for Node.js versions < 18...');
  
  // For older Node.js versions, you might need to install node-fetch
  console.log('Please run: npm install node-fetch');
  console.log('Then uncomment the line below:');
  console.log('// const fetch = require("node-fetch");');
  
  // Uncomment this line if you're using Node.js < 18
  // const fetch = require('node-fetch');
}

// Run the tests
runTests();
