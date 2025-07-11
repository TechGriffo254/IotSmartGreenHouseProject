import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import io from 'socket.io-client';
import { useAuth } from './AuthContext';
import toast from 'react-hot-toast';
import axios from 'axios';

const SocketContext = createContext();

// Poll interval in ms (15 seconds)
const POLL_INTERVAL = 15000;

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);
  const [sensorData, setSensorData] = useState({});
  const [alerts, setAlerts] = useState([]);
  const [devices, setDevices] = useState([]);
  const { user, isAuthenticated } = useAuth();
  const pollingIntervalRef = useRef(null);
  const [lastRefresh, setLastRefresh] = useState(Date.now());

  // Function to fetch all initial data
  const fetchAllData = async () => {
    console.log('🔄 Fetching initial data from server...');
    try {
      // Fetch devices
      const deviceResponse = await axios.get('/api/devices/greenhouse-001');
      if (deviceResponse.data.success) {
        console.log('📱 Devices fetched:', deviceResponse.data.data.length);
        setDevices(deviceResponse.data.data);
      }

      // Fetch latest sensor data
      const sensorResponse = await axios.get('/api/sensors/latest/greenhouse-001');
      if (sensorResponse.data.success) {
        const sensorMap = {};
        sensorResponse.data.data.forEach(sensor => {
          sensorMap[sensor.sensorType] = sensor;
        });
        console.log('📊 Sensors fetched:', Object.keys(sensorMap).length);
        setSensorData(sensorMap);
      }

      // Fetch active alerts
      const alertResponse = await axios.get('/api/alerts/active/greenhouse-001');
      if (alertResponse.data.success) {
        console.log('⚠️ Alerts fetched:', alertResponse.data.data.length);
        setAlerts(alertResponse.data.data);
      }
      
      // Update the last refresh timestamp
      setLastRefresh(Date.now());
    } catch (error) {
      console.error('Error fetching initial data:', error);
    }
  };
  
  // Set up polling as a fallback for real-time updates
  useEffect(() => {
    if (isAuthenticated && !pollingIntervalRef.current) {
      console.log('⏱️ Setting up polling interval for data refresh');
      
      pollingIntervalRef.current = setInterval(() => {
        if (Date.now() - lastRefresh > POLL_INTERVAL) {
          console.log('⏱️ Polling: Refreshing data...');
          fetchAllData();
        }
      }, POLL_INTERVAL);
    }
    
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
    };
  }, [isAuthenticated, lastRefresh]);

  useEffect(() => {
    if (isAuthenticated && user && localStorage.getItem('token') && !socket) {
      console.log('🔌 Creating socket connection for user:', user.username);
      
      // Use the same host as the current page to avoid CORS issues
      const host = window.location.hostname === 'localhost' 
        ? 'http://localhost:5000'
        : 'https://open-lauryn-ina-9662925b.koyeb.app';
      
      const newSocket = io(host, {
        auth: {
          token: localStorage.getItem('token')
        },
        transports: ['websocket', 'polling'],
        timeout: 20000,
        reconnection: true,
        reconnectionDelay: 2000,
        reconnectionAttempts: 5
      });

      newSocket.on('connect', async () => {
        console.log('✅ Socket connected successfully');
        setConnected(true);
        newSocket.emit('join-greenhouse', 'greenhouse-001');
        toast.success('Connected to greenhouse system');
        
        // Fetch fresh data when socket connects
        await fetchAllData();
      });

      newSocket.on('connect_error', (error) => {
        console.error('❌ Socket connection error:', error.message);
        setConnected(false);
        toast.error('Connection failed: ' + error.message);
      });

      newSocket.on('greenhouse-joined', (data) => {
        console.log('🏠 Joined greenhouse:', data.greenhouseId);
        // Fetch fresh data when joining a greenhouse
        fetchAllData();
      });

      newSocket.on('disconnect', (reason) => {
        console.log('🔌 Socket disconnected:', reason);
        setConnected(false);
        if (reason !== 'io client disconnect' && reason !== 'client namespace disconnect') {
          toast.error('Connection lost: ' + reason);
        }
      });

      // Listen for sensor updates
      newSocket.on('sensorUpdate', (data) => {
        console.log('📡 Sensor update received:', data.sensorType);
        setSensorData(prevData => ({
          ...prevData,
          [data.sensorType]: data
        }));
      });

      // Listen for comprehensive sensor updates from ESP32
      newSocket.on('allSensorsUpdate', (data) => {
        console.log('📊 All sensors update received');
        
        // Update all sensor readings at once
        setSensorData(prevData => ({
          ...prevData,
          temperature: {
            type: 'temperature',
            value: data.temperature,
            unit: '°C',
            timestamp: data.timestamp
          },
          humidity: {
            type: 'humidity',
            value: data.humidity,
            unit: '%',
            timestamp: data.timestamp
          },
          soilMoisture: {
            type: 'soilMoisture',
            value: data.soilMoisture,
            unit: 'raw',
            timestamp: data.timestamp
          },
          lightLevel: {
            type: 'lightLevel',
            value: data.lightIntensity,
            unit: 'lux',
            timestamp: data.timestamp
          },
          waterLevel: {
            type: 'waterLevel',
            value: data.waterLevel,
            unit: 'cm',
            timestamp: data.timestamp
          }
        }));
      });

      // Listen for new alerts
      newSocket.on('newAlert', (alert) => {
        console.log('⚠️ New alert received:', alert.alertType);
        setAlerts(prevAlerts => [alert, ...prevAlerts]);
        
        const message = `${alert.alertType.replace('_', ' ')}: ${alert.message}`;
        
        switch (alert.severity) {
          case 'CRITICAL':
            toast.error(message, { duration: 8000 });
            break;
          case 'HIGH':
            toast.error(message, { duration: 6000 });
            break;
          case 'MEDIUM':
            toast((t) => (
              <div className="flex items-center">
                <div className="mr-2">⚠️</div>
                <div>{message}</div>
              </div>
            ), { duration: 4000 });
            break;
          default:
            toast(message, { duration: 3000 });
        }
      });

      // Listen for alert resolution
      newSocket.on('alertResolved', (alert) => {
        console.log('✅ Alert resolved:', alert.alertType);
        setAlerts(prevAlerts => 
          prevAlerts.map(a => a._id === alert._id ? alert : a)
        );
        toast.success(`Alert resolved: ${alert.alertType.replace('_', ' ')}`);
      });

      // Listen for device updates
      newSocket.on('deviceUpdate', (device) => {
        console.log('📱 Device update received:', device.deviceId);
        setDevices(prevDevices => 
          prevDevices.map(d => d.deviceId === device.deviceId ? device : d)
        );
      });

      // Listen for device-control-update (from the server.js emitter)
      newSocket.on('device-control-update', (data) => {
        console.log('🎮 Device control update received:', data.deviceId, data.action);
        // Update the specific device immediately
        if (data.deviceId) {
          setDevices(prevDevices => 
            prevDevices.map(d => d.deviceId === data.deviceId 
              ? { ...d, status: data.action === 'ON' ? 'ON' : 'OFF' } 
              : d
            )
          );
        }
        // Then refresh all devices to ensure consistency
        fetchAllData();
      });

      // Listen for deviceControlled (alternative event name)
      newSocket.on('deviceControlled', (data) => {
        console.log('🎮 Device controlled:', data.device?.deviceId);
        // Update the specific device immediately if we have the data
        if (data.device) {
          setDevices(prevDevices => 
            prevDevices.map(d => d.deviceId === data.device.deviceId 
              ? { ...d, ...data.device } 
              : d
            )
          );
        }
        // Then refresh all devices to ensure consistency
        fetchAllData();
      });

      // Listen for device additions
      newSocket.on('deviceAdded', (device) => {
        console.log('➕ Device added:', device.deviceName);
        setDevices(prevDevices => [...prevDevices, device]);
        toast.success(`New device added: ${device.deviceName}`);
      });

      // Listen for device removal
      newSocket.on('deviceRemoved', ({ deviceId }) => {
        console.log('➖ Device removed:', deviceId);
        setDevices(prevDevices => 
          prevDevices.filter(d => d.deviceId !== deviceId)
        );
        toast.success('Device removed');
      });

      // Add a reconnect handler to refresh data
      newSocket.io.on("reconnect", () => {
        console.log('🔄 Socket reconnected, refreshing data...');
        fetchAllData();
      });

      setSocket(newSocket);
    } else if (!isAuthenticated && socket) {
      console.log('🔌 User logged out, cleaning up socket');
      socket.close();
      setSocket(null);
      setConnected(false);
    }

    return () => {
      // Cleanup on unmount
      if (socket) {
        socket.close();
      }
    };
  }, [isAuthenticated, user?.username]); // eslint-disable-line react-hooks/exhaustive-deps

  const emitDeviceControl = (deviceId, action, payload = {}) => {
    if (socket && connected) {
      console.log('🎮 Emitting device control:', deviceId, action);
      socket.emit('device-control', {
        deviceId,
        action,
        greenhouseId: 'greenhouse-001', // Add greenhouseId required by the backend
        ...payload
      });
    }
  };

  const joinGreenhouse = (greenhouseId) => {
    if (socket && connected) {
      socket.emit('join-greenhouse', greenhouseId);
    }
  };

  // Function to manually refresh all data
  const refreshAllData = () => {
    if (connected) {
      console.log('🔄 Manually refreshing all data...');
      return fetchAllData();
    }
    return Promise.resolve();
  };

  const value = {
    socket,
    connected,
    sensorData,
    alerts,
    devices,
    setSensorData,
    setAlerts,
    setDevices,
    emitDeviceControl,
    joinGreenhouse,
    refreshAllData
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};
