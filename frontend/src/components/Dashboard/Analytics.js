import React, { useState, useEffect } from 'react';
import { useSocket } from '../../context/SocketContext';
import SensorChart from '../Sensors/SensorChart';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, Calendar, Download, Filter } from 'lucide-react';
import axios from 'axios';

const Analytics = () => {
  const { sensorData } = useSocket();
  const [historicalData, setHistoricalData] = useState([]);
  const [deviceStats, setDeviceStats] = useState(null);
  const [sensorStats, setSensorStats] = useState(null);
  const [timeRange, setTimeRange] = useState('24');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadAnalyticsData();
  }, [timeRange]);

  const loadAnalyticsData = async () => {
    try {
      setLoading(true);
      
      // Load historical sensor data
      const sensorResponse = await axios.get(`/api/sensors/historical/greenhouse-001?hours=${timeRange}`);
      if (sensorResponse.data.success) {
        setHistoricalData(sensorResponse.data.data);
      }

      // Load sensor statistics
      const statsResponse = await axios.get(`/api/sensors/stats/greenhouse-001?hours=${timeRange}`);
      if (statsResponse.data.success) {
        setSensorStats(statsResponse.data.data);
      }

      // Load device statistics
      const deviceResponse = await axios.get('/api/devices/stats/greenhouse-001');
      if (deviceResponse.data.success) {
        setDeviceStats(deviceResponse.data.data);
      }

    } catch (error) {
      console.error('Error loading analytics data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatChartData = () => {
    const groupedData = {};
    
    historicalData.forEach(reading => {
      const hour = new Date(reading.timestamp).getHours();
      const key = `${hour}:00`;
      
      if (!groupedData[key]) {
        groupedData[key] = { time: key, count: 0 };
      }
      
      groupedData[key].count++;
      
      if (reading.temperature !== undefined) {
        groupedData[key].temperature = (groupedData[key].temperature || 0) + reading.temperature;
      }
      if (reading.humidity !== undefined) {
        groupedData[key].humidity = (groupedData[key].humidity || 0) + reading.humidity;
      }
      if (reading.lightIntensity !== undefined) {
        groupedData[key].lightIntensity = (groupedData[key].lightIntensity || 0) + reading.lightIntensity;
      }
      if (reading.soilMoisture !== undefined) {
        groupedData[key].soilMoisture = (groupedData[key].soilMoisture || 0) + reading.soilMoisture;
      }
    });

    // Calculate averages
    return Object.values(groupedData).map(item => ({
      ...item,
      temperature: item.temperature ? (item.temperature / item.count).toFixed(1) : undefined,
      humidity: item.humidity ? (item.humidity / item.count).toFixed(1) : undefined,
      lightIntensity: item.lightIntensity ? (item.lightIntensity / item.count).toFixed(0) : undefined,
      soilMoisture: item.soilMoisture ? (item.soilMoisture / item.count).toFixed(1) : undefined
    })).sort((a, b) => parseInt(a.time) - parseInt(b.time));
  };

  const getDeviceTypeData = () => {
    if (!deviceStats) return [];
    
    const colors = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#8dd1e1'];
    
    return deviceStats.byType.map((item, index) => ({
      name: item._id.replace('_', ' '),
      value: item.totalDevices,
      active: item.activeDevices,
      color: colors[index % colors.length]
    }));
  };

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h1>
          <p className="text-gray-600">Analyze your greenhouse performance and trends</p>
        </div>
        
        <div className="flex items-center space-x-3">
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
          
          <button className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Avg Temperature</p>
              <p className="text-2xl font-bold text-blue-600">
                {sensorStats?.find(s => s._id === 'DHT11')?.avgTemperature?.toFixed(1) || '---'}°C
              </p>
            </div>
            <TrendingUp className="h-8 w-8 text-blue-600" />
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Avg Humidity</p>
              <p className="text-2xl font-bold text-green-600">
                {sensorStats?.find(s => s._id === 'DHT11')?.avgHumidity?.toFixed(1) || '---'}%
              </p>
            </div>
            <TrendingUp className="h-8 w-8 text-green-600" />
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Avg Light</p>
              <p className="text-2xl font-bold text-yellow-600">
                {sensorStats?.find(s => s._id === 'LDR')?.avgLightIntensity?.toFixed(0) || '---'}
              </p>
            </div>
            <TrendingUp className="h-8 w-8 text-yellow-600" />
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Avg Soil Moisture</p>
              <p className="text-2xl font-bold text-purple-600">
                {sensorStats?.find(s => s._id === 'SOIL_MOISTURE')?.avgSoilMoisture?.toFixed(1) || '---'}%
              </p>
            </div>
            <TrendingUp className="h-8 w-8 text-purple-600" />
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Environmental Trends */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Environmental Trends</h2>
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="loading-spinner mr-3"></div>
              <span className="text-gray-600">Loading chart data...</span>
            </div>
          ) : (
            <SensorChart 
              data={formatChartData()} 
              title="" 
              timeRange={timeRange}
            />
          )}
        </div>

        {/* Device Distribution */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Device Distribution</h2>
          {deviceStats ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={getDeviceTypeData()}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {getDeviceTypeData().map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-64 text-gray-500">
              No device data available
            </div>
          )}
        </div>
      </div>

      {/* Hourly Activity */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Hourly Sensor Activity</h2>
        {historicalData.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={formatChartData()}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="time" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" fill="#8884d8" name="Sensor Readings" />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex items-center justify-center h-64 text-gray-500">
            No activity data available
          </div>
        )}
      </div>

      {/* Performance Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Sensor Performance */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Sensor Performance</h2>
          {sensorStats ? (
            <div className="space-y-4">
              {sensorStats.map((sensor) => (
                <div key={sensor._id} className="border border-gray-200 rounded-lg p-4">
                  <h3 className="font-medium text-gray-900 mb-2">{sensor._id}</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Total Readings:</span>
                      <span className="ml-2 font-medium">{sensor.count}</span>
                    </div>
                    {sensor.avgTemperature && (
                      <div>
                        <span className="text-gray-600">Avg Temp:</span>
                        <span className="ml-2 font-medium">{sensor.avgTemperature.toFixed(1)}°C</span>
                      </div>
                    )}
                    {sensor.avgHumidity && (
                      <div>
                        <span className="text-gray-600">Avg Humidity:</span>
                        <span className="ml-2 font-medium">{sensor.avgHumidity.toFixed(1)}%</span>
                      </div>
                    )}
                    {sensor.avgLightIntensity && (
                      <div>
                        <span className="text-gray-600">Avg Light:</span>
                        <span className="ml-2 font-medium">{sensor.avgLightIntensity.toFixed(0)}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center text-gray-500 py-8">
              No sensor statistics available
            </div>
          )}
        </div>

        {/* Device Performance */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Device Performance</h2>
          {deviceStats && deviceStats.byType.length > 0 ? (
            <div className="space-y-4">
              {deviceStats.byType.map((deviceType) => (
                <div key={deviceType._id} className="border border-gray-200 rounded-lg p-4">
                  <h3 className="font-medium text-gray-900 mb-2">
                    {deviceType._id.replace('_', ' ')}
                  </h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Total Devices:</span>
                      <span className="ml-2 font-medium">{deviceType.totalDevices}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Active:</span>
                      <span className="ml-2 font-medium">{deviceType.activeDevices}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Auto Mode:</span>
                      <span className="ml-2 font-medium">{deviceType.autoModeDevices}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Power:</span>
                      <span className="ml-2 font-medium">{deviceType.totalPowerConsumption}W</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center text-gray-500 py-8">
              No device statistics available
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Analytics;
