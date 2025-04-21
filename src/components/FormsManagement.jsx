import React, { useEffect, useState } from "react";
import axiosInstance from "../utils/axios";

const FormStepsManagement = () => {
  const [forms, setForms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFormIndex, setActiveFormIndex] = useState(0);
  const [editIndex, setEditIndex] = useState(null); // Track which step is being edited
  const [expandedForm, setExpandedForm] = useState(null);

  useEffect(() => {
    fetchFormSteps();
  }, []);

  const fetchFormSteps = async () => {
    try {
      setLoading(true);
      const res = await axiosInstance.get("/api/admin/formsteps");
      if (res.data.length > 0) {
        setForms(res.data);
        setExpandedForm(0); // Expand the first form by default
      }
    } catch (error) {
      console.error("Error fetching form steps", error);
    } finally {
      setLoading(false);
    }
  };

  const handleEditClick = (formIndex, stepIndex) => {
    setActiveFormIndex(formIndex);
    setEditIndex(stepIndex);
  };

  const handleChange = (formIndex, stepIndex, field, value) => {
    const updatedForms = [...forms];
    
    // Special handling for mutually exclusive fields and automatic cap specific assignment
    if ((field === 'isVerdict' || field === 'isCapQuery') && value === true) {
      // Make the fields mutually exclusive
      if (field === 'isVerdict') {
        updatedForms[formIndex].steps[stepIndex].isCapQuery = false;
      } else {
        updatedForms[formIndex].steps[stepIndex].isVerdict = false;
      }
      
      // Automatically set isCapSpecific to true for verdict or cap query steps
      updatedForms[formIndex].steps[stepIndex].isCapSpecific = true;
      
      // Ensure cap round is set (default to 1 if not already set)
      if (!updatedForms[formIndex].steps[stepIndex].cap) {
        updatedForms[formIndex].steps[stepIndex].cap = 1;
      }
    }
    
    // If turning off both verdict and cap query, optionally allow turning off isCapSpecific
    if ((field === 'isVerdict' || field === 'isCapQuery') && value === false) {
      const step = updatedForms[formIndex].steps[stepIndex];
      if (!step.isVerdict && !step.isCapQuery) {
        // Optional: Uncomment this to automatically turn off isCapSpecific when neither verdict nor cap query
        // step.isCapSpecific = false;
      }
    }
    
    updatedForms[formIndex].steps[stepIndex] = { 
      ...updatedForms[formIndex].steps[stepIndex], 
      [field]: field === 'showListButton' || field === 'isLocked' || 
                field === 'premiumOnly' || field === 'isCapSpecific' || 
                field === 'isVerdict' || field === 'isCapQuery' ? value === true : value 
    };
    setForms(updatedForms);
  };

  const handleSave = async (formIndex) => {
    try {
      const updatedFormData = forms[formIndex];
      await axiosInstance.post("/api/admin/edit-formsteps", updatedFormData);
      setEditIndex(null);
      alert("Step updated successfully");
    } catch (error) {
      console.error("Error updating form steps", error);
    }
  };

  const toggleFormExpand = (index) => {
    setExpandedForm(expandedForm === index ? null : index);
  };

  const addNewStep = (formIndex) => {
    const updatedForms = [...forms];
    const newStepNumber = updatedForms[formIndex].steps.length > 0 
      ? Math.max(...updatedForms[formIndex].steps.map(step => step.number)) + 1
      : 1;
    
    updatedForms[formIndex].steps.push({
      number: newStepNumber,
      title: `New Step ${newStepNumber}`,
      description: '',
      showListButton: false,
      isLocked: false,
      premiumOnly: false,
      isCapSpecific: false,
      cap: 1,
      isVerdict: false,
      isCapQuery: false
    });
    
    setForms(updatedForms);
    // Set this new step to edit mode
    setActiveFormIndex(formIndex);
    setEditIndex(updatedForms[formIndex].steps.length - 1);
  };

  const deleteStep = async (formIndex, stepIndex) => {
    if (window.confirm("Are you sure you want to delete this step?")) {
      const updatedForms = [...forms];
      updatedForms[formIndex].steps.splice(stepIndex, 1);
      setForms(updatedForms);
      
      try {
        await axiosInstance.post("/api/admin/edit-formsteps", updatedForms[formIndex]);
        alert("Step deleted successfully");
      } catch (error) {
        console.error("Error deleting step", error);
      }
    }
  };

  if (loading) return (
    <div className="flex justify-center items-center h-64">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
    </div>
  );

  if (forms.length === 0) return (
    <div className="p-5 text-center">
      <p className="text-gray-600">No forms found.</p>
    </div>
  );

  return (
    <div className="p-5 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6 text-center text-blue-700">Form Steps Management</h1>
      
      {forms.map((form, formIndex) => (
        <div key={formIndex} className="mb-6 border rounded-lg shadow-md overflow-hidden bg-white">
          {/* Form Header */}
          <div 
            className="flex justify-between items-center p-4 bg-gradient-to-r from-blue-50 to-indigo-50 cursor-pointer"
            onClick={() => toggleFormExpand(formIndex)}
          >
            <div className="flex items-center gap-3">
              <span className="bg-blue-600 text-white px-3 py-1 rounded-full text-sm font-medium">Form {formIndex + 1}</span>
              <h2 className="text-xl font-semibold">{form.id}</h2>
            </div>
            <div className="flex items-center">
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                width="24" 
                height="24" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round"
                className={`transition-transform ${expandedForm === formIndex ? 'rotate-180' : ''}`}
              >
                <path d="m6 9 6 6 6-6"/>
              </svg>
            </div>
          </div>

          {/* Form Content - Steps */}
          {expandedForm === formIndex && (
            <div className="p-4">
              {form.steps.length > 0 ? (
                <div className="space-y-3">
                  {form.steps.map((step, stepIndex) => (
                    <div 
                      key={stepIndex} 
                      className={`border rounded p-4 transition-all ${
                        editIndex === stepIndex && activeFormIndex === formIndex 
                          ? 'bg-blue-50 shadow-md' 
                          : 'bg-white hover:shadow-sm'
                      }`}
                    >
                      <div className="flex flex-col gap-4">
                        {/* Step Header with Number */}
                        <div className="flex items-center gap-3">
                          <div className="bg-gray-100 px-3 py-1.5 rounded-lg text-center font-medium w-24">
                            Step {step.number}
                          </div>
                          
                          {/* Action Buttons */}
                          <div className="flex gap-2 ml-auto">
                            {editIndex === stepIndex && activeFormIndex === formIndex ? (
                              <button
                                onClick={() => handleSave(formIndex)}
                                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-medium transition-colors"
                              >
                                Save
                              </button>
                            ) : (
                              <>
                                <button
                                  onClick={() => handleEditClick(formIndex, stepIndex)}
                                  className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-md font-medium transition-colors"
                                >
                                  Edit
                                </button>
                                <button
                                  onClick={() => deleteStep(formIndex, stepIndex)}
                                  className="bg-red-500 hover:bg-red-600 text-white px-3 py-2 rounded-md font-medium transition-colors"
                                >
                                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M3 6h18"></path>
                                    <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
                                    <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
                                  </svg>
                                </button>
                              </>
                            )}
                          </div>
                        </div>

                        {/* Step Content */}
                        <div className="space-y-4">
                          {editIndex === stepIndex && activeFormIndex === formIndex ? (
                            <>
                              {/* Title Input */}
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                                <input
                                  type="text"
                                  value={step.title}
                                  onChange={(e) => handleChange(formIndex, stepIndex, "title", e.target.value)}
                                  className="border p-2 w-full rounded bg-white"
                                  placeholder="Enter step title"
                                />
                              </div>

                              {/* Description Input */}
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                                <textarea
                                  value={step.description || ''}
                                  onChange={(e) => handleChange(formIndex, stepIndex, "description", e.target.value)}
                                  className="border p-2 w-full rounded bg-white h-24 resize-none"
                                  placeholder="Enter step description"
                                />
                              </div>

                              {/* Modified UI to clarify the relationship between verdict, cap query, and cap specific */}
                              <div className="flex flex-wrap gap-6 mb-4">
                                {/* Basic step options */}
                                <div className="flex flex-col gap-2">
                                  <p className="text-sm font-medium text-gray-700">Basic Options:</p>
                                  <label className="flex items-center gap-2">
                                    <input
                                      type="checkbox"
                                      checked={step.showListButton || false}
                                      onChange={(e) => handleChange(formIndex, stepIndex, "showListButton", e.target.checked)}
                                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                    />
                                    <span className="text-sm text-gray-700">Show List Button</span>
                                  </label>
                                  
                                  <label className="flex items-center gap-2">
                                    <input
                                      type="checkbox"
                                      checked={step.isLocked || false}
                                      onChange={(e) => handleChange(formIndex, stepIndex, "isLocked", e.target.checked)}
                                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                    />
                                    <span className="text-sm text-gray-700">Lock Step</span>
                                  </label>
                                  
                                  <label className="flex items-center gap-2">
                                    <input
                                      type="checkbox"
                                      checked={step.premiumOnly || false}
                                      onChange={(e) => handleChange(formIndex, stepIndex, "premiumOnly", e.target.checked)}
                                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                    />
                                    <span className="text-sm text-gray-700">Premium Only</span>
                                  </label>
                                </div>

                                {/* CAP-related options grouped together */}
                                <div className="flex flex-col gap-2 border-l-2 border-gray-200 pl-4">
                                  <p className="text-sm font-medium text-gray-700 mb-1">CAP Step Type:</p>
                                  <div className="space-y-2">
                                    <label className="flex items-center gap-2">
                                      <input
                                        type="checkbox"
                                        checked={step.isVerdict || false}
                                        onChange={(e) => handleChange(formIndex, stepIndex, "isVerdict", e.target.checked)}
                                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                      />
                                      <span className="text-sm text-gray-700">Verdict</span>
                                    </label>
                                    
                                    <label className="flex items-center gap-2">
                                      <input
                                        type="checkbox"
                                        checked={step.isCapQuery || false}
                                        onChange={(e) => handleChange(formIndex, stepIndex, "isCapQuery", e.target.checked)}
                                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                      />
                                      <span className="text-sm text-gray-700">CAP Query</span>
                                    </label>
                                    
                                    <label className="flex items-center gap-2">
                                      <input
                                        type="checkbox"
                                        checked={step.isCapSpecific || false}
                                        onChange={(e) => handleChange(formIndex, stepIndex, "isCapSpecific", e.target.checked)}
                                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                        disabled={step.isVerdict || step.isCapQuery}
                                      />
                                      <span className={`text-sm ${(step.isVerdict || step.isCapQuery) ? 'text-gray-500' : 'text-gray-700'}`}>
                                        CAP Specific
                                        {(step.isVerdict || step.isCapQuery) && 
                                          <span className="text-xs text-gray-500 ml-1">(Auto-enabled for Verdict/Query)</span>
                                        }
                                      </span>
                                    </label>
                                  </div>

                                  {/* CAP Round Dropdown - shown if isCapSpecific, isVerdict, or isCapQuery is true */}
                                  {(step.isCapSpecific || step.isVerdict || step.isCapQuery) && (
                                    <div className="mt-2">
                                      <label className="block text-sm font-medium text-gray-700 mb-1">
                                        CAP Round
                                      </label>
                                      <select
                                        value={step.cap || 1}
                                        onChange={(e) => handleChange(formIndex, stepIndex, "cap", parseInt(e.target.value))}
                                        className="border p-2 rounded bg-white w-32"
                                      >
                                        <option value={1}>Round 1</option>
                                        <option value={2}>Round 2</option>
                                        <option value={3}>Round 3</option>
                                      </select>
                                    </div>
                                  )}
                                </div>
                              </div>

                              {/* Remove the old duplicate CAP Round dropdown */}
                              {/* Rest of existing code... */}
                            </>
                          ) : (
                            <>
                              <h3 className="font-medium">{step.title}</h3>
                              {step.description && (
                                <p className="text-gray-600 text-sm">{step.description}</p>
                              )}
                              <div className="flex gap-4 text-sm">
                                {step.showListButton && (
                                  <span className="text-blue-600 flex items-center gap-1">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                      <line x1="8" y1="6" x2="21" y2="6"></line>
                                      <line x1="8" y1="12" x2="21" y2="12"></line>
                                      <line x1="8" y1="18" x2="21" y2="18"></line>
                                      <line x1="3" y1="6" x2="3.01" y2="6"></line>
                                      <line x1="3" y1="12" x2="3.01" y2="12"></line>
                                      <line x1="3" y1="18" x2="3.01" y2="18"></line>
                                    </svg>
                                    Has List
                                  </span>
                                )}
                                {step.isLocked && (
                                  <span className="text-yellow-600 flex items-center gap-1">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                      <rect x="3" y="11" width="18" height="11" rx="2"></rect>
                                      <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                                    </svg>
                                    Locked
                                  </span>
                                )}
                                {/* Display tags for new properties */}
                                {step.premiumOnly && (
                                  <span className="text-purple-600 flex items-center gap-1">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                                    </svg>
                                    Premium
                                  </span>
                                )}
                                {step.isCapSpecific && (
                                  <span className="text-green-600 flex items-center gap-1">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                      <path d="M12 8V4H8"></path>
                                      <rect width="16" height="12" x="4" y="8" rx="2"></rect>
                                    </svg>
                                    CAP {step.cap || 1}
                                  </span>
                                )}
                                {step.isVerdict && (
                                  <span className="text-red-600 flex items-center gap-1">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                      <circle cx="12" cy="12" r="10"></circle>
                                      <path d="m9 12 2 2 4-4"></path>
                                    </svg>
                                    Verdict
                                  </span>
                                )}
                                {step.isCapQuery && (
                                  <span className="text-amber-600 flex items-center gap-1">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                      <path d="M8.5 14.5A2.5 2.5 0 0011 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.5 3 3 3 5.5a7 7 0 11-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 002.5 2.5z"></path>
                                    </svg>
                                    CAP Query
                                  </span>
                                )}
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 italic text-center py-6">No steps defined for this form.</p>
              )}
              
              {/* Add New Step Button */}
              <div className="mt-5 flex justify-center">
                <button
                  onClick={() => addNewStep(formIndex)}
                  className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 rounded-md transition-colors shadow-sm"
                >
                  <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    width="20" 
                    height="20" 
                    viewBox="0 0 24 24" 
                    fill="none" 
                    stroke="currentColor" 
                    strokeWidth="2" 
                    strokeLinecap="round" 
                    strokeLinejoin="round"
                  >
                    <path d="M12 5v14M5 12h14"></path>
                  </svg>
                  Add New Step
                </button>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default FormStepsManagement;