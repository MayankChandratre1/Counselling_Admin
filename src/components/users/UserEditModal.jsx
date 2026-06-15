import React, { useState, useEffect } from 'react';
import { X, AlertCircle } from 'lucide-react';
import { usePremiumPage } from '../../contexts/PremiumPageContext';
import PaymentSourceFields from './PaymentSourceFields';
import { DEFAULT_PAYMENT_SOURCE } from '../../utils/paymentSource';

const UserEditModal = ({ isOpen, onClose, user, onSave }) => {
  const { premiumPlans, plansLoading } = usePremiumPage();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPremiumFields, setShowPremiumFields] = useState(false);
  const [isPaymentPending, setIsPaymentPending] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState('');
  const [formData, setFormData] = useState({
    // Basic Information
    name: '',
    phone: '',
    batch: 'online',
    isPremium: false,
    
    // Premium Plan Details
    premiumPlan: {
      planTitle: '',
      purchasedDate: new Date().toISOString().split('T')[0], // Default to today
      //expires after 6 months
      expiryDate: new Date(new Date().setMonth(new Date().getMonth() + 6)).toISOString().split('T')[0] 
      , // Default to 6 months from today
      form: '',
      isPaymentPending: false,
      amountPaid: 0,
      amountRemaining: 0,
      paymentSource: DEFAULT_PAYMENT_SOURCE,
      paymentSourceLabel: ''
    },
    
    // Counselling Data
    counsellingData: {
      fullName: '',
      dob: '',
      email: '',
      city: '',
      state: '',
      boardMarks: '',
      boardType: 'State Board',
      jeeMarks: '',
      cetMarks: '',
      cetPercentile: '',
      jeePercentile: '',
      preferredField: '',
      cetSeatNumber: '',
      jeeSeatNumber: '',
      preferredLocations: '',
      budget: '',
      category: '',
      isPwd: 'NO',
      isDefense: 'NO'
    }
  });

  // Handle plan selection and auto-populate fields
  const handlePlanSelection = (planTitle) => {
    setSelectedPlan(planTitle);
    
    if (planTitle) {
      const selectedPlanData = premiumPlans.find(plan => plan.title === planTitle);
      if (selectedPlanData) {
        setFormData(prev => ({
          ...prev,
          premiumPlan: {
            ...prev.premiumPlan,
            planTitle: selectedPlanData.title,
            form: selectedPlanData.form || '',
            purchasedDate: new Date().toISOString().split('T')[0], // Default to today
      //expires after 6 months
      expiryDate: new Date(new Date().setMonth(new Date().getMonth() + 6)).toISOString().split('T')[0] 
          }
        }));
      }
    } else {
      // Clear premium plan data if no plan selected
      setFormData(prev => ({
        ...prev,
        premiumPlan: {
          planTitle: '',
          purchasedDate: '',
          expiryDate: '',
          form: '',
          isPaymentPending: false,
          amountPaid: 0,
          amountRemaining: 0,
          paymentSource: DEFAULT_PAYMENT_SOURCE,
          paymentSourceLabel: ''
        }
      }));
    }
  };

  // Initialize form data with user data
  useEffect(() => {
    if (user) {
      const preprocessedUser = {
        name: user.name || '',
        phone: user.phone || '',
        batch: user.batch || 'online',
        isPremium: user.isPremium || false,
        counsellingData: { ...user.counsellingData } || {}
      };

      // Format DOB from dd/mm/yyyy to yyyy-mm-dd for the date input if it exists
      if (preprocessedUser.counsellingData?.dob) {
        const dobParts = preprocessedUser.counsellingData.dob.split('/');
        if (dobParts.length === 3) {
          preprocessedUser.counsellingData.dob = `${dobParts[2]}-${dobParts[1].padStart(2, '0')}-${dobParts[0].padStart(2, '0')}`;
        }
      }

      // Handle premium plan data
      if (user.premiumPlan) {
        setShowPremiumFields(true);
        setSelectedPlan(user.premiumPlan.planTitle || '');
        
        const premiumPlan = { ...user.premiumPlan };
        
        // Format dates for the date inputs
        if (premiumPlan.purchasedDate && premiumPlan.purchasedDate._seconds) {
          const purchaseDate = new Date((premiumPlan.purchasedDate && premiumPlan.purchasedDate._seconds ? premiumPlan.purchasedDate._seconds * 1000 : new Date(premiumPlan.purchasedDate).getTime()));
          premiumPlan.purchasedDate = purchaseDate.toISOString().split('T')[0];
        }
        
        if (premiumPlan.expiryDate && premiumPlan.expiryDate._seconds) {
          const expiryDate = new Date((premiumPlan.expiryDate && premiumPlan.expiryDate._seconds ? premiumPlan.expiryDate._seconds * 1000 : new Date(premiumPlan.expiryDate).getTime()));
          premiumPlan.expiryDate = expiryDate.toISOString().split('T')[0];
        }

        // Check if payment is pending
        if (premiumPlan.isPaymentPending) {
          setIsPaymentPending(true);
        }

        premiumPlan.paymentSource = premiumPlan.paymentSource || DEFAULT_PAYMENT_SOURCE;
        premiumPlan.paymentSourceLabel = premiumPlan.paymentSourceLabel || '';

        preprocessedUser.premiumPlan = premiumPlan;
      }

      setFormData(preprocessedUser);
    }
  }, [user]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (name.includes('.')) {
      // Handle nested fields (counsellingData or premiumPlan)
      const [parent, child] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: type === 'checkbox' ? checked : value
        }
      }));
    } else {
      // Handle top-level fields
      if (name === 'isPremium') {
        setShowPremiumFields(checked);
        if (!checked) {
          setSelectedPlan('');
          handlePlanSelection('');
        }
      }
      
      setFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    // Basic validation
    if (!formData.name.trim()) {
      setError('Name is required');
      return;
    }
    
    if (!formData.phone.trim() || !/^\d{10}$/.test(formData.phone.trim())) {
      setError('Valid phone number is required (10 digits)');
      return;
    }
    
    if (formData.isPremium && !formData.premiumPlan?.planTitle) {
      setError('Please select a premium plan');
      return;
    }

    if (
      formData.isPremium &&
      formData.premiumPlan?.paymentSource === 'Custom' &&
      !formData.premiumPlan?.paymentSourceLabel?.trim()
    ) {
      setError('Custom payment label is required');
      return;
    }
    
    try {
      setLoading(true);
      
      // Prepare the user data for submission
      const userData = {
        name: formData.name,
        phone: formData.phone,
        batch: formData.batch,
        isPremium: formData.isPremium,
        counsellingData: { ...formData.counsellingData }
      };
      
      // Format DOB back to dd/mm/yyyy
      if (userData.counsellingData.dob) {
        const dobDate = new Date(userData.counsellingData.dob);
        if (!isNaN(dobDate.getTime())) {
          const day = dobDate.getDate().toString().padStart(2, '0');
          const month = (dobDate.getMonth() + 1).toString().padStart(2, '0');
          const year = dobDate.getFullYear();
          userData.counsellingData.dob = `${day}/${month}/${year}`;
        }
      }

      // Add premium plan data if isPremium is checked
      if (formData.isPremium) {
        const premiumPlan = { ...formData.premiumPlan };
        
        // Format dates as Firebase timestamps
        // if (premiumPlan.purchasedDate) {
        //   const purchasedSeconds = Math.floor(new Date(premiumPlan.purchasedDate).getTime() / 1000);
        //   premiumPlan.purchasedDate = {
        //     _seconds: purchasedSeconds,
        //     _nanoseconds: 0
        //   };
        // }
        
        // if (premiumPlan.expiryDate) {
        //   const expirySeconds = Math.floor(new Date(premiumPlan.expiryDate).getTime() / 1000);
        //   premiumPlan.expiryDate = {
        //     _seconds: expirySeconds,
        //     _nanoseconds: 0
        //   };
        // }
        
        // Add payment pending info if checked
        premiumPlan.isPaymentPending = isPaymentPending;
        if (isPaymentPending) {
          premiumPlan.amountPaid = parseFloat(formData.premiumPlan.amountPaid) || 0;
          premiumPlan.amountRemaining = parseFloat(formData.premiumPlan.amountRemaining) || 0;
        } else {
          premiumPlan.amountPaid = 0;
          premiumPlan.amountRemaining = 0;
        }

        if (premiumPlan.paymentSource !== 'Custom') {
          delete premiumPlan.paymentSourceLabel;
        }
        
        userData.premiumPlan = premiumPlan;
      } else {
        // If user is no longer premium, remove premium plan
        userData.premiumPlan = null;
      }

      await onSave(userData);
    } catch (error) {
      console.error('Error updating user:', error);
      setError(error.response?.data?.message || 'Failed to update user');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 z-50 flex justify-center items-start overflow-y-auto pt-10 pb-10">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 relative max-h-full overflow-y-auto">
        <div className="sticky top-0 bg-white p-6 border-b z-10 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-900">Edit User</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-md hover:bg-gray-100"
          >
            <X size={24} />
          </button>
        </div>
        
        <div className="p-6">
          {error && (
            <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4 flex items-start">
              <AlertCircle className="w-5 h-5 text-red-500 mr-2 flex-shrink-0 mt-0.5" />
              <p className="text-red-700">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Basic Information */}
            <div className="space-y-6">
              <h3 className="text-xl font-semibold text-gray-800 border-b pb-2">Basic Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                  <input
                    type="text"
                    name="name"
                    required
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone * (10 digits)</label>
                  <input
                    type="tel"
                    name="phone"
                    required
                    value={formData.phone}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Batch</label>
                  <select
                    name="batch"
                    value={formData.batch}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="online">Online</option>
                    <option value="offline">Offline</option>
                  </select>
                </div>
                <div className="flex items-center mt-6">
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      name="isPremium"
                      checked={formData.isPremium}
                      onChange={(e) => {
                        handleChange(e);
                        setShowPremiumFields(e.target.checked);
                      }}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <span className="ml-2 text-sm font-medium text-gray-700">Premium User</span>
                  </label>
                </div>
              </div>
            </div>
            
            {/* Premium Plan Info - Updated */}
            {showPremiumFields && (
              <div className="space-y-6">
                <h3 className="text-xl font-semibold text-gray-800 border-b pb-2">Premium Plan Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Select Plan *</label>
                    {plansLoading ? (
                      <div className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50">
                        <span className="text-gray-500">Loading plans...</span>
                      </div>
                    ) : (
                      <select
                        value={selectedPlan}
                        onChange={(e) => handlePlanSelection(e.target.value)}
                        required={formData.isPremium}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="">Select a plan...</option>
                        {premiumPlans?.map(plan => (
                          <option key={plan.title} value={plan.title}>
                            {plan.title} - ₹{plan.price}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                  
                  {selectedPlan && (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Plan Title</label>
                        <input
                          type="text"
                          value={formData.premiumPlan?.planTitle || ''}
                          readOnly
                          className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-600"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Form ID</label>
                        <input
                          type="text"
                          name="premiumPlan.form"
                          value={formData.premiumPlan?.form || ''}
                          onChange={handleChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                      
                      
                      
                    </>
                  )}
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Purchase Date</label>
                    <input
                      type="date"
                      name="premiumPlan.purchasedDate"
                      value={formData.premiumPlan?.purchasedDate || ''}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Expiry Date</label>
                    <input
                      type="date"
                      name="premiumPlan.expiryDate"
                      value={formData.premiumPlan?.expiryDate || ''}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div className="flex items-center mt-2">
                    <label className="flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isPaymentPending}
                        onChange={(e) => setIsPaymentPending(e.target.checked)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <span className="ml-2 text-sm font-medium text-gray-700">Payment Pending</span>
                    </label>
                  </div>

                  <PaymentSourceFields
                    paymentSource={formData.premiumPlan?.paymentSource || DEFAULT_PAYMENT_SOURCE}
                    paymentSourceLabel={formData.premiumPlan?.paymentSourceLabel || ''}
                    onSourceChange={(value) =>
                      setFormData((prev) => ({
                        ...prev,
                        premiumPlan: {
                          ...prev.premiumPlan,
                          paymentSource: value,
                          paymentSourceLabel: value === 'Custom' ? prev.premiumPlan?.paymentSourceLabel || '' : '',
                        },
                      }))
                    }
                    onLabelChange={(value) =>
                      setFormData((prev) => ({
                        ...prev,
                        premiumPlan: { ...prev.premiumPlan, paymentSourceLabel: value },
                      }))
                    }
                    required={formData.isPremium}
                  />
                  
                  {/* Payment pending fields */}
                  {isPaymentPending && (
                    <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Amount Paid (₹)</label>
                        <input
                          type="number"
                          name="premiumPlan.amountPaid"
                          value={formData.premiumPlan?.amountPaid || 0}
                          onChange={handleChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                          min="0"
                          step="0.01"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Amount Remaining (₹)</label>
                        <input
                          type="number"
                          name="premiumPlan.amountRemaining"
                          value={formData.premiumPlan?.amountRemaining || 0}
                          onChange={handleChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                          min="0"
                          step="0.01"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Counselling Data */}
            <div className="space-y-6">
              <h3 className="text-xl font-semibold text-gray-800 border-b pb-2">Counselling Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                  <input
                    type="email"
                    name="counsellingData.email"
                    required
                    value={formData.counsellingData?.email || ''}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth</label>
                  <input
                    type="date"
                    name="counsellingData.dob"
                    value={formData.counsellingData?.dob || ''}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                  <input
                    type="text"
                    name="counsellingData.city"
                    value={formData.counsellingData?.city || ''}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
                  <input
                    type="text"
                    name="counsellingData.state"
                    value={formData.counsellingData?.state || ''}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Board Type</label>
                  <select
                    name="counsellingData.boardType"
                    value={formData.counsellingData?.boardType || 'State Board'}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="State Board">State Board</option>
                    <option value="CBSE">CBSE</option>
                    <option value="ICSE">ICSE</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Board Marks</label>
                  <input
                    type="text"
                    name="counsellingData.boardMarks"
                    value={formData.counsellingData?.boardMarks || ''}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">CET Marks</label>
                  <input
                    type="text"
                    name="counsellingData.cetMarks"
                    value={formData.counsellingData?.cetMarks || ''}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">CET Percentile</label>
                  <input
                    type="text"
                    name="counsellingData.cetPercentile"
                    value={formData.counsellingData?.cetPercentile || ''}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">JEE Marks</label>
                  <input
                    type="text"
                    name="counsellingData.jeeMarks"
                    value={formData.counsellingData?.jeeMarks || ''}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">JEE Percentile</label>
                  <input
                    type="text"
                    name="counsellingData.jeePercentile"
                    value={formData.counsellingData?.jeePercentile || ''}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">CET Seat Number</label>
                  <input
                    type="text"
                    name="counsellingData.cetSeatNumber"
                    value={formData.counsellingData?.cetSeatNumber || ''}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">JEE Seat Number</label>
                  <input
                    type="text"
                    name="counsellingData.jeeSeatNumber"
                    value={formData.counsellingData?.jeeSeatNumber || ''}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                  <select
                    name="counsellingData.category"
                    value={formData.counsellingData?.category || ''}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Select Category</option>
                    <option value="OPEN">OPEN</option>
                    <option value="OBC">OBC</option>
                    <option value="SC">SC</option>
                    <option value="ST">ST</option>
                    <option value="SEBC">SEBC</option>
                    <option value="EWS">EWS</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Preferred Field</label>
                  <input
                    type="text"
                    name="counsellingData.preferredField"
                    value={formData.counsellingData?.preferredField || ''}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Preferred Locations</label>
                  <input
                    type="text"
                    name="counsellingData.preferredLocations"
                    value={formData.counsellingData?.preferredLocations || ''}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Budget</label>
                  <input
                    type="text"
                    name="counsellingData.budget"
                    value={formData.counsellingData?.budget || ''}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Person with Disability</label>
                  <select
                    name="counsellingData.isPwd"
                    value={formData.counsellingData?.isPwd || 'NO'}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="NO">No</option>
                    <option value="YES">Yes</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Defense Category</label>
                  <select
                    name="counsellingData.isDefense"
                    value={formData.counsellingData?.isDefense || 'NO'}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="NO">No</option>
                    <option value="YES">Yes</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-4 sticky bottom-0 bg-white pt-4 border-t">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-blue-400"
              >
                {loading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default UserEditModal;