import React from 'react';

const QuickStats = ({ stats }) => {
  const getColorClasses = (color) => {
    switch (color) {
      case 'blue':
        return 'bg-blue-100 text-blue-600';
      case 'green':
        return 'bg-green-100 text-green-600';
      case 'red':
        return 'bg-red-100 text-red-600';
      case 'yellow':
        return 'bg-yellow-100 text-yellow-600';
      case 'purple':
        return 'bg-purple-100 text-purple-600';
      default:
        return 'bg-gray-100 text-gray-600';
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat, index) => (
        <div key={index} className="bg-white rounded-lg shadow-md p-6 card-hover">
          <div className="flex items-center">
            <div className={`p-3 rounded-full ${getColorClasses(stat.color)}`}>
              <stat.icon className="h-6 w-6" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">{stat.name}</p>
              <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default QuickStats;
