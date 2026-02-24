import React, { useEffect, useState } from 'react';
import { Menu, Calendar, Phone, User, Clock, CheckCircle, AlertCircle, XCircle, Edit2, RotateCcw, Search, Filter, X, ChevronDown, ChevronUp } from 'lucide-react';
import axiosInstance from '../utils/axios';
import Navbar from '../components/Navbar';

const Appointments = () => {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const [sortBy, setSortBy] = useState('newest');

  // Filter state
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    fromDate: '',
    toDate: '',
    status: ''
  });
  const [appliedFilters, setAppliedFilters] = useState({
    fromDate: '',
    toDate: '',
    status: ''
  });

  // Phone search state
  const [phoneSearch, setPhoneSearch] = useState('');
  const [isPhoneSearchActive, setIsPhoneSearchActive] = useState(false);

  // Add state for expanded reasons
  const [expandedReasons, setExpandedReasons] = useState(new Set());

  useEffect(() => {
    fetchAppointments();
  }, []);

  const fetchAppointments = async (filters = {}) => {
    try {
      setLoading(true);
      
      // Prepare query parameters
      const queryParams = new URLSearchParams();
      
      // Add applied filters
      if (filters.fromDate) {
        queryParams.append('fromDate', filters.fromDate);
      }
      if (filters.toDate) {
        queryParams.append('toDate', filters.toDate);
      }
      if (filters.status) {
        queryParams.append('status', filters.status);
      }
      
      // Add phone search if active
      if (phoneSearch.trim()) {
        queryParams.append('phone', phoneSearch.trim());
      }
      
     

      const url = `/api/admin/get-appointments${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
      const response = await axiosInstance.get(url);
      const data = response.data;
      setAppointments(data);
      setError(null);
    } catch (error) {
      console.error('Error fetching appointments:', error);
      setError('Failed to load appointments. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    return new Date((timestamp && timestamp._seconds ? timestamp._seconds * 1000 : new Date(timestamp).getTime())).toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const getStatusBadge = (status) => {
    const normalizedStatus = status?.toLowerCase() || 'pending';
    
    switch (normalizedStatus) {
      case 'confirmed':
        return {
          color: 'bg-blue-100 text-blue-800',
          icon: <CheckCircle size={14} />,
          text: 'Confirmed'
        };
      case 'completed':
        return {
          color: 'bg-green-100 text-green-800',
          icon: <CheckCircle size={14} />,
          text: 'Completed'
        };
      case 'pending':
      default:
        return {
          color: 'bg-yellow-100 text-yellow-800',
          icon: <Clock size={14} />,
          text: 'Pending'
        };
    }
  };

  const updateAppointmentStatus = async (appointmentId, newStatus) => {
    try {
      setUpdatingStatus(appointmentId);
      
      // Find the appointment to update
      const appointmentToUpdate = appointments.find(app => app.id === appointmentId);
      if (!appointmentToUpdate) {
        throw new Error('Appointment not found');
      }

      // Create updated appointment object
      const updatedAppointment = {
        ...appointmentToUpdate,
        status: newStatus
      };

      // Send update request
      await axiosInstance.put(`/api/admin/edit-appointment/${appointmentId}`, updatedAppointment);

      // Update local state
      setAppointments(prevAppointments =>
        prevAppointments.map(app =>
          app.id === appointmentId
            ? { ...app, status: newStatus }
            : app
        )
      );

    } catch (error) {
      console.error('Error updating appointment status:', error);
      alert('Failed to update appointment status. Please try again.');
    } finally {
      setUpdatingStatus(null);
    }
  };

  const getFilteredAndSortedAppointments = () => {
    let filtered = appointments;

    // Filter by status
    if (filterStatus !== 'all') {
      filtered = filtered.filter(app => 
        (app.status?.toLowerCase() || 'pending') === filterStatus
      );
    }

    // Sort appointments
    filtered.sort((a, b) => {
      const dateA = a.createdAt || 0;
      const dateB = b.createdAt || 0;
      
      switch (sortBy) {
        case 'newest':
          return dateB - dateA;
        case 'oldest':
          return dateA - dateB;
        case 'name':
          return (a.name || '').localeCompare(b.name || '');
        default:
          return dateB - dateA;
      }
    });

    return filtered;
  };

  const getStatusCounts = () => {
    return appointments.reduce((counts, app) => {
      const status = app.status?.toLowerCase() || 'pending';
      counts[status] = (counts[status] || 0) + 1;
      counts.total = (counts.total || 0) + 1;
      return counts;
    }, {});
  };

  const handleApplyFilters = () => {
    setAppliedFilters({ ...filters });
    setIsPhoneSearchActive(false); // Clear phone search when applying date/status filters
    setPhoneSearch('');
    fetchAppointments({
      ...appliedFilters,
      ...filters
    });
  };

  const handleClearFilters = () => {
    const clearedFilters = {
      fromDate: '',
      toDate: '',
      status: ''
    };
    setFilters(clearedFilters);
    setAppliedFilters(clearedFilters);
    setIsPhoneSearchActive(false);
    setPhoneSearch('');
    fetchAppointments();
  };

  const handlePhoneSearch = () => {
    if (phoneSearch.trim()) {
      setIsPhoneSearchActive(true);
      // Clear date/status filters when searching by phone
      setAppliedFilters({
        fromDate: '',
        toDate: '',
        status: ''
      });
      fetchAppointments({ phone: phoneSearch.trim() });
    }
  };

  const handleClearPhoneSearch = () => {
    setPhoneSearch('');
    setIsPhoneSearchActive(false);
    fetchAppointments();
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handlePhoneSearch();
    }
  };

  const toggleReasonExpansion = (appointmentId) => {
    setExpandedReasons(prev => {
      const newSet = new Set(prev);
      if (newSet.has(appointmentId)) {
        newSet.delete(appointmentId);
      } else {
        newSet.add(appointmentId);
      }
      return newSet;
    });
  };

  const truncateText = (text, maxLength = 50) => {
    if (!text || text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  const hasActiveFilters = () => {
    return appliedFilters.fromDate || appliedFilters.toDate || appliedFilters.status || isPhoneSearchActive;
  };

  const hasUnappliedChanges = () => {
    return JSON.stringify(filters) !== JSON.stringify(appliedFilters);
  };

  const statusCounts = getStatusCounts();
  const filteredAppointments = getFilteredAndSortedAppointments();

  if (loading) {
    return (
      <div className="flex h-screen bg-gray-100">
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Mobile menu button */}
      <button
        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        className="lg:hidden fixed top-4 left-4 z-20 p-2 rounded-md bg-gray-800 text-white"
      >
        <Menu size={24} />
      </button>

      {/* Sidebar */}
      <div className={`
        fixed inset-y-0 left-0 transform z-10
        lg:relative lg:translate-x-0 transition duration-200 ease-in-out
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <Navbar onClose={() => setIsSidebarOpen(false)} />
      </div>

      {/* Main content */}
      <div className="flex-1 overflow-auto p-4 md:p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 flex items-center">
                <Calendar className="mr-3 text-blue-600" size={32} />
                Appointments
              </h1>
              <p className="text-gray-600 mt-1">Manage and track appointment requests</p>
            </div>
            
            <div className="flex items-center gap-4">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors ${
                  hasActiveFilters()
                    ? 'bg-blue-50 border-blue-200 text-blue-700'
                    : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                <Filter size={16} />
                Filters
                {hasActiveFilters() && (
                  <span className="bg-blue-600 text-white text-xs rounded-full px-2 py-0.5 min-w-[20px] text-center">
                    {(appliedFilters.fromDate ? 1 : 0) + 
                     (appliedFilters.toDate ? 1 : 0) + 
                     (appliedFilters.status ? 1 : 0) + 
                     (isPhoneSearchActive ? 1 : 0)}
                  </span>
                )}
              </button>
              
              <button
                onClick={fetchAppointments}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-green-400 transition-colors"
              >
                <RotateCcw size={16} className={loading ? 'animate-spin' : ''} />
                {loading ? 'Refreshing...' : 'Refresh'}
              </button>
            </div>
          </div>

          {/* Error Display */}
          {error && (
            <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6">
              <div className="flex items-center">
                <XCircle className="mr-2" size={20} />
                {error}
              </div>
            </div>
          )}

          {/* Phone Search Section */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Search by Phone Number
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                  <input
                    type="text"
                    placeholder="Enter phone number..."
                    value={phoneSearch}
                    onChange={(e) => setPhoneSearch(e.target.value)}
                    onKeyPress={handleKeyPress}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
              
              <div className="flex flex-col justify-end gap-2">
                <button
                  onClick={handlePhoneSearch}
                  disabled={!phoneSearch.trim()}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-400 transition-colors"
                >
                  Search
                </button>
                {isPhoneSearchActive && (
                  <button
                    onClick={handleClearPhoneSearch}
                    className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                  >
                    Clear Search
                  </button>
                )}
              </div>
            </div>

            {isPhoneSearchActive && (
              <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800">
                  Showing results for phone number: <span className="font-medium">"{phoneSearch}"</span>
                  <span className="ml-2">({appointments.length} results found)</span>
                </p>
              </div>
            )}
          </div>

          {/* Filters Section */}
          {showFilters && (
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-800">Filters</h3>
                <div className="flex items-center gap-2">
                  {hasUnappliedChanges() && (
                    <span className="text-sm text-orange-600 bg-orange-50 px-2 py-1 rounded-full">
                      Unsaved changes
                    </span>
                  )}
                  <button
                    onClick={() => setShowFilters(false)}
                    className="text-gray-400 hover:text-gray-500"
                  >
                    <X size={20} />
                  </button>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                {/* Date From */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    From Date
                  </label>
                  <input
                    type="date"
                    value={filters.fromDate}
                    onChange={(e) => setFilters(prev => ({ ...prev, fromDate: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                {/* Date To */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    To Date
                  </label>
                  <input
                    type="date"
                    value={filters.toDate}
                    onChange={(e) => setFilters(prev => ({ ...prev, toDate: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                {/* Status Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Filter by Status
                  </label>
                  <select
                    value={filters.status}
                    onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">All Status</option>
                    <option value="pending">Pending</option>
                    <option value="confirmed">Confirmed</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>
              </div>

              {/* Filter Action Buttons */}
              <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                <div className="flex gap-3">
                  <button
                    onClick={handleApplyFilters}
                    disabled={!hasUnappliedChanges()}
                    className={`px-4 py-2 rounded-lg transition-colors ${
                      hasUnappliedChanges()
                        ? 'bg-blue-600 text-white hover:bg-blue-700'
                        : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                    }`}
                  >
                    Apply Filters
                  </button>
                  <button
                    onClick={handleClearFilters}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                  >
                    Clear All
                  </button>
                </div>

                {/* Current Applied Filters Display */}
                {hasActiveFilters() && (
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-gray-600">Applied:</span>
                    <div className="flex flex-wrap gap-2">
                      {appliedFilters.fromDate && (
                        <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs">
                          From: {new Date(appliedFilters.fromDate).toLocaleDateString()}
                        </span>
                      )}
                      {appliedFilters.toDate && (
                        <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs">
                          To: {new Date(appliedFilters.toDate).toLocaleDateString()}
                        </span>
                      )}
                      {appliedFilters.status && (
                        <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs">
                          Status: {appliedFilters.status}
                        </span>
                      )}
                      {isPhoneSearchActive && (
                        <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded-full text-xs">
                          Phone: {phoneSearch}
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Results Summary */}
              <div className="mt-4 text-sm text-gray-500">
                {loading ? (
                  'Loading...'
                ) : hasActiveFilters() ? (
                  `Showing ${appointments.length} filtered appointments`
                ) : (
                  `Showing ${appointments.length} appointments`
                )}
              </div>
            </div>
          )}

          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-lg shadow-md p-4">
              <div className="flex items-center">
                <div className="bg-blue-100 p-3 rounded-lg mr-4">
                  <Calendar className="text-blue-600" size={24} />
                </div>
                <div>
                  <h3 className="text-gray-500 text-sm">Total</h3>
                  <p className="text-2xl font-bold text-gray-900">{statusCounts.total || 0}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow-md p-4">
              <div className="flex items-center">
                <div className="bg-yellow-100 p-3 rounded-lg mr-4">
                  <Clock className="text-yellow-600" size={24} />
                </div>
                <div>
                  <h3 className="text-gray-500 text-sm">Pending</h3>
                  <p className="text-2xl font-bold text-gray-900">{statusCounts.pending || 0}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow-md p-4">
              <div className="flex items-center">
                <div className="bg-blue-100 p-3 rounded-lg mr-4">
                  <CheckCircle className="text-blue-600" size={24} />
                </div>
                <div>
                  <h3 className="text-gray-500 text-sm">Confirmed</h3>
                  <p className="text-2xl font-bold text-gray-900">{statusCounts.confirmed || 0}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow-md p-4">
              <div className="flex items-center">
                <div className="bg-green-100 p-3 rounded-lg mr-4">
                  <CheckCircle className="text-green-600" size={24} />
                </div>
                <div>
                  <h3 className="text-gray-500 text-sm">Completed</h3>
                  <p className="text-2xl font-bold text-gray-900">{statusCounts.completed || 0}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Appointments Table */}
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            {filteredAppointments.length === 0 ? (
              <div className="p-8 text-center">
                <Calendar className="mx-auto text-gray-400 mb-4" size={48} />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No appointments found</h3>
                <p className="text-gray-500">
                  {appointments.length === 0 
                    ? "No appointments have been submitted yet." 
                    : "No appointments match your current filters."}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        <div className="flex items-center">
                          <User size={14} className="mr-1" />
                          Applicant
                        </div>
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        <div className="flex items-center">
                          <Phone size={14} className="mr-1" />
                          Phone
                        </div>
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Reason
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        <div className="flex items-center">
                          <Calendar size={14} className="mr-1" />
                          Created At
                        </div>
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredAppointments.map((appointment) => {
                      const statusInfo = getStatusBadge(appointment.status);
                      const isUpdating = updatingStatus === appointment.id;
                      
                      return (
                        <tr key={appointment.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              {appointment.name}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {appointment.phone}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="max-w-xs">
                              {appointment.reason && appointment.reason.length > 50 ? (
                                <div>
                                  <div className="text-sm text-gray-900">
                                    {expandedReasons.has(appointment.id) 
                                      ? appointment.reason 
                                      : truncateText(appointment.reason, 50)
                                    }
                                  </div>
                                  <button
                                    onClick={() => toggleReasonExpansion(appointment.id)}
                                    className="mt-1 inline-flex items-center text-xs text-blue-600 hover:text-blue-800 font-medium"
                                  >
                                    {expandedReasons.has(appointment.id) ? (
                                      <>
                                        <ChevronUp size={14} className="mr-1" />
                                        Show less
                                      </>
                                    ) : (
                                      <>
                                        <ChevronDown size={14} className="mr-1" />
                                        Show more
                                      </>
                                    )}
                                  </button>
                                </div>
                              ) : (
                                <div className="text-sm text-gray-900">
                                  {appointment.reason}
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-500">
                              {formatDate(appointment.createdAt)}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusInfo.color}`}>
                              {statusInfo.icon}
                              <span className="ml-1">{statusInfo.text}</span>
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center space-x-2">
                              <select
                                value={appointment.status?.toLowerCase() || 'pending'}
                                onChange={(e) => updateAppointmentStatus(appointment.id, e.target.value)}
                                disabled={isUpdating}
                                className="text-sm border border-gray-300 rounded-md px-2 py-1 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                              >
                                <option value="pending">Pending</option>
                                <option value="confirmed">Confirmed</option>
                                <option value="completed">Completed</option>
                              </select>
                              {isUpdating && (
                                <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-blue-500"></div>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Appointments;