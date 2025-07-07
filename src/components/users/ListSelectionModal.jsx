import React, { useEffect, useState } from 'react';
import { useUsers } from '../../contexts/UsersContext';
import axiosInstance from '../../utils/axios';

const ListSelectionModal = ({ 
  showModal, 
  onClose, 
  loading, 
  availableLists, 
  selectedUserId,
  onSelectList,
}) => {
  if (!showModal) return null;
  const {users} = useUsers();
  const [folders, setFolders] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFolder, setSelectedFolder] = useState('all'); // 'all', 'no-folder', or a folder id

  useEffect(() => {
    const fetchFolders = async () => {
      try {
        const response = await axiosInstance.get('/api/admin/list-folders'); // Adjust the API endpoint as needed
        const data = response.data;
        console.log(data);
        
        setFolders(data);
      } catch (error) {
        console.error('Error fetching folders:', error);
      }
    };

    fetchFolders();
  },[])

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
    folders.forEach(folder => {
      grouped[folder.id] = nonDeletedLists.filter(list => list.folderId === folder.id);
    });
    
    return grouped;
  };

  const listsByFolder = getListsByFolder();

  const renderListItem = (list) => {
    const isSelected2 = list.userIds && list.userIds.includes(selectedUserId);
    const selectedUser = users.find(user => user.id === selectedUserId.id);
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

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-md p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Select List</h2>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>

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
          {folders.filter(folder => !folder.isArchive).map(folder => (
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
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {selectedFolder === 'all' ? (
              // Show lists organized by folders
              <>
                {/* Regular folders */}
                {folders.map(folder => {
                  if (!listsByFolder[folder.id] || listsByFolder[folder.id].length === 0) return null;
                  
                  const folderLists = listsByFolder[folder.id].filter(list => 
                    searchQuery === '' || 
                    list.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    (list.description && list.description.toLowerCase().includes(searchQuery.toLowerCase()))
                  );
                  
                  if (folderLists.length === 0) return null;
                  
                  return (
                    <div key={folder.id} className="mb-4">
                      <h3 className="font-medium text-gray-700 mb-2 flex items-center">
                        <span className="mr-2">{folder.name}</span>
                        <span className="text-xs bg-gray-100 px-2 py-0.5 rounded-full">
                          {folderLists.length} lists
                        </span>
                      </h3>
                      <div className="space-y-2 pl-2">
                        {folderLists.map(renderListItem)}
                      </div>
                    </div>
                  );
                })}
                
                {/* No Folder lists */}
                {listsByFolder.noFolder && listsByFolder.noFolder.length > 0 && (
                  <div className="mb-4">
                    <h3 className="font-medium text-gray-700 mb-2 flex items-center">
                      <span className="mr-2">No Folder</span>
                      <span className="text-xs bg-gray-100 px-2 py-0.5 rounded-full">
                        {listsByFolder.noFolder.filter(list => 
                          searchQuery === '' || 
                          list.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (list.description && list.description.toLowerCase().includes(searchQuery.toLowerCase()))
                        ).length} lists
                      </span>
                    </h3>
                    <div className="space-y-2 pl-2">
                      {listsByFolder.noFolder
                        .filter(list => 
                          searchQuery === '' || 
                          list.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (list.description && list.description.toLowerCase().includes(searchQuery.toLowerCase()))
                        )
                        .map(renderListItem)}
                    </div>
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
    </div>
  );
};

export default ListSelectionModal;
                      