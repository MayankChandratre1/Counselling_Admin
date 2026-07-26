import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Copy, ArrowLeft, CheckCircle, ChevronDown, ChevronUp, MessageSquare, DollarSign, Edit, Eye, ListIcon } from 'lucide-react';
import Navbar from '../components/Navbar';
import VerdictModal from '../components/users/VerdictModal';
import UserEditModal from '../components/users/UserEditModal';
import ProgressTracker from '../components/users/ProgressTracker';
import StepEditModal from '../components/users/StepEditModal';
import axiosInstance from '../utils/axios';
import { formatDisplayDate } from '../utils/formatDate';
import { formatCurrency, formatRazorpayAmount } from '../utils/formatCurrency';
import { getPaymentSourceDisplay } from '../utils/paymentSource';
import { notesToArray } from '../utils/noteKeys';
import { checkPermission, canWriteUsers, canViewSteps, canViewPayment } from '../utils/checkPermission';

const API_URL = import.meta.env.VITE_REACT_APP_ADMIN_API_URL;

const UserDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const allowWrite = canWriteUsers();
  const allowViewSteps = canViewSteps();
  const allowViewPayment = canViewPayment();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notesToShow, setNotesToShow] = useState({});
  const [error, setError] = useState(null);
  const [copiedField, setCopiedField] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showPaymentHistory, setShowPaymentHistory] = useState(false);
  const [verdictModal, setVerdictModal] = useState({ isOpen: false, stepNumber: null });
  const [stepEditModal, setStepEditModal] = useState({ isOpen: false, step: null });
  const [expandedStep, setExpandedStep] = useState(null);
  const [paymentHistory, setPaymentHistory] = useState([]);
  const [loadingPayments, setLoadingPayments] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [expandedOrders, setExpandedOrders] = useState(new Set());

  useEffect(() => {
    fetchUserDetails();
  }, [id]);

  const fetchUserDetails = async () => {
    try {
      const response = await axiosInstance.get(`/api/admin/user/${id}`);

      setUser(response.data);
      setNotesToShow(response.data.notes?.notes || {});

      // Only fetch payment history when explicitly requested
      console.log("User data fetched:", response.data);
    } catch (err) {
      setError('Failed to fetch user details');
      setLoading(false);
    } finally {
      setLoading(false);
    }
  };

  const fetchPaymentHistory = async () => {
    if (!user?.phone) return;

    setLoadingPayments(true);
    try {
      const response = await axiosInstance.get(`/api/admin/payments/phone/+91${user.phone}`);
      setPaymentHistory(response.data || []);
    } catch (paymentError) {
      console.error("Error fetching payment history:", paymentError);
    } finally {
      setLoadingPayments(false);
    }
  };

  const toggleOrderExpansion = (orderId) => {
    setExpandedOrders(prev => {
      const newSet = new Set(prev);
      if (newSet.has(orderId)) {
        newSet.delete(orderId);
      } else {
        newSet.add(orderId);
      }
      return newSet;
    });
  };

  const formatDate = (timestamp) => formatDisplayDate(timestamp);
  const formatDateTime = (timestamp) => formatDisplayDate(timestamp);

  const formatOrderAmount = (amount) => formatCurrency(amount);
  const formatPaymentAmount = (amount) => formatRazorpayAmount(amount);

  const copyToClipboard = async (text, field) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const copyAllCounsellingData = () => {
    if (!user?.counsellingData) return;

    const formattedData = Object.entries(user.counsellingData)
      .map(([key, value]) => {
        if (key === 'password' || key === 'confirmPassword' || key === 'termsAccepted') return null;
        return `${key}: ${value}`;
      })
      .filter(Boolean)
      .join('\n');

    copyToClipboard(formattedData, 'all');
  };

  const handleAddVerdict = (stepNumber) => {
    console.log(`Adding verdict for step ${stepNumber}`);

    setVerdictModal({ isOpen: true, stepNumber });
  };

  const handleEditStep = (step) => {
    setStepEditModal({ isOpen: true, step });
  };

  const handleStepSave = async (updatedStep) => {
    try {
      if (!user || !user.stepsData || !user.stepsData.steps) {
        console.error('User steps data is missing');
        return;
      }

      // Update the specific step in the steps array
      const updatedSteps = user.stepsData.steps.map(step =>
        step.number === updatedStep.number ? updatedStep : step
      );

      // Create updated stepsData object
      const updatedStepsData = {
        ...user.stepsData,
        steps: updatedSteps,
      };

      // Update user in backend
      const response = await axiosInstance.put(`/api/admin/update-user-step-data/${id}`, updatedStepsData);

      if (response.data.error) {
        console.error("Error updating step:", response.data.error);
        return;
      }

      // Close modal and refresh user data
      setStepEditModal({ isOpen: false, step: null });
      fetchUserDetails();
    } catch (err) {
      console.error("Error updating step:", err);
    }
  };

  const handleVerdictConfirm = async (stepNumber, verdict) => {
    try {
      // Data will be sent to backend here
      console.log(`Submitting verdict for step ${stepNumber}:`, verdict);

      const desiredStep = user.stepsData.steps.find(step => step.number === stepNumber);
      if (!desiredStep) {
        console.error(`Step ${stepNumber} not found in user data`);
        return;
      }

      const updatedStep = {
        ...desiredStep,
        verdict: verdict,
      }

      const updatedUserSteps = user.stepsData.steps.map(step =>
        step.number === stepNumber ? updatedStep : step)
      // TODO: Implement backend call
      const response = await axiosInstance.put(`/api/admin/update-user-step-data/${id}`, {
        ...user.stepsData,
        steps: updatedUserSteps,
      });

      console.log("Response from backend:", response.data);
      if (response.data.error) {
        console.error("Error from backend:", response.data.error);
        return;
      }
      // Close modal on success
      setVerdictModal({ isOpen: false, stepNumber: null });
      fetchUserDetails();
    } catch (err) {
      console.error("Error adding verdict:", err);
      // Optional: Show error message
      // alert("Failed to add verdict");
    }
  };

  const toggleStepExpand = (stepNumber) => {
    setExpandedStep(expandedStep === stepNumber ? null : stepNumber);
  };

  const getStepStatusBadge = (status) => {
    switch (status) {
      case 'Yes':
        return <span className="px-2 py-1 rounded-full text-sm bg-green-100 text-green-800">Completed</span>;
      case 'No':
        return <span className="px-2 py-1 rounded-full text-sm bg-red-100 text-red-800">Rejected</span>;
      default:
        return <span className="px-2 py-1 rounded-full text-sm bg-yellow-100 text-yellow-800">Pending</span>;
    }
  };

  const getStepTypeBadges = (step) => {
    return (
      <div className="flex flex-wrap gap-2">
        {step.isCapSpecific && (
          <span className="px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
            CAP {step.cap || ''}
          </span>
        )}
        {step.isVerdict && (
          <span className="px-2 py-1 rounded-full text-xs bg-purple-100 text-purple-800">
            Verdict
          </span>
        )}
        {step.isCapQuery && (
          <span className="px-2 py-1 rounded-full text-xs bg-amber-100 text-amber-800">
            CAP Query
          </span>
        )}
      </div>
    );
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'paid':
      case 'captured':
        return 'bg-green-100 text-green-800';
      case 'created':
        return 'bg-blue-100 text-blue-800';
      case 'attempted':
        return 'bg-yellow-100 text-yellow-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      case 'pending':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handleUpdateUser = async (updatedUserData) => {
    try {
      setLoading(true);
      await axiosInstance.put(`/api/admin/update-user/${id}`, updatedUserData);
      // Refresh user data after update
      fetchUserDetails();
      setIsEditModalOpen(false);
    } catch (error) {
      console.error('Error updating user:', error);
      // You could set an error state here if you want to display the error
    } finally {
      setLoading(false);
    }
  };

  const renderOrderDetails = (order) => {
    return (
      <div className="mt-4 p-4 bg-gray-50 rounded-lg">
        <h4 className="text-lg font-semibold text-gray-800 mb-3">Order Details</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-500">Order ID:</span>
              <div className="flex items-center">
                <span className="text-sm text-gray-900 mr-2">{order.orderId}</span>
                <button
                  onClick={() => copyToClipboard(order.orderId, `order-${order.orderId}`)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  {copiedField === `order-${order.orderId}` ? (
                    <CheckCircle size={14} className="text-green-500" />
                  ) : (
                    <Copy size={14} />
                  )}
                </button>
              </div>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-500">Amount:</span>
              <span className="text-sm text-gray-900 font-semibold">
                {formatOrderAmount(order.amount)}
              </span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-500">Currency:</span>
              <span className="text-sm text-gray-900">{order.currency}</span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-500">Status:</span>
              <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(order.status)}`}>
                {order.status}
              </span>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-500">Receipt:</span>
              <div className="flex items-center">
                <span className="text-sm text-gray-900 mr-2">{order.receipt}</span>
                <button
                  onClick={() => copyToClipboard(order.receipt, `receipt-${order.orderId}`)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  {copiedField === `receipt-${order.orderId}` ? (
                    <CheckCircle size={14} className="text-green-500" />
                  ) : (
                    <Copy size={14} />
                  )}
                </button>
              </div>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-500">Created At:</span>
              <span className="text-sm text-gray-900">{formatDate(order.createdAt)}</span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-500">Payment Status:</span>
              <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(order.paymentStatus)}`}>
                {order.paymentStatus}
              </span>
            </div>
          </div>
        </div>

        {/* Notes Section */}
        {order.notes && (
          <div className="mt-4">
            <h5 className="text-sm font-medium text-gray-700 mb-2">Order Notes:</h5>
            <div className="bg-white rounded-md p-3 border">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="font-medium text-gray-600">Plan:</span>
                  <span className="ml-2 text-gray-800">{order.notes.planTitle}</span>
                </div>
                <div>
                  <span className="font-medium text-gray-600">Customer Plan:</span>
                  <span className="ml-2 text-gray-800">{order.notes.customerPlan}</span>
                </div>
                <div>
                  <span className="font-medium text-gray-600">User Phone:</span>
                  <span className="ml-2 text-gray-800">{order.notes.userPhone}</span>
                </div>
              </div>
              {order.notes.planDetails && (
                <div className="mt-3">
                  <span className="font-medium text-gray-600">Plan Details:</span>
                  <pre className="mt-1 text-xs text-gray-700 bg-gray-50 p-2 rounded overflow-auto">
                    {JSON.stringify(JSON.parse(order.notes.planDetails), null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    );
  };

  if (loading) return (
    <div className="flex justify-center items-center h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
    </div>
  );

  if (error) return (
    <div className="flex justify-center items-center h-screen">
      <div className="text-red-500">{error}</div>
    </div>
  );

  if (!user) return (
    <div className="flex justify-center items-center h-screen">
      <div className="text-gray-500">User not found</div>
    </div>
  );

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <div className={`
        fixed inset-y-0 left-0 transform z-10
        lg:relative lg:translate-x-0 transition duration-200 ease-in-out
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <Navbar onClose={() => setIsSidebarOpen(false)} />
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto p-8">
        <div className="max-w-7xl mx-auto">
          {/* Back Button and Header */}
          <div className="flex items-center mb-8 gap-4">
            <button
              onClick={() => (window.history.length > 1 ? navigate(-1) : navigate('/users'))}
              className="flex items-center text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft size={20} className="mr-2" />
              Back to Users
            </button>
            <h1 className="text-3xl font-bold text-gray-900">{user.name}'s Profile</h1>
            {
              allowWrite && (
                <button
                  onClick={() => setIsEditModalOpen(true)}
                  className="ml-auto flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                >
                  <Edit size={18} />
                  Edit User
                </button>
              )
            }
            <button
              onClick={() => navigate(`/users/lists/${id}`)}
              className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
            >
              <ListIcon size={18} />
              Lists
            </button>
          </div>

          {/* Basic Info Card */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Basic Information</h2>
              <span className={`px-3 py-1 rounded-full text-sm ${user.isPremium ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                }`}>
                {user.isPremium ? 'Premium' : 'Standard'}
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Name</p>
                <p className="font-medium">{user.name}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Phone</p>
                <p className="font-medium">{user.phone}</p>
              </div>
              {user.email && (
                <div>
                  <p className="text-sm text-gray-600">Email</p>
                  <p className="font-medium">{user.email}</p>
                </div>
              )}
            </div>
          </div>

          {
            user.isPremium && user.premiumPlan && (
              <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold">Premium Plan</h2>

                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Plan</p>
                    <p className="font-medium">{user.premiumPlan.planTitle}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Purchased Date</p>
                    <p className="font-medium">{formatDate(user.premiumPlan.purchasedDate)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Expiry Date</p>
                    <p className="font-medium">{formatDate(user.premiumPlan.expiryDate)}</p>
                  </div>
                  {allowViewPayment && (
                    <>
                  <div>
                    <p className="text-sm text-gray-600">Payment Source</p>
                    <p className="font-medium">{getPaymentSourceDisplay(user.premiumPlan)}</p>
                  </div>
                  {
                    user.premiumPlan.isPaymentPending && (
                      <>
                        <div>
                          <p className="text-sm text-gray-600">Amount Paid</p>
                          <p className="font-medium text-green-500">{user.premiumPlan.amountPaid}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Amount Remaining</p>
                          <p className="font-medium text-red-500">{user.premiumPlan.amountRemaining}</p>
                        </div>
                      </>
                    )
                  }
                    </>
                  )}



                </div>
              </div>
            )


          }

          {notesToShow && notesToArray(notesToShow).length > 0 && (
            <div className="bg-white rounded-lg shadow-md p-6  mb-6">
              <h2 className="text-xl font-semibold mb-4">Notes</h2>
              <div className="space-y-4">
                {notesToArray(notesToShow).map((noteData, index) => (
                  <div
                    key={index}
                    className="border-l-4 border-blue-500 bg-gray-50 p-4 rounded-r-lg hover:shadow-md transition-shadow"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <span className="font-medium text-blue-600">
                        {noteData.adminEmail}
                      </span>
                      <span className="text-sm text-gray-500">
                        {formatDisplayDate(noteData.createdAt)}
                      </span>
                    </div>
                    <p className="text-gray-700 whitespace-pre-wrap break-words">
                      {noteData.note}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Steps Progress */}
          {allowViewSteps && user && user.stepsData && user.stepsData.steps && <div className='mb-12'>
            <ProgressTracker
              userId={user.id}
              userStepsData={user.stepsData.steps}
              form={user.stepsData.id}
              onVerdictClick={allowWrite ? ((step) => handleAddVerdict(step.number)) : undefined}
              onEditClick={allowWrite ? handleEditStep : undefined}
            />
          </div>}

          {/* Orders Section */}
          {allowViewPayment && user?.orders && user.orders.length > 0 && (
            <div className="bg-white p-6 rounded-lg shadow-md mb-6">
              <h2 className="text-xl font-semibold mb-4 text-gray-800">Orders</h2>
              <div className="space-y-4">
                {user.orders.map((order, index) => (
                  <div key={order.orderId || index} className="border border-gray-200 rounded-lg">
                    <div className="p-4 flex items-center justify-between bg-gray-50 rounded-t-lg">
                      <div className="flex items-center space-x-4">
                        <div>
                          <h3 className="font-medium text-gray-900">{order.notes?.planTitle || 'Order'}</h3>
                          <p className="text-sm text-gray-500">Order ID: {order.orderId}</p>
                        </div>
                        <span className={`px-3 py-1 text-sm font-medium rounded-full ${getStatusColor(order.status)}`}>
                          {order.status}
                        </span>
                        <div className="text-right">
                          <p className="font-semibold text-gray-900">{formatOrderAmount(order.amount)}</p>
                          <p className="text-sm text-gray-500">{formatDate(order.createdAt)}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => toggleOrderExpansion(order.orderId)}
                        className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                      >
                        {expandedOrders.has(order.orderId) ? (
                          <ChevronUp size={20} />
                        ) : (
                          <ChevronDown size={20} />
                        )}
                      </button>
                    </div>

                    {expandedOrders.has(order.orderId) && renderOrderDetails(order)}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Payment History Section */}
          {allowViewPayment && (
          <div className="bg-white p-6 rounded-lg shadow-md mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-800">Payment History</h2>
              {!showPaymentHistory && (
                <button
                  onClick={() => {
                    setShowPaymentHistory(true);
                    fetchPaymentHistory();
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center"
                >
                  <Eye size={16} className="mr-2" />
                  View Payment History
                </button>
              )}
            </div>

            {showPaymentHistory && (
              <>
                {loadingPayments ? (
                  <div className="flex justify-center items-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
                  </div>
                ) : paymentHistory.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">No payment history found for this user.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Date & Time
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Event Type
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Amount
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Status
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Payment ID
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Order ID
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {paymentHistory.map((payment, index) => {
                          const isOrderEvent = payment.eventType && payment.eventType.startsWith('order.');
                          const paymentData = isOrderEvent ? (payment.data.payment || {}) : (payment.data || {});
                          const orderData = isOrderEvent ? (payment.data.order || {}) : {};

                          const amount = paymentData.amount || orderData.amount || payment.data.amount;
                          const status = isOrderEvent ? orderData.status : paymentData.status;
                          const orderId = orderData.id || paymentData.order_id || payment.data.order_id;
                          const paymentId = paymentData.id || payment.data.id || '';

                          return (
                            <tr key={index} className="hover:bg-gray-50">
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {formatDate(payment.timestamp)}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(status)}`}>
                                  {payment.eventType}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                {formatPaymentAmount(amount)}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(status)}`}>
                                  {status}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {paymentId}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {orderId}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </>
            )}
          </div>
          )}

          {/* Counselling Data Card */}
          {user.counsellingData && (
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold">Counselling Information</h2>
                <button
                  onClick={copyAllCounsellingData}
                  className="px-4 py-2 bg-blue-50 text-blue-600 rounded-md hover:bg-blue-100 flex items-center gap-2"
                >
                  {copiedField === 'all' ? <CheckCircle size={16} /> : <Copy size={16} />}
                  Copy All Info
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {Object.entries(user.counsellingData).map(([key, value]) => {
                  if (key === 'password' || key === 'confirmPassword' || key === 'termsAccepted') return null;

                  return (
                    <div key={key} className="relative group">
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <p className="text-sm text-gray-600 capitalize">
                          {key.replace(/([A-Z])/g, ' $1').toLowerCase()}
                        </p>
                        <div className="flex justify-between items-center mt-1">
                          <p className="font-medium">{String(value)}</p>
                          <button
                            onClick={() => copyToClipboard(String(value), key)}
                            className="opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            {copiedField === key ? (
                              <CheckCircle size={16} className="text-green-500" />
                            ) : (
                              <Copy size={16} className="text-gray-400 hover:text-gray-600" />
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}



          {isEditModalOpen && (
            <UserEditModal
              isOpen={isEditModalOpen}
              onClose={() => setIsEditModalOpen(false)}
              user={user}
              onSave={handleUpdateUser}
            />
          )}



          {/* Verdict Modal */}
          <VerdictModal
            isOpen={verdictModal.isOpen}
            onClose={() => setVerdictModal({ isOpen: false, stepNumber: null })}
            onConfirm={handleVerdictConfirm}
            stepNumber={verdictModal.stepNumber}
          />

          {/* Step Edit Modal */}
          <StepEditModal
            isOpen={stepEditModal.isOpen}
            onClose={() => setStepEditModal({ isOpen: false, step: null })}
            step={stepEditModal.step}
            onSave={handleStepSave}
          />
        </div>
      </div>
    </div>
  );
};

export default UserDetailsPage;