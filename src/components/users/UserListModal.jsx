import React, { useState } from 'react';
import { X, Edit, Trash2, GraduationCap, Search, Save, ChevronDown, ChevronUp, Calendar, User, Copy, Tag } from 'lucide-react';
import CollegesListModal from './CollegesListModal';
import axiosInstance from '../../utils/axios';
import ListDetails from '../lists/ListDetails';

const UserListModal = ({ 
  showModal, 
  onClose, 
  loading, 
  userLists, 
  userName, 
  onEditList, 
  onRemoveList, 
  createdLists,
  onSetEditingOrderList 
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

  if (!showModal) return null;

  // Simplified filter to only search by title
  const filteredLists = userLists.filter(list => 
    !searchQuery || list.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Filter created lists with the same search criteria
  const filteredCreatedLists = createdLists ? createdLists.filter(list => 
    !searchQuery || list.title.toLowerCase().includes(searchQuery.toLowerCase())
  ) : [];

  const handleListClick = (listId) => {
    setExpandedListId(expandedListId === listId ? null : listId);
  };

  const handleListTitleClick = (list) => {
    // Create a copy of the list with indexed colleges
    const indexedList = {
      ...list,
      colleges: list.colleges?.map((college, index) => ({
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
      const submitData = {
        title: saveAsTemplateModal.title,
        colleges: saveAsTemplateModal.list.colleges.map(college => ({
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

  return (
    <div className="fixed inset-0 bg-white z-50 flex flex-col h-screen w-screen">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 px-6 py-4 flex justify-between items-center">
        <h2 className="text-2xl font-bold text-white flex items-center">
          <GraduationCap size={26} className="mr-3" />
          Lists for {userName}
        </h2>
        <button
          onClick={onClose}
          className="text-white hover:bg-white/20 transition-all rounded-full p-2"
          aria-label="Close modal"
        >
          <X size={24} />
        </button>
      </div>

      {/* Main Content */}
      <div className="flex-grow overflow-y-auto bg-gray-100">
        <div className="max-w-4xl mx-auto px-6 py-6">
          {/* Simplified Search */}
          <div className="bg-white rounded-lg shadow-sm mb-6">
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-4 border-0 rounded-lg focus:ring-2 focus:ring-blue-500 text-lg"
                placeholder="Search lists by title..."
              />
              <Search 
                size={20} 
                className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" 
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X size={20} />
                </button>
              )}
            </div>
          </div>

          {/* Assigned Lists Header */}
          <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
            <Tag size={20} className="mr-2 text-blue-500" />
            Assigned Lists
          </h3>

          {/* Assigned Lists Grid */}
          {loading ? (
            <div className="flex justify-center items-center h-32">
              <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          ) : filteredLists.length > 0 ? (
            <div className="space-y-4 mb-8">
              {filteredLists.map(list => (
                <div 
                  key={list.id} 
                  className={`bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-all ${
                    list.colorLabel ? `border-l-4 border-l-${list.colorLabel}-300` : ''
                  }`}
                >
                  {/* Card Header */}
                  <div className={`relative transition-colors duration-200 ${
                    expandedListId === list.id 
                      ? 'bg-blue-50 border-b border-gray-200' 
                      : ''
                  }`}>
                    {/* Main clickable area */}
                    <div 
                      className="flex items-center cursor-pointer p-3 pr-24 sm:pr-32" 
                      onClick={() => handleListClick(list.id)}
                    >
                      {/* Expand/Collapse icon */}
                      <div className="mr-3">
                        {expandedListId === list.id ? (
                          <ChevronUp size={18} className="text-blue-600" />
                        ) : (
                          <ChevronDown size={18} className="text-gray-400" />
                        )}
                      </div>
                      
                      {/* List title and metadata */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center">
                          <h3 className="font-semibold truncate text-gray-800">
                            {list.title}
                          </h3>
                          {/* Color label indicator */}
                          {list.colorLabel && (
                            <span className={`ml-2 w-3 h-3 rounded-full bg-${list.colorLabel}-500`}></span>
                          )}
                        </div>
                        
                        {/* List stats */}
                        <div className="flex items-center space-x-4 mt-1 text-sm">
                          <div className="flex items-center text-gray-600">
                            <GraduationCap size={14} className="mr-1" />
                            <span>
                              <span className="font-semibold">{list.colleges?.length || 0}</span> 
                              {(list.colleges?.length || 0) === 1 ? ' college' : ' colleges'}
                            </span>
                          </div>
                          
                          {list.createdAt && (
                            <div className="hidden sm:flex items-center text-gray-500">
                              <Calendar size={14} className="mr-1" />
                              <span>{new Date(list.createdAt).toLocaleDateString()}</span>
                            </div>
                          )}
                          {list.createdBy && (
                            <div className="hidden sm:flex items-center text-gray-500">
                              <User size={14} className="mr-1" />
                              <span>{list.createdBy}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    {/* Action Buttons (absolute positioned to stay in place) */}
                    <div className="absolute top-0 right-0 h-full flex items-center pr-2">
                      <div className="flex space-x-1">
                        <button
                          onClick={() => onEditList(list)}
                          className="p-2 text-blue-600 hover:bg-blue-100 rounded-md transition-colors"
                          title="Customize"
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          onClick={() => setSaveAsTemplateModal({ 
                            isOpen: true, 
                            list: list,
                            title: `${list.title} - Template` 
                          })}
                          className="p-2 text-purple-600 hover:bg-purple-100 rounded-md transition-colors"
                          title="Save as template"
                        >
                          <Save size={16} />
                        </button>
                        <button
                          onClick={() => onRemoveList(list, false)}
                          className="p-2 text-red-500 hover:bg-red-50 rounded-md transition-colors"
                          title="Remove"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Expanded Content */}
                  {expandedListId === list.id && (
                    <div className="bg-gray-50">
                      <ListDetails 
                        list={list} 
                        handleCopyBranchCode={handleCopyBranchCode}
                        isCodeCopied={isCodeCopied}
                        resetCopiedStatus={resetCopiedStatus}
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-white rounded-lg border border-gray-200 mb-8">
              <div className="flex flex-col items-center justify-center">
                <div className="bg-gray-100 p-6 rounded-full mb-4">
                  <GraduationCap size={32} className="text-gray-400" />
                </div>
                <h3 className="text-xl font-medium text-gray-700 mb-2">No Assigned Lists Found</h3>
                <p className="text-gray-500 max-w-md">
                  {searchQuery 
                    ? "No assigned lists match your search. Try a different search term."
                    : "This user doesn't have any lists assigned yet."}
                </p>
              </div>
            </div>
          )}

          {/* Created Lists Section - Only show if we have createdLists */}
          {createdLists && createdLists.length > 0 && (
            <>

              {filteredCreatedLists.length > 0 ? (
                <div className="space-y-4">
                  {filteredCreatedLists.map(list => (
                    <div 
                      key={`created-${list.id}`} 
                      className={`bg-white border border-green-200 rounded-lg shadow-sm hover:shadow-md transition-all ${
                        list.colorLabel ? `border-l-4 border-l-${list.colorLabel}-300` : 'border-l-4 border-l-green-300'
                      }`}
                    >
                      {/* Card Header - Same structure as assigned lists */}
                      <div className={`relative transition-colors duration-200 ${
                        expandedListId === `created-${list.id}` 
                          ? 'bg-green-50 border-b border-gray-200' 
                          : ''
                      }`}>
                        {/* Main clickable area */}
                        <div 
                          className="flex items-center cursor-pointer p-3 pr-24 sm:pr-32" 
                          onClick={() => handleListClick(`created-${list.id}`)}
                        >
                          {/* Expand/Collapse icon */}
                          <div className="mr-3">
                            {expandedListId === `created-${list.id}` ? (
                              <ChevronUp size={18} className="text-green-600" />
                            ) : (
                              <ChevronDown size={18} className="text-gray-400" />
                            )}
                          </div>
                          
                          {/* List title and metadata */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center">
                              <h3 className="font-semibold truncate text-gray-800">
                                {list.title}
                              </h3>
                              <span className="ml-2 px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full">Created</span>
                              {/* Color label indicator */}
                              {list.colorLabel && (
                                <span className={`ml-2 w-3 h-3 rounded-full bg-${list.colorLabel}-500`}></span>
                              )}
                            </div>
                            
                            {/* List stats */}
                            <div className="flex items-center space-x-4 mt-1 text-sm">
                              <div className="flex items-center text-gray-600">
                                <GraduationCap size={14} className="mr-1" />
                                <span>
                                  <span className="font-semibold">{list.colleges?.length || 0}</span> 
                                  {(list.colleges?.length || 0) === 1 ? ' college' : ' colleges'}
                                </span>
                              </div>
                              
                              {list.createdAt && (
                                <div className="hidden sm:flex items-center text-gray-500">
                                  <Calendar size={14} className="mr-1" />
                                  <span>{new Date(list.createdAt).toLocaleDateString()}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        {/* Action Buttons - Same as assigned lists */}
                        <div className="absolute top-0 right-0 h-full flex items-center pr-2">
                          <div className="flex space-x-1">
                            <button
                              onClick={() => onEditList(list)}
                              className="p-2 text-green-600 hover:bg-green-100 rounded-md transition-colors"
                              title="Customize"
                            >
                              <Edit size={16} />
                            </button>
                            <button
                              onClick={() => setSaveAsTemplateModal({ 
                                isOpen: true, 
                                list: list,
                                title: `${list.title} - Template` 
                              })}
                              className="p-2 text-purple-600 hover:bg-purple-100 rounded-md transition-colors"
                              title="Save as template"
                            >
                              <Save size={16} />
                            </button>
                            <button
                              onClick={() => onRemoveList(list, true)}
                              className="p-2 text-red-500 hover:bg-red-50 rounded-md transition-colors"
                              title="Remove"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Expanded Content - Same as assigned lists */}
                      {expandedListId === `created-${list.id}` && (
                        <div className="bg-green-50">
                          <ListDetails 
                            list={list} 
                            handleCopyBranchCode={handleCopyBranchCode}
                            isCodeCopied={isCodeCopied}
                            resetCopiedStatus={resetCopiedStatus}
                          />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : searchQuery ? (
                <div className="text-center py-8 bg-white rounded-lg border border-gray-200">
                  <p className="text-gray-500">No created lists match your search.</p>
                </div>
              ) : null}
            </>
          )}

          {/* No Lists Found Message - Modified to only show when both lists are empty */}
          {!loading && filteredLists.length === 0 && (!filteredCreatedLists || filteredCreatedLists.length === 0) && (
            <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
              <div className="flex flex-col items-center justify-center">
                <div className="bg-gray-100 p-6 rounded-full mb-4">
                  <GraduationCap size={32} className="text-gray-400" />
                </div>
                <h3 className="text-xl font-medium text-gray-700 mb-2">No Lists Found</h3>
                <p className="text-gray-500 max-w-md">
                  {searchQuery 
                    ? "No lists match your search. Try a different search term."
                    : "This user doesn't have any lists assigned or created yet."}
                </p>
              </div>
            </div>
          )}
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
    </div>
  );
};

export default UserListModal;
