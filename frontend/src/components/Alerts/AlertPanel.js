import React from 'react';
import { useSocket } from '../../context/SocketContext';
import { AlertTriangle, CheckCircle, Clock, X } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import axios from 'axios';
import toast from 'react-hot-toast';

const AlertPanel = ({ maxAlerts = 5 }) => {
  const { alerts } = useSocket();
  
  const activeAlerts = alerts
    .filter(alert => !alert.isResolved)
    .slice(0, maxAlerts);

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'CRITICAL': return 'bg-red-500 text-white';
      case 'HIGH': return 'bg-red-400 text-white';
      case 'MEDIUM': return 'bg-yellow-400 text-yellow-900';
      case 'LOW': return 'bg-blue-400 text-white';
      default: return 'bg-gray-400 text-white';
    }
  };

  const getSeverityIcon = (severity) => {
    switch (severity) {
      case 'CRITICAL':
      case 'HIGH':
        return AlertTriangle;
      case 'MEDIUM':
        return Clock;
      default:
        return AlertTriangle;
    }
  };

  const resolveAlert = async (alertId) => {
    try {
      const response = await axios.put(`/api/alerts/${alertId}/resolve`, {
        actionTaken: 'Manually resolved by user'
      });
      
      if (response.data.success) {
        toast.success('Alert resolved successfully');
      }
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to resolve alert';
      toast.error(message);
    }
  };

  if (activeAlerts.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="text-center py-8">
          <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">All Clear!</h3>
          <p className="text-gray-600">No active alerts in your greenhouse</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md">
      <div className="p-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900">Active Alerts</h3>
        <p className="text-sm text-gray-600">{activeAlerts.length} alert(s) require attention</p>
      </div>
      
      <div className="divide-y divide-gray-200">
        {activeAlerts.map((alert) => {
          const SeverityIcon = getSeverityIcon(alert.severity);
          
          return (
            <div key={alert._id} className="p-4 hover:bg-gray-50">
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3">
                  <div className={`p-2 rounded-full ${getSeverityColor(alert.severity)}`}>
                    <SeverityIcon className="h-4 w-4" />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-1">
                      <h4 className="text-sm font-medium text-gray-900">
                        {alert.alertType.replace(/_/g, ' ')}
                      </h4>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getSeverityColor(alert.severity)}`}>
                        {alert.severity}
                      </span>
                    </div>
                    
                    <p className="text-sm text-gray-600 mb-2">{alert.message}</p>
                    
                    <div className="flex items-center space-x-4 text-xs text-gray-500">
                      <span>Device: {alert.deviceId}</span>
                      <span>
                        {formatDistanceToNow(new Date(alert.createdAt), { addSuffix: true })}
                      </span>
                    </div>
                  </div>
                </div>
                
                <button
                  onClick={() => resolveAlert(alert._id)}
                  className="ml-2 p-1 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"
                  title="Resolve Alert"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
      
      {alerts.filter(alert => !alert.isResolved).length > maxAlerts && (
        <div className="p-4 border-t border-gray-200 text-center">
          <p className="text-sm text-gray-600">
            +{alerts.filter(alert => !alert.isResolved).length - maxAlerts} more alerts
          </p>
        </div>
      )}
    </div>
  );
};

export default AlertPanel;
