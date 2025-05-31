import React, { useState, useEffect } from 'react';
import { Menu, Search, ChevronLeft, ChevronRight, AlertCircle, Check, X, Clock, Copy, CheckCircle, ChevronDown, ChevronUp, Eye, ExternalLink, EyeClosed, Info } from 'lucide-react';
import axiosInstance from '../utils/axios';
import Navbar from '../components/Navbar';
import { useNavigate } from 'react-router-dom';
import { usePremiumPage } from '../contexts/PremiumPageContext';

const PaymentLogs = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [hasMore, setHasMore] = useState(false);
  const [lastDocId, setLastDocId] = useState(null);
  
  // Search states
  const [searchType, setSearchType] = useState('phone'); // 'phone', 'order-id', 'payment-id'
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchMode, setIsSearchMode] = useState(false);

  // Add filter states
  const [filters, setFilters] = useState({
    fromDate: null,
    toDate: null,
    plan: 'all',
    status: '' // Add status filter
  });
  const [isFilterMode, setIsFilterMode] = useState(false);
  const [isFilterCollapsed, setIsFilterCollapsed] = useState(true);

  // Add state to track copied field
  const [copiedField, setCopiedField] = useState(null);
  const [expandedRows, setExpandedRows] = useState(new Set());
  const navigate = useNavigate();
  const {premiumPlans} = usePremiumPage();

  useEffect(() => {
    if (!isSearchMode && !isFilterMode) {
      fetchPayments();
    }
  }, [currentPage, limit]);

  const fetchPayments = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const params = {
        page: currentPage,
        limit
      };
      
      if (lastDocId && currentPage > 1) {
        params.lastdoc = lastDocId;
      }
      
      const response = await axiosInstance.get('/api/admin/payments', { params });
      
      if (response.data && Array.isArray(response.data)) {
        setPayments(response.data);
        setHasMore(response.data.length === limit);
        
        // Store the last document ID for pagination
        if (response.data.length > 0) {
          setLastDocId(response.data[response.data.length - 1].id);
        }
      }
    } catch (error) {
      console.error('Error fetching payment logs:', error);
      setError('Failed to fetch payment logs. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    
    if (!searchQuery.trim()) {
      setIsSearchMode(false);
      fetchPayments();
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      setIsSearchMode(true);
      
      let endpoint;
      switch (searchType) {
        case 'phone':
          endpoint = `/api/admin/payments/phone/${encodeURIComponent(searchQuery)}`;
          break;
        case 'order-id':
          endpoint = `/api/admin/payments/order-id/${encodeURIComponent(searchQuery)}`;
          break;
        case 'payment-id':
          endpoint = `/api/admin/payments/payment-id/${encodeURIComponent(searchQuery)}`;
          break;
        default:
          endpoint = `/api/admin/payments/phone/${encodeURIComponent(searchQuery)}`;
      }
      
      const response = await axiosInstance.get(endpoint);
      
      if (response.data && Array.isArray(response.data)) {
        setPayments(response.data);
        setHasMore(false); // Search results are not paginated
      }
    } catch (error) {
      console.error('Error searching payment logs:', error);
      setError(`No payment records found for ${searchType}: ${searchQuery}`);
      setPayments([]);
    } finally {
      setLoading(false);
    }
  };

  const resetSearch = () => {
    setSearchQuery('');
    setSearchType('phone');
    setIsSearchMode(false);
    setCurrentPage(1);
    setLastDocId(null);
    fetchPayments();
  };

  // Add filter handling functions
  const handleFilterChange = (field, value) => {
    setFilters(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Add explicit handlers for pagination with filters
  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
    if (isFilterMode) {
      // If filters are active, refresh with filters
      handleFilterRefresh(newPage);
    } else if (isSearchMode) {
      // Search mode doesn't use pagination
      return;
    } else {
      // Normal pagination
      fetchPayments();
    }
  };

  const handlePageSizeChange = (newSize) => {
    setLimit(newSize);
    setCurrentPage(1);
    setLastDocId(null);
    if (isFilterMode) {
      handleFilterRefresh(1);
    } else if (!isSearchMode) {
      fetchPayments();
    }
  };

  // New function to handle filter refresh with pagination
  const handleFilterRefresh = async (page = currentPage) => {
    try {
      setLoading(true);
      setError(null);
      
      const filterParams = {
        page,
        limit,
        lastDoc: page === 1 ? null : lastDocId
      };
      
      // Add date filters if they exist
      if (filters.fromDate) {
        filterParams.fromDate = filters.fromDate;
      }
      
      if (filters.toDate) {
        filterParams.toDate = filters.toDate;
      }
      
      // Add plan filter if not 'all'
      if (filters.plan !== 'all') {
        filterParams.plan = filters.plan;
      }

      // Add status filter if provided
      if (filters.status.trim()) {
        filterParams.status = filters.status.toLowerCase();
      }
      
      const response = await axiosInstance.get('/api/admin/payments', { 
        params: filterParams 
      });
      
      if (response.data && Array.isArray(response.data)) {
        setPayments(response.data);
        setHasMore(response.data.length === limit);
        
        // Store the last document ID for pagination
        if (response.data.length > 0) {
          setLastDocId(response.data[response.data.length - 1].id);
        }
      }
    } catch (error) {
      console.error('Error filtering payment logs:', error);
      setError('Failed to filter payment logs. Please try again.');
      setPayments([]);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterSubmit = async (e) => {
    e.preventDefault();
    
    setIsFilterMode(true);
    setIsSearchMode(false);
    setCurrentPage(1);
    setLastDocId(null);
    
    await handleFilterRefresh(1);
  };

  const clearFilters = () => {
    setFilters({
      fromDate: null,
      toDate: null,
      plan: 'all',
      status: '' // Reset status filter
    });
    setIsFilterMode(false);
    setIsSearchMode(false);
    setCurrentPage(1);
    setLastDocId(null);
    fetchPayments();
  };

  const formatAmount = (amount) => {
    if (!amount && amount !== 0) return 'N/A';
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount); // Converting paise to rupees
  };

  const formatDate = (timestamp) => {
    if (!timestamp || !timestamp._seconds) return 'N/A';
    const date = new Date(timestamp._seconds * 1000);
    return date.toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatPhoneNumber = (phone) => {
    if (!phone) return 'N/A';
    // Remove any non-digit characters
    const cleaned = phone.replace(/\D/g, '');
    // Format as Indian mobile number if it has 10 digits
    if (cleaned.length === 10) {
      return `+91 ${cleaned}`;
    } else if (cleaned.length > 10) {
      // If it includes country code
      return `+${cleaned.slice(0, cleaned.length - 10)} ${cleaned.slice(-10)}`;
    }
    return phone; // Return as is if it doesn't match expected formats
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'captured':
      case 'paid':
        return 'bg-green-100 text-green-800';
      case 'refunded':
        return 'bg-amber-100 text-amber-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      case 'pending':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPaymentIcon = (status) => {
    switch (status) {
      case 'captured':
      case 'paid':
        return <Check className="w-4 h-4 text-green-500" />;
      case 'refunded':
        return <Clock className="w-4 h-4 text-amber-500" />;
      case 'failed':
        return <X className="w-4 h-4 text-red-500" />;
      case 'pending':
        return <Clock className="w-4 h-4 text-blue-500" />;
      default:
        return null;
    }
  };

  const copyToClipboard = async (text, field) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const toggleRowExpansion = (paymentId) => {
    setExpandedRows(prev => {
      const newSet = new Set(prev);
      if (newSet.has(paymentId)) {
        newSet.delete(paymentId);
      } else {
        newSet.add(paymentId);
      }
      return newSet;
    });
  };

  const getPhoneLast10Digits = (phone) => {
    if (!phone) return '';
    const cleanPhone = phone.replace(/\D/g, '');
    return cleanPhone.slice(-10);
  };

  const navigateToUser = (contact) => {
    if (contact) {
      const phone = getPhoneLast10Digits(contact);
      navigate(`/users/phone/${phone}`);
    }
  };

  const extractPaymentData = (payment) => {
    const eventType = payment.eventType;
    
    // Handle different event structures
    if (eventType === 'order.paid') {
      // Check if data has nested payment and order objects
      if (payment.data.payment && payment.data.order) {
        // Structure 1: data contains both payment and order objects
        return {
          paymentData: payment.data.payment,
          orderData: payment.data.order,
          isNestedStructure: true
        };
      } else {
        // Structure 2: data is the order object directly
        return {
          paymentData: {},
          orderData: payment.data,
          isNestedStructure: false
        };
      }
    } else if (eventType.includes('payment.')) {
      // Payment events - data is the payment object
      return {
        paymentData: payment.data,
        orderData: {},
        isNestedStructure: false
      };
    } else {
      // Other order events - data is the order object
      return {
        paymentData: {},
        orderData: payment.data,
        isNestedStructure: false
      };
    }
  };

  const getContactFromData = (paymentData, orderData, isNestedStructure) => {
    // For nested structure order.paid events, prioritize payment contact
    if (isNestedStructure && paymentData.contact) {
      return paymentData.contact;
    }
    if(paymentData.contact) {
      return paymentData.contact;
    }
    console.log("Order Data Contact:", orderData);
    
  if (orderData.notes && orderData.notes.userPhone) {
      return `+91${orderData.notes.userPhone}`; // Assuming notes contains userPhone
    }
    return "N/A";
  };

  const getAmountFromData = (paymentData, orderData, isNestedStructure) => {
    // For nested structure, prioritize payment amount
    if (isNestedStructure && paymentData.amount) {
      return paymentData.amount;
    }
    // Otherwise use payment amount or order amount
    return paymentData.amount || orderData.amount;
  };

  const getStatusFromData = (paymentData, orderData, eventType) => {
    // For payment events, use payment status
    if (eventType.includes('payment.') && paymentData.status) {
      return paymentData.status;
    }
    // For order events, use order status
    return orderData.status || paymentData.status;
  };

  const getOrderIdFromData = (paymentData, orderData, isNestedStructure) => {
    // For nested structure, prioritize order id
    if (isNestedStructure && orderData.id) {
      return orderData.id;
    }
    // Otherwise use payment order_id or order id
    return paymentData.order_id || orderData.id;
  };

  const renderDetailRow = (payment) => {
    const formatTimestamp = (timestamp) => {
      if (!timestamp) return 'N/A';
      if (timestamp._seconds) {
        return new Date(timestamp._seconds * 1000).toLocaleString('en-IN');
      }
      return new Date(timestamp * 1000).toLocaleString('en-IN');
    };

    const renderValue = (value) => {
      if (value === null || value === undefined) return 'null';
      if (typeof value === 'boolean') return value.toString();
      if (typeof value === 'object') {
        return (
          <pre className="text-xs text-gray-600 whitespace-pre-wrap max-w-md overflow-auto">
            {JSON.stringify(value, null, 2)}
          </pre>
        );
      }
      if (typeof value === 'string' && value.length > 100) {
        return (
          <div className="max-w-md">
            <div className="text-sm text-gray-700 break-words">{value}</div>
          </div>
        );
      }
      return <span className="text-sm text-gray-700">{value.toString()}</span>;
    };

    const renderKeyValuePairs = (obj, prefix = '') => {
      return Object.entries(obj).map(([key, value]) => (
        <div key={`${prefix}${key}`} className="grid grid-cols-1 md:grid-cols-3 gap-2 py-2 border-b border-gray-100 last:border-0">
          <div className="font-medium text-sm text-gray-600">
            {prefix}{key}:
          </div>
          <div className="md:col-span-2">
            {renderValue(value)}
          </div>
        </div>
      ));
    };

    const { paymentData, orderData, isNestedStructure } = extractPaymentData(payment);

    return (
      <tr key={`${payment.id}-details`}>
        <td colSpan="9" className="px-6 py-4 bg-gray-50">
          <div className="space-y-6">
            {/* Event Information */}
            <div>
              <h4 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
                <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                Event Information
              </h4>
              <div className="bg-white rounded-lg p-4 shadow-sm">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2 py-2 border-b border-gray-100">
                  <div className="font-medium text-sm text-gray-600">Event ID:</div>
                  <div className="md:col-span-2 text-sm text-gray-700">{payment.id}</div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2 py-2 border-b border-gray-100">
                  <div className="font-medium text-sm text-gray-600">Event Type:</div>
                  <div className="md:col-span-2">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(payment.eventType)}`}>
                      {payment.eventType}
                    </span>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2 py-2">
                  <div className="font-medium text-sm text-gray-600">Timestamp:</div>
                  <div className="md:col-span-2 text-sm text-gray-700">{formatTimestamp(payment.timestamp)}</div>
                </div>
                {isNestedStructure && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2 py-2 border-t border-gray-100 pt-2">
                    <div className="font-medium text-sm text-gray-600">Structure Type:</div>
                    <div className="md:col-span-2">
                      <span className="px-2 py-1 text-xs font-medium rounded-full bg-purple-100 text-purple-800">
                        Nested (Payment + Order)
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Payment Data (if available) */}
            {Object.keys(paymentData).length > 0 && (
              <div>
                <h4 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
                  <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                  Payment Details
                </h4>
                <div className="bg-white rounded-lg p-4 shadow-sm max-h-96 overflow-y-auto">
                  {renderKeyValuePairs(paymentData, 'payment.')}
                </div>
              </div>
            )}

            {/* Order Data (if available) */}
            {Object.keys(orderData).length > 0 && (
              <div>
                <h4 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
                  <span className="w-2 h-2 bg-orange-500 rounded-full mr-2"></span>
                  Order Details
                </h4>
                <div className="bg-white rounded-lg p-4 shadow-sm max-h-96 overflow-y-auto">
                  {renderKeyValuePairs(orderData, 'order.')}
                </div>
              </div>
            )}

            {/* Raw Data (for debugging) */}
            <div>
              <h4 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
                <span className="w-2 h-2 bg-gray-500 rounded-full mr-2"></span>
                Raw Event Data
              </h4>
              <div className="bg-white rounded-lg p-4 shadow-sm max-h-96 overflow-y-auto">
                <pre className="text-xs text-gray-600 whitespace-pre-wrap">
                  {JSON.stringify(payment.data, null, 2)}
                </pre>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex flex-wrap gap-2">
              {getContactFromData(paymentData, orderData, extractPaymentData(payment).isNestedStructure) && (
                <button
                  onClick={() => navigateToUser(getContactFromData(paymentData, orderData, extractPaymentData(payment).isNestedStructure))}
                  className="px-3 py-1 bg-blue-100 text-blue-700 rounded-md text-sm hover:bg-blue-200 transition-colors flex items-center"
                >
                  <ExternalLink size={14} className="mr-1" />
                  View User
                </button>
              )}
              {(paymentData.id || orderData.id) && (
                <button
                  onClick={() => copyToClipboard(paymentData.id || orderData.id, `detail-${payment.id}`)}
                  className="px-3 py-1 bg-gray-100 text-gray-700 rounded-md text-sm hover:bg-gray-200 transition-colors flex items-center"
                >
                  {copiedField === `detail-${payment.id}` ? (
                    <CheckCircle size={14} className="mr-1 text-green-500" />
                  ) : (
                    <Copy size={14} className="mr-1" />
                  )}
                  Copy ID
                </button>
              )}
            </div>
          </div>
        </td>
      </tr>
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
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">Payment Logs</h1>
          </div>

          {/* Search Section */}
          <div className="bg-white rounded-lg shadow-md p-4 sm:p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-800">Search Payments</h2>
            <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <select
                  value={searchType}
                  onChange={(e) => setSearchType(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="phone">Search by Phone</option>
                  <option value="order-id">Search by Order ID</option>
                  <option value="payment-id">Search by Payment ID</option>
                </select>
              </div>
              <div className="flex-2">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={`Enter ${searchType.replace('-', ' ')}...`}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 transition duration-200"
                >
                  {loading ? 'Searching...' : 'Search'}
                </button>
                {(isSearchMode || isFilterMode) && (
                  <button
                    type="button"
                    onClick={resetSearch}
                    className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition duration-200"
                  >
                    Clear
                  </button>
                )}
              </div>
            </form>
          </div>

          {/* Filters Section */}
          <div className="bg-white rounded-lg shadow-md mb-6 overflow-hidden">
            <div 
              className="flex justify-between items-center p-4 bg-gray-50 cursor-pointer"
              onClick={() => setIsFilterCollapsed(!isFilterCollapsed)}
            >
              <h2 className="text-xl font-semibold text-gray-800">Advanced Filters</h2>
              <div className="flex items-center gap-2">
                {isFilterMode && (
                  <span className="text-sm text-blue-600 bg-blue-100 px-2 py-1 rounded-full">
                    Filters Active
                  </span>
                )}
                {isFilterCollapsed ? (
                  <ChevronDown className="w-5 h-5 text-gray-600" />
                ) : (
                  <ChevronUp className="w-5 h-5 text-gray-600" />
                )}
              </div>
            </div>
            
            {!isFilterCollapsed && (
              <div className="p-4 sm:p-6 border-t border-gray-200">
                <form onSubmit={handleFilterSubmit} className="space-y-6">
                  {/* Date Range Row */}
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-3">Date Range</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* From Date */}
                      <div>
                        <label htmlFor="fromDate" className="block text-sm font-medium text-gray-700 mb-1">
                          From Date
                        </label>
                        <input
                          type="date"
                          id="fromDate"
                          value={filters.fromDate || ''}
                          onChange={(e) => handleFilterChange('fromDate', e.target.value || null)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>

                      {/* To Date */}
                      <div>
                        <label htmlFor="toDate" className="block text-sm font-medium text-gray-700 mb-1">
                          To Date
                        </label>
                        <input
                          type="date"
                          id="toDate"
                          value={filters.toDate || ''}
                          onChange={(e) => handleFilterChange('toDate', e.target.value || null)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Other Filters Row */}
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-3">Additional Filters</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {/* Plan Filter */}
                      <div>
                        <label htmlFor="plan" className="block text-sm font-medium text-gray-700 mb-1">
                          Plan
                        </label>
                        <select
                          id="plan"
                          value={filters.plan}
                          onChange={(e) => handleFilterChange('plan', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                          <option value="all">All Plans</option>
                          {premiumPlans.map((plan) => (
                            <option key={plan.id} value={plan.title}>
                              {plan.title} ({formatAmount(plan.price)})
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Status Filter */}
                      <div>
                        <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
                          Status
                        </label>
                        <input
                          type="text"
                          id="status"
                          value={filters.status}
                          onChange={(e) => handleFilterChange('status', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="e.g., success, pending, failed"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          Enter payment status (case insensitive)
                        </p>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex items-end gap-2">
                        <button
                          type="submit"
                          disabled={loading}
                          className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 transition duration-200"
                        >
                          {loading ? 'Filtering...' : 'Apply Filters'}
                        </button>
                        <button
                          type="button"
                          onClick={clearFilters}
                          className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition duration-200"
                        >
                          Clear
                        </button>
                      </div>
                    </div>
                  </div>
                </form>
              </div>
            )}
          </div>

          {/* Payment logs table */}
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
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

            {loading ? (
              <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-700"></div>
              </div>
            ) : payments.length === 0 ? (
              <div className="text-center py-16">
                <p className="text-gray-500 text-lg">No payment records found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        <Info size={16} className="inline-block mr-1" />
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Timestamp
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        User
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Order ID
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Event
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Plan
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Amount
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Method
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Payment ID
                      </th>
                      
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {payments.map((payment) => {
                      const { paymentData, orderData, isNestedStructure } = extractPaymentData(payment);
                      
                      const eventType = payment.eventType;
                      const amount = getAmountFromData(paymentData, orderData, isNestedStructure);
                      const status = getStatusFromData(paymentData, orderData, eventType);
                      const orderId = getOrderIdFromData(paymentData, orderData, isNestedStructure);
                      const paymentId = paymentData.id || '';
                      const method = paymentData.method || '';
                      const contact = getContactFromData(paymentData, orderData, isNestedStructure);
                      
                      // Get plan title from notes - check both payment and order notes
                      const planTitle = paymentData.notes?.planTitle || orderData.notes?.planTitle || 'N/A';

                      const rows = [
                        <tr key={payment.id} className="hover:bg-gray-50">
                           <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <button
                              onClick={() => toggleRowExpansion(payment.id)}
                              className="inline-flex items-center px-3 py-1 border border-gray-300 rounded-md text-sm bg-white hover:bg-gray-50 transition-colors"
                              title="View details"
                            >
                              <Eye size={14} className="mr-1" />
                              {expandedRows.has(payment.id) ? (
                                <ChevronUp size={14} className="inline-block" />
                              ) : (
                                <ChevronDown size={14} className="inline-block" />
                              )}
                            </button>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            {formatDate(payment.timestamp)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-bold">
                            <div className="flex items-center group">
                              {contact ? (
                                <button
                                  onClick={() => navigateToUser(contact)}
                                  className="flex items-center text-blue-600 hover:text-blue-800 hover:underline"
                                >
                                  <span className="mr-2">{formatPhoneNumber(contact)}</span>
                                  <ExternalLink size={14} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                                </button>
                              ) : (
                                <span className="text-gray-500">No contact</span>
                              )}
                              {contact && (
                                <button
                                  onClick={() => copyToClipboard(contact, `contact-${payment.id}`)}
                                  className="ml-2 opacity-0 group-hover:opacity-100 transition-opacity"
                                  title="Copy contact"
                                >
                                  {copiedField === `contact-${payment.id}` ? (
                                    <CheckCircle size={16} className="text-green-500" />
                                  ) : (
                                    <Copy size={16} className="text-gray-400 hover:text-gray-600" />
                                  )}
                                </button>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <div className="flex items-center group">
                              <div className="max-w-[120px] overflow-hidden text-ellipsis mr-2">
                                {orderId}
                              </div>
                              {orderId && (
                                <button
                                  onClick={() => copyToClipboard(orderId, `order-${payment.id}`)}
                                  className="opacity-0 group-hover:opacity-100 transition-opacity"
                                  title="Copy order ID"
                                >
                                  {copiedField === `order-${payment.id}` ? (
                                    <CheckCircle size={16} className="text-green-500" />
                                  ) : (
                                    <Copy size={16} className="text-gray-400 hover:text-gray-600" />
                                  )}
                                </button>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex flex-col">
                              <span className={`px-2 py-1 text-xs font-medium rounded-full w-fit ${getStatusColor(status)}`}>
                                {eventType}
                              </span>
                              {isNestedStructure && (
                                <span className="px-2 py-1 text-xs font-medium rounded-full bg-purple-100 text-purple-800 mt-1 w-fit">
                                  Nested
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {planTitle}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {formatAmount(amount)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 capitalize">
                            {method || 'N/A'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            <div className="flex items-center group">
                              <div className="max-w-[120px] overflow-hidden text-ellipsis mr-2">
                                {paymentId}
                              </div>
                              {paymentId && (
                                <button
                                  onClick={() => copyToClipboard(paymentId, `payment-${payment.id}`)}
                                  className="opacity-0 group-hover:opacity-100 transition-opacity"
                                  title="Copy payment ID"
                                >
                                  {copiedField === `payment-${payment.id}` ? (
                                    <CheckCircle size={16} className="text-green-500" />
                                  ) : (
                                    <Copy size={16} className="text-gray-400 hover:text-gray-600" />
                                  )}
                                </button>
                              )}
                            </div>
                          </td>
                         
                        </tr>
                      ];

                      // Add detail row if expanded
                      if (expandedRows.has(payment.id)) {
                        rows.push(renderDetailRow(payment));
                      }

                      return rows;
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination - Updated to work with filters */}
            {!isSearchMode && payments.length > 0 && (
              <div className="px-6 py-4 flex items-center justify-between border-t border-gray-200">
                <div className="flex-1 flex justify-between sm:hidden">
                  <button
                    onClick={() => handlePageChange(Math.max(currentPage - 1, 1))}
                    disabled={currentPage === 1}
                    className={`relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md ${
                      currentPage === 1 ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={!hasMore}
                    className={`ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md ${
                      !hasMore ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    Next
                  </button>
                </div>
                <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm text-gray-700">
                      Showing <span className="font-medium">page {currentPage}</span>
                      {isFilterMode && (
                        <span className="text-blue-600 ml-2">(filtered results)</span>
                      )}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    {/* Page Size Selector */}
                    <div className="flex items-center gap-2">
                      <label className="text-sm text-gray-700">Show:</label>
                      <select
                        value={limit}
                        onChange={(e) => handlePageSizeChange(Number(e.target.value))}
                        className="border border-gray-300 rounded-md px-2 py-1 text-sm"
                      >
                        <option value={10}>10</option>
                        <option value={25}>25</option>
                        <option value={50}>50</option>
                        <option value={100}>100</option>
                      </select>
                    </div>
                    
                    {/* Pagination Controls */}
                    <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                      <button
                        onClick={() => handlePageChange(Math.max(currentPage - 1, 1))}
                        disabled={currentPage === 1}
                        className={`relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 text-sm font-medium ${
                          currentPage === 1 ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white text-gray-500 hover:bg-gray-50'
                        }`}
                      >
                        <span className="sr-only">Previous</span>
                        <ChevronLeft className="h-5 w-5" aria-hidden="true" />
                      </button>
                      <span className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700">
                        {currentPage}
                      </span>
                      <button
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={!hasMore}
                        className={`relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 text-sm font-medium ${
                          !hasMore ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white text-gray-500 hover:bg-gray-50'
                        }`}
                      >
                        <span className="sr-only">Next</span>
                        <ChevronRight className="h-5 w-5" aria-hidden="true" />
                      </button>
                    </nav>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentLogs;