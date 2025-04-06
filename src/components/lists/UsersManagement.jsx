import React, { useState, useEffect } from 'react';
import { useUsers } from '../../contexts/UsersContext';
import axios from "axios"

// Import all extracted components
import DraggableCollegeItem from './DraggableCollegeItem';
import UserEditForm from './UserEditForm';
import UserSearchForm from './UserSearchForm';
import UsersTable from './UsersTable';
import UserListModal from './UserListModal';
import ListSelectionModal from './ListSelectionModal';
import EditListModal from '../lists/EditListModal';
import ErrorDisplay from './ErrorDisplay';
import UserDetailsModal from './UserDetailsModal';

const API_URL = import.meta.env.VITE_REACT_APP_ADMIN_API_URL;

const UsersManagement = () => {
  const {
    users,
    loading,
    error,
    currentPage,
    pageSize,
    hasMore,
    setCurrentPage,
    setPageSize,
    fetchUsers,
    searchUsers,
    updateUser,
    deleteUser,
    setLoading,
    setError,
    setUsers
  } = useUsers();

  const getAuthAxios = () => {
    const token = localStorage.getItem('adminToken');
    return axios.create({
      baseURL: API_URL,
      headers: { token }
    });
  };

  // Local state for UI elements
  const [searchParams, setSearchParams] = useState({
    name: '',
    phone: ''
  });
  const [isSearchMode, setIsSearchMode] = useState(false);
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

  // Remove fetchUsers implementation and use context's fetchUsers
  useEffect(() => {
    if (!isSearchMode) {
      fetchUsers(currentPage);
    }
  }, [currentPage, pageSize, fetchUsers, isSearchMode]);

  const handleSearch = async (e) => {
    e.preventDefault();
    setIsSearchMode(true);
    const filteredParams = Object.entries(searchParams)
      .filter(([_, value]) => value !== '')
      .reduce((obj, [key, value]) => {
        obj[key] = value;
        return obj;
      }, {});
    await searchUsers(filteredParams);
  };

  const resetSearch = () => {
    setSearchParams({ name: '', phone: '' });
    setIsSearchMode(false);
    setCurrentPage(1);
    fetchUsers(1);
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
      setLoading(true);
      const authAxios = getAuthAxios();
      const response = await authAxios.get('/api/admin/lists');
      setAvailableLists(response.data);
      setError(null);
    } catch (err) {
      console.error('Error fetching lists:', err);
      setError('Failed to fetch lists');
    } finally {
      setLoading(false);
    }
  };

  const handleAddToList = async (userId) => {
    setSelectedUserId(userId);
    setShowListsModal(true);
    await fetchLists();
  };

  const handleViewUserLists = async (userId, userName) => {
    try {
      setLoading(true);
      setSelectedUserName(userName);
      setSelectedUserListsId(userId);
      
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
      setLoading(false);
    }
  };

  const handleListSelection = async (listId) => {
    try {
      setLoading(true);
      const authAxios = getAuthAxios();
      
      const listResponse = await authAxios.get(`/api/admin/list/${listId}`);
      const selectedList = listResponse.data;
      const timestamp = new Date().toISOString();
      
      const listAssignment = {
        id: `${listId}_${selectedUserId}_${timestamp}`,
        originalListId: listId,
        title: selectedList.title,
        colleges: selectedList.colleges || [],
        createdAt: timestamp,
        updatedAt: timestamp,
        customized: false,
        isCustomized: false
      };

      await authAxios.post(`/api/admin/user/${selectedUserId}/assign-list`, listAssignment);
      
      setUsers(users.map(user => {
        if (user.id === selectedUserId) {
          return {
            ...user,
            lists: [...(user.lists || []), listAssignment]
          };
        }
        return user;
      }));
      
      setShowListsModal(false);
      setSelectedUserId(null);
      setError(null);
      alert('List assigned to user successfully');
    } catch (err) {
      setError('Failed to add list to user');
      console.error('Error adding list to user:', err);
    } finally {
      setLoading(false);
    }
  };

  // Edit User List functions
  const handleEditUserList = (list) => {
    setEditingUserList(list);
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
        setLoading(true);
        const authAxios = getAuthAxios();
        await authAxios.delete(`/api/admin/user/${selectedUserListsId}/list/${list.id}`);
        
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
        setLoading(false);
      }
    }
  };

  const handleSaveUserList = async (listId) => {
    try {
      setLoading(true);
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
      
      const response = await authAxios.put(
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
      setLoading(false);
    }
  };

  const handleSaveOrder = async (updatedList) => {
    try {
      setLoading(true);
      const authAxios = getAuthAxios();
      
      const response = await authAxios.put(
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
      setLoading(false);
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
      
      const response = await authAxios.get('/api/admin/search-colleges', { params });
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

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">Users Management</h1>
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
        
        {/* Search Section */}
        <UserSearchForm 
          searchParams={searchParams}
          onParamChange={handleSearchParamChange}
          onSubmit={handleSearch}
          onReset={resetSearch}
        />
        
        {/* Users List */}
        <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
          <h2 className="text-xl font-semibold mb-6 text-gray-800">Users List</h2>
          
          <UsersTable 
            users={users}
            loading={loading}
            error={error}
            isSearchMode={isSearchMode}
            currentPage={currentPage}
            pageSize={pageSize}
            hasMore={hasMore}
            onPageChange={setCurrentPage}
            onPageSizeChange={(size) => {
              setPageSize(size);
              setCurrentPage(1);
            }}
            onAddToList={handleAddToList}
            onViewLists={handleViewUserLists}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onViewDetails={handleViewDetails}
          />
        </div>
        
        {/* List Selection Modal */}
        <ListSelectionModal 
          showModal={showListsModal}
          onClose={() => setShowListsModal(false)}
          loading={loading}
          availableLists={availableLists}
          selectedUserId={selectedUserId}
          onSelectList={handleListSelection}
        />

        {/* User List Modal */}
        <UserListModal 
          showModal={showUserListModal}
          onClose={() => setShowUserListModal(false)}
          loading={loading}
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

        <UserDetailsModal
          user={selectedUser}
          showModal={showDetailsModal}
          onClose={() => {
            setShowDetailsModal(false);
            setSelectedUser(null);
          }}
        />
      </div>
    </div>
  );
};

export default UsersManagement;