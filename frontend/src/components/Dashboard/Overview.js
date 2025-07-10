import React, { useState, useEffect, useCallback } from 'react';
import { useSocket } from '../../context/SocketContext';
import { useAuth } from '../../context/AuthContext';
import SensorCard from '../Sensors/SensorCard';
import DeviceCard from '../Devices/DeviceCard';
import AlertPanel from '../Alerts/AlertPanel';
import QuickStats from '../common/QuickStats';
import { Thermometer, Droplets, Sun, Sprout, Zap, AlertTriangle } from 'lucide-react';
import apiService from '../../utils/api';

const Overview = () => {
  const { sensorData, devices, alerts, connected } = useSocket();
  const { user } = useAuth();
  const [thresholds, setThresholds] = useState(null);
  const [stats, setStats] = useState({
    totalDevices: 0,
    activeDevices: 0,
    totalAlerts: 0,
    criticalAlerts: 0
  });

  const loadThresholds = useCallback(async () => {
    try {
      const greenhouseId = user?.greenhouseAccess?.[0]?.greenhouseId || 'default';
      const response = await apiService.getSettings(greenhouseId);
      setThresholds(response.data.alertThresholds);
    } catch (error) {
      console.error('Error loading thresholds:', error);
    }
  }, [user]);

  useEffect(() => {
    loadThresholds();
  }, [loadThresholds]);

  useEffect(() => {
    // Update stats when data changes
    const totalDevices = devices.length;
    const activeDevices = devices.filter(device => device.status === 'ON').length;
    const totalAlerts = alerts.filter(alert => !alert.isResolved).length;
    const criticalAlerts = alerts.filter(alert => 
      !alert.isResolved && (alert.severity === 'CRITICAL' || alert.severity === 'HIGH')
    ).length;

    setStats({
      totalDevices,
      activeDevices,
      totalAlerts,
      criticalAlerts
    });
  }, [devices, alerts]);

  // Helper function to check if a value is within threshold range
  const isValueOptimal = (sensorType, field, value) => {
    if (!thresholds) return true; // Default to optimal if no thresholds loaded
    
    const threshold = thresholds[sensorType];
    if (!threshold) return true;

    // Check based on available thresholds
    if (field === 'temperature') {
      const hasHigh = threshold.high !== null;
      const hasLow = threshold.low !== null;
      
      if (hasHigh && hasLow) {
        return value >= threshold.low && value <= threshold.high;
      } else if (hasHigh) {
        return value <= threshold.high;
      } else if (hasLow) {
        return value >= threshold.low;
      }
    } else if (field === 'humidity') {
      const hasHigh = threshold.high !== null;
      const hasLow = threshold.low !== null;
      
      if (hasHigh && hasLow) {
        return value >= threshold.low && value <= threshold.high;
      } else if (hasHigh) {
        return value <= threshold.high;
      } else if (hasLow) {
        return value >= threshold.low;
      }
    } else if (field === 'lightIntensity' && thresholds.lightLevel?.low !== null) {
      return value >= thresholds.lightLevel.low;
    } else if (field === 'soilMoisture' && thresholds.soilMoisture?.low !== null) {
      return value >= thresholds.soilMoisture.low;
    }
    
    return true; // Default to optimal if no specific threshold
  };

  const getSensorValue = (sensorType, field) => {
    return sensorData[sensorType]?.[field] || 0;
  };

  const getSensorStatus = (sensorType) => {
    const sensor = sensorData[sensorType];
    if (!sensor) return 'offline';
    
    const dataAge = Math.floor((Date.now() - new Date(sensor.timestamp)) / (1000 * 60));
    return dataAge > 5 ? 'warning' : 'online';
  };

  return (
    <div className="space-y-6">
      {/* Status Banner */}
      <div className={`rounded-lg p-4 ${connected ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
        <div className="flex items-center">
          <div className={`status-dot ${connected ? 'status-online' : 'status-offline'}`}></div>
          <span className={`font-medium ${connected ? 'text-green-800' : 'text-red-800'}`}>
            {connected ? 'System Connected' : 'System Disconnected'}
          </span>
          <span className={`ml-2 text-sm ${connected ? 'text-green-600' : 'text-red-600'}`}>
            {connected ? 'Real-time data updates active' : 'Check your connection'}
          </span>
        </div>
      </div>

      {/* Quick Stats */}
      <QuickStats
        stats={[
          {
            name: 'Total Devices',
            value: stats.totalDevices,
            icon: Zap,
            color: 'blue'
          },
          {
            name: 'Active Devices',
            value: stats.activeDevices,
            icon: Zap,
            color: 'green'
          },
          {
            name: 'Active Alerts',
            value: stats.totalAlerts,
            icon: AlertTriangle,
            color: stats.totalAlerts > 0 ? 'red' : 'gray'
          },
          {
            name: 'Critical Alerts',
            value: stats.criticalAlerts,
            icon: AlertTriangle,
            color: stats.criticalAlerts > 0 ? 'red' : 'gray'
          }
        ]}
      />

      {/* Sensor Overview */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Sensor Overview</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <SensorCard
            title="Temperature"
            value={getSensorValue('DHT11', 'temperature')}
            unit="°C"
            icon={Thermometer}
            status={getSensorStatus('DHT11')}
            trend="stable"
            lastUpdate={sensorData.DHT11?.timestamp}
          />
          <SensorCard
            title="Humidity"
            value={getSensorValue('DHT11', 'humidity')}
            unit="%"
            icon={Droplets}
            status={getSensorStatus('DHT11')}
            trend="stable"
            lastUpdate={sensorData.DHT11?.timestamp}
          />
          <SensorCard
            title="Light Intensity"
            value={getSensorValue('LDR', 'lightIntensity')}
            unit="lux"
            icon={Sun}
            status={getSensorStatus('LDR')}
            trend="stable"
            lastUpdate={sensorData.LDR?.timestamp}
          />
          <SensorCard
            title="Soil Moisture"
            value={getSensorValue('SOIL_MOISTURE', 'soilMoisture')}
            unit="%"
            icon={Sprout}
            status={getSensorStatus('SOIL_MOISTURE')}
            trend="stable"
            lastUpdate={sensorData.SOIL_MOISTURE?.timestamp}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Device Status */}
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Device Status</h2>
          <div className="space-y-3">
            {devices.slice(0, 4).map((device) => (
              <DeviceCard 
                key={device._id} 
                device={device} 
                compact={true}
              />
            ))}
            {devices.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                No devices configured
              </div>
            )}
          </div>
        </div>

        {/* Active Alerts */}
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Active Alerts</h2>
          <AlertPanel maxAlerts={4} />
        </div>
      </div>

      {/* Environmental Status Summary */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Environmental Status</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <Thermometer className="h-8 w-8 text-blue-600 mx-auto mb-2" />
            <p className="text-sm text-gray-600">Temperature</p>
            <p className="text-lg font-semibold text-blue-600">
              {getSensorValue('DHT11', 'temperature').toFixed(1)}°C
            </p>
            <p className="text-xs text-gray-500">
              {isValueOptimal('temperature', 'temperature', getSensorValue('DHT11', 'temperature'))
                ? 'Optimal' : 'Needs Attention'}
            </p>
          </div>
          
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <Droplets className="h-8 w-8 text-green-600 mx-auto mb-2" />
            <p className="text-sm text-gray-600">Humidity</p>
            <p className="text-lg font-semibold text-green-600">
              {getSensorValue('DHT11', 'humidity').toFixed(1)}%
            </p>
            <p className="text-xs text-gray-500">
              {isValueOptimal('humidity', 'humidity', getSensorValue('DHT11', 'humidity'))
                ? 'Optimal' : 'Needs Attention'}
            </p>
          </div>
          
          <div className="text-center p-4 bg-yellow-50 rounded-lg">
            <Sun className="h-8 w-8 text-yellow-600 mx-auto mb-2" />
            <p className="text-sm text-gray-600">Light Level</p>
            <p className="text-lg font-semibold text-yellow-600">
              {getSensorValue('LDR', 'lightIntensity').toFixed(0)}
            </p>
            <p className="text-xs text-gray-500">
              {isValueOptimal('lightLevel', 'lightIntensity', getSensorValue('LDR', 'lightIntensity'))
                ? 'Sufficient' : 'Low Light'}
            </p>
          </div>
          
          <div className="text-center p-4 bg-purple-50 rounded-lg">
            <Sprout className="h-8 w-8 text-purple-600 mx-auto mb-2" />
            <p className="text-sm text-gray-600">Soil Moisture</p>
            <p className="text-lg font-semibold text-purple-600">
              {getSensorValue('SOIL_MOISTURE', 'soilMoisture').toFixed(1)}%
            </p>
            <p className="text-xs text-gray-500">
              {getSensorValue('SOIL_MOISTURE', 'soilMoisture') >= 30 ? 'Adequate' : 'Needs Water'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Overview;
