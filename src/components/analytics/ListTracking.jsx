import React, { useState, useMemo } from 'react';
import { Maximize, X, Download, ChevronLeft, ChevronRight, Filter, Upload, Trash2 } from 'lucide-react';
import * as XLSX from 'xlsx';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../../utils/axios';

const ListTracking = ({listData}) => {
  const [showModal, setShowModal] = useState(false);
  const [selectedMetric, setSelectedMetric] = useState(null);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [trackingType, setTrackingType] = useState('assigned'); // 'assigned' or 'created'
  const navigate = useNavigate();
  const [selectedUsersForBulkRelease, setSelectedUsersForBulkRelease] = useState([]);
  const [isReleasingUsers, setIsReleasingUsers] = useState(false);

  // Calculate metrics using new plan-based distribution structure
  const metrics = useMemo(() => {
    if (!listData?.listData) {
      return {
        assigned: {
          totalWithLists: 0,
          totalWithoutLists: 0,
          planDistribution: {}
        },
        created: {
          totalWithLists: 0,
          totalWithoutLists: 0,
          planDistribution: {}
        }
      };
    }

    // Assigned Lists Metrics
    const assignedWithListsData = listData.listData.userListDistributionWithLists || {};
    const assignedWithoutListsData = listData.listData.userListDistributionWithoutLists || {};

    const assignedTotalWithLists = Object.values(assignedWithListsData).reduce((sum, users) => sum + users.length, 0);
    const assignedTotalWithoutLists = Object.values(assignedWithoutListsData).reduce((sum, users) => sum + users.length, 0);

    // Calculate plan-wise distribution for assigned lists
    const assignedPlanDistribution = {};
    const allAssignedPlans = new Set([...Object.keys(assignedWithListsData), ...Object.keys(assignedWithoutListsData)]);
    
    allAssignedPlans.forEach(plan => {
      assignedPlanDistribution[plan] = {
        withLists: assignedWithListsData[plan]?.length || 0,
        withoutLists: assignedWithoutListsData[plan]?.length || 0,
        total: (assignedWithListsData[plan]?.length || 0) + (assignedWithoutListsData[plan]?.length || 0)
      };
    });

    // Created Lists Metrics
    const createdWithListsData = listData.listData.userListDistributionWithCreatedLists || {};
    const createdWithoutListsData = listData.listData.userListDistributionWithoutCreatedLists || {};

    const createdTotalWithLists = Object.values(createdWithListsData).reduce((sum, users) => sum + users.length, 0);
    const createdTotalWithoutLists = Object.values(createdWithoutListsData).reduce((sum, users) => sum + users.length, 0);

    // Calculate plan-wise distribution for created lists
    const createdPlanDistribution = {};
    const allCreatedPlans = new Set([...Object.keys(createdWithListsData), ...Object.keys(createdWithoutListsData)]);
    
    allCreatedPlans.forEach(plan => {
      createdPlanDistribution[plan] = {
        withLists: createdWithListsData[plan]?.length || 0,
        withoutLists: createdWithoutListsData[plan]?.length || 0,
        total: (createdWithListsData[plan]?.length || 0) + (createdWithoutListsData[plan]?.length || 0)
      };
    });

    return {
      assigned: {
        totalWithLists: assignedTotalWithLists,
        totalWithoutLists: assignedTotalWithoutLists,
        planDistribution: assignedPlanDistribution
      },
      created: {
        totalWithLists: createdTotalWithLists,
        totalWithoutLists: createdTotalWithoutLists,
        planDistribution: createdPlanDistribution
      }
    };
  }, [listData]);

  // Get all available list names for filter
  const availableListNames = useMemo(() => {
    if (!listData?.listData) return [];
    
    const lists = new Set();
    const dataSource = trackingType === 'assigned' 
      ? listData.listData.userListDistributionWithLists
      : listData.listData.userListDistributionWithCreatedLists;
      
    Object.values(dataSource || {}).forEach(users => {
      users.forEach(user => {
        user.lists?.forEach(listName => lists.add(listName));
      });
    });
    
    return Array.from(lists);
  }, [listData, trackingType]);

  // Get premium plans for filter
  const availablePremiumPlans = useMemo(() => {
    if (!listData?.premiumPlanDistribution) return [];
    return Object.keys(listData.premiumPlanDistribution);
  }, [listData]);

  const getMetricUsers = async (metricType, planName, listType = 'assigned') => {
    if (!listData?.listData) return [];

    let withListsData, withoutListsData;
    
    if (listType === 'assigned') {
      withListsData = listData.listData.userListDistributionWithLists || {};
      withoutListsData = listData.listData.userListDistributionWithoutLists || {};
    } else {
      withListsData = listData.listData.userListDistributionWithCreatedLists || {};
      withoutListsData = listData.listData.userListDistributionWithoutCreatedLists || {};
    }
    
    let userData = [];
    
    if (metricType === 'with-lists') {
      if (planName === 'all') {
        userData = Object.values(withListsData).flat();
      } else {
        userData = withListsData[planName] || [];
      }
    } else if (metricType === 'without-lists') {
      if (planName === 'all') {
        userData = Object.values(withoutListsData).flat();
      } else {
        userData = withoutListsData[planName] || [];
      }
    }

    // If we have user IDs, try to fetch detailed user data from backend
    const userIds = userData.map(user => user.id);

    if ( userIds.length > 0) {
      try {
        if (listData.metrics?.enrolled?.users) {
          return listData.metrics.enrolled.users
            .filter(user => userIds.includes(user.id))
            .map(user => {
              const listUser = userData.find(u => u.id === user.id);
              return {
                ...user,
                lists: listUser?.lists || []
              };
            });
        }
        return userData;
      } catch (error) {
        console.error('Error fetching user details:', error);
        
      }
    }

    return [];
  };

  const exportToCSV = (data) => {
    const csvData = data.map(user => ({
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
      [trackingType === 'assigned' ? 'AssignedLists' : 'CreatedLists']: user.lists?.join('; ') || '-'
    }));

    const ws = XLSX.utils.json_to_sheet(csvData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Users");
    XLSX.writeFile(wb, `list_tracking_${trackingType}_${selectedMetric}_export.xlsx`);
  };

  const OverviewCard = ({ title, withLists, withoutLists, type }) => (
    <div className="bg-white p-6 rounded-lg border border-dashed border-black">
      <h3 className="text-lg font-semibold mb-4">{title}</h3>
      <div className="grid grid-cols-2 gap-4">
        <div 
          className="bg-green-50 p-4 rounded-lg cursor-pointer hover:bg-green-100 transition-colors"
          onClick={() => {
            setSelectedMetric('with-lists');
            setSelectedPlan('all');
            setTrackingType(type);
            setShowModal(true);
          }}
        >
          <div className="text-2xl font-bold text-green-700">{withLists}</div>
          <div className="text-sm text-green-600">With {type === 'assigned' ? 'Assigned' : 'Created'} Lists</div>
        </div>
        <div 
          className="bg-red-50 p-4 rounded-lg cursor-pointer hover:bg-red-100 transition-colors"
          onClick={() => {
            setSelectedMetric('without-lists');
            setSelectedPlan('all');
            setTrackingType(type);
            setShowModal(true);
          }}
        >
          <div className="text-2xl font-bold text-red-700">{withoutLists}</div>
          <div className="text-sm text-red-600">Without {type === 'assigned' ? 'Assigned' : 'Created'} Lists</div>
        </div>
      </div>
    </div>
  );

  // Update PlanCard component to include bulk release for created lists
  const PlanCard = ({ planName, withLists, withoutLists, total, type }) => (
    <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
      <h4 className="font-medium text-gray-900 mb-3 truncate" title={planName}>
        {planName}
      </h4>
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Total:</span>
          <span className="font-medium">{total}</span>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div 
            className="bg-green-50 p-2 rounded cursor-pointer hover:bg-green-100 transition-colors"
            onClick={() => {
              setSelectedMetric('with-lists');
              setSelectedPlan(planName);
              setTrackingType(type);
              setShowModal(true);
            }}
          >
            <div className="text-lg font-bold text-green-700">{withLists}</div>
            <div className="text-xs text-green-600">With Lists</div>
          </div>
          <div 
            className="bg-red-50 p-2 rounded cursor-pointer hover:bg-red-100 transition-colors"
            onClick={() => {
              setSelectedMetric('without-lists');
              setSelectedPlan(planName);
              setTrackingType(type);
              setShowModal(true);
            }}
          >
            <div className="text-lg font-bold text-red-700">{withoutLists}</div>
            <div className="text-xs text-red-600">Without Lists</div>
          </div>
        </div>
        
        {/* Add bulk release button for created lists */}
        {type === 'created' && withLists > 0 && (
          <button
            onClick={async () => {
              const users = await getMetricUsers('with-lists', planName, type);
              const userIds = users.map(user => user.id);
              
              handleBulkRelease(userIds, planName);
            }}
            disabled={isReleasingUsers}
            className="w-full mt-2 px-3 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700 disabled:bg-red-400 transition-colors flex items-center justify-center gap-1"
          >
            <Upload size={12} />
            Release All ({withLists})
          </button>
        )}
      </div>
    </div>
  );

  const UsersModal = () => {
    if (!showModal) return null;
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(50);
    const [sortConfig, setSortConfig] = useState({ key: 'name', direction: 'asc' });
    const [localSearch, setLocalSearch] = useState('');
    const [selectedListFilter, setSelectedListFilter] = useState('');
    const [selectedPlanFilter, setSelectedPlanFilter] = useState('');
    const [showFilters, setShowFilters] = useState(false);
    const [modalUsers, setModalUsers] = useState([]);
    const [loadingUsers, setLoadingUsers] = useState(true);

    // Fetch users when modal opens
    React.useEffect(() => {
      const fetchUsers = async () => {
        setLoadingUsers(true);
        try {
          const users = await getMetricUsers(selectedMetric, selectedPlan, trackingType);
          setModalUsers(users);
        } catch (error) {
          console.error('Error fetching users:', error);
          setModalUsers([]);
        } finally {
          setLoadingUsers(false);
        }
      };

      fetchUsers();
    }, [selectedMetric, selectedPlan, trackingType]);

    const filteredUsers = useMemo(() => {
        return modalUsers.filter(user => {
            // Search filter
            if (localSearch) {
                const searchLower = localSearch.toLowerCase();
                const matchesSearch = user.name?.toLowerCase().includes(searchLower) ||
                                    user.email?.toLowerCase().includes(searchLower) ||
                                    user.phone?.toLowerCase().includes(searchLower);
                if (!matchesSearch) return false;
            }

            // List filter
            if (selectedListFilter) {
                const hasSelectedList = user.lists?.includes(selectedListFilter);
                if (!hasSelectedList) return false;
            }

            // Premium plan filter
            if (selectedPlanFilter) {
                const userPlan = user.premiumPlan?.planTitle || user.planTitle;
                if (userPlan !== selectedPlanFilter) return false;
            }

            return true;
        });
    }, [modalUsers, localSearch, selectedListFilter, selectedPlanFilter]);

    const sortedUsers = useMemo(() => {
        const sorted = [...filteredUsers];
        if (sortConfig.key) {
            sorted.sort((a, b) => {
                let aVal = a[sortConfig.key];
                let bVal = b[sortConfig.key];
                
                // Handle nested properties
                if (sortConfig.key === 'planTitle') {
                    aVal = a.premiumPlan?.planTitle || a.planTitle || '';
                    bVal = b.premiumPlan?.planTitle || b.planTitle || '';
                }
                
                if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
                if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
                return 0;
            });
        }
        return sorted;
    }, [filteredUsers, sortConfig]);

    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = sortedUsers.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(sortedUsers.length / itemsPerPage);

    const handleSort = (key) => {
        setSortConfig(prev => ({
            key,
            direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
        }));
    };

    const handleUserClick = (userId) => {
      navigate(`/users/${userId}`);
    };

    const getModalTitle = () => {
      const listType = selectedMetric === 'with-lists' ? 'With Lists' : 'Without Lists';
      const planText = selectedPlan === 'all' ? 'All Plans' : selectedPlan;
      const typeText = trackingType === 'assigned' ? 'Assigned' : 'Created';
      return `${planText} - ${listType} (${typeText})`;
    };

    // Add bulk selection functions
    const handleSelectAllInModal = () => {
      const currentUserIds = currentItems.map(user => user.id);
      const allSelected = currentUserIds.every(id => selectedUsersForBulkRelease.includes(id));
      
      if (allSelected) {
        setSelectedUsersForBulkRelease(prev => 
          prev.filter(id => !currentUserIds.includes(id))
        );
      } else {
        setSelectedUsersForBulkRelease(prev => 
          [...new Set([...prev, ...currentUserIds])]
        );
      }
    };

    const getSelectedCount = () => {
      return currentItems.filter(user => selectedUsersForBulkRelease.includes(user.id)).length;
    };

    // Add release functionality
    const handleReleaseUserLists = async (userId, userName) => {
      const confirmed = window.confirm(
        `Are you sure you want to release all created lists for ${userName}?\n\n` +
        `This action will make their lists available for user in app.`
      );

      if (confirmed) {
        try {
          setIsReleasingUsers(true);
          await axiosInstance.post(`/api/admin/user/${userId}/release-all-lists`);
          
          // Refresh the analytics data to reflect changes
          window.location.reload(); // Simple refresh - you could implement a more sophisticated refresh
          
          alert(`Successfully released all lists for ${userName}`);
        } catch (error) {
          console.error('Error releasing user lists:', error);
          alert('Failed to release lists. Please try again.');
        } finally {
          setIsReleasingUsers(false);
        }
      }
    };

    const handleBulkRelease = async (userIds, planName) => {
      if (userIds.length === 0) {
        alert('No users selected for bulk release');
        return;
      }

      const confirmed = window.confirm(
        `Are you sure you want to release all created lists for ${userIds.length} users from ${planName}?\n\n` +
        `This action cannot be undone and will make all their lists available for user in there app.`
      );

      if (confirmed) {
        try {
          setIsReleasingUsers(true);
          await axiosInstance.post('/api/admin/user/bulk-release-lists', {
            userIds: userIds
          });
          
          // Clear selections
          setSelectedUsersForBulkRelease([]);
          
          // Refresh the anahlytics data to reflect changes
          window.location.reload(); // Simple refresh - you could implement a more sophisticated refresh
          
          alert(`Successfully released lists for ${userIds.length} users`);
        } catch (error) {
          console.error('Error bulk releasing lists:', error);
          alert('Failed to bulk release lists. Please try again.');
        } finally {
          setIsReleasingUsers(false);
        }
      }
    };

    const handleSelectUserForBulkRelease = (userId) => {
      setSelectedUsersForBulkRelease(prev => 
        prev.includes(userId) 
          ? prev.filter(id => id !== userId)
          : [...prev, userId]
      );
    };

    const handleSelectAllUsersForBulkRelease = (users) => {
      const userIds = users.map(user => user.id);
      const allSelected = userIds.every(id => selectedUsersForBulkRelease.includes(id));
      
      if (allSelected) {
        // Deselect all
        setSelectedUsersForBulkRelease(prev => 
          prev.filter(id => !userIds.includes(id))
        );
      } else {
        // Select all
        setSelectedUsersForBulkRelease(prev => 
          [...new Set([...prev, ...userIds])]
        );
      }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg w-full max-w-7xl mx-4 max-h-[90vh] overflow-hidden">
                <div className="p-6 border-b border-gray-200">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-xl font-semibold">
                            {getModalTitle()}
                        </h3>
                        <div className="flex gap-2">
                          {/* Add bulk release button for created lists */}
                          {trackingType === 'created' && selectedMetric === 'with-lists' && (
                            <button
                              onClick={() => handleBulkRelease(selectedUsersForBulkRelease, selectedPlan)}
                              disabled={selectedUsersForBulkRelease.length === 0 || isReleasingUsers}
                              className="px-4 py-2 border-2 border-red-500 bg-red-50 text-red-600 rounded-lg flex items-center gap-2 hover:bg-red-100 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              <Upload size={16} />
                              Release Selected ({selectedUsersForBulkRelease.length})
                            </button>
                          )}
                          
                          <button
                              onClick={() => setShowFilters(!showFilters)}
                              className="px-4 py-2 border-2 border-blue-500 bg-blue-50 text-blue-600 rounded-lg flex items-center gap-2 hover:bg-blue-100"
                          >
                              <Filter size={16} />
                              Filters
                          </button>
                          <button
                              onClick={() => exportToCSV(sortedUsers)}
                              className="px-4 py-2 border-2 border-green-500 bg-green-50 text-green-600 rounded-lg flex items-center gap-2 hover:bg-green-100"
                              disabled={loadingUsers}
                          >
                              <Download size={16} />
                              Export as CSV
                          </button>
                          <button
                              onClick={() => {
                                setShowModal(false);
                                setSelectedUsersForBulkRelease([]);
                              }}
                              className="text-gray-400 hover:text-gray-500"
                          >
                              <X size={24} />
                          </button>
                        </div>
                    </div>

                    {/* Filters Section */}
                    {showFilters && (
                        <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1">Search Users</label>
                                    <input
                                        type="text"
                                        value={localSearch}
                                        onChange={(e) => setLocalSearch(e.target.value)}
                                        placeholder="Search by name, email, or phone..."
                                        className="w-full px-3 py-2 border rounded-lg"
                                        disabled={loadingUsers}
                                    />
                                </div>
                                {selectedMetric === 'with-lists' && (
                                    <div>
                                        <label className="block text-sm font-medium mb-1">Filter by List</label>
                                        <select
                                            value={selectedListFilter}
                                            onChange={(e) => setSelectedListFilter(e.target.value)}
                                            className="w-full px-3 py-2 border rounded-lg"
                                            disabled={loadingUsers}
                                        >
                                            <option value="">All Lists</option>
                                            {availableListNames.map(listName => (
                                                <option key={listName} value={listName}>{listName}</option>
                                            ))}
                                        </select>
                                    </div>
                                )}
                                <div>
                                    <label className="block text-sm font-medium mb-1">Filter by Premium Plan</label>
                                    <select
                                        value={selectedPlanFilter}
                                        onChange={(e) => setSelectedPlanFilter(e.target.value)}
                                        className="w-full px-3 py-2 border rounded-lg"
                                        disabled={loadingUsers}
                                    >
                                        <option value="">All Plans</option>
                                        {availablePremiumPlans.map(plan => (
                                            <option key={plan} value={plan}>{plan}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                            <div className="mt-3 flex gap-2">
                                <button
                                    onClick={() => {
                                        setLocalSearch('');
                                        setSelectedListFilter('');
                                        setSelectedPlanFilter('');
                                    }}
                                    className="px-3 py-1 text-sm bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
                                >
                                    Clear Filters
                                </button>
                                <span className="text-sm text-gray-600 flex items-center">
                                    Showing {filteredUsers.length} of {modalUsers.length} users
                                </span>
                            </div>
                        </div>
                    )}
                </div>

                <div className="overflow-auto max-h-[calc(90vh-250px)]">
                    {loadingUsers ? (
                        <div className="flex items-center justify-center py-8">
                            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
                        </div>
                    ) : (
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50 sticky top-0">
                                <tr>
                                    {/* Add checkbox column for created lists */}
                                    {trackingType === 'created' && selectedMetric === 'with-lists' && (
                                      <th className="px-6 py-3 text-left">
                                        <input
                                          type="checkbox"
                                          checked={getSelectedCount() === currentItems.length && currentItems.length > 0}
                                          onChange={handleSelectAllInModal}
                                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                        />
                                      </th>
                                    )}
                                    
                                    {['Name', 'Email', 'Phone', 'Premium Plan', `${trackingType === 'assigned' ? 'Assigned' : 'Created'} Lists`].map(header => (
                                        <th 
                                            key={header.toLowerCase().replace(/\s+/g, '')}
                                            onClick={() => handleSort(header.toLowerCase().replace(/\s+/g, '') === 'premiumplan' ? 'planTitle' : header.toLowerCase().replace(/\s+/g, ''))}
                                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                                        >
                                            {header}
                                            {sortConfig.key === (header.toLowerCase().replace(/\s+/g, '') === 'premiumplan' ? 'planTitle' : header.toLowerCase().replace(/\s+/g, '')) && (
                                                <span className="ml-1">
                                                    {sortConfig.direction === 'asc' ? '↑' : '↓'}
                                                </span>
                                            )}
                                        </th>
                                    ))}
                                    
                                    {/* Add Actions column for created lists */}
                                    {trackingType === 'created' && selectedMetric === 'with-lists' && (
                                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Actions
                                      </th>
                                    )}
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {currentItems.map(user => (
                                    <tr 
                                        key={user.id} 
                                        className="hover:bg-gray-50 transition-colors"
                                    >
                                        {/* Add checkbox for created lists */}
                                        {trackingType === 'created' && selectedMetric === 'with-lists' && (
                                          <td className="px-6 py-4 whitespace-nowrap">
                                            <input
                                              type="checkbox"
                                              checked={selectedUsersForBulkRelease.includes(user.id)}
                                              onChange={() => handleSelectUserForBulkRelease(user.id)}
                                              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                            />
                                          </td>
                                        )}
                                        
                                        <td 
                                          className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600 hover:text-blue-800 cursor-pointer"
                                          onClick={() => handleUserClick(user.id)}
                                        >
                                            {user.name}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm">{user.email}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm">{user.phone}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                                            <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded-full text-xs">
                                                {user.premiumPlan?.planTitle || user.planTitle || 'No Plan'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            {user.lists?.length > 0 ? (
                                                user.lists.map(listName => (
                                                    <span key={listName} className={`inline-block px-2 py-1 m-1 rounded-full text-xs ${
                                                      trackingType === 'assigned' 
                                                        ? 'bg-blue-100 text-blue-800' 
                                                        : 'bg-purple-100 text-purple-800'
                                                    }`}>
                                                        {listName}
                                                    </span>
                                                ))
                                            ) : (
                                                <span className="text-gray-400 text-sm">No lists {trackingType === 'assigned' ? 'assigned' : 'created'}</span>
                                            )}
                                        </td>
                                        
                                        {/* Add Actions column for created lists */}
                                        {trackingType === 'created' && selectedMetric === 'with-lists' && (
                                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                                            <button
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                handleReleaseUserLists(user.id, user.name);
                                              }}
                                              disabled={isReleasingUsers}
                                              className="px-3 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700 disabled:bg-red-400 transition-colors flex items-center gap-1"
                                            >
                                              <Upload size={12} />
                                              Release
                                            </button>
                                          </td>
                                        )}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>

                {/* Pagination controls */}
                {!loadingUsers && (
                    <div className="p-4 border-t border-gray-200 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <select
                                value={itemsPerPage}
                                onChange={(e) => {
                                    setItemsPerPage(Number(e.target.value));
                                    setCurrentPage(1);
                                }}
                                className="border rounded px-2 py-1"
                            >
                                {[25, 50, 100, 200].map(size => (
                                    <option key={size} value={size}>{size} per page</option>
                                ))}
                            </select>
                            <span className="text-sm text-gray-600">
                                Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, sortedUsers.length)} of {sortedUsers.length}
                            </span>
                        </div>

                        <div className="flex gap-2 items-center">
                            <button
                                onClick={() => setCurrentPage(1)}
                                disabled={currentPage === 1}
                                className="px-3 py-1 text-sm border rounded hover:bg-gray-50 disabled:opacity-50"
                            >
                                First
                            </button>
                            <button
                                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                disabled={currentPage === 1}
                                className="p-2 rounded hover:bg-gray-100 disabled:opacity-50"
                            >
                                <ChevronLeft size={20} />
                            </button>
                            <span className="px-3 py-1 text-sm">
                                Page {currentPage} of {totalPages}
                            </span>
                            <button
                                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                                disabled={currentPage === totalPages}
                                className="p-2 rounded hover:bg-gray-100 disabled:opacity-50"
                            >
                                <ChevronRight size={20} />
                            </button>
                            <button
                                onClick={() => setCurrentPage(totalPages)}
                                disabled={currentPage === totalPages}
                                className="px-3 py-1 text-sm border rounded hover:bg-gray-50 disabled:opacity-50"
                            >
                                Last
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="flex space-x-1 border-b border-gray-200">
        <button
          onClick={() => setTrackingType('assigned')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            trackingType === 'assigned'
              ? 'border-blue-500 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Assigned Lists Tracking
        </button>
        <button
          onClick={() => setTrackingType('created')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            trackingType === 'created'
              ? 'border-purple-500 text-purple-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Created Lists Tracking
        </button>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <OverviewCard 
          title={`${trackingType === 'assigned' ? 'Assigned' : 'Created'} Lists Distribution`}
          withLists={metrics[trackingType].totalWithLists}
          withoutLists={metrics[trackingType].totalWithoutLists}
          type={trackingType}
        />
        <div className="bg-white p-6 rounded-lg border border-dashed border-black">
          <h3 className="text-lg font-semibold mb-4">Summary</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Total Users:</span>
              <span className="font-medium">{metrics[trackingType].totalWithLists + metrics[trackingType].totalWithoutLists}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">{trackingType === 'assigned' ? 'Assignment' : 'Creation'} Rate:</span>
              <span className="font-medium">
                {metrics[trackingType].totalWithLists + metrics[trackingType].totalWithoutLists > 0 
                  ? Math.round((metrics[trackingType].totalWithLists / (metrics[trackingType].totalWithLists + metrics[trackingType].totalWithoutLists)) * 100)
                  : 0}%
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Total Plans:</span>
              <span className="font-medium">{Object.keys(metrics[trackingType].planDistribution).length}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Plan-wise Distribution */}
      <div className="bg-white p-6 rounded-lg shadow">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-semibold">
            Plan-wise {trackingType === 'assigned' ? 'Assigned' : 'Created'} List Distribution
          </h3>
          
          {/* Add global bulk release button for created lists */}
          {trackingType === 'created' && (
            <button
              onClick={async () => {
                // Get all users with created lists across all plans
                const allUsersWithCreatedLists = [];
                for (const [planName, data] of Object.entries(metrics[trackingType].planDistribution)) {
                  if (data.withLists > 0) {
                    const users = await getMetricUsers('with-lists', planName, trackingType);
                    allUsersWithCreatedLists.push(...users);
                  }
                }
                
                if (allUsersWithCreatedLists.length > 0) {
                  const userIds = allUsersWithCreatedLists.map(user => user.id);
                  console.log(`Releasing all created lists for ${userIds.length} users across all plans...`);
                  
                  handleBulkRelease(userIds, 'All Plans');
                }
              }}
              disabled={isReleasingUsers || metrics[trackingType].totalWithLists === 0}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-red-400 transition-colors flex items-center gap-2"
            >
              <Upload size={16} />
              Release All Created Lists ({metrics[trackingType].totalWithLists})
            </button>
          )}
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Object.entries(metrics[trackingType].planDistribution)
            .sort(([,a], [,b]) => b.total - a.total)
            .map(([planName, data]) => (
              <PlanCard
                key={planName}
                planName={planName}
                withLists={data.withLists}
                withoutLists={data.withoutLists}
                total={data.total}
                type={trackingType}
              />
            ))}
        </div>
        
        {Object.keys(metrics[trackingType].planDistribution).length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No plan distribution data available
          </div>
        )}
      </div>

      {showModal && <UsersModal />}
    </div>
  );
};



export default ListTracking;
