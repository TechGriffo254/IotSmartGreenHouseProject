const axios = require('axios');

const testRegistration = async () => {
  try {
    console.log('Testing user registration...');
    
    const registrationData = {
      username: 'testuser',
      email: 'testuser@example.com',
      password: 'testpass123',
      role: 'operator'
    };

    console.log('Sending registration request with:', registrationData);

    const response = await axios.post('http://localhost:5000/api/auth/register', registrationData, {
      headers: {
        'Content-Type': 'application/json'
      }
    });

    console.log('Registration successful!');
    console.log('Response:', response.data);

  } catch (error) {
    console.error('Registration failed!');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Error data:', error.response.data);
    } else {
      console.error('Error:', error.message);
    }
  }
};

testRegistration();
