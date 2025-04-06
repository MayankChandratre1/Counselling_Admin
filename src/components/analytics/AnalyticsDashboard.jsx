import React, { useEffect, useState } from 'react';
import { useUsers } from '../../contexts/UsersContext';
import { useLists } from '../../contexts/ListsContext';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement } from 'chart.js';
import { Pie, Bar } from 'react-chartjs-2';
import { ChevronDown, ChevronUp } from 'lucide-react';
import FormProgressTracker from './FormProgressTracker';

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
  const [filterPlan, setFilterPlan] = useState('all');
  const [filterList, setFilterList] = useState('all');
  const [filterBatch, setFilterBatch] = useState('all');
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [isUserListCollapsed, setIsUserListCollapsed] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      await Promise.all([
        fetchUsers(),
        fetchLists()
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

  const userTypeData = {
    labels: ['Premium Users', 'Standard Users'],
    datasets: [{
      data: [metrics.premiumUsers, metrics.standardUsers],
      backgroundColor: ['#4F46E5', '#9333EA'],
      borderColor: ['#4338CA', '#7E22CE'],
      borderWidth: 1,
    }],
  };

  const planWiseData = {
    labels: Object.keys(metrics.planWiseUsers),
    datasets: [{
      label: 'Users per Plan',
      data: Object.values(metrics.planWiseUsers),
      backgroundColor: [
        '#2563EB',
        '#7C3AED',
        '#EC4899',
        '#EF4444',
        '#F59E0B',
      ],
    }],
  };

  const batchWiseData = {
    labels: Object.keys(metrics.batchWiseUsers),
    datasets: [{
      label: 'Users per Batch',
      data: Object.values(metrics.batchWiseUsers),
      backgroundColor: [
        '#3B82F6', // blue
        '#10B981', // green
        '#F59E0B', // yellow
        '#EF4444', // red
        '#8B5CF6', // purple
        '#EC4899', // pink
        '#6366F1', // indigo
        '#14B8A6', // teal
      ],
      borderWidth: 1,
    }],
  };

  if (usersLoading || listsLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Analytics Dashboard</h1>

        {/* Key Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <MetricCard
            title="Total Users"
            value={metrics.totalUsers}
            icon="👥"
            color="bg-blue-500"
          />
          <MetricCard
            title="Premium Users"
            value={metrics.premiumUsers}
            icon="⭐"
            color="bg-purple-500"
          />
          <MetricCard
            title="Users with Lists"
            value={metrics.usersWithLists}
            icon="📋"
            color="bg-green-500"
          />
          <MetricCard
            title="Avg Lists/User"
            value={metrics.averageListsPerUser.toFixed(2)}
            icon="📊"
            color="bg-yellow-500"
          />
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* User Type Distribution */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">User Type Distribution</h2>
            <div className="h-[300px] flex items-center justify-center">
              <Pie data={userTypeData} options={{ maintainAspectRatio: false }} />
            </div>
          </div>

          {/* Premium Plan Distribution */}
          <div className="bg-white p-6 rounded-lg shadow">
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
          </div>
        </div>

        {/* Add Batch Distribution Chart after existing charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
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
        </div>

        {/* Form Progress Tracking Section */}
        <div className="bg-white p-6 rounded-lg shadow mt-8">
          <h2 className="text-xl font-semibold mb-6">Form Progress Analytics</h2>
          <FormProgressTracker />
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
const MetricCard = ({ title, value, icon, color }) => (
  <div className="bg-white rounded-lg shadow p-6">
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
