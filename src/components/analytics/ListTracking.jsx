import React, { useState, useMemo } from 'react';
import { Maximize, X, Download, ChevronLeft, ChevronRight, Filter } from 'lucide-react';
import * as XLSX from 'xlsx';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../../utils/axios';

const ListTracking = ({listData}) => {
  const [showModal, setShowModal] = useState(false);
  const [selectedMetric, setSelectedMetric] = useState(null);
  const [activeTab, setActiveTab] = useState('complete');
  const navigate = useNavigate();

  // Calculate metrics using new listData structure
  const metrics = useMemo(() => {
    if (!listData?.listData) {
      return {
        online: {
          withLists: 0,
          withoutLists: 0,
        },
        offline: {
          withLists: 0,
          withoutLists: 0,
        }
      };
    }

    const data = listData.listData;
    return {
      online: {
        withLists: data.usersWithListsOnline?.total || 0,
        withoutLists: data.usersWithoutListsOnline?.total || 0,
      },
      offline: {
        withLists: data.usersWithListsOffline?.total || 0,
        withoutLists: data.usersWithoutListsOffline?.total || 0,
      }
    };
  }, [listData]);

  // Get all available list names for filter
  const availableListNames = useMemo(() => {
    if (!listData?.listData) return [];
    
    const lists = new Set();
    const data = listData.listData;
    
    [...(data.usersWithListsOnline?.users || []), ...(data.usersWithListsOffline?.users || [])]
      .forEach(user => {
        user.lists?.forEach(listName => lists.add(listName));
      });
    
    return Array.from(lists);
  }, [listData]);

  // Get premium plans for filter
  const availablePremiumPlans = useMemo(() => {
    if (!listData?.premiumPlanDistribution) return [];
    return Object.keys(listData.premiumPlanDistribution);
  }, [listData]);

  const getMetricUsers = async (metricType) => {
    if (!listData?.listData) return [];

    const data = listData.listData;
    let userData = [];
    
    switch (metricType) {
      case 'online-with':
        userData = data.usersWithListsOnline?.users || [];
        break;
      case 'online-without':
        userData = data.usersWithoutListsOnline?.users || [];
        break;
      case 'offline-with':
        userData = data.usersWithListsOffline?.users || [];
        break;
      case 'offline-without':
        userData = data.usersWithoutListsOffline?.users || [];
        break;
      default:
        return [];
    }

    // Get user IDs
    const userIds = userData.map(user => user.id);

    if (userIds.length > 0) {
      try {
        throw new Error('Simulated error for testing fallback logic');
      } catch (error) {
        console.error('Error fetching user details:', error);
        // Fallback: try to use enrolled users data
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
      AssignedLists: user.lists?.map(list => list.title).join('; ') || '-'
    }));

    const ws = XLSX.utils.json_to_sheet(csvData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Users");
    XLSX.writeFile(wb, `list_tracking_${selectedMetric}_export.xlsx`);
  };

  const MetricCard = ({ title, withLists, withoutLists, type }) => (
    <div className="bg-white p-6 rounded-lg border border-dashed border-black">
      <h3 className="text-lg font-semibold mb-4">{title}</h3>
      <div className="grid grid-cols-2 gap-4">
        <div 
          className="bg-green-50 p-4 rounded-lg cursor-pointer hover:bg-green-100 transition-colors"
          onClick={() => {
            setSelectedMetric(`${type}-with`);
            setShowModal(true);
          }}
        >
          <div className="text-2xl font-bold text-green-700">{withLists}</div>
          <div className="text-sm text-green-600">With Lists</div>
        </div>
        <div 
          className="bg-red-50 p-4 rounded-lg cursor-pointer hover:bg-red-100 transition-colors"
          onClick={() => {
            setSelectedMetric(`${type}-without`);
            setShowModal(true);
          }}
        >
          <div className="text-2xl font-bold text-red-700">{withoutLists}</div>
          <div className="text-sm text-red-600">Without Lists</div>
        </div>
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
          const users = await getMetricUsers(selectedMetric);
          setModalUsers(users);
        } catch (error) {
          console.error('Error fetching users:', error);
          setModalUsers([]);
        } finally {
          setLoadingUsers(false);
        }
      };

      fetchUsers();
    }, [selectedMetric]);

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

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg w-full max-w-7xl mx-4 max-h-[90vh] overflow-hidden">
                <div className="p-6 border-b border-gray-200">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-xl font-semibold">
                            {selectedMetric.includes('online') ? 'Online' : 'Offline'} Users - 
                            {selectedMetric.includes('with') ? ' With Lists' : ' Without Lists'}
                        </h3>
                        <div className="flex gap-2">
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
                                onClick={() => setShowModal(false)}
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
                                    {['Name', 'Email', 'Phone', 'Premium Plan', 'Lists'].map(header => (
                                        <th 
                                            key={header.toLowerCase().replace(' ', '')}
                                            onClick={() => handleSort(header.toLowerCase().replace(' ', '') === 'premiumplan' ? 'planTitle' : header.toLowerCase())}
                                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                                        >
                                            {header}
                                            {sortConfig.key === (header.toLowerCase().replace(' ', '') === 'premiumplan' ? 'planTitle' : header.toLowerCase()) && (
                                                <span className="ml-1">
                                                    {sortConfig.direction === 'asc' ? '↑' : '↓'}
                                                </span>
                                            )}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {currentItems.map(user => (
                                    <tr 
                                        key={user.id} 
                                        className="hover:bg-gray-50 cursor-pointer"
                                        onClick={() => handleUserClick(user.id)}
                                    >
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600 hover:text-blue-800">
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
                                                    <span key={listName} className="inline-block px-2 py-1 m-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                                                        {listName}
                                                    </span>
                                                ))
                                            ) : (
                                                <span className="text-gray-400 text-sm">No lists assigned</span>
                                            )}
                                        </td>
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
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <MetricCard 
          title="Online Users" 
          withLists={metrics.online.withLists}
          withoutLists={metrics.online.withoutLists}
          type="online"
        />
        <MetricCard 
          title="Offline Users"
          withLists={metrics.offline.withLists}
          withoutLists={metrics.offline.withoutLists}
          type="offline"
        />
      </div>

      {showModal && <UsersModal />}
    </div>
  );
};

export default ListTracking;
