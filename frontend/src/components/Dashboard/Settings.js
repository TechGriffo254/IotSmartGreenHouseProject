import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import { Save, User, Bell, Globe, Lock, Database, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';
import apiService from '../../utils/api';

const Settings = () => {
  const { user, updateProfile } = useAuth();
  const { connected } = useSocket();
  
  const [activeTab, setActiveTab] = useState('profile');
  const [loading, setLoading] = useState(false);
  const [settingsLoading, setSettingsLoading] = useState(true);
  
  const [profileData, setProfileData] = useState({
    email: user?.email || '',
    preferences: {
      alertNotifications: user?.preferences?.alertNotifications ?? true,
      emailNotifications: user?.preferences?.emailNotifications ?? false,
      theme: user?.preferences?.theme || 'light'
    }
  });

  // Initialize thresholds with null values - no hardcoding
  const [thresholds, setThresholds] = useState({
    temperature: { high: '', low: '' },
    humidity: { high: '', low: '' },
    soilMoisture: { low: '' },
    lightLevel: { low: '' }
  });

  const [systemSettings, setSystemSettings] = useState({
    dataRetentionDays: 30,
    updateInterval: 5,
    autoBackup: true,
    maintenanceMode: false
  });

  const loadSettings = useCallback(async () => {
    try {
      setSettingsLoading(true);
      const greenhouseId = user?.greenhouseAccess?.[0]?.greenhouseId || 'default';
      const response = await apiService.getSettings(greenhouseId);
      const settings = response.data;

      if (settings.alertThresholds) {
        setThresholds({
          temperature: {
            high: settings.alertThresholds.temperature?.high || '',
            low: settings.alertThresholds.temperature?.low || ''
          },
          humidity: {
            high: settings.alertThresholds.humidity?.high || '',
            low: settings.alertThresholds.humidity?.low || ''
          },
          soilMoisture: {
            low: settings.alertThresholds.soilMoisture?.low || ''
          },
          lightLevel: {
            low: settings.alertThresholds.lightLevel?.low || ''
          }
        });
      }

      if (settings.systemSettings) {
        setSystemSettings(settings.systemSettings);
      }

    } catch (error) {
      console.error('Error loading settings:', error);
      toast.error('Failed to load settings');
    } finally {
      setSettingsLoading(false);
    }
  }, [user]);

  // Load settings from API on component mount
  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  const tabs = [
    { id: 'profile', name: 'Profile', icon: User },
    { id: 'notifications', name: 'Notifications', icon: Bell },
    { id: 'thresholds', name: 'Alert Thresholds', icon: Globe },
    { id: 'system', name: 'System', icon: Database },
    { id: 'security', name: 'Security', icon: Lock }
  ];

  const handleProfileSave = async () => {
    try {
      setLoading(true);
      const result = await updateProfile(profileData);
      if (result.success) {
        toast.success('Profile updated successfully');
      }
    } catch (error) {
      toast.error('Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleThresholdSave = async () => {
    try {
      setLoading(true);
      const greenhouseId = user?.greenhouseAccess?.[0]?.greenhouseId || 'default';
      
      // Convert empty strings to null for API
      const alertThresholds = {
        temperature: {
          high: thresholds.temperature.high ? Number(thresholds.temperature.high) : null,
          low: thresholds.temperature.low ? Number(thresholds.temperature.low) : null
        },
        humidity: {
          high: thresholds.humidity.high ? Number(thresholds.humidity.high) : null,
          low: thresholds.humidity.low ? Number(thresholds.humidity.low) : null
        },
        soilMoisture: {
          low: thresholds.soilMoisture.low ? Number(thresholds.soilMoisture.low) : null
        },
        lightLevel: {
          low: thresholds.lightLevel.low ? Number(thresholds.lightLevel.low) : null
        }
      };

      await apiService.updateThresholds(greenhouseId, alertThresholds);
      toast.success('Alert thresholds updated successfully');
    } catch (error) {
      console.error('Error saving thresholds:', error);
      toast.error('Failed to update alert thresholds');
    } finally {
      setLoading(false);
    }
  };

  const handleSystemSave = async () => {
    try {
      setLoading(true);
      const greenhouseId = user?.greenhouseAccess?.[0]?.greenhouseId || 'default';
      await apiService.updateSystemSettings(greenhouseId, systemSettings);
      toast.success('System settings updated successfully');
    } catch (error) {
      console.error('Error saving system settings:', error);
      toast.error('Failed to update system settings');
    } finally {
      setLoading(false);
    }
  };

  const handleResetSettings = async () => {
    if (!window.confirm('Are you sure you want to reset all settings to defaults? This action cannot be undone.')) {
      return;
    }

    try {
      setLoading(true);
      const greenhouseId = user?.greenhouseAccess?.[0]?.greenhouseId || 'default';
      await apiService.resetSettings(greenhouseId);
      await loadSettings(); // Reload settings from server
      toast.success('Settings reset to defaults');
    } catch (error) {
      console.error('Error resetting settings:', error);
      toast.error('Failed to reset settings');
    } finally {
      setLoading(false);
    }
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'profile':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Profile Information</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Username
                  </label>
                  <input
                    type="text"
                    value={user?.username || ''}
                    disabled
                    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">Username cannot be changed</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    value={profileData.email}
                    onChange={(e) => setProfileData(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Role
                  </label>
                  <input
                    type="text"
                    value={user?.role || ''}
                    disabled
                    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500 capitalize"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Last Login
                  </label>
                  <input
                    type="text"
                    value={user?.lastLogin ? new Date(user.lastLogin).toLocaleString() : 'Never'}
                    disabled
                    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500"
                  />
                </div>
              </div>
            </div>
            
            <div className="pt-4 border-t border-gray-200">
              <button
                onClick={handleProfileSave}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                <Save className="h-4 w-4 mr-2" />
                Save Changes
              </button>
            </div>
          </div>
        );

      case 'notifications':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Notification Preferences</h3>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-medium text-gray-900">In-App Notifications</h4>
                    <p className="text-sm text-gray-600">Receive notifications in the dashboard</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={profileData.preferences.alertNotifications}
                    onChange={(e) => setProfileData(prev => ({
                      ...prev,
                      preferences: {
                        ...prev.preferences,
                        alertNotifications: e.target.checked
                      }
                    }))}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-medium text-gray-900">Email Notifications</h4>
                    <p className="text-sm text-gray-600">Receive critical alerts via email</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={profileData.preferences.emailNotifications}
                    onChange={(e) => setProfileData(prev => ({
                      ...prev,
                      preferences: {
                        ...prev.preferences,
                        emailNotifications: e.target.checked
                      }
                    }))}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                </div>
              </div>
            </div>
            
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Theme</h3>
              
              <div className="space-y-2">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="theme"
                    value="light"
                    checked={profileData.preferences.theme === 'light'}
                    onChange={(e) => setProfileData(prev => ({
                      ...prev,
                      preferences: {
                        ...prev.preferences,
                        theme: e.target.value
                      }
                    }))}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                  />
                  <span className="ml-2 text-sm text-gray-900">Light Theme</span>
                </label>
                
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="theme"
                    value="dark"
                    checked={profileData.preferences.theme === 'dark'}
                    onChange={(e) => setProfileData(prev => ({
                      ...prev,
                      preferences: {
                        ...prev.preferences,
                        theme: e.target.value
                      }
                    }))}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                  />
                  <span className="ml-2 text-sm text-gray-900">Dark Theme</span>
                </label>
              </div>
            </div>
            
            <div className="pt-4 border-t border-gray-200">
              <button
                onClick={handleProfileSave}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                <Save className="h-4 w-4 mr-2" />
                Save Preferences
              </button>
            </div>
          </div>
        );

      case 'thresholds':
        return (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Alert Thresholds</h3>
                <p className="text-sm text-gray-600">
                  Configure when alerts should be triggered based on sensor readings. Leave fields empty to disable specific thresholds.
                </p>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={loadSettings}
                  disabled={loading || settingsLoading}
                  className="flex items-center px-3 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 disabled:opacity-50"
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${settingsLoading ? 'animate-spin' : ''}`} />
                  Reload
                </button>
                <button
                  onClick={handleResetSettings}
                  disabled={loading || settingsLoading}
                  className="flex items-center px-3 py-2 bg-red-100 text-red-700 rounded-md hover:bg-red-200 disabled:opacity-50"
                >
                  Reset All
                </button>
              </div>
            </div>
            
            {settingsLoading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="border border-gray-200 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-3">Temperature (°C)</h4>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">High Threshold</label>
                      <input
                        type="number"
                        step="0.1"
                        value={thresholds.temperature.high}
                        onChange={(e) => setThresholds(prev => ({ 
                          ...prev, 
                          temperature: { ...prev.temperature, high: e.target.value }
                        }))}
                        placeholder="e.g., 35"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">Low Threshold</label>
                      <input
                        type="number"
                        step="0.1"
                        value={thresholds.temperature.low}
                        onChange={(e) => setThresholds(prev => ({ 
                          ...prev, 
                          temperature: { ...prev.temperature, low: e.target.value }
                        }))}
                        placeholder="e.g., 15"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                </div>
                
                <div className="border border-gray-200 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-3">Humidity (%)</h4>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">High Threshold</label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={thresholds.humidity.high}
                        onChange={(e) => setThresholds(prev => ({ 
                          ...prev, 
                          humidity: { ...prev.humidity, high: e.target.value }
                        }))}
                        placeholder="e.g., 80"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">Low Threshold</label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={thresholds.humidity.low}
                        onChange={(e) => setThresholds(prev => ({ 
                          ...prev, 
                          humidity: { ...prev.humidity, low: e.target.value }
                        }))}
                        placeholder="e.g., 40"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                </div>
                
                <div className="border border-gray-200 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-3">Soil Moisture (%)</h4>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Low Threshold</label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={thresholds.soilMoisture.low}
                      onChange={(e) => setThresholds(prev => ({ 
                        ...prev, 
                        soilMoisture: { low: e.target.value }
                      }))}
                      placeholder="e.g., 30"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
                
                <div className="border border-gray-200 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-3">Light Level (lux)</h4>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Low Threshold</label>
                    <input
                      type="number"
                      min="0"
                      value={thresholds.lightLevel.low}
                      onChange={(e) => setThresholds(prev => ({ 
                        ...prev, 
                        lightLevel: { low: e.target.value }
                      }))}
                      placeholder="e.g., 200"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>
            )}
            
            <div className="pt-4 border-t border-gray-200">
              <button
                onClick={handleThresholdSave}
                disabled={loading || settingsLoading}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                <Save className="h-4 w-4 mr-2" />
                {loading ? 'Saving...' : 'Save Thresholds'}
              </button>
            </div>
          </div>
        );

      case 'system':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">System Configuration</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Data Retention (days)
                  </label>
                  <input
                    type="number"
                    value={systemSettings.dataRetentionDays}
                    onChange={(e) => setSystemSettings(prev => ({ ...prev, dataRetentionDays: Number(e.target.value) }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">How long to keep sensor data</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Update Interval (seconds)
                  </label>
                  <input
                    type="number"
                    value={systemSettings.updateInterval}
                    onChange={(e) => setSystemSettings(prev => ({ ...prev, updateInterval: Number(e.target.value) }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">How often to refresh data</p>
                </div>
              </div>
              
              <div className="mt-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-medium text-gray-900">Automatic Backup</h4>
                    <p className="text-sm text-gray-600">Automatically backup system data</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={systemSettings.autoBackup}
                    onChange={(e) => setSystemSettings(prev => ({ ...prev, autoBackup: e.target.checked }))}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-medium text-gray-900">Maintenance Mode</h4>
                    <p className="text-sm text-gray-600">Disable device control for maintenance</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={systemSettings.maintenanceMode}
                    onChange={(e) => setSystemSettings(prev => ({ ...prev, maintenanceMode: e.target.checked }))}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                </div>
              </div>
            </div>
            
            <div className="pt-4 border-t border-gray-200">
              <button
                onClick={handleSystemSave}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                <Save className="h-4 w-4 mr-2" />
                Save Settings
              </button>
            </div>
          </div>
        );

      case 'security':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Security Settings</h3>
              
              <div className="space-y-6">
                <div className="border border-gray-200 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-3">Change Password</h4>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">Current Password</label>
                      <input
                        type="password"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">New Password</label>
                      <input
                        type="password"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">Confirm New Password</label>
                      <input
                        type="password"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <button className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700">
                      Change Password
                    </button>
                  </div>
                </div>
                
                <div className="border border-gray-200 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-3">Session Management</h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Current session expires in: 24 hours</span>
                    </div>
                    <button className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700">
                      Extend Session
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-600">Manage your account and system preferences</p>
      </div>

      {/* Connection Status */}
      <div className={`rounded-lg p-4 ${connected ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
        <div className="flex items-center">
          <div className={`status-dot ${connected ? 'status-online' : 'status-offline'}`}></div>
          <span className={`font-medium ${connected ? 'text-green-800' : 'text-red-800'}`}>
            {connected ? 'System Connected' : 'System Disconnected'}
          </span>
        </div>
      </div>

      {/* Settings Content */}
      <div className="bg-white rounded-lg shadow-md">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center">
                  <tab.icon className="h-5 w-5 mr-2" />
                  {tab.name}
                </div>
              </button>
            ))}
          </nav>
        </div>
        
        <div className="p-6">
          {renderTabContent()}
        </div>
      </div>
    </div>
  );
};

export default Settings;
