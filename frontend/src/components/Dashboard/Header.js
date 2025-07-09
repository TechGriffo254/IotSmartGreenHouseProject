import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import { Menu, Bell, User, LogOut, Wifi, WifiOff } from 'lucide-react';

const Header = ({ setSidebarOpen }) => {
  const { user, logout } = useAuth();
  const { connected, alerts } = useSocket();
  
  const activeAlerts = alerts.filter(alert => !alert.isResolved);
  const criticalAlerts = activeAlerts.filter(alert => alert.severity === 'CRITICAL' || alert.severity === 'HIGH');

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="flex items-center justify-between px-4 py-3">
        {/* Left side */}
        <div className="flex items-center">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100"
          >
            <Menu className="h-6 w-6" />
          </button>
          
          <div className="ml-4 lg:ml-0">
            <h1 className="text-2xl font-semibold text-gray-900">
              Greenhouse Dashboard
            </h1>
            <p className="text-sm text-gray-500">
              Real-time monitoring and control
            </p>
          </div>
        </div>

        {/* Right side */}
        <div className="flex items-center space-x-4">
          {/* Connection Status */}
          <div className="flex items-center">
            {connected ? (
              <div className="flex items-center text-green-600">
                <Wifi className="h-5 w-5 mr-2" />
                <span className="text-sm hidden sm:inline">Connected</span>
              </div>
            ) : (
              <div className="flex items-center text-red-600">
                <WifiOff className="h-5 w-5 mr-2" />
                <span className="text-sm hidden sm:inline">Disconnected</span>
              </div>
            )}
          </div>

          {/* Notifications */}
          <div className="relative">
            <button className="p-2 text-gray-400 hover:text-gray-500 hover:bg-gray-100 rounded-full">
              <Bell className="h-6 w-6" />
              {criticalAlerts.length > 0 && (
                <span className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                  {criticalAlerts.length}
                </span>
              )}
            </button>
          </div>

          {/* User menu */}
          <div className="flex items-center space-x-2">
            <div className="hidden sm:block text-right">
              <p className="text-sm font-medium text-gray-900">{user?.username}</p>
              <p className="text-xs text-gray-500 capitalize">{user?.role}</p>
            </div>
            
            <div className="flex items-center space-x-2">
              <div className="h-8 w-8 bg-green-100 rounded-full flex items-center justify-center">
                <User className="h-5 w-5 text-green-600" />
              </div>
              
              <button
                onClick={logout}
                className="p-2 text-gray-400 hover:text-gray-500 hover:bg-gray-100 rounded-full"
                title="Logout"
              >
                <LogOut className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
