# 🚀 Koyeb Deployment Guide for IoT Greenhouse Backend

## 📋 Prerequisites

1. **Koyeb Account**: Sign up at [koyeb.com](https://www.koyeb.com/)
2. **GitHub Repository**: Your backend code should be in a GitHub repository
3. **MongoDB Atlas**: Already configured and running

## 🔧 Step 1: Prepare Backend for Deployment

### Update package.json
Make sure your `backend/package.json` has the correct start script:

```json
{
  "name": "greenhouse-backend",
  "version": "1.0.0",
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js"
  },
  "dependencies": {
    "express": "^4.18.2",
    "mongoose": "^7.5.0",
    "jsonwebtoken": "^9.0.2",
    "bcryptjs": "^2.4.3",
    "cors": "^2.8.5",
    "dotenv": "^16.3.1",
    "socket.io": "^4.7.2",
    "express-rate-limit": "^6.10.0",
    "helmet": "^7.0.0"
  }
}
```

### Environment Variables for Koyeb
In Koyeb, you'll need to set these environment variables:

```env
NODE_ENV=production
PORT=8000
MONGODB_URI=mongodb+srv://mudenyogriffins:mudenyo9769%40ty@cluster0.mf2lmlp.mongodb.net/greenhouse?retryWrites=true&w=majority
JWT_SECRET=your_jwt_secret_key_here_please_change_in_production
JWT_EXPIRE=7d
DEVICE_UPDATE_INTERVAL=5000
ALERT_THRESHOLD_TEMP_HIGH=35
ALERT_THRESHOLD_TEMP_LOW=15
ALERT_THRESHOLD_HUMIDITY_HIGH=80
ALERT_THRESHOLD_HUMIDITY_LOW=40
ALERT_THRESHOLD_SOIL_MOISTURE_LOW=30
ALERT_THRESHOLD_LIGHT_LOW=200
```

## 🚀 Step 2: Deploy to Koyeb

### Option A: Deploy from GitHub (Recommended)

1. **Login to Koyeb Dashboard**
2. **Click "Create App"**
3. **Choose "GitHub"** as source
4. **Select your repository** and branch (main/master)
5. **Configure deployment:**
   - **Name**: `greenhouse-backend`
   - **Region**: Choose closest to your location
   - **Instance Type**: `nano` (free tier) or `micro`
   - **Port**: `8000` (or use PORT environment variable)
   - **Health Check Path**: `/api/health`

6. **Set Environment Variables**: Add all the variables listed above
7. **Deploy**: Click "Create App"

### Option B: Deploy via Docker

1. Create `Dockerfile` in backend directory:
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 8000
CMD ["npm", "start"]
```

2. Deploy using Koyeb Docker option

## 📝 Step 3: Update ESP32 Configuration

Once deployed, update your ESP32 code with the Koyeb URL:

```cpp
// Backend server configuration
const char* backendHost = "your-app-name.koyeb.app";  // Replace with your Koyeb URL
const int backendPort = 443;  // HTTPS port for Koyeb
```

For HTTPS, you'll need to modify the HTTP client setup in Arduino:

```cpp
// Add to the top of your Arduino file
#include <WiFiClientSecure.h>

// In sendSensorDataToBackend() function:
WiFiClientSecure client;
client.setInsecure(); // For testing - in production, use proper certificates
HTTPClient http;
http.begin(client, "https://your-app-name.koyeb.app/api/iot");
```

## 🔍 Step 4: Verify Deployment

### Test Endpoints
1. **Health Check**: `https://your-app-name.koyeb.app/api/health`
2. **IoT Endpoint**: `https://your-app-name.koyeb.app/api/iot`

### ESP32 Testing
1. **Update Arduino code** with new Koyeb URL
2. **Upload to ESP32**
3. **Monitor serial output** for connection status
4. **Check Koyeb logs** for incoming requests

## 🔧 Step 5: Frontend Configuration

Update your frontend's API base URL to point to Koyeb:

In `frontend/src/services/api.js` or wherever you configure the API:
```javascript
const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'https://your-app-name.koyeb.app' 
  : 'http://localhost:5000';
```

## 📊 Monitoring & Logs

- **Koyeb Dashboard**: Monitor app performance, logs, and metrics
- **MongoDB Atlas**: Monitor database connections and queries
- **ESP32 Serial Monitor**: Check connection status and data transmission

## 🚨 Troubleshooting

### Common Issues:

1. **CORS Errors**: Ensure your frontend domain is allowed in CORS settings
2. **WebSocket Issues**: Koyeb supports WebSockets, but verify connection
3. **SSL Certificate**: Use proper certificates for production HTTPS
4. **Environment Variables**: Double-check all variables are set correctly

### Debug Steps:
1. Check Koyeb application logs
2. Test API endpoints with curl/Postman
3. Verify ESP32 can reach the Koyeb URL
4. Monitor MongoDB Atlas connections

## 💡 Production Best Practices

1. **Use proper SSL certificates** for WebSocket connections
2. **Set up monitoring** and alerts
3. **Configure auto-scaling** if needed
4. **Regular backups** of MongoDB data
5. **Security headers** and rate limiting
6. **Log rotation** and monitoring

Your IoT greenhouse backend will be accessible globally via Koyeb, allowing your ESP32 devices to connect from anywhere with internet access! 🌍
