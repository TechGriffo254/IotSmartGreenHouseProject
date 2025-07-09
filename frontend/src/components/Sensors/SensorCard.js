import React from 'react';
import { formatDistanceToNow } from 'date-fns';

const SensorCard = ({ 
  title, 
  value, 
  unit, 
  icon: Icon, 
  status = 'online', 
  trend = 'stable', 
  lastUpdate,
  compact = false 
}) => {
  const getStatusColor = () => {
    switch (status) {
      case 'online': return 'text-green-600 bg-green-100';
      case 'warning': return 'text-yellow-600 bg-yellow-100';
      case 'offline': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getTrendIcon = () => {
    switch (trend) {
      case 'up': return '↗️';
      case 'down': return '↘️';
      case 'stable': return '➡️';
      default: return '➡️';
    }
  };

  const formatValue = (val) => {
    if (typeof val === 'number') {
      return val.toFixed(1);
    }
    return val || '---';
  };

  return (
    <div className={`bg-white rounded-lg shadow-md border border-gray-200 ${compact ? 'p-4' : 'p-6'} card-hover`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center">
          <div className={`p-2 rounded-full ${getStatusColor()}`}>
            <Icon className="h-5 w-5" />
          </div>
          <h3 className={`ml-3 font-medium text-gray-900 ${compact ? 'text-sm' : 'text-base'}`}>
            {title}
          </h3>
        </div>
        <span className={`status-indicator ${
          status === 'online' ? 'status-online' : 
          status === 'warning' ? 'status-warning' : 
          'status-offline'
        }`}>
          {status}
        </span>
      </div>
      
      <div className="flex items-end justify-between">
        <div>
          <div className={`font-bold text-gray-900 ${compact ? 'text-xl' : 'text-3xl'}`}>
            {formatValue(value)}
            <span className={`ml-1 ${compact ? 'text-sm' : 'text-lg'} font-normal text-gray-500`}>
              {unit}
            </span>
          </div>
          {!compact && (
            <div className="flex items-center mt-2 text-sm text-gray-600">
              <span className="mr-1">{getTrendIcon()}</span>
              <span className="capitalize">{trend}</span>
            </div>
          )}
        </div>
        
        {!compact && lastUpdate && (
          <div className="text-right">
            <p className="text-xs text-gray-500">Last update</p>
            <p className="text-xs text-gray-700">
              {formatDistanceToNow(new Date(lastUpdate), { addSuffix: true })}
            </p>
          </div>
        )}
      </div>
      
      {compact && lastUpdate && (
        <div className="mt-2 text-xs text-gray-500">
          Updated {formatDistanceToNow(new Date(lastUpdate), { addSuffix: true })}
        </div>
      )}
    </div>
  );
};

export default SensorCard;
