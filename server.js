const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const http = require('http');
const socketIo = require('socket.io');
require('dotenv').config();

// Import routes
const sensorRoutes = require('./routes/sensorRoutes');
const deviceRoutes = require('./routes/deviceRoutes');
const alertRoutes = require('./routes/alertRoutes');
const authRoutes = require('./routes/authRoutes');
const iotRoutes = require('./routes/iotRoutes');
const settingsRoutes = require('./routes/settingsRoutes');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: process.env.NODE_ENV === 'production' 
      ? ["https://your-koyeb-app-name.koyeb.app", "https://localhost:3000", "http://localhost:3000"]
      : ["http://localhost:3000"],
    methods: ["GET", "POST"],
    credentials: true
  },
  allowEIO3: true,
  transports: ['websocket', 'polling'],
  pingTimeout: 60000,
  pingInterval: 25000
});

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://your-koyeb-app-name.koyeb.app', 'https://localhost:3000', 'http://localhost:3000'] 
    : ['http://localhost:3000'],
  credentials: true
}));

// Configure trust proxy more securely for development
if (process.env.NODE_ENV === 'production') {
  // In production, trust the first proxy (load balancer)
  app.set('trust proxy', 1);
} else {
  // In development, disable trust proxy to avoid rate limiting issues
  app.set('trust proxy', false);
}

// Rate limiting with proper trust proxy configuration
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  // Skip rate limiting in development to avoid proxy issues
  skip: (req) => process.env.NODE_ENV === 'development'
});
app.use(limiter);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Configure mongoose to disable buffering for better error handling
mongoose.set('bufferCommands', false);

// Add debug logging
console.log('Attempting to connect to MongoDB...');
console.log('MongoDB URI:', process.env.MONGODB_URI ? 'URI loaded' : 'URI not found');

// MongoDB connection with proper configuration
mongoose.connect(process.env.MONGODB_URI, {
  serverSelectionTimeoutMS: 30000, // 30 seconds
  socketTimeoutMS: 45000, // 45 seconds
  maxPoolSize: 10,
  minPoolSize: 5,
  maxIdleTimeMS: 30000,
  retryWrites: true,
  writeConcern: { w: 'majority' }
})
.then(() => {
  console.log('✅ Connected to MongoDB successfully');
  console.log('Database:', mongoose.connection.db.databaseName);
  
  // Only start the server after MongoDB connection is established
  const PORT = process.env.PORT || 5000;
  server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV}`);
  });
})
.catch(err => {
  console.error('❌ MongoDB connection error:', err.message);
  console.error('Please check:');
  console.error('1. Your IP is whitelisted in MongoDB Atlas');
  console.error('2. Your MongoDB URI is correct');
  console.error('3. Your network connection is working');
  process.exit(1);
});

// Handle MongoDB connection events
mongoose.connection.on('connected', () => {
  console.log('🔗 MongoDB connected event fired');
});

mongoose.connection.on('error', (err) => {
  console.error('❌ MongoDB connection error event:', err);
});

mongoose.connection.on('disconnected', () => {
  console.log('🔌 MongoDB disconnected');
});

mongoose.connection.on('disconnected', () => {
  console.log('MongoDB disconnected');
});

// Socket.IO connection handling
// Socket.IO connection handling with authentication
io.use(async (socket, next) => {
  try {
    const token = socket.handshake.auth.token;
    if (!token) {
      return next(new Error('Authentication token required'));
    }
    
    const jwt = require('jsonwebtoken');
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Attach user info to socket
    socket.userId = decoded.userId;
    socket.username = decoded.username;
    socket.role = decoded.role;
    
    console.log(`Socket authentication successful for user: ${decoded.username}`);
    next();
  } catch (error) {
    console.log('Socket authentication failed:', error.message);
    next(new Error('Authentication failed'));
  }
});

io.on('connection', (socket) => {
  console.log(`Client connected: ${socket.id} (User: ${socket.username})`);
  
  socket.on('join-greenhouse', (greenhouseId) => {
    socket.join(`greenhouse-${greenhouseId}`);
    console.log(`Client ${socket.id} (${socket.username}) joined greenhouse ${greenhouseId}`);
    
    // Send confirmation back to client
    socket.emit('greenhouse-joined', { 
      greenhouseId, 
      message: 'Successfully joined greenhouse',
      timestamp: new Date().toISOString()
    });
  });

  // Handle device control commands from frontend
  socket.on('device-control', async (data) => {
    try {
      const { deviceId, action, greenhouseId } = data;
      console.log(`🎛️ Device control command from ${socket.username}: ${deviceId} -> ${action}`);
      
      // Broadcast to ESP32 devices in the same greenhouse
      socket.to(`greenhouse-${greenhouseId}`).emit('deviceControl', {
        type: 'deviceControl',
        deviceId,
        action,
        userId: socket.userId,
        username: socket.username,
        timestamp: new Date().toISOString()
      });
      
      // Also broadcast to other frontend clients
      socket.to(`greenhouse-${greenhouseId}`).emit('device-control-update', {
        deviceId,
        action,
        user: socket.username,
        timestamp: new Date().toISOString()
      });
      
    } catch (error) {
      console.error('Device control error:', error);
      socket.emit('error', { message: 'Device control failed', error: error.message });
    }
  });

  socket.on('disconnect', (reason) => {
    console.log(`Client disconnected: ${socket.id} (${socket.username}) - Reason: ${reason}`);
  });
});

// Make io accessible to routes
app.set('io', io);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/sensors', sensorRoutes);
app.use('/api/devices', deviceRoutes);
app.use('/api/alerts', alertRoutes);
app.use('/api/iot', iotRoutes);
app.use('/api/settings', settingsRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  const dbStatus = mongoose.connection.readyState;
  const dbStatusText = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting'
  };

  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    database: {
      status: dbStatusText[dbStatus] || 'unknown',
      readyState: dbStatus,
      name: mongoose.connection.db?.databaseName || 'not connected'
    }
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.message : {}
  });
});

// Root endpoint - API welcome
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: '🌱 Smart Greenhouse IoT API',
    version: '1.0.0',
    status: 'Running',
    timestamp: new Date().toISOString(),
    endpoints: {
      health: '/api/health',
      sensors: '/api/sensors',
      devices: '/api/devices',
      alerts: '/api/alerts',
      iot: '/api/iot',
      auth: '/api/auth',
      settings: '/api/settings'
    },
    documentation: 'https://github.com/TechGriffo254/IotSmartGreenHouseProject'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// Server will be started after MongoDB connection is established
// See MongoDB connection promise above

module.exports = { app, io };
