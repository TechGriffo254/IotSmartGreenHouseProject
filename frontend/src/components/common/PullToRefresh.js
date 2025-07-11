import React, { useState, useEffect } from 'react';
import { useSocket } from '../../context/SocketContext';

// Simple pull-to-refresh component for mobile devices
const PullToRefresh = ({ children }) => {
  const [isPulling, setIsPulling] = useState(false);
  const [startY, setStartY] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const { refreshAllData } = useSocket();

  // Handle touch start
  const onTouchStart = (e) => {
    // Only enable pull-to-refresh at the top of the page
    if (window.scrollY === 0) {
      setStartY(e.touches[0].clientY);
      setIsPulling(true);
    }
  };

  // Handle touch move
  const onTouchMove = (e) => {
    if (!isPulling) return;
    
    const currentY = e.touches[0].clientY;
    const diff = currentY - startY;
    
    // Only show refresh indicator if pulling down more than 50px
    if (diff > 50) {
      document.getElementById('refresh-indicator').style.opacity = '1';
      document.getElementById('refresh-indicator').style.transform = `translateY(${Math.min(diff/2, 70)}px)`;
    }
  };

  // Handle touch end
  const onTouchEnd = async (e) => {
    if (!isPulling) return;
    
    const currentY = e.changedTouches[0].clientY;
    const diff = currentY - startY;
    
    // If pulled down more than 100px, trigger refresh
    if (diff > 100) {
      setRefreshing(true);
      try {
        await refreshAllData();
      } catch (error) {
        console.error('Refresh failed:', error);
      } finally {
        setRefreshing(false);
      }
    }
    
    // Reset the indicator
    document.getElementById('refresh-indicator').style.opacity = '0';
    document.getElementById('refresh-indicator').style.transform = 'translateY(0)';
    setIsPulling(false);
  };

  useEffect(() => {
    // Add touch event listeners to document
    document.addEventListener('touchstart', onTouchStart);
    document.addEventListener('touchmove', onTouchMove);
    document.addEventListener('touchend', onTouchEnd);
    
    // Clean up
    return () => {
      document.removeEventListener('touchstart', onTouchStart);
      document.removeEventListener('touchmove', onTouchMove);
      document.removeEventListener('touchend', onTouchEnd);
    };
  }, [isPulling, startY]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <>
      <div 
        id="refresh-indicator" 
        className="fixed top-0 left-0 w-full h-16 flex items-center justify-center transition-all duration-300 z-50 opacity-0 pointer-events-none"
        style={{ transform: 'translateY(0)' }}
      >
        <div className={`flex items-center justify-center bg-green-500 text-white px-4 py-2 rounded-full ${refreshing ? 'animate-pulse' : ''}`}>
          {refreshing ? 'Refreshing...' : 'Pull down to refresh'}
        </div>
      </div>
      {children}
    </>
  );
};

export default PullToRefresh;
