import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2 } from 'lucide-react';

const PlanFormModal = ({ plan, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    title: '',
    price: '',
    opensAt: {
      _seconds: Math.floor(new Date().getTime() / 1000),
      _nanoseconds: 0
    },
    form: '',
    isLocked: false,
    lockedText: '',
    benefits: []
  });

  const [newBenefit, setNewBenefit] = useState('');

  useEffect(() => {
    if (plan) {
      setFormData({
        title: plan.title || '',
        price: plan.price || '',
        opensAt: plan.opensAt || {
          _seconds: Math.floor(new Date().getTime() / 1000),
          _nanoseconds: 0
        },
        form: plan.form || '',
        isLocked: plan.isLocked || false,
        lockedText: plan.lockedText || '',
        benefits: plan.benefits || []
      });
    }
  }, [plan]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleDateTimeChange = (e) => {
    const dateTime = new Date(e.target.value);
    setFormData(prev => ({
      ...prev,
      opensAt: {
        _seconds: Math.floor(dateTime.getTime() / 1000),
        _nanoseconds: 0
      }
    }));
  };

  const addBenefit = () => {
    if (newBenefit.trim()) {
      setFormData(prev => ({
        ...prev,
        benefits: [...prev.benefits, newBenefit.trim()]
      }));
      setNewBenefit('');
    }
  };

  const removeBenefit = (index) => {
    setFormData(prev => ({
      ...prev,
      benefits: prev.benefits.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Validation
    if (!formData.title.trim()) {
      alert('Plan title is required');
      return;
    }
    
    if (!formData.price || isNaN(formData.price) || parseFloat(formData.price) <= 0) {
      alert('Valid price is required');
      return;
    }

    if (formData.isLocked && !formData.lockedText.trim()) {
      alert('Locked text is required when plan is locked');
      return;
    }

    // Convert price to number
    const planData = {
      ...formData,
      price: parseFloat(formData.price)
    };

    onSave(planData);
  };

  // Convert timestamp to datetime-local format
  const getDateTimeValue = () => {
    if (formData.opensAt && formData.opensAt._seconds) {
      const date = new Date(formData.opensAt._seconds * 1000);
      return date.toISOString().slice(0, 16);
    }
    return new Date().toISOString().slice(0, 16);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
          <h2 className="text-xl font-semibold text-gray-800">
            {plan ? 'Edit Premium Plan' : 'Add New Premium Plan'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Plan Title *
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter plan title"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Price (₹) *
              </label>
              <input
                type="number"
                name="price"
                value={formData.price}
                onChange={handleInputChange}
                required
                min="0"
                step="0.01"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter price"
              />
            </div>
          </div>

          {/* Form ID and Opens At */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Form ID
              </label>
              <input
                type="text"
                name="form"
                value={formData.form}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter form ID (optional)"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Opens At *
              </label>
              <input
                type="datetime-local"
                value={getDateTimeValue()}
                onChange={handleDateTimeChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          {/* Lock Status and Locked Text */}
          <div className="space-y-4">
            <div className="flex items-center">
              <input
                type="checkbox"
                name="isLocked"
                checked={formData.isLocked}
                onChange={handleInputChange}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label className="ml-2 text-sm font-medium text-gray-700">
                Lock this plan
              </label>
            </div>

            {formData.isLocked && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Locked Message *
                </label>
                <textarea
                  name="lockedText"
                  value={formData.lockedText}
                  onChange={handleInputChange}
                  required={formData.isLocked}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter message to display when plan is locked"
                />
                <p className="text-xs text-gray-500 mt-1">
                  This message will be shown to users when the plan is locked
                </p>
              </div>
            )}
          </div>

          {/* Benefits Section */}
          <div className="space-y-4">
            <label className="block text-sm font-medium text-gray-700">
              Plan Benefits
            </label>
            
            {/* Add new benefit */}
            <div className="flex gap-2">
              <input
                type="text"
                value={newBenefit}
                onChange={(e) => setNewBenefit(e.target.value)}
                placeholder="Add a benefit"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addBenefit();
                  }
                }}
              />
              <button
                type="button"
                onClick={addBenefit}
                className="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center"
              >
                <Plus size={16} />
              </button>
            </div>

            {/* Benefits list */}
            {formData.benefits.length > 0 && (
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {formData.benefits.map((benefit, index) => (
                  <div key={index} className="flex items-center gap-2 p-2 bg-gray-50 rounded-md">
                    <span className="flex-1 text-sm">{benefit}</span>
                    <button
                      type="button"
                      onClick={() => removeBenefit(index)}
                      className="text-red-600 hover:text-red-800 p-1"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Form Actions */}
          <div className="flex justify-end gap-3 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              {plan ? 'Update Plan' : 'Create Plan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PlanFormModal;
