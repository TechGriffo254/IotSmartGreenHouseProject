import axios from 'axios';

// Get API URL from environment with fallback
const getAPIUrl = () => {
  // For Vercel deployment
  if (process.env.REACT_APP_API_URL) {
    return process.env.REACT_APP_API_URL;
  }
  
  // Fallback to your live backend
  return 'https://open-lauryn-ina-9662925b.koyeb.app/api';
};

console.log('🔗 API URL:', getAPIUrl()); // Debug log

// Create axios instance with base configuration
const api = axios.create({
  baseURL: getAPIUrl(),
  timeout: 15000, // Increased timeout for Vercel cold starts
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Important for CORS with credentials
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
      url: error.config?.url,
      status: error.response?.status,
      statusText: error.response?.statusText,
      message: error.message,
      data: error.response?.data
    });

    if (error.response?.status === 401) {
      // Token expired or invalid
      console.log('🔒 Authentication failed, clearing token');
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      
      // Only redirect if not already on login page
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    
    return Promise.reject(error);
  }
);

export default api;
