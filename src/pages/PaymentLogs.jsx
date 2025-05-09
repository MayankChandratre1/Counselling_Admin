import React, { useState, useEffect } from 'react';
import { Menu, Search, ChevronLeft, ChevronRight, AlertCircle, Check, X, Clock } from 'lucide-react';
import axiosInstance from '../utils/axios';
import Navbar from '../components/Navbar';

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

  useEffect(() => {
    if (!isSearchMode) {
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

  const formatAmount = (amount) => {
    if (!amount && amount !== 0) return 'N/A';
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount / 100); // Converting paise to rupees
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
      <div className="flex-1 overflow-auto p-4 lg:p-6">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-2xl font-bold text-gray-800 mb-6">Payment Logs</h1>

          {/* Search and filters */}
          <div className="bg-white p-4 rounded-lg shadow mb-6">
            <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="flex">
                  <select
                    value={searchType}
                    onChange={(e) => setSearchType(e.target.value)}
                    className="rounded-l-md border border-gray-300 px-4 py-2 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="phone">Phone</option>
                    <option value="order-id">Order ID</option>
                    <option value="payment-id">Payment ID</option>
                  </select>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={`Search by ${searchType}...`}
                    className="flex-1 rounded-r-md border-y border-r border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div className="flex gap-2 shrink-0">
                <button
                  type="button"
                  onClick={resetSearch}
                  className="px-4 py-2 border border-gray-300 rounded-md bg-white text-gray-700 hover:bg-gray-50"
                >
                  Reset
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center"
                >
                  <Search size={18} className="mr-2" />
                  Search
                </button>
              </div>
            </form>
          </div>

          {/* Payment logs table */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            {error && (
              <div className="bg-red-50 p-4 border-l-4 border-red-400">
                <div className="flex">
                  <AlertCircle className="h-5 w-5 text-red-400" />
                  <div className="ml-3">
                    <p className="text-sm text-red-700">{error}</p>
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
                        Date & Time
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Contact
                      </th>
                       <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Event
                      </th>
                       <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
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
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Order ID
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {payments.map((payment) => {
                      // Extract payment data based on event type
                      const isPaymentEvent = payment.eventType === 'payment.captured';
                      const paymentData = isPaymentEvent ? payment.data : {};
                      const orderData = !isPaymentEvent ? payment.data : {};
                      
                      // Determine which fields to use based on event type
                      const eventType = payment.eventType;
                      const amount = paymentData.amount || orderData.amount;
                      const status = paymentData.status || orderData.status;
                      const orderId = paymentData.order_id || orderData.id;
                      const paymentId = paymentData.id || '';
                      const method = paymentData.method || '';
                      const contact = paymentData.contact || '';
                      
                      // Get plan title from notes
                      const planTitle = paymentData.notes?.planTitle || orderData.notes?.planTitle || 'N/A';
                      
                      return (
                        <tr key={payment.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {formatDate(payment.timestamp)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {formatPhoneNumber(contact)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              {getPaymentIcon(status)}
                              <span className={`ml-1.5 px-2.5 py-0.5 rounded-full text-xs ${getStatusColor(status)}`}>
                                {eventType}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              {getPaymentIcon(status)}
                              <span className={`ml-1.5 px-2.5 py-0.5 rounded-full text-xs ${getStatusColor(status)}`}>
                                {status}
                              </span>
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
                            <div className="max-w-[140px] overflow-hidden text-ellipsis">
                              {paymentId}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            <div className="max-w-[140px] overflow-hidden text-ellipsis">
                              {orderId}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination */}
            {!isSearchMode && payments.length > 0 && (
              <div className="px-6 py-4 flex items-center justify-between border-t border-gray-200">
                <div className="flex-1 flex justify-between sm:hidden">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className={`relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md ${
                      currentPage === 1 ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setCurrentPage(prev => prev + 1)}
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
                    </p>
                  </div>
                  <div>
                    <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                      <button
                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
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
                        onClick={() => setCurrentPage(prev => prev + 1)}
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