import React, { useState, useEffect } from 'react';
import { Search, Filter, X, ChevronDown, Menu, RefreshCw, ChevronUp } from 'lucide-react';
import { useUsers } from '../../contexts/UsersContext';
import { usePremiumPage } from '../../contexts/PremiumPageContext';
import UsersTable from './UsersTable';
import Navbar from '../Navbar';
import axios from "axios";
import { Link, useNavigate } from 'react-router-dom';

// Import all extracted components
import DraggableCollegeItem from './DraggableCollegeItem';
import UserEditForm from './UserEditForm';
import UserSearchForm from './UserSearchForm';
import UserListModal from './UserListModal';
import ListSelectionModal from './ListSelectionModal';
import EditListModal from '../lists/EditListModal';
import ErrorDisplay from './ErrorDisplay';
import UserDetailsModal from './UserDetailsModal';
import ListReleaseModal from './ListReleaseModal';
import { set } from 'lodash';
import axiosInstance from '../../utils/axios';

const API_URL = import.meta.env.VITE_REACT_APP_ADMIN_API_URL;

const PremiumUsersManagement = () => {
  const {
    users,
    loading,
    currentPage,
    pageSize,
    hasMore,
    totalUsersNumber,
    filters,
    isFilterActive,
    updateFilters,
    clearFilters,
    searchUsers,
    dataLoaded,
    fetchUsers,
    
    goToPage,
    changePageSize,
    refreshUsers,
    updateUser,
    deleteUser,
    setUsers,
    setPremiumUsersOnly
  } = useUsers();

  const { premiumPlans } = usePremiumPage();
  
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [searchParams, setSearchParams] = useState({
    name: '',
    phone: ''
  });
  
  // Local filter state (not applied until user clicks Apply)
  const [localFilters, setLocalFilters] = useState({
    plan: 'all',
    listAssigned: 'all'
  });
  
  const [showFilters, setShowFilters] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [isSearchMode, setIsSearchMode] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);

  // Additional state from older version
  const [loadingLists, setLoadingLists] = useState(false);
  const [error, setError] = useState(null);
  const [editingUser, setEditingUser] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    premium: false
  });
  const [showListsModal, setShowListsModal] = useState(false);
  const [availableLists, setAvailableLists] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [showUserListModal, setShowUserListModal] = useState(false);
  const [selectedUserLists, setSelectedUserLists] = useState([]);
  const [selectedUserListsId, setSelectedUserListsId] = useState(null);
  const [selectedUserName, setSelectedUserName] = useState("");
  const [editingUserList, setEditingUserList] = useState(null);
  const [showEditListModal, setShowEditListModal] = useState(false);
  const [editListFormData, setEditListFormData] = useState({
    title: '',
    colleges: []
  });
  const [searchCollegeQuery, setSearchCollegeQuery] = useState('');
  const [collegeSearchResults, setCollegeSearchResults] = useState([]);
  const [isSearchingColleges, setIsSearchingColleges] = useState(false);
  const [editingOrderList, setEditingOrderList] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedBatch, setSelectedBatch] = useState('all');
  const [uniqueBatches, setUniqueBatches] = useState([]);
  const [isSearchFormCollapsed, setIsSearchFormCollapsed] = useState(true);
  const [confirmationModal, setConfirmationModal] = useState({
    isOpen: false,
    userName: '',
    listTitle: '',
    onConfirm: null
  });
  const [selectedPlan, setSelectedPlan] = useState('all');
    const [uniquePlans, setUniquePlans] = useState([]);
  const [showListReleaseModal, setShowListReleaseModal] = useState(false);
  const [selectedUserForRelease, setSelectedUserForRelease] = useState(null);
  const navigation = useNavigate();

  const getAuthAxios = () => {
    const token = localStorage.getItem('adminToken');
    return axios.create({
      baseURL: API_URL,
      headers: { token }
    });
  };

  useEffect(() => {
    setPremiumUsersOnly(true);
    return () => {
      setPremiumUsersOnly(false);
    };
  }, [setPremiumUsersOnly])

  // Sync local filters with context filters when they change
  useEffect(() => {
    setLocalFilters(filters);
  }, [filters]);

  // Remove fetchUsers implementation and use context's fetchUsers
  useEffect(() => {
    if (!isSearchMode && !dataLoaded) {
      fetchUsers(currentPage,false, true);
    }
  }, [currentPage, pageSize, fetchUsers, isSearchMode, dataLoaded]);

  // Update this effect to extract unique premium plans instead of batches
  useEffect(() => {
    if (users.length > 0) {
      const plans = [...new Set(users.map(user => 
        user.premiumPlan?.planTitle || user.planTitle || 'No Plan'
      ))].sort();
      setUniquePlans(plans);
    }
  }, [users]);

  // Get unique plans from premium plans context
  const getAvailablePlans = () => {
    if (!premiumPlans || premiumPlans.length === 0) return [];
    return premiumPlans.map(plan => plan.title).filter(Boolean);
  };

  const handleLocalFilterChange = (filterType, value) => {
    setLocalFilters(prev => ({
      ...prev,
      [filterType]: value
    }));
  };

  const applyFilters = () => {
    updateFilters(localFilters, true);
  };

  const clearAllFilters = () => {
    setLocalFilters({
      plan: 'all',
      listAssigned: 'all'
    });
    clearFilters(true);
  };

  const getActiveFilterCount = () => {
    return Object.values(filters).filter(value => value !== 'all').length;
  };

  const hasUnappliedChanges = () => {
    return JSON.stringify(localFilters) !== JSON.stringify(filters);
  };

  const handleSearch = async () => {
    if (!searchParams.name.trim() && !searchParams.phone.trim()) {
      // If search is empty, go back to normal mode
      setIsSearchMode(false);
      setSearchResults([]);
      return;
    }

    try {
      setSearchLoading(true);
      const response = await axiosInstance.post('/api/admin/user/search', searchParams);
      const allResults = Array.isArray(response.data)
        ? response.data
        : (Array.isArray(response.data?.users) ? response.data.users : []);
      const premiumResults = allResults.filter(user =>
        user?.isPremium || !!user?.premiumPlan || !!user?.planTitle
      );

      setSearchResults(premiumResults);
      setIsSearchMode(true);
    } catch (error) {
      console.error('Search failed:', error);
      // Handle error (could show toast or error message)
    } finally {
      setSearchLoading(false);
    }
  };

  const clearSearch = () => {
    setSearchParams({ name: '', phone: '' });
    setSearchResults([]);
    setIsSearchMode(false);
    fetchUsers(1, true, true);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const resetSearch = () => {
    setSearchParams({ name: '', phone: '' });
    setIsSearchMode(false);
    goToPage(1, true);
    fetchUsers(1, false, true);
  };

  const handleEdit = async (user) => {
    setEditingUser(user);
    setFormData({
      name: user.name || '',
      phone: user.phone || '',
      email: user.email || '',
      premium: user.premium || false
    });
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      try {
        await deleteUser(id);
      } catch (err) {
        console.error('Error deleting user:', err);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await updateUser(editingUser.id, formData);
      setEditingUser(null);
      setFormData({ name: '', phone: '', email: '', premium: false });
    } catch (err) {
      console.error('Error saving user:', err);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const handleSearchParamChange = (e) => {
    const { name, value } = e.target;
    setSearchParams({ ...searchParams, [name]: value });
  };

  // User Lists Management
  const fetchLists = async () => {
    try {
      setLoadingLists(true);
      const authAxios = getAuthAxios();
      const response = await axiosInstance.get('/api/admin/lists');
      setAvailableLists(response.data);
      setError(null);
    } catch (err) {
      console.error('Error fetching lists:', err);
      setError('Failed to fetch lists');
    } finally {
      setLoadingLists(false);
    }
  };

  const assignListPayloadToUser = async (targetUserId, payload) => {
    const response = await axiosInstance.post(`/api/admin/user/${targetUserId}/assign-list`, payload);
    return response.data?.userList || response.data;
  };

  const handleAddToList = async (userId, userName) => {
    setSelectedUserId(userId);
    setSelectedUserName(userName); // Store userName for confirmation
    setShowListsModal(true);
    await fetchLists();
  };

  const handleViewUserLists = async (userId, userName) => {
    try {
      setLoadingLists(true);
      setSelectedUserName(userName);
      setSelectedUserListsId(userId);
      navigation(`/users/lists/${userId}`);
      const user = users.find(u => u.id === userId);
      if (user) {
        setSelectedUserLists(user.lists || []);
        setShowUserListModal(true);
      }
      setError(null);
    } catch (err) {
      console.error('Error fetching user lists:', err);
      setError('Failed to fetch user lists');
    } finally {
      setLoadingLists(false);
    }
  };

  const handleListSelection = async (listId) => {
    try {
        if(!selectedUserId.isPremium){
        setError('User is not a premium user. Please upgrade to assign lists.');
        return;
      }
      const authAxios = getAuthAxios();
      const listResponse = await axiosInstance.get(`/api/admin/list/${listId}`);
      const selectedList = listResponse.data;

      setConfirmationModal({
        isOpen: true,
        userName: selectedUserName,
        listTitle: selectedList.title,
        onConfirm: async () => {
          try {
            
            
            setLoadingLists(true);
            const timestamp = new Date().toISOString();
            const listAssignment = {
              id: `${listId}_${selectedUserId.id}_${timestamp}`,
              originalListId: listId,
              title: selectedList.title,
              colleges: selectedList.colleges || [],
              createdAt: timestamp,
              updatedAt: timestamp,
              customized: false,
              isCustomized: false
            };
            
            await axiosInstance.post(`/api/admin/user/${selectedUserId.id}/assign-list`, listAssignment);
            
            setUsers(users.map(user => {
              if (user.id === selectedUserId.id) {
                return {
                  ...user,
                  lists: [...(user.lists || []), listAssignment]
                };
              }
              return user;
            }));
            
            setConfirmationModal(prev => ({ ...prev, isOpen: false }));
            setShowListsModal(false);
            setSelectedUserId(null);
            setError(null);
            alert('List assigned to user successfully');
          } catch (err) {
            setError('Failed to add list to user');
            console.error('Error adding list to user:', err);
          } finally {
            setLoadingLists(false);
          }
        }
      });
    } catch (err) {
      console.error('Error getting list details:', err);
      setError('Failed to get list details');
    }
  };

  const handleCopyListFromUser = async (sourceList) => {
    try {
      if (!selectedUserId?.isPremium) {
        setError('User is not a premium user. Please upgrade to assign lists.');
        return;
      }

      setLoadingLists(true);

      const payload = {
        listId: sourceList?.originalListId || sourceList?.id,
        originalListId: sourceList?.originalListId || null,
        title: sourceList?.title || 'Copied List',
        colleges: Array.isArray(sourceList?.colleges) ? sourceList.colleges : [],
        isCustomized: !!(sourceList?.isCustomized ?? sourceList?.customized),
        customized: !!(sourceList?.customized ?? sourceList?.isCustomized)
      };

      const assignedList = await assignListPayloadToUser(selectedUserId.id, payload);

      setUsers(users.map(user => {
        if (user.id === selectedUserId.id) {
          return {
            ...user,
            lists: [...(user.lists || []), assignedList]
          };
        }
        return user;
      }));

      setShowListsModal(false);
      setSelectedUserId(null);
      setError(null);
      alert('Copied list assigned successfully');
    } catch (err) {
      console.error('Error copying list from user:', err);
      setError(err?.response?.data?.error || 'Failed to copy list from user');
    } finally {
      setLoadingLists(false);
    }
  };

  // Edit User List functions
  const handleEditUserList = (list) => {
    // Find the user data
    const selectedUser = users.find(u => u.id === selectedUserListsId);
    setEditingUserList({
      ...list,
      selectedUser // Add user data to the list object
    });
    setEditListFormData({
      title: list.title,
      colleges: list.colleges || [],
      originalListId: list.originalListId || list.id
    });
    setShowEditListModal(true);
  };

  const handleRemoveUserList = async (list) => {
    if (window.confirm('Are you sure you want to remove this list from the user?')) {
      try {
        setLoadingLists(true);
        const authAxios = getAuthAxios();
        await axiosInstance.delete(`/api/admin/user/${selectedUserListsId}/list/${list.id}`);
        
        setSelectedUserLists(prevLists => prevLists.filter(l => l.id !== list.id));
        setUsers(users.map(user => {
          if (user.id === selectedUserListsId) {
            return {
              ...user,
              lists: user.lists.filter(l => l.id !== list.id)
            };
          }
          return user;
        }));
        
        setError(null);
      } catch (err) {
        console.error('Error removing list:', err);
        setError('Failed to remove list');
      } finally {
        setLoadingLists(false);
      }
    }
  };

  const handleSaveUserList = async (listId) => {
    try {
      setLoadingLists(true);
      const authAxios = getAuthAxios();
      
      // Use the listId passed from EditListModal component
      const targetListId = listId || editingUserList.id || editingUserList.listId || editingUserList.originalListId;
      
      if (!targetListId) {
        throw new Error('No valid list ID found');
      }
      
      const listData = {
        title: editListFormData.title,
        colleges: editListFormData.colleges,
        isCustomized: true
      };
      
      console.log(`Saving list with ID: ${targetListId} for user ${selectedUserListsId}`);
      
      const response = await axiosInstance.put(
        `/api/admin/user/${selectedUserListsId}/list/${targetListId}`,
        listData
      );

      setSelectedUserLists(prevLists => 
        prevLists.map(list => 
          (list.id === targetListId || list.listId === targetListId) ? response.data : list
        )
      );

      setUsers(users.map(user => {
        if (user.id === selectedUserListsId) {
          return {
            ...user,
            lists: user.lists.map(list => 
              (list.id === targetListId || list.listId === targetListId) ? response.data : list
            )
          };
        }
        return user;
      }));

      setShowEditListModal(false);
      setEditingUserList(null);
      setError(null);
    } catch (err) {
      console.error('Error saving user list:', err);
      setError(`Failed to save user list: ${err.message}`);
    } finally {
      setLoadingLists(false);
    }
  };

  const handleSaveOrder = async (updatedList) => {
    try {
      setLoadingLists(true);
      const authAxios = getAuthAxios();
      
      const response = await axiosInstance.put(
        `/api/admin/user/${selectedUserListsId}/list/${updatedList.listId}`, 
        updatedList
      );
  
      setSelectedUserLists(prevLists => 
        prevLists.map(list => 
          list.listId === updatedList.listId ? response.data : list
        )
      );
  
      setUsers(users.map(user => {
        if (user.id === selectedUserListsId) {
          return {
            ...user,
            lists: user.lists.map(list => 
              list.listId === updatedList.listId ? response.data : list
            )
          };
        }
        return user;
      }));
      
      setError(null);
    } catch (err) {
      console.error('Error saving list order:', err);
      setError('Failed to save list order');
    } finally {
      setLoadingLists(false);
    }
  };

  // College Search and Management functions
  const searchColleges = async (query) => {
    try {
      setIsSearchingColleges(true);
      const authAxios = getAuthAxios();
      
      const params = {};
      if (query) {
        if (!isNaN(query)) {
          params.instituteCode = query;
        } else {
          params.instituteName = query;
        }
      }
      
      if (Object.keys(params).length === 0) {
        setCollegeSearchResults([]);
        setIsSearchingColleges(false);
        return;
      }
      
      const response = await axiosInstance.get('/api/admin/search-colleges', { params });
      setCollegeSearchResults(response.data);
    } catch (err) {
      console.error('Error searching colleges:', err);
      setCollegeSearchResults([]);
    } finally {
      setIsSearchingColleges(false);
    }
  };

  const handleSearchCollegeChange = (e) => {
    const value = e.target.value;
    setSearchCollegeQuery(value);
    const timeoutId = setTimeout(() => {
      searchColleges(value);
    }, 300);
    return () => clearTimeout(timeoutId);
  };

  const addCollegeToUserList = (college, branch = null, batchColleges = null) => {
    if (batchColleges) {
      setEditListFormData(prevData => ({
        ...prevData,
        colleges: [...prevData.colleges, ...batchColleges]
      }));
      return;
    }

    const uniqueId = branch ? `${college.id}_${branch.branchCode}` : college.id;
    if (!editListFormData.colleges.some(c => 
      (branch && c.id === college.id && c.selectedBranchCode === branch.branchCode) ||
      (!branch && c.id === college.id && !c.selectedBranchCode)
    )) {
      const collegeToAdd = {
        ...college,
        uniqueId,
        selectedBranch: branch ? branch.branchName : null,
        selectedBranchCode: branch ? branch.branchCode : null
      };
      setEditListFormData(prevData => ({
        ...prevData,
        colleges: [...prevData.colleges, collegeToAdd]
      }));
    }
  };

  const handleRemoveCollegeFromUserList = (collegeIndex) => {
    setEditListFormData(prevData => ({
      ...prevData,
      colleges: prevData.colleges.filter((_, idx) => idx !== collegeIndex)
    }));
  };

  const moveCollege = (dragIndex, hoverIndex) => {
    const dragCollege = editListFormData.colleges[dragIndex];
    const updatedColleges = [...editListFormData.colleges];
    updatedColleges.splice(dragIndex, 1);
    updatedColleges.splice(hoverIndex, 0, dragCollege);
    setEditListFormData(prevData => ({
      ...prevData,
      colleges: updatedColleges
    }));
  };

  const handleViewDetails = (user) => {
    setSelectedUser(user);
    setShowDetailsModal(true);
  };

  // Add refresh handler
  const handleRefresh = () => {
    if (isSearchMode) {
      // If in search mode, re-run the current search
      handleSearch();
    } else {
      // Otherwise, force refresh the user data
      refreshUsers(currentPage, true);
    }
  };

  // Add explicit handlers for pagination
  const handlePageChange = (newPage) => {
    goToPage(newPage, true);
  };
  
  const handlePageSizeChange = (newSize) => {
    changePageSize(newSize, true);
  };

  const handleOpenListReleaseModal = (user) => {
    setSelectedUserForRelease(user);
    setShowListReleaseModal(true);
  };

  const handleListReleased = (listId) => {
    // Update the users state by removing the released list from the user's createdList
    setUsers(prevUsers => 
      prevUsers.map(user => {
        if (user.id === selectedUserForRelease.id) {
          return {
            ...user,
            createdList: user.createdList?.filter(list => list.id !== listId) || []
          };
        }
        return user;
      })
    );
  };

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
      {/* <div className={`
        fixed inset-y-0 left-0 transform z-10
        lg:relative lg:translate-x-0 transition duration-200 ease-in-out
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <Navbar onClose={() => setIsSidebarOpen(false)} />
      </div> */}

      {/* Main content */}
      <div className="flex-1 overflow-auto p-4 md:p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header with Refresh Button */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">Users Management</h1>

            <div className="flex items-center gap-4">
              {totalUsersNumber && (
                <span className="text-sm text-gray-600">
                  Total: {totalUsersNumber.toLocaleString()} users
                </span>
              )}
              
              {/* Add Refresh Button */}
              <button
                onClick={()=>{
                    refreshUsers(1, true);
                }}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-green-400 transition-colors"
              >
                <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
                {loading ? 'Refreshing...' : 'Refresh'}
              </button>
              
              <Link to={"/add-user"} className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition duration-200">
                Add User
              </Link>
              
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors ${
                  isFilterActive
                    ? 'bg-blue-50 border-blue-200 text-blue-700'
                    : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                <Filter size={16} />
                Filters
                {getActiveFilterCount() > 0 && (
                  <span className="bg-blue-600 text-white text-xs rounded-full px-2 py-0.5 min-w-[20px] text-center">
                    {getActiveFilterCount()}
                  </span>
                )}
                <ChevronDown size={16} className={`transition-transform ${showFilters ? 'rotate-180' : ''}`} />
              </button>
            </div>
          </div>

          {/* Error display */}
          <ErrorDisplay error={error} />
          
          {/* Edit Form */}
          <UserEditForm 
            editingUser={editingUser} 
            formData={formData} 
            onSubmit={handleSubmit} 
            onChange={handleChange} 
            onCancel={() => setEditingUser(null)} 
          />

          {/* Collapsible Search Section */}
          <div className="mb-6">
            <button
              onClick={() => setIsSearchFormCollapsed(!isSearchFormCollapsed)}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-800 mb-2"
            >
              {isSearchFormCollapsed ? (
                <ChevronDown className="w-5 h-5" />
              ) : (
                <ChevronUp className="w-5 h-5" />
              )}
              {isSearchFormCollapsed ? 'Show Search' : 'Hide Search'}
            </button>
            
            {!isSearchFormCollapsed && (
              <UserSearchForm 
                searchParams={searchParams}
                onParamChange={handleSearchParamChange}
                onSubmit={(e) => { e.preventDefault(); handleSearch(); }}
                onReset={resetSearch}
              />
            )}
          </div>

          {/* Search Section */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Search by Name
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                  <input
                    type="text"
                    placeholder="Enter user name..."
                    value={searchParams.name}
                    onChange={(e) => setSearchParams(prev => ({ ...prev, name: e.target.value }))}
                    onKeyPress={handleKeyPress}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
              
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Search by Phone
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                  <input
                    type="text"
                    placeholder="Enter phone number..."
                    value={searchParams.phone}
                    onChange={(e) => setSearchParams(prev => ({ ...prev, phone: e.target.value }))}
                    onKeyPress={handleKeyPress}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Search Actions */}
              <div className="flex flex-col justify-end gap-2">
                <button
                  onClick={handleSearch}
                  disabled={searchLoading}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-400 transition-colors"
                >
                  {searchLoading ? 'Searching...' : 'Search'}
                </button>
                {isSearchMode && (
                  <button
                    onClick={clearSearch}
                    className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                  >
                    Clear Search
                  </button>
                )}
              </div>
            </div>

            {isSearchMode && (
              <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800">
                  Showing search results for: 
                  {searchParams.name && <span className="font-medium"> "{searchParams.name}"</span>}
                  {searchParams.name && searchParams.phone && <span> and </span>}
                  {searchParams.phone && <span className="font-medium"> "{searchParams.phone}"</span>}
                  <span className="ml-2">({searchResults?.length} results found)</span>
                </p>
              </div>
            )}
          </div>

          {/* Filters Section */}
          {showFilters && (
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-800">Filters</h3>
                {hasUnappliedChanges() && (
                  <span className="text-sm text-orange-600 bg-orange-50 px-2 py-1 rounded-full">
                    Unsaved changes
                  </span>
                )}
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                {/* Plan Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Filter by Plan
                  </label>
                  <select
                    value={localFilters.plan}
                    onChange={(e) => handleLocalFilterChange('plan', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="all">All Plans</option>
                    
                    <optgroup label="Specific Plans">
                      {getAvailablePlans().map(plan => (
                        <option key={plan} value={plan}>
                          {plan}
                        </option>
                      ))}
                    </optgroup>
                  </select>
                </div>

                {/* List Assigned Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Filter by List Assignment
                  </label>
                  <select
                    value={localFilters.listAssigned}
                    onChange={(e) => handleLocalFilterChange('listAssigned', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="all">All Users</option>
                    <option value="true">Users with Lists</option>
                    <option value="false">Users without Lists</option>
                  </select>
                </div>
              </div>

              {/* Filter Action Buttons */}
              <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                <div className="flex gap-3">
                  <button
                    onClick={applyFilters}
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
                    onClick={clearAllFilters}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                  >
                    Clear All
                  </button>
                </div>

                {/* Current Applied Filters Display */}
                {isFilterActive && (
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-gray-600">Applied:</span>
                    <div className="flex flex-wrap gap-2">
                      {filters.plan !== 'all' && (
                        <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs">
                          Plan: {filters.plan}
                        </span>
                      )}
                      {filters.listAssigned !== 'all' && (
                        <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs">
                          Lists: {filters.listAssigned === 'true' ? 'Assigned' : 'Not Assigned'}
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
                ) : isSearchMode ? (
                  `Showing ${searchResults.length} search results`
                ) : isFilterActive ? (
                  `Showing ${users.length} filtered users`
                ) : (
                  `Showing ${users.length} users`
                )}
              </div>
            </div>
          )}

          {/* Plan Tabs - Updated from Batch Tabs */}
          <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
            {/* <div className="border-b border-gray-200 mb-6">
              <div className="flex gap-2 overflow-x-auto pb-2">
                <button
                  onClick={() => setSelectedPlan('all')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap ${
                    selectedPlan === 'all'
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  All Premium Users
                </button>
                {uniquePlans.map(plan => (
                  <button
                    key={plan}
                    onClick={() => setSelectedPlan(plan)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap ${
                      selectedPlan === plan
                        ? 'bg-blue-100 text-blue-700'
                        : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    {plan}
                  </button>
                ))}
              </div>
            </div> */}

            <h2 className="text-xl font-semibold mb-6 text-gray-800">
              {selectedPlan === 'all' ? 'All Premium Users' : `${selectedPlan} Users`}
            </h2>
            
            <UsersTable 
              users={(isSearchMode ? searchResults : users).filter(user => {
                if (selectedPlan === 'all') return true;
                const userPlan = user.premiumPlan?.planTitle || user.planTitle || 'No Plan';
                return userPlan === selectedPlan;
              })}
              loading={loading || searchLoading}
              error={null}
              isSearchMode={isSearchMode}
              currentPage={currentPage}
              pageSize={pageSize}
              hasMore={hasMore}
              onPageChange={handlePageChange}
              onPageSizeChange={handlePageSizeChange}
              onAddToList={handleAddToList}
              onViewLists={handleViewUserLists}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onViewDetails={handleViewDetails}
              onOpenListReleaseModal={handleOpenListReleaseModal}
            />
          </div>

          {/* List Selection Modal */}
          <ListSelectionModal 
            showModal={showListsModal}
            onClose={() => setShowListsModal(false)}
            loading={loadingLists}
            availableLists={availableLists}
            selectedUserId={selectedUserId}
            onSelectList={handleListSelection}
            onSelectUserListCopy={handleCopyListFromUser}
          />

          {/* User List Modal */}
          <UserListModal 
            showModal={showUserListModal}
            onClose={() => setShowUserListModal(false)}
            loading={loadingLists}
            userLists={selectedUserLists}
            userName={selectedUserName}
            onEditList={handleEditUserList}
            onRemoveList={handleRemoveUserList}
            onSetEditingOrderList={setEditingOrderList}
          />

          {/* Edit List Modal */}
          <EditListModal 
            show={showEditListModal}
            onClose={() => setShowEditListModal(false)}
            editingUserList={editingUserList || {}}
            selectedUser={editingUserList?.selectedUser}
            editListFormData={editListFormData}
            setEditListFormData={setEditListFormData}
            searchCollegeQuery={searchCollegeQuery}
            handleSearchCollegeChange={handleSearchCollegeChange}
            isSearchingColleges={isSearchingColleges}
            collegeSearchResults={collegeSearchResults}
            searchColleges={searchColleges}
            addCollegeToUserList={addCollegeToUserList}
            handleRemoveCollegeFromUserList={handleRemoveCollegeFromUserList}
            moveCollege={moveCollege}
            handleSaveUserList={handleSaveUserList}
          />
          
          {/* Order Editable List Modal */}
          {editingOrderList && (
            <OrderEditableList
              list={editingOrderList}
              onClose={() => setEditingOrderList(null)}
              onSave={handleSaveOrder}
            />
          )}

          {/* Add Confirmation Modal */}
          {confirmationModal.isOpen && (
            <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full mx-4">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium text-gray-900">Confirm List Assignment</h3>
                  <button
                    onClick={() => setConfirmationModal(prev => ({ ...prev, isOpen: false }))}
                    className="text-gray-400 hover:text-gray-500 transition-colors"
                  >
                    <X size={20} />
                  </button>
                </div>
                <p className="text-gray-600 mb-6">
                  Do you want to assign <span className="font-medium">{confirmationModal.listTitle}</span> to <span className="font-medium">{confirmationModal.userName}</span>?
                </p>
                <div className="flex justify-end gap-3">
                  <button
                    onClick={() => setConfirmationModal(prev => ({ ...prev, isOpen: false }))}
                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={confirmationModal.onConfirm}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                  >
                    Confirm
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* List Release Modal */}
          <ListReleaseModal 
            showModal={showListReleaseModal}
            onClose={() => {
              setShowListReleaseModal(false);
              setSelectedUserForRelease(null);
            }}
            selectedUser={selectedUserForRelease}
            onListReleased={handleListReleased}
          />
        </div>
      </div>
    </div>
  );
};

export default PremiumUsersManagement;
