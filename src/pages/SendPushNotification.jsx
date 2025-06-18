import React, { useState } from 'react';
import { Menu, Send, Bell, AlertCircle, CheckCircle, Users, MessageSquare } from 'lucide-react';
import axiosInstance from '../utils/axios';
import Navbar from '../components/Navbar';

const SendPushNotification = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    message: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [showConfirmation, setShowConfirmation] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user starts typing
    if (error) setError(null);
    if (success) setSuccess(null);
  };

  const validateForm = () => {
    if (!formData.title.trim()) {
      setError('Notification title is required');
      return false;
    }
    
    if (formData.title.trim().length > 100) {
      setError('Title must be 100 characters or less');
      return false;
    }
    
    if (!formData.message.trim()) {
      setError('Notification message is required');
      return false;
    }
    
    if (formData.message.trim().length > 500) {
      setError('Message must be 500 characters or less');
      return false;
    }
    
    return true;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setShowConfirmation(true);
  };

  const handleConfirmSend = async () => {
    try {
      setLoading(true);
      setError(null);
      setSuccess(null);
      setShowConfirmation(false);
      
      const response = await axiosInstance.post('/api/admin/send-notification', {
        toAll: true,
        title: formData.title.trim(),
        message: formData.message.trim()
      });
      
      if (response.data.success) {
        setSuccess('Push notification sent successfully to all users!');
        setFormData({ title: '', message: '' }); // Reset form
      } else {
        setError(response.data.message || 'Failed to send notification');
      }
    } catch (error) {
      console.error('Error sending notification:', error);
      setError(
        error.response?.data?.message || 
        error.response?.data?.error || 
        'Failed to send push notification. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCancelConfirmation = () => {
    setShowConfirmation(false);
  };

  const getCharacterCount = (text, limit) => {
    const count = text.length;
    const isOverLimit = count > limit;
    return (
      <span className={`text-sm ${isOverLimit ? 'text-red-500' : 'text-gray-500'}`}>
        {count}/{limit}
      </span>
    );
  };

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Mobile menu button */}
      <button
        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        className="lg:hidden fixed top-4 left-4 z-20 p-2 rounded-md bg-gray-800 text-white"
      >
        <Menu size={24} />
      </button>

      {/* Sidebar */}
      <div className={`
        fixed inset-y-0 left-0 transform z-10
        lg:relative lg:translate-x-0 transition duration-200 ease-in-out
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <Navbar onClose={() => setIsSidebarOpen(false)} />
      </div>

      {/* Main content */}
      <div className="flex-1 overflow-auto p-4 md:p-6">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center mb-4">
              <div className="bg-blue-100 p-3 rounded-lg mr-4">
                <Bell className="text-blue-600" size={32} />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">
                  Send Push Notification
                </h1>
                <p className="text-gray-600 mt-1">
                  Send notifications to all users in the system
                </p>
              </div>
            </div>
          </div>

          {/* Error Display */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <div className="flex items-center">
                <AlertCircle className="h-5 w-5 text-red-400 mr-3" />
                <div>
                  <h3 className="text-sm font-medium text-red-800">Error</h3>
                  <p className="text-sm text-red-700 mt-1">{error}</p>
                </div>
              </div>
            </div>
          )}

          {/* Success Display */}
          {success && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
              <div className="flex items-center">
                <CheckCircle className="h-5 w-5 text-green-400 mr-3" />
                <div>
                  <h3 className="text-sm font-medium text-green-800">Success</h3>
                  <p className="text-sm text-green-700 mt-1">{success}</p>
                </div>
              </div>
            </div>
          )}

          {/* Notification Form */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center mb-6">
              <MessageSquare className="text-gray-600 mr-3" size={24} />
              <h2 className="text-xl font-semibold text-gray-800">Notification Details</h2>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Title Field */}
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                  Notification Title *
                </label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  placeholder="Enter notification title..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  maxLength={100}
                  required
                />
                <div className="flex justify-between items-center mt-1">
                  <p className="text-sm text-gray-500">
                    This will appear as the main heading of your notification
                  </p>
                  {getCharacterCount(formData.title, 100)}
                </div>
              </div>

              {/* Message Field */}
              <div>
                <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
                  Notification Message *
                </label>
                <textarea
                  id="message"
                  name="message"
                  value={formData.message}
                  onChange={handleInputChange}
                  placeholder="Enter your notification message here..."
                  rows="6"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors resize-vertical"
                  maxLength={500}
                  required
                />
                <div className="flex justify-between items-center mt-1">
                  <p className="text-sm text-gray-500">
                    Keep your message clear and concise for better user engagement
                  </p>
                  {getCharacterCount(formData.message, 500)}
                </div>
              </div>

              {/* Recipients Info */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center">
                  <Users className="text-blue-600 mr-3" size={20} />
                  <div>
                    <h3 className="text-sm font-medium text-blue-800">Recipients</h3>
                    <p className="text-sm text-blue-700 mt-1">
                      This notification will be sent to all registered users in the system
                    </p>
                  </div>
                </div>
              </div>

              {/* Preview Section */}
              {(formData.title.trim() || formData.message.trim()) && (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <h3 className="text-sm font-medium text-gray-800 mb-3">Notification Preview</h3>
                  <div className="bg-white border border-gray-300 rounded-lg p-4 max-w-sm">
                    <div className="flex items-start">
                      <div className="bg-blue-100 p-2 rounded-full mr-3 flex-shrink-0">
                        <Bell className="text-blue-600" size={16} />
                      </div>
                      <div className="flex-1 min-w-0">
                        {formData.title.trim() && (
                          <h4 className="text-sm font-semibold text-gray-900 mb-1 line-clamp-2">
                            {formData.title.trim()}
                          </h4>
                        )}
                        {formData.message.trim() && (
                          <p className="text-sm text-gray-600 line-clamp-3">
                            {formData.message.trim()}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Submit Button */}
              <div className="flex justify-end pt-4 border-t border-gray-200">
                <button
                  type="submit"
                  disabled={loading || !formData.title.trim() || !formData.message.trim()}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition duration-200 flex items-center justify-center min-w-[140px]"
                >
                  {loading ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
                  ) : (
                    <>
                      <Send size={18} className="mr-2" />
                      Send Notification
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Confirmation Modal */}
          {showConfirmation && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
                <div className="p-6">
                  <div className="flex items-center mb-4">
                    <div className="bg-orange-100 p-3 rounded-full mr-4">
                      <AlertCircle className="text-orange-600" size={24} />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      Confirm Send Notification
                    </h3>
                  </div>
                  
                  <div className="mb-6">
                    <p className="text-gray-600 mb-4">
                      Are you sure you want to send this notification to all users?
                    </p>
                    
                    {/* Preview in confirmation */}
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                      <p className="text-sm font-medium text-gray-800 mb-1">
                        Title: "{formData.title.trim()}"
                      </p>
                      <p className="text-sm text-gray-600">
                        Message: "{formData.message.trim()}"
                      </p>
                    </div>
                    
                    <p className="text-sm text-orange-600 mt-3 font-medium">
                      This action cannot be undone.
                    </p>
                  </div>
                  
                  <div className="flex justify-end gap-3">
                    <button
                      onClick={handleCancelConfirmation}
                      disabled={loading}
                      className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleConfirmSend}
                      disabled={loading}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-400 transition-colors flex items-center"
                    >
                      {loading ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                      ) : (
                        <Send size={16} className="mr-2" />
                      )}
                      {loading ? 'Sending...' : 'Send Now'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SendPushNotification;