import React, { useState } from 'react';

const StepEditModal = ({ isOpen, onClose, step, onSave }) => {
  if (!isOpen || !step) return null;

  const [formData, setFormData] = useState({
    status: step.status || null,
    collegeName: step.collegeName || '',
    branchCode: step.branchCode || '',
    verdict: step.verdict || ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({
      ...step,
      status: formData.status,
      collegeName: formData.collegeName,
      branchCode: formData.branchCode,
      verdict: formData.verdict
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-md p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Edit Step {step.number}</h2>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Step Title</label>
            <p className="text-gray-900 border p-2 rounded bg-gray-50">{step.title}</p>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              name="status"
              value={formData.status || ""}
              onChange={handleChange}
              className="w-full p-2 border border-gray-300 rounded-lg"
            >
              <option value="">Select Status</option>
              <option value="Yes">Yes (Completed)</option>
              <option value="No">No (Rejected)</option>
            </select>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">College Name</label>
            <input
              type="text"
              name="collegeName"
              value={formData.collegeName}
              onChange={handleChange}
              className="w-full p-2 border border-gray-300 rounded-lg"
              placeholder="Enter college name"
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Branch Code</label>
            <input
              type="text"
              name="branchCode"
              value={formData.branchCode}
              onChange={handleChange}
              className="w-full p-2 border border-gray-300 rounded-lg"
              placeholder="Enter branch code"
            />
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-1">Verdict</label>
            <textarea
              name="verdict"
              value={formData.verdict}
              onChange={handleChange}
              className="w-full p-2 border border-gray-300 rounded-lg"
              rows="3"
              placeholder="Enter verdict"
            ></textarea>
          </div>

          <div className="flex justify-end gap-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default StepEditModal;
