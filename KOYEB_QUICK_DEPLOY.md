# 🚀 Koyeb Deployment Steps

## Step 1: Prepare Your Repository

1. **Commit all changes to Git**:
   ```bash
   git add .
   git commit -m "Prepare backend for Koyeb deployment"
   git push origin main
   ```

## Step 2: Create Koyeb Account & App

1. Go to [koyeb.com](https://www.koyeb.com/) and sign up
2. Click "Create App"
3. Choose "GitHub" as source
4. Connect your GitHub account and select this repository
5. Set the **root directory** to: `backend`
6. Set **build command**: `npm install`
7. Set **run command**: `npm start`

## Step 3: Configure Environment Variables

In Koyeb's Environment Variables section, add:

```env
NODE_ENV=production
MONGODB_URI=mongodb+srv://mudenyogriffins:mudenyo9769%40ty@cluster0.mf2lmlp.mongodb.net/greenhouse?retryWrites=true&w=majority
JWT_SECRET=your_secure_jwt_secret_key_change_in_production
JWT_EXPIRE=7d
DEVICE_UPDATE_INTERVAL=5000
ALERT_THRESHOLD_TEMP_HIGH=35
ALERT_THRESHOLD_TEMP_LOW=15
ALERT_THRESHOLD_HUMIDITY_HIGH=80
ALERT_THRESHOLD_HUMIDITY_LOW=40
ALERT_THRESHOLD_SOIL_MOISTURE_LOW=30
ALERT_THRESHOLD_LIGHT_LOW=200
ESP32_PINCODE=123456
```

## Step 4: Deploy

1. Click "Deploy"
2. Wait for deployment to complete
3. Get your app URL (e.g., `https://your-app-name.koyeb.app`)

## Step 5: Update Frontend Configuration

Update your frontend's API base URL to point to the Koyeb URL:

```javascript
const API_BASE_URL = 'https://your-app-name.koyeb.app';
```

## Step 6: Test the Deployment

1. Test the API endpoints:
   - `GET https://your-app-name.koyeb.app/api/sensors`
   - `POST https://your-app-name.koyeb.app/api/iot`

2. Test ESP32 connections by updating the simulator URLs

## Important Notes:

- ⚠️ **Update CORS origins** in `server.js` with your actual Koyeb URL
- ⚠️ **Change JWT_SECRET** to a secure value
- ⚠️ **Update frontend** to use the new backend URL
- ✅ MongoDB Atlas is already configured and accessible from Koyeb
- ✅ All required dependencies are in package.json
