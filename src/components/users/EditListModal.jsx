import React, { useState, useEffect, useRef } from 'react';
import { X, Plus, Search, Trash2, GraduationCap, List, Filter, ArrowLeft, ChevronLeft, ChevronRight, AlertTriangle, Archive, Copy, User, Save } from 'lucide-react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import CollegeSearchForm from '../lists/CollegeSearchForm';
import CollegeSearchResults from '../lists/CollegeSearchResults';
import SelectedColleges from '../lists/SelectedColleges';
import ImportColleges from '../lists/ImportColleges';
import axiosInstance from '../../utils/axios';
import { toast } from 'react-toastify';

const EditListModal = ({
  show,
  onClose,
  editingUserList,
  editListFormData,
  setEditListFormData,
  searchCollegeQuery,
  handleSearchCollegeChange,
  isSearchingColleges,
  collegeSearchResults,
  searchColleges,
  addCollegeToUserList,
  handleRemoveCollegeFromUserList,
  moveCollege,
  handleSaveUserList,
  selectedUserCategory,
  selectedUserListsId,
  availableLists = [],
  users = [],
  setUsers,
  setSelectedUserLists,
  setError,
  setShowEditListModal,
  setEditingUserList,
  setLoadingLists
}) => {
  const [isSearchPanelCollapsed, setIsSearchPanelCollapsed] = useState(false);
  const [selectedForDrag, setSelectedForDrag] = useState([]);
  const [expandedColleges, setExpandedColleges] = useState({});
  const [showCityFilter, setShowCityFilter] = useState(false);
  const [showBranchFilter, setShowBranchFilter] = useState(false);
  const [selectedCity, setSelectedCity] = useState('');
  const [selectedBranch, setSelectedBranch] = useState('');
  const [citySearchInput, setCitySearchInput] = useState('');
  const [branchSearchInput, setBranchSearchInput] = useState('');
  const [filteredCities, setFilteredCities] = useState([]);
  const [filteredBranches, setFilteredBranches] = useState([]);
  const [availableCities, setAvailableCities] = useState([]);
  const [availableBranches, setAvailableBranches] = useState([]);
  const [selectedCollegesCutoffs, setSelectedCollegesCutoffs] = useState([]);
  const [showImportModal, setShowImportModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(selectedUserCategory || '');
  const [selectedForExport, setSelectedForExport] = useState([]);

  // Add state for tracking initial values and confirmation
  const [initialFormData, setInitialFormData] = useState({});
  const [showExitConfirmation, setShowExitConfirmation] = useState(false);

  const PREDEFINED_CATEGORIES = [
    "GOPENS", "GSCH", "GSTH", "GOBCH", "LOPENS", "LSCH", "LSTH", "LOBCH", 
    // Add more categories as needed
  ];


  

  const [folders, setFolders] = useState([]);

  useEffect(() => {
    fetchAllCities();
    fetchAllBranches();
    fetchFolders();
    
    // Initialize category with user's category if available
    if (selectedUserCategory) {
      setSelectedCategory(selectedUserCategory);
    }
    
  }, [selectedUserCategory]);

  // Track initial values when modal opens
  useEffect(() => {
    if (editingUserList && editListFormData) {
      setInitialFormData({
        title: editListFormData.title || '',
        colleges: JSON.stringify(editListFormData.colleges || [])
      });
    }
  }, [editingUserList, show]);

  const fetchFolders = async () => {
    try {
      const response = await axiosInstance.get('/api/admin/list-folders');
      if (response.data && Array.isArray(response.data)) {
        setFolders(response.data);
      }
    } catch (err) {
      console.error('Error fetching folders:', err);
    }
  }

  const fetchAllCities = async () => {
    try {
      const response = await axiosInstance.get('/api/admin/search-colleges', {
        params: { fetchAllCities: true }
      });
      
      if (response.data && response.data.length > 0) {
        const cities = [...new Set(response.data
          .filter(college => college.city)
          .map(college => college.city))]
          .sort();
          
        setAvailableCities(cities);
      }
    } catch (err) {
      console.error('Error fetching city list:', err);
    }
  };

  const fetchCutoffs = async (callback) => {
    try {
      const collegeIds = editListFormData.colleges.map(college => college.id);
      const response = await axiosInstance.post('/api/admin/getcutoff', { collegeIds: [...new Set(collegeIds)] });
      if (response.data && response.data.length > 0) {
        const cutoffs = response.data;
        setSelectedCollegesCutoffs(cutoffs);
        callback && callback(cutoffs);
      }
    } catch (err) {
      console.error('Error fetching cutoffs:', err);
    }
  };

  const fetchAllBranches = async () => {
    try {
      const response = await axiosInstance.get('/api/admin/search-colleges', {
        params: { fetchAllBranches: true }
      });
      
      if (response.data && response.data.length > 0) {
        let allBranches = [];
        response.data.forEach(college => {
          if (college.branches && Array.isArray(college.branches)) {
            college.branches.forEach(branch => {
              if (branch.branchName) {
                allBranches.push(branch.branchName);
              }
            });
          }
        });
        
        const branches = [...new Set(allBranches)].sort();
        setAvailableBranches(branches);
      }
    } catch (err) {
      console.error('Error fetching branch list:', err);
    }
  };

  // Check if there are unsaved changes
  const hasUnsavedChanges = () => {
    if (!initialFormData.title) return false;
    
    const titleChanged = editListFormData.title !== initialFormData.title;
    const collegesChanged = JSON.stringify(editListFormData.colleges || []) !== initialFormData.colleges;
    
    return titleChanged || collegesChanged;
  };

  // Handle close with confirmation if there are unsaved changes
  const handleClose = () => {
    if (hasUnsavedChanges()) {
      setShowExitConfirmation(true);
    } else {
      onClose();
    }
  };

  // Confirm exit without saving
  const confirmExit = () => {
    setShowExitConfirmation(false);
    onClose();
  };

  // Cancel exit confirmation
  const cancelExit = () => {
    setShowExitConfirmation(false);
  };

  const handleSelectForDrag = (collegeId) => {
    setSelectedForDrag(prev => 
      prev.includes(collegeId) 
        ? prev.filter(id => id !== collegeId)
        : [...prev, collegeId]
    );
  };

  const handleDragMultiple = () => {
    const collegesToAdd = [];
    
    collegeSearchResults
      .filter(college => selectedForDrag.includes(college.id))
      .forEach(college => {
        if (college.branches && college.branches.length > 0) {
          // Add each branch as a separate college
          college.branches.forEach(branch => {
            collegesToAdd.push({
              ...college,
              uniqueId: `${college.id}_${branch.branchCode}`,
              selectedBranch: branch.branchName,
              selectedBranchCode: branch.branchCode
            });
          });
        } else {
          // Add college without branches
          collegesToAdd.push({
            ...college,
            uniqueId: college.id
          });
        }
      });

    if (collegesToAdd.length > 0) {
      setEditListFormData(prev => ({
        ...prev,
        colleges: [...prev.colleges, ...collegesToAdd]
      }));
      setSelectedForDrag([]);
    }
  };

  const clearColleges = () => {
    if (window.confirm('Are you sure you want to clear all selected colleges?')) {
      setEditListFormData(prev => ({ ...prev, colleges: [] }));
    }
  };

  const handleMoveSelectedColleges = (dragIndex, hoverIndex, newOrder = null) => {
    if (newOrder) {
      // Handle bulk move
      setEditListFormData(prev => ({
        ...prev,
        colleges: newOrder
      }));
    } else {
      // Handle single drag and drop
      setEditListFormData(prev => {
        const newColleges = [...prev.colleges];
        const [draggedCollege] = newColleges.splice(dragIndex, 1);
        newColleges.splice(hoverIndex, 0, draggedCollege);
        return {
          ...prev,
          colleges: newColleges
        };
      });
    }
  };

  const toggleSearchPanel = () => {
    setIsSearchPanelCollapsed(!isSearchPanelCollapsed);
  };

  const toggleCollegeBranches = (collegeId) => {
    setExpandedColleges(prev => ({
      ...prev,
      [collegeId]: !prev[collegeId]
    }));
  };

  const handleCitySelect = (city) => {
    setSelectedCity(city);
    setShowCityFilter(false);
    if (city || selectedBranch) {
      searchColleges(searchCollegeQuery, city, selectedBranch);
    }
  };

  const handleBranchSelect = (branch) => {
    setSelectedBranch(branch);
    setShowBranchFilter(false);
    if (branch || selectedCity) {
      searchColleges(searchCollegeQuery, selectedCity, branch);
    }
  };

  const handleSelectForExport = (collegeId) => {
    setSelectedForExport(prev => {
      if (prev.includes(collegeId)) {
        return prev.filter(id => id !== collegeId);
      } else {
        return [...prev, collegeId];
      }
    });
  };

  // Handle importing colleges from another list
  const handleImportColleges = (collegesForImport, insertIndex) => {
    if (!collegesForImport || collegesForImport.length === 0) return;
    
    setEditListFormData(prev => {
      const updatedColleges = [...prev.colleges];
      
      // If insertIndex is -1 or undefined, append to the end
      if (insertIndex === -1 || insertIndex === undefined) {
        return {
          ...prev,
          colleges: [...updatedColleges, ...collegesForImport]
        };
      } 
      
      // Otherwise insert at the specified position
      updatedColleges.splice(insertIndex, 0, ...collegesForImport);
      return {
        ...prev,
        colleges: updatedColleges
      };
    });
    
    toast.success(`${collegesForImport.length} colleges imported successfully!`);
  };

  // Filter cities based on search input
  useEffect(() => {
    if (citySearchInput) {
      const filtered = availableCities.filter(city => 
        city.toLowerCase().includes(citySearchInput.toLowerCase())
      );
      setFilteredCities(filtered);
    } else {
      setFilteredCities(availableCities);
    }
  }, [citySearchInput, availableCities]);

  // Filter branches based on search input
  useEffect(() => {
    if (branchSearchInput) {
      const filtered = availableBranches.filter(branch => 
        branch.toLowerCase().includes(branchSearchInput.toLowerCase())
      );
      setFilteredBranches(filtered);
    } else {
      setFilteredBranches(availableBranches);
    }
  }, [branchSearchInput, availableBranches]);

  // Custom save function that uses the user-specific API
  const saveUserList = async () => {
    try {
      setLoadingLists(true);
      const authAxios = axiosInstance;
      
      // Use the listId from the editingUserList
      const targetListId = editingUserList.id || editingUserList.listId || editingUserList.originalListId;
      
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
      
      toast.success('List updated successfully for user!');
    } catch (err) {
      console.error('Error saving user list:', err);
      setError(`Failed to save user list: ${err.message}`);
      toast.error(`Failed to save list: ${err.message}`);
    } finally {
      setLoadingLists(false);
    }
  };

  if (!show) return null;

  return (
    <>
      <div className="fixed inset-0 bg-white z-50 flex flex-col min-h-screen w-screen">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 px-6 py-3 flex items-center gap-3">
          <button
            onClick={handleClose}
            className="text-white hover:bg-white/20 transition-all rounded-full p-2"
          >
            <ArrowLeft size={24} />
          </button>
          <input
            type="text"
            value={editListFormData.title}
            onChange={(e) => setEditListFormData({ ...editListFormData, title: e.target.value })}
            className="flex-1 max-w-xl px-3 py-2 text-sm bg-white/10 text-white placeholder-white/60 border border-white/20 rounded-lg focus:ring-2 focus:ring-white/50 focus:border-transparent"
            placeholder="Enter list title..."
            required
          />
          {/* User Information */}
          {editingUserList?.selectedUser && (
            <div className="flex items-center bg-white/10 text-white px-3 py-2 rounded-md gap-2">
              <User size={18} />
              <span className="font-medium">{editingUserList.selectedUser.name}</span>
            </div>
          )}
          
          {/* Import & Export */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowImportModal(true)}
              className="px-3 py-2 bg-white/10 text-white rounded-md hover:bg-white/20 transition-all flex items-center gap-2"
            >
              <Copy size={18} className="mr-1" />
              Import
            </button>
          </div>
        </div>

        {/* Search Bar */}
        {!isSearchPanelCollapsed && (
          <div className="bg-white border-b border-gray-200 px-6 py-3">
            <CollegeSearchForm
              searchQuery={searchCollegeQuery}
              handleSearchChange={handleSearchCollegeChange}
              searchColleges={searchColleges}
              isSearching={isSearchingColleges}
              compact={true}
              showCityFilter={showCityFilter}
              setShowCityFilter={setShowCityFilter}
              showBranchFilter={showBranchFilter}
              setShowBranchFilter={setShowBranchFilter}
              selectedCity={selectedCity}
              selectedBranch={selectedBranch}
              handleCitySelect={handleCitySelect}
              handleBranchSelect={handleBranchSelect}
              citySearchInput={citySearchInput}
              setCitySearchInput={setCitySearchInput}
              branchSearchInput={branchSearchInput}
              setBranchSearchInput={setBranchSearchInput}
              filteredCities={filteredCities}
              filteredBranches={filteredBranches}
              
              // Add user-specific filters if needed
              selectedUserCategory={selectedUserCategory}
            />
          </div>
        )}

        {/* Main Content */}
        <div className="flex-1 overflow-hidden bg-gray-50">
          <DndProvider backend={HTML5Backend}>
            <div className="h-full flex relative">
              {/* Search Panel */}
              <div className={`
                transition-all duration-300 ease-in-out
                ${isSearchPanelCollapsed ? 'w-0' : 'w-1/2'}
                flex flex-col h-full border-r border-gray-200 overflow-hidden
              `}>
                <div className={`p-4 flex flex-col h-full ${isSearchPanelCollapsed ? 'invisible' : ''}`}>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-lg font-medium text-gray-800 flex items-center">
                      <Search size={20} className="text-blue-600 mr-2" />
                      Search Results
                    </h3>
                    <div className="flex items-center gap-2">
                      {selectedForDrag.length > 0 && (
                        <button
                          onClick={handleDragMultiple}
                          className="px-3 py-1 text-sm font-medium text-green-600 bg-green-50 hover:bg-green-100 rounded-md flex items-center"
                        >
                          <Plus size={16} className="mr-1" />
                          Add Selected ({selectedForDrag.length})
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="flex-1 overflow-y-auto bg-white rounded-lg border border-gray-200">
                    <CollegeSearchResults
                      searchResults={collegeSearchResults}
                      selectedColleges={editListFormData.colleges}
                      addCollegeToList={addCollegeToUserList}
                      selectedForDrag={selectedForDrag}
                      onSelectForDrag={handleSelectForDrag}
                      expandedColleges={expandedColleges}
                      toggleCollegeBranches={toggleCollegeBranches}
                    />
                  </div>
                </div>
              </div>

              {/* Toggle Button */}
              <button
                onClick={toggleSearchPanel}
                className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white border border-gray-200 rounded-r-lg p-1.5 shadow-md hover:bg-gray-50"
              >
                {isSearchPanelCollapsed ? (
                  <ChevronRight className="w-4 h-4 text-gray-600" />
                ) : (
                  <ChevronLeft className="w-4 h-4 text-gray-600" />
                )}
              </button>

              {/* Selected Colleges Panel */}
              <div className={`
                transition-all duration-300 ease-in-out
                ${isSearchPanelCollapsed ? 'w-full' : 'w-1/2'}
                p-4 flex flex-col h-full
              `}>
                <SelectedColleges
                  selectedColleges={editListFormData.colleges ? editListFormData.colleges : []}
                  moveCollege={handleMoveSelectedColleges}
                  removeCollegeFromList={handleRemoveCollegeFromUserList}
                  clearColleges={clearColleges}
                  selectedUserMarks={editingUserList?.selectedUser?.counsellingData?.cetMarks || 0}
                  selectedUserCategory={selectedUserCategory || "GOPENH"}
                  isSearchPanelCollapsed={isSearchPanelCollapsed}
                  fetchCutoffs={fetchCutoffs}
                  selectedCategory={selectedCategory}
                  editingList={editingUserList}
                  selectedForExport={selectedForExport}
                  onSelectForExport={handleSelectForExport}
                />
              </div>
            </div>
          </DndProvider>
        </div>

        {/* Footer */}
        <div className="bg-white px-6 py-3 border-t border-gray-200">
          <div className="flex justify-between items-center max-w-7xl mx-auto">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">Category:</span>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {PREDEFINED_CATEGORIES.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
              <span className="text-xs text-gray-500">
                ({editListFormData.colleges?.length || 0} colleges in list)
              </span>
            </div>
            
            <div className="flex justify-end gap-3">
              <button
                onClick={handleClose}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium"
              >
                Cancel
              </button>
              <button
                onClick={saveUserList}
                disabled={!editListFormData.title || editListFormData.colleges.length === 0}
                className={`px-4 py-2 rounded-lg text-white font-medium flex items-center ${
                  !editListFormData.title || editListFormData.colleges.length === 0
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700'
                }`}
              >
                <Save size={18} className="mr-1.5" />
                Save Changes
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Import Colleges Modal */}
      {showImportModal && (
        <ImportColleges
          isOpen={showImportModal}
          onClose={() => setShowImportModal(false)}
          onImport={handleImportColleges}
          availableLists={availableLists || []} // Make sure we handle the case when availableLists is undefined
          currentListId={editingUserList?.id}
          currentCollegesCount={editListFormData.colleges?.length || 0}
          folders={folders||[]}
        />
      )}

      {/* Exit Confirmation Modal */}
      {showExitConfirmation && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-[60]">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
            <div className="flex items-center mb-4">
              <div className="flex-shrink-0 w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-orange-600" />
              </div>
              <div className="ml-3">
                <h3 className="text-lg font-medium text-gray-900">Unsaved Changes</h3>
                <p className="text-sm text-gray-500">You have unsaved changes that will be lost.</p>
              </div>
            </div>
            
            <p className="text-gray-600 mb-6">
              Are you sure you want to exit without saving your changes?
            </p>
            
            <div className="flex justify-end space-x-3">
              <button
                onClick={cancelExit}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmExit}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Exit Without Saving
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default EditListModal;
