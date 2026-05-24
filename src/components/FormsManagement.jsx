import React, { useEffect, useState } from "react";
import axiosInstance from "../utils/axios";
import {
  Plus,
  Trash,
  ArrowUp,
  ArrowDown,
  List,
  Lock,
  Star,
  Target,
  HelpCircle,
  CheckCircle2,
  FileText,
  ChevronDown,
} from "lucide-react";
import { toast } from "react-toastify";

const StepBadges = ({ step }) => (
  <div className="flex flex-wrap gap-2">
    {step.showListButton && (
      <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-700">
        <List size={12} /> List button
      </span>
    )}
    {step.isLocked && (
      <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-medium text-amber-700">
        <Lock size={12} /> Locked
      </span>
    )}
    {step.premiumOnly && (
      <span className="inline-flex items-center gap-1 rounded-full bg-purple-50 px-2.5 py-0.5 text-xs font-medium text-purple-700">
        <Star size={12} /> Premium
      </span>
    )}
    {(step.isCapSpecific || step.isVerdict || step.isCapQuery) && (
      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700">
        <Target size={12} /> CAP {step.cap || 1}
      </span>
    )}
    {step.isVerdict && (
      <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2.5 py-0.5 text-xs font-medium text-red-700">
        <CheckCircle2 size={12} /> Verdict
      </span>
    )}
    {step.isCapQuery && (
      <span className="inline-flex items-center gap-1 rounded-full bg-orange-50 px-2.5 py-0.5 text-xs font-medium text-orange-700">
        <HelpCircle size={12} /> CAP query
      </span>
    )}
  </div>
);

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
        setExpandedForm(0);
      } else {
        setForms([]);
        setExpandedForm(null);
      }
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

  const confirmDeleteForm = (formId) => {
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

  const deleteStep = (formIndex, stepIndex) => {
    const updatedForms = [...forms];
    const steps = updatedForms[formIndex].steps;

    // Remove the step from the array
    steps.splice(stepIndex, 1);

    // Update step numbers
    steps.forEach((step, idx) => {
      step.number = idx + 1;
    });

    updatedForms[formIndex].steps = steps;
    setForms(updatedForms);

    // Reset edit index if it was the deleted step
    if (editIndex === stepIndex && activeFormIndex === formIndex) {
      setEditIndex(null);
      setActiveFormIndex(null);
    }

    handleSave(formIndex);
  }
  
  // Function to prepare for inserting a step
  const prepareInsertStep = (formIndex, stepIndex, type) => {
    setInsertPosition(stepIndex);
    setInsertType(type);
    setActiveFormIndex(formIndex);
    setShowInsertModal(true);
  };

  if (loading) {
    return (
      <div className="flex min-h-[320px] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
      </div>
    );
  }

  const totalSteps = forms.reduce((sum, form) => sum + (form.steps?.length || 0), 0);

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 md:px-6">
      <div className="mb-8 flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:flex-row md:items-center md:justify-between">
        <div>
          <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-sm font-medium text-blue-700">
            <FileText size={16} />
            Counselling forms
          </div>
          <h1 className="text-2xl font-bold text-slate-900 md:text-3xl">Form steps</h1>
          <p className="mt-1 text-sm text-slate-600">
            Manage counselling progress steps, CAP rounds, and premium-only gates.
          </p>
          <div className="mt-3 flex flex-wrap gap-3 text-sm text-slate-500">
            <span className="rounded-lg bg-slate-100 px-3 py-1">{forms.length} forms</span>
            <span className="rounded-lg bg-slate-100 px-3 py-1">{totalSteps} total steps</span>
          </div>
        </div>
        <button
          onClick={() => setIsNewFormModalOpen(true)}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
        >
          <Plus size={18} />
          Create form
        </button>
      </div>

      {forms.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center">
          <FileText className="mx-auto mb-4 text-slate-300" size={48} />
          <p className="text-lg font-medium text-slate-700">No forms yet</p>
          <p className="mt-2 text-sm text-slate-500">
            Create your first counselling form to start adding steps.
          </p>
          <button
            onClick={() => setIsNewFormModalOpen(true)}
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
          >
            <Plus size={16} />
            Create form
          </button>
        </div>
      ) : (
        forms.map((form, formIndex) => (
          <div
            key={form.id}
            className="mb-5 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
          >
            <div className="flex items-center justify-between gap-3 border-b border-slate-100 bg-slate-50 px-4 py-4 md:px-5">
              <button
                type="button"
                className="flex min-w-0 flex-1 items-center gap-3 text-left"
                onClick={() => toggleFormExpand(formIndex)}
              >
                <span className="rounded-lg bg-blue-600 px-2.5 py-1 text-xs font-semibold text-white">
                  #{formIndex + 1}
                </span>
                <div className="min-w-0">
                  <h2 className="truncate text-lg font-semibold text-slate-900">{form.id}</h2>
                  <p className="text-sm text-slate-500">
                    {form.steps?.length || 0} step{(form.steps?.length || 0) === 1 ? "" : "s"}
                  </p>
                </div>
                <ChevronDown
                  size={20}
                  className={`ml-auto shrink-0 text-slate-400 transition-transform ${
                    expandedForm === formIndex ? "rotate-180" : ""
                  }`}
                />
              </button>
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

              </div>
            </div>

            {expandedForm === formIndex && (
              <div className="space-y-4 p-4 md:p-5">
                {form.steps.length > 0 ? (
                  <div className="space-y-3">
                    {form.steps.map((step, stepIndex) => (
                      <div
                        key={`${form.id}-step-${step.number}-${stepIndex}`}
                        className={`rounded-xl border p-4 transition-all ${
                          editIndex === stepIndex && activeFormIndex === formIndex
                            ? "border-blue-200 bg-blue-50/60 shadow-sm"
                            : "border-slate-200 bg-white hover:border-slate-300"
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
                                          <option value={4}>Round 4</option>
                                          <option value={5}>Round 5</option>
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
                                <h3 className="text-base font-semibold text-slate-900">{step.title}</h3>
                                {step.description && (
                                  <p className="mt-1 text-sm leading-relaxed text-slate-600">{step.description}</p>
                                )}
                                <div className="mt-3">
                                  <StepBadges step={step} />
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
                <div className="flex justify-center border-t border-slate-100 pt-4">
                  <button
                    onClick={() => addNewStep(formIndex)}
                    className="inline-flex items-center gap-2 rounded-xl border border-dashed border-indigo-300 bg-indigo-50 px-5 py-2.5 text-sm font-semibold text-indigo-700 transition hover:bg-indigo-100"
                  >
                    <Plus size={18} />
                    Add step
                  </button>
                </div>
              </div>
            )}
          </div>
        ))
      )}

      {/* New Form Modal */}
      {isNewFormModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <h3 className="text-xl font-bold text-slate-900">Create new form</h3>
            <p className="mt-1 text-sm text-slate-500">Use a stable ID, for example Saarthi or SaarthiPlus.</p>

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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <h3 className="text-xl font-bold text-slate-900">Delete form</h3>
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
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