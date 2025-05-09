import React, { useState, useEffect } from 'react';
import { Plus, Save, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import axiosInstance from '../../utils/axios';

const FormConfigurationManager = () => {
  const [formConfig, setFormConfig] = useState({
    steps: [
      {
        title: 'Basic Information',
        fields: []
      }
    ]
  });

  const [activeStep, setActiveStep] = useState(0);
  const [collapsedSteps, setCollapsedSteps] = useState({});

  const fieldTypes = [
    { id: 'text', label: 'Text Input' },
    { id: 'number', label: 'Number Input' },
    { id: 'email', label: 'Email Input' },
    { id: 'select', label: 'Dropdown' },
    { id: 'date', label: 'Date Input' },
    { id: 'checkbox', label: 'Checkbox' },
    { id: 'password', label: 'Password Input' }
  ];

  useEffect(() => {
    fetchFormConfig();
  }, []);

  const fetchFormConfig = async () => {
    try {
      const response = await axiosInstance.get('/api/admin/form-config');
      if (response.data) {
        setFormConfig(response.data);
      }
    } catch (err) {
      console.error('Error fetching form configuration:', err);
    }
  };

  const addStep = () => {
    setFormConfig(prev => ({
      ...prev,
      steps: [...prev.steps, { title: `Step ${prev.steps.length + 1}`, fields: [] }]
    }));
  };

  const addField = (stepIndex) => {
    const newField = {
      id: `field_${Date.now()}`,
      type: 'text',
      label: 'New Field',
      key: `field_${Date.now()}`, // Set a default key based on timestamp
      required: false,
      options: [],
      additionalRemarks: '' // Added new field
    };

    setFormConfig(prev => ({
      ...prev,
      steps: prev.steps.map((step, idx) => 
        idx === stepIndex 
          ? { ...step, fields: [...step.fields, newField] }
          : step
      )
    }));
  };

  const updateField = (stepIndex, fieldIndex, updates) => {
    setFormConfig(prev => ({
      ...prev,
      steps: prev.steps.map((step, sIdx) => 
        sIdx === stepIndex 
          ? {
              ...step,
              fields: step.fields.map((field, fIdx) => 
                fIdx === fieldIndex 
                  ? { ...field, ...updates }
                  : field
              )
            }
          : step
      )
    }));
  };

  const removeField = (stepIndex, fieldIndex) => {
    setFormConfig(prev => ({
      ...prev,
      steps: prev.steps.map((step, sIdx) => 
        sIdx === stepIndex 
          ? {
              ...step,
              fields: step.fields.filter((_, fIdx) => fIdx !== fieldIndex)
            }
          : step
      )
    }));
  };

  const handleSave = async () => {
    try {
      await axiosInstance.post('/api/admin/form-config', formConfig);
    console.log(formConfig);
    
      alert('Form configuration saved successfully!');
    } catch (err) {
      console.error('Error saving form configuration:', err);
      alert('Failed to save form configuration');
    }
  };

  const toggleStep = (stepIndex) => {
    setCollapsedSteps(prev => ({
      ...prev,
      [stepIndex]: !prev[stepIndex]
    }));
  };

  const removeStep = (stepIndex) => {
    if (window.confirm('Are you sure you want to delete this step? All fields in this step will be deleted.')) {
      setFormConfig(prev => ({
        ...prev,
        steps: prev.steps.filter((_, idx) => idx !== stepIndex)
      }));
    }
  };

  return (
    <div className="p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Registration Form Configuration</h1>
          <button
            onClick={handleSave}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center"
          >
            <Save size={20} className="mr-2" />
            Save Configuration
          </button>
        </div>

        {/* Steps Configuration */}
        <div className="space-y-6">
          {formConfig.steps.map((step, stepIndex) => (
            <div key={stepIndex} className="bg-white rounded-lg shadow">
              {/* Step Header */}
              <div 
                className="p-6 border-b border-gray-200 cursor-pointer hover:bg-gray-50"
                onClick={() => toggleStep(stepIndex)}
              >
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-4 flex-1">
                    <span className="text-3xl font-bold text-blue-600">
                      {stepIndex + 1}
                    </span>
                    <input
                      type="text"
                      value={step.title}
                      onChange={(e) => {
                        const newSteps = [...formConfig.steps];
                        newSteps[stepIndex].title = e.target.value;
                        setFormConfig(prev => ({ ...prev, steps: newSteps }));
                      }}
                      className="text-xl font-semibold bg-transparent border-b border-gray-300 focus:border-blue-500 focus:ring-0 px-3 py-2 flex-1"
                      onClick={e => e.stopPropagation()}
                    />
                  </div>
                  <div className="flex items-center gap-3">
                    {/* Add delete step button */}
                    {formConfig.steps.length > 1 && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          removeStep(stepIndex);
                        }}
                        className="text-red-600 hover:text-red-800 p-2 hover:bg-red-50 rounded-full"
                        title="Delete step"
                      >
                        <Trash2 size={20} />
                      </button>
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        addField(stepIndex);
                      }}
                      className="text-blue-600 hover:text-blue-800 p-2 hover:bg-blue-50 rounded-full"
                      title="Add field"
                    >
                      <Plus size={20} />
                    </button>
                    <ChevronDown 
                      size={24} 
                      className={`text-gray-400 transition-transform duration-200 ${
                        collapsedSteps[stepIndex] ? 'rotate-180' : ''
                      }`}
                    />
                  </div>
                </div>
                {/* Field count badge */}
                <div className="mt-2 ml-14">
                  <span className="bg-blue-100 text-blue-800 text-sm px-2 py-1 rounded-full">
                    {step.fields.length} fields
                  </span>
                </div>
              </div>

              {/* Fields Configuration - Collapsible */}
              {!collapsedSteps[stepIndex] && (
                <div className="p-6">
                  <div className="space-y-4">
                    {step.fields.map((field, fieldIndex) => (
                      <div key={field.id} className="border-2 rounded-lg p-4 hover:bg-gray-50">
                        <div className="flex items-center justify-between mb-4">
                          <span className="text-2xl font-bold text-gray-900">
                            {stepIndex + 1}.{fieldIndex + 1}
                          </span>
                          <button
                            onClick={() => removeField(stepIndex, fieldIndex)}
                            className="text-red-600 hover:text-red-800 p-1.5 rounded-md hover:bg-red-50"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="col-span-2 sm:col-span-1">
                            <input
                              type="text"
                              value={field.label}
                              onChange={(e) => updateField(stepIndex, fieldIndex, { label: e.target.value })}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                              placeholder="Field Label"
                            />
                          </div>
                          <div className="col-span-2 sm:col-span-1">
                            <select
                              value={field.type}
                              onChange={(e) => updateField(stepIndex, fieldIndex, { type: e.target.value })}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                            >
                              {fieldTypes.map(type => (
                                <option key={type.id} value={type.id}>{type.label}</option>
                              ))}
                            </select>
                          </div>
                          
                          {/* New input for field key */}
                          <div className="col-span-2 sm:col-span-1">
                            <label className="block text-xs font-medium text-gray-700 mb-1">
                              Field Key (database field name)
                            </label>
                            <input
                              type="text"
                              value={field.key}
                              onChange={(e) => updateField(stepIndex, fieldIndex, { key: e.target.value })}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                              placeholder="Field Key"
                            />
                          </div>

                          {field.type === 'select' && (
                            <div className="col-span-2">
                              <input
                                type="text"
                                value={field.options.join(', ')}
                                onChange={(e) => updateField(stepIndex, fieldIndex, { 
                                  options: e.target.value.split(',').map(opt => opt.trim()) 
                                })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                                placeholder="Options (comma-separated)"
                              />
                            </div>
                          )}

                          <div className="col-span-2">
                            <input
                              type="text"
                              value={field.additionalRemarks || ''}
                              onChange={(e) => updateField(stepIndex, fieldIndex, { 
                                additionalRemarks: e.target.value 
                              })}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                              placeholder="Additional remarks or hints for user..."
                            />
                          </div>

                          <div className="col-span-2">
                            <label className="flex items-center">
                              <input
                                type="checkbox"
                                checked={field.required}
                                onChange={(e) => updateField(stepIndex, fieldIndex, { required: e.target.checked })}
                                className="rounded border-gray-300 text-blue-600"
                              />
                              <span className="ml-2 text-sm text-gray-600">Required field</span>
                            </label>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Add Step Button */}
        <button
          onClick={addStep}
          className="mt-6 w-full py-3 border-2 border-dashed border-gray-300 text-gray-600 rounded-lg hover:border-blue-500 hover:text-blue-500 flex items-center justify-center"
        >
          <Plus size={20} className="mr-2" />
          Add New Step
        </button>
      </div>
    </div>
  );
};

export default FormConfigurationManager;
