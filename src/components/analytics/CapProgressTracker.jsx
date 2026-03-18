import React, { useState, useEffect, useCallback } from 'react';
import { Check, ChevronDown, ChevronUp, List, HelpCircle, X, Download, ChevronLeft, ChevronRight, Award, Target, TrendingUp, Users, Zap } from 'lucide-react';
import { useFormProgress } from '../../contexts/FormProgressContext';
import { useNavigate } from 'react-router-dom';
import * as XLSX from 'xlsx';
import { useAnalytics } from '../../contexts/analyticsContext';
import StepUsersModal from './StepUsersModal';

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
    initializeFormData, // Add new function
    goToPage,
    getStepUsers,
    refreshCurrentPage,
    getCachedPagesCount,
    getTotalCachedUsers,
    getCurrentFormPlan,
  } = useFormProgress();

  const [isStepsCollapsed, setIsStepsCollapsed] = useState(true);
  const [selectedStep, setSelectedStep] = useState(null);
  const [showStepUsers, setShowStepUsers] = useState(false);
  const [activeBatch, setActiveBatch] = useState(null);
  const navigate = useNavigate();
  const [activeCapRound, setActiveCapRound] = useState(1);
  const [capRoundSteps, setCapRoundSteps] = useState({ 1: [], 2: [], 3: [] });

  // Initialize form progress when analytics data is loaded
  useEffect(() => {
    if (analyticsData) {
      initializeFormProgress(analyticsData);
    }
  }, [analyticsData, initializeFormProgress]);

  // Load forms on component mount
  useEffect(() => {
    fetchForms();
  }, [fetchForms]);

  // Initialize form data when form is selected (separate from pagination changes)
  useEffect(() => {
    if (selectedForm && analyticsData) {
      // Use timeout to ensure state updates are complete
      const timer = setTimeout(() => {
        initializeFormData(analyticsData);
      }, 0);
      
      return () => clearTimeout(timer);
    }
  }, [selectedForm, analyticsData, initializeFormData]);

  // Load first page when form is selected
  useEffect(() => {
    if (selectedForm && analyticsData) {
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
    setActiveBatch(batch);
    setShowStepUsers(true);
  };

  const handleVerdictClick = (stepNumber, batch) => {
    setSelectedStep(stepNumber);
    setActiveBatch(batch);
    setShowStepUsers(true);
  };

  // Add new handler for pagination
  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      goToPage(newPage, analyticsData);
    }
  };

  // Helper function to get filtered user counts for display
  const getFilteredUserCounts = useCallback(() => {
    if (!selectedForm) {
      return { online: 0, offline: 0, total: 0 };
    }

    const enrolledUsers = analyticsData?.metrics?.enrolled?.users || [];
    const currentPlan = getCurrentFormPlan();
    const filteredUsers = currentPlan
      ? enrolledUsers.filter(user => user.planTitle === currentPlan.title)
      : enrolledUsers;

    const resolvedTotal = totalUsers > 0 ? totalUsers : filteredUsers.length;

    return {
      online: filteredUsers.filter(u => u.batch === 'online').length,
      offline: filteredUsers.filter(u => u.batch === 'offline').length,
      total: resolvedTotal
    };
  }, [analyticsData, selectedForm, getCurrentFormPlan, totalUsers]);

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
      CreatedAt: user.createdAt ? new Date((user.createdAt && user.createdAt._seconds ? user.createdAt._seconds * 1000 : new Date(user.createdAt).getTime())).toLocaleDateString() : '-',
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
      PlanPurchaseDate: user.premiumPlan?.purchasedDate ? 
        new Date((user.premiumPlan.purchasedDate && user.premiumPlan.purchasedDate._seconds ? user.premiumPlan.purchasedDate._seconds * 1000 : new Date(user.premiumPlan.purchasedDate).getTime())).toLocaleDateString() : '-',
      PlanExpiryDate: user.premiumPlan?.expiryDate ?
        new Date((user.premiumPlan.expiryDate && user.premiumPlan.expiryDate._seconds ? user.premiumPlan.expiryDate._seconds * 1000 : new Date(user.premiumPlan.expiryDate).getTime())).toLocaleDateString() : '-',
      // Add assigned lists info  
      AssignedLists: user.lists?.map(list => list.title).join('; ') || '-'
    }));

    const ws = XLSX.utils.json_to_sheet(csvData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Users");
    XLSX.writeFile(wb, `${activeTab}_users_export.xlsx`);
  };

  // Helper function to get step users data for the modal (enhanced with verdict logic)
  const getStepUsersData = useCallback((stepNumber, batch) => {
    const { complete, rejected, unattended } = getStepUsers(stepNumber, batch, analyticsData);
    const verdictAssigned = [];
    const verdictNotAssigned = [];

    // Use context data and enhance with verdict logic
    complete.forEach(user => {
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

    unattended.forEach(user => {
      const step = user.steps?.find(s => s.number === stepNumber);
      const isVerdict = formSteps.find(fs => fs.number === stepNumber)?.isVerdict;
      
      // For users without step data or with empty steps, they won't have verdict
      if (isVerdict && (!user.steps || user.steps.length === 0 || !step || !step.verdict)) {
        verdictNotAssigned.push(user);
      }
    });

    return { complete, rejected, unattended, verdictAssigned, verdictNotAssigned };
  }, [getStepUsers, analyticsData, formSteps]);

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

                    // Calculate status breakdown from cached data
                    const stepUsers = getStepUsersLocal(step.number, null);
                    const completedCount = stepData[step.number]?.completedCount ?? (stepUsers.complete?.length || 0);
                    const rejectedCount = stepData[step.number]?.rejectedCount ?? (stepUsers.rejected?.length || 0);
                    const unattendedFromTotal = Math.max(0, filteredCounts.total - completedCount - rejectedCount);
                    const unattendedCount = filteredCounts.total > 0
                      ? unattendedFromTotal
                      : (stepUsers.unattended?.length || 0);
                    const completionRate = filteredCounts.total > 0 
                      ? Math.round(((completedCount || 0) / filteredCounts.total) * 100)
                      : 0;
                    
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
                                  {completedCount || 0} of {filteredCounts.total} users
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="flex space-x-3">
                            {step.isVerdict && (
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
                                  Total: {filteredCounts.total > 0 ? filteredCounts.total : (completedCount + rejectedCount + unattendedCount)}
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

      <StepUsersModal
        isOpen={showStepUsers}
        onClose={() => setShowStepUsers(false)}
        selectedStep={selectedStep}
        stepDetails={formSteps.find(step => step.number === selectedStep)}
        getStepUsersData={getStepUsersData}
        analyticsData={analyticsData}
        activeBatch={activeBatch}
        formSteps={formSteps}
      />
    </div>
  );
};

export default CapProgressTracker;
            