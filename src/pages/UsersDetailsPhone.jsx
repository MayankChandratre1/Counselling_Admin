import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Copy, ArrowLeft, CheckCircle, ChevronDown, ChevronUp, MessageSquare, DollarSign, Edit } from 'lucide-react';
import axios from 'axios';
import Navbar from '../components/Navbar';
import { useUsers } from '../contexts/UsersContext';
import VerdictModal from '../components/users/VerdictModal';
import UserEditModal from '../components/users/UserEditModal';
import ProgressTracker from '../components/users/ProgressTracker';
import axiosInstance from '../utils/axios';

const API_URL = import.meta.env.VITE_REACT_APP_ADMIN_API_URL;

const UserDetailsByPhone = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notesToShow, setNotesToShow] = useState({});
  const [error, setError] = useState(null);
  const [copiedField, setCopiedField] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const {notes} = useUsers();
  const [verdictModal, setVerdictModal] = useState({ isOpen: false, stepNumber: null });
  const [expandedStep, setExpandedStep] = useState(null);
  const [paymentHistory, setPaymentHistory] = useState([]);
  const [loadingPayments, setLoadingPayments] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  useEffect(() => {
    fetchUserDetails();
  }, [id]);

  const fetchUserDetails = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await axios.get(`${API_URL}/api/admin/user/phone/${id}`, {
        headers: { token }
      });
      
      setUser(response.data);
      if(notes){
        console.log(notes[`${id}`]);
        setNotesToShow(notes[`${id}`]?.notes);
      }

      // Fetch payment history if phone number available
      if(response.data?.phone){
        setLoadingPayments(true);
        try {
          const response2 = await axios.get(`${API_URL}/api/admin/payments/phone/+91${response.data.phone}`, {
            headers: { token }
          });
          setPaymentHistory(response2.data || []);
        } catch (paymentError) {
          console.error("Error fetching payment history:", paymentError);
        } finally {
          setLoadingPayments(false);
        }
      }
      
      setLoading(false);
    } catch (err) {
      setError('Failed to fetch user details');
      setLoading(false);
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    return new Date((timestamp && timestamp._seconds ? timestamp._seconds * 1000 : new Date(timestamp).getTime())).toLocaleDateString();
  };

  const formatDateTime = (timestamp) => {
    if (!timestamp) return 'N/A';
    const date = new Date((timestamp && timestamp._seconds ? timestamp._seconds * 1000 : new Date(timestamp).getTime()));
    return date.toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatAmount = (amount) => {
    if (!amount && amount !== 0) return 'N/A';
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount / 100); // Converting paise to rupees
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
      const response = await axiosInstance.put(`${API_URL}/api/admin/update-user-step-data/${id}`, {
        ...user.stepsData,
        steps: updatedUserSteps,
      }, { headers: { token: localStorage.getItem('adminToken') } });
      
      console.log("Response from backend:", response.data);
      if(response.data.error) {
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
              onClick={() => navigate('/users')}
              className="flex items-center text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft size={20} className="mr-2" />
              Back to Users
            </button>
            <h1 className="text-3xl font-bold text-gray-900">{user.name}'s Profile</h1>
            <button
              onClick={() => setIsEditModalOpen(true)}
              className="ml-auto flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
            >
              <Edit size={18} />
              Edit User
            </button>
          </div>

          {/* Basic Info Card */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Basic Information</h2>
              <span className={`px-3 py-1 rounded-full text-sm ${
                user.isPremium ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
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
                  <p className="font-medium">{formatDate(user.premiumPlan.purchaseDate)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Expiry Date</p>
                  <p className="font-medium">{formatDate(user.premiumPlan.expiryDate)}</p>
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

               
              
            </div>
          </div>
            )
         
          
          }

          {notesToShow && Object.keys(notesToShow).length > 0 && (
            <div className="bg-white rounded-lg shadow-md p-6  mb-6">
              <h2 className="text-xl font-semibold mb-4">Notes</h2>
              <div className="space-y-4">
                {Object.entries(notesToShow).map(([noteKey, noteData], index) => (
                  <div 
                    key={index} 
                    className="border-l-4 border-blue-500 bg-gray-50 p-4 rounded-r-lg hover:shadow-md transition-shadow"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <span className="font-medium text-blue-600">
                        {noteKey.replace('note-', '')}
                      </span>
                      <span className="text-sm text-gray-500">
                        {new Date(noteData.createdAt).toLocaleString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
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
          { user && user.stepsData && user.stepsData.steps && <div className='mb-12'>
           <ProgressTracker userId={user.id} userStepsData={user.stepsData.steps} form={user.stepsData.id} onVerdictClick={(step)=> handleAddVerdict(step.number)} />
           </div>}

          {/* Payment History Section */}
          {paymentHistory.length > 0 && (
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold flex items-center">
                  <DollarSign size={20} className="mr-2 text-green-600" />
                  Payment History
                </h2>
                <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded-md text-sm">
                  {paymentHistory.length} transactions
                </span>
              </div>

              {loadingPayments ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                        <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Event</th>
                        <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Plan</th>
                        <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                        <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Method</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {paymentHistory.filter(payment => payment.eventType === 'payment.captured').map((payment, index) => {
                        const paymentData = payment.data || {};
                        const notes = paymentData.notes || {};
                        
                        return (
                          <tr key={payment.id} className="hover:bg-gray-50">
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                              {formatDateTime(payment.timestamp)}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                              {payment.eventType}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                              {notes.planTitle || 'N/A'}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                              {formatAmount(paymentData.amount)}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(paymentData.status)}`}>
                                {paymentData.status || 'N/A'}
                              </span>
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 capitalize">
                              {paymentData.method || 'N/A'}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
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

          {/* Premium Plan Details */}
          {user.premiumPlan && (
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <h2 className="text-xl font-semibold mb-4">Premium Plan Details</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Plan Title</p>
                  <p className="font-medium">{user.premiumPlan.planTitle}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Purchased Date</p>
                  <p className="font-medium">{formatDate(user.premiumPlan.purchaseDate)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Expiry Date</p>
                  <p className="font-medium">{formatDate(user.premiumPlan.expiryDate)}</p>
                </div>
              </div>
            </div>
          )}

          {/* Edit User Modal */}
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
        </div>
      </div>
    </div>
  );
};

export default UserDetailsByPhone;