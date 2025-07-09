import React, { useState } from 'react';
import { X, Save } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';

const DeviceAutomationModal = ({ isOpen, onClose, device }) => {
  const [automationRules, setAutomationRules] = useState({
    temperatureHigh: device?.automationRules?.temperatureHigh || null,
    temperatureLow: device?.automationRules?.temperatureLow || null,
    humidityHigh: device?.automationRules?.humidityHigh || null,
    humidityLow: device?.automationRules?.humidityLow || null,
    soilMoistureLow: device?.automationRules?.soilMoistureLow || null,
    lightLevelLow: device?.automationRules?.lightLevelLow || null
  });
  const [autoMode, setAutoMode] = useState(device?.autoMode || false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await axios.post(`/api/devices/${device.deviceId}/automation`, {
        automationRules,
        autoMode
      });
      
      if (response.data.success) {
        toast.success('Automation settings updated successfully');
        onClose();
      }
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to update automation settings';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const getRelevantRules = () => {
    switch (device?.deviceType) {
      case 'FAN':
        return ['temperatureHigh', 'humidityHigh'];
      case 'WATER_PUMP':
        return ['soilMoistureLow'];
      case 'LED_LIGHT':
        return ['lightLevelLow'];
      case 'HEATER':
        return ['temperatureLow'];
      case 'COOLING_SYSTEM':
        return ['temperatureHigh'];
      default:
        return ['temperatureHigh', 'temperatureLow', 'humidityHigh', 'humidityLow', 'soilMoistureLow', 'lightLevelLow'];
    }
  };

  const getRuleLabel = (rule) => {
    const labels = {
      temperatureHigh: 'Temperature High (°C)',
      temperatureLow: 'Temperature Low (°C)',
      humidityHigh: 'Humidity High (%)',
      humidityLow: 'Humidity Low (%)',
      soilMoistureLow: 'Soil Moisture Low (%)',
      lightLevelLow: 'Light Level Low (lux)'
    };
    return labels[rule] || rule;
  };

  const getRuleDescription = (rule) => {
    const descriptions = {
      temperatureHigh: 'Activate when temperature exceeds this value',
      temperatureLow: 'Activate when temperature falls below this value',
      humidityHigh: 'Activate when humidity exceeds this value',
      humidityLow: 'Activate when humidity falls below this value',
      soilMoistureLow: 'Activate when soil moisture falls below this value',
      lightLevelLow: 'Activate when light level falls below this value'
    };
    return descriptions[rule] || '';
  };

  if (!isOpen || !device) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-full max-w-md shadow-lg rounded-md bg-white">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">
            Automation Settings - {device.deviceName}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Auto Mode Toggle */}
          <div className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-medium text-gray-900">Enable Auto Mode</h4>
                <p className="text-xs text-gray-600">
                  Automatically control this device based on sensor readings
                </p>
              </div>
              <input
                type="checkbox"
                checked={autoMode}
                onChange={(e) => setAutoMode(e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
            </div>
          </div>

          {/* Automation Rules */}
          {autoMode && (
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-gray-900">Automation Rules</h4>
              
              {getRelevantRules().map(rule => (
                <div key={rule} className="border border-gray-200 rounded-lg p-3">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {getRuleLabel(rule)}
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={automationRules[rule] || ''}
                    onChange={(e) => setAutomationRules(prev => ({
                      ...prev,
                      [rule]: e.target.value ? Number(e.target.value) : null
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Leave empty to disable"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {getRuleDescription(rule)}
                  </p>
                </div>
              ))}
              
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-xs text-blue-800">
                  <strong>Note:</strong> The device will automatically turn on when any of the 
                  configured conditions are met. Leave fields empty to disable specific rules.
                </p>
              </div>
            </div>
          )}

          {/* Device Info */}
          <div className="bg-gray-50 rounded-lg p-3">
            <h4 className="text-sm font-medium text-gray-900 mb-2">Device Information</h4>
            <div className="space-y-1 text-xs text-gray-600">
              <div className="flex justify-between">
                <span>Type:</span>
                <span className="font-medium">{device.deviceType.replace('_', ' ')}</span>
              </div>
              <div className="flex justify-between">
                <span>Location:</span>
                <span className="font-medium">{device.location}</span>
              </div>
              <div className="flex justify-between">
                <span>Power:</span>
                <span className="font-medium">{device.powerConsumption}W</span>
              </div>
              <div className="flex justify-between">
                <span>Current Status:</span>
                <span className={`font-medium ${
                  device.status === 'ON' ? 'text-green-600' : 
                  device.status === 'AUTO' ? 'text-blue-600' : 'text-gray-600'
                }`}>
                  {device.status}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              <Save className="h-4 w-4 mr-2" />
              {loading ? 'Saving...' : 'Save Settings'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default DeviceAutomationModal;
