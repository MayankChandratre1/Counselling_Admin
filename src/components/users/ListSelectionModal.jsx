import React, { useEffect, useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { useUsers } from '../../contexts/UsersContext';
import axiosInstance from '../../utils/axios';

const ListSelectionModal = ({ 
  showModal, 
  onClose, 
  loading, 
  availableLists, 
  selectedUserId,
  onSelectList,
  onSelectUserListCopy,
}) => {
  const {users} = useUsers();
  const [folders, setFolders] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFolder, setSelectedFolder] = useState('all'); // 'all', 'no-folder', or a folder id
  const [activeMode, setActiveMode] = useState('master'); // 'master' | 'copy'
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [userSearchResults, setUserSearchResults] = useState([]);
  const [isSearchingUsers, setIsSearchingUsers] = useState(false);
  const [selectedSourceUser, setSelectedSourceUser] = useState(null);
  const [sourceUserLists, setSourceUserLists] = useState([]);
  const [isLoadingSourceLists, setIsLoadingSourceLists] = useState(false);
  const [collapsedFolders, setCollapsedFolders] = useState({});

  const visibleFolders = folders.filter(folder => !folder?.isArchive);

  useEffect(() => {
    if (!showModal) return;

    const fetchFolders = async () => {
      try {
        const response = await axiosInstance.get('/api/admin/list-folders');
        const data = Array.isArray(response.data)
          ? response.data
          : (Array.isArray(response.data?.folders) ? response.data.folders : []);

        setFolders(data);
      } catch (error) {
        console.error('Error fetching folders:', error);
        setFolders([]);
      }
    };

    fetchFolders();
  }, [showModal]);

  useEffect(() => {
    if (!showModal) {
      setActiveMode('master');
      setSelectedFolder('all');
      setSearchQuery('');
      setUserSearchQuery('');
      setUserSearchResults([]);
      setSelectedSourceUser(null);
      setSourceUserLists([]);
      setIsSearchingUsers(false);
      setIsLoadingSourceLists(false);
      setCollapsedFolders({});
    }
  }, [showModal]);

  const toggleFolderCollapse = (folderId) => {
    setCollapsedFolders(prev => ({
      ...prev,
      [folderId]: !(prev[folderId] ?? true)
    }));
  };

  const isSectionCollapsed = (folderId) => collapsedFolders[folderId] ?? true;

  const handleUserSearch = async (value) => {
    const query = value.trim();
    if (!query) {
      setUserSearchResults([]);
      return;
    }

    try {
      setIsSearchingUsers(true);
      const payload = /^\d+$/.test(query)
        ? { phone: query }
        : { name: query };

      const response = await axiosInstance.post('/api/admin/user/search', payload);
      const normalized = Array.isArray(response.data)
        ? response.data
        : (Array.isArray(response.data?.users) ? response.data.users : []);
      setUserSearchResults(normalized);
    } catch (error) {
      console.error('Error searching users for copy:', error);
      setUserSearchResults([]);
    } finally {
      setIsSearchingUsers(false);
    }
  };

  const handleSelectSourceUser = async (user) => {
    try {
      setSelectedSourceUser(user);
      setIsLoadingSourceLists(true);
      const response = await axiosInstance.get(`/api/admin/user/${user.id}/lists`);
      const lists = Array.isArray(response.data) ? response.data : [];
      setSourceUserLists(lists.filter(list => list && list.title));
    } catch (error) {
      console.error('Error loading source user lists:', error);
      setSourceUserLists([]);
    } finally {
      setIsLoadingSourceLists(false);
    }
  };

  // Filter lists based on search query and selected folder
  const filteredLists = availableLists ? availableLists.filter(list => {
    // Exclude deleted lists
    if (list.isDeleted === true) return false;
    
    // Search filter
    const matchesSearch = searchQuery === '' || 
      list.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (list.description && list.description.toLowerCase().includes(searchQuery.toLowerCase()));
    
    // Folder filter
    let matchesFolder = true;
    if (selectedFolder === 'all') {
      // Show all lists
    } else if (selectedFolder === 'no-folder') {
      // Show lists with no folder
      matchesFolder = !list.folderId;
    } else {
      // Show lists from specific folder
      matchesFolder = list.folderId === selectedFolder;
    }
    
    return matchesSearch && matchesFolder;
  }) : [];

  // Group lists by folders for "all" view
  const getListsByFolder = () => {
    if (!availableLists) return {};
    
    // Filter out deleted lists
    const nonDeletedLists = availableLists.filter(list => list.isDeleted !== true);
    
    const grouped = {
      noFolder: nonDeletedLists.filter(list => !list.folderId)
    };
    
    // Add lists by folder
    visibleFolders.forEach(folder => {
      grouped[folder.id] = nonDeletedLists.filter(list => list.folderId === folder.id);
    });
    
    return grouped;
  };

  const listsByFolder = getListsByFolder();

  const renderListItem = (list) => {
    const selectedUserIdValue = typeof selectedUserId === 'object' ? selectedUserId?.id : selectedUserId;
    const isSelected2 = list.userIds && list.userIds.includes(selectedUserIdValue);
    const selectedUser = users.find(user => user.id === selectedUserIdValue);
    const isSelected = selectedUser?.lists?.map(l => l.listId).includes(list.id) || 
                      selectedUser?.createdList?.map(l => l.listId).includes(list.id) || 
                      isSelected2;
    
    return (
      <div 
        key={list.id}
        className={`p-3 border rounded-md hover:bg-gray-50 cursor-pointer flex justify-between items-center ${
          isSelected ? 'border-green-500 bg-green-50' : ''
        }`}
        onClick={() => !isSelected && onSelectList(list.id)}
      >
        <div>
          <h3 className="font-medium">{list.title}</h3>
          {list.description && (
            <p className="text-sm text-gray-500">{list.description}</p>
          )}
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
              {list.colleges?.length || 0} colleges
            </span>
            {list.userIds && list.userIds.length > 0 && (
              <span className="text-sm text-blue-500 bg-blue-50 px-2 py-1 rounded-full">
                {list.userIds.length} users
              </span>
            )}
          </div>
        </div>
        {isSelected && (
          <span className="ml-2 px-2 py-0.5 bg-green-100 text-green-800 text-xs rounded-full">
            Selected
          </span>
        )}
      </div>
    );
  };

  if (!showModal) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-6xl p-6 h-[90vh] overflow-hidden flex flex-col">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Assign List</h2>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>

        <div className="flex gap-2 mb-4 border-b pb-3">
          <button
            className={`px-3 py-2 text-sm rounded-md ${
              activeMode === 'master' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'
            }`}
            onClick={() => setActiveMode('master')}
          >
            From Master Lists
          </button>
          <button
            className={`px-3 py-2 text-sm rounded-md ${
              activeMode === 'copy' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'
            }`}
            onClick={() => setActiveMode('copy')}
          >
            Copy From Other User
          </button>
        </div>

        {activeMode === 'master' ? (
          <div className="flex-1 min-h-0 flex flex-col">

        {/* Search bar */}
        <div className="mb-4">
          <input
            type="text"
            placeholder="Search lists..."
            className="w-full p-2 border border-gray-300 rounded-lg"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Folder navigation */}
        <div className="flex flex-wrap gap-2 mb-4 pb-2 border-b">
          <button
            className={`px-3 py-1 text-sm rounded-full ${
              selectedFolder === 'all' ? 'bg-blue-500 text-white' : 'bg-gray-100'
            }`}
            onClick={() => setSelectedFolder('all')}
          >
            All Lists
          </button>
          <button
            className={`px-3 py-1 text-sm rounded-full ${
              selectedFolder === 'no-folder' ? 'bg-blue-500 text-white' : 'bg-gray-100'
            }`}
            onClick={() => setSelectedFolder('no-folder')}
          >
            No Folder
          </button>
          {visibleFolders.map(folder => (
            <button
              key={folder.id}
              className={`px-3 py-1 text-sm rounded-full ${
                selectedFolder === folder.id ? 'bg-blue-500 text-white' : 'bg-gray-100'
              }`}
              onClick={() => setSelectedFolder(folder.id)}
            >
              {folder.name} {folder.list_count > 0 && <span className="text-xs ml-1">({folder.list_count})</span>}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-32">
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : availableLists && availableLists.length > 0 ? (
          <div className="space-y-4 flex-1 min-h-0 overflow-y-auto pb-2">
            {selectedFolder === 'all' ? (
              // Show lists organized by folders
              <>
                {/* Regular folders */}
                {visibleFolders.map(folder => {
                  if (!listsByFolder[folder.id] || listsByFolder[folder.id].length === 0) return null;
                  
                  const folderLists = listsByFolder[folder.id].filter(list => 
                    searchQuery === '' || 
                    list.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    (list.description && list.description.toLowerCase().includes(searchQuery.toLowerCase()))
                  );
                  
                  if (folderLists.length === 0) return null;
                  const isCollapsed = isSectionCollapsed(folder.id);
                  
                  return (
                    <div key={folder.id} className="mb-4 border-b border-gray-200 pb-4 last:border-b-0">
                      <button
                        type="button"
                        onClick={() => toggleFolderCollapse(folder.id)}
                        className="w-full font-medium text-gray-700 mb-2 flex items-center justify-between hover:text-gray-900"
                      >
                        <span className="flex items-center">
                          <span className="mr-2">{folder.name}</span>
                          <span className="text-xs bg-gray-100 px-2 py-0.5 rounded-full">
                            {folderLists.length} lists
                          </span>
                        </span>
                        <span className="text-gray-500">
                          {isCollapsed ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
                        </span>
                      </button>
                      {!isCollapsed && (
                        <div className="space-y-2 pl-2">
                          {folderLists.map(renderListItem)}
                        </div>
                      )}
                    </div>
                  );
                })}
                
                {/* No Folder lists */}
                {listsByFolder.noFolder && listsByFolder.noFolder.length > 0 && (
                  <div className="mb-4 border-b border-gray-200 pb-4 last:border-b-0">
                    {(() => {
                      const noFolderLists = listsByFolder.noFolder.filter(list => 
                        searchQuery === '' || 
                        list.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        (list.description && list.description.toLowerCase().includes(searchQuery.toLowerCase()))
                      );
                      const isCollapsed = isSectionCollapsed('no-folder');

                      return (
                        <>
                          <button
                            type="button"
                            onClick={() => toggleFolderCollapse('no-folder')}
                            className="w-full font-medium text-gray-700 mb-2 flex items-center justify-between hover:text-gray-900"
                          >
                            <span className="flex items-center">
                              <span className="mr-2">No Folder</span>
                              <span className="text-xs bg-gray-100 px-2 py-0.5 rounded-full">
                                {noFolderLists.length} lists
                              </span>
                            </span>
                            <span className="text-gray-500">
                              {isCollapsed ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
                            </span>
                          </button>
                          {!isCollapsed && (
                            <div className="space-y-2 pl-2">
                              {noFolderLists.map(renderListItem)}
                            </div>
                          )}
                        </>
                      );
                    })()}
                  </div>
                )}
              </>
            ) : (
              // Show filtered lists from selected folder
              <div className="space-y-2">
                {filteredLists.length > 0 ? (
                  filteredLists.map(renderListItem)
                ) : (
                  <p className="text-center py-4 text-gray-500">
                    No lists found {searchQuery ? "matching '" + searchQuery + "'" : "in this folder"}
                  </p>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-6 text-gray-500">
            No lists available. Create a list first.
          </div>
        )}
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 flex-1 min-h-0">
            <div className="border border-gray-200 rounded-lg p-4 overflow-hidden flex flex-col">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Search Source User</h3>
              <input
                type="text"
                placeholder="Search by user name or phone..."
                className="w-full p-2 border border-gray-300 rounded-lg mb-3"
                value={userSearchQuery}
                onChange={(e) => {
                  const value = e.target.value;
                  setUserSearchQuery(value);
                  handleUserSearch(value);
                }}
              />

              <div className="flex-1 min-h-0 overflow-y-auto space-y-2">
                {isSearchingUsers ? (
                  <div className="text-sm text-gray-500">Searching users...</div>
                ) : userSearchResults.length > 0 ? (
                  userSearchResults.map(user => (
                    <button
                      key={user.id}
                      onClick={() => handleSelectSourceUser(user)}
                      className={`w-full text-left p-3 border rounded-md transition-colors ${
                        selectedSourceUser?.id === user.id
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      <div className="font-medium text-gray-800">{user.name || '-'}</div>
                      <div className="text-xs text-gray-500">{user.phone || '-'}</div>
                    </button>
                  ))
                ) : (
                  <div className="text-sm text-gray-500">Search to find users.</div>
                )}
              </div>
            </div>

            <div className="border border-gray-200 rounded-lg p-4 overflow-hidden flex flex-col">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">
                {selectedSourceUser
                  ? `Lists from ${selectedSourceUser.name || selectedSourceUser.id}`
                  : 'Select a source user'}
              </h3>

              <div className="flex-1 min-h-0 overflow-y-auto space-y-2">
                {isLoadingSourceLists ? (
                  <div className="text-sm text-gray-500">Loading source lists...</div>
                ) : selectedSourceUser ? (
                  sourceUserLists.length > 0 ? (
                    sourceUserLists.map(list => (
                      <div key={list.id || list._id} className="p-3 border border-gray-200 rounded-md">
                        <div className="font-medium text-gray-800">{list.title}</div>
                        <div className="text-xs text-gray-500 mt-1">
                          {(Array.isArray(list.colleges) ? list.colleges.length : 0)} colleges • {list.type || 'assigned'}
                        </div>
                        <button
                          onClick={() => onSelectUserListCopy && onSelectUserListCopy(list)}
                          className="mt-3 px-3 py-1.5 bg-blue-600 text-white text-xs rounded-md hover:bg-blue-700"
                        >
                          Copy this list
                        </button>
                      </div>
                    ))
                  ) : (
                    <div className="text-sm text-gray-500">No lists found for this user.</div>
                  )
                ) : (
                  <div className="text-sm text-gray-500">User lists will appear here.</div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ListSelectionModal;
                      