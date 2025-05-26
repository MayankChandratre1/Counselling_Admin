import React, { useEffect, useState } from "react";
import axiosInstance from "../utils/axios";
import { X, Plus, Check, AlertCircle, Trash, ArrowUp, ArrowDown, ChevronRight } from "lucide-react";
import { toast } from "react-toastify";

const FormStepsManagement = () => {
  const [forms, setForms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFormIndex, setActiveFormIndex] = useState(0);
  const [editIndex, setEditIndex] = useState(null); // Track which step is being edited
  const [expandedForm, setExpandedForm] = useState(null);
  const [isNewFormModalOpen, setIsNewFormModalOpen] = useState(false);
  const [newFormData, setNewFormData] = useState({ id: "" });
  const [isDeleting, setIsDeleting] = useState(false);
  const [deletingFormId, setDeletingFormId] = useState(null);
  const [actionLoading, setActionLoading] = useState({
    formId: null,
    action: null, // "save", "delete", "create"
  });

  // New state for the insert step modal
  const [showInsertModal, setShowInsertModal] = useState(false);
  const [insertPosition, setInsertPosition] = useState(null); 
  const [insertType, setInsertType] = useState(null); // 'before', 'after'

  useEffect(() => {
    fetchFormSteps();
  }, []);

  const fetchFormSteps = async () => {
    try {
      setLoading(true);
      const res = await axiosInstance.get("/api/admin/formsteps");
      if (res.data.length > 0) {
        setForms(res.data);
        setExpandedForm(-1); // Expand the first form by default
      }
      toast.success("Forms loaded successfully");
    } catch (error) {
      console.error("Error fetching form steps", error);
      toast.error("Failed to load forms");
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
    if ((field === "isVerdict" || field === "isCapQuery") && value === true) {
      // Make the fields mutually exclusive
      if (field === "isVerdict") {
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
    if ((field === "isVerdict" || field === "isCapQuery") && value === false) {
      const step = updatedForms[formIndex].steps[stepIndex];
      if (!step.isVerdict && !step.isCapQuery) {
        // Optional: Uncomment this to automatically turn off isCapSpecific when neither verdict nor cap query
        // step.isCapSpecific = false;
      }
    }

    updatedForms[formIndex].steps[stepIndex] = {
      ...updatedForms[formIndex].steps[stepIndex],
      [field]:
        field === "showListButton" ||
        field === "isLocked" ||
        field === "premiumOnly" ||
        field === "isCapSpecific" ||
        field === "isVerdict" ||
        field === "isCapQuery"
          ? value === true
          : value,
    };
    setForms(updatedForms);
  };

  const handleSave = async (formIndex) => {
    try {
      const updatedFormData = forms[formIndex];
      setActionLoading({ formId: updatedFormData.id, action: "save" });

      await axiosInstance.post("/api/admin/edit-formsteps", updatedFormData);
      setEditIndex(null);
      toast.success("Form updated successfully");
    } catch (error) {
      console.error("Error updating form steps", error);
      toast.error("Failed to update form");
    } finally {
      setActionLoading({ formId: null, action: null });
    }
  };

  const handleCreateForm = async () => {
    if (!newFormData.id.trim()) {
      toast.error("Form ID is required");
      return;
    }

    try {
      setActionLoading({ formId: newFormData.id, action: "create" });

      // Create a new form structure
      const newForm = {
        id: newFormData.id,
        steps: [],
      };

      // Use the same endpoint to save the new form
      await axiosInstance.post("/api/admin/edit-formsteps", newForm);

      // Update the local state with the new form
      setForms([...forms, newForm]);
      setIsNewFormModalOpen(false);
      setNewFormData({ id: "" });
      toast.success("New form created successfully");

      // Expand the newly created form
      setExpandedForm(forms.length); // Index of the new form
    } catch (error) {
      console.error("Error creating new form", error);
      toast.error("Failed to create new form");
    } finally {
      setActionLoading({ formId: null, action: null });
    }
  };

  const confirmDeleteForm = (formId, index) => {
    setDeletingFormId(formId);
    setIsDeleting(true);
  };

  const handleDeleteForm = async () => {
    if (!deletingFormId) return;

    try {
      setActionLoading({ formId: deletingFormId, action: "delete" });

      await axiosInstance.delete(`/api/admin/delete-form/${deletingFormId}`);

      // Update the local state to remove the deleted form
      setForms(forms.filter((form) => form.id !== deletingFormId));
      toast.success("Form deleted successfully");
    } catch (error) {
      console.error("Error deleting form", error);
      toast.error("Failed to delete form");
    } finally {
      setIsDeleting(false);
      setDeletingFormId(null);
      setActionLoading({ formId: null, action: null });
    }
  };

  const toggleFormExpand = (index) => {
    setExpandedForm(expandedForm === index ? null : index);
  };

  // Move step up in the current form
  const moveStepUp = (formIndex, stepIndex) => {
    if (stepIndex === 0) return; // Can't move up if it's the first step
    
    const updatedForms = [...forms];
    const steps = [...updatedForms[formIndex].steps];
    
    // Swap step positions
    [steps[stepIndex], steps[stepIndex - 1]] = [steps[stepIndex - 1], steps[stepIndex]];
    
    // Update step numbers
    steps.forEach((step, idx) => {
      step.number = idx + 1;
    });
    
    updatedForms[formIndex].steps = steps;
    setForms(updatedForms);
    
    // Save the reordered steps
    handleSave(formIndex);
  };
  
  // Move step down in the current form
  const moveStepDown = (formIndex, stepIndex) => {
    const steps = forms[formIndex].steps;
    if (stepIndex === steps.length - 1) return; // Can't move down if it's the last step
    
    const updatedForms = [...forms];
    const updatedSteps = [...updatedForms[formIndex].steps];
    
    // Swap step positions
    [updatedSteps[stepIndex], updatedSteps[stepIndex + 1]] = 
      [updatedSteps[stepIndex + 1], updatedSteps[stepIndex]];
    
    // Update step numbers
    updatedSteps.forEach((step, idx) => {
      step.number = idx + 1;
    });
    
    updatedForms[formIndex].steps = updatedSteps;
    setForms(updatedForms);
    
    // Save the reordered steps
    handleSave(formIndex);
  };

  // Modified to handle position-specific insertions
  const addNewStep = (formIndex, position = null, insertType = null) => {
    const updatedForms = [...forms];
    let insertIndex;
    let steps = [...updatedForms[formIndex].steps];
    
    if (position === null) {
      // Default behavior - add to the end
      insertIndex = steps.length;
    } else if (insertType === 'before') {
      // Insert before specified position
      insertIndex = position;
    } else if (insertType === 'after') {
      // Insert after specified position
      insertIndex = position + 1;
    }
    
    // Create the new step
    const newStep = {
      number: insertIndex + 1, // Starting from 1
      title: `New Step`,
      description: '',
      showListButton: false,
      isLocked: false,
      premiumOnly: false,
      isCapSpecific: false,
      cap: 1,
      isVerdict: false,
      isCapQuery: false
    };
    
    // Insert the step at the correct position
    steps.splice(insertIndex, 0, newStep);
    
    // Update step numbers for all steps
    steps.forEach((step, idx) => {
      step.number = idx + 1;
    });
    
    updatedForms[formIndex].steps = steps;
    setForms(updatedForms);
    
    // Set this new step to edit mode
    setActiveFormIndex(formIndex);
    setEditIndex(insertIndex);
    
    // Close modal if open
    setShowInsertModal(false);
  };
  
  // Function to prepare for inserting a step
  const prepareInsertStep = (formIndex, stepIndex, type) => {
    setInsertPosition(stepIndex);
    setInsertType(type);
    setActiveFormIndex(formIndex);
    setShowInsertModal(true);
  };

  if (loading)
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );

  return (
    <div className="p-5 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6 text-center text-blue-700">
        Form Steps Management
      </h1>

      {/* Create Form Button */}
      <div className="mb-8 flex justify-center">
        <button
          onClick={() => setIsNewFormModalOpen(true)}
          className="flex items-center bg-blue-600 text-white px-6 py-3 rounded-lg shadow hover:bg-blue-700 transition-all"
        >
          <Plus className="mr-2" size={20} />
          <span>Create New Form</span>
        </button>
      </div>

      {forms.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <p className="text-gray-600 mb-4">No forms found.</p>
          <p className="text-gray-500">
            Click the button above to create your first form.
          </p>
        </div>
      ) : (
        forms.map((form, formIndex) => (
          <div
            key={formIndex}
            className="mb-6 border rounded-lg shadow-md overflow-hidden bg-white"
          >
            {/* Form Header */}
            <div className="flex justify-between items-center p-4 bg-gradient-to-r from-blue-50 to-indigo-50">
              <div
                className="flex items-center gap-3 flex-1 cursor-pointer"
                onClick={() => toggleFormExpand(formIndex)}
              >
                <span className="bg-blue-600 text-white px-3 py-1 rounded-full text-sm font-medium">
                  Form {formIndex + 1}
                </span>
                <h2 className="text-xl font-semibold">{form.id}</h2>
              </div>
              <div className="flex items-center gap-2">
                {/* Delete Form Button */}
                <button
                  onClick={() => confirmDeleteForm(form.id, formIndex)}
                  disabled={actionLoading.formId === form.id}
                  className={`p-2 text-red-600 hover:bg-red-50 rounded-md ${
                    actionLoading.formId === form.id && actionLoading.action === "delete"
                      ? "opacity-50 cursor-not-allowed"
                      : ""
                  }`}
                  title="Delete Form"
                >
                  {actionLoading.formId === form.id && actionLoading.action === "delete" ? (
                    <div className="w-5 h-5 border-t-2 border-red-500 border-r-2 rounded-full animate-spin"></div>
                  ) : (
                    <Trash size={20} />
                  )}
                </button>

                {/* Toggle Expand Button */}
                <button
                  onClick={() => toggleFormExpand(formIndex)}
                  className="p-2 text-gray-500 hover:bg-gray-100 rounded-md"
                >
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
                    className={`transition-transform ${
                      expandedForm === formIndex ? "rotate-180" : ""
                    }`}
                  >
                    <path d="m6 9 6 6 6-6" />
                  </svg>
                </button>
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
                            ? "bg-blue-50 shadow-md"
                            : "bg-white hover:shadow-sm"
                        }`}
                      >
                        <div className="flex flex-col gap-4">
                          {/* Step Header with Number and Navigation */}
                          <div className="flex items-center gap-3">
                            <div className="bg-gray-100 px-3 py-1.5 rounded-lg text-center font-medium w-24">
                              Step {step.number}
                            </div>
                            
                            {/* Step Reordering Controls */}
                            <div className="flex items-center space-x-1">
                              <button
                                onClick={() => moveStepUp(formIndex, stepIndex)}
                                disabled={stepIndex === 0}
                                className={`p-1.5 rounded-full ${
                                  stepIndex === 0 
                                    ? 'text-gray-300 cursor-not-allowed' 
                                    : 'text-gray-500 hover:bg-gray-100'
                                }`}
                                title="Move step up"
                              >
                                <ArrowUp size={16} />
                              </button>
                              <button
                                onClick={() => moveStepDown(formIndex, stepIndex)}
                                disabled={stepIndex === form.steps.length - 1}
                                className={`p-1.5 rounded-full ${
                                  stepIndex === form.steps.length - 1 
                                    ? 'text-gray-300 cursor-not-allowed' 
                                    : 'text-gray-500 hover:bg-gray-100'
                                }`}
                                title="Move step down"
                              >
                                <ArrowDown size={16} />
                              </button>
                            </div>

                            {/* Insert Step Buttons */}
                            <div className="ml-auto flex space-x-2 mr-2">
                              <button
                                onClick={() => prepareInsertStep(formIndex, stepIndex, 'before')}
                                className="px-2 py-1 text-xs text-indigo-600 hover:text-indigo-800 hover:underline flex items-center"
                                title="Insert step before"
                              >
                                <Plus size={12} className="mr-1" />
                                Before
                              </button>
                              <button
                                onClick={() => prepareInsertStep(formIndex, stepIndex, 'after')}
                                className="px-2 py-1 text-xs text-indigo-600 hover:text-indigo-800 hover:underline flex items-center"
                                title="Insert step after"
                              >
                                <Plus size={12} className="mr-1" />
                                After
                              </button>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex gap-2">
                              {editIndex === stepIndex && activeFormIndex === formIndex ? (
                                <button
                                  onClick={() => handleSave(formIndex)}
                                  disabled={actionLoading.formId === form.id && actionLoading.action === "save"}
                                  className={`bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-medium transition-colors flex items-center ${
                                    actionLoading.formId === form.id && actionLoading.action === "save"
                                      ? "opacity-70 cursor-not-allowed"
                                      : ""
                                  }`}
                                >
                                  {actionLoading.formId === form.id && actionLoading.action === "save" ? (
                                    <>
                                      <div className="w-4 h-4 border-t-2 border-white border-r-2 rounded-full animate-spin mr-2"></div>
                                      Saving...
                                    </>
                                  ) : (
                                    <>Save</>
                                  )}
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
                                    <svg
                                      xmlns="http://www.w3.org/2000/svg"
                                      width="16"
                                      height="16"
                                      viewBox="0 0 24 24"
                                      fill="none"
                                      stroke="currentColor"
                                      strokeWidth="2"
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                    >
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
                                  <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Title
                                  </label>
                                  <input
                                    type="text"
                                    value={step.title}
                                    onChange={(e) =>
                                      handleChange(formIndex, stepIndex, "title", e.target.value)
                                    }
                                    className="border p-2 w-full rounded bg-white"
                                    placeholder="Enter step title"
                                  />
                                </div>

                                {/* Description Input */}
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Description
                                  </label>
                                  <textarea
                                    value={step.description || ""}
                                    onChange={(e) =>
                                      handleChange(formIndex, stepIndex, "description", e.target.value)
                                    }
                                    className="border p-2 w-full rounded bg-white h-24 resize-none"
                                    placeholder="Enter step description"
                                  />
                                </div>

                                {/* Modified UI to clarify the relationship between verdict, cap query, and cap specific */}
                                <div className="flex flex-wrap gap-6 mb-4">
                                  {/* Basic step options */}
                                  <div className="flex flex-col gap-2">
                                    <p className="text-sm font-medium text-gray-700">
                                      Basic Options:
                                    </p>
                                    <label className="flex items-center gap-2">
                                      <input
                                        type="checkbox"
                                        checked={step.showListButton || false}
                                        onChange={(e) =>
                                          handleChange(formIndex, stepIndex, "showListButton", e.target.checked)
                                        }
                                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                      />
                                      <span className="text-sm text-gray-700">
                                        Show List Button
                                      </span>
                                    </label>

                                    <label className="flex items-center gap-2">
                                      <input
                                        type="checkbox"
                                        checked={step.isLocked || false}
                                        onChange={(e) =>
                                          handleChange(formIndex, stepIndex, "isLocked", e.target.checked)
                                        }
                                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                      />
                                      <span className="text-sm text-gray-700">Lock Step</span>
                                    </label>

                                    <label className="flex items-center gap-2">
                                      <input
                                        type="checkbox"
                                        checked={step.premiumOnly || false}
                                        onChange={(e) =>
                                          handleChange(formIndex, stepIndex, "premiumOnly", e.target.checked)
                                        }
                                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                      />
                                      <span className="text-sm text-gray-700">Premium Only</span>
                                    </label>
                                  </div>

                                  {/* CAP-related options grouped together */}
                                  <div className="flex flex-col gap-2 border-l-2 border-gray-200 pl-4">
                                    <p className="text-sm font-medium text-gray-700 mb-1">
                                      CAP Step Type:
                                    </p>
                                    <div className="space-y-2">
                                      <label className="flex items-center gap-2">
                                        <input
                                          type="checkbox"
                                          checked={step.isVerdict || false}
                                          onChange={(e) =>
                                            handleChange(formIndex, stepIndex, "isVerdict", e.target.checked)
                                          }
                                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                        />
                                        <span className="text-sm text-gray-700">Verdict</span>
                                      </label>

                                      <label className="flex items-center gap-2">
                                        <input
                                          type="checkbox"
                                          checked={step.isCapQuery || false}
                                          onChange={(e) =>
                                            handleChange(formIndex, stepIndex, "isCapQuery", e.target.checked)
                                          }
                                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                        />
                                        <span className="text-sm text-gray-700">CAP Query</span>
                                      </label>

                                      <label className="flex items-center gap-2">
                                        <input
                                          type="checkbox"
                                          checked={step.isCapSpecific || false}
                                          onChange={(e) =>
                                            handleChange(formIndex, stepIndex, "isCapSpecific", e.target.checked)
                                          }
                                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                          disabled={step.isVerdict || step.isCapQuery}
                                        />
                                        <span
                                          className={`text-sm ${
                                            step.isVerdict || step.isCapQuery
                                              ? "text-gray-500"
                                              : "text-gray-700"
                                          }`}
                                        >
                                          CAP Specific
                                          {(step.isVerdict || step.isCapQuery) && (
                                            <span className="text-xs text-gray-500 ml-1">
                                              (Auto-enabled for Verdict/Query)
                                            </span>
                                          )}
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
                                          onChange={(e) =>
                                            handleChange(formIndex, stepIndex, "cap", parseInt(e.target.value))
                                          }
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
                                      <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        width="16"
                                        height="16"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                      >
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
                                      <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        width="16"
                                        height="16"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                      >
                                        <rect x="3" y="11" width="18" height="11" rx="2"></rect>
                                        <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                                      </svg>
                                      Locked
                                    </span>
                                  )}
                                  {/* Display tags for new properties */}
                                  {step.premiumOnly && (
                                    <span className="text-purple-600 flex items-center gap-1">
                                      <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        width="16"
                                        height="16"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                      >
                                        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                                      </svg>
                                      Premium
                                    </span>
                                  )}
                                  {step.isCapSpecific && (
                                    <span className="text-green-600 flex items-center gap-1">
                                      <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        width="16"
                                        height="16"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                      >
                                        <path d="M12 8V4H8"></path>
                                        <rect width="16" height="12" x="4" y="8" rx="2"></rect>
                                      </svg>
                                      CAP {step.cap || 1}
                                    </span>
                                  )}
                                  {step.isVerdict && (
                                    <span className="text-red-600 flex items-center gap-1">
                                      <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        width="16"
                                        height="16"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                      >
                                        <circle cx="12" cy="12" r="10"></circle>
                                        <path d="m9 12 2 2 4-4"></path>
                                      </svg>
                                      Verdict
                                    </span>
                                  )}
                                  {step.isCapQuery && (
                                    <span className="text-amber-600 flex items-center gap-1">
                                      <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        width="16"
                                        height="16"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                      >
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
                  <p className="text-gray-500 italic text-center py-6">
                    No steps defined for this form.
                  </p>
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
        ))
      )}

      {/* New Form Modal */}
      {isNewFormModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-xl font-bold mb-4">Create New Form</h3>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Form ID
              </label>
              <input
                type="text"
                value={newFormData.id}
                onChange={(e) =>
                  setNewFormData({ ...newFormData, id: e.target.value })
                }
                placeholder="Enter a unique form identifier"
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setIsNewFormModalOpen(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateForm}
                disabled={actionLoading.action === "create"}
                className={`px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center 
                  ${actionLoading.action === "create" ? "opacity-70 cursor-not-allowed" : ""}`}
              >
                {actionLoading.action === "create" ? (
                  <>
                    <div className="w-4 h-4 border-t-2 border-white border-r-2 rounded-full animate-spin mr-2"></div>
                    Creating...
                  </>
                ) : (
                  <>Create Form</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Form Confirmation Modal */}
      {isDeleting && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-xl font-bold mb-2">Delete Form</h3>
            <p className="mb-6 text-gray-600">
              Are you sure you want to delete this form? This action cannot be
              undone.
            </p>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setIsDeleting(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteForm}
                disabled={actionLoading.action === "delete"}
                className={`px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 flex items-center
                  ${actionLoading.action === "delete" ? "opacity-70 cursor-not-allowed" : ""}`}
              >
                {actionLoading.action === "delete" ? (
                  <>
                    <div className="w-4 h-4 border-t-2 border-white border-r-2 rounded-full animate-spin mr-2"></div>
                    Deleting...
                  </>
                ) : (
                  <>Delete</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Insert New Step Modal */}
      {showInsertModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-xl font-bold mb-4">
              {insertType === 'before' ? 'Insert Step Before' : 'Insert Step After'} 
              Step {forms[activeFormIndex]?.steps[insertPosition]?.number}
            </h3>

            <p className="text-gray-600 mb-4">
              Are you sure you want to insert a new step 
              {insertType === 'before' ? ' before ' : ' after '}
              step {forms[activeFormIndex]?.steps[insertPosition]?.number}?
            </p>
            
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowInsertModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => addNewStep(activeFormIndex, insertPosition, insertType)}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center"
              >
                <Plus size={16} className="mr-2" />
                Insert Step
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FormStepsManagement;