import React, { useState, useEffect, useCallback } from 'react';
import { useSocket } from '../../context/SocketContext';
import SensorCard from '../Sensors/SensorCard';
import SensorChart from '../Sensors/SensorChart';
import { Thermometer, Droplets, Sun, Sprout, RefreshCw, Calendar } from 'lucide-react';
import axios from 'axios';

const SensorMonitoring = () => {
  const { sensorData, connected } = useSocket();
  const [historicalData, setHistoricalData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [timeRange, setTimeRange] = useState('24'); // hours
  const [selectedSensor, setSelectedSensor] = useState('all');

  const sensors = [
    {
      id: 'DHT11',
      title: 'Temperature & Humidity',
      icon: Thermometer,
      fields: ['temperature', 'humidity'],
      units: ['°C', '%']
    },
    {
      id: 'LDR',
      title: 'Light Intensity',
      icon: Sun,
      fields: ['lightIntensity'],
      units: ['lux']
    },
    {
      id: 'SOIL_MOISTURE',
      title: 'Soil Moisture',
      icon: Sprout,
      fields: ['soilMoisture'],
      units: ['%']
    }
  ];

  const loadHistoricalData = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        hours: timeRange
      });
      
      if (selectedSensor !== 'all') {
        params.append('sensorType', selectedSensor);
      }

      const response = await axios.get(`/api/sensors/historical/greenhouse-001?${params}`);
      if (response.data.success) {
        setHistoricalData(response.data.data);
      }
    } catch (error) {
      console.error('Error loading historical data:', error);
    } finally {
      setLoading(false);
    }
  }, [timeRange, selectedSensor]);

  useEffect(() => {
    loadHistoricalData();
  }, [loadHistoricalData]);

  const getSensorValue = (sensorType, field) => {
    return sensorData[sensorType]?.[field] || 0;
  };

  const getSensorStatus = (sensorType) => {
    const sensor = sensorData[sensorType];
    if (!sensor) return 'offline';
    
    const dataAge = Math.floor((Date.now() - new Date(sensor.timestamp)) / (1000 * 60));
    return dataAge > 5 ? 'warning' : 'online';
  };

  const formatChartData = () => {
    const groupedData = {};
    
    historicalData.forEach(reading => {
      const timestamp = new Date(reading.timestamp).toISOString();
      
      if (!groupedData[timestamp]) {
        groupedData[timestamp] = { timestamp };
      }
      
      // Add sensor readings to the timestamp group
      if (reading.temperature !== undefined) {
        groupedData[timestamp].temperature = reading.temperature;
      }
      if (reading.humidity !== undefined) {
        groupedData[timestamp].humidity = reading.humidity;
      }
      if (reading.lightIntensity !== undefined) {
        groupedData[timestamp].lightIntensity = reading.lightIntensity;
      }
      if (reading.soilMoisture !== undefined) {
        groupedData[timestamp].soilMoisture = reading.soilMoisture;
      }
    });

    return Object.values(groupedData).sort((a, b) => 
      new Date(a.timestamp) - new Date(b.timestamp)
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Sensor Monitoring</h1>
          <p className="text-gray-600">Real-time environmental data from your greenhouse</p>
        </div>
        
        <div className="flex items-center space-x-3">
          <div className={`flex items-center px-3 py-2 rounded-full text-sm ${
            connected ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
          }`}>
            <div className={`status-dot ${connected ? 'status-online' : 'status-offline'} mr-2`}></div>
            {connected ? 'Live Data' : 'Disconnected'}
          </div>
          
          <button
            onClick={loadHistoricalData}
            disabled={loading}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Current Sensor Readings */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Current Readings</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <SensorCard
            title="Temperature"
            value={getSensorValue('DHT11', 'temperature')}
            unit="°C"
            icon={Thermometer}
            status={getSensorStatus('DHT11')}
            lastUpdate={sensorData.DHT11?.timestamp}
          />
          <SensorCard
            title="Humidity"
            value={getSensorValue('DHT11', 'humidity')}
            unit="%"
            icon={Droplets}
            status={getSensorStatus('DHT11')}
            lastUpdate={sensorData.DHT11?.timestamp}
          />
          <SensorCard
            title="Light Intensity"
            value={getSensorValue('LDR', 'lightIntensity')}
            unit="lux"
            icon={Sun}
            status={getSensorStatus('LDR')}
            lastUpdate={sensorData.LDR?.timestamp}
          />
          <SensorCard
            title="Soil Moisture"
            value={getSensorValue('SOIL_MOISTURE', 'soilMoisture')}
            unit="%"
            icon={Sprout}
            status={getSensorStatus('SOIL_MOISTURE')}
            lastUpdate={sensorData.SOIL_MOISTURE?.timestamp}
          />
        </div>
      </div>

      {/* Historical Data Controls */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-gray-900">Historical Data</h2>
          
          <div className="flex items-center space-x-4">
            {/* Time Range Selector */}
            <div className="flex items-center space-x-2">
              <Calendar className="h-5 w-5 text-gray-400" />
              <select
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="1">Last Hour</option>
                <option value="6">Last 6 Hours</option>
                <option value="24">Last 24 Hours</option>
                <option value="72">Last 3 Days</option>
                <option value="168">Last Week</option>
              </select>
            </div>

            {/* Sensor Filter */}
            <select
              value={selectedSensor}
              onChange={(e) => setSelectedSensor(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Sensors</option>
              <option value="DHT11">Temperature & Humidity</option>
              <option value="LDR">Light Intensity</option>
              <option value="SOIL_MOISTURE">Soil Moisture</option>
            </select>
          </div>
        </div>

        {/* Charts */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="loading-spinner mr-3"></div>
            <span className="text-gray-600">Loading historical data...</span>
          </div>
        ) : (
          <div className="space-y-8">
            <SensorChart
              data={formatChartData()}
              title="Environmental Trends"
              timeRange={timeRange}
            />
          </div>
        )}
      </div>

      {/* Sensor Details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {sensors.map((sensor) => (
          <div key={sensor.id} className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center mb-4">
              <sensor.icon className="h-6 w-6 text-blue-600 mr-3" />
              <h3 className="text-lg font-semibold text-gray-900">{sensor.title}</h3>
            </div>
            
            <div className="space-y-3">
              {sensor.fields.map((field, index) => (
                <div key={field} className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 capitalize">
                    {field.replace(/([A-Z])/g, ' $1').trim()}
                  </span>
                  <span className="font-medium text-gray-900">
                    {getSensorValue(sensor.id, field).toFixed(1)} {sensor.units[index]}
                  </span>
                </div>
              ))}
              
              <div className="pt-3 border-t border-gray-200">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-600">Status</span>
                  <span className={`status-indicator ${
                    getSensorStatus(sensor.id) === 'online' ? 'status-online' : 
                    getSensorStatus(sensor.id) === 'warning' ? 'status-warning' : 
                    'status-offline'
                  }`}>
                    {getSensorStatus(sensor.id)}
                  </span>
                </div>
                {sensorData[sensor.id]?.timestamp && (
                  <div className="flex justify-between items-center text-sm mt-2">
                    <span className="text-gray-600">Last Reading</span>
                    <span className="text-gray-800">
                      {new Date(sensorData[sensor.id].timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SensorMonitoring;
