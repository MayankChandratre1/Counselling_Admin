import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2 } from 'lucide-react';

const PlanFormModal = ({ plan, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    title: '',
    price: 0,
    opensAt: '',
    benefits: [''],
    isLocked: false,
    form: ''
  });
  
  useEffect(() => {
    if (plan) {
      const opensAtDate = plan.opensAt && plan.opensAt._seconds 
        ? new Date(plan.opensAt._seconds * 1000).toISOString().split('T')[0] 
        : '';
      
      setFormData({
        title: plan.title || '',
        price: plan.price || 0,
        opensAt: opensAtDate,
        benefits: plan.benefits && plan.benefits.length > 0 ? plan.benefits : [''],
        isLocked: plan.isLocked || false,
        form: plan.form || ''
      });
    }
  }, [plan]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const handleBenefitChange = (index, value) => {
    const updatedBenefits = [...formData.benefits];
    updatedBenefits[index] = value;
    setFormData({ ...formData, benefits: updatedBenefits });
  };

  const addBenefit = () => {
    setFormData({ ...formData, benefits: [...formData.benefits, ''] });
  };

  const removeBenefit = (index) => {
    const updatedBenefits = [...formData.benefits];
    updatedBenefits.splice(index, 1);
    setFormData({ ...formData, benefits: updatedBenefits });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Filter out empty benefits
    const filteredBenefits = formData.benefits.filter(benefit => benefit.trim() !== '');
    
    // Convert date string to timestamp object
    const opensAtDate = new Date(formData.opensAt);
    const opensAt = {
      _seconds: Math.floor(opensAtDate.getTime() / 1000),
      _nanoseconds: 0
    };
    
    onSave({
      ...formData,
      price: parseInt(formData.price, 10),
      opensAt,
      benefits: filteredBenefits
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full mx-4 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <h3 className="text-xl font-semibold text-gray-800">
            {plan ? 'Edit Premium Plan' : 'Add New Premium Plan'}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="space-y-4">
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                Plan Title*
              </label>
              <input
                type="text"
                id="title"
                name="title"
                value={formData.title}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-1">
                Price (in INR)*
              </label>
              <input
                type="number"
                id="price"
                name="price"
                value={formData.price}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                min="0"
                required
              />
            </div>

            <div>
              <label htmlFor="opensAt" className="block text-sm font-medium text-gray-700 mb-1">
                Opens At*
              </label>
              <input
                type="date"
                id="opensAt"
                name="opensAt"
                value={formData.opensAt}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label htmlFor="form" className="block text-sm font-medium text-gray-700 mb-1">
                Form ID
              </label>
              <input
                type="text"
                id="form"
                name="form"
                value={formData.form}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g. elite-1234567"
              />
              <p className="text-xs text-gray-500 mt-1">
                ID of the form to be associated with this plan (optional)
              </p>
            </div>

            <div>
              <div className="flex items-center mb-2">
                <input
                  type="checkbox"
                  id="isLocked"
                  name="isLocked"
                  checked={formData.isLocked}
                  onChange={handleChange}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="isLocked" className="ml-2 block text-sm text-gray-700">
                  Lock this plan
                </label>
              </div>
              <p className="text-xs text-gray-500">
                Locked plans can't be purchased until they are unlocked by an admin
              </p>
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-sm font-medium text-gray-700">Benefits</label>
                <button
                  type="button"
                  onClick={addBenefit}
                  className="px-2 py-1 bg-green-50 text-green-600 rounded hover:bg-green-100 flex items-center text-sm"
                >
                  <Plus size={14} className="mr-1" />
                  Add Benefit
                </button>
              </div>
              <div className="space-y-2">
                {formData.benefits.map((benefit, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <input
                      type="text"
                      value={benefit}
                      onChange={(e) => handleBenefitChange(index, e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter benefit"
                    />
                    {formData.benefits.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeBenefit(index)}
                        className="p-2 text-red-500 hover:text-red-700 rounded-full hover:bg-red-50"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 mt-6">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                {plan ? 'Update Plan' : 'Add Plan'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PlanFormModal;
