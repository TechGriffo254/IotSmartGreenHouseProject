import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(localStorage.getItem('token'));

  // Configure api defaults - no longer needed as api service handles this
  useEffect(() => {
    // The api service handles authorization headers automatically
  }, [token]);

  // Check if user is authenticated on mount
  useEffect(() => {
    const checkAuth = async () => {
      if (token) {
        try {
          const response = await api.get('/api/auth/me');
          setUser(response.data.data);
        } catch (error) {
          console.error('Auth check failed:', error);
          localStorage.removeItem('token');
          setToken(null);
          setUser(null);
        }
      }
      setLoading(false);
    };

    checkAuth();
  }, [token]);

  const login = async (credentials) => {
    try {
      console.log('🔐 Attempting login with:', { username: credentials.username });
      
      const response = await api.post('/api/auth/login', credentials);
      console.log('🔐 Login response:', response.data);
      
      const { token: newToken, user: userData } = response.data;
      
      if (!newToken) {
        throw new Error('No token received from server');
      }
      
      localStorage.setItem('token', newToken);
      localStorage.setItem('user', JSON.stringify(userData));
      setToken(newToken);
      setUser(userData);
      
      toast.success(`Welcome back, ${userData.username || userData.email}!`);
      return { success: true, user: userData };
    } catch (error) {
      console.error('🔐 Login error:', error);
      
      let message = 'Login failed';
      if (error.response?.data?.message) {
        message = error.response.data.message;
      } else if (error.message) {
        message = error.message;
      } else if (error.code === 'NETWORK_ERROR') {
        message = 'Network error. Please check your connection.';
      }
      
      toast.error(message);
      return { success: false, message };
    }
  };

  const register = async (userData) => {
    try {
      console.log('📝 Attempting registration with:', { email: userData.email });
      
      const response = await api.post('/api/auth/register', userData);
      console.log('📝 Registration response:', response.data);
      
      const { token: newToken, user: newUser } = response.data;
      
      if (!newToken) {
        throw new Error('No token received from server');
      }
      
      localStorage.setItem('token', newToken);
      localStorage.setItem('user', JSON.stringify(newUser));
      setToken(newToken);
      setUser(newUser);
      
      toast.success(`Welcome, ${newUser.username || newUser.email}!`);
      return { success: true, user: newUser };
    } catch (error) {
      console.error('📝 Registration error:', error);
      
      let message = 'Registration failed';
      if (error.response?.data?.message) {
        message = error.response.data.message;
      } else if (error.message) {
        message = error.message;
      } else if (error.code === 'NETWORK_ERROR') {
        message = 'Network error. Please check your connection.';
      }
      
      toast.error(message);
      return { success: false, message };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    toast.success('Logged out successfully');
  };

  const updateProfile = async (profileData) => {
    try {
      const response = await api.put('/api/auth/profile', profileData);
      setUser(response.data.data);
      toast.success('Profile updated successfully');
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || 'Profile update failed';
      toast.error(message);
      return { success: false, message };
    }
  };

  const changePassword = async (passwordData) => {
    try {
      await api.put('/api/auth/password', passwordData);
      toast.success('Password updated successfully');
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || 'Password change failed';
      toast.error(message);
      return { success: false, message };
    }
  };

  const refreshToken = async () => {
    try {
      const response = await api.post('/api/auth/refresh');
      const { token: newToken, user: userData } = response.data;
      
      localStorage.setItem('token', newToken);
      setToken(newToken);
      setUser(userData);
      
      return { success: true };
    } catch (error) {
      console.error('Token refresh failed:', error);
      logout();
      return { success: false };
    }
  };

  const value = {
    user,
    loading,
    login,
    register,
    logout,
    updateProfile,
    changePassword,
    refreshToken,
    isAuthenticated: !!user
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
