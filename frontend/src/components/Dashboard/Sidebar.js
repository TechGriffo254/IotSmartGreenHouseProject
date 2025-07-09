import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  Home, 
  Activity, 
  Settings as SettingsIcon, 
  AlertTriangle, 
  BarChart3, 
  Cpu,
  Leaf,
  X
} from 'lucide-react';

const Sidebar = ({ sidebarOpen, setSidebarOpen }) => {
  const navigation = [
    { name: 'Overview', href: '/dashboard', icon: Home },
    { name: 'Sensor Monitoring', href: '/dashboard/sensors', icon: Activity },
    { name: 'Device Control', href: '/dashboard/devices', icon: Cpu },
    { name: 'Alert System', href: '/dashboard/alerts', icon: AlertTriangle },
    { name: 'Analytics', href: '/dashboard/analytics', icon: BarChart3 },
    { name: 'Settings', href: '/dashboard/settings', icon: SettingsIcon },
  ];

  return (
    <>
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-gray-600 bg-opacity-75 z-20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed inset-y-0 left-0 z-30 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out
        lg:translate-x-0 lg:static lg:inset-0
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200">
          <div className="flex items-center">
            <Leaf className="h-8 w-8 text-green-600" />
            <span className="ml-2 text-xl font-semibold text-gray-900">
              Smart Greenhouse
            </span>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden"
          >
            <X className="h-6 w-6 text-gray-400" />
          </button>
        </div>

        <nav className="mt-8">
          <div className="px-4 space-y-2">
            {navigation.map((item) => (
              <NavLink
                key={item.name}
                to={item.href}
                end={item.href === '/dashboard'}
                className={({ isActive }) => `
                  group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors duration-200
                  ${isActive 
                    ? 'bg-green-100 text-green-900' 
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }
                `}
                onClick={() => setSidebarOpen(false)}
              >
                {({ isActive }) => (
                  <>
                    <item.icon 
                      className={`mr-3 h-6 w-6 ${
                        isActive ? 'text-green-500' : 'text-gray-400 group-hover:text-gray-500'
                      }`} 
                    />
                    {item.name}
                  </>
                )}
              </NavLink>
            ))}
          </div>
        </nav>

        {/* Status indicator */}
        <div className="absolute bottom-4 left-4 right-4">
          <div className="bg-green-50 border border-green-200 rounded-lg p-3">
            <div className="flex items-center">
              <div className="status-dot status-online"></div>
              <span className="text-sm text-green-800">System Online</span>
            </div>
            <p className="text-xs text-green-600 mt-1">
              Greenhouse monitoring active
            </p>
          </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar;
