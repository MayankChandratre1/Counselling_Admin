import React, { useState, useEffect } from 'react';
import { Check, ChevronDown, ChevronUp, List, HelpCircle } from 'lucide-react';
import axiosInstance from '../../utils/axios';
import { useUsers } from '../../contexts/UsersContext';
import { useNavigate } from 'react-router-dom';

const FormProgressTracker = () => {
  const {users} = useUsers();
  const [selectedForm, setSelectedForm] = useState(null);
  const [forms, setForms] = useState([]);
  const [formSteps, setFormSteps] = useState([]);
  const [stepData, setStepData] = useState({});
  const [loading, setLoading] = useState(false);
  const [isStepsCollapsed, setIsStepsCollapsed] = useState(true);
  const [userProgress, setUserProgress] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    console.log(users);
    
    fetchForms();
  }, []);

  useEffect(() => {
    if (selectedForm) {
      fetchStepData();
    }
  }, [selectedForm]);

  const fetchForms = async () => {
    try {
      const response = await axiosInstance.get('/api/admin/formsteps');
      setForms(response.data);
      if (selectedForm) {
        const selectedFormData = response.data.find(form => form.id === selectedForm);
        if (selectedFormData) {
          setFormSteps(selectedFormData.steps.sort((a, b) => a.number - b.number));
        }
      }
    } catch (err) {
      console.error('Error fetching forms:', err);
    }
  };

  const processStepData = (users) => {
    const stepsProgress = {};
    const usersWithProgress = [];

    users.forEach(user => {
      if (user.stepsData?.steps) {
        // Process steps summary
        user.stepsData.steps.forEach(step => {
          if (!stepsProgress[step.number]) {
            stepsProgress[step.number] = {
              title: step.title,
              completedCount: 0,
              totalCount: users.length
            };
          }
          if (step.status === 'Yes') {
            stepsProgress[step.number].completedCount++;
          }
        });

        // Process user progress
        usersWithProgress.push({
          id: user.id,
          name: user.name,
          phone: user.phone,
          batch: user.batch,
          steps: user.stepsData.steps
        });
      }
    });

    setStepData(stepsProgress);
    setUserProgress(usersWithProgress);
  };

  const fetchStepData = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get(`/api/admin/users/form/${selectedForm}`);
      processStepData(response.data);
    } catch (err) {
      console.error('Error fetching step data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFormSelect = (formId) => {
    setSelectedForm(formId);
    const selectedFormData = forms.find(form => form.id === formId);
    if (selectedFormData) {
      setFormSteps(selectedFormData.steps.sort((a, b) => a.number - b.number));
    } else {
      setFormSteps([]);
    }
  };

  const getStepStatusColor = (status) => {
    if (status === 'Yes') return 'bg-green-500';
    if (status === 'No') return 'bg-red-500';
    return 'bg-gray-300';
  };

  return (
    <div>
      {/* Form Selection */}
      <div className="relative w-full md:w-64 mb-6">
        <select
          value={selectedForm || ''}
          onChange={(e) => handleFormSelect(e.target.value)}
          className="w-full p-2 border border-gray-300 rounded-lg appearance-none bg-white pr-10"
        >
          <option value="">Select a form</option>
          {forms.map(form => (
            <option key={form.id} value={form.id}>
              {form.id}
            </option>
          ))}
        </select>
        <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500" />
      </div>

      {loading ? (
        <div className="flex justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Collapsible Steps Summary */}
          <div className="bg-white rounded-lg shadow p-4">
            <button
              onClick={() => setIsStepsCollapsed(!isStepsCollapsed)}
              className="flex items-center justify-between w-full"
            >
              <h3 className="text-lg font-medium">Steps Overview</h3>
              {isStepsCollapsed ? (
                <ChevronDown className="w-5 h-5 text-gray-500" />
              ) : (
                <ChevronUp className="w-5 h-5 text-gray-500" />
              )}
            </button>

            {!isStepsCollapsed && (
              <div className="mt-4 space-y-3">
                {formSteps.map((step) => (
                  <div key={step.number} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-medium">
                        {step.number}
                      </div>
                      <span className="font-medium">{step.title}</span>
                    </div>
                    <span className="text-sm text-gray-600">
                      {stepData[step.number]?.completedCount || 0} / {stepData[step.number]?.totalCount || 0} users
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Users Progress Grid */}
          <div className="bg-white rounded-lg shadow p-4">
            <h3 className="text-lg font-medium mb-4">User Progress</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr>
                    <th className="px-4 py-2 text-left">User</th>
                    <th className="px-4 py-2">Progress</th>
                  </tr>
                </thead>
                <tbody>
                  {userProgress.map(user => (
                    <tr key={user.id} onClick={()=>{
                        navigate(`/users/${user.id}`);
                    }} className="border-t cursor-pointer hover:bg-gray-50 transition-colors duration-200">
                      <td className="px-4 py-3">
                        <div>
                          <div className="font-medium">{user.name} </div>
                          <div className="text-sm text-gray-500">({user.phone}) Batch: {user.batch || 'No batch'}</div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {formSteps.map(step => {
                            const userStep = user.steps.find(s => s.number === step.number);
                            return (
                              <div key={step.number} className="relative group">
                                <div
                                  className={`w-8 h-8 rounded-full ${getStepStatusColor(userStep?.status)} cursor-help`}
                                >
                                  <span className="text-white flex items-center justify-center h-full text-sm">
                                    {step.number}
                                  </span>
                                </div>
                                {/* Tooltip */}
                                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
                                  {step.title}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FormProgressTracker;
