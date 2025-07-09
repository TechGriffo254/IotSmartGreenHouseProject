import React, { useState } from 'react';
import { useSocket } from '../../context/SocketContext';
import DeviceCard from '../Devices/DeviceCard';
import AddDeviceModal from '../Devices/AddDeviceModal';
import DeviceAutomationModal from '../Devices/DeviceAutomationModal';
import { Plus, Zap, Power, Settings, BarChart3 } from 'lucide-react';
import axios from 'axios';

const DeviceControl = () => {
  const { devices, connected } = useSocket();
  const [showAddModal, setShowAddModal] = useState(false);
  const [showAutomationModal, setShowAutomationModal] = useState(false);
  const [selectedDevice, setSelectedDevice] = useState(null);
  const [deviceStats, setDeviceStats] = useState(null);

  React.useEffect(() => {
    loadDeviceStats();
  }, [devices]);

  const loadDeviceStats = async () => {
    try {
      const response = await axios.get('/api/devices/stats/greenhouse-001');
      if (response.data.success) {
        setDeviceStats(response.data.data);
      }
    } catch (error) {
      console.error('Error loading device stats:', error);
    }
  };

  const deviceTypes = [
    { type: 'FAN', name: 'Ventilation Fans', icon: '🌪️' },
    { type: 'WATER_PUMP', name: 'Water Pumps', icon: '💧' },
    { type: 'LED_LIGHT', name: 'LED Lights', icon: '💡' },
    { type: 'HEATER', name: 'Heaters', icon: '🔥' },
    { type: 'COOLING_SYSTEM', name: 'Cooling Systems', icon: '❄️' }
  ];

  const openAutomationModal = (device) => {
    setSelectedDevice(device);
    setShowAutomationModal(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Device Control</h1>
          <p className="text-gray-600">Manage and monitor your greenhouse devices</p>
        </div>
        
        <div className="flex items-center space-x-3">
          <div className={`flex items-center px-3 py-2 rounded-full text-sm ${
            connected ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
          }`}>
            <div className={`status-dot ${connected ? 'status-online' : 'status-offline'} mr-2`}></div>
            {connected ? 'Connected' : 'Disconnected'}
          </div>
          
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Device
          </button>
        </div>
      </div>

      {/* Device Statistics */}
      {deviceStats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-blue-100">
                <Zap className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Devices</p>
                <p className="text-2xl font-bold text-gray-900">{deviceStats.overall.totalDevices}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-green-100">
                <Power className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Active Devices</p>
                <p className="text-2xl font-bold text-gray-900">{deviceStats.overall.totalActiveDevices}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-purple-100">
                <Settings className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Auto Mode</p>
                <p className="text-2xl font-bold text-gray-900">{deviceStats.overall.totalAutoModeDevices}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-yellow-100">
                <BarChart3 className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Power Usage</p>
                <p className="text-2xl font-bold text-gray-900">{deviceStats.overall.totalPowerConsumption}W</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Device Grid */}
      {devices.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-12 text-center">
          <Zap className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No devices configured</h3>
          <p className="text-gray-600 mb-6">
            Add your first device to start controlling your greenhouse environment
          </p>
          <button
            onClick={() => setShowAddModal(true)}
            className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700"
          >
            Add Device
          </button>
        </div>
      ) : (
        <div className="space-y-8">
          {deviceTypes.map(({ type, name, icon }) => {
            const devicesOfType = devices.filter(device => device.deviceType === type);
            
            if (devicesOfType.length === 0) return null;
            
            return (
              <div key={type} className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center">
                    <span className="text-2xl mr-3">{icon}</span>
                    <div>
                      <h2 className="text-lg font-semibold text-gray-900">{name}</h2>
                      <p className="text-sm text-gray-600">{devicesOfType.length} device(s)</p>
                    </div>
                  </div>
                  
                  <div className="text-sm text-gray-500">
                    {devicesOfType.filter(d => d.status === 'ON').length} active
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {devicesOfType.map(device => (
                    <div key={device._id} className="relative">
                      <DeviceCard device={device} />
                      
                      {/* Automation Button */}
                      <button
                        onClick={() => openAutomationModal(device)}
                        className="absolute top-2 right-2 p-2 bg-white rounded-full shadow-md hover:bg-gray-50"
                        title="Automation Settings"
                      >
                        <Settings className="h-4 w-4 text-gray-600" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 text-left">
            <Power className="h-6 w-6 text-red-600 mb-2" />
            <h3 className="font-medium text-gray-900">Turn Off All Devices</h3>
            <p className="text-sm text-gray-600">Emergency shutdown of all devices</p>
          </button>
          
          <button className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 text-left">
            <Settings className="h-6 w-6 text-blue-600 mb-2" />
            <h3 className="font-medium text-gray-900">Enable Auto Mode</h3>
            <p className="text-sm text-gray-600">Activate automation for all devices</p>
          </button>
          
          <button className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 text-left">
            <BarChart3 className="h-6 w-6 text-green-600 mb-2" />
            <h3 className="font-medium text-gray-900">Optimize Power</h3>
            <p className="text-sm text-gray-600">Reduce energy consumption</p>
          </button>
        </div>
      </div>

      {/* Modals */}
      {showAddModal && (
        <AddDeviceModal
          isOpen={showAddModal}
          onClose={() => setShowAddModal(false)}
        />
      )}
      
      {showAutomationModal && selectedDevice && (
        <DeviceAutomationModal
          isOpen={showAutomationModal}
          onClose={() => {
            setShowAutomationModal(false);
            setSelectedDevice(null);
          }}
          device={selectedDevice}
        />
      )}
    </div>
  );
};

export default DeviceControl;
