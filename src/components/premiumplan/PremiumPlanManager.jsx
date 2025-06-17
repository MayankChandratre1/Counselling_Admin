import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Check, X, Clock, DollarSign, FileLock2 } from 'lucide-react';
import axiosInstance from '../../utils/axios';
import PlanFormModal from './PlanFormModal';

const PremiumPlanManager = () => {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [currentPlan, setCurrentPlan] = useState(null);

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get('/api/admin/get-premium-plans');
      setPlans(response.data.plans || []);
      setError(null);
    } catch (error) {
      console.error('Error fetching premium plans:', error);
      setError('Failed to load premium plans. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSavePlan = async (planData) => {
    try {
      // Make a deep copy of the current plans
      let updatedPlans = JSON.parse(JSON.stringify(plans));

      if (currentPlan) {
        // Update existing plan
        const index = updatedPlans.findIndex(p => 
          p.title === currentPlan.title && p.price === currentPlan.price
        );
        if (index !== -1) {
          updatedPlans[index] = planData;
        }
      } else {
        // Add new plan
        updatedPlans.push(planData);
      }

      // Save to backend
      await axiosInstance.post('/api/admin/update-premium-plans', {
        plans: updatedPlans
      });

      setPlans(updatedPlans);
      setShowModal(false);
      setCurrentPlan(null);
    } catch (error) {
      console.error('Error saving plan:', error);
      alert('Failed to save plan. Please try again.');
    }
  };

  const handleDeletePlan = async (plan) => {
    if (window.confirm(`Are you sure you want to delete the plan "${plan.title}"?`)) {
      try {
        const updatedPlans = plans.filter(p => 
          !(p.title === plan.title && p.price === plan.price)
        );
        
        await axiosInstance.post('/api/admin/update-premium-plans', {
          plans: updatedPlans
        });
        
        setPlans(updatedPlans);
      } catch (error) {
        console.error('Error deleting plan:', error);
        alert('Failed to delete plan. Please try again.');
      }
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp || !timestamp._seconds) return 'N/A';
    return new Date(timestamp._seconds * 1000).toLocaleString();
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(price);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {error && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6">
          <p>{error}</p>
        </div>
      )}

      <div className="mb-6 flex justify-between items-center">
        <h2 className="text-xl font-semibold text-gray-800">Premium Plans</h2>
        <button
          onClick={() => {
            setCurrentPlan(null);
            setShowModal(true);
          }}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center"
        >
          <Plus size={18} className="mr-2" />
          Add New Plan
        </button>
      </div>

      {plans.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg border border-gray-200 shadow-sm">
          <div className="flex flex-col items-center">
            <DollarSign size={48} className="text-gray-300 mb-3" />
            <h3 className="text-lg font-medium text-gray-500 mb-1">No Premium Plans</h3>
            <p className="text-gray-400 mb-4">Add a new plan to get started</p>
            <button
              onClick={() => {
                setCurrentPlan(null);
                setShowModal(true);
              }}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center"
            >
              <Plus size={18} className="mr-2" />
              Add First Plan
            </button>
          </div>
        </div>
      ) : (
        <div className="grid gap-4">
          {plans.map((plan, index) => (
            <div 
              key={index} 
              className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden"
            >
              <div className="p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-xl font-semibold text-gray-800 mb-2 flex items-center">
                      {plan.title}
                      {plan.isLocked && (
                        <FileLock2 size={16} className="ml-2 text-amber-500" title="Locked" />
                      )}
                    </h3>
                    <div className="text-lg font-bold text-blue-600 mb-3">
                      {formatPrice(plan.price)}
                    </div>
                    <div className="text-sm text-gray-600 flex items-center mb-2">
                      <Clock size={14} className="mr-1" />
                      Opens at: {formatDate(plan.opensAt)}
                    </div>
                    {plan.form && (
                      <div className="text-sm text-gray-600 mb-2">
                        Form ID: <span className="font-mono">{plan.form}</span>
                      </div>
                    )}
                    {plan.isLocked && plan.lockedText && (
                      <div className="text-sm text-amber-700 bg-amber-50 p-2 rounded-md border border-amber-200 mb-2">
                        <strong>Locked Message:</strong> {plan.lockedText}
                      </div>
                    )}
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => {
                        setCurrentPlan(plan);
                        setShowModal(true);
                      }}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-full"
                      title="Edit plan"
                    >
                      <Edit size={18} />
                    </button>
                    <button
                      onClick={() => handleDeletePlan(plan)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-full"
                      title="Delete plan"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>

                {plan.benefits && plan.benefits.length > 0 && (
                  <div className="mt-4">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Plan Benefits:</h4>
                    <ul className="space-y-1">
                      {plan.benefits.map((benefit, idx) => (
                        <li key={idx} className="flex items-start">
                          <Check size={16} className="text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                          <span className="text-sm text-gray-600">{benefit}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <PlanFormModal 
          plan={currentPlan}
          onClose={() => {
            setShowModal(false);
            setCurrentPlan(null);
          }}
          onSave={handleSavePlan}
        />
      )}
    </div>
  );
};

export default PremiumPlanManager;
