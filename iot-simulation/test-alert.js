const axios = require('axios');

// Test low light alert
async function testLowLightAlert() {
    const testData = {
        deviceId: 'ESP32_GREENHOUSE_001',
        greenhouseId: 'greenhouse-001',
        temperature: 25.5,
        humidity: 60.0,
        soilMoisture: 45.0,
        lightIntensity: 50,  // Low light to trigger alert
        timestamp: new Date().toISOString()
    };

    console.log('🚨 Testing low light alert:');
    console.log(JSON.stringify(testData, null, 2));

    try {
        const response = await axios.post('http://localhost:5000/api/iot', testData, {
            headers: {
                'Content-Type': 'application/json'
            },
            timeout: 5000
        });
        
        console.log('✅ Response:', response.status, response.statusText);
        console.log('📤 Response data:', response.data);
    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

testLowLightAlert();
