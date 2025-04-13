import React, { useState, useEffect } from 'react';
import { Check, ChevronDown, ChevronUp, List, HelpCircle, X, Download } from 'lucide-react';
import axiosInstance from '../../utils/axios';
import { useUsers } from '../../contexts/UsersContext';
import { useNavigate } from 'react-router-dom';
import * as XLSX from 'xlsx';

const FormProgressTracker = () => {
  const {users} = useUsers();
  const [selectedForm, setSelectedForm] = useState(null);
  const [forms, setForms] = useState([]);
  const [formSteps, setFormSteps] = useState([]);
  const [stepData, setStepData] = useState({});
  const [loading, setLoading] = useState(false);
  const [isStepsCollapsed, setIsStepsCollapsed] = useState(true);
  const [userProgress, setUserProgress] = useState([]);
  const [selectedStep, setSelectedStep] = useState(null);
  const [showStepUsers, setShowStepUsers] = useState(false);
  const [activeTab, setActiveTab] = useState('complete');
  const [activeBatch, setActiveBatch] = useState('online');
  const [paginatedData, setPaginatedData] = useState({
    complete: { data: [], page: 1, totalPages: 1 },
    rejected: { data: [], page: 1, totalPages: 1 },
    unattended: { data: [], page: 1, totalPages: 1 }
  });
  const ITEMS_PER_PAGE = 50;
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
              online:0,
              offline:0,
              totalCount: users.length
            };
          }
          if (step.status === 'Yes') {
            user.batch === 'online' ? stepsProgress[step.number].online++ : stepsProgress[step.number].offline++;
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

  const getStepUsers = (stepNumber, batch) => {
    const complete = [];
    const rejected = [];
    const unattended = [];

    userProgress.forEach(user => {
      if (batch && user.batch !== batch) return; // Filter by batch if specified
      const step = user.steps.find(s => s.number === stepNumber);
      if (!step || !step.status) {
        unattended.push(user);
      } else if (step.status === 'Yes') {
        complete.push(user);
      } else if (step.status === 'No') {
        rejected.push(user);
      } else {
        unattended.push(user);
      }
    });

    return { complete, rejected, unattended };
  };

  const handleStepClick = (stepNumber, batch) => {
    setSelectedStep(stepNumber);
    setShowStepUsers(true);
    setActiveTab('complete');
    setActiveBatch(batch);
  };

  const handlePageChange = (type, newPage) => {
    setPaginatedData(prev => ({
      ...prev,
      [type]: { ...prev[type], page: newPage }
    }));
  };

  // When exporting to CSV, include these additional fields from counsellingData
  const exportToCSV = (data) => {
    // Add counselling data fields to export
    const userData = data.map(user => {
      const u = users.find(u => u.id === user.id);
      return {
        ...u
      };

    })


    const csvData = userData.map(user => ({
      Name: user.name,
      Phone: user.phone,
      Email: user.email,
      CreatedAt: user.createdAt?._seconds ? new Date(user.createdAt._seconds * 1000).toLocaleDateString() : '-',
      Batch: user.batch || 'Unassigned',
      IsPremium: user.isPremium ? 'Yes' : 'No',
      HasLoggedIn: user.hasLoggedIn ? 'Yes' : 'No',
      // Add counselling data fields
      FullName: user.counsellingData?.fullName || '-',
      DateOfBirth: user.counsellingData?.dob || '-', 
      City: user.counsellingData?.city || '-',
      State: user.counsellingData?.state || '-',
      BoardMarks: user.counsellingData?.boardMarks || '-',
      BoardType: user.counsellingData?.boardType || '-',
      JEEMarks: user.counsellingData?.jeeMarks || '-',
      CETMarks: user.counsellingData?.cetMarks || '-',
      CETSeatNumber: user.counsellingData?.cetSeatNumber || '-',
      JEESeatNumber: user.counsellingData?.jeeSeatNumber || '-',
      PreferredField: user.counsellingData?.preferredField || '-',
      PreferredLocations: user.counsellingData?.preferredLocations || '-',
      Budget: user.counsellingData?.budget || '-',
      // Add premium plan info
      PremiumPlanTitle: user.premiumPlan?.planTitle || '-',
      PlanPurchaseDate: user.premiumPlan?.purchasedDate?._seconds ? 
        new Date(user.premiumPlan.purchasedDate._seconds * 1000).toLocaleDateString() : '-',
      PlanExpiryDate: user.premiumPlan?.expiryDate?._seconds ?
        new Date(user.premiumPlan.expiryDate._seconds * 1000).toLocaleDateString() : '-',
      // Add assigned lists info  
      AssignedLists: user.lists?.map(list => list.title).join('; ') || '-'
    }));

    const ws = XLSX.utils.json_to_sheet(csvData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Users");
    XLSX.writeFile(wb, `${activeTab}_users_export.xlsx`);
  };

  const StepUsersModal = () => {
    if (!selectedStep) return null;
    const { complete, rejected, unattended } = getStepUsers(selectedStep, activeBatch);
    const stepDetails = formSteps.find(step => step.number === selectedStep);

    // Move data preparation outside useEffect
    const getPaginatedData = (data, page) => {
      const start = (page - 1) * ITEMS_PER_PAGE;
      const end = start + ITEMS_PER_PAGE;
      return activeBatch ?
       data.filter(u => u.batch == activeBatch).slice(start, end) :
       data.slice(start, end);
    };

    // Get current data based on active tab
    const getCurrentData = () => {
      const dataMap = {
        complete,
        rejected,
        unattended
      };
      const currentData = dataMap[activeTab];
      const totalPages = Math.ceil(currentData.length / ITEMS_PER_PAGE);
      const currentPage = paginatedData[activeTab].page;

      return {
        data: getPaginatedData(currentData, currentPage),
        page: currentPage,
        totalPages,
        total: currentData.length
      };
    };

    // Calculate current view data
    const currentViewData = getCurrentData();

    // Only update pagination state if necessary
    useEffect(() => {
      const newState = getCurrentData();
      const currentState = paginatedData[activeTab];

      if (currentState.totalPages !== newState.totalPages || 
          currentState.data.length !== newState.data.length) {
        setPaginatedData(prev => ({
          ...prev,
          [activeTab]: {
            data: newState.data,
            page: Math.min(currentState.page, newState.totalPages) || 1,
            totalPages: newState.totalPages
          }
        }));
      }
    }, [selectedStep, activeTab]); // Only depend on tab changes and step selection

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg w-full max-w-6xl mx-4 max-h-[90vh] overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-semibold">
                Step {selectedStep}: {stepDetails?.title} - {activeBatch} Batch
              </h3>
              <button
                onClick={() => setShowStepUsers(false)}
                className="text-gray-400 hover:text-gray-500"
              >
                <X size={24} />
              </button>
            </div>
            
            {/* Tabs */}
            <div className="flex gap-4 mt-6">
              <button
                onClick={() => setActiveTab('complete')}
                className={`px-4 py-2 rounded-lg text-sm font-medium ${
                  activeTab === 'complete'
                    ? 'bg-green-100 text-green-700'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Complete ({complete.length})
              </button>
              <button
                onClick={() => setActiveTab('rejected')}
                className={`px-4 py-2 rounded-lg text-sm font-medium ${
                  activeTab === 'rejected'
                    ? 'bg-red-100 text-red-700'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Rejected ({rejected.length})
              </button>
              <button
                onClick={() => setActiveTab('unattended')}
                className={`px-4 py-2 rounded-lg text-sm font-medium ${
                  activeTab === 'unattended'
                    ? 'bg-gray-100 text-gray-700'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Unattended ({unattended.length})
              </button>
            </div>
          </div>

          <div className="px-6 py-2 flex justify-between items-center border-b border-gray-200">
            <div className="flex gap-4">
              {/* ...existing tabs... */}
            </div>
            <button
              onClick={() => exportToCSV(
                activeTab === 'complete' ? complete :
                activeTab === 'rejected' ? rejected : unattended,
                activeTab
              )}
              className="px-4 py-2 border-2 border-green-500 bg-green-50 text-green-600 rounded-lg flex items-center gap-2 hover:bg-green-100"
            >
              <Download size={16} />
              Export as CSV
            </button>
          </div>

          <div className="overflow-auto max-h-[calc(90vh-200px)] p-6">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Phone</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Batch</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {currentViewData.data.map(user => (
                  <tr 
                    key={user.id} 
                    className="hover:bg-gray-50 cursor-pointer"
                    onClick={() => navigate(`/users/${user.id}`)}
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 flex items-center gap-2">
                      {user.name}
                      <div className="flex items-center gap-2 w-[10rem] flex-wrap">
                          {formSteps.map(step => {
                            const userStep = user.steps.find(s => s.number === step.number);
                            return (
                              <div key={step.number} className="relative group">
                                <div
                                  className={`w-6 h-6 rounded-full ${getStepStatusColor(userStep?.status)} cursor-help`}
                                >
                                  <span className="text-white flex items-center justify-center h-full text-xs">
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
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {user.phone}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {user.batch || 'No Batch'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        activeTab === 'complete' ? 'bg-green-100 text-green-800' :
                        activeTab === 'rejected' ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {activeTab === 'complete' ? 'Completed' :
                         activeTab === 'rejected' ? 'Rejected' : 'Pending'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="mt-4 flex items-center justify-between">
              <div className="text-sm text-gray-500">
                Showing {((paginatedData[activeTab].page - 1) * ITEMS_PER_PAGE) + 1} to {Math.min(paginatedData[activeTab].page * ITEMS_PER_PAGE, (activeTab === 'complete' ? complete : activeTab === 'rejected' ? rejected : unattended).length)} of {(activeTab === 'complete' ? complete : activeTab === 'rejected' ? rejected : unattended).length} entries
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handlePageChange(activeTab, paginatedData[activeTab].page - 1)}
                  disabled={paginatedData[activeTab].page === 1}
                  className="px-3 py-1 rounded bg-gray-100 disabled:opacity-50"
                >
                  Previous
                </button>
                <button
                  onClick={() => handlePageChange(activeTab, paginatedData[activeTab].page + 1)}
                  disabled={paginatedData[activeTab].page === paginatedData[activeTab].totalPages}
                  className="px-3 py-1 rounded bg-gray-100 disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
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
                  <div 
                    key={step.number} 
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg  hover:bg-gray-100"
                    
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-medium">
                        {step.number}
                      </div>
                      <span className="font-medium">{step.title}</span>
                    </div>

                    <div className='flex-1 max-w-[70%] grid grid-cols-3 gap-4'>
                      <button className='bg-blue-100 text-blue-600 rounded-lg px-2 py-1 text-sm font-medium'
                      onClick={() => handleStepClick(step.number, 'online')}
                      >
                        <h4>Online</h4>
                            <span className="text-sm text-gray-600">
                          {stepData[step.number]?.online || 0} / {users.filter(u => u.isPremium && u.batch == 'online').length || 0}
                        </span>
                      </button>

                      <button className='bg-blue-100 text-blue-600 rounded-lg px-2 py-1 text-sm font-medium'
                      onClick={() => handleStepClick(step.number, 'offline')}
                      >
                        <h4>Offline</h4>
                            <span className="text-sm text-gray-600">
                          {stepData[step.number]?.offline || 0} / {users.filter(u => u.isPremium && u.batch == 'offline').length || 0}
                        </span>
                        </button>

                      <button className='bg-blue-100 text-blue-600 rounded-lg px-2 py-1 text-sm font-medium'
                      onClick={() => handleStepClick(step.number, null)}
                      >
                        <h4>Completed</h4>
                            <span className="text-sm text-gray-600 font-bold">
                          {stepData[step.number]?.completedCount || 0} / {users.filter(u => u.isPremium).length || 0}
                        </span>
                      </button>

                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {showStepUsers && <StepUsersModal />}
    </div>
  );
};

export default FormProgressTracker;
