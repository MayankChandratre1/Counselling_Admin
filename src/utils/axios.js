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
      sessionStorage.removeItem('adminToken');
      sessionStorage.removeItem('adminInfo');
      sessionStorage.removeItem('adminPages');
      window.location.href = '/';
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;
