import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { format } from 'date-fns';

const SensorChart = ({ data, title, timeRange }) => {
  const formatXAxisLabel = (timestamp) => {
    const date = new Date(timestamp);
    
    if (timeRange <= 24) {
      return format(date, 'HH:mm');
    } else if (timeRange <= 168) {
      return format(date, 'MM/dd HH:mm');
    } else {
      return format(date, 'MM/dd');
    }
  };

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white border border-gray-300 rounded-lg shadow-lg p-3">
          <p className="text-sm font-medium text-gray-900 mb-2">
            {format(new Date(label), 'MMM dd, yyyy HH:mm:ss')}
          </p>
          {payload.map((entry, index) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              <span className="font-medium">{entry.name}:</span>{' '}
              {entry.value?.toFixed(1)} {getUnit(entry.dataKey)}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  const getUnit = (dataKey) => {
    switch (dataKey) {
      case 'temperature': return '°C';
      case 'humidity': return '%';
      case 'lightIntensity': return 'lux';
      case 'soilMoisture': return '%';
      default: return '';
    }
  };

  const getColor = (dataKey) => {
    switch (dataKey) {
      case 'temperature': return '#ef4444';
      case 'humidity': return '#3b82f6';
      case 'lightIntensity': return '#f59e0b';
      case 'soilMoisture': return '#10b981';
      default: return '#6b7280';
    }
  };

  const hasData = data && data.length > 0;

  if (!hasData) {
    return (
      <div className="chart-container">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
        <div className="flex items-center justify-center h-64 text-gray-500">
          <div className="text-center">
            <p className="text-lg mb-2">No data available</p>
            <p className="text-sm">Sensor readings will appear here once data is collected</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="chart-container">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
      <ResponsiveContainer width="100%" height={400}>
        <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis 
            dataKey="timestamp"
            tickFormatter={formatXAxisLabel}
            stroke="#6b7280"
            fontSize={12}
          />
          <YAxis stroke="#6b7280" fontSize={12} />
          <Tooltip content={<CustomTooltip />} />
          <Legend />
          
          {/* Temperature Line */}
          {data.some(d => d.temperature !== undefined) && (
            <Line
              type="monotone"
              dataKey="temperature"
              stroke={getColor('temperature')}
              strokeWidth={2}
              name="Temperature (°C)"
              connectNulls={false}
              dot={false}
              activeDot={{ r: 4, stroke: getColor('temperature'), strokeWidth: 2 }}
            />
          )}
          
          {/* Humidity Line */}
          {data.some(d => d.humidity !== undefined) && (
            <Line
              type="monotone"
              dataKey="humidity"
              stroke={getColor('humidity')}
              strokeWidth={2}
              name="Humidity (%)"
              connectNulls={false}
              dot={false}
              activeDot={{ r: 4, stroke: getColor('humidity'), strokeWidth: 2 }}
            />
          )}
          
          {/* Light Intensity Line */}
          {data.some(d => d.lightIntensity !== undefined) && (
            <Line
              type="monotone"
              dataKey="lightIntensity"
              stroke={getColor('lightIntensity')}
              strokeWidth={2}
              name="Light Intensity (lux)"
              connectNulls={false}
              dot={false}
              activeDot={{ r: 4, stroke: getColor('lightIntensity'), strokeWidth: 2 }}
            />
          )}
          
          {/* Soil Moisture Line */}
          {data.some(d => d.soilMoisture !== undefined) && (
            <Line
              type="monotone"
              dataKey="soilMoisture"
              stroke={getColor('soilMoisture')}
              strokeWidth={2}
              name="Soil Moisture (%)"
              connectNulls={false}
              dot={false}
              activeDot={{ r: 4, stroke: getColor('soilMoisture'), strokeWidth: 2 }}
            />
          )}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default SensorChart;
