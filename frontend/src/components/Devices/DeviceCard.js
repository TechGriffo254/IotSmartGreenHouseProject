import React from 'react';
import { Power, Settings, Zap, Fan, Lightbulb, Waves, Wind } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import axios from 'axios';
import toast from 'react-hot-toast';

const DeviceCard = ({ device, compact = false }) => {
  const getDeviceIcon = (deviceType) => {
    switch (deviceType) {
      case 'WATER_PUMP': return Waves;
      case 'SERVO': return Wind; // Window servo
      case 'FAN': return Fan;
      case 'LED_LIGHT': return Lightbulb;
      case 'HEATER': return Zap;
      case 'COOLING_SYSTEM': return Fan;
      default: return Zap;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'ON': return 'bg-green-500';
      case 'OFF': return 'bg-gray-400';
      case 'OPEN': return 'bg-green-500';
      case 'CLOSED': return 'bg-gray-400';
      case 'AUTO': return 'bg-blue-500';
      default: return 'bg-gray-400';
    }
  };

  const toggleDevice = async () => {
    try {
      // Determine the appropriate action based on device type and current status
      let action = 'toggle';
      
      if (device.deviceType === 'SERVO') {
        // For window servo, use open/close actions
        action = device.status === 'OPEN' ? 'close' : 'open';
      } else if (device.deviceType === 'WATER_PUMP') {
        // For water pump, use turn_on/turn_off actions
        action = device.status === 'ON' ? 'turn_off' : 'turn_on';
      }
      
      const response = await axios.post(`/api/devices/${device.deviceId}/control`, {
        action: action
      });
      
      if (response.data.success) {
        toast.success(response.data.message);
        
        // Show control log info
        if (response.data.controlLog) {
          console.log('Device control logged:', response.data.controlLog);
        }
      }
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to control device';
      toast.error(message);
    }
  };

  const Icon = getDeviceIcon(device.deviceType);

  return (
    <div className={`bg-white rounded-lg shadow-md border border-gray-200 ${
      device.status === 'ON' || device.status === 'OPEN' ? 'ring-2 ring-green-200' : ''
    } ${compact ? 'p-3' : 'p-4'} device-card ${device.status === 'ON' || device.status === 'OPEN' ? 'active' : ''}`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center">
          <div className={`p-2 rounded-full ${
            device.status === 'ON' || device.status === 'OPEN' ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-600'
          }`}>
            <Icon className="h-5 w-5" />
          </div>
          <div className="ml-3">
            <h3 className={`font-medium text-gray-900 ${compact ? 'text-sm' : 'text-base'}`}>
              {device.deviceName}
            </h3>
            <p className={`text-gray-500 ${compact ? 'text-xs' : 'text-sm'}`}>
              {device.deviceType.replace('_', ' ')}
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <div className={`w-3 h-3 rounded-full ${getStatusColor(device.status)}`}></div>
          <span className={`font-medium ${
            device.status === 'ON' || device.status === 'OPEN' ? 'text-green-600' : 
            device.status === 'AUTO' ? 'text-blue-600' : 
            'text-gray-600'
          } ${compact ? 'text-xs' : 'text-sm'}`}>
            {device.status}
          </span>
        </div>
      </div>

      {!compact && (
        <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
          <div>
            <span className="text-gray-600">Power:</span>
            <span className="ml-2 font-medium">{device.powerConsumption}W</span>
          </div>
          <div>
            <span className="text-gray-600">Intensity:</span>
            <span className="ml-2 font-medium">{device.intensity}%</span>
          </div>
          <div>
            <span className="text-gray-600">Auto Mode:</span>
            <span className="ml-2 font-medium">{device.autoMode ? 'Enabled' : 'Disabled'}</span>
          </div>
          <div>
            <span className="text-gray-600">Location:</span>
            <span className="ml-2 font-medium">{device.location}</span>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between">
        <div className={`text-xs text-gray-500 ${compact ? 'flex-1' : ''}`}>
          {device.lastActivated && (
            <>
              Last active {formatDistanceToNow(new Date(device.lastActivated), { addSuffix: true })}
            </>
          )}
        </div>
        
        <div className="flex items-center space-x-2">
          {!compact && (
            <button
              className="p-2 text-gray-400 hover:text-gray-600 rounded-md hover:bg-gray-100"
              title="Settings"
            >
              <Settings className="h-4 w-4" />
            </button>
          )}
          
          <button
            onClick={toggleDevice}
            className={`flex items-center px-3 py-1 rounded-md text-sm font-medium transition-colors ${
              device.status === 'ON' || device.status === 'OPEN'
                ? 'bg-red-100 text-red-700 hover:bg-red-200' 
                : 'bg-green-100 text-green-700 hover:bg-green-200'
            }`}
          >
            <Power className="h-4 w-4 mr-1" />
            {device.deviceType === 'SERVO' 
              ? (device.status === 'OPEN' ? 'Close Window' : 'Open Window')
              : (device.status === 'ON' ? 'Turn Off' : 'Turn On')
            }
          </button>
        </div>
      </div>

      {compact && device.autoMode && (
        <div className="mt-2 text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded">
          Auto mode enabled
        </div>
      )}
    </div>
  );
};

export default DeviceCard;
