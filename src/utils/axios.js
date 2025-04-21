import axios from 'axios';

const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_REACT_APP_ADMIN_API_URL || 'http://localhost:3008'  // Use environment variable with fallback
});

// Add a request interceptor to add the token to all requests
axiosInstance.interceptors.request.use((config) => {
  const token = sessionStorage.getItem('adminToken');
  if (token) {
    config.headers.token = token;
  }
  return config;
});

export default axiosInstance;
