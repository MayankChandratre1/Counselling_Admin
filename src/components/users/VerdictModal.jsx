import React, { useState } from 'react';
import { X } from 'lucide-react';

const VerdictModal = ({ isOpen, onClose, onConfirm, stepNumber }) => {
  const [verdict, setVerdict] = useState('');

  if (!isOpen) return null;

  const handleSubmit = () => {
    onConfirm(stepNumber, verdict);
    setVerdict('');
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-md mx-4 p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium">Add Verdict for Step {stepNumber}</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500"
          >
            <X size={20} />
          </button>
        </div>
        
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Verdict
          </label>
          <textarea
            value={verdict}
            onChange={(e) => setVerdict(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 h-32"
            placeholder="Enter verdict details..."
          />
        </div>

        <div className="flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!verdict.trim()}
            className={`px-4 py-2 rounded-md text-white ${
              !verdict.trim() ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
};

export default VerdictModal;
