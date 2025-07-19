import React, { useState, useEffect, useMemo } from 'react';
import { X, Download, ChevronLeft, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import * as XLSX from 'xlsx';

const StepUsersModal = ({ 
  isOpen, 
  onClose, 
  selectedStep, 
  stepDetails, 
  getStepUsersData, 
  analyticsData, 
  activeBatch, 
  formSteps,
  paginationComponent: PaginationControls,
  formProgressContext
}) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('complete');
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  // Reset to first page when step or tab changes
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedStep, activeTab]);

  // Get step users data
  const stepUsersData = useMemo(() => {
    if (!selectedStep || !getStepUsersData) return {};
    return getStepUsersData(selectedStep, activeBatch);
  }, [selectedStep, activeBatch, getStepUsersData]);

  const { complete = [], rejected = [], unattended = [], verdictAssigned = [], verdictNotAssigned = [] } = stepUsersData;

  // Determine if this is a verdict step or CAP query step
  const isVerdictStep = stepDetails?.isVerdict || false;
  const isCapQueryStep = stepDetails?.isCapQuery || false;

  // Get current data based on active tab
  const currentData = useMemo(() => {
    const dataMap = {
      complete,
      rejected,
      unattended,
      verdictAssigned,
      verdictNotAssigned
    };
    return dataMap[activeTab] || [];
  }, [activeTab, complete, rejected, unattended, verdictAssigned, verdictNotAssigned]);

  // Pagination calculations
  const totalPages = Math.ceil(currentData.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const paginatedData = currentData.slice(startIndex, endIndex);

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
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
      IsPremium: user.isPremium ? 'Yes' : 'No',
      HasLoggedIn: user.hasLoggedIn ? 'Yes' : 'No',
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
      PremiumPlanTitle: user?.planTitle || '-',
      PlanPurchaseDate: user.premiumPlan?.purchasedDate?._seconds ? 
        new Date(user.premiumPlan.purchasedDate._seconds * 1000).toLocaleDateString() : '-',
      PlanExpiryDate: user.premiumPlan?.expiryDate?._seconds ?
        new Date(user.premiumPlan.expiryDate._seconds * 1000).toLocaleDateString() : '-',
      AssignedLists: user.lists?.map(list => list.title).join('; ') || '-'
    }));

    const ws = XLSX.utils.json_to_sheet(csvData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Users");
    XLSX.writeFile(wb, `${activeTab}_users_step_${selectedStep}_export.xlsx`);
  };

  const getStepStatusColor = (status, isLocked) => {
    if(!!isLocked) return 'bg-gray-300 text-gray-100';
    if (status === 'Yes') return 'bg-green-500';
    if (status === 'No') return 'bg-red-500';
    return 'bg-gray-400';
  };

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

  const getStepTypeInfo = (step) => {
    const info = [];
    if (step.isCapQuery) info.push('CAP Query');
    if (step.isVerdict) info.push('Verdict');
    if (step.isCapSpecific) info.push('CAP Specific');
    if (step.premiumOnly) info.push('Premium Only');
    if (step.cap) info.push(`CAP Round ${step.cap}`);
    return info.join(', ') || 'Standard Step';
  };

  // Step Progress Component
  const StepProgress = ({ user, steps }) => {
    const hasStepData = user.steps && user.steps.length > 0;
    const relevantSteps = steps.filter(step => 
      step.isCapQuery || step.isVerdict || step.isCapSpecific || step.number <= 10
    );

    return (
      <div className="flex flex-wrap gap-1 max-w-xs">
        {relevantSteps.map(step => {
          const userStepData = user.steps?.find(s => s.number === step.number);
          return (
            <div key={step.number} className="relative group">
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium text-white cursor-help ${
                  !hasStepData ? 'bg-gray-300' : getStepStatusColor(userStepData?.status, userStepData?.isLocked)
                }`}
              >
                {step.number}
              </div>
              {/* Tooltip */}
              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity z-10">
                <div className="font-medium">{step.title}</div>
                <div className="text-gray-300">{getStepTypeInfo(step)}</div>
                {!hasStepData && <div className="text-red-300">(No data)</div>}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-7xl mx-4 max-h-[90vh] overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-semibold">
              Step {selectedStep}: {stepDetails?.title}
            </h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-500">
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

          {PaginationControls && formProgressContext && (
            <div className="flex-1">
              <PaginationControls />
            </div>
          )}
        <div className="px-6 py-2 flex justify-between items-center border-b border-gray-200">
          {/* Add Form Progress Pagination Controls */}

          
          <div className="text-sm  text-gray-600">
            Step Details: {getStepTypeInfo(stepDetails)}
          </div>
          <button
            onClick={() => exportToCSV(currentData)}
            className="px-4 py-2 border-2 border-green-500 bg-green-50 text-green-600 rounded-lg flex items-center gap-2 hover:bg-green-100"
          >
            <Download size={16} />
            Export as CSV
          </button>
        </div>

        <div className="overflow-auto max-h-[calc(90vh-300px)] p-6">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Phone</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Step Progress</th>
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
              {paginatedData.length > 0 ? (
                paginatedData.map(user => {
                  const userStep = user.steps?.find(s => s.number === selectedStep);
                  const hasStepData = user.steps && user.steps.length > 0;
                  
                  return (
                    <tr 
                      key={user.id} 
                      className="hover:bg-gray-50 cursor-pointer"
                      onClick={() => navigate(`/users/${user.id}`)}
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {user.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {user.phone}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(activeTab)}`}>
                          {getStatusLabel(activeTab)} {!hasStepData && activeTab === 'unattended' && '(No Data)'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <StepProgress user={user} steps={formSteps} />
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
                  <td 
                    colSpan={
                      4 + 
                      (isVerdictStep && (activeTab === 'verdictAssigned' || activeTab === 'complete') ? 1 : 0) +
                      (isCapQueryStep && activeTab === 'complete' ? 2 : 0)
                    } 
                    className="px-6 py-8 text-center text-gray-500"
                  >
                    No users found in this category
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-4 flex items-center justify-between">
              <div className="text-sm text-gray-500">
                Showing {startIndex + 1} to {Math.min(endIndex, currentData.length)} of {currentData.length} entries
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
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
                  disabled={currentPage === totalPages}
                  className="flex items-center px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Next
                  <ChevronRight size={16} className="ml-1" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StepUsersModal;
