import React, { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { Power, RotateCcw, Settings, Clock } from 'lucide-react';

const DeviceControlPanel = () => {
  const [devices, setDevices] = useState([]);
  const [controlHistory, setControlHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDevices();
    loadControlHistory();
  }, []);

  const loadDevices = async () => {
    try {
      const response = await axios.get('/api/devices/greenhouse-001');
      if (response.data.success) {
        setDevices(response.data.data);
      }
    } catch (error) {
      console.error('Error loading devices:', error);
      toast.error('Failed to load devices');
    } finally {
      setLoading(false);
    }
  };

  const loadControlHistory = async () => {
    try {
      const response = await axios.get('/api/devices/control-history/greenhouse-001?limit=10');
      if (response.data.success) {
        setControlHistory(response.data.data);
      }
    } catch (error) {
      console.error('Error loading control history:', error);
    }
  };

  const controlDevice = async (deviceId, action, value = null) => {
    try {
      const payload = { action };
      if (value !== null) payload.value = value;

      const response = await axios.post(`/api/devices/${deviceId}/control`, payload);
      if (response.data.success) {
        toast.success(response.data.message);
        await loadDevices(); // Refresh device states
        await loadControlHistory(); // Refresh history
      }
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to control device';
      toast.error(message);
    }
  };

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
      case 'WATER_PUMP': return '💧';
      case 'SERVO': return '🪟';
      case 'FAN': return '🌪️';
      case 'LED_LIGHT': return '💡';
      case 'HEATER': return '🔥';
      default: return '⚡';
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
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">IoT Device Control</h1>
          <p className="text-gray-600">Control your smart greenhouse devices</p>
        </div>
        <button
          onClick={setupIoTDevices}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center"
        >
          <Settings className="h-4 w-4 mr-2" />
          Setup IoT Devices
        </button>
      </div>

      {/* Devices Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {devices.map((device) => (
          <div key={device.deviceId} className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <span className="text-2xl mr-3">{getDeviceIcon(device.deviceType)}</span>
                <div>
                  <h3 className="font-semibold text-gray-900">{device.deviceName}</h3>
                  <p className="text-sm text-gray-600">{device.deviceType.replace('_', ' ')}</p>
                </div>
              </div>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(device.status)}`}>
                {device.status}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
              <div>
                <span className="text-gray-600">Power:</span>
                <span className="ml-2 font-medium">{device.powerConsumption}W</span>
              </div>
              <div>
                <span className="text-gray-600">Auto Mode:</span>
                <span className="ml-2 font-medium">{device.autoMode ? 'Yes' : 'No'}</span>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {device.deviceType === 'SERVO' ? (
                <>
                  <button
                    onClick={() => controlDevice(device.deviceId, 'open')}
                    className="flex-1 bg-green-100 text-green-700 px-3 py-2 rounded-md text-sm font-medium hover:bg-green-200"
                  >
                    Open
                  </button>
                  <button
                    onClick={() => controlDevice(device.deviceId, 'close')}
                    className="flex-1 bg-red-100 text-red-700 px-3 py-2 rounded-md text-sm font-medium hover:bg-red-200"
                  >
                    Close
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => controlDevice(device.deviceId, 'turn_on')}
                    className="flex-1 bg-green-100 text-green-700 px-3 py-2 rounded-md text-sm font-medium hover:bg-green-200"
                  >
                    Turn On
                  </button>
                  <button
                    onClick={() => controlDevice(device.deviceId, 'turn_off')}
                    className="flex-1 bg-red-100 text-red-700 px-3 py-2 rounded-md text-sm font-medium hover:bg-red-200"
                  >
                    Turn Off
                  </button>
                </>
              )}
              <button
                onClick={() => controlDevice(device.deviceId, 'toggle')}
                className="bg-blue-100 text-blue-700 px-3 py-2 rounded-md text-sm font-medium hover:bg-blue-200 flex items-center"
              >
                <RotateCcw className="h-4 w-4 mr-1" />
                Toggle
              </button>
            </div>

            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <button
                  onClick={() => controlDevice(device.deviceId, 'set_auto_mode', !device.autoMode)}
                  className={`text-sm px-3 py-1 rounded-md font-medium ${
                    device.autoMode 
                      ? 'bg-purple-100 text-purple-700 hover:bg-purple-200' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {device.autoMode ? 'Disable Auto' : 'Enable Auto'}
                </button>
                <div className="text-xs text-gray-500">
                  ID: {device.deviceId}
                </div>
              </div>
            </div>
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
        <div className="flex items-center mb-4">
          <Clock className="h-5 w-5 text-gray-600 mr-2" />
          <h2 className="text-lg font-semibold text-gray-900">Recent Control History</h2>
        </div>
        
        {controlHistory.length === 0 ? (
          <p className="text-gray-500 text-center py-4">No control history available</p>
        ) : (
          <div className="space-y-3">
            {controlHistory.map((log, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center">
                  <span className="text-lg mr-3">{getDeviceIcon(log.deviceType)}</span>
                  <div>
                    <p className="font-medium text-gray-900">{log.deviceName}</p>
                    <p className="text-sm text-gray-600">
                      {log.action.replace('_', ' ')} • {log.previousStatus} → {log.newStatus}
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
