const axios = require('axios');

// Simple test to verify ESP32 data format
async function testESP32API() {
  const testData = {
    deviceId: 'test_esp32_001',
    greenhouseId: 'greenhouse-001',
    temperature: 25.5,
    humidity: 60.0,
    soilMoisture: 45.2,
    lightIntensity: 150.0,
    timestamp: new Date().toISOString()
  };

  try {
    console.log('🧪 Testing ESP32 API endpoint...');
    console.log('📊 Sending test data:', JSON.stringify(testData, null, 2));
    
    const response = await axios.post('http://localhost:5000/api/iot', testData, {
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 5000
    });

    console.log('✅ API test successful!');
    console.log('📬 Response:', response.status, response.statusText);
    console.log('📄 Response data:', JSON.stringify(response.data, null, 2));
    
  } catch (error) {
    console.error('❌ API test failed:');
    console.error('Status:', error.response?.status);
    console.error('Message:', error.message);
    console.error('Response:', error.response?.data);
  }
}

testESP32API();
