import React, { useState, useEffect } from 'react';
import { X, Edit, Trash2, GraduationCap, Search, Save, ChevronDown, ChevronUp, Calendar, User, Copy, Tag, Users, Check, ArrowLeft } from 'lucide-react';
import CollegesListModal from './CollegesListModal';
import axiosInstance from '../../utils/axios';
import ListDetails from '../lists/ListDetails';

const UserListModal = ({ 
  showModal, 
  onClose, 
  loading, 
  userLists, 
  userName, 
  userId,
  onEditList, 
  onRemoveList, 
  createdLists,
  onSetEditingOrderList,
  users = [],
  onAssignListToUsers
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedList, setSelectedList] = useState(null);
  const [editListFormData, setEditListFormData] = useState({ colleges: [] });
  const [saveAsTemplateModal, setSaveAsTemplateModal] = useState({
    isOpen: false,
    list: null,
    title: ''
  });
  const [expandedListId, setExpandedListId] = useState(null);
  const [copiedCodes, setCopiedCodes] = useState({});
  const [freshUserData, setFreshUserData] = useState(null);
  const [isFetching, setIsFetching] = useState(false);
  const [assignModal, setAssignModal] = useState({
    isOpen: false,
    list: null,
    selectedUserIds: [],
    searchQuery: '',
    assigning: false
  });
  const [assignSearchResults, setAssignSearchResults] = useState([]);
  const [assignSearchLoading, setAssignSearchLoading] = useState(false);

  // Fetch fresh user data when modal opens
  useEffect(() => {
    if (showModal && userId && !freshUserData) {
      const fetchUserData = async () => {
        try {
          setIsFetching(true);
          console.log(`[UserListModal] Fetching fresh data for user ${userId}`);
          const response = await axiosInstance.get(`/api/admin/user/${userId}`);
          const userData = response.data;
          
          // Normalize lists
          const normalizedLists = (userData.lists || []).map(list => ({
            ...list,
            id: list.id || list._id,
            colleges: Array.isArray(list.colleges) ? list.colleges : []
          }));
          
          const normalizedCreatedLists = (userData.createdList || []).map(list => ({
            ...list,
            id: list.id || list._id,
            colleges: Array.isArray(list.colleges) ? list.colleges : []
          }));
          
          console.log(`[UserListModal] Fetched fresh data: ${normalizedLists.length} assigned lists, ${normalizedCreatedLists.length} created lists`);
          normalizedLists.forEach((list, idx) => {
            console.log(`  List ${idx}: "${list.title}", id="${list.id}", colleges=${list.colleges?.length || 0}`);
          });
          
          setFreshUserData({
            lists: normalizedLists,
            createdList: normalizedCreatedLists
          });
        } catch (err) {
          console.error(`[UserListModal] Error fetching user data:`, err);
        } finally {
          setIsFetching(false);
        }
      };
      
      fetchUserData();
    }
  }, [showModal, userId, freshUserData]);

  // Use fresh data if available, otherwise use props
  const listsToUse = freshUserData ? freshUserData.lists : (userLists || []);
  const createdListsToUse = freshUserData ? freshUserData.createdList : (createdLists || []);

  // Normalize lists to ensure id and colleges are always present
  const normalizedUserLists = listsToUse.map(list => ({
    ...list,
    id: list.id || list._id,
    colleges: Array.isArray(list.colleges) ? list.colleges : []
  }));

  // Simplified filter to only search by title
  const filteredLists = normalizedUserLists.filter(list => 
    !searchQuery || list.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Normalize and filter created lists with the same search criteria
  const normalizedCreatedLists = createdListsToUse ? createdListsToUse.map(list => ({
    ...list,
    id: list.id || list._id,
    colleges: Array.isArray(list.colleges) ? list.colleges : []
  })) : [];
  
  const filteredCreatedLists = normalizedCreatedLists.filter(list => 
    !searchQuery || list.title.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  // Log for debugging
  console.log(`[UserListModal] Rendering with ${normalizedUserLists.length} lists, ${filteredLists.length} filtered`);
  filteredLists.forEach((list, idx) => {
    console.log(`  List ${idx}: "${list.title}", id="${list.id}", colleges=${list.colleges?.length || 0}`);
  });

  const handleListClick = (listId) => {
    setExpandedListId(expandedListId === listId ? null : listId);
  };

  const handleListTitleClick = (list) => {
    // Ensure colleges is an array before mapping
    const collegesArray = Array.isArray(list.colleges) ? list.colleges : [];
    const listId = list.id || list._id;
    
    console.log(`Viewing list "${list.title}" with ${collegesArray.length} colleges, ID: ${listId}`);
    
    // Create a copy of the list with indexed colleges
    const indexedList = {
      ...list,
      id: listId,
      colleges: collegesArray.map((college, index) => ({
        ...college,
        index: index + 1
      }))
    };
    
    setSelectedList(indexedList);
  };

  const handleAddSelectedColleges = (selectedColleges) => {
    // Add selected colleges to edit form data
    setEditListFormData(prev => ({
      ...prev,
      colleges: [...prev.colleges, ...selectedColleges]
    }));
    setSelectedList(null); // Close the modal
  };

  const handleSaveAsTemplate = async () => {
    try {
      const collegesArray = Array.isArray(saveAsTemplateModal.list.colleges) ? saveAsTemplateModal.list.colleges : [];
      const submitData = {
        title: saveAsTemplateModal.title,
        colleges: collegesArray.map(college => ({
          ...college,
          branches: undefined,
          searchIndex: undefined,
          additionalMetadata: undefined,
          keywords: undefined,
        })),
        userIds: []
      };

      await axiosInstance.post('/api/admin/add-list', submitData);
      setSaveAsTemplateModal({ isOpen: false, list: null, title: '' });
      alert('Template saved successfully!');
    } catch (err) {
      console.error('Error saving template:', err);
      alert('Failed to save template');
    }
  };

  

  // Function to handle copying of branch code
  const handleCopyBranchCode = (college) => {
    const code = college.selectedBranchCode;
    if (!code) return;
    
    navigator.clipboard.writeText(code)
      .then(() => {
        setCopiedCodes(prev => ({
          ...prev,
          [college.uniqueId || college.id]: true
        }));
      })
      .catch(err => {
        console.error('Failed to copy: ', err);
      });
  };
  
  const isCodeCopied = (collegeId) => {
    return copiedCodes[collegeId] || false;
  };
  
  const resetCopiedStatus = () => {
    setCopiedCodes({});
  };

  const openAssignModal = (list) => {
    setAssignModal({
      isOpen: true,
      list,
      selectedUserIds: [],
      searchQuery: '',
      assigning: false
    });
  };

  const closeAssignModal = () => {
    setAssignModal({
      isOpen: false,
      list: null,
      selectedUserIds: [],
      searchQuery: '',
      assigning: false
    });
    setAssignSearchResults([]);
    setAssignSearchLoading(false);
  };

  useEffect(() => {
    if (!assignModal.isOpen) return;

    const query = assignModal.searchQuery.trim();
    if (!query) {
      const localUsers = users.filter(user => user?.id && user.id !== userId);
      setAssignSearchResults(localUsers);
      setAssignSearchLoading(false);
      return;
    }

    let isActive = true;
    const timer = setTimeout(async () => {
      try {
        setAssignSearchLoading(true);
        const payload = /^\d+$/.test(query) ? { phone: query } : { name: query };
        const response = await axiosInstance.post('/api/admin/user/search', payload);
        const normalized = Array.isArray(response.data)
          ? response.data
          : (Array.isArray(response.data?.users) ? response.data.users : []);

        if (!isActive) return;
        setAssignSearchResults(normalized.filter(user => user?.id && user.id !== userId));
      } catch (error) {
        if (!isActive) return;
        console.error('Error searching users for assignment:', error);
        setAssignSearchResults([]);
      } finally {
        if (isActive) {
          setAssignSearchLoading(false);
        }
      }
    }, 250);

    return () => {
      isActive = false;
      clearTimeout(timer);
    };
  }, [assignModal.isOpen, assignModal.searchQuery, users, userId]);

  const toggleAssignUser = (targetUserId) => {
    setAssignModal(prev => ({
      ...prev,
      selectedUserIds: prev.selectedUserIds.includes(targetUserId)
        ? prev.selectedUserIds.filter(id => id !== targetUserId)
        : [...prev.selectedUserIds, targetUserId]
    }));
  };

  const handleAssignToSelectedUsers = async () => {
    if (!assignModal.list || !onAssignListToUsers || assignModal.selectedUserIds.length === 0) return;

    try {
      setAssignModal(prev => ({ ...prev, assigning: true }));

      const mergedCandidates = [...assignSearchResults, ...users];
      const uniqueById = mergedCandidates.reduce((acc, user) => {
        if (user?.id && !acc.some(item => item.id === user.id)) {
          acc.push(user);
        }
        return acc;
      }, []);

      const targetUsers = uniqueById.filter(user => assignModal.selectedUserIds.includes(user.id));
      const result = await onAssignListToUsers(assignModal.list, targetUsers);

      if (result?.successCount > 0) {
        alert(`Assigned list to ${result.successCount} user(s) successfully${result.failed?.length ? `, ${result.failed.length} failed` : ''}`);
      } else {
        alert('No users were assigned.');
      }

      closeAssignModal();
    } catch (error) {
      console.error('Error assigning list to selected users:', error);
      alert('Failed to assign list to selected users');
      setAssignModal(prev => ({ ...prev, assigning: false }));
    }
  };

  const assignedListItems = filteredLists.map(list => ({
    ...list,
    panelKey: list.id,
    isCreatedList: false
  }));

  const createdListItems = filteredCreatedLists.map(list => ({
    ...list,
    panelKey: `created-${list.id}`,
    isCreatedList: true
  }));

  const allVisibleListItems = [...assignedListItems, ...createdListItems];
  const expandedList = allVisibleListItems.find(list => list.panelKey === expandedListId) || null;

  useEffect(() => {
    if (expandedListId && !allVisibleListItems.some(list => list.panelKey === expandedListId)) {
      setExpandedListId(null);
    }
  }, [expandedListId, allVisibleListItems]);

  if (!showModal) return null;

  return (
    <div className="fixed inset-0 bg-white z-50 flex flex-col h-screen w-screen">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 px-6 py-4 flex justify-between items-center">
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={onClose}
            className="text-white hover:bg-white/20 transition-all rounded-lg p-2 flex items-center"
            aria-label="Back"
          >
            <ArrowLeft size={20} />
          </button>
          <h2 className="text-2xl font-bold text-white flex items-center truncate">
            <GraduationCap size={26} className="mr-3 flex-shrink-0" />
            <span className="truncate">Lists for {userName}</span>
          </h2>
        </div>

        <button
          onClick={onClose}
          className="text-white hover:bg-white/20 transition-all rounded-full p-2"
          aria-label="Close modal"
        >
          <X size={24} />
        </button>
      </div>

      {/* Main Content */}
      <div className="flex-grow bg-gray-100 min-h-0">
        <div className="h-full px-6 py-6">
          <div className="h-full grid grid-cols-12 gap-6">
            <div className="col-span-12 lg:col-span-4 bg-white border border-gray-200 rounded-lg shadow-sm flex flex-col min-h-0">
              <div className="p-4 border-b border-gray-200">
                <div className="relative">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Search lists by title..."
                  />
                  <Search
                    size={18}
                    className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      <X size={16} />
                    </button>
                  )}
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-5">
                {(loading || isFetching) ? (
                  <div className="flex justify-center items-center h-32">
                    <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
                  </div>
                ) : (
                  <>
                    <div>
                      <h3 className="text-sm font-semibold text-blue-700 mb-2 flex items-center">
                        <Tag size={14} className="mr-2" /> Assigned Lists ({assignedListItems.length})
                      </h3>
                      <div className="space-y-2">
                        {assignedListItems.length > 0 ? assignedListItems.map(list => (
                          <button
                            key={list.panelKey}
                            onClick={() => handleListClick(list.panelKey)}
                            className={`w-full text-left p-3 border rounded-lg transition-colors ${
                              expandedListId === list.panelKey
                                ? 'border-blue-300 bg-blue-50'
                                : 'border-gray-200 hover:bg-gray-50'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <div className="min-w-0">
                                <div className="font-medium text-gray-800 truncate">{list.title}</div>
                                <div className="text-xs text-gray-500 mt-1">{list.colleges?.length || 0} colleges</div>
                              </div>
                              {expandedListId === list.panelKey ? (
                                <ChevronUp size={16} className="text-blue-600 ml-2" />
                              ) : (
                                <ChevronDown size={16} className="text-gray-400 ml-2" />
                              )}
                            </div>
                          </button>
                        )) : (
                          <div className="text-sm text-gray-500 px-1">No assigned lists.</div>
                        )}
                      </div>
                    </div>

                    <div className="pt-4 border-t border-gray-200">
                      <h3 className="text-sm font-semibold text-green-700 mb-2">Created Lists ({createdListItems.length})</h3>
                      <div className="space-y-2">
                        {createdListItems.length > 0 ? createdListItems.map(list => (
                          <button
                            key={list.panelKey}
                            onClick={() => handleListClick(list.panelKey)}
                            className={`w-full text-left p-3 border rounded-lg transition-colors ${
                              expandedListId === list.panelKey
                                ? 'border-green-300 bg-green-50'
                                : 'border-gray-200 hover:bg-gray-50'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <div className="min-w-0">
                                <div className="font-medium text-gray-800 truncate">{list.title}</div>
                                <div className="text-xs text-gray-500 mt-1">{list.colleges?.length || 0} colleges</div>
                              </div>
                              {expandedListId === list.panelKey ? (
                                <ChevronUp size={16} className="text-green-600 ml-2" />
                              ) : (
                                <ChevronDown size={16} className="text-gray-400 ml-2" />
                              )}
                            </div>
                          </button>
                        )) : (
                          <div className="text-sm text-gray-500 px-1">No created lists.</div>
                        )}
                      </div>
                    </div>

                    {!loading && !isFetching && allVisibleListItems.length === 0 && (
                      <div className="text-center py-10 text-gray-500 text-sm">
                        {searchQuery ? 'No lists match your search.' : 'No lists found for this user.'}
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>

            <div className="col-span-12 lg:col-span-8 bg-white border border-gray-200 rounded-lg shadow-sm flex flex-col min-h-0">
              {expandedList ? (
                <>
                  <div className={`p-4 border-b border-gray-200 ${expandedList.isCreatedList ? 'bg-green-50' : 'bg-blue-50'}`}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="text-lg font-semibold text-gray-900 truncate">{expandedList.title}</h3>
                          {expandedList.isCreatedList && (
                            <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full">Created</span>
                          )}
                        </div>
                        <div className="flex items-center flex-wrap gap-3 mt-1 text-sm text-gray-600">
                          <span>{expandedList.colleges?.length || 0} colleges</span>
                          {expandedList.createdAt && (
                            <span className="inline-flex items-center">
                              <Calendar size={14} className="mr-1" />
                              {new Date(expandedList.createdAt).toLocaleDateString()}
                            </span>
                          )}
                          {expandedList.createdBy && (
                            <span className="inline-flex items-center">
                              <User size={14} className="mr-1" />
                              {expandedList.createdBy}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => onEditList(expandedList.isCreatedList ? expandedList : { ...expandedList, id: expandedList.id })}
                          className={`p-2 rounded-md transition-colors ${expandedList.isCreatedList ? 'text-green-600 hover:bg-green-100' : 'text-blue-600 hover:bg-blue-100'}`}
                          title="Customize"
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          onClick={() => setSaveAsTemplateModal({
                            isOpen: true,
                            list: expandedList,
                            title: `${expandedList.title} - Template`
                          })}
                          className="p-2 text-purple-600 hover:bg-purple-100 rounded-md transition-colors"
                          title="Save as template"
                        >
                          <Save size={16} />
                        </button>
                        <button
                          onClick={() => openAssignModal(expandedList)}
                          className="p-2 text-indigo-600 hover:bg-indigo-100 rounded-md transition-colors"
                          title="Assign to other users"
                        >
                          <Users size={16} />
                        </button>
                        <button
                          onClick={() => onRemoveList(expandedList, expandedList.isCreatedList)}
                          className="p-2 text-red-500 hover:bg-red-50 rounded-md transition-colors"
                          title="Remove"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="flex-1 min-h-0 overflow-y-auto">
                    <ListDetails
                      list={expandedList}
                      handleCopyBranchCode={handleCopyBranchCode}
                      isCodeCopied={isCodeCopied}
                      resetCopiedStatus={resetCopiedStatus}
                    />
                  </div>
                </>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-8 text-gray-500">
                  <GraduationCap size={36} className="mb-3 text-gray-300" />
                  <div className="text-lg font-medium text-gray-700">Select a list from the left panel</div>
                  <div className="text-sm mt-1">Details and colleges will appear here.</div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {saveAsTemplateModal.isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-[60]">
          <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">Save as Template</h3>
              <button
                onClick={() => setSaveAsTemplateModal({ isOpen: false, list: null, title: '' })}
                className="text-gray-400 hover:text-gray-500 transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            <div className="mb-4">
              <label htmlFor="templateTitle" className="block text-sm font-medium text-gray-700 mb-1">
                Template Name
              </label>
              <input
                type="text"
                id="templateTitle"
                value={saveAsTemplateModal.title}
                onChange={(e) => setSaveAsTemplateModal(prev => ({ ...prev, title: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter template name..."
              />
            </div>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setSaveAsTemplateModal({ isOpen: false, list: null, title: '' })}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveAsTemplate}
                disabled={!saveAsTemplateModal.title.trim()}
                className={`px-4 py-2 rounded-md text-white flex items-center ${
                  !saveAsTemplateModal.title.trim() 
                    ? 'bg-gray-400 cursor-not-allowed' 
                    : 'bg-blue-600 hover:bg-blue-700'
                }`}
              >
                <Save size={16} className="mr-2" />
                Save Template
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Colleges List Modal */}
      <CollegesListModal 
        show={!!selectedList}
        onClose={() => setSelectedList(null)}
        list={selectedList}
        onAddToList={handleAddSelectedColleges}
      />

      {assignModal.isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-[70]">
          <div className="bg-white rounded-lg shadow-lg p-6 max-w-3xl w-full mx-4 max-h-[85vh] flex flex-col">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">
                Assign "{assignModal.list?.title}" to other users
              </h3>
              <button onClick={closeAssignModal} className="text-gray-400 hover:text-gray-500">
                <X size={20} />
              </button>
            </div>

            <input
              type="text"
              placeholder="Search users by name or phone..."
              value={assignModal.searchQuery}
              onChange={(e) => setAssignModal(prev => ({ ...prev, searchQuery: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md mb-4"
            />

            <div className="flex-1 overflow-y-auto border border-gray-200 rounded-md">
              {assignSearchLoading ? (
                <div className="p-6 text-center text-sm text-gray-500">Searching users...</div>
              ) : assignSearchResults.length > 0 ? (
                assignSearchResults.map(user => {
                  const isSelected = assignModal.selectedUserIds.includes(user.id);
                  return (
                    <button
                      key={user.id}
                      onClick={() => toggleAssignUser(user.id)}
                      className={`w-full text-left px-4 py-3 border-b border-gray-100 flex items-center justify-between ${
                        isSelected ? 'bg-indigo-50' : 'hover:bg-gray-50'
                      }`}
                    >
                      <div>
                        <div className="font-medium text-gray-800">{user.name || '-'}</div>
                        <div className="text-xs text-gray-500">{user.phone || '-'}</div>
                      </div>
                      {isSelected && (
                        <span className="inline-flex items-center text-indigo-700 text-sm font-medium">
                          <Check size={14} className="mr-1" /> Selected
                        </span>
                      )}
                    </button>
                  );
                })
              ) : (
                <div className="p-6 text-center text-sm text-gray-500">No users found.</div>
              )}
            </div>

            <div className="mt-4 flex items-center justify-between">
              <div className="text-sm text-gray-600">
                {assignModal.selectedUserIds.length} user(s) selected
              </div>
              <div className="flex gap-2">
                <button
                  onClick={closeAssignModal}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAssignToSelectedUsers}
                  disabled={assignModal.selectedUserIds.length === 0 || assignModal.assigning}
                  className={`px-4 py-2 rounded-md text-white ${
                    assignModal.selectedUserIds.length === 0 || assignModal.assigning
                      ? 'bg-indigo-300 cursor-not-allowed'
                      : 'bg-indigo-600 hover:bg-indigo-700'
                  }`}
                >
                  {assignModal.assigning ? 'Assigning...' : 'Assign to Selected Users'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserListModal;
