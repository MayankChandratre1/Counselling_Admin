import React, { useState, useEffect, useCallback } from 'react';
import { Check, ChevronDown, ChevronUp, List, HelpCircle, X, Download, ChevronLeft, ChevronRight, Award, Target, TrendingUp, Users, Zap } from 'lucide-react';
import { useFormProgress } from '../../contexts/FormProgressContext';
import { useNavigate } from 'react-router-dom';
import * as XLSX from 'xlsx';
import { useAnalytics } from '../../contexts/analyticsContext';

const CapProgressTracker = () => {
  const { analyticsData } = useAnalytics();
  const {
    forms,
    selectedForm,
    formSteps,
    currentPage,
    itemsPerPage,
    totalPages,
    totalUsers,
    stepData,
    paginatedUserProgress,
    loading,
    error,
    fetchForms,
    selectForm,
    initializeFormProgress,
    goToPage,
    getStepUsers,
    // refreshCurrentPage,
    getCachedPagesCount,
    getTotalCachedUsers,
    getCurrentFormPlan,
  } = useFormProgress();

  const [isStepsCollapsed, setIsStepsCollapsed] = useState(true);
  const [selectedStep, setSelectedStep] = useState(null);
  const [showStepUsers, setShowStepUsers] = useState(false);
  const [activeTab, setActiveTab] = useState('complete');
  const [activeBatch, setActiveBatch] = useState('online');
  const [paginatedData, setPaginatedData] = useState({
    complete: { data: [], page: 1, totalPages: 1 },
    rejected: { data: [], page: 1, totalPages: 1 },
    unattended: { data: [], page: 1, totalPages: 1 },
    verdictAssigned: { data: [], page: 1, totalPages: 1 },
    verdictNotAssigned: { data: [], page: 1, totalPages: 1 },
  });
  const ITEMS_PER_PAGE = 50;
  const navigate = useNavigate();
  const [activeCapRound, setActiveCapRound] = useState(1);
  const [capRoundSteps, setCapRoundSteps] = useState({ 1: [], 2: [], 3: [] });

  // Initialize form progress when analytics data is loaded
  useEffect(() => {
    if (analyticsData?.metrics?.enrolled?.users && analyticsData.metrics.enrolled.users.length > 0) {
      console.log('Initializing CAP progress with enrolled users:', analyticsData.metrics.enrolled.users);
      initializeFormProgress(analyticsData);
    }
  }, [analyticsData, initializeFormProgress]);

  // Load forms on component mount
  useEffect(() => {
    fetchForms();
  }, [fetchForms]);

  // Load first page when form is selected
  useEffect(() => {
    if (selectedForm && analyticsData?.metrics?.enrolled?.users && analyticsData.metrics.enrolled.users.length > 0) {
      goToPage(1, analyticsData);
    }
  }, [selectedForm, analyticsData, goToPage]);

  useEffect(() => {
    if (formSteps.length > 0) {
      // Group steps by CAP round
      const groupedSteps = { 1: [], 2: [], 3: [] };
      formSteps.forEach(step => {
        if (step.isCapQuery || step.isVerdict || step.isCapSpecific) {
          const capRound = step.cap || 1; // Default to round 1 if not specified
          if (groupedSteps[capRound]) {
            groupedSteps[capRound].push(step);
          }
        }
      });
      setCapRoundSteps(groupedSteps);
    }
  }, [formSteps]);

  const handleFormSelect = (formId) => {
    selectForm(formId);
  };

  const getStepStatusColor = (status) => {
    if (status === 'Yes') return 'bg-green-500';
    if (status === 'No') return 'bg-red-500';
    return 'bg-gray-300';
  };

  const getStepUsersLocal = (stepNumber, batch) => {
    const complete = [];
    const rejected = [];
    const unattended = [];
    const verdictAssigned = [];
    const verdictNotAssigned = [];

    const enrolledUsers = analyticsData?.metrics?.enrolled?.users || [];
    const { complete: completeFromContext, rejected: rejectedFromContext, unattended: unattendedFromContext } = 
      getStepUsers(stepNumber, batch, analyticsData);

    // Use context data and enhance with verdict logic
    completeFromContext.forEach(user => {
      complete.push(user);
      
      const step = user.steps?.find(s => s.number === stepNumber);
      const isVerdict = formSteps.find(fs => fs.number === stepNumber)?.isVerdict;
      
      if (isVerdict && step) {
        if (step.verdict && step.verdict.trim() !== '') {
          verdictAssigned.push(user);
        } else {
          verdictNotAssigned.push(user);
        }
      }
    });

    rejectedFromContext.forEach(user => rejected.push(user));
    
    unattendedFromContext.forEach(user => {
      unattended.push(user);
      
      const step = user.steps?.find(s => s.number === stepNumber);
      const isVerdict = formSteps.find(fs => fs.number === stepNumber)?.isVerdict;
      
      // For users without step data or with empty steps, they won't have verdict
      if (isVerdict && (!user.steps || user.steps.length === 0 || !step || !step.verdict)) {
        verdictNotAssigned.push(user);
      }
    });

    return { complete, rejected, unattended, verdictAssigned, verdictNotAssigned };
  };

  const handleStepClick = (stepNumber, batch) => {
    setSelectedStep(stepNumber);
    setShowStepUsers(true);
    setActiveTab('complete');
    setActiveBatch(batch);
  };

  const handleVerdictClick = (stepNumber, batch) => {
    setSelectedStep(stepNumber);
    setShowStepUsers(true);
    setActiveTab('verdictAssigned'); // Set to verdict tab by default
    setActiveBatch(batch);
  };

  // Add new handler for pagination
  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      goToPage(newPage, analyticsData);
    }
  };

  // Helper function to get filtered user counts for display
  const getFilteredUserCounts = useCallback(() => {
    if (!analyticsData?.metrics?.enrolled?.users || !selectedForm) {
      return { online: 0, offline: 0, total: 0 };
    }

    const currentPlan = getCurrentFormPlan();
    if (!currentPlan) {
      return { online: 0, offline: 0, total: 0 };
    }

    const filteredUsers = analyticsData.metrics.enrolled.users.filter(user => 
      user.planTitle === currentPlan.title
    );

    return {
      online: filteredUsers.filter(u => u.batch === 'online').length,
      offline: filteredUsers.filter(u => u.batch === 'offline').length,
      total: filteredUsers.length
    };
  }, [analyticsData, selectedForm, getCurrentFormPlan]);

  // When exporting to CSV, include these additional fields from counsellingData
  const exportToCSV = (data) => {
    const enrolledUsers = analyticsData?.metrics?.enrolled?.users || [];
    const enrichedData = data.map(user => {
      const fullUser = enrolledUsers.find(u => u.id === user.id);
      return { ...fullUser, ...user };
    });

    const csvData = enrichedData.map(user => ({
      Name: user.name,
      Phone: user.phone,
      Email: user.email,
      CreatedAt: user.createdAt?._seconds ? new Date(user.createdAt._seconds * 1000).toLocaleDateString() : '-',
      Batch: user.batch || 'Unassigned',
      IsPremium: user.isPremium ? 'Yes' : 'No',
      HasLoggedIn: user.hasLoggedIn ? 'Yes' : 'No',
      // ...existing counselling data fields...
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
    const { complete, rejected, unattended, verdictAssigned, verdictNotAssigned } = getStepUsersLocal(selectedStep, activeBatch);
    const stepDetails = formSteps.find(step => step.number === selectedStep);
    const isVerdictStep = stepDetails?.isVerdict || false;
    const isCapQueryStep = stepDetails?.isCapQuery || false;

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
        unattended,
        verdictAssigned,
        verdictNotAssigned
      };
      const currentData = dataMap[activeTab] || [];
      const totalPages = Math.ceil(currentData.length / ITEMS_PER_PAGE) || 1;
      const currentPage = paginatedData[activeTab]?.page || 1;

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
      const currentState = paginatedData[activeTab] || { page: 1, totalPages: 1, data: [] };

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

    const getStatusLabel = (tab) => {
      switch(tab) {
        case 'complete': return 'Completed';
        case 'rejected': return 'Rejected';
        case 'unattended': return 'Pending';
        case 'verdictAssigned': return 'Verdict Assigned';
        case 'verdictNotAssigned': return 'No Verdict';
        default: return tab;
      }
    };

    const getStatusColor = (tab) => {
      switch(tab) {
        case 'complete': return 'bg-green-100 text-green-800';
        case 'rejected': return 'bg-red-100 text-red-800';
        case 'unattended': return 'bg-gray-100 text-gray-800';
        case 'verdictAssigned': return 'bg-purple-100 text-purple-800';
        case 'verdictNotAssigned': return 'bg-yellow-100 text-yellow-800';
        default: return 'bg-gray-100 text-gray-800';
      }
    };

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg w-full max-w-6xl mx-4 max-h-[90vh] overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-semibold">
                Step {selectedStep}: {stepDetails?.title} - {activeBatch || 'All'} Batch
              </h3>
              <button
                onClick={() => setShowStepUsers(false)}
                className="text-gray-400 hover:text-gray-500"
              >
                <X size={24} />
              </button>
            </div>
            
            {/* Tabs */}
            <div className="flex flex-wrap gap-2 mt-6">
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
              
              {isVerdictStep && (
                <>
                  <button
                    onClick={() => setActiveTab('verdictAssigned')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium ${
                      activeTab === 'verdictAssigned'
                        ? 'bg-purple-100 text-purple-700'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    Verdict Assigned ({verdictAssigned.length})
                  </button>
                  <button
                    onClick={() => setActiveTab('verdictNotAssigned')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium ${
                      activeTab === 'verdictNotAssigned'
                        ? 'bg-yellow-100 text-yellow-700'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    No Verdict ({verdictNotAssigned.length})
                  </button>
                </>
              )}
            </div>
          </div>

          <div className="px-6 py-2 flex justify-between items-center border-b border-gray-200">
            <div className="text-sm text-gray-600">
              Note: Includes all users from cached pages. Users without form data are shown as unattended.
            </div>
            <button
              onClick={() => exportToCSV(
                activeTab === 'complete' ? complete :
                activeTab === 'rejected' ? rejected : 
                activeTab === 'verdictAssigned' ? verdictAssigned :
                activeTab === 'verdictNotAssigned' ? verdictNotAssigned :
                unattended
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
                  {isVerdictStep && (activeTab === 'verdictAssigned' || activeTab === 'complete') && (
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Verdict</th>
                  )}
                  {isCapQueryStep && (activeTab === 'complete') && (
                    <>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">College</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Branch</th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {currentViewData.data.length > 0 ? (
                  currentViewData.data.map(user => {
                    const userStep = user.steps?.find(s => s.number === selectedStep);
                    const hasStepData = user.steps && user.steps.length > 0;
                    
                    return (
                      <tr 
                        key={user.id} 
                        className="hover:bg-gray-50 cursor-pointer"
                        onClick={() => navigate(`/users/${user.id}`)}
                      >
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 flex items-center gap-2">
                          {user.name}
                          <div className="flex items-center gap-2 w-[10rem] flex-wrap">
                            {formSteps
                              .filter(step => step.isCapQuery || step.isVerdict || step.isCapSpecific)
                              .map(step => {
                                const userStepData = user.steps?.find(s => s.number === step.number);
                                return (
                                  <div key={step.number} className="relative group">
                                    <div
                                      className={`w-6 h-6 rounded-full ${
                                        !hasStepData ? 'bg-gray-300' : getStepStatusColor(userStepData?.status)
                                      } cursor-help`}
                                    >
                                      <span className="text-white flex items-center justify-center h-full text-xs">
                                        {step.number}
                                      </span>
                                    </div>
                                    {/* Tooltip */}
                                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
                                      {step.title} {!hasStepData && '(No data)'}
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
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(activeTab)}`}>
                            {getStatusLabel(activeTab)} {!hasStepData && activeTab === 'unattended' && '(No Data)'}
                          </span>
                        </td>
                        {isVerdictStep && (activeTab === 'verdictAssigned' || activeTab === 'complete') && (
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {hasStepData && userStep?.verdict ? (
                              <div className="max-w-xs overflow-hidden text-ellipsis">
                                {userStep.verdict.length > 50 
                                  ? `${userStep.verdict.substring(0, 50)}...` 
                                  : userStep.verdict}
                              </div>
                            ) : '—'}
                          </td>
                        )}
                        {isCapQueryStep && (activeTab === 'complete') && (
                          <>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {hasStepData && userStep?.collegeName ? (
                                <div className="max-w-xs overflow-hidden text-ellipsis">
                                  {userStep.collegeName}
                                </div>
                              ) : '—'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {hasStepData && (userStep?.branchCode || userStep?.branchName) ? (
                                <div className="flex flex-col">
                                  {userStep?.branchCode && (
                                    <span className="font-medium">{userStep.branchCode}</span>
                                  )}
                                  {userStep?.branchName && (
                                    <span className="text-xs text-gray-400">{userStep.branchName}</span>
                                  )}
                                </div>
                              ) : '—'}
                            </td>
                          </>
                        )}
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={
                      isCapQueryStep && activeTab === 'complete' ? 6 : 
                      isVerdictStep ? 5 : 4
                    } className="px-6 py-8 text-center text-gray-500">
                      No users found in this category
                    </td>
                  </tr>
                )}
              </tbody>
            </table>

            <div className="mt-4 flex items-center justify-between">
              <div className="text-sm text-gray-500">
                Showing {currentViewData.data.length === 0 ? 0 : ((currentViewData.page - 1) * ITEMS_PER_PAGE) + 1} to {Math.min(currentViewData.page * ITEMS_PER_PAGE, currentViewData.total)} of {currentViewData.total} entries
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handlePageChange(activeTab, paginatedData[activeTab].page - 1)}
                  disabled={paginatedData[activeTab]?.page === 1}
                  className="px-3 py-1 rounded bg-gray-100 disabled:opacity-50"
                >
                  Previous
                </button>
                <button
                  onClick={() => handlePageChange(activeTab, paginatedData[activeTab].page + 1)}
                  disabled={paginatedData[activeTab]?.page === paginatedData[activeTab]?.totalPages}
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

  if (error) {
    return (
      <div className="bg-red-50 border-l-4 border-red-500 rounded-lg p-6">
        <div className="flex items-center">
          <div className="bg-red-100 p-2 rounded-full mr-4">
            <X className="h-5 w-5 text-red-600" />
          </div>
          <div>
            <h3 className="text-lg font-medium text-red-800">Error Loading CAP Progress</h3>
            <p className="text-red-700 mt-1">{error}</p>
            <button 
              onClick={() => refreshCurrentPage(analyticsData)}
              className="mt-3 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Retry Loading
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="bg-purple-100 p-3 rounded-lg">
              <Award className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">CAP Progress Analytics</h2>
              <p className="text-gray-600">Monitor Centralized Admission Process progress</p>
            </div>
          </div>
          {selectedForm && (
            <div className="bg-white rounded-lg p-4 shadow-sm border border-purple-200">
              <div className="text-right">
                <div className="text-2xl font-bold text-purple-600">{getFilteredUserCounts().total}</div>
                <div className="text-sm text-gray-600">CAP Participants</div>
                {getCurrentFormPlan() && (
                  <div className="text-xs text-purple-500 mt-1 font-medium">
                    {getCurrentFormPlan().title}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Form Selection */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-end">
          <div className="lg:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select CAP Form to Analyze
            </label>
            <div className="relative">
              <select
                value={selectedForm || ''}
                onChange={(e) => handleFormSelect(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg appearance-none bg-white pr-10 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors"
              >
                <option value="">Choose a CAP form to begin analysis</option>
                {forms.map(form => (
                  <option key={form.id} value={form.id}>
                    {form.id}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            </div>
          </div>
          
          {selectedForm && (
            <div className="bg-white rounded-lg p-3 border border-gray-200">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Progress:</span>
                <div className="flex items-center space-x-2">
                  <Users className="h-4 w-4 text-gray-400" />
                  <span className="font-medium">Page {currentPage} of {totalPages}</span>
                </div>
              </div>
              <div className="flex items-center justify-between text-sm mt-1">
                <span className="text-gray-600">Cached:</span>
                <span className="text-purple-600 font-medium">{getCachedPagesCount()} pages</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Plan Information Banner */}
      {selectedForm && getCurrentFormPlan() && (
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="bg-purple-100 p-2 rounded-lg">
                <Target className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-purple-800">
                  {selectedForm} → {getCurrentFormPlan().title}
                </h3>
                <p className="text-purple-600 text-sm">
                  Tracking CAP progress for users in this specific plan
                </p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-xl font-bold text-purple-800">{getFilteredUserCounts().total}</div>
              <div className="text-xs text-purple-600">CAP Eligible Users</div>
            </div>
          </div>
        </div>
      )}

      {/* Pagination Controls */}
      {selectedForm && totalPages > 1 && (
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center space-x-4">
              <div className="bg-gray-50 rounded-lg p-3">
                <Users className="h-5 w-5 text-gray-600" />
              </div>
              <div>
                <div className="text-sm text-gray-600">CAP Data Range</div>
                <div className="font-medium">
                  Users {((currentPage - 1) * itemsPerPage) + 1} - {Math.min(currentPage * itemsPerPage, totalUsers)} of {totalUsers}
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1 || loading}
                className="flex items-center px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft size={16} className="mr-1" />
                Previous
              </button>
              
              <div className="bg-purple-50 border border-purple-200 rounded-lg px-4 py-2">
                <span className="text-sm font-medium text-purple-800">
                  Page {currentPage} of {totalPages}
                </span>
              </div>
              
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages || loading}
                className="flex items-center px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Next
                <ChevronRight size={16} className="ml-1" />
              </button>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="bg-white border border-gray-200 rounded-lg p-12">
          <div className="flex flex-col items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-purple-500 border-t-transparent"></div>
            <p className="mt-4 text-gray-600 font-medium">Analyzing CAP progress data...</p>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* CAP Round Navigation */}
          <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
            <div className="border-b border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="bg-orange-100 p-2 rounded-lg">
                    <Zap className="h-5 w-5 text-orange-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900">CAP Round Selection</h3>
                    <p className="text-gray-600 text-sm">Choose a CAP round to analyze progress</p>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[1, 2, 3].map((round) => (
                  <button
                    key={round}
                    onClick={() => setActiveCapRound(round)}
                    className={`p-4 border-2 rounded-lg transition-all duration-200 ${
                      activeCapRound === round
                        ? 'border-purple-500 bg-purple-50 shadow-md'
                        : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <div className="text-center">
                      <div className={`text-lg font-bold ${
                        activeCapRound === round ? 'text-purple-700' : 'text-gray-700'
                      }`}>
                        CAP Round {round}
                      </div>
                      {capRoundSteps[round]?.length > 0 && (
                        <div className="mt-2">
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            activeCapRound === round 
                              ? 'bg-purple-100 text-purple-800' 
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {capRoundSteps[round].length} steps
                          </span>
                        </div>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Steps Analytics */}
          <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
            <div className="border-b border-gray-200 p-6">
              <button
                onClick={() => setIsStepsCollapsed(!isStepsCollapsed)}
                className="flex items-center justify-between w-full group"
              >
                <div className="flex items-center space-x-3">
                  <div className="bg-green-100 p-2 rounded-lg">
                    <TrendingUp className="h-5 w-5 text-green-600" />
                  </div>
                  <div className="text-left">
                    <h3 className="text-xl font-semibold text-gray-900">
                      CAP Round {activeCapRound} Analytics
                    </h3>
                    <p className="text-gray-600 text-sm">
                      Click to {isStepsCollapsed ? 'expand' : 'collapse'} detailed step breakdown
                    </p>
                  </div>
                </div>
                <div className="bg-gray-50 p-2 rounded-lg group-hover:bg-gray-100 transition-colors">
                  {isStepsCollapsed ? (
                    <ChevronDown className="w-5 h-5 text-gray-500" />
                  ) : (
                    <ChevronUp className="w-5 h-5 text-gray-500" />
                  )}
                </div>
              </button>
            </div>

            {!isStepsCollapsed && (
              <div className="p-6">
                <div className="space-y-4">
                  {capRoundSteps[activeCapRound]?.map((step) => {
                    const filteredCounts = getFilteredUserCounts();
                    const completionRate = filteredCounts.total > 0 
                      ? Math.round(((stepData[step.number]?.completedCount || 0) / filteredCounts.total) * 100)
                      : 0;

                    // Calculate status breakdown from cached data
                    const stepUsers = getStepUsersLocal(step.number, null);
                    const completedCount = stepUsers.complete?.length || 0;
                    const rejectedCount = stepUsers.rejected?.length || 0;
                    const unattendedCount = stepUsers.unattended?.length || 0;
                    
                    return (
                      <div 
                        key={step.number} 
                        className="bg-gray-50 border border-gray-200 rounded-lg p-4 hover:bg-gray-100 transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <div className="bg-white border-2 border-purple-200 rounded-full w-12 h-12 flex items-center justify-center">
                              <span className="text-purple-600 font-bold text-lg">{step.number}</span>
                            </div>
                            <div>
                              <div className="flex items-center space-x-2">
                                <h4 className="font-semibold text-gray-900 text-lg">{step.title}</h4>
                                {step.isVerdict && (
                                  <span className='bg-purple-100 text-purple-700 text-xs px-2 py-1 rounded-full font-medium'>
                                    Verdict Step
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center space-x-4 mt-1">
                                <span className="text-sm text-gray-600">
                                  Completion Rate: <span className="font-medium text-green-600">{completionRate}%</span>
                                </span>
                                <span className="text-sm text-gray-600">
                                  {stepData[step.number]?.completedCount || 0} of {filteredCounts.total} users
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="flex space-x-3">
                            {step.isVerdict && (
                              <>
                                <button 
                                  className="bg-purple-100 hover:bg-purple-200 text-purple-700 font-medium rounded-lg px-4 py-3 transition-colors min-w-[120px]"
                                  onClick={() => handleVerdictClick(step.number, null)}
                                >
                                  <div className="text-center">
                                    <div className="text-lg font-bold">
                                      {(stepData[step.number]?.verdictAssignedOnline || 0) + (stepData[step.number]?.verdictAssignedOffline || 0)}
                                    </div>
                                    <div className="text-xs">Verdicts Assigned</div>
                                  </div>
                                </button>
                              </>
                            )}
                            
                            <button 
                              className="bg-blue-100 hover:bg-blue-200 text-blue-700 font-medium rounded-lg px-4 py-3 transition-colors min-w-[180px]"
                              onClick={() => handleStepClick(step.number, null)}
                            >
                              <div className="text-center">
                                <div className="text-sm font-bold space-y-1">
                                  <div className="text-green-600">Completed: {completedCount}</div>
                                  <div className="text-red-600">Rejected: {rejectedCount}</div>
                                  <div className="text-gray-600">Unattended: {unattendedCount}</div>
                                </div>
                                <div className="text-xs text-gray-500 mt-1 border-t pt-1">
                                  Total: {totalUsers}
                                </div>
                              </div>
                            </button>
                          </div>
                        </div>
                        
                        {/* Progress Bar */}
                        <div className="mt-4">
                          <div className="bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-purple-500 h-2 rounded-full transition-all duration-300"
                              style={{ width: `${completionRate}%` }}
                            ></div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
                
                {capRoundSteps[activeCapRound]?.length === 0 && (
                  <div className="text-center py-12">
                    <div className="bg-gray-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                      <Award className="h-8 w-8 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No CAP Steps Found</h3>
                    <p className="text-gray-600">No steps found for CAP Round {activeCapRound}. Try selecting a different round.</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {showStepUsers && <StepUsersModal />}
    </div>
  );
};

export default CapProgressTracker;
