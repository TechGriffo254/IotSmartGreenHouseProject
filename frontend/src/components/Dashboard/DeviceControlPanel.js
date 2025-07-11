import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { Power, RotateCcw, Settings, Clock, Droplets, Wind, Sun, ChevronUp, ChevronDown } from 'lucide-react';
import { useSocket } from '../../context/SocketContext';

const DeviceControlPanel = () => {
  const [controlHistory, setControlHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedDevices, setExpandedDevices] = useState({});
  const [allAutoMode, setAllAutoMode] = useState(false);
  const { 
    socket, 
    connected, 
    devices, 
    setDevices,
    emitDeviceControl,
    refreshAllData 
  } = useSocket();
  const [lastSensorData, setLastSensorData] = useState({
    temperature: null,
    humidity: null,
    soilMoisture: null,
    lightIntensity: null,
    waterLevel: null,
  });

  // Load devices function with useCallback
  const loadDevices = useCallback(async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/devices/greenhouse-001');
      if (response.data.success) {
        setDevices(response.data.data);
        // Check if any device is in auto mode to update the global state
        const anyAutoMode = response.data.data.some(device => device.autoMode);
        setAllAutoMode(anyAutoMode);
      }
      setLoading(false);
    } catch (error) {
      setLoading(false);
      const message = error.response?.data?.message || 'Failed to load devices';
      toast.error(message);
    }
  }, [setDevices, setAllAutoMode]);

  // Load control history function with useCallback
  const loadControlHistory = useCallback(async () => {
    try {
      const response = await axios.get('/api/devices/control-history/greenhouse-001');
      if (response.data.success) {
        setControlHistory(response.data.data);
      }
    } catch (error) {
      console.error('Failed to load control history:', error);
      toast.error('Failed to load device history');
    }
  }, [setControlHistory]);

  // Control device function with useCallback
  const controlDevice = useCallback(async (deviceId, action, value) => {
    try {
      console.log(`🎮 Controlling device ${deviceId}: ${action} ${value !== undefined ? value : ''}`);
      
      // Emit the control action via socket for real-time response
      emitDeviceControl(deviceId, action, value !== undefined ? { value } : {});
      
      // Optimistically update UI
      setDevices(prevDevices => 
        prevDevices.map(device => {
          if (device.deviceId === deviceId) {
            let updatedDevice = { ...device };
            
            // Update status based on action
            if (action === 'turn_on') updatedDevice.status = 'ON';
            else if (action === 'turn_off') updatedDevice.status = 'OFF';
            else if (action === 'open') updatedDevice.status = 'OPEN';
            else if (action === 'close') updatedDevice.status = 'CLOSED';
            else if (action === 'set_auto_mode') updatedDevice.autoMode = value !== undefined ? value : !device.autoMode;
            else if (action === 'set_intensity' && value !== undefined) updatedDevice.intensity = value;
            
            return updatedDevice;
          }
          return device;
        })
      );
      
      // Also make API call for server state persistence
      const payload = value !== undefined ? { action, value } : { action };
      const response = await axios.post(`/api/devices/control/${deviceId}`, payload);
      
      if (response.data.success) {
        toast.success(`${action.replace('_', ' ')} successful`);
        // Refresh data to ensure UI is in sync with server
        await loadDevices();
        await loadControlHistory();
      }
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to control device';
      toast.error(message);
      // Reload actual state from server on error
      await loadDevices();
    }
  }, [emitDeviceControl, setDevices, loadDevices, loadControlHistory]);

  // Handle device updates from socket with useCallback
  const handleDeviceUpdate = useCallback((updatedDevice) => {
    console.log('📱 Device update in DeviceControlPanel:', updatedDevice.deviceId);
    setDevices(prevDevices => 
      prevDevices.map(device => 
        device.deviceId === updatedDevice.deviceId 
          ? { ...device, ...updatedDevice } 
          : device
      )
    );
  }, [setDevices]);

  // Handle sensor updates from socket
  const handleSensorUpdate = useCallback((sensorData) => {
    setLastSensorData(prev => ({
      ...prev,
      [sensorData.type]: sensorData.value
    }));
  }, []);

  // Handle all sensors update from socket
  const handleAllSensorsUpdate = useCallback((allData) => {
    setLastSensorData({
      temperature: allData.temperature,
      humidity: allData.humidity,
      soilMoisture: allData.soilMoisture,
      lightIntensity: allData.lightIntensity,
      waterLevel: allData.waterLevel
    });
  }, []);

  // Toggle device expansion
  const toggleDeviceExpand = (deviceId) => {
    setExpandedDevices(prev => ({
      ...prev,
      [deviceId]: !prev[deviceId]
    }));
  };

  // Initial load and socket setup
  useEffect(() => {
    loadDevices();
    loadControlHistory();

    // Set up socket listeners for real-time updates
    if (socket) {
      console.log('🔄 Setting up socket event listeners in DeviceControlPanel');
      
      socket.on('deviceUpdate', handleDeviceUpdate);
      socket.on('sensorUpdate', handleSensorUpdate);
      socket.on('allSensorsUpdate', handleAllSensorsUpdate);
      socket.on('device-control-update', (data) => {
        console.log('🎮 Device control update in panel:', data);
        loadDevices();
        loadControlHistory();
      });
      socket.on('deviceControlled', (data) => {
        console.log('🎮 Device controlled event in panel');
        loadDevices();
        loadControlHistory();
      });
      
      return () => {
        socket.off('deviceUpdate', handleDeviceUpdate);
        socket.off('sensorUpdate', handleSensorUpdate);
        socket.off('allSensorsUpdate', handleAllSensorsUpdate);
        socket.off('device-control-update');
        socket.off('deviceControlled');
      };
    }
  }, [socket, handleDeviceUpdate, loadDevices, loadControlHistory, handleSensorUpdate, handleAllSensorsUpdate]);

  // Effect to monitor connection status
  useEffect(() => {
    if (connected) {
      loadDevices();
      loadControlHistory();
    }
  }, [connected, loadDevices, loadControlHistory]);

  // loadDevices function is defined above with useCallback

  const setupIoTDevices = async () => {
    try {
      const response = await axios.post('/api/devices/setup-iot-devices-public');
      if (response.data.success) {
        toast.success(response.data.message);
        await loadDevices();
      }
    } catch (error) {
      toast.error('Failed to setup IoT devices');
    }
  };

  const getDeviceIcon = (deviceType) => {
    switch (deviceType) {
      case 'WATER_PUMP': return <Droplets className="h-6 w-6 text-blue-500" />;
      case 'WATER_VALVE': return <Droplets className="h-6 w-6 text-cyan-500" />;
      case 'SERVO':
      case 'WINDOW': return <ChevronUp className="h-6 w-6 text-green-500" />;
      case 'FAN': return <Wind className="h-6 w-6 text-gray-500" />;
      case 'LED_LIGHT': return <Sun className="h-6 w-6 text-yellow-500" />;
      case 'HEATER': return <Sun className="h-6 w-6 text-red-500" />;
      default: return <Power className="h-6 w-6 text-gray-500" />;
    }
  };
  
  // Set auto mode for all devices
  const setGlobalAutoMode = async (autoMode) => {
    try {
      // Update UI optimistically
      setAllAutoMode(autoMode);
      setDevices(prevDevices => 
        prevDevices.map(device => ({...device, autoMode}))
      );
      
      // Make API call to update all devices
      const response = await axios.post('/api/devices/set-all-auto-mode', { autoMode });
      if (response.data.success) {
        toast.success(`Auto mode ${autoMode ? 'enabled' : 'disabled'} for all devices`);
        await loadDevices();
      }
    } catch (error) {
      toast.error('Failed to update auto mode');
      await loadDevices(); // Reload actual state from server
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'ON': return 'text-green-600 bg-green-100';
      case 'OFF': return 'text-gray-600 bg-gray-100';
      case 'OPEN': return 'text-blue-600 bg-blue-100';
      case 'CLOSED': return 'text-gray-600 bg-gray-100';
      case 'AUTO': return 'text-purple-600 bg-purple-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading devices...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Sensors Summary */}
      <div className="bg-gradient-to-r from-green-700 to-green-500 rounded-lg shadow-lg p-6 text-white">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold">Greenhouse Control Center</h1>
            <p className="opacity-80">Manage and monitor your smart greenhouse devices</p>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => setGlobalAutoMode(!allAutoMode)}
              className={`px-4 py-2 rounded-lg flex items-center ${
                allAutoMode 
                  ? 'bg-purple-700 hover:bg-purple-800' 
                  : 'bg-white/20 hover:bg-white/30'
              }`}
            >
              <Settings className="h-4 w-4 mr-2" />
              {allAutoMode ? 'Auto Mode: On' : 'Auto Mode: Off'}
            </button>
            <button
              onClick={setupIoTDevices}
              className="bg-white text-green-700 px-4 py-2 rounded-lg hover:bg-green-100 flex items-center"
            >
              <Power className="h-4 w-4 mr-2" />
              Setup Devices
            </button>
          </div>
        </div>

        {/* Sensor Data Summary */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-4">
          <div className="bg-white/10 p-3 rounded-lg backdrop-blur-sm">
            <div className="text-xs uppercase opacity-70">Temperature</div>
            <div className="text-xl font-bold">{lastSensorData.temperature !== null ? `${lastSensorData.temperature}°C` : '--°C'}</div>
          </div>
          <div className="bg-white/10 p-3 rounded-lg backdrop-blur-sm">
            <div className="text-xs uppercase opacity-70">Humidity</div>
            <div className="text-xl font-bold">{lastSensorData.humidity !== null ? `${lastSensorData.humidity}%` : '--%'}</div>
          </div>
          <div className="bg-white/10 p-3 rounded-lg backdrop-blur-sm">
            <div className="text-xs uppercase opacity-70">Soil Moisture</div>
            <div className="text-xl font-bold">{lastSensorData.soilMoisture !== null ? lastSensorData.soilMoisture : '--'}</div>
          </div>
          <div className="bg-white/10 p-3 rounded-lg backdrop-blur-sm">
            <div className="text-xs uppercase opacity-70">Light Level</div>
            <div className="text-xl font-bold">{lastSensorData.lightIntensity !== null ? lastSensorData.lightIntensity : '--'}</div>
          </div>
          <div className="bg-white/10 p-3 rounded-lg backdrop-blur-sm">
            <div className="text-xs uppercase opacity-70">Water Level</div>
            <div className="text-xl font-bold">{lastSensorData.waterLevel !== null ? `${lastSensorData.waterLevel}cm` : '--cm'}</div>
          </div>
        </div>
      </div>

      {/* Devices Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {devices.map((device) => (
          <div 
            key={device.deviceId} 
            className={`bg-white rounded-lg shadow-md border transition-all ${
              (device.status === 'ON' || device.status === 'OPEN') 
                ? 'border-green-300 shadow-green-100' 
                : 'border-gray-200'
            }`}
          >
            <div 
              className="p-5 cursor-pointer"
              onClick={() => toggleDeviceExpand(device.deviceId)}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center">
                  <div className={`p-2 rounded-lg mr-3 ${
                    (device.status === 'ON' || device.status === 'OPEN') 
                      ? 'bg-green-100' 
                      : 'bg-gray-100'
                  }`}>
                    {getDeviceIcon(device.deviceType)}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{device.deviceName}</h3>
                    <p className="text-sm text-gray-600">{device.deviceType.replace('_', ' ')}</p>
                  </div>
                </div>
                <div className="flex items-center">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(device.status)}`}>
                    {device.status}
                  </span>
                  <div className="ml-2">
                    {expandedDevices[device.deviceId] ? 
                      <ChevronUp className="h-5 w-5 text-gray-400" /> : 
                      <ChevronDown className="h-5 w-5 text-gray-400" />
                    }
                  </div>
                </div>
              </div>
              
              {/* Quick Controls - Always Visible */}
              <div className="flex flex-wrap gap-2 mt-3">
                {(['WINDOW', 'SERVO'].includes(device.deviceType)) ? (
                  <>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        controlDevice(device.deviceId, 'open');
                      }}
                      className="flex-1 bg-blue-50 text-blue-700 px-3 py-2 rounded-md text-sm font-medium hover:bg-blue-100 flex items-center justify-center"
                    >
                      <ChevronUp className="h-4 w-4 mr-1" />
                      Open
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        controlDevice(device.deviceId, 'close');
                      }}
                      className="flex-1 bg-gray-50 text-gray-700 px-3 py-2 rounded-md text-sm font-medium hover:bg-gray-100 flex items-center justify-center"
                    >
                      <ChevronDown className="h-4 w-4 mr-1" />
                      Close
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        controlDevice(device.deviceId, 'turn_on');
                      }}
                      className="flex-1 bg-green-50 text-green-700 px-3 py-2 rounded-md text-sm font-medium hover:bg-green-100 flex items-center justify-center"
                    >
                      <Power className="h-4 w-4 mr-1" />
                      On
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        controlDevice(device.deviceId, 'turn_off');
                      }}
                      className="flex-1 bg-gray-50 text-gray-700 px-3 py-2 rounded-md text-sm font-medium hover:bg-gray-100 flex items-center justify-center"
                    >
                      <Power className="h-4 w-4 mr-1" />
                      Off
                    </button>
                  </>
                )}
              </div>
            </div>
            
            {/* Extended Controls - Visible when expanded */}
            {expandedDevices[device.deviceId] && (
              <div className="px-5 pb-5 pt-2 border-t border-gray-100">
                <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                  <div>
                    <span className="text-gray-600">Power Consumption:</span>
                    <span className="ml-2 font-medium">{device.powerConsumption}W</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Location:</span>
                    <span className="ml-2 font-medium">{device.location}</span>
                  </div>
                  {device.intensity !== undefined && (
                    <div className="col-span-2">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">Intensity:</span>
                        <span className="font-medium">{device.intensity}%</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={device.intensity}
                        onChange={(e) => controlDevice(device.deviceId, 'set_intensity', parseInt(e.target.value))}
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer mt-1"
                      />
                    </div>
                  )}
                </div>
                
                <div className="flex items-center justify-between mt-2">
                  <button
                    onClick={() => controlDevice(device.deviceId, 'set_auto_mode', !device.autoMode)}
                    className={`text-sm px-3 py-1 rounded-md font-medium flex items-center ${
                      device.autoMode 
                        ? 'bg-purple-100 text-purple-700 hover:bg-purple-200' 
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    <Settings className="h-4 w-4 mr-1" />
                    {device.autoMode ? 'Auto: On' : 'Auto: Off'}
                  </button>
                  <div className="text-xs text-gray-500">
                    <span className="font-medium">Last Updated:</span> {new Date(device.updatedAt || Date.now()).toLocaleTimeString()}
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {devices.length === 0 && (
        <div className="bg-white rounded-lg shadow-md p-12 text-center">
          <Power className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No devices found</h3>
          <p className="text-gray-600 mb-6">
            Setup your IoT devices to start controlling them from the dashboard
          </p>
          <button
            onClick={setupIoTDevices}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
          >
            Setup IoT Devices
          </button>
        </div>
      )}

      {/* Control History */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <Clock className="h-5 w-5 text-gray-600 mr-2" />
            <h2 className="text-lg font-semibold text-gray-900">Real-Time Device History</h2>
          </div>
          <button 
            onClick={() => {
              refreshAllData(); // Use the context's refreshAllData function
              loadControlHistory();
            }}
            className="text-blue-600 hover:text-blue-800 text-sm flex items-center"
          >
            <RotateCcw className="h-4 w-4 mr-1" />
            Refresh All Data
          </button>
        </div>
        
        {controlHistory.length === 0 ? (
          <p className="text-gray-500 text-center py-4">No control history available</p>
        ) : (
          <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
            {controlHistory.map((log, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                <div className="flex items-center">
                  <div className={`p-2 rounded-full mr-3 ${
                    log.newStatus === 'ON' || log.newStatus === 'OPEN'
                      ? 'bg-green-100' 
                      : 'bg-gray-100'
                  }`}>
                    {getDeviceIcon(log.deviceType)}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{log.deviceName}</p>
                    <p className="text-sm text-gray-600">
                      {log.action.replace(/_/g, ' ')} • {log.previousStatus} → {log.newStatus}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-500">{log.username || 'System'}</p>
                  <p className="text-xs text-gray-400">
                    {new Date(log.timestamp).toLocaleString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default DeviceControlPanel;
