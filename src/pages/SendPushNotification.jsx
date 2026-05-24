import React, { useState, useEffect, useCallback } from 'react';
import { Menu, Send, Bell, AlertCircle, CheckCircle, Users, MessageSquare, Filter, X } from 'lucide-react';
import axiosInstance from '../utils/axios';
import Navbar from '../components/Navbar';
import { usePremiumPage } from '../contexts/PremiumPageContext';

const SendPushNotification = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    message: '',
    url: ''
  });
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyPage, setHistoryPage] = useState(1);
  const [historyTotalPages, setHistoryTotalPages] = useState(1);
  const [targetMode, setTargetMode] = useState('all');
  const [specificUserIds, setSpecificUserIds] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [showConfirmation, setShowConfirmation] = useState(false);
  
  // Add filter states
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    isPremium: false,
    isFree: false,
    plan: '',
    listAssigned: false,
    listsNotAssigned: false
  });

  // Get premium plans from context
  const { premiumPlans, plansLoading } = usePremiumPage();

  const fetchHistory = useCallback(async (page = 1) => {
    try {
      setHistoryLoading(true);
      const response = await axiosInstance.get('/api/admin/notifications', {
        params: { page, limit: 10 }
      });
      if (response.data?.success) {
        setHistory(response.data.notifications || []);
        setHistoryPage(response.data.page || 1);
        setHistoryTotalPages(response.data.totalPages || 1);
      }
    } catch (err) {
      console.error('Failed to load notification history:', err);
    } finally {
      setHistoryLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHistory(1);
  }, [fetchHistory]);

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

  const handleFilterChange = (filterName, value) => {
    setFilters(prev => {
      const newFilters = { ...prev, [filterName]: value };
      
      // Handle mutual exclusivity for premium/free
      if (filterName === 'isPremium' && value) {
        newFilters.isFree = false;
      } else if (filterName === 'isFree' && value) {
        newFilters.isPremium = false;
      }
      
      // Handle mutual exclusivity for lists assigned/not assigned
      if (filterName === 'listAssigned' && value) {
        newFilters.listsNotAssigned = false;
      } else if (filterName === 'listsNotAssigned' && value) {
        newFilters.listAssigned = false;
      }
      
      return newFilters;
    });
  };

  const clearFilters = () => {
    setFilters({
      isPremium: false,
      isFree: false,
      plan: '',
      listAssigned: false,
      listsNotAssigned: false
    });
  };

  const hasActiveFilters = () => {
    return Object.values(filters).some(value => 
      typeof value === 'boolean' ? value : value !== ''
    );
  };

  const getSpecificUserIds = () => {
    return specificUserIds
      .split(/[\s,]+/)
      .map(id => id.trim())
      .filter(Boolean);
  };

  const getFilterDescription = () => {
    if (targetMode === 'specific') {
      const count = getSpecificUserIds().length;
      const userText = count > 0 ? `${count} specific user${count === 1 ? '' : 's'}` : 'Specific users';
      return filters.plan ? `${userText} (${filters.plan} plan)` : userText;
    }

    const activeFilters = [];
    
    if (filters.isPremium) activeFilters.push('Premium users');
    if (filters.isFree) activeFilters.push('Free users');
    if (filters.plan) activeFilters.push(`${filters.plan} plan users`);
    if (filters.listAssigned) activeFilters.push('Users with assigned lists');
    if (filters.listsNotAssigned) activeFilters.push('Users without assigned lists');
    
    if (activeFilters.length === 0) {
      return 'All registered users';
    }
    
    return activeFilters.join(', ');
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

    if (targetMode === 'specific' && getSpecificUserIds().length === 0) {
      setError('Enter at least one user ID for specific-user testing');
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
      
      // Prepare request data
      const requestData = {
        title: formData.title.trim(),
        message: formData.message.trim(),
        url: formData.url.trim() || undefined,
        plan: filters.plan || undefined,
      };

      if (targetMode === 'specific') {
        requestData.toAll = false;
        requestData.userIds = getSpecificUserIds();
      } else if (hasActiveFilters()) {
        requestData.toAll = false;
        requestData.filters = filters;
      } else {
        requestData.toAll = true;
      }
      
      const response = await axiosInstance.post('/api/admin/send-notification', requestData);
      
      if (response.data.success) {
        const targetText = getFilterDescription();
        setSuccess(`Push notification sent successfully to ${targetText}!`);
        setFormData({ title: '', message: '', url: '' });
        setTargetMode('all');
        setSpecificUserIds('');
        clearFilters();
        fetchHistory(1);
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
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center">
                <MessageSquare className="text-gray-600 mr-3" size={24} />
                <h2 className="text-xl font-semibold text-gray-800">Notification Details</h2>
              </div>
              
              {/* Filter Toggle Button */}
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-colors ${
                  hasActiveFilters() 
                    ? 'bg-blue-600 text-white hover:bg-blue-700' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <Filter size={16} />
                Target Audience
                {hasActiveFilters() && (
                  <span className="bg-blue-500 text-white text-xs px-2 py-1 rounded-full">
                    {Object.values(filters).filter(v => typeof v === 'boolean' ? v : v !== '').length}
                  </span>
                )}
              </button>
            </div>

            {/* Filters Section */}
            {showFilters && (
              <div className="mb-6 p-4 bg-gray-50 rounded-lg border">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium text-gray-800">Target Audience Filters</h3>
                  {hasActiveFilters() && (
                    <button
                      onClick={clearFilters}
                      className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1"
                    >
                      <X size={14} />
                      Clear all filters
                    </button>
                  )}
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {/* Premium/Free Filters */}
                  <div className="space-y-3">
                    <h4 className="text-sm font-medium text-gray-700">User Type</h4>
                    <div className="space-y-2">
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={filters.isPremium}
                          onChange={(e) => handleFilterChange('isPremium', e.target.checked)}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <span className="ml-2 text-sm text-gray-700">Premium users only</span>
                      </label>
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={filters.isFree}
                          onChange={(e) => handleFilterChange('isFree', e.target.checked)}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <span className="ml-2 text-sm text-gray-700">Free users only</span>
                      </label>
                    </div>
                  </div>

                  {/* Plan Filter */}
                  <div className="space-y-3">
                    <h4 className="text-sm font-medium text-gray-700">Specific Plan</h4>
                    <select
                      value={filters.plan}
                      onChange={(e) => handleFilterChange('plan', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      disabled={plansLoading}
                    >
                      <option value="">All plans</option>
                      {premiumPlans?.map(plan => (
                        <option key={plan.title} value={plan.title}>
                          {plan.title}
                        </option>
                      ))}
                    </select>
                    {plansLoading && (
                      <p className="text-xs text-gray-500">Loading plans...</p>
                    )}
                  </div>

                  {/* List Assignment Filters */}
                  <div className="space-y-3">
                    <h4 className="text-sm font-medium text-gray-700">List Assignment</h4>
                    <div className="space-y-2">
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={filters.listAssigned}
                          onChange={(e) => handleFilterChange('listAssigned', e.target.checked)}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <span className="ml-2 text-sm text-gray-700">Users with assigned lists</span>
                      </label>
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={filters.listsNotAssigned}
                          onChange={(e) => handleFilterChange('listsNotAssigned', e.target.checked)}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <span className="ml-2 text-sm text-gray-700">Users without assigned lists</span>
                      </label>
                    </div>
                  </div>
                </div>

                {/* Filter Summary */}
                <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <p className="text-sm text-blue-800">
                    <span className="font-medium">Target audience:</span> {getFilterDescription()}
                  </p>
                </div>
              </div>
            )}

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

              {/* Optional URL */}
              <div>
                <label htmlFor="url" className="block text-sm font-medium text-gray-700 mb-2">
                  Link URL (optional)
                </label>
                <input
                  type="url"
                  id="url"
                  name="url"
                  value={formData.url}
                  onChange={handleInputChange}
                  placeholder="https://example.com or WhatsApp group link"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                />
                <p className="text-sm text-gray-500 mt-1">
                  Users can open this link from the notification detail screen in the app.
                </p>
              </div>

              {/* Specific user test target */}
              <div className="border border-blue-200 bg-blue-50 rounded-lg p-4">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-3">
                  <div>
                    <h3 className="text-sm font-semibold text-blue-900">Test specific users</h3>
                    <p className="text-sm text-blue-700 mt-1">
                      Enter user IDs to send only to those users. Separate IDs with commas, spaces, or new lines.
                    </p>
                  </div>
                  <label className="flex items-center text-sm text-blue-900 font-medium">
                    <input
                      type="checkbox"
                      checked={targetMode === 'specific'}
                      onChange={(e) => {
                        setTargetMode(e.target.checked ? 'specific' : 'all');
                        if (error) setError(null);
                        if (success) setSuccess(null);
                      }}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded mr-2"
                    />
                    Send to specific user IDs
                  </label>
                </div>
                {targetMode === 'specific' && (
                  <div className="space-y-3">
                    <textarea
                      value={specificUserIds}
                      onChange={(e) => {
                        setSpecificUserIds(e.target.value);
                        if (error) setError(null);
                        if (success) setSuccess(null);
                      }}
                      rows="3"
                      placeholder="Example: userId1, userId2"
                      className="w-full px-4 py-3 border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors resize-vertical bg-white"
                    />
                    <div>
                      <label className="block text-sm font-medium text-blue-900 mb-2">
                        Save as plan-specific update (optional)
                      </label>
                      <select
                        value={filters.plan}
                        onChange={(e) => handleFilterChange('plan', e.target.value)}
                        className="w-full px-3 py-2 border border-blue-200 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                        disabled={plansLoading}
                      >
                        <option value="">No plan tag</option>
                        {premiumPlans?.map(plan => (
                          <option key={plan.title} value={plan.title}>
                            {plan.title}
                          </option>
                        ))}
                      </select>
                      <p className="text-xs text-blue-700 mt-1">
                        If selected, this notification will also appear in that plan's Updates page for the targeted users.
                      </p>
                    </div>
                  </div>
                )}
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

              {/* Recipients Info - Updated */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center">
                  <Users className="text-blue-600 mr-3" size={20} />
                  <div>
                    <h3 className="text-sm font-medium text-blue-800">Recipients</h3>
                    <p className="text-sm text-blue-700 mt-1">
                      This notification will be sent to: {getFilterDescription()}
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

          {/* Sent notifications history */}
          <div className="bg-white rounded-lg shadow-md p-6 mt-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-800">Sent Notifications</h2>
              <button
                type="button"
                onClick={() => fetchHistory(historyPage)}
                className="text-sm text-blue-600 hover:text-blue-800 font-medium"
              >
                Refresh
              </button>
            </div>

            {historyLoading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-600"></div>
              </div>
            ) : history.length === 0 ? (
              <p className="text-gray-500 text-sm py-4">No notifications sent yet.</p>
            ) : (
              <div className="space-y-3">
                {history.map((item) => (
                  <div key={item.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex flex-wrap justify-between gap-2 mb-2">
                      <h3 className="font-semibold text-gray-900">{item.title}</h3>
                      <span className="text-xs text-gray-500">
                        {item.createdAt ? new Date(item.createdAt).toLocaleString() : ''}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 line-clamp-2 mb-2">{item.message}</p>
                    <div className="flex flex-wrap gap-3 text-xs text-gray-500">
                      <span>Audience: {item.targetAudience || 'all'}</span>
                      <span>Recipients: {item.recipientCount ?? 0}</span>
                      <span>Push delivered: {item.sentCount ?? 0}</span>
                      {item.url && (
                        <a href={item.url} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline truncate max-w-xs">
                          {item.url}
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {historyTotalPages > 1 && (
              <div className="flex justify-center gap-3 mt-4">
                <button
                  type="button"
                  disabled={historyPage <= 1 || historyLoading}
                  onClick={() => fetchHistory(historyPage - 1)}
                  className="px-3 py-1 text-sm border rounded disabled:opacity-50"
                >
                  Previous
                </button>
                <span className="text-sm text-gray-600 self-center">
                  Page {historyPage} of {historyTotalPages}
                </span>
                <button
                  type="button"
                  disabled={historyPage >= historyTotalPages || historyLoading}
                  onClick={() => fetchHistory(historyPage + 1)}
                  className="px-3 py-1 text-sm border rounded disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            )}
          </div>

          {/* Confirmation Modal - Updated */}
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
                      Are you sure you want to send this notification?
                    </p>
                    
                    {/* Preview in confirmation */}
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 mb-4">
                      <p className="text-sm font-medium text-gray-800 mb-1">
                        Title: "{formData.title.trim()}"
                      </p>
                      <p className="text-sm text-gray-600 mb-2">
                        Message: "{formData.message.trim()}"
                      </p>
                      <p className="text-sm text-blue-600 font-medium">
                        Target: {getFilterDescription()}
                      </p>
                    </div>
                    
                    <p className="text-sm text-orange-600 font-medium">
                      This action cannot be undone.
                    </p>
                  </div>
                  
                  <div className="flex justify-end gap-3">
                    <button
                      onClick={() => setShowConfirmation(false)}
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