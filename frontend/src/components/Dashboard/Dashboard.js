import React, { useState, useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import Overview from './Overview';
import SensorMonitoring from './SensorMonitoring';
import DeviceControl from './DeviceControl';
import AlertSystem from './AlertSystem';
import Analytics from './Analytics';
import Settings from './Settings';
import { useSocket } from '../../context/SocketContext';
import axios from 'axios';

const Dashboard = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const { setSensorData, setAlerts, setDevices } = useSocket();

  // Load initial data
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        setLoading(true);
        
        // Load latest sensor data
        const sensorResponse = await axios.get('/api/sensors/latest/greenhouse-001');
        if (sensorResponse.data.success) {
          const sensorMap = {};
          sensorResponse.data.data.forEach(sensor => {
            sensorMap[sensor.sensorType] = sensor;
          });
          setSensorData(sensorMap);
        }

        // Load devices
        const deviceResponse = await axios.get('/api/devices/greenhouse-001');
        if (deviceResponse.data.success) {
          setDevices(deviceResponse.data.data);
        }

        // Load active alerts
        const alertResponse = await axios.get('/api/alerts/active/greenhouse-001');
        if (alertResponse.data.success) {
          setAlerts(alertResponse.data.data);
        }

      } catch (error) {
        console.error('Error loading initial data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadInitialData();
  }, [setSensorData, setAlerts, setDevices]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="loading-spinner mx-auto mb-4"></div>
          <p className="text-gray-600">Loading greenhouse data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
      
      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header setSidebarOpen={setSidebarOpen} />
        
        <main className="flex-1 overflow-y-auto bg-gray-50 p-4">
          <Routes>
            <Route path="/" element={<Overview />} />
            <Route path="/sensors" element={<SensorMonitoring />} />
            <Route path="/devices" element={<DeviceControl />} />
            <Route path="/alerts" element={<AlertSystem />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/settings" element={<Settings />} />
          </Routes>
        </main>
      </div>
    </div>
  );
};

export default Dashboard;
