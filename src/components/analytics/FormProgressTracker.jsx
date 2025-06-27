import React, { useState, useEffect, useCallback } from 'react';
import { Check, ChevronDown, ChevronUp, List, HelpCircle, X, Download, ChevronLeft, ChevronRight, Eye, Target, TrendingUp, Users } from 'lucide-react';
import { useFormProgress } from '../../contexts/FormProgressContext';
import { useNavigate } from 'react-router-dom';
import * as XLSX from 'xlsx';
import { useAnalytics } from '../../contexts/analyticsContext';
import StepUsersModal from './StepUsersModal';

const FormProgressTracker = () => {
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

  // Initialize form progress when analytics data is loaded
  useEffect(() => {
    if (analyticsData?.metrics?.enrolled?.users && analyticsData.metrics.enrolled.users.length > 0) {
      console.log('Initializing form progress with enrolled users:', analyticsData.metrics.enrolled.users);
      initializeFormProgress(analyticsData);
    }
  }, [analyticsData, initializeFormProgress]);

  // Load forms on component mount
  useEffect(() => {
    fetchForms();
  }, [fetchForms]);

  // Initialize form data when form is selected (separate from pagination changes)
  useEffect(() => {
    if (selectedForm && analyticsData?.metrics?.enrolled?.users && analyticsData.metrics.enrolled.users.length > 0) {
      // Use timeout to ensure state updates are complete
      const timer = setTimeout(() => {
        initializeFormData(analyticsData);
      }, 0);
      
      return () => clearTimeout(timer);
    }
  }, [selectedForm, analyticsData, initializeFormData]);

  // Load first page when form is selected
  useEffect(() => {
    if (selectedForm && analyticsData?.metrics?.enrolled?.users && analyticsData.metrics.enrolled.users.length > 0) {
      goToPage(1, analyticsData);
    }
  }, [selectedForm, analyticsData, goToPage]);

  const handleFormSelect = (formId) => {
    selectForm(formId);
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      goToPage(newPage, analyticsData);
    }
  };

  const getStepStatusColor = (status) => {
    if (status === 'Yes') return 'bg-green-500';
    if (status === 'No') return 'bg-red-500';
    return 'bg-gray-300';
  };

  // Helper function to get step users data for the modal
  const getStepUsersData = useCallback((stepNumber, batch) => {
    return getStepUsers(stepNumber, batch, analyticsData);
  }, [getStepUsers, analyticsData]);

  const handleStepClick = (stepNumber, batch) => {
    setSelectedStep(stepNumber);
    setActiveBatch(batch);
    setShowStepUsers(true);
  };

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
      PremiumPlanTitle: user.premiumPlan?.planTitle || '-',
      PlanPurchaseDate: user.premiumPlan?.purchasedDate?._seconds ? 
        new Date(user.premiumPlan.purchasedDate._seconds * 1000).toLocaleDateString() : '-',
      PlanExpiryDate: user.premiumPlan?.expiryDate?._seconds ?
        new Date(user.premiumPlan.expiryDate._seconds * 1000).toLocaleDateString() : '-',
      AssignedLists: user.lists?.map(list => list.title).join('; ') || '-'
    }));

    const ws = XLSX.utils.json_to_sheet(csvData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Users");
    XLSX.writeFile(wb, `${activeTab}_users_export.xlsx`);
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

    console.log('Filtered Users for Plan:', currentPlan.title, filteredUsers.length);
    

    return {
      online: filteredUsers.filter(u => u.batch === 'online').length,
      offline: filteredUsers.filter(u => u.batch === 'offline').length,
      total: filteredUsers.length
    };
  }, [analyticsData, selectedForm, getCurrentFormPlan]);


  const PaginationControls = () => {
    return (
      <>
        {selectedForm && totalPages > 1 && (
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center space-x-4">
                <div className="bg-gray-50 rounded-lg p-3">
                  <Users className="h-5 w-5 text-gray-600" />
                </div>
                <div>
                  <div className="text-sm text-gray-600">Data Range</div>
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
                
                <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-2">
                  <span className="text-sm font-medium text-blue-800">
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
      </>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="bg-blue-100 p-3 rounded-lg">
              <Target className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Form Progress Analytics</h2>
              <p className="text-gray-600">Track user completion across form steps</p>
            </div>
          </div>
          {selectedForm && (
            <div className="bg-white rounded-lg p-4 shadow-sm border border-blue-200">
              <div className="text-right">
                <div className="text-2xl font-bold text-blue-600">{getFilteredUserCounts().total}</div>
                <div className="text-sm text-gray-600">Total Users</div>
                {getCurrentFormPlan() && (
                  <div className="text-xs text-blue-500 mt-1 font-medium">
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
              Select Form to Analyze
            </label>
            <div className="relative">
              <select
                value={selectedForm || ''}
                onChange={(e) => handleFormSelect(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg appearance-none bg-white pr-10 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              >
                <option value="">Choose a form to begin analysis</option>
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
                  <Eye className="h-4 w-4 text-gray-400" />
                  <span className="font-medium">Page {currentPage} of {totalPages}</span>
                </div>
              </div>
              <div className="flex items-center justify-between text-sm mt-1">
                <span className="text-gray-600">Cached:</span>
                <span className="text-blue-600 font-medium">{getCachedPagesCount()} pages</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Plan Information Banner */}
      {selectedForm && getCurrentFormPlan() && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="bg-blue-100 p-2 rounded-lg">
                <List className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-blue-800">
                  {selectedForm} → {getCurrentFormPlan().title}
                </h3>
                <p className="text-blue-600 text-sm">
                  Analyzing progress for users enrolled in this specific plan
                </p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-xl font-bold text-blue-800">{getFilteredUserCounts().total}</div>
              <div className="text-xs text-blue-600">Eligible Users</div>
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
                <div className="text-sm text-gray-600">Data Range</div>
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
              
              <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-2">
                <span className="text-sm font-medium text-blue-800">
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
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
            <p className="mt-4 text-gray-600 font-medium">Analyzing form progress data...</p>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Steps Overview */}
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
                    <h3 className="text-xl font-semibold text-gray-900">Form Steps Analytics</h3>
                    <p className="text-gray-600 text-sm">Click to {isStepsCollapsed ? 'expand' : 'collapse'} detailed step breakdown</p>
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
                  {formSteps.map((step) => {
                    const filteredCounts = getFilteredUserCounts();
                    

                    // Calculate status breakdown from cached data
                    const stepUsers = getStepUsers(step.number, null, analyticsData);
                    const completedCount = analyticsData.formStepsAnalysis[selectedForm]?.steps[step.number]?.completedCount || stepUsers.complete?.length || 0; 
                    const rejectedCount = analyticsData.formStepsAnalysis[selectedForm]?.steps[step.number]?.rejectedCount || stepUsers.rejected?.length || 0;
                    const unattendedCount = ( filteredCounts.total - completedCount - rejectedCount) || stepUsers.unattended?.length || 0;

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
                            <div className="bg-white border-2 border-blue-200 rounded-full w-12 h-12 flex items-center justify-center">
                              <span className="text-blue-600 font-bold text-lg">{step.number}</span>
                            </div>
                            <div>
                              <h4 className="font-semibold text-gray-900 text-lg">{step.title}</h4>
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
                                  Total: {completedCount + rejectedCount + unattendedCount}
                                </div>
                              </div>
                            </button>
                          </div>
                        </div>
                        
                        {/* Progress Bar */}
                        <div className="mt-4">
                          <div className="bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-green-500 h-2 rounded-full transition-all duration-300"
                              style={{ width: `${completionRate}%` }}
                            ></div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
                
                {formSteps.length === 0 && (
                  <div className="text-center py-12">
                    <div className="bg-gray-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                      <List className="h-8 w-8 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No Form Steps Found</h3>
                    <p className="text-gray-600">Select a form to view step-by-step progress analytics.</p>
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
        paginationComponent={PaginationControls}
        formProgressContext={{
          currentPage,
          totalPages,
          totalUsers,
          itemsPerPage,
          loading,
          handlePageChange
        }}
      />
    </div>
  );
};

export default FormProgressTracker;
