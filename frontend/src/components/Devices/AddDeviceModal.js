import React, { useState } from 'react';
import { X, Plus } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';

const AddDeviceModal = ({ isOpen, onClose }) => {
  const [formData, setFormData] = useState({
    deviceName: '',
    deviceType: 'FAN',
    deviceId: '',
    location: 'Main Greenhouse',
    powerConsumption: 0
  });
  const [loading, setLoading] = useState(false);

  const deviceTypes = [
    { value: 'FAN', label: 'Ventilation Fan' },
    { value: 'WATER_PUMP', label: 'Water Pump' },
    { value: 'LED_LIGHT', label: 'LED Light' },
    { value: 'HEATER', label: 'Heater' },
    { value: 'COOLING_SYSTEM', label: 'Cooling System' }
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await axios.post('/api/devices', formData);
      if (response.data.success) {
        toast.success('Device added successfully');
        onClose();
        setFormData({
          deviceName: '',
          deviceType: 'FAN',
          deviceId: '',
          location: 'Main Greenhouse',
          powerConsumption: 0
        });
      }
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to add device';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const generateDeviceId = () => {
    const prefix = formData.deviceType.toLowerCase();
    const timestamp = Date.now().toString().slice(-6);
    const deviceId = `${prefix}_${timestamp}`;
    setFormData(prev => ({ ...prev, deviceId }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">Add New Device</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Device Name
            </label>
            <input
              type="text"
              required
              value={formData.deviceName}
              onChange={(e) => setFormData(prev => ({ ...prev, deviceName: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., Main Ventilation Fan"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Device Type
            </label>
            <select
              value={formData.deviceType}
              onChange={(e) => setFormData(prev => ({ ...prev, deviceType: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {deviceTypes.map(type => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Device ID
            </label>
            <div className="flex">
              <input
                type="text"
                required
                value={formData.deviceId}
                onChange={(e) => setFormData(prev => ({ ...prev, deviceId: e.target.value }))}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Unique device identifier"
              />
              <button
                type="button"
                onClick={generateDeviceId}
                className="px-3 py-2 bg-gray-100 border border-l-0 border-gray-300 rounded-r-md hover:bg-gray-200"
                title="Generate ID"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Location
            </label>
            <input
              type="text"
              value={formData.location}
              onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Device location"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Power Consumption (Watts)
            </label>
            <input
              type="number"
              min="0"
              value={formData.powerConsumption}
              onChange={(e) => setFormData(prev => ({ ...prev, powerConsumption: Number(e.target.value) }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="0"
            />
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
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Adding...' : 'Add Device'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddDeviceModal;
