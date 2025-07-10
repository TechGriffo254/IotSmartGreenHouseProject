import React, { useState, useEffect, useCallback } from 'react';
import AlertPanel from '../Alerts/AlertPanel';
import { AlertTriangle, CheckCircle, Filter, Download, Trash2 } from 'lucide-react';
import api from '../../services/api';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

const AlertSystem = () => {
  const [allAlerts, setAllAlerts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState('all'); // all, active, resolved
  const [severityFilter, setSeverityFilter] = useState('all');
  const [alertStats, setAlertStats] = useState(null);
  const [thresholds, setThresholds] = useState(null);

  const loadAlerts = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      
      if (filter !== 'all') {
        params.append('status', filter);
      }
      
      const response = await api.get(`/api/alerts/greenhouse-001?${params}`);
      if (response.data.success) {
        setAllAlerts(response.data.data);
      }
    } catch (error) {
      console.error('Error loading alerts:', error);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  const loadAlertStats = useCallback(async () => {
    try {
      const response = await api.get('/api/alerts/stats/greenhouse-001');
      if (response.data.success) {
        setAlertStats(response.data.data);
      }
    } catch (error) {
      console.error('Error loading alert stats:', error);
    }
  }, []);

  const loadThresholds = useCallback(async () => {
    try {
      const response = await api.get('/api/settings/greenhouse-001');
      if (response.data.alertThresholds) {
        setThresholds(response.data.alertThresholds);
      }
    } catch (error) {
      console.error('Error loading thresholds:', error);
    }
  }, []);
  
  const deleteAlert = useCallback(async (alertId) => {
    if (window.confirm('Are you sure you want to delete this alert?')) {
      try {
        setLoading(true);
        const response = await api.delete(`/api/alerts/${alertId}`);
        if (response.data.success) {
          toast.success('Alert deleted successfully');
          loadAlerts(); // Reload alerts after deletion
        }
      } catch (error) {
        console.error('Error deleting alert:', error);
        toast.error('Failed to delete alert');
      } finally {
        setLoading(false);
      }
    }
  }, [loadAlerts]);

  useEffect(() => {
    loadAlerts();
    loadAlertStats();
    loadThresholds();
  }, [loadAlerts, loadAlertStats, loadThresholds]);

  const filteredAlerts = allAlerts.filter(alert => {
    if (severityFilter !== 'all' && alert.severity !== severityFilter) {
      return false;
    }
    return true;
  });

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'CRITICAL': return 'text-red-600 bg-red-100';
      case 'HIGH': return 'text-red-500 bg-red-50';
      case 'MEDIUM': return 'text-yellow-600 bg-yellow-100';
      case 'LOW': return 'text-blue-600 bg-blue-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Alert System</h1>
          <p className="text-gray-600">Monitor and manage greenhouse alerts</p>
        </div>
        
        <div className="flex items-center space-x-3">
          <button className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            <Download className="h-4 w-4 mr-2" />
            Export Alerts
          </button>
        </div>
      </div>

      {/* Alert Statistics */}
      {alertStats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-red-100">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Alerts</p>
                <p className="text-2xl font-bold text-gray-900">{alertStats.overall.totalAlerts}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-yellow-100">
                <AlertTriangle className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Active Alerts</p>
                <p className="text-2xl font-bold text-gray-900">{alertStats.overall.totalActive}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-green-100">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Resolved</p>
                <p className="text-2xl font-bold text-gray-900">{alertStats.overall.totalResolved}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-purple-100">
                <Filter className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Resolution Rate</p>
                <p className="text-2xl font-bold text-gray-900">
                  {alertStats.overall.totalAlerts > 0 
                    ? Math.round((alertStats.overall.totalResolved / alertStats.overall.totalAlerts) * 100)
                    : 0}%
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Current Active Alerts */}
        <div className="lg:col-span-1">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Current Active Alerts</h2>
          <AlertPanel maxAlerts={10} />
        </div>

        {/* Alert History */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-md">
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Alert History</h2>
                
                <div className="flex items-center space-x-3">
                  {/* Status Filter */}
                  <select
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                    className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">All Alerts</option>
                    <option value="active">Active Only</option>
                    <option value="resolved">Resolved Only</option>
                  </select>
                  
                  {/* Severity Filter */}
                  <select
                    value={severityFilter}
                    onChange={(e) => setSeverityFilter(e.target.value)}
                    className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">All Severities</option>
                    <option value="CRITICAL">Critical</option>
                    <option value="HIGH">High</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="LOW">Low</option>
                  </select>
                </div>
              </div>
            </div>
            
            <div className="max-h-96 overflow-y-auto">
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="loading-spinner mr-3"></div>
                  <span className="text-gray-600">Loading alerts...</span>
                </div>
              ) : filteredAlerts.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <p>No alerts found</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-200">
                  {filteredAlerts.map((alert) => (
                    <div key={alert._id} className="p-4 hover:bg-gray-50">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <h4 className="text-sm font-medium text-gray-900">
                              {alert.alertType.replace(/_/g, ' ')}
                            </h4>
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getSeverityColor(alert.severity)}`}>
                              {alert.severity}
                            </span>
                            {alert.isResolved && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                Resolved
                              </span>
                            )}
                          </div>
                          
                          <p className="text-sm text-gray-600 mb-2">{alert.message}</p>
                          
                          <div className="flex items-center justify-between text-xs text-gray-500">
                            <div className="space-x-4">
                              <span>Device: {alert.deviceId}</span>
                              <span>Created: {format(new Date(alert.createdAt), 'MMM dd, yyyy HH:mm')}</span>
                              {alert.isResolved && alert.resolvedAt && (
                                <span>Resolved: {format(new Date(alert.resolvedAt), 'MMM dd, yyyy HH:mm')}</span>
                              )}
                            </div>
                          </div>
                          
                          {alert.isResolved && alert.actionTaken && (
                            <div className="mt-2 text-xs text-gray-600 bg-gray-50 p-2 rounded">
                              <strong>Action Taken:</strong> {alert.actionTaken}
                            </div>
                          )}
                        </div>
                        
                        {!alert.isResolved && (
                          <button 
                            className="ml-2 p-1 text-gray-400 hover:text-red-600"
                            onClick={() => deleteAlert(alert._id)}
                            aria-label="Delete alert"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Alert Configuration */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Alert Configuration</h2>
        {thresholds ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="border border-gray-200 rounded-lg p-4">
              <h3 className="font-medium text-gray-900 mb-2">Temperature Alerts</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">High Threshold:</span>
                  <span className="font-medium">
                    {thresholds.temperature?.high ? `${thresholds.temperature.high}°C` : 'Not set'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Low Threshold:</span>
                  <span className="font-medium">
                    {thresholds.temperature?.low ? `${thresholds.temperature.low}°C` : 'Not set'}
                  </span>
                </div>
              </div>
            </div>
            
            <div className="border border-gray-200 rounded-lg p-4">
              <h3 className="font-medium text-gray-900 mb-2">Humidity Alerts</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">High Threshold:</span>
                  <span className="font-medium">
                    {thresholds.humidity?.high ? `${thresholds.humidity.high}%` : 'Not set'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Low Threshold:</span>
                  <span className="font-medium">
                    {thresholds.humidity?.low ? `${thresholds.humidity.low}%` : 'Not set'}
                  </span>
                </div>
              </div>
            </div>
            
            <div className="border border-gray-200 rounded-lg p-4">
              <h3 className="font-medium text-gray-900 mb-2">Soil Moisture</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Low Threshold:</span>
                  <span className="font-medium">
                    {thresholds.soilMoisture?.low ? `${thresholds.soilMoisture.low}%` : 'Not set'}
                  </span>
                </div>
              </div>
            </div>
            
            <div className="border border-gray-200 rounded-lg p-4">
              <h3 className="font-medium text-gray-900 mb-2">Light Level</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Low Threshold:</span>
                  <span className="font-medium">
                    {thresholds.lightLevel?.low ? `${thresholds.lightLevel.low} lux` : 'Not set'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex justify-center py-8">
            <div className="text-gray-500">Loading thresholds...</div>
          </div>
        )}
        
        <div className="mt-4 pt-4 border-t border-gray-200">
          <p className="text-sm text-gray-600">
            Configure alert thresholds in the <button type="button" className="text-blue-600 hover:text-blue-800 underline bg-transparent border-none p-0 cursor-pointer">Settings</button> page. 
            Alerts will be triggered when sensor readings exceed these values.
          </p>
        </div>
      </div>
    </div>
  );
};

export default AlertSystem;
