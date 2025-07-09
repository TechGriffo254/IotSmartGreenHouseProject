# 🚀 Koyeb Deployment Guide

## Prerequisites
- GitHub repository with your code (✅ Ready)
- MongoDB Atlas connection string
- Koyeb account

## Step 1: Prepare Environment Variables

You'll need to set these environment variables in Koyeb:

### Required Environment Variables:
```
NODE_ENV=production
PORT=8080
MONGODB_URI=your-mongodb-atlas-connection-string
JWT_SECRET=your-jwt-secret-key
FRONTEND_URL=https://your-frontend-domain.com
ESP32_PINCODE=123456
```

### Optional Alert Thresholds:
```
ALERT_THRESHOLD_TEMP_HIGH=35
ALERT_THRESHOLD_TEMP_LOW=15
ALERT_THRESHOLD_HUMIDITY_HIGH=80
ALERT_THRESHOLD_HUMIDITY_LOW=40
ALERT_THRESHOLD_SOIL_MOISTURE_LOW=300
ALERT_THRESHOLD_LIGHT_LOW=200
```

## Step 2: Deploy to Koyeb

### Via Koyeb Dashboard:

1. **Sign up/Login to Koyeb**: https://app.koyeb.com

2. **Create New App**:
   - Click "Create App"
   - Choose "GitHub" as source
   - Connect your GitHub account
   - Select repository: `TechGriffo254/IotSmartGreenHouseProject`
   - Branch: `master`

3. **Configure Build**:
   - Build command: `npm install`
   - Run command: `npm start`
   - Port: `8080` (Koyeb will set PORT env var)
   
   > **Note:** The root package.json now handles backend directory navigation automatically.

4. **Set Environment Variables**:
   ```
   NODE_ENV=production
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/greenhouse
   JWT_SECRET=your-super-secret-jwt-key-here
   ESP32_PINCODE=123456
   ```

5. **Deploy**:
   - Click "Deploy"
   - Wait for deployment to complete
   - Note the provided URL (e.g., https://your-app.koyeb.app)

## Step 3: Update Frontend Configuration

After deployment, update your frontend to connect to the new backend URL:

```javascript
// In frontend/src/services/api.js
const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'https://your-koyeb-app.koyeb.app'
  : 'http://localhost:5000';
```

## Step 4: Test ESP32 Connection

Update your ESP32 code to point to the new backend:
```cpp
const char* serverURL = "https://your-koyeb-app.koyeb.app/api/iot";
```

## Step 5: Verify Deployment

Test these endpoints:
- `GET https://your-koyeb-app.koyeb.app/` - Should return API info
- `POST https://your-koyeb-app.koyeb.app/api/iot` - For ESP32 data
- Socket.IO connection for real-time updates

## Troubleshooting

### Common Issues:

1. **Build Fails**:
   - Check if `package.json` is in the backend directory
   - Ensure all dependencies are listed
   - Check Node.js version compatibility

2. **App Crashes on Start**:
   - Verify MongoDB connection string
   - Check environment variables are set
   - Review app logs in Koyeb dashboard

3. **CORS Issues**:
   - Update CORS origin in server.js
   - Ensure frontend URL is whitelisted

4. **Database Connection**:
   - Verify MongoDB Atlas allows connections from anywhere (0.0.0.0/0)
   - Check connection string format
   - Ensure database user has proper permissions

## Production Checklist

- [ ] MongoDB Atlas connection working
- [ ] All environment variables set
- [ ] CORS configured for production domains
- [ ] JWT_SECRET set to secure value
- [ ] Backend deployed and running
- [ ] Frontend updated with production backend URL
- [ ] ESP32 code updated with production endpoints
- [ ] Real-time Socket.IO working
- [ ] Alert system functional
- [ ] Device control endpoints working

## URLs After Deployment

- **Backend API**: `https://your-koyeb-app.koyeb.app`
- **ESP32 Endpoint**: `https://your-koyeb-app.koyeb.app/api/iot`
- **Socket.IO**: `wss://your-koyeb-app.koyeb.app`

Your IoT Greenhouse Backend is now live! 🌱
