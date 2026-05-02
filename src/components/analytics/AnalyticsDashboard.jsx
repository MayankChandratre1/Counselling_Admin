import  { useEffect, useState } from 'react';
import {  ChevronDown, ChevronUp, X, Filter, ArrowDown, ArrowUp, ArrowUpDown, FileSpreadsheet, Calendar } from 'lucide-react';
import { useUsers } from '../../contexts/UsersContext';
import { useLists } from '../../contexts/ListsContext';
import { useAnalytics } from '../../contexts/analyticsContext';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement } from 'chart.js';
import FormProgressTracker from './FormProgressTracker';
import { FormProgressProvider } from '../../contexts/FormProgressContext';
import ListTracking from './ListTracking';
import CapProgressTracker from './CapProgressTracker';
import { useNavigate } from 'react-router-dom';
import { buildPurchaseYearOptions } from '../../utils/analyticsYearFilter';

ChartJS.register(ArcElement, CategoryScale, LinearScale, BarElement, Tooltip, Legend);

const AnalyticsDashboard = () => {
  const { users, loading: usersLoading, fetchUsers } = useUsers();
  const { lists, loading: listsLoading, fetchLists } = useLists();
  const { 
    analyticsData, 
    loading, 
    error, 
    fetchAnalyticsData, 
    refreshAnalytics,
    getMetricUsers,
    getUniquePlans,
    getDerivedMetrics,
    isDataStale,
    purchaseYearFilter,
    setPurchaseYearFilter,
  } = useAnalytics();

  // Get admin permissions
  const [allowedComponents, setAllowedComponents] = useState([]);

  useEffect(() => {
    const adminInfo = JSON.parse(sessionStorage.getItem('adminInfo') || '{}');
    const components = adminInfo?.permissions?.components || [];
    console.log('🔍 Admin Info:', adminInfo);
    console.log('🔍 Allowed Components:', components);
    setAllowedComponents(components);
  }, []);

  const canShow = (component) => {
    // Super-admin can see everything
    const adminInfo = JSON.parse(sessionStorage.getItem('adminInfo') || '{}');
    if (adminInfo?.role === 'super-admin') {
      console.log(`✅ Super-admin sees: ${component}`);
      return true;
    }
    
    const hasPermission = allowedComponents.includes(component);
    console.log(`🔍 Checking ${component}: ${hasPermission ? '✅ ALLOWED' : '❌ BLOCKED'}`);
    console.log(`🔍 Current allowedComponents:`, allowedComponents);
    return hasPermission;
  };

  const [filterPlan, setFilterPlan] = useState('all');
  const [filterList, setFilterList] = useState('all');
  const [filterBatch, setFilterBatch] = useState('all');
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [isUserListCollapsed, setIsUserListCollapsed] = useState(true);
  const [selectedMetric, setSelectedMetric] = useState(null);
  const [showMetricUsers, setShowMetricUsers] = useState(false);
  const [selectedMetricFilter, setSelectedMetricFilter] = useState('all');
  const [sortOrder, setSortOrder] = useState('desc');
  
  // Add date filter states
  const [dateFilters, setDateFilters] = useState({
    fromDate: '',
    toDate: ''
  });

  // Calculate local metrics for user list
  const [metrics, setMetrics] = useState({
    totalUsers: 0,
    premiumUsers: 0,
    standardUsers: 0,
    planWiseUsers: {},
    usersWithLists: 0,
    averageListsPerUser: 0,
    batchWiseUsers: {}
  });

  const navigate = useNavigate();

  useEffect(() => {
    const loadData = async () => {
      await Promise.all([
        fetchUsers(),
        fetchLists(),
        fetchAnalyticsData()
      ]);
    };
    loadData();
  }, [fetchUsers, fetchLists, fetchAnalyticsData]);

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
          (user.premiumPlan.purchasedDate && user.premiumPlan.purchasedDate._seconds ? user.premiumPlan.purchasedDate._seconds * 1000 : new Date(user.premiumPlan.purchasedDate).getTime())
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
      batchWiseUsers
    });
  };

  const getFilteredMetricUsers = (metricType) => {
    const filters = {
      planFilter: selectedMetricFilter,
      fromDate: dateFilters.fromDate,
      toDate: dateFilters.toDate,
      sortOrder: sortOrder
    };
    
    return getMetricUsers(metricType, filters);
  };

  const formatDate = (timestamp) => {
    if (!timestamp){
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
    return new Date((timestamp && timestamp._seconds ? timestamp._seconds * 1000 : new Date(timestamp).getTime())).toLocaleDateString('en-IN', {
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
    setDateFilters({
      fromDate: '',
      toDate: ''
    });
  };

  const hasActiveFilters = () => {
    return selectedMetricFilter !== 'all' || 
           sortOrder !== 'desc' || 
           dateFilters.fromDate || 
           dateFilters.toDate;
  };

  const exportToExcel = (metricType) => {
    const usersToExport = getFilteredMetricUsers(metricType);
    
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
      
      // Generate filename based on metric type and applied filters
      const getFileName = () => {
        const timestamp = new Date().toISOString().split('T')[0];
        let filename = '';
        
        switch (metricType) {
          case 'enrolled':
            filename = `enrolled_users_${timestamp}`;
            break;
          case 'todayEnrolled':
            filename = `today_enrollments_${timestamp}`;
            break;
          case 'paymentPending':
            filename = `payment_pending_users_${timestamp}`;
            break;
          default:
            filename = `users_export_${timestamp}`;
        }
        
        // Add filter info to filename
        if (hasActiveFilters()) {
          filename += '_filtered';
        }
        
        return `${filename}.csv`;
      };
      
      link.setAttribute('download', getFileName());
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const derivedMetrics = getDerivedMetrics();

  if (loading && !analyticsData.totalUsers) {
    return (
      <div className="p-6 bg-gray-50 min-h-screen">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            <span className="ml-3 text-lg text-gray-600">Loading analytics...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-gray-50 min-h-screen">
        <div className="max-w-7xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-red-800 mb-2">Error Loading Analytics</h2>
            <p className="text-red-600 mb-4">{error}</p>
            <button
              onClick={refreshAnalytics}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Analytics Dashboard</h1>
          <div className="flex items-center gap-4 flex-wrap justify-end">
            <div className="flex items-center gap-2">
              <label htmlFor="analytics-purchase-year" className="text-sm text-gray-600 whitespace-nowrap">
                Purchase year
              </label>
              <select
                id="analytics-purchase-year"
                value={purchaseYearFilter}
                onChange={(e) => setPurchaseYearFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="ALL">All years</option>
                {buildPurchaseYearOptions().map((y) => (
                  <option key={y} value={String(y)}>
                    {y}
                  </option>
                ))}
              </select>
            </div>
            {isDataStale && (
              <span className="text-amber-600 text-sm bg-amber-50 px-3 py-1 rounded-full">
                Data may be outdated
              </span>
            )}
            <button
              onClick={refreshAnalytics}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
              disabled={loading}
            >
              {loading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
              ) : (
                '🔄'
              )}
              Refresh
            </button>
          </div>
        </div>

        {derivedMetrics.lastUpdated && (
          <p className="text-sm text-gray-500 mb-6">
            Last updated: {derivedMetrics.lastUpdated}
          </p>
        )}

        {/* Key Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {canShow('installs-card') && (
            <MetricCard
              title="Installs"
              value={analyticsData.metrics.installs}
              icon="📱"
              color="bg-blue-500"
            />
          )}
          {canShow('enrolled-card') && (
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
          )}
          {canShow('today-enrolled-card') && (
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
          )}
          {canShow('payment-pending-card') && (
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
          )}
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
                    {getFilteredMetricUsers(selectedMetric).length} users
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
                      setDateFilters({ fromDate: '', toDate: '' });
                    }}
                    className="text-gray-400 hover:text-gray-500"
                  >
                    <X size={24} />
                  </button>
                </div>
              </div>
              
              {/* Filters Section */}
              <div className="p-4 border-b border-gray-200 bg-gray-50">
                <div className="flex items-center gap-4 flex-wrap">
                  {/* Date Range Filters */}
                  <div className="flex items-center gap-2">
                    <Calendar size={16} className="text-gray-500" />
                    <label className="text-sm font-medium text-gray-700">From:</label>
                    <input
                      type="date"
                      value={dateFilters.fromDate}
                      onChange={(e) => setDateFilters(prev => ({ ...prev, fromDate: e.target.value }))}
                      className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <label className="text-sm font-medium text-gray-700">To:</label>
                    <input
                      type="date"
                      value={dateFilters.toDate}
                      onChange={(e) => setDateFilters(prev => ({ ...prev, toDate: e.target.value }))}
                      className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

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

                  {/* Sort Order */}
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
                  {hasActiveFilters() && (
                    <button
                      onClick={resetFilters}
                      className="px-3 py-1 bg-gray-200 text-gray-700 rounded-md text-sm hover:bg-gray-300 transition-colors"
                    >
                      Reset Filters
                    </button>
                  )}
                </div>
              </div>

              {/* Users Table */}
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
                    {getFilteredMetricUsers(selectedMetric).length === 0 ? (
                      <tr>
                        <td colSpan={selectedMetric === 'paymentPending' ? 5 : 4} className="px-6 py-8 text-center text-gray-500">
                          No users found with the selected filters.
                        </td>
                      </tr>
                    ) : (
                      getFilteredMetricUsers(selectedMetric).map((user, index) => (
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

              {/* Footer with count and applied filters info */}
              <div className="p-4 border-t border-gray-200 bg-gray-50">
                <div className="flex justify-between items-center text-sm text-gray-600">
                  <span>
                    Showing {getFilteredMetricUsers(selectedMetric).length} of {
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
                    {hasActiveFilters() && <span className="text-blue-600 ml-1">(filtered)</span>}
                  </span>
                  <div className="flex items-center gap-4">
                    {dateFilters.fromDate && (
                      <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                        From: {new Date(dateFilters.fromDate).toLocaleDateString()}
                      </span>
                    )}
                    {dateFilters.toDate && (
                      <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                          To: {new Date(dateFilters.toDate).toLocaleDateString()}
                      </span>
                    )}
                    <span>
                      Sorted by purchase date ({sortOrder === 'desc' ? 'newest first' : 'oldest first'})
                    </span>
                  </div>
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
        {canShow('form-progress-tracker') && (
          <div className="bg-white p-6 rounded-lg shadow mt-8">
            <h2 className="text-xl font-semibold mb-6">Track Progress</h2>
            <FormProgressProvider>
              <FormProgressTracker />
            </FormProgressProvider>
          </div>
        )}

        {/* Lists Tracking Section */}
        {canShow('lists-tracking') && (
          <div className="bg-white p-6 rounded-lg shadow mt-8">
            <h2 className="text-xl font-semibold mb-6">Lists Tracking</h2>
            <ListTracking listData={analyticsData} />
          </div>
        )}

        {/* CAP Progress Section */}
        {canShow('cap-progress-tracker') && (
          <div className="bg-white p-6 rounded-lg shadow mt-8">
            <h2 className="text-xl font-semibold mb-6">CAP Progress</h2>
            <FormProgressProvider>
              <CapProgressTracker />
            </FormProgressProvider>
          </div>
        )}

        {/* Collapsible User List Section */}
        {canShow('user-list') && (
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
        )}
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
