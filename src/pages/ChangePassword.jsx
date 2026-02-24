import React, { useState } from 'react';
import { FaEnvelope, FaLock, FaKey, FaArrowLeft } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../utils/axios';

const ChangePassword = () => {
  const navigate = useNavigate();

  // Pre-fill with the logged-in admin's email
  const adminInfo = JSON.parse(sessionStorage.getItem('adminInfo') || 'null');
  const [email, setEmail] = useState(adminInfo?.email || '');

  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });

  const handleSendOTP = async (e) => {
    e.preventDefault();
    if (!email) {
      setMessage({ text: 'Please enter your email', type: 'error' });
      return;
    }

    setLoading(true);
    setMessage({ text: '', type: '' });

    try {
      const res = await axiosInstance.post('/api/admin/request-otp', { email });
      setMessage({ text: res.data.message, type: 'success' });
      setStep(2);
    } catch (error) {
      setMessage({
        text: error.response?.data?.error || 'Error sending OTP',
        type: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const verifyOTP = async (e) => {
    e.preventDefault();
    if (!otp) {
      setMessage({ text: 'Please enter the OTP', type: 'error' });
      return;
    }

    setLoading(true);
    setMessage({ text: '', type: '' });

    try {
      const res = await axiosInstance.post('/api/admin/verify-otp', { email, otp });
      setMessage({ text: res.data.message, type: 'success' });
      setStep(3);
    } catch (error) {
      setMessage({
        text: error.response?.data?.error || 'Invalid OTP',
        type: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (e) => {
    e.preventDefault();
    if (!newPassword) {
      setMessage({ text: 'Please enter a new password', type: 'error' });
      return;
    }
    if (newPassword.length < 6) {
      setMessage({ text: 'Password must be at least 6 characters', type: 'error' });
      return;
    }

    setLoading(true);
    setMessage({ text: '', type: '' });

    try {
      const res = await axiosInstance.post('/api/admin/change-password', {
        email,
        otp,
        newPassword,
      });
      setMessage({ text: res.data.message, type: 'success' });

      // Clear auth and force re-login after password change
      setTimeout(() => {
        sessionStorage.removeItem('adminToken');
        sessionStorage.removeItem('adminInfo');
        sessionStorage.removeItem('adminPages');
        navigate('/');
      }, 2000);
    } catch (error) {
      setMessage({
        text: error.response?.data?.error || 'Error changing password',
        type: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const goBack = () => {
    setMessage({ text: '', type: '' });
    setStep(step - 1);
  };

  const getStepTitle = () => {
    switch (step) {
      case 1: return 'Request Password Reset';
      case 2: return 'Verify OTP';
      case 3: return 'Create New Password';
      default: return 'Password Reset';
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <div className="w-full max-w-md bg-white rounded-lg shadow-xl overflow-hidden">
        <div className="bg-gradient-to-r from-blue-500 to-indigo-600 p-6">
          <h1 className="text-xl md:text-2xl font-bold text-white">{getStepTitle()}</h1>
          <p className="text-blue-100 mt-1">
            {step === 1 && 'Enter your email to receive a verification code'}
            {step === 2 && 'Enter the OTP sent to your email'}
            {step === 3 && 'Create a new secure password'}
          </p>
        </div>

        <div className="p-6">
          {/* Progress indicator */}
          <div className="flex mb-8 justify-center">
            {[1, 2, 3].map((s, i) => (
              <React.Fragment key={s}>
                <div
                  className={`w-8 h-8 flex items-center justify-center rounded-full text-sm font-semibold
                    ${step >= s ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-500'}`}
                >
                  {s}
                </div>
                {i < 2 && (
                  <div className={`w-16 h-1 mt-4 mx-2 ${step > s ? 'bg-blue-500' : 'bg-gray-200'}`} />
                )}
              </React.Fragment>
            ))}
          </div>

          {/* Alert message */}
          {message.text && (
            <div
              className={`p-3 rounded mb-4 text-sm
                ${message.type === 'error' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}
            >
              {message.text}
            </div>
          )}

          {/* Step 1: Request OTP */}
          {step === 1 && (
            <form onSubmit={handleSendOTP}>
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="email">
                  Email Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FaEnvelope className="text-gray-400" />
                  </div>
                  <input
                    id="email"
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg transition duration-200 disabled:opacity-50"
              >
                {loading ? 'Sending...' : 'Request Verification Code'}
              </button>
            </form>
          )}

          {/* Step 2: Verify OTP */}
          {step === 2 && (
            <form onSubmit={verifyOTP}>
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="otp">
                  Verification Code
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FaKey className="text-gray-400" />
                  </div>
                  <input
                    id="otp"
                    type="text"
                    placeholder="Enter 6-digit OTP"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    maxLength="6"
                  />
                </div>
                <p className="mt-2 text-sm text-gray-500">
                  We sent a verification code to <span className="font-medium">{email}</span>
                </p>
              </div>
              <div className="flex space-x-2">
                <button
                  type="button"
                  onClick={goBack}
                  className="flex items-center justify-center bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold py-2 px-4 rounded-lg transition duration-200"
                >
                  <FaArrowLeft className="mr-1" /> Back
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg transition duration-200 disabled:opacity-50"
                >
                  {loading ? 'Verifying...' : 'Verify Code'}
                </button>
              </div>
            </form>
          )}

          {/* Step 3: Change Password */}
          {step === 3 && (
            <form onSubmit={resetPassword}>
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="newPassword">
                  New Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FaLock className="text-gray-400" />
                  </div>
                  <input
                    id="newPassword"
                    type="password"
                    placeholder="Create new password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <p className="mt-2 text-sm text-gray-500">Password must be at least 6 characters</p>
              </div>
              <div className="flex space-x-2">
                <button
                  type="button"
                  onClick={goBack}
                  className="flex items-center justify-center bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold py-2 px-4 rounded-lg transition duration-200"
                >
                  <FaArrowLeft className="mr-1" /> Back
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg transition duration-200 disabled:opacity-50"
                >
                  {loading ? 'Updating...' : 'Update Password'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChangePassword;