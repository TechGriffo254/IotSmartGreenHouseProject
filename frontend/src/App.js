import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Login from './components/auth/Login';
import Dashboard from './components/Dashboard/Dashboard';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import LoadingSpinner from './components/common/LoadingSpinner';
import PullToRefresh from './components/common/PullToRefresh';
import './App.css';

function AppRoutes() {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingSpinner />;
  }

  const routeElement = (
    <Routes>
      <Route 
        path="/login" 
        element={user ? <Navigate to="/dashboard" /> : <Login />} 
      />
      <Route 
        path="/dashboard/*" 
        element={user ? <Dashboard /> : <Navigate to="/login" />} 
      />
      <Route 
        path="/" 
        element={<Navigate to={user ? "/dashboard" : "/login"} />} 
      />
    </Routes>
  );

  // Wrap the authenticated routes with PullToRefresh
  return user ? (
    <PullToRefresh>
      {routeElement}
    </PullToRefresh>
  ) : routeElement;
}

function App() {
  return (
    <div className="App">
      <AuthProvider>
        <Router>
          <SocketProvider>
            <AppRoutes />
            <Toaster 
              position="top-right"
              toastOptions={{
                duration: 4000,
                style: {
                  background: '#363636',
                  color: '#fff',
                },
                success: {
                  style: {
                    background: '#10b981',
                  },
                },
                error: {
                  style: {
                    background: '#ef4444',
                  },
                },
              }}
            />
          </SocketProvider>
        </Router>
      </AuthProvider>
    </div>
  );
}

export default App;
