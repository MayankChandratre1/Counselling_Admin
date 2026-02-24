import React, { useState, useEffect } from 'react';
import { CheckCircle, XCircle, Clock, ChevronDown, ChevronUp, MessageSquare, Edit, Lock } from 'lucide-react';
import axiosInstance from '../../utils/axios';
import { set } from 'lodash';

const ProgressTracker = ({ userId, userStepsData, form, onVerdictClick, onEditClick }) => {
  const [forms, setForms] = useState([]);
  const [selectedForm, setSelectedForm] = useState(form || null);
  const [formSteps, setFormSteps] = useState([]);
  const [userSteps, setUserSteps] = useState(userStepsData ?? []);
  const [loading, setLoading] = useState(true);
  const [expandedStep, setExpandedStep] = useState(null);
  const [verdictModal, setVerdictModal] = useState({ isOpen: false, stepNumber: null });

  useEffect(() => {
    fetchForms();
  }, []);

  useEffect(() => {
    setLoading(false);
  },[selectedForm, formSteps, userStepsData]);

  const fetchForms = async () => {
    try {
      const response = await axiosInstance.get('/api/admin/formsteps');
      setForms(response.data);
      
      // Auto-select the first form if available
      if (response.data.length > 0 ) {
        if(selectedForm)
        setFormSteps(response.data.find(f => f.id == selectedForm).steps.sort((a, b) => a.number - b.number));
        else {
          setSelectedForm(response.data[0].id);
          setFormSteps(response.data[0].steps.sort((a, b) => a.number - b.number));
        }
      }
    } catch (err) {
      console.error('Error fetching forms:', err);
    }
  };

  const handleFormSelect = (formId) => {
    setSelectedForm(formId);
    setExpandedStep(null);
    const selectedFormData = forms.find(form => form.id === formId);
    if (selectedFormData) {
      setFormSteps(selectedFormData.steps.sort((a, b) => a.number - b.number));
    } else {
      setFormSteps([]);
    }
  };

  const toggleStepExpand = (stepNumber) => {
    setExpandedStep(expandedStep === stepNumber ? null : stepNumber);
  };

  const getStepStatusIcon = (status) => {
    switch (status) {
      case 'Yes':
        return <CheckCircle className="text-green-500" />;
      case 'No':
        return <XCircle className="text-red-500" />;
      default:
        return <Clock className="text-yellow-500" />;
    }
  };

  const getStepStatusText = (status) => {
    switch (status) {
      case 'Yes':
        return <span className="text-green-600 font-medium">Completed</span>;
      case 'No':
        return <span className="text-red-600 font-medium">Rejected</span>;
      default:
        return <span className="text-yellow-600 font-medium">Pending</span>;
    }
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
         {step.isLocked && (
          <span className="px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-800">
            <Lock size={14} className="inline" />
          </span>
        )}
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
  
  const handleAddVerdict = (stepNumber) => {
    setVerdictModal({ isOpen: true, stepNumber });
  };

  // Merge form steps with user steps
  const mergedSteps = formSteps.map(formStep => {
    const userStep = userSteps.find(s => s.number === formStep.number) || {};
    return { ...formStep, ...userStep };
  });

  if (loading && !forms.length) {
    return (
      <div className="flex justify-center p-6">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Form Selector */}
      <div className="bg-white rounded-lg shadow-sm p-4 mb-2">
        <label htmlFor="form-select" className="block text-sm font-medium text-gray-700 mb-1">
          Select Form
        </label>
        <select
          id="form-select"
          value={selectedForm || ''}
          onChange={(e) => handleFormSelect(e.target.value)}
          className="w-full md:w-64 p-2 border border-gray-300 rounded-lg appearance-none bg-white"
        >
          <option value="">Select a form</option>
          {forms.map(form => (
            <option key={form.id} value={form.id}>
              {form.id}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="flex justify-center p-6">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-md">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold">Progress Steps - {selectedForm}</h2>
          </div>
          
          {mergedSteps.length > 0 ? (
            <div className="divide-y divide-gray-200">
              {mergedSteps.map((step) => (
                <div key={step.number} className="px-6 py-4">
                  <div 
                    className="flex justify-between items-center cursor-pointer"
                    onClick={() => toggleStepExpand(step.number)}
                  >
                    <div className="flex items-center space-x-3">
                      <div className={`w-8 h-8 flex items-center justify-center rounded-full 
                        ${step.status === 'Yes' ? 'bg-green-100 text-green-800' : 
                          step.status === 'No' ? 'bg-red-100 text-red-800' : 
                          'bg-gray-100 text-gray-800'}`}
                      >
                        {step.number}

                      </div>
                      <div>
                        <h3 className="text-lg font-medium text-gray-900">{step.title}</h3>
                        <div className="flex items-center mt-1 gap-2">
                                                  
                          {getStepStatusBadge(step.status)}
                          {getStepTypeBadges(step)}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      {step.isVerdict && (
                        <button
                          onClick={(e)=>{
                            e.stopPropagation();
                            onVerdictClick(step);
                          }}
                          className="px-3 py-1 bg-purple-50 text-purple-700 rounded-md hover:bg-purple-100 flex items-center gap-1"
                        >
                          <MessageSquare size={14} />
                          Add Verdict
                        </button>
                      )}
                     {!step.isLocked &&  <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onEditClick(step);
                        }}
                        className="p-2 text-green-600 hover:bg-green-50 rounded-full"
                        title="Edit Step"
                      >
                        <Edit size={16} />
                      </button>}
                      {expandedStep === step.number ? (
                        <ChevronUp size={20} className="text-gray-500" />
                      ) : (
                        <ChevronDown size={20} className="text-gray-500" />
                      )}
                    </div>
                  </div>
                  
                  {/* Expanded Step Content */}
                  {expandedStep === step.number && (
                    <div className="mt-4 ml-11 border-l-2 border-gray-200 pl-4 space-y-3">
                      {/* Display step data when available */}
                      {step.isVerdict && step.verdict && (
                        <div className="bg-purple-50 border border-purple-100 rounded-md p-3">
                          <div className="font-medium text-sm text-purple-800 mb-1">Verdict:</div>
                          <div className="text-gray-800">{step.verdict}</div>
                        </div>
                      )}
                      
                      {step.isCapQuery && (
                        <div className="space-y-2">
                          {step.collegeName && (
                            <div className="bg-blue-50 border border-blue-100 rounded-md p-3">
                              <div className="font-medium text-sm text-blue-800 mb-1">College:</div>
                              <div className="text-gray-800">{step.collegeName}</div>
                            </div>
                          )}
                          
                          {step.branchCode && (
                            <div className="bg-blue-50 border border-blue-100 rounded-md p-3">
                              <div className="font-medium text-sm text-blue-800 mb-1">Branch:</div>
                              <div className="text-gray-800">{step.branchCode} - {step.branchName || ''}</div>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Show description if available */}
                      {step.description && (
                        <div className="bg-gray-50 border border-gray-200 rounded-md p-3">
                          <div className="font-medium text-sm text-gray-700 mb-1">Description:</div>
                          <div className="text-gray-600">{step.description}</div>
                        </div>
                      )}

                      {/* Show timestamp if available */}
                      {step.timestamp && (
                        <div className="text-xs text-gray-500 italic">
                          Last updated: {new Date((step.timestamp && step.timestamp._seconds ? step.timestamp._seconds * 1000 : new Date(step.timestamp).getTime())).toLocaleString()}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="p-6 text-center text-gray-500">
              {selectedForm 
                ? "No steps found for this form or user hasn't started this form yet."
                : "Please select a form to view progress steps."}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ProgressTracker;