import React, { useState, useMemo } from 'react';
import { useUsers } from '../../contexts/UsersContext';
import { Maximize, X, Download, ChevronLeft, ChevronRight } from 'lucide-react';
import * as XLSX from 'xlsx';

const ListTracking = () => {
  const { users } = useUsers();
  const [showModal, setShowModal] = useState(false);
  const [selectedMetric, setSelectedMetric] = useState(null);
  const [activeTab, setActiveTab] = useState('complete');

  // Calculate metrics
  const metrics = {
    online: {
      withLists: users.filter(u => u.batch === 'online' && u.lists?.length > 0).length,
      withoutLists: users.filter(u => u.batch === 'online' && (!u.lists || u.lists.length === 0)).length,
    },
    offline: {
      withLists: users.filter(u => u.batch === 'offline' && u.lists?.length > 0).length,
      withoutLists: users.filter(u => u.batch === 'offline' && (!u.lists || u.lists.length === 0)).length,
    }
  };

  const getMetricUsers = (metricType) => {
    switch (metricType) {
      case 'online-with':
        return users.filter(u => u.batch === 'online' && u.lists?.length > 0);
      case 'online-without':
        return users.filter(u => u.batch === 'online' && (!u.lists || u.lists.length === 0));
      case 'offline-with':
        return users.filter(u => u.batch === 'offline' && u.lists?.length > 0);
      case 'offline-without':
        return users.filter(u => u.batch === 'offline' && (!u.lists || u.lists.length === 0));
      default:
        return [];
    }
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

    const users = useMemo(() => {
        return getMetricUsers(selectedMetric);
    }, [selectedMetric]);

    const filteredUsers = useMemo(() => {
        return users.filter(user => {
            if (!localSearch) return true;
            return (
                user.name?.toLowerCase().includes(localSearch.toLowerCase()) ||
                user.email?.toLowerCase().includes(localSearch.toLowerCase()) ||
                user.phone?.toLowerCase().includes(localSearch.toLowerCase())
            );
        });
    }, [users, localSearch]);

    const sortedUsers = useMemo(() => {
        const sorted = [...filteredUsers];
        if (sortConfig.key) {
            sorted.sort((a, b) => {
                if (a[sortConfig.key] < b[sortConfig.key]) 
                    return sortConfig.direction === 'asc' ? -1 : 1;
                if (a[sortConfig.key] > b[sortConfig.key]) 
                    return sortConfig.direction === 'asc' ? 1 : -1;
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

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg w-full max-w-6xl mx-4 max-h-[90vh] overflow-hidden">
                <div className="p-6 border-b border-gray-200">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-xl font-semibold">
                            {selectedMetric.includes('online') ? 'Online' : 'Offline'} Users - 
                            {selectedMetric.includes('with') ? ' With Lists' : ' Without Lists'}
                        </h3>
                        <div className="flex gap-2">
                            <button
                                onClick={() => exportToCSV(sortedUsers)}
                                className="px-4 py-2 border-2 border-green-500 bg-green-50 text-green-600 rounded-lg flex items-center gap-2 hover:bg-green-100"
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

                    {/* Search input */}
                    <input
                        type="text"
                        value={localSearch}
                        onChange={(e) => setLocalSearch(e.target.value)}
                        placeholder="Search users..."
                        className="w-full px-4 py-2 border rounded-lg mb-4"
                    />
                </div>

                <div className="overflow-auto max-h-[calc(90vh-200px)]">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50 sticky top-0">
                            <tr>
                                {['Name', 'Email', 'Phone', 'Lists'].map(header => (
                                    <th 
                                        key={header.toLowerCase()}
                                        onClick={() => handleSort(header.toLowerCase())}
                                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                                    >
                                        {header}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {currentItems.map(user => (
                                <tr key={user.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm">{user.name}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm">{user.email}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm">{user.phone}</td>
                                    <td className="px-6 py-4">
                                        {user.lists?.map(list => (
                                            <span key={list.id} className="inline-block px-2 py-1 m-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                                                {list.title}
                                            </span>
                                        ))}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Pagination controls */}
                <div className="p-4 border-t border-gray-200 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <select
                            value={itemsPerPage}
                            onChange={(e) => setItemsPerPage(Number(e.target.value))}
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

                    <div className="flex gap-2">
                        <button
                            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                            disabled={currentPage === 1}
                            className="p-2 rounded hover:bg-gray-100 disabled:opacity-50"
                        >
                            <ChevronLeft size={20} />
                        </button>
                        <button
                            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                            disabled={currentPage === totalPages}
                            className="p-2 rounded hover:bg-gray-100 disabled:opacity-50"
                        >
                            <ChevronRight size={20} />
                        </button>
                    </div>
                </div>
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
