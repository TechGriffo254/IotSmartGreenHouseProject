import axios from 'axios';

// Get API URL from environment with fallback
const getAPIUrl = () => {
  // For Vercel deployment - check multiple environment variable patterns
  const apiUrl = process.env.REACT_APP_API_URL || 
                 process.env.NEXT_PUBLIC_API_URL ||
                 'https://open-lauryn-ina-9662925b.koyeb.app/api';
  
  console.log('🔗 Environment:', process.env.NODE_ENV);
  console.log('🔗 All env vars:', Object.keys(process.env).filter(key => key.startsWith('REACT_APP')));
  console.log('🔗 API URL:', apiUrl);
  
  return apiUrl;
};

console.log('🔗 API URL:', getAPIUrl()); // Debug log

// Create axios instance with base configuration
const api = axios.create({
  baseURL: getAPIUrl(),
  timeout: 30000, // Increased timeout for cold starts
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  // Remove credentials to avoid CORS preflight issues
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Debug log for Vercel
    console.log('📤 API Request:', {
      url: config.url,
      method: config.method,
      baseURL: config.baseURL,
      hasToken: !!token
    });
    
    return config;
  },
  (error) => {
    console.error('📤 Request Error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor to handle common errors
api.interceptors.response.use(
  (response) => {
    console.log('📥 API Response:', {
      url: response.config.url,
      status: response.status,
      statusText: response.statusText
    });
    return response;
  },
  (error) => {
    console.error('📥 API Error:', {
      message: error.message,
      code: error.code,
      status: error.response?.status,
      statusText: error.response?.statusText,
      url: error.config?.url,
      baseURL: error.config?.baseURL,
      // Additional debugging for network errors
      isNetworkError: error.code === 'NETWORK_ERR' || error.message.includes('Network Error'),
      isCorsError: error.message.includes('CORS') || error.code === 'ERR_BLOCKED_BY_CLIENT',
      responseData: error.response?.data
    });

    // Handle different types of errors
    if (error.response) {
      // Server responded with error status
      const errorMessage = error.response.data?.message || 'Server error occurred';
      console.error('Server Error:', errorMessage);
      throw new Error(errorMessage);
    } else if (error.request) {
      // Request was made but no response received
      console.error('Network Error - No response received:', error.request);
      throw new Error('Network error - Please check your internet connection and try again');
    } else {
      // Something else happened
      console.error('Request Setup Error:', error.message);
      throw new Error(error.message || 'An unexpected error occurred');
    }
  }
);

export default api;
