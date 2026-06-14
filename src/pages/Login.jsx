import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../utils/axios';
import { Eye, EyeOff } from 'lucide-react';

const getAdminDeviceId = () => {
  const storageKey = 'adminDeviceId';
  let deviceId = localStorage.getItem(storageKey);
  if (deviceId) {
    return deviceId;
  }

  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    deviceId = crypto.randomUUID();
  } else {
    deviceId = `adm_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
  }

  localStorage.setItem(storageKey, deviceId);
  return deviceId;
};

const AdminLogin = () => {
  const [credentials, setCredentials] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setCredentials((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await axiosInstance.post('/api/admin/login', {
        ...credentials,
        deviceId: getAdminDeviceId(),
        deviceName: navigator.platform ? `Web-${navigator.platform}` : 'Admin Web'
      });
      const { token, admin } = response.data;

      // Store auth data:
      //   adminToken       → JWT string
      //   adminInfo        → { id, email, name, role, permissions: { pages, components } }
      sessionStorage.setItem('adminToken', token);
      sessionStorage.setItem('adminInfo', JSON.stringify(admin));

      navigate('/home');
    } catch (err) {
      console.error('Login error:', err);
      setError(err.response?.data?.error || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        <div className="bg-white border border-gray-200 rounded-2xl shadow-xl p-8">
          <div className="text-center mb-8">
            <img
              src="/saarthi-logo.png"
              alt="Saarthi Admin Portal"
              className="w-16 h-16 mx-auto rounded-full object-cover mb-4"
            />
            <h1 className="text-2xl font-bold text-gray-900">Saarthi Admin Portal</h1>
            <p className="text-gray-600 mt-2 text-sm">Sign in to continue to the dashboard</p>
          </div>

          {error && (
            <div className="mb-5 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="email" className="block text-gray-700 text-sm font-medium mb-2">
                Email Address
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={credentials.email}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                placeholder="name@company.com"
                required
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-gray-700 text-sm font-medium mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  name="password"
                  value={credentials.password}
                  onChange={handleChange}
                  className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(prev => !prev)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition disabled:opacity-60 disabled:cursor-not-allowed font-medium"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <div className="mt-6 pt-4 border-t border-gray-100 text-center text-xs text-gray-500">
            Secure access for authorized admins only
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;