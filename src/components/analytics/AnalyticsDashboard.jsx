import React, { useEffect, useState } from 'react';
import { Copy, ArrowLeft, CheckCircle, ChevronDown, ChevronUp, MessageSquare, DollarSign, Edit, Eye, X, Filter, ArrowDown, ArrowUp, ArrowUpDown, FileSpreadsheet } from 'lucide-react';
import { useUsers } from '../../contexts/UsersContext';
import { useLists } from '../../contexts/ListsContext';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement } from 'chart.js';
import { Pie, Bar } from 'react-chartjs-2';
import FormProgressTracker from './FormProgressTracker';
import ListTracking from './ListTracking';
import CapProgressTracker from './CapProgressTracker';
import axios from 'axios';
import axiosInstance from '../../utils/axios';
import { useNavigate } from 'react-router-dom';

ChartJS.register(ArcElement, CategoryScale, LinearScale, BarElement, Tooltip, Legend);

const AnalyticsDashboard = () => {
  const { users, loading: usersLoading, fetchUsers } = useUsers();
  const { lists, loading: listsLoading, fetchLists } = useLists();
  const [metrics, setMetrics] = useState({
    totalUsers: 0,
    premiumUsers: 0,
    standardUsers: 0,
    planWiseUsers: {},
    usersWithLists: 0,
    averageListsPerUser: 0,
    batchWiseUsers: {},
  });
  const [analyticsData, setAnalyticsData] = useState({
    totalUsers: 0,
    metrics: {
      installs: 0,
      enrolled: { total: 0, users: [] },
      todayEnrolled: { total: 0, users: [] },
      paymentPending: { total: 0, users: [] }
    },
    premiumPlanDistribution: {},
    usersWithLists: 0,
    usersWithoutLists: 0
  });
  const [filterPlan, setFilterPlan] = useState('all');
  const [filterList, setFilterList] = useState('all');
  const [filterBatch, setFilterBatch] = useState('all');
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [isUserListCollapsed, setIsUserListCollapsed] = useState(true);
  const [selectedMetric, setSelectedMetric] = useState(null);
  const [showMetricUsers, setShowMetricUsers] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedMetricFilter, setSelectedMetricFilter] = useState('all');
  const [sortOrder, setSortOrder] = useState('desc'); // 'asc' or 'desc'
  const navigate = useNavigate();

  const fetchAnalyticsData = async () => {
    try {
      const response = await axiosInstance('/api/admin/get-analytics');
      setAnalyticsData(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching analytics data:', error);
      setLoading(false);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      await Promise.all([
        fetchUsers(),
        fetchLists(),
        fetchAnalyticsData()
      ]);
    };
    loadData();
  }, [fetchUsers, fetchLists]);

  useEffect(() => {
    if (users.length > 0) {
      calculateMetrics();
    }
  }, [users]);

  useEffect(() => {
    if (users.length > 0) {
      let result = [...users];
      
      if (filterPlan !== 'all') {
        result = result.filter(user => 
          filterPlan === 'premium' ? user.isPremium : !user.isPremium
        );
      }

      if (filterList !== 'all') {
        result = result.filter(user => {
          if (filterList === 'with') {
            return user.lists && user.lists.length > 0;
          }
          return !user.lists || user.lists.length === 0;
        });
      }

      if (filterBatch !== 'all') {
        result = result.filter(user => user.batch === filterBatch);
      }

      setFilteredUsers(result);
    }
  }, [users, filterPlan, filterList, filterBatch]);

  useEffect(() => {
    if (users.length > 0) {
      const today = new Date().toISOString().split('T')[0];
      
      // Convert Firebase Timestamp to Date
      const todayEnrolled = users.filter(user => {
        if (!user.premiumPlan?.purchasedDate) return false;
        
        const purchaseDate = new Date(
          user.premiumPlan.purchasedDate._seconds * 1000
        ).toISOString().split('T')[0];
        
        return purchaseDate === today;
      }).length;

      setMetrics(prev => ({
        ...prev,
        todayEnrolled
      }));
    }
  }, [users]);

  const calculateMetrics = () => {
    const totalUsers = users.length;

    const premiumUsers = users.filter(user => user.isPremium).length;
    const usersWithLists = users.filter(user => user.lists && user.lists.length > 0).length;
    
    // Calculate plan-wise distribution
    const planWiseUsers = users.reduce((acc, user) => {
      if (user.premiumPlan && user.premiumPlan.planTitle) {
        acc[user.premiumPlan.planTitle] = (acc[user.premiumPlan.planTitle] || 0) + 1;
      }
      return acc;
    }, {});

    // Calculate batch-wise distribution
    const batchWiseUsers = users.reduce((acc, user) => {
      const batch = user.batch || 'Unassigned';
      acc[batch] = (acc[batch] || 0) + 1;
      return acc;
    }, {});

    // Calculate average lists per user
    const totalLists = users.reduce((acc, user) => {
      return acc + (user.lists?.length || 0);
    }, 0);

    setMetrics({
      totalUsers,
      premiumUsers,
      standardUsers: totalUsers - premiumUsers,
      planWiseUsers,
      usersWithLists,
      averageListsPerUser: totalLists / totalUsers || 0,
      batchWiseUsers,
    });
  };

  const getMetricUsers = (metricType) => {
    let users = [];
    
    switch (metricType) {
      case 'enrolled':
        users = analyticsData.metrics.enrolled.users || [];
        break;
      case 'todayEnrolled':
        users = analyticsData.metrics.todayEnrolled.users || [];
        break;
      case 'paymentPending':
        users = analyticsData.metrics.paymentPending.users || [];
        break;
      default:
        users = [];
    }

    // Filter by plan if a specific plan is selected
    if (selectedMetricFilter !== 'all') {
      users = users.filter(user => user.planTitle === selectedMetricFilter);
    }

    // Sort by purchasedDate
    users = users.sort((a, b) => {
      if(!a.purchasedDate._seconds && !b.purchasedDate?._seconds) {
        const dataA = new Date(a.purchasedDate);
        const dataB = new Date(b.purchasedDate);
        if(isNaN(dataA.getTime()) || isNaN(dataB.getTime())) {
          return 0; // If both dates are invalid, consider them equal
        }
        if (sortOrder === 'asc') {
          return dataA.getTime() - dataB.getTime(); // Oldest first
        }
        return dataB.getTime() - dataA.getTime(); // Newest first
      }
      const dateA = a.purchasedDate?._seconds || 0;
      const dateB = b.purchasedDate?._seconds || 0;
      
      if (sortOrder === 'desc') {
        return dateB - dateA; // Newest first
      } else {
        return dateA - dateB; // Oldest first
      }
    });

    return users;
  };

  const getUniquePlans = (metricType) => {
    const users = (() => {
      switch (metricType) {
        case 'enrolled':
          return analyticsData.metrics.enrolled.users || [];
        case 'todayEnrolled':
          return analyticsData.metrics.todayEnrolled.users || [];
        case 'paymentPending':
          return analyticsData.metrics.paymentPending.users || [];
        default:
          return [];
      }
    })();

    const plans = [...new Set(users.map(user => user.planTitle).filter(Boolean))];
    return plans.sort();
  };

  const formatDate = (timestamp) => {
    if (!timestamp?._seconds){
      const date = new Date(timestamp);
      if (isNaN(date.getTime())) {
        return 'N/A';
      }
      return date.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    };
    return new Date(timestamp._seconds * 1000).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleUserClick = (userId) => {
    navigate(`/users/${userId}`);
  };

  const toggleSortOrder = () => {
    setSortOrder(prev => prev === 'desc' ? 'asc' : 'desc');
  };

  const resetFilters = () => {
    setSelectedMetricFilter('all');
    setSortOrder('desc');
  };

  const exportToExcel = (metricType) => {
    const usersToExport = getMetricUsers(metricType);
    
    if (usersToExport.length === 0) {
      alert('No data to export');
      return;
    }

    // Define headers based on metric type
    const getHeaders = () => {
      const baseHeaders = ['Name', 'Phone', 'Plan', 'Purchase Date'];
      
      if (metricType === 'paymentPending') {
        return [...baseHeaders, 'Amount Due'];
      }
      
      return baseHeaders;
    };

    const headers = getHeaders();
    
    // Convert users data to CSV format
    const csvData = usersToExport.map(user => {
      const baseRow = [
        user.name || '',
        user.phone || '',
        user.planTitle || '',
        formatDate(user.purchasedDate)
      ];
      
      if (metricType === 'paymentPending') {
        return [...baseRow, `₹${user.amountRemaining || 0}`];
      }
      
      return baseRow;
    });

    // Create CSV content
    const csvContent = [
      headers.join(','),
      ...csvData.map(row => 
        row.map(cell => {
          // Escape cells that contain commas, quotes, or newlines
          if (typeof cell === 'string' && (cell.includes(',') || cell.includes('"') || cell.includes('\n'))) {
            return `"${cell.replace(/"/g, '""')}"`;
          }
          return cell;
        }).join(',')
      )
    ].join('\n');

    // Create and download the file
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      
      // Generate filename based on metric type
      const getFileName = () => {
        const timestamp = new Date().toISOString().split('T')[0];
        
        switch (metricType) {
          case 'enrolled':
            return `enrolled_users_${timestamp}_${selectedMetricFilter}.csv`;
          case 'todayEnrolled':
            return `today_enrollments_${timestamp}_${selectedMetricFilter}.csv`;
          case 'paymentPending':
            return `payment_pending_users_${timestamp}_${selectedMetricFilter}.csv`;
          default:
            return `users_export_${timestamp}_${selectedMetricFilter}.csv`;
        }
      };
      
      link.setAttribute('download', getFileName());
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  {/* Metric Users Modal */}
  {showMetricUsers && selectedMetric && (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl mx-4 max-h-[90vh] overflow-hidden">
        <div className="p-6 border-b border-gray-200 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <h3 className="text-xl font-semibold">
              {selectedMetric === 'enrolled' && 'All Enrolled Users'}
              {selectedMetric === 'todayEnrolled' && "Today's Enrollments"}
              {selectedMetric === 'paymentPending' && "Payment Pending Users"}
            </h3>
            <span className="bg-blue-100 text-blue-800 text-sm px-3 py-1 rounded-full">
              {getMetricUsers(selectedMetric).length} users
            </span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => exportToExcel(selectedMetric)}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              title="Export to Excel"
            >
              <FileSpreadsheet size={16} />
              Export to Excel
            </button>
            <button
              onClick={() => {
                setShowMetricUsers(false);
                setSelectedMetric(null);
                setSelectedMetricFilter('all');
                setSortOrder('desc');
              }}
              className="text-gray-400 hover:text-gray-500"
            >
              <X size={24} />
            </button>
          </div>
        </div>
        
        {/* Filters and Controls */}
        <div className="p-4 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center gap-4 flex-wrap">
            {/* Plan Filter */}
            <div className="flex items-center gap-2">
              <Filter size={16} className="text-gray-500" />
              <label className="text-sm font-medium text-gray-700">Plan:</label>
              <select
                value={selectedMetricFilter}
                onChange={(e) => setSelectedMetricFilter(e.target.value)}
                className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Plans</option>
                {getUniquePlans(selectedMetric).map(plan => (
                  <option key={plan} value={plan}>{plan}</option>
                ))}
              </select>
            </div>

            {/* Sort Controls */}
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700">Sort by Date:</label>
              <button
                onClick={toggleSortOrder}
                className="flex items-center gap-1 px-3 py-1 border border-gray-300 rounded-md text-sm hover:bg-gray-100 transition-colors"
              >
                {sortOrder === 'desc' ? (
                  <>
                    <ArrowDown size={14} />
                    Newest First
                  </>
                ) : (
                  <>
                    <ArrowUp size={14} />
                    Oldest First
                  </>
                )}
              </button>
            </div>

            {/* Reset Filters */}
            {(selectedMetricFilter !== 'all' || sortOrder !== 'desc') && (
              <button
                onClick={resetFilters}
                className="px-3 py-1 bg-gray-200 text-gray-700 rounded-md text-sm hover:bg-gray-300 transition-colors"
              >
                Reset Filters
              </button>
            )}
          </div>
        </div>

        <div className="overflow-auto max-h-[calc(90vh-200px)]">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50 sticky top-0">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name
                </th>
                {/* <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Email
                </th> */}
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Phone
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Plan
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <div className="flex items-center gap-1">
                    Purchase Date
                    <button onClick={toggleSortOrder} className="text-gray-400 hover:text-gray-600">
                      <ArrowUpDown size={12} />
                    </button>
                  </div>
                </th>
                {selectedMetric === 'paymentPending' && (
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount Due
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {getMetricUsers(selectedMetric).length === 0 ? (
                <tr>
                  <td colSpan={selectedMetric === 'paymentPending' ? 6 : 5} className="px-6 py-8 text-center text-gray-500">
                    No users found with the selected filters.
                  </td>
                </tr>
              ) : (
                getMetricUsers(selectedMetric).map((user, index) => (
                  <tr 
                    key={user.id || index} 
                    onClick={() => handleUserClick(user.id)}
                    className="hover:bg-gray-50 cursor-pointer transition-colors"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-blue-600 hover:text-blue-800">
                        {user.name}
                      </div>
                    </td>
                   
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {user.phone}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                        {user.planTitle}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatDate(user.purchasedDate)}
                    </td>
                    {selectedMetric === 'paymentPending' && (
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-red-600">
                        ₹{user.amountRemaining}
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Footer with summary */}
        <div className="p-4 border-t border-gray-200 bg-gray-50">
          <div className="flex justify-between items-center text-sm text-gray-600">
            <span>
              Showing {getMetricUsers(selectedMetric).length} of {
                (() => {
                  switch (selectedMetric) {
                    case 'enrolled':
                      return analyticsData.metrics.enrolled.users?.length || 0;
                    case 'todayEnrolled':
                      return analyticsData.metrics.todayEnrolled.users?.length || 0;
                    case 'paymentPending':
                      return analyticsData.metrics.paymentPending.users?.length || 0;
                    default:
                      return 0;
                  }
                })()
              } users
            </span>
            <span>
              Sorted by purchase date ({sortOrder === 'desc' ? 'newest first' : 'oldest first'})
            </span>
          </div>
        </div>
      </div>
    </div>
  )}

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Analytics Dashboard</h1>

        {/* Key Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <MetricCard
            title="Installs"
            value={analyticsData.metrics.installs}
            icon="📱"
            color="bg-blue-500"
          />
          <MetricCard
            title="Enrolled"
            value={analyticsData.metrics.enrolled.total}
            icon="✅"
            color="bg-purple-500"
            onClick={() => {
              setSelectedMetric('enrolled');
              setShowMetricUsers(true);
            }}
          />
          <MetricCard
            title="Today Enrolled"
            value={analyticsData.metrics.todayEnrolled.total}
            icon="🎯"
            color="bg-green-500"
            onClick={() => {
              setSelectedMetric('todayEnrolled');
              setShowMetricUsers(true);
            }}
          />
          <MetricCard
            title="Payment Pending"
            value={analyticsData.metrics.paymentPending.total}
            icon="💰"
            color="bg-yellow-500"
            onClick={() => {
              setSelectedMetric('paymentPending');
              setShowMetricUsers(true);
            }}
          />
        </div>

        {/* Metric Users Modal */}
        {showMetricUsers && selectedMetric && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl mx-4 max-h-[90vh] overflow-hidden">
              <div className="p-6 border-b border-gray-200 flex justify-between items-center">
                <div className="flex items-center gap-4">
                  <h3 className="text-xl font-semibold">
                    {selectedMetric === 'enrolled' && 'All Enrolled Users'}
                    {selectedMetric === 'todayEnrolled' && "Today's Enrollments"}
                    {selectedMetric === 'paymentPending' && "Payment Pending Users"}
                  </h3>
                  <span className="bg-blue-100 text-blue-800 text-sm px-3 py-1 rounded-full">
                    {getMetricUsers(selectedMetric).length} users
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => exportToExcel(selectedMetric)}
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                    title="Export to Excel"
                  >
                    <FileSpreadsheet size={16} />
                    Export to Excel
                  </button>
                  <button
                    onClick={() => {
                      setShowMetricUsers(false);
                      setSelectedMetric(null);
                      setSelectedMetricFilter('all');
                      setSortOrder('desc');
                    }}
                    className="text-gray-400 hover:text-gray-500"
                  >
                    <X size={24} />
                  </button>
                </div>
              </div>
              
              {/* Filters and Controls */}
              <div className="p-4 border-b border-gray-200 bg-gray-50">
                <div className="flex items-center gap-4 flex-wrap">
                  {/* Plan Filter */}
                  <div className="flex items-center gap-2">
                    <Filter size={16} className="text-gray-500" />
                    <label className="text-sm font-medium text-gray-700">Plan:</label>
                    <select
                      value={selectedMetricFilter}
                      onChange={(e) => setSelectedMetricFilter(e.target.value)}
                      className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="all">All Plans</option>
                      {getUniquePlans(selectedMetric).map(plan => (
                        <option key={plan} value={plan}>{plan}</option>
                      ))}
                    </select>
                  </div>

                  {/* Sort Controls */}
                  <div className="flex items-center gap-2">
                    <label className="text-sm font-medium text-gray-700">Sort by Date:</label>
                    <button
                      onClick={toggleSortOrder}
                      className="flex items-center gap-1 px-3 py-1 border border-gray-300 rounded-md text-sm hover:bg-gray-100 transition-colors"
                    >
                      {sortOrder === 'desc' ? (
                        <>
                          <ArrowDown size={14} />
                          Newest First
                        </>
                      ) : (
                        <>
                          <ArrowUp size={14} />
                          Oldest First
                        </>
                      )}
                    </button>
                  </div>

                  {/* Reset Filters */}
                  {(selectedMetricFilter !== 'all' || sortOrder !== 'desc') && (
                    <button
                      onClick={resetFilters}
                      className="px-3 py-1 bg-gray-200 text-gray-700 rounded-md text-sm hover:bg-gray-300 transition-colors"
                    >
                      Reset Filters
                    </button>
                  )}
                </div>
              </div>

              <div className="overflow-auto max-h-[calc(90vh-200px)]">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50 sticky top-0">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Name
                      </th>
                      
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Phone
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Plan
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        <div className="flex items-center gap-1">
                          Purchase Date
                          <button onClick={toggleSortOrder} className="text-gray-400 hover:text-gray-600">
                            <ArrowUpDown size={12} />
                          </button>
                        </div>
                      </th>
                      {selectedMetric === 'paymentPending' && (
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Amount Due
                        </th>
                      )}
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {getMetricUsers(selectedMetric).length === 0 ? (
                      <tr>
                        <td colSpan={selectedMetric === 'paymentPending' ? 6 : 5} className="px-6 py-8 text-center text-gray-500">
                          No users found with the selected filters.
                        </td>
                      </tr>
                    ) : (
                      getMetricUsers(selectedMetric).map((user, index) => (
                        <tr 
                          key={user.id || index} 
                          onClick={() => handleUserClick(user.id)}
                          className="hover:bg-gray-50 cursor-pointer transition-colors"
                        >
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-blue-600 hover:text-blue-800">
                              {user.name}
                            </div>
                            <div className="text-xs font-medium text-gray-600 hover:text-blue-800">
                              {user.email}
                            </div>
                          </td>
                        
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {user.phone}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                              {user.planTitle}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {formatDate(user.purchasedDate)}
                          </td>
                          {selectedMetric === 'paymentPending' && (
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-red-600">
                              ₹{user.amountRemaining}
                            </td>
                          )}
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Footer with summary */}
              <div className="p-4 border-t border-gray-200 bg-gray-50">
                <div className="flex justify-between items-center text-sm text-gray-600">
                  <span>
                    Showing {getMetricUsers(selectedMetric).length} of {
                      (() => {
                        switch (selectedMetric) {
                          case 'enrolled':
                            return analyticsData.metrics.enrolled.users?.length || 0;
                          case 'todayEnrolled':
                            return analyticsData.metrics.todayEnrolled.users?.length || 0;
                          case 'paymentPending':
                            return analyticsData.metrics.paymentPending.users?.length || 0;
                          default:
                            return 0;
                        }
                      })()
                    } users
                  </span>
                  <span>
                    Sorted by purchase date ({sortOrder === 'desc' ? 'newest first' : 'oldest first'})
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* User Type Distribution */}
          {/* <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">User Type Distribution</h2>
            <div className="h-[300px] flex items-center justify-center">
              <Pie data={userTypeData} options={{ maintainAspectRatio: false }} />
            </div>
          </div> */}

          {/* Premium Plan Distribution */}
          {/* <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Premium Plan Distribution</h2>
            <div className="h-[300px] flex items-center justify-center">
              <Bar
                data={planWiseData}
                options={{
                  maintainAspectRatio: false,
                  scales: {
                    y: {
                      beginAtZero: true,
                    },
                  },
                }}
              />
            </div>
          </div> */}
        </div>

        {/* Add Batch Distribution Chart after existing charts */}
        {/* <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Batch-wise Distribution</h2>
            <div className="h-[300px] flex items-center justify-center">
              <Bar
                data={batchWiseData}
                options={{
                  maintainAspectRatio: false,
                  scales: {
                    y: {
                      beginAtZero: true,
                      ticks: {
                        stepSize: 1
                      }
                    }
                  },
                  plugins: {
                    legend: {
                      display: false
                    }
                  }
                }}
              />
            </div>
          </div>
        </div> */}

        {/* Form Progress Tracking Section */}
        <div className="bg-white p-6 rounded-lg shadow mt-8">
          <h2 className="text-xl font-semibold mb-6">Track Progress</h2>
          <FormProgressTracker />
        </div>


        {/* User List Section */}
        <div className="bg-white p-6 rounded-lg shadow mt-8">
          <h2 className="text-xl font-semibold mb-6">Lists Tracking</h2>
          <ListTracking />
        </div>

        <div className="bg-white p-6 rounded-lg shadow mt-8">
          <h2 className="text-xl font-semibold mb-6">CAP Progress</h2>
          <CapProgressTracker />
        </div>

        {/* Collapsible User List Section */}
        <div className="bg-white p-6 rounded-lg shadow mt-8">
          <div className="flex justify-between items-center mb-6 cursor-pointer"
               onClick={() => setIsUserListCollapsed(!isUserListCollapsed)}>
            <h2 className="text-xl font-semibold">User List</h2>
            <button className="p-2 hover:bg-gray-100 rounded-full">
              {isUserListCollapsed ? (
                <ChevronDown className="w-5 h-5" />
              ) : (
                <ChevronUp className="w-5 h-5" />
              )}
            </button>
          </div>

          {!isUserListCollapsed && (
            <>
              {/* Filters */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
                <h2 className="text-xl font-semibold mb-4 sm:mb-0">User List</h2>
                
                {/* Filters */}
                <div className="flex flex-wrap gap-4">
                  {/* Plan Filter */}
                  <div className="relative">
                    <select
                      value={filterPlan}
                      onChange={(e) => setFilterPlan(e.target.value)}
                      className="appearance-none bg-gray-50 border border-gray-300 rounded-lg py-2 pl-3 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="all">All Plans</option>
                      <option value="premium">Premium</option>
                      <option value="standard">Standard</option>
                    </select>
                    <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  </div>

                  {/* List Filter */}
                  <div className="relative">
                    <select
                      value={filterList}
                      onChange={(e) => setFilterList(e.target.value)}
                      className="appearance-none bg-gray-50 border border-gray-300 rounded-lg py-2 pl-3 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="all">All Users</option>
                      <option value="with">With Lists</option>
                      <option value="without">Without Lists</option>
                    </select>
                    <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  </div>

                  {/* Add Batch Filter */}
                  <div className="relative">
                    <select
                      value={filterBatch}
                      onChange={(e) => setFilterBatch(e.target.value)}
                      className="appearance-none bg-gray-50 border border-gray-300 rounded-lg py-2 pl-3 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="all">All Batches</option>
                      {Object.keys(metrics.batchWiseUsers).map(batch => (
                        <option key={batch} value={batch}>{batch}</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  </div>
                </div>
              </div>

              {/* Users Table */}
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Name</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Email</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Phone</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Lists</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Batch</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredUsers.map(user => (
                      <tr key={user.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{user.name}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500">{user.email}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500">{user.phone || "—"}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {user.isPremium ? (
                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                              Premium
                            </span>
                          ) : (
                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
                              Standard
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {user.lists && user.lists.length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                              {user.lists.slice(0, 2).map((list, idx) => (
                                <span key={idx} className="px-2 py-1 text-xs leading-tight rounded-full bg-indigo-100 text-indigo-800">
                                  {list.title}
                                </span>
                              ))}
                              {user.lists.length > 2 && (
                                <span className="px-2 py-1 text-xs leading-tight rounded-full bg-gray-100 text-gray-600">
                                  +{user.lists.length - 2} more
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-xs text-gray-500">No lists assigned</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                            {user.batch || 'Unassigned'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

// Metric Card Component
const MetricCard = ({ title, value, icon, color, onClick }) => (
  <div 
    className={`bg-white rounded-lg shadow p-6 ${onClick ? 'cursor-pointer hover:shadow-lg transition-shadow' : ''}`}
    onClick={onClick}
  >
    <div className="flex items-center">
      <div className={`${color} text-white p-3 rounded-lg mr-4`}>
        <span className="text-2xl">{icon}</span>
      </div>
      <div>
        <h3 className="text-gray-500 text-sm">{title}</h3>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
      </div>
    </div>
  </div>
);

export default AnalyticsDashboard;
