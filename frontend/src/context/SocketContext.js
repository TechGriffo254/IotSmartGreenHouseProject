import React, { createContext, useContext, useEffect, useState } from 'react';
import io from 'socket.io-client';
import { useAuth } from './AuthContext';
import toast from 'react-hot-toast';

const SocketContext = createContext();

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

  useEffect(() => {
    if (isAuthenticated && user) {
      // Initialize socket connection
      const newSocket = io('http://localhost:5000', {
        auth: {
          token: localStorage.getItem('token')
        }
      });

      newSocket.on('connect', () => {
        console.log('Connected to server');
        setConnected(true);
        // Join greenhouse room
        newSocket.emit('join-greenhouse', 'greenhouse-001');
        toast.success('Connected to greenhouse system');
      });

      newSocket.on('disconnect', () => {
        console.log('Disconnected from server');
        setConnected(false);
        toast.error('Disconnected from greenhouse system');
      });

      // Listen for sensor updates
      newSocket.on('sensorUpdate', (data) => {
        setSensorData(prevData => ({
          ...prevData,
          [data.sensorType]: data
        }));
      });

      // Listen for new alerts
      newSocket.on('newAlert', (alert) => {
        setAlerts(prevAlerts => [alert, ...prevAlerts]);
        
        // Show toast notification based on severity
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
        setAlerts(prevAlerts => 
          prevAlerts.map(a => a._id === alert._id ? alert : a)
        );
        toast.success(`Alert resolved: ${alert.alertType.replace('_', ' ')}`);
      });

      // Listen for device updates
      newSocket.on('deviceUpdate', (device) => {
        setDevices(prevDevices => 
          prevDevices.map(d => d.deviceId === device.deviceId ? device : d)
        );
      });

      // Listen for device additions
      newSocket.on('deviceAdded', (device) => {
        setDevices(prevDevices => [...prevDevices, device]);
        toast.success(`New device added: ${device.deviceName}`);
      });

      // Listen for device removal
      newSocket.on('deviceRemoved', ({ deviceId }) => {
        setDevices(prevDevices => 
          prevDevices.filter(d => d.deviceId !== deviceId)
        );
        toast.success('Device removed');
      });

      setSocket(newSocket);

      return () => {
        newSocket.close();
        setSocket(null);
        setConnected(false);
      };
    }
  }, [isAuthenticated, user]);

  const emitDeviceControl = (deviceId, action, payload = {}) => {
    if (socket && connected) {
      socket.emit('deviceControl', {
        deviceId,
        action,
        ...payload
      });
    }
  };

  const joinGreenhouse = (greenhouseId) => {
    if (socket && connected) {
      socket.emit('join-greenhouse', greenhouseId);
    }
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
    joinGreenhouse
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};
