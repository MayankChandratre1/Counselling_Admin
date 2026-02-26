import axios from 'axios';

const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_REACT_APP_ADMIN_API_URL || 'http://localhost:3008'
});

// Attach token to every request
axiosInstance.interceptors.request.use((config) => {
  const token = sessionStorage.getItem('adminToken');
  if (token) {
    config.headers.token = token;
  }
  return config;
});

// Auto-logout on 401 (expired / invalid token)
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const requestUrl = error.config?.url || '';
      const isLoginRequest = requestUrl.includes('/api/admin/login');

      sessionStorage.removeItem('adminToken');
      sessionStorage.removeItem('adminInfo');
      // adminPages removed - now using adminInfo.permissions

      if (!isLoginRequest && window.location.pathname !== '/') {
        window.location.replace('/');
      }
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;
