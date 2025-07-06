import React, { useState, useEffect } from 'react';
import { X, Plus, Search, Trash2, GraduationCap, List, Filter, ArrowBigLeft, ArrowLeft, ChevronLeft, ChevronRight, AlertTriangle } from 'lucide-react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import CollegeSearchForm from './CollegeSearchForm';
import CollegeSearchResults from './CollegeSearchResults';
import SelectedColleges from './SelectedColleges';
import axiosInstance from '../../utils/axios';
import { useUsers } from '../../contexts/UsersContext';
import { set } from 'lodash';
import { useNavigate } from 'react-router-dom';

const EditListModal = ({
  selectedUser,
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
  handleSaveUserList
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

  // Add state for tracking initial values and confirmation
  const [initialFormData, setInitialFormData] = useState({});
  const [showExitConfirmation, setShowExitConfirmation] = useState(false);
  const navigation = useNavigate()

  useEffect(() => {
    fetchAllCities();
    fetchAllBranches();
    
  }, []);

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
        const cutoffs = response.data
        setSelectedCollegesCutoffs(cutoffs);
        callback(cutoffs);
        
      }
    } catch (err) {
      console.error('Error fetching city list:', err);
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

  // Track initial values when modal opens
  useEffect(() => {
    if (editingUserList && editListFormData) {
      setInitialFormData({
        title: editListFormData.title || '',
        colleges: JSON.stringify(editListFormData.colleges || [])
      });
    }
  }, [editingUserList, show]);

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
          {/* Add Debug Button */}
          {selectedUser && (
            <button
              onClick={() => console.log('Selected User:', selectedUser)}
              className="px-4 py-2 bg-white/10 text-white rounded-md hover:bg-white/20 transition-all"
            >
              Debug User Info
            </button>
          )}
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
                  selectedUserMarks={selectedUser?.counsellingData?.cetMarks || 0}
                  selectedUserCategory={selectedUser?.counsellingData?.category || "GOPENH"}
                  isSearchPanelCollapsed={isSearchPanelCollapsed}
                  fetchCutoffs={fetchCutoffs}
                  selectedCollegesCuttofs={selectedCollegesCutoffs}
                />
              </div>
            </div>
          </DndProvider>
        </div>

        {/* Footer */}
        <div className="bg-white px-6 py-3 border-t border-gray-200">
          <div className="flex justify-end gap-3 max-w-7xl mx-auto">
            <button
              onClick={handleClose}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium"
            >
              Cancel
            </button>
            <button
              onClick={() => handleSaveUserList(editingUserList.id)}
              disabled={!editListFormData.title || editListFormData.colleges.length === 0}
              className={`px-4 py-2 rounded-lg text-white font-medium flex items-center ${
                !editListFormData.title || editListFormData.colleges.length === 0
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              <Plus size={18} className="mr-1.5" />
              Save Changes
            </button>
          </div>
        </div>
      </div>

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
