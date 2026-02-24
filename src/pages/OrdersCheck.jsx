import React, { useState } from 'react';
import { Menu, Search, RefreshCw, Copy, CheckCircle, AlertCircle, XCircle, Clock, DollarSign, Users, Package, Filter } from 'lucide-react';
import axiosInstance from '../utils/axios';
import Navbar from '../components/Navbar';

const OrdersCheck = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  // Single order check states
  const [orderId, setOrderId] = useState('');
  const [orderData, setOrderData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [copiedField, setCopiedField] = useState(null);

  // Bulk order refresh states
  const [bulkOrderIds, setBulkOrderIds] = useState('');
  const [bulkResult, setBulkResult] = useState(null);
  const [bulkLoading, setBulkLoading] = useState(false);
  const [bulkError, setBulkError] = useState(null);

  // Pending orders states
  const [pendingOrders, setPendingOrders] = useState([]);
  const [pendingOrdersSummary, setPendingOrdersSummary] = useState(null);
  const [pendingOrdersLoading, setPendingOrdersLoading] = useState(false);
  const [pendingOrdersError, setPendingOrdersError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [ordersPerPage] = useState(20);
  const [refreshingPage, setRefreshingPage] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all'); // 'all', 'paid', 'created', 'attempted', 'cancelled'

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!orderId.trim()) {
      setError('Please enter an order ID');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setOrderData(null);
      
      const response = await axiosInstance.get(`/api/admin/checkorder/${orderId.trim()}`);
      setOrderData(response.data);
    } catch (error) {
      console.error('Error checking order:', error);
      setError(error.response?.data?.message || 'Failed to fetch order details');
      setOrderData(null);
    } finally {
      setLoading(false);
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

  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    return new Date((timestamp && timestamp._seconds ? timestamp._seconds * 1000 : new Date(timestamp).getTime())).toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatAmount = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount); // Convert paise to rupees
  };

  // New function to fetch pending orders
  const fetchPendingOrders = async () => {
    try {
      setPendingOrdersLoading(true);
      setPendingOrdersError(null);
      
      const response = await axiosInstance.get('/api/razorpay/pending-orders');
      
      if (response.data.success) {
        setPendingOrders(response.data.data.orders);
        setPendingOrdersSummary(response.data.data.summary);
        setCurrentPage(1); // Reset to first page
      } else {
        setPendingOrdersError('Failed to fetch pending orders');
      }
    } catch (error) {
      console.error('Error fetching pending orders:', error);
      setPendingOrdersError(error.response?.data?.message || 'Failed to fetch pending orders');
    } finally {
      setPendingOrdersLoading(false);
    }
  };

  const handleBulkRefresh = async (e) => {
    e.preventDefault();
    
    if (!bulkOrderIds.trim()) {
      setBulkError('Please enter order IDs');
      return;
    }

    try {
      setBulkLoading(true);
      setBulkError(null);
      setBulkResult(null);
      
      // Parse order IDs from textarea (split by newlines, commas, or spaces)
      const orderIdsArray = bulkOrderIds
        .split(/[\n,\s]+/)
        .map(id => id.trim())
        .filter(id => id.length > 0);
      
      if (orderIdsArray.length === 0) {
        setBulkError('No valid order IDs found');
        return;
      }

      const response = await axiosInstance.post('/api/razorpay/orders/refresh', {
        orderIds: orderIdsArray
      });
      
      setBulkResult(response.data);
    } catch (error) {
      console.error('Error refreshing orders:', error);
      setBulkError(error.response?.data?.message || 'Failed to refresh orders');
      setBulkResult(null);
    } finally {
      setBulkLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'paid':
        return 'bg-green-100 text-green-800';
      case 'created':
        return 'bg-blue-100 text-blue-800';
      case 'attempted':
        return 'bg-yellow-100 text-yellow-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }

  const handleBulkRefreshPage = async () => {
    const startIndex = (currentPage - 1) * ordersPerPage;
    const endIndex = startIndex + ordersPerPage;
    const currentPageOrders = pendingOrders.slice(startIndex, endIndex);
    const orderIds = currentPageOrders.map(order => order.orderId);

    if (orderIds.length === 0) {
      return;
    }

    try {
      setRefreshingPage(true);
      setBulkError(null);
      
      const response = await axiosInstance.post('/api/razorpay/orders/refresh', {
        orderIds: orderIds
      });
      
      if (response.data.success) {
        // Update the pending orders list by removing paid orders
        const paidOrderIds = response.data.data.paidOrderResults
          ?.filter(result => result.success)
          ?.map(result => result.orderId) || [];
        
        if (paidOrderIds.length > 0) {
          setPendingOrders(prev => prev.filter(order => !paidOrderIds.includes(order.orderId)));
          
          // Update summary
          setPendingOrdersSummary(prev => ({
            total_pending: prev.total_pending - paidOrderIds.length,
            total_amount: prev.total_amount - currentPageOrders
              .filter(order => paidOrderIds.includes(order.orderId))
              .reduce((sum, order) => sum + order.amount, 0)
          }));
        }
        
        setBulkResult(response.data);
      }
    } catch (error) {
      console.error('Error refreshing page orders:', error);
      setBulkError(error.response?.data?.message || 'Failed to refresh orders');
    } finally {
      setRefreshingPage(false);
    }
  };

  // Filter orders based on status
  const getFilteredOrders = () => {
    if (!bulkResult?.data?.orders) return [];
    
    const orders = bulkResult.data.orders;
    if (statusFilter === 'all') return orders;
    if (statusFilter === 'paid') return orders.filter(order => order.status === 'paid');
    return orders.filter(order => order.status === statusFilter);
  };

  // Pagination calculations
  const totalPages = Math.ceil(pendingOrders.length / ordersPerPage);
  const startIndex = (currentPage - 1) * ordersPerPage;
  const endIndex = startIndex + ordersPerPage;
  const currentPageOrders = pendingOrders.slice(startIndex, endIndex);

  const goToPage = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
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
      <div className="flex-1 overflow-auto p-4 md:p-6">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-8">
            Order Management
          </h1>

          

          {/* Single Order Error Display */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <div className="flex items-center">
                <XCircle className="h-5 w-5 text-red-400 mr-3" />
                <div>
                  <h3 className="text-sm font-medium text-red-800">Error</h3>
                  <p className="text-sm text-red-700 mt-1">{error}</p>
                </div>
              </div>
            </div>
          )}

          {/* Order Details */}
          {orderData && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-800">Order Details</h2>
                <div className="flex items-center">
                  {getStatusIcon(orderData.status)}
                  <span className={`ml-2 px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(orderData.status)}`}>
                    {orderData.status}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Order Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-gray-800 border-b border-gray-200 pb-2">
                    Order Information
                  </h3>
                  
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-gray-500">Order ID:</span>
                      <div className="flex items-center">
                        <span className="text-sm text-gray-900 mr-2">{orderData.id}</span>
                        <button
                          onClick={() => copyToClipboard(orderData.id, 'orderId')}
                          className="text-gray-400 hover:text-gray-600"
                        >
                          {copiedField === 'orderId' ? (
                            <CheckIcon size={16} className="text-green-500" />
                          ) : (
                            <Copy size={16} />
                          )}
                        </button>
                      </div>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-gray-500">Amount:</span>
                      <span className="text-sm text-gray-900 font-semibold">
                        {formatAmount(orderData.amount)}
                      </span>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-gray-500">Currency:</span>
                      <span className="text-sm text-gray-900">{orderData.currency}</span>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-gray-500">Created At:</span>
                      <span className="text-sm text-gray-900">
                        {formatDate(orderData.created_at)}
                      </span>
                    </div>

                    {orderData.receipt && (
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-gray-500">Receipt:</span>
                        <div className="flex items-center">
                          <span className="text-sm text-gray-900 mr-2">{orderData.receipt}</span>
                          <button
                            onClick={() => copyToClipboard(orderData.receipt, 'receipt')}
                            className="text-gray-400 hover:text-gray-600"
                          >
                            {copiedField === 'receipt' ? (
                              <CheckIcon size={16} className="text-green-500" />
                            ) : (
                              <Copy size={16} />
                            )}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Additional Details */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-gray-800 border-b border-gray-200 pb-2">
                    Additional Details
                  </h3>
                  
                  <div className="space-y-3">
                    {orderData.notes && (
                      <div>
                        <span className="text-sm font-medium text-gray-500">Notes:</span>
                        <div className="mt-2 p-3 bg-gray-50 rounded-md">
                          <pre className="text-sm text-gray-900 whitespace-pre-wrap">
                            {JSON.stringify(orderData.notes, null, 2)}
                          </pre>
                        </div>
                      </div>
                    )}

                    {orderData.attempts !== undefined && (
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-gray-500">Attempts:</span>
                        <span className="text-sm text-gray-900">{orderData.attempts}</span>
                      </div>
                    )}

                    {orderData.amount_paid !== undefined && (
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-gray-500">Amount Paid:</span>
                        <span className="text-sm text-gray-900">
                          {formatAmount(orderData.amount_paid)}
                        </span>
                      </div>
                    )}

                    {orderData.amount_due !== undefined && (
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-gray-500">Amount Due:</span>
                        <span className="text-sm text-gray-900">
                          {formatAmount(orderData.amount_due)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Raw Data Section */}
              <div className="mt-6 pt-6 border-t border-gray-200">
                <h3 className="text-lg font-medium text-gray-800 mb-3">Raw Order Data</h3>
                <div className="bg-gray-50 rounded-lg p-4 overflow-x-auto">
                  <pre className="text-sm text-gray-700">
                    {JSON.stringify(orderData, null, 2)}
                  </pre>
                </div>
              </div>
            </div>
          )}

          {/* Bulk Order Refresh Form */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-800">Bulk Order Refresh</h2>
            <form onSubmit={handleBulkRefresh} className="space-y-4">
              <div>
                <label htmlFor="bulkOrderIds" className="block text-sm font-medium text-gray-700 mb-2">
                  Order IDs (one per line, or separated by commas/spaces)
                </label>
                <textarea
                  id="bulkOrderIds"
                  value={bulkOrderIds}
                  onChange={(e) => setBulkOrderIds(e.target.value)}
                  placeholder="order_123456789&#10;order_987654321&#10;order_111222333"
                  rows="6"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <p className="text-sm text-gray-500 mt-1">
                  Enter multiple order IDs separated by new lines, commas, or spaces
                </p>
              </div>
              <button
                type="submit"
                disabled={bulkLoading}
                className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 transition duration-200 flex items-center justify-center"
              >
                {bulkLoading ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
                ) : (
                  <>
                    <RefreshCw size={18} className="mr-2" />
                    Refresh Orders
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Bulk Error Display */}
          {bulkError && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <div className="flex items-center">
                <XCircle className="h-5 w-5 text-red-400 mr-3" />
                <div>
                  <h3 className="text-sm font-medium text-red-800">Bulk Refresh Error</h3>
                  <p className="text-sm text-red-700 mt-1">{bulkError}</p>
                </div>
              </div>
            </div>
          )}

          {/* Bulk Result Display */}
          {bulkResult && (
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-gray-800">Bulk Refresh Results</h2>
                <div className="flex items-center gap-4">
                  {/* Status Filter */}
                  <div className="flex items-center gap-2">
                    <Filter size={16} className="text-gray-500" />
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="all">All Orders</option>
                      <option value="paid">Paid Orders</option>
                      <option value="created">Created Orders</option>
                      <option value="attempted">Attempted Orders</option>
                      <option value="cancelled">Cancelled Orders</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Summary */}
              {bulkResult.data?.summary && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">{bulkResult.data.summary.total_requested}</div>
                    <div className="text-sm text-gray-600">Total Requested</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">{bulkResult.data.summary.successful_fetches}</div>
                    <div className="text-sm text-gray-600">Successful</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-600">{bulkResult.data.summary.errors}</div>
                    <div className="text-sm text-gray-600">Errors</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">
                      {bulkResult.data.summary.status_breakdown?.paid || 0}
                    </div>
                    <div className="text-sm text-gray-600">Paid Orders</div>
                  </div>
                </div>
              )}

              {/* Status Breakdown */}
              {bulkResult.data?.summary?.status_breakdown && (
                <div className="mb-6">
                  <h3 className="text-lg font-medium text-gray-800 mb-3">Status Breakdown</h3>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(bulkResult.data.summary.status_breakdown).map(([status, count]) => (
                      <span
                        key={status}
                        className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(status)}`}
                      >
                        {status}: {count}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Orders Table */}
              {bulkResult.data?.orders && (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Order ID
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Amount
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Customer
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Plan
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Created At
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Attempts
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {getFilteredOrders().map((order) => (
                        <tr key={order.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <span className="text-sm font-medium text-gray-900 mr-2">{order.id}</span>
                              <button
                                onClick={() => copyToClipboard(order.id, `order-${order.id}`)}
                                className="text-gray-400 hover:text-gray-600"
                              >
                                {copiedField === `order-${order.id}` ? (
                                  <CheckIcon size={16} className="text-green-500" />
                                ) : (
                                  <Copy size={16} />
                                )}
                              </button>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(order.status)}`}>
                              {order.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {formatAmount(order.amount)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{order.orderBy?.userPhone || 'N/A'}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{order.orderBy?.planTitle || 'N/A'}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {formatDate(order.created_at)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {order.attempts}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  
                  {getFilteredOrders().length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      No orders found with the selected filter.
                    </div>
                  )}
                </div>
              )}

              {/* Errors */}
              {bulkResult.data?.errors && bulkResult.data.errors.length > 0 && (
                <div className="mt-6">
                  <h3 className="text-lg font-medium text-red-800 mb-3">Errors</h3>
                  <div className="bg-red-50 rounded-lg p-4">
                    <ul className="list-disc list-inside space-y-1">
                      {bulkResult.data.errors.map((error, index) => (
                        <li key={index} className="text-sm text-red-700">{error}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              {/* Raw JSON (collapsible) */}
              <details className="mt-6">
                <summary className="cursor-pointer text-sm font-medium text-gray-700 hover:text-gray-900">
                  View Raw JSON Response
                </summary>
                <div className="mt-2 bg-gray-50 rounded-lg p-4 overflow-x-auto">
                  <pre className="text-sm text-gray-700 whitespace-pre-wrap">
                    {JSON.stringify(bulkResult, null, 2)}
                  </pre>
                </div>
              </details>
            </div>
          )}

          {/* Pending Orders Section */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
              <div>
                <h2 className="text-xl font-semibold text-gray-800">Pending Orders</h2>
                <p className="text-gray-600 mt-1">Fetch and manage all pending payment orders</p>
              </div>
              
              <button
                onClick={fetchPendingOrders}
                disabled={pendingOrdersLoading}
                className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-purple-400 transition-colors"
              >
                <Package size={16} className={pendingOrdersLoading ? 'animate-spin' : ''} />
                {pendingOrdersLoading ? 'Fetching...' : 'Fetch Pending Orders'}
              </button>
            </div>

            {/* Summary Cards */}
            {pendingOrdersSummary && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="bg-orange-50 rounded-lg p-4">
                  <div className="flex items-center">
                    <div className="bg-orange-100 p-3 rounded-lg mr-4">
                      <Clock className="text-orange-600" size={24} />
                    </div>
                    <div>
                      <h3 className="text-orange-600 text-sm font-medium">Total Pending</h3>
                      <p className="text-2xl font-bold text-orange-800">{pendingOrdersSummary.total_pending}</p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-blue-50 rounded-lg p-4">
                  <div className="flex items-center">
                    <div className="bg-blue-100 p-3 rounded-lg mr-4">
                      <DollarSign className="text-blue-600" size={24} />
                    </div>
                    <div>
                      <h3 className="text-blue-600 text-sm font-medium">Total Amount</h3>
                      <p className="text-2xl font-bold text-blue-800">{formatAmount(pendingOrdersSummary.total_amount)}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Error Display */}
            {pendingOrdersError && (
              <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4">
                <div className="flex items-center">
                  <XCircle className="mr-2" size={20} />
                  {pendingOrdersError}
                </div>
              </div>
            )}

            {/* Pending Orders Table */}
            {pendingOrders.length > 0 && (
              <div>
                {/* Page Controls */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
                  <div className="flex items-center gap-4">
                    <span className="text-sm text-gray-600">
                      Showing {startIndex + 1}-{Math.min(endIndex, pendingOrders.length)} of {pendingOrders.length} orders
                    </span>
                    
                    {currentPageOrders.length > 0 && (
                      <button
                        onClick={handleBulkRefreshPage}
                        disabled={refreshingPage}
                        className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-green-400 transition-colors"
                      >
                        <RefreshCw size={16} className={refreshingPage ? 'animate-spin' : ''} />
                        {refreshingPage ? 'Refreshing...' : `Refresh Page (${currentPageOrders.length} orders)`}
                      </button>
                    )}
                  </div>

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => goToPage(currentPage - 1)}
                        disabled={currentPage === 1}
                        className="px-3 py-1 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 disabled:bg-gray-100 disabled:text-gray-400"
                      >
                        Previous
                      </button>
                      
                      <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-md">
                        Page {currentPage} of {totalPages}
                      </span>
                      
                      <button
                        onClick={() => goToPage(currentPage + 1)}
                        disabled={currentPage === totalPages}
                        className="px-3 py-1 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 disabled:bg-gray-100 disabled:text-gray-400"
                      >
                        Next
                      </button>
                    </div>
                  )}
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Order Details
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Customer
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Plan
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Amount
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Created At
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {currentPageOrders.map((order) => (
                        <tr key={order.orderId} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <span className="text-sm font-medium text-gray-900">{order.orderId}</span>
                              <button
                                onClick={() => copyToClipboard(order.orderId, `order-${order.orderId}`)}
                                className="ml-2 text-gray-400 hover:text-gray-600"
                              >
                                {copiedField === `order-${order.orderId}` ? (
                                  <CheckCircle size={14} className="text-green-500" />
                                ) : (
                                  <Copy size={14} />
                                )}
                              </button>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <div className="text-sm font-medium text-gray-900">{order.name}</div>
                              <div className="text-sm text-gray-500">{order.phone}</div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                              {order.customerPlan}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              {formatAmount(order.amount)}
                            </div>
                            <div className="text-xs text-gray-500">{order.currency}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {formatDate(order.createdAt)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <button
                              onClick={() => copyToClipboard(order.userId, `user-${order.orderId}`)}
                              className="text-blue-600 hover:text-blue-800 text-sm"
                              title="Copy User ID"
                            >
                              {copiedField === `user-${order.orderId}` ? (
                                <span className="flex items-center">
                                  <CheckCircle size={14} className="mr-1" />
                                  Copied
                                </span>
                              ) : (
                                'Copy User ID'
                              )}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Empty State */}
            {!pendingOrdersLoading && pendingOrders.length === 0 && !pendingOrdersError && (
              <div className="text-center py-8">
                <Package className="mx-auto text-gray-400 mb-4" size={48} />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No pending orders</h3>
                <p className="text-gray-500">Click "Fetch Pending Orders" to load data.</p>
              </div>
            )}
          </div>

          {/* Bulk Result Display */}
          {bulkResult && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Refresh Results</h2>
              
              {/* Summary */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-blue-50 rounded-lg p-4">
                  <div className="text-blue-600 text-sm font-medium">Total Requested</div>
                  <div className="text-2xl font-bold text-blue-800">{bulkResult.data.summary.total_requested}</div>
                </div>
                <div className="bg-green-50 rounded-lg p-4">
                  <div className="text-green-600 text-sm font-medium">Successful</div>
                  <div className="text-2xl font-bold text-green-800">{bulkResult.data.summary.successful_fetches}</div>
                </div>
                <div className="bg-red-50 rounded-lg p-4">
                  <div className="text-red-600 text-sm font-medium">Errors</div>
                  <div className="text-2xl font-bold text-red-800">{bulkResult.data.summary.errors}</div>
                </div>
                <div className="bg-purple-50 rounded-lg p-4">
                  <div className="text-purple-600 text-sm font-medium">Paid Orders</div>
                  <div className="text-2xl font-bold text-purple-800">{bulkResult.data.summary.paid_orders_processed}</div>
                </div>
              </div>

              {/* Status Breakdown */}
              {bulkResult.data.summary.status_breakdown && (
                <div className="mb-6">
                  <h3 className="text-lg font-medium text-gray-800 mb-3">Status Breakdown</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {Object.entries(bulkResult.data.summary.status_breakdown).map(([status, count]) => (
                      <div key={status} className="bg-gray-50 rounded-lg p-3">
                        <div className="text-gray-600 text-sm capitalize">{status}</div>
                        <div className="text-lg font-semibold text-gray-800">{count}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Paid Orders Results */}
              {bulkResult.data.paidOrderResults && bulkResult.data.paidOrderResults.length > 0 && (
                <div>
                  <h3 className="text-lg font-medium text-gray-800 mb-3">Processed Paid Orders</h3>
                  <div className="space-y-3">
                    {bulkResult.data.paidOrderResults.map((result, index) => (
                      <div key={index} className={`p-4 rounded-lg border ${
                        result.success ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
                      }`}>
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="font-medium">{result.orderId}</span>
                            <span className="ml-2 text-sm text-gray-600">
                              {result.userPhone} - {result.planData?.planTitle}
                            </span>
                          </div>
                          <div className="flex items-center">
                            {result.success ? (
                              <CheckCircle className="text-green-500" size={20} />
                            ) : (
                              <XCircle className="text-red-500" size={20} />
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default OrdersCheck;