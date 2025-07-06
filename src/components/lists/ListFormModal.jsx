import React, { useState, useRef, useEffect } from 'react';
import { X, Plus, Search, Trash2, GraduationCap, List, Filter, ArrowLeft, ChevronLeft, ChevronRight, Undo, ChevronDown, Copy, RotateCcw, Download, Upload, Import } from 'lucide-react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import CollegeSearchForm from './CollegeSearchForm';
import CollegeSearchResults from './CollegeSearchResults';
import SelectedColleges from './SelectedColleges';
import DraggableCollegeItem from '../users/DraggableCollegeItem';
import ImportColleges from './ImportColleges';

const ListFormModal = ({
  editingList,
  formData,
  setFormData,
  handleSubmit,
  closeModal,
  selectedColleges,
  setSelectedColleges,
  searchQuery,
  handleSearchChange,
  isSearching,
  searchResults,
  searchColleges,
  addCollegeToList,
  citySearchInput,
  setCitySearchInput,
  showCityFilter,
  setShowCityFilter,
  handleCitySelect,
  filteredCities,
  selectedCity,
  branchSearchInput,
  setBranchSearchInput,
  showBranchFilter,
  setShowBranchFilter,
  handleBranchSelect,
  filteredBranches,
  selectedBranch,
  selectedCategory,
  setSelectedCategory,
  categories,
  removeCollegeFromList,
  // Template selection props
  showTemplateSelection,
  selectedTemplate,
  availableTemplates,
  onTemplateSelect,
  onResetToTemplate,
  //export
  handleAppendColleges,
  // Folder props
  folders
}) => {
  const [activeTab, setActiveTab] = useState('search');
  const [selectedForDrag, setSelectedForDrag] = useState([]);
  const [isSearchPanelCollapsed, setIsSearchPanelCollapsed] = useState(false);
  const [collegeHistory, setCollegeHistory] = useState([]);
  const [categorySearchInput, setCategorySearchInput] = useState('');
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [filteredCategories, setFilteredCategories] = useState(categories);
  const [expandedColleges, setExpandedColleges] = useState({});
  const [selectedForExport, setSelectedForExport] = useState([]);
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportType, setExportType] = useState(''); // 'all' or 'selected'
  const [selectedTargetList, setSelectedTargetList] = useState('');
  const [isExporting, setIsExporting] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);

  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showExitConfirmation, setShowExitConfirmation] = useState(false);
  const [initialState, setInitialState] = useState({
    title: '',
    selectedColleges: [],
    selectedCategory: ''
  });

  const categoryDropdownRef = useRef(null);

  useEffect(() => {
    setInitialState({
      title: formData.title || '',
      selectedColleges: [...selectedColleges],
      selectedCategory: selectedCategory || ''
    });
    setHasUnsavedChanges(false);
  }, [editingList?.id]); 

  useEffect(() => {
    const currentState = {
      title: formData.title || '',
      selectedColleges: [...selectedColleges],
      selectedCategory: selectedCategory || ''
    };

    
    

    const hasChanges = (
      currentState.title !== initialState.title ||
      currentState.selectedCategory !== initialState.selectedCategory ||
      currentState.selectedColleges.length !== initialState.selectedColleges.length ||
      JSON.stringify(currentState.selectedColleges.map(c => c.selectedBranchCode || c.selectedBranchCode)) !== 
      JSON.stringify(initialState.selectedColleges.map(c => c.selectedBranchCode || c.selectedBranchCode))
    );

    setHasUnsavedChanges(hasChanges);
  }, [formData.title, selectedColleges, selectedCategory, initialState]);

  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = 'You have unsaved changes. Are you sure you want to leave?';
        return 'You have unsaved changes. Are you sure you want to leave?';
      }
    };

    const handlePopState = (e) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        // Push the current state back to prevent navigation
        window.history.pushState(null, '', window.location.pathname);
        setShowExitConfirmation(true);
      }
    };

    // Add event listeners
    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('popstate', handlePopState);

    // Push current state to enable popstate detection
    window.history.pushState(null, '', window.location.pathname);

    // Cleanup
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('popstate', handlePopState);
    };
  }, [hasUnsavedChanges]);



  useEffect(() => {
    // Filter categories based on search input
    if (categorySearchInput.trim() === '') {
      setFilteredCategories(categories);
    } else {
      const filtered = categories.filter(category => 
        category.toLowerCase().includes(categorySearchInput.toLowerCase())
      );
      setFilteredCategories(filtered);
    }
  }, [categorySearchInput, categories]);

  useEffect(() => {
    // Close dropdown when clicking outside
    function handleClickOutside(event) {
      if (categoryDropdownRef.current && !categoryDropdownRef.current.contains(event.target)) {
        setShowCategoryDropdown(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleClose = () => {
    if (hasUnsavedChanges) {
      setShowExitConfirmation(true);
    } else {
      closeModal();
    }
  };

  // Confirm exit without saving
  const handleConfirmExit = () => {
    setShowExitConfirmation(false);
    setHasUnsavedChanges(false);
    closeModal();
  };

  // Cancel exit and continue editing
  const handleCancelExit = () => {
    setShowExitConfirmation(false);
  };

  const handleCategorySelect = (category) => {
    setSelectedCategory(category);
    setCategorySearchInput(category);
    setShowCategoryDropdown(false);
  };

  const clearColleges = () => {
    if (window.confirm('Are you sure you want to clear all selected colleges?')) {
      setSelectedColleges([]);
    }
  };

  const handleSelectForDrag = (collegeId) => {
    
   try{
     setSelectedForDrag(prev => 
      prev.includes(collegeId) 
        ? prev.filter(id => id !== collegeId)
        : [...prev, collegeId]
    );
    setSelectedForExport(prev => 
      prev.includes(collegeId) 
        ? prev.filter(id => id !== collegeId)
        : [...prev, collegeId]
    );
   }catch(err){
    console.log('Error selecting college for drag:', err);
   }
  };

  const moveCollege = (dragIndex, hoverIndex, newOrder = null) => {
    if (newOrder) {
      // Handle bulk move with new order
      setSelectedColleges(newOrder);
    } else {
      // Handle single drag and drop
      setSelectedColleges(prevColleges => {
        const newColleges = [...prevColleges];
        const [draggedCollege] = newColleges.splice(dragIndex, 1);
        newColleges.splice(hoverIndex, 0, draggedCollege);
        return newColleges;
      });
    }
  };

  const handleUndo = () => {
    if (collegeHistory.length > 0) {
      const previousState = collegeHistory[collegeHistory.length - 1];
      setSelectedColleges(previousState);
      setCollegeHistory(prev => prev.slice(0, -1));
    }
  };

  const handleCollegeMove = (dragIndex, hoverIndex, newOrder = null) => {
    setCollegeHistory(prev => [...prev, selectedColleges]);
    if (newOrder) {
      setSelectedColleges(newOrder);
    } else {
      moveCollege(dragIndex, hoverIndex);
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

  const handleSelectForExport = (collegeId) => {
    console.log(collegeId, selectedForExport);
    
    setSelectedForExport(prev => 
      prev.includes(collegeId) 
        ? prev.filter(id => id !== collegeId)
        : [...prev, collegeId]
    );
  };

  const handleSelectAllForExport = () => {
    if (selectedForExport.length === selectedColleges.length) {
      setSelectedForExport([]);
    } else {
      setSelectedForExport(selectedColleges.map(college => college.uniqueId || college.id));
    }
  };

  const openExportModal = (type) => {
    setExportType(type);
    setShowExportModal(true);
    setSelectedTargetList('');
  };

  const handleExportColleges = async () => {
    if (!selectedTargetList) {
      alert('Please select a target list');
      return;
    }

    setIsExporting(true);

    try {
      let collegesToExport = [];
      
      if (exportType === 'all') {
        collegesToExport = selectedColleges;
      } else if (exportType === 'selected') {
        collegesToExport = selectedColleges.filter(college => 
          selectedForExport.includes(college.uniqueId || college.id)
        );
      }

      console.log('Colleges to export:', selectedColleges);
      

      if (collegesToExport.length === 0) {
        alert('No colleges to export');
        return;
      }

      // Here you would make an API call to append colleges to the target list
      // For now, we'll simulate this with a timeout
      // await new Promise(resolve => setTimeout(resolve, 1000));

      await handleAppendColleges(selectedTargetList, collegesToExport);

      // In a real implementation, you would call an API like:
      // await axiosInstance.post(`/api/admin/lists/${selectedTargetList}/append-colleges`, {
      //   colleges: collegesToExport
      // });

      alert(`Successfully exported ${collegesToExport.length} colleges to the selected list!`);
      setShowExportModal(false);
      setSelectedForExport([]);
    } catch (error) {
      console.error('Error exporting colleges:', error);
      alert('Failed to export colleges. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  // Handle import of colleges from another list
  const handleImportColleges = (collegesForImport, insertIndex) => {
    // Copy the colleges to add
    const collegesToImport = [...collegesForImport];
    
    // Determine where to insert the colleges
    if (insertIndex === -1 || insertIndex >= selectedColleges.length) {
      // Append at the end
      setSelectedColleges([...selectedColleges, ...collegesToImport]);
    } else {
      // Insert at specific index
      const updatedColleges = [...selectedColleges];
      updatedColleges.splice(insertIndex, 0, ...collegesToImport);
      setSelectedColleges(updatedColleges);
    }
    
    // Show success message or toast notification
    alert(`Successfully imported ${collegesToImport.length} colleges!`);
  };

  return (
    <div className="fixed inset-0 bg-white z-50 flex flex-col min-h-screen w-screen">
      {/* Header with title input */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 px-6 py-3 flex items-center gap-3">
        <button
          onClick={handleClose}
          className="text-white hover:bg-white/20 transition-all rounded-full p-2"
        >
          <ArrowLeft size={24} />
        </button>
        <input
          type="text"
          id="title"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          className="flex-1 max-w-xl px-3 py-2 text-sm bg-white/10 text-white placeholder-white/60 border border-white/20 rounded-lg focus:ring-2 focus:ring-white/50 focus:border-transparent"
          placeholder="Enter list title..."
          required
        />
        <div className="flex items-center gap-2">
          {/* Import Colleges Button - Only show when editing */}
          {editingList?.id && (
            <button
              onClick={() => setShowImportModal(true)}
              className="px-3 py-2 text-sm bg-white/10 text-white border border-white/20 rounded-lg hover:bg-white/20 transition-colors flex items-center gap-2"
            >
              <Import size={16} />
              Import Colleges
            </button>
          )}
          
          {/* Export Colleges Button - Only show when editing */}
          {editingList?.id && selectedColleges.length > 0 && (
            <div className="relative">
              <button
                onClick={() => setShowExportModal(true)}
                className="px-3 py-2 text-sm bg-white/10 text-white border border-white/20 rounded-lg hover:bg-white/20 transition-colors flex items-center gap-2"
              >
                <Upload size={16} />
                Export Colleges
              </button>
            </div>
          )}
          
          {/* Folder Selection */}
          <div className="relative">
            <select
              value={formData.folderId || ''}
              onChange={(e) => setFormData({ ...formData, folderId: e.target.value })}
              className="px-3 py-2 text-sm bg-white/10 text-white border border-white/20 rounded-lg focus:ring-2 focus:ring-white/50 focus:border-transparent min-w-[150px]"
            >
              <option value="" className="text-gray-900">No Folder</option>
              {folders?.filter(folder => !folder.archived).map(folder => (
                <option key={folder.id} value={folder.id} className="text-gray-900">
                  {folder.name}
                </option>
              ))}
            </select>
          </div>
          
          <div className="relative" ref={categoryDropdownRef}>
            <div 
              className="px-3 py-2 text-sm bg-white/10 text-white border border-white/20 rounded-lg focus:ring-2 focus:ring-white/50 focus:border-transparent cursor-pointer min-w-[200px] flex items-center justify-between"
              onClick={() => setShowCategoryDropdown(!showCategoryDropdown)}
            >
              <input 
                type="text" 
                value={categorySearchInput}
                onChange={(e) => {
                  setCategorySearchInput(e.target.value);
                  setShowCategoryDropdown(true);
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  setShowCategoryDropdown(true);
                }}
                placeholder="Search category..."
                className="bg-transparent text-white placeholder-white/60 focus:outline-none w-full"
              />
              <ChevronDown size={16} className="text-white/70" />
            </div>
            
            {showCategoryDropdown && (
              <div className="absolute top-full left-0 right-0 mt-1 max-h-60 overflow-y-auto bg-white border border-gray-200 rounded-md shadow-lg z-10">
                {filteredCategories.length > 0 ? (
                  filteredCategories.map((category) => (
                    <div
                      key={category}
                      className={`px-4 py-2 cursor-pointer hover:bg-blue-50 ${
                        selectedCategory === category ? 'bg-blue-100' : ''
                      }`}
                      onClick={() => handleCategorySelect(category)}
                    >
                      {category}
                    </div>
                  ))
                ) : (
                  <div className="px-4 py-2 text-gray-500">No categories found</div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Search Bar and Filters - Horizontal */}
        {!isSearchPanelCollapsed && <div className="bg-white border-b border-gray-200 px-6 py-3">
          <div className=" mx-auto">
            <CollegeSearchForm
              searchQuery={searchQuery}
              handleSearchChange={handleSearchChange}
              searchColleges={searchColleges}
              isSearching={isSearching}
              selectedCity={selectedCity}
              citySearchInput={citySearchInput}
              setCitySearchInput={setCitySearchInput}
              showCityFilter={showCityFilter}
              setShowCityFilter={setShowCityFilter}
              handleCitySelect={handleCitySelect}
              filteredCities={filteredCities}
              selectedBranch={selectedBranch}
              branchSearchInput={branchSearchInput}
              setBranchSearchInput={setBranchSearchInput}
              showBranchFilter={showBranchFilter}
              setShowBranchFilter={setShowBranchFilter}
              handleBranchSelect={handleBranchSelect}
              filteredBranches={filteredBranches}
              compact={true} // New prop for horizontal layout
            />
          </div>
        </div>}

      {/* Main Content Area */}
      <div className="flex-1 overflow-hidden bg-gray-50">
        <DndProvider backend={HTML5Backend}>
          <div className="h-full flex relative">
            {/* Search Results Panel - Collapsible */}
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
                    {searchResults.length > 0 && (
                      <span className="bg-blue-100 text-blue-800 text-sm px-2 py-1 rounded-full">
                        {searchResults.length} colleges
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex-1 overflow-y-auto bg-white rounded-lg border border-gray-200">
                  <CollegeSearchResults
                    selectedCategory={selectedCategory}
                    searchResults={searchResults}
                    selectedColleges={selectedColleges}
                    addCollegeToList={addCollegeToList}
                    searchQuery={searchQuery}
                    selectedCity={selectedCity}
                    selectedBranch={selectedBranch}
                    selectedForDrag={selectedForDrag}
                    onSelectForDrag={handleSelectForDrag}
                  />
                </div>
              </div>
            </div>

            {/* Collapse Toggle Button */}
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

            {/* Selected Colleges Panel - Update to include export selection */}
            <div className={`
              transition-all duration-300 ease-in-out
              ${isSearchPanelCollapsed ? 'w-full' : 'w-1/2'}
              p-4 flex flex-col h-full
            `}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-medium text-gray-800 flex items-center">
                    <GraduationCap size={20} className="text-blue-600 mr-2" />
                    Selected Colleges ({selectedColleges.length})
                  </h3>
                  {/* Export selection controls - Only show when editing */}
                  {editingList?.id && selectedColleges.length > 0 && (
                    <div className="flex items-center gap-2 ml-4">
                      <button
                        onClick={handleSelectAllForExport}
                        className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
                      >
                        {selectedForExport.length === selectedColleges.length ? 'Deselect All' : 'Select All'}
                      </button>
                      <span className="text-xs text-gray-500">
                        ({selectedForExport.length} selected for export)
                      </span>
                    </div>
                  )}
                  {collegeHistory.length > 0 && (
                    <button
                      onClick={handleUndo}
                      className="p-1.5 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
                      title="Undo last change"
                    >
                      <Undo size={16} />
                    </button>
                  )}
                </div>
                {selectedColleges.length > 0 && (
                  <button
                    onClick={clearColleges}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50 px-3 py-1 rounded-md text-sm font-medium transition-colors flex items-center"
                  >
                    <Trash2 size={16} className="mr-1.5" />
                    Clear All
                  </button>
                )}
              </div>
              <div className="flex-1 overflow-y-auto bg-white rounded-lg border border-gray-200">
                <SelectedColleges
                  selectedCategory={selectedCategory}
                  selectedColleges={selectedColleges}
                  moveCollege={handleCollegeMove}
                  removeCollegeFromList={removeCollegeFromList}
                  isSearchPanelCollapsed={isSearchPanelCollapsed}
                  // Add export selection props
                  editingList={editingList}
                  selectedForExport={selectedForExport}
                  onSelectForExport={handleSelectForExport}
                />
              </div>
            </div>
          </div>
        </DndProvider>
      </div>

      {/* Footer */}
      <div className="bg-white px-6 py-3 border-t border-gray-200">
        <div className="flex justify-end gap-3 max-w-7xl mx-auto">
          <button
            onClick={closeModal}
            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!formData.title || selectedColleges.length === 0}
            className={`px-4 py-2 rounded-lg text-white font-medium flex items-center ${
              !formData.title || selectedColleges.length === 0
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            <Plus size={18} className="mr-1.5" />
            {editingList ? 'Update List' : 'Create List'}
          </button>
        </div>
      </div>

      {/* Template Selection - For new lists */}
      {!editingList?.id && showTemplateSelection && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-6xl w-full max-h-[90vh] overflow-hidden">
            <div className="p-6 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-900">
                Create New List
              </h2>
              <button
                onClick={closeModal}
                className="text-gray-400 hover:text-gray-500 text-2xl font-bold"
              >
                <X size={24} />
              </button>
            </div>

            <div className="overflow-y-auto max-h-[calc(90vh-140px)]">
              <form onSubmit={handleSubmit} className="p-6">
                {/* Template Selection Section - Only show for new lists */}
                {!editingList?.id && showTemplateSelection && (
                  <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <h3 className="text-lg font-semibold text-blue-900 mb-3 flex items-center gap-2">
                      <Copy size={20} />
                      Select Template (Optional)
                    </h3>
                    <p className="text-sm text-blue-700 mb-4">
                      Choose an existing list as a template to copy its colleges to your new list.
                    </p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-blue-900 mb-2">
                          Available Templates
                        </label>
                        <select
                          value={selectedTemplate}
                          onChange={(e) => onTemplateSelect(e.target.value)}
                          className="w-full px-3 py-2 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                          <option value="">Create from scratch</option>
                          {availableTemplates.map(template => (
                            <option key={template.id} value={template.id}>
                              {template.title} ({template.colleges?.length || 0} colleges)
                            </option>
                          ))}
                        </select>
                      </div>
                      
                      {selectedTemplate && (
                        <div className="flex items-end">
                          <button
                            type="button"
                            onClick={onResetToTemplate}
                            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                          >
                            <RotateCcw size={16} />
                            Change Template
                          </button>
                        </div>
                      )}
                    </div>

                    {selectedTemplate && (
                      <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                        <p className="text-sm text-green-700">
                          ✅ Template applied! {selectedColleges.length} colleges have been copied to your new list.
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* Template Info for New Lists (after selection) */}
                {!editingList?.id && !showTemplateSelection && selectedTemplate && (
                  <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex justify-between items-center">
                      <p className="text-sm text-green-700">
                        📋 Using template: <strong>{availableTemplates.find(t => t.id === selectedTemplate)?.title}</strong>
                      </p>
                      <button
                        type="button"
                        onClick={onResetToTemplate}
                        className="text-xs text-blue-600 hover:text-blue-800 underline"
                      >
                        Change template
                      </button>
                    </div>
                  </div>
                )}

                {/* List Title */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    List Title *
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter list title..."
                    required
                  />
                </div>

                {/* Folder Selection */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Folder
                  </label>
                  <select
                    value={formData.folderId || ''}
                    onChange={(e) => setFormData({ ...formData, folderId: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">No Folder</option>
                    {folders?.filter(folder => !folder.archived).map(folder => (
                      <option key={folder.id} value={folder.id}>
                        {folder.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Category Selection */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Category *
                  </label>
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  >
                    {categories.map(category => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Show college search and management only if not in template selection mode */}
                {(!showTemplateSelection || editingList?.id) && (
                  <>
                    {/* Search and Filter Section */}
                    <div className="mb-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Search and Add Colleges</h3>
                      
                      {/* College Search */}
                      <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Search Colleges
                        </label>
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                          <input
                            type="text"
                            value={searchQuery}
                            onChange={handleSearchChange}
                            placeholder="Search by institute name or code..."
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                      </div>

                      {/* Filters */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        {/* City Filter */}
                        <div className="relative">
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Filter by City
                          </label>
                          <button
                            type="button"
                            onClick={() => setShowCityFilter(!showCityFilter)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-left flex justify-between items-center focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          >
                            <span>{selectedCity || 'All Cities'}</span>
                            <ChevronDown size={16} />
                          </button>
                          
                          {showCityFilter && (
                            <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                              <div className="p-2">
                                <input
                                  type="text"
                                  value={citySearchInput}
                                  onChange={(e) => setCitySearchInput(e.target.value)}
                                  placeholder="Search cities..."
                                  className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                                />
                              </div>
                              <div className="max-h-48 overflow-y-auto">
                                <button
                                  type="button"
                                  onClick={() => handleCitySelect('')}
                                  className="w-full px-3 py-2 text-left hover:bg-gray-100 text-sm"
                                >
                                  All Cities
                                </button>
                                {filteredCities.map(city => (
                                  <button
                                    key={city}
                                    type="button"
                                    onClick={() => handleCitySelect(city)}
                                    className="w-full px-3 py-2 text-left hover:bg-gray-100 text-sm"
                                  >
                                    {city}
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Branch Filter */}
                        <div className="relative">
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Filter by Branch
                          </label>
                          <button
                            type="button"
                            onClick={() => setShowBranchFilter(!showBranchFilter)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-left flex justify-between items-center focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          >
                            <span>{selectedBranch || 'All Branches'}</span>
                            <ChevronDown size={16} />
                          </button>
                          
                          {showBranchFilter && (
                            <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                              <div className="p-2">
                                <input
                                  type="text"
                                  value={branchSearchInput}
                                  onChange={(e) => setBranchSearchInput(e.target.value)}
                                  placeholder="Search branches..."
                                  className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                                />
                              </div>
                              <div className="max-h-48 overflow-y-auto">
                                <button
                                  type="button"
                                  onClick={() => handleBranchSelect('')}
                                  className="w-full px-3 py-2 text-left hover:bg-gray-100 text-sm"
                                >
                                  All Branches
                                </button>
                                {filteredBranches.map(branch => (
                                  <button
                                    key={branch}
                                    type="button"
                                    onClick={() => handleBranchSelect(branch)}
                                    className="w-full px-3 py-2 text-left hover:bg-gray-100 text-sm"
                                  >
                                    {branch}
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Search Results */}
                      {searchResults.length > 0 && (
                        <div className="mb-4">
                          <h4 className="text-sm font-medium text-gray-700 mb-2">
                            Search Results ({searchResults.length} colleges found)
                          </h4>
                          <div className="max-h-60 overflow-y-auto border border-gray-200 rounded-lg">
                            {searchResults.map(college => (
                              <div key={college.id} className="border-b border-gray-100 last:border-b-0">
                                <div className="p-3">
                                  <div className="flex justify-between items-start">
                                    <div className="flex-1">
                                      <h5 className="font-medium text-gray-900">{college.instituteName}</h5>
                                      <p className="text-sm text-gray-500">
                                        Code: {college.instituteCode} | City: {college.city}
                                      </p>
                                    </div>
                                    <button
                                      type="button"
                                      onClick={() => addCollegeToList(college)}
                                      className="ml-2 px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                                    >
                                      Add College
                                    </button>
                                  </div>
                                  
                                  {college.branches && college.branches.length > 0 && (
                                    <div className="mt-2">
                                      <button
                                        type="button"
                                        onClick={() => toggleCollegeBranches(college.id)}
                                        className="flex items-center text-sm text-blue-600 hover:text-blue-800"
                                      >
                                        {expandedColleges[college.id] ? (
                                          <>
                                            <ChevronUp size={16} className="mr-1" />
                                            Hide Branches ({college.branches.length})
                                          </>
                                        ) : (
                                          <>
                                            <ChevronDown size={16} className="mr-1" />
                                            Show Branches ({college.branches.length})
                                          </>
                                        )}
                                      </button>
                                      
                                      {expandedColleges[college.id] && (
                                        <div className="mt-2 space-y-1">
                                          {college.branches.map(branch => (
                                            <div key={branch.branchCode} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                                              <span className="text-sm text-gray-700">{branch.branchName}</span>
                                              <button
                                                type="button"
                                                onClick={() => addCollegeToList(college, branch)}
                                                className="px-2 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700"
                                              >
                                                Add Branch
                                              </button>
                                            </div>
                                          ))}
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {isSearching && (
                        <div className="text-center py-4">
                          <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
                          <p className="text-sm text-gray-500 mt-2">Searching colleges...</p>
                        </div>
                      )}
                    </div>

                    {/* Selected Colleges Section */}
                    <div className="mb-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">
                        Selected Colleges ({selectedColleges.length})
                      </h3>
                      
                      {selectedColleges.length === 0 ? (
                        <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                          <p>No colleges selected yet</p>
                          <p className="text-sm mt-1">Search and add colleges using the form above</p>
                        </div>
                      ) : (
                        <div className="space-y-2 max-h-60 overflow-y-auto border border-gray-200 rounded-lg p-4">
                          {selectedColleges.map((college, index) => (
                            <DraggableCollegeItem
                              key={college.uniqueId || college.id}
                              college={college}
                              index={index}
                              moveCollege={moveCollege}
                              onRemove={() => removeCollegeFromList(index)}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  </>
                )}

                {/* Form Actions */}
                <div className="flex justify-end gap-4 pt-4 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  
                  {/* Only show save button if not in template selection mode */}
                  {(
                    <button
                      type="submit"
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      disabled={!formData.title.trim()}
                    >
                      {editingList?.id ? 'Update List' : 'Create List'}
                    </button>
                  )}
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Export Colleges Modal */}
      {showExportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-60">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-900">Export Colleges</h3>
                <button
                  onClick={() => setShowExportModal(false)}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-4">
              {/* Export Type Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  What to export?
                </label>
                <div className="space-y-2">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="exportType"
                      value="all"
                      checked={exportType === 'all'}
                      onChange={(e) => setExportType(e.target.value)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                    />
                    <span className="ml-2 text-sm text-gray-700">
                      All Colleges ({selectedColleges.length} colleges)
                    </span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="exportType"
                      value="selected"
                      checked={exportType === 'selected'}
                      onChange={(e) => setExportType(e.target.value)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                    />
                    <span className="ml-2 text-sm text-gray-700">
                      Selected Colleges ({selectedForExport.length} colleges)
                    </span>
                  </label>
                </div>
              </div>

              {/* Target List Selection */}
              {exportType && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Export to which list?
                  </label>
                  <select
                    value={selectedTargetList}
                    onChange={(e) => setSelectedTargetList(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  >
                    <option value="">Select a list...</option>
                    {availableTemplates
                      .filter(list => list.id !== editingList?.id) // Exclude current list
                      .map(list => (
                        <option key={list.id} value={list.id}>
                          {list.title} ({list.colleges?.length || 0} colleges)
                        </option>
                      ))}
                  </select>
                </div>
              )}

              {/* Export Summary */}
              {exportType && selectedTargetList && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-800">
                    📤 Ready to export{' '}
                    <strong>
                      {exportType === 'all' ? selectedColleges.length : selectedForExport.length} colleges
                    </strong>{' '}
                    to{' '}
                    <strong>
                      {availableTemplates.find(list => list.id === selectedTargetList)?.title}
                    </strong>
                  </p>
                </div>
              )}
            </div>

            <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
              <button
                onClick={() => setShowExportModal(false)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                disabled={isExporting}
              >
                Cancel
              </button>
              <button
                onClick={handleExportColleges}
                disabled={!exportType || !selectedTargetList || isExporting}
                className={`px-4 py-2 rounded-lg text-white transition-colors flex items-center gap-2 ${
                  !exportType || !selectedTargetList || isExporting
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700'
                }`}
              >
                {isExporting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
                    Exporting...
                  </>
                ) : (
                  <>
                    <Upload size={16} />
                    Export Colleges
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Import Colleges Modal */}
      <ImportColleges 
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        onImport={handleImportColleges}
        availableLists={availableTemplates || []} // Using available templates as the list of available lists
        currentListId={editingList?.id}
        currentCollegesCount={selectedColleges.length}
        folders={folders || []}
      />

      {/* Template Selection - For new lists */}
      {!editingList?.id && showTemplateSelection && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-6xl w-full max-h-[90vh] overflow-hidden">
            <div className="p-6 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-900">
                Create New List
              </h2>
              <button
                onClick={closeModal}
                className="text-gray-400 hover:text-gray-500 text-2xl font-bold"
              >
                <X size={24} />
              </button>
            </div>

            <div className="overflow-y-auto max-h-[calc(90vh-140px)]">
              <form onSubmit={handleSubmit} className="p-6">
                {/* Template Selection Section - Only show for new lists */}
                {!editingList?.id && showTemplateSelection && (
                  <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <h3 className="text-lg font-semibold text-blue-900 mb-3 flex items-center gap-2">
                      <Copy size={20} />
                      Select Template (Optional)
                    </h3>
                    <p className="text-sm text-blue-700 mb-4">
                      Choose an existing list as a template to copy its colleges to your new list.
                    </p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-blue-900 mb-2">
                          Available Templates
                        </label>
                        <select
                          value={selectedTemplate}
                          onChange={(e) => onTemplateSelect(e.target.value)}
                          className="w-full px-3 py-2 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                          <option value="">Create from scratch</option>
                          {availableTemplates.map(template => (
                            <option key={template.id} value={template.id}>
                              {template.title} ({template.colleges?.length || 0} colleges)
                            </option>
                          ))}
                        </select>
                      </div>
                      
                      {selectedTemplate && (
                        <div className="flex items-end">
                          <button
                            type="button"
                            onClick={onResetToTemplate}
                            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                          >
                            <RotateCcw size={16} />
                            Change Template
                          </button>
                        </div>
                      )}
                    </div>

                    {selectedTemplate && (
                      <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                        <p className="text-sm text-green-700">
                          ✅ Template applied! {selectedColleges.length} colleges have been copied to your new list.
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* Template Info for New Lists (after selection) */}
                {!editingList?.id && !showTemplateSelection && selectedTemplate && (
                  <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex justify-between items-center">
                      <p className="text-sm text-green-700">
                        📋 Using template: <strong>{availableTemplates.find(t => t.id === selectedTemplate)?.title}</strong>
                      </p>
                      <button
                        type="button"
                        onClick={onResetToTemplate}
                        className="text-xs text-blue-600 hover:text-blue-800 underline"
                      >
                        Change template
                      </button>
                    </div>
                  </div>
                )}

                {/* List Title */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    List Title *
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter list title..."
                    required
                  />
                </div>

                {/* Folder Selection */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Folder
                  </label>
                  <select
                    value={formData.folderId || ''}
                    onChange={(e) => setFormData({ ...formData, folderId: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">No Folder</option>
                    {folders?.filter(folder => !folder.archived).map(folder => (
                      <option key={folder.id} value={folder.id}>
                        {folder.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Category Selection */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Category *
                  </label>
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  >
                    {categories.map(category => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Show college search and management only if not in template selection mode */}
                {(!showTemplateSelection || editingList?.id) && (
                  <>
                    {/* Search and Filter Section */}
                    <div className="mb-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Search and Add Colleges</h3>
                      
                      {/* College Search */}
                      <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Search Colleges
                        </label>
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                          <input
                            type="text"
                            value={searchQuery}
                            onChange={handleSearchChange}
                            placeholder="Search by institute name or code..."
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                      </div>

                      {/* Filters */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        {/* City Filter */}
                        <div className="relative">
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Filter by City
                          </label>
                          <button
                            type="button"
                            onClick={() => setShowCityFilter(!showCityFilter)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-left flex justify-between items-center focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          >
                            <span>{selectedCity || 'All Cities'}</span>
                            <ChevronDown size={16} />
                          </button>
                          
                          {showCityFilter && (
                            <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                              <div className="p-2">
                                <input
                                  type="text"
                                  value={citySearchInput}
                                  onChange={(e) => setCitySearchInput(e.target.value)}
                                  placeholder="Search cities..."
                                  className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                                />
                              </div>
                              <div className="max-h-48 overflow-y-auto">
                                <button
                                  type="button"
                                  onClick={() => handleCitySelect('')}
                                  className="w-full px-3 py-2 text-left hover:bg-gray-100 text-sm"
                                >
                                  All Cities
                                </button>
                                {filteredCities.map(city => (
                                  <button
                                    key={city}
                                    type="button"
                                    onClick={() => handleCitySelect(city)}
                                    className="w-full px-3 py-2 text-left hover:bg-gray-100 text-sm"
                                  >
                                    {city}
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Branch Filter */}
                        <div className="relative">
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Filter by Branch
                          </label>
                          <button
                            type="button"
                            onClick={() => setShowBranchFilter(!showBranchFilter)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-left flex justify-between items-center focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          >
                            <span>{selectedBranch || 'All Branches'}</span>
                            <ChevronDown size={16} />
                          </button>
                          
                          {showBranchFilter && (
                            <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                              <div className="p-2">
                                <input
                                  type="text"
                                  value={branchSearchInput}
                                  onChange={(e) => setBranchSearchInput(e.target.value)}
                                  placeholder="Search branches..."
                                  className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                                />
                              </div>
                              <div className="max-h-48 overflow-y-auto">
                                <button
                                  type="button"
                                  onClick={() => handleBranchSelect('')}
                                  className="w-full px-3 py-2 text-left hover:bg-gray-100 text-sm"
                                >
                                  All Branches
                                </button>
                                {filteredBranches.map(branch => (
                                  <button
                                    key={branch}
                                    type="button"
                                    onClick={() => handleBranchSelect(branch)}
                                    className="w-full px-3 py-2 text-left hover:bg-gray-100 text-sm"
                                  >
                                    {branch}
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Search Results */}
                      {searchResults.length > 0 && (
                        <div className="mb-4">
                          <h4 className="text-sm font-medium text-gray-700 mb-2">
                            Search Results ({searchResults.length} colleges found)
                          </h4>
                          <div className="max-h-60 overflow-y-auto border border-gray-200 rounded-lg">
                            {searchResults.map(college => (
                              <div key={college.id} className="border-b border-gray-100 last:border-b-0">
                                <div className="p-3">
                                  <div className="flex justify-between items-start">
                                    <div className="flex-1">
                                      <h5 className="font-medium text-gray-900">{college.instituteName}</h5>
                                      <p className="text-sm text-gray-500">
                                        Code: {college.instituteCode} | City: {college.city}
                                      </p>
                                    </div>
                                    <button
                                      type="button"
                                      onClick={() => addCollegeToList(college)}
                                      className="ml-2 px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                                    >
                                      Add College
                                    </button>
                                  </div>
                                  
                                  {college.branches && college.branches.length > 0 && (
                                    <div className="mt-2">
                                      <button
                                        type="button"
                                        onClick={() => toggleCollegeBranches(college.id)}
                                        className="flex items-center text-sm text-blue-600 hover:text-blue-800"
                                      >
                                        {expandedColleges[college.id] ? (
                                          <>
                                            <ChevronUp size={16} className="mr-1" />
                                            Hide Branches ({college.branches.length})
                                          </>
                                        ) : (
                                          <>
                                            <ChevronDown size={16} className="mr-1" />
                                            Show Branches ({college.branches.length})
                                          </>
                                        )}
                                      </button>
                                      
                                      {expandedColleges[college.id] && (
                                        <div className="mt-2 space-y-1">
                                          {college.branches.map(branch => (
                                            <div key={branch.branchCode} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                                              <span className="text-sm text-gray-700">{branch.branchName}</span>
                                              <button
                                                type="button"
                                                onClick={() => addCollegeToList(college, branch)}
                                                className="px-2 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700"
                                              >
                                                Add Branch
                                              </button>
                                            </div>
                                          ))}
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {isSearching && (
                        <div className="text-center py-4">
                          <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
                          <p className="text-sm text-gray-500 mt-2">Searching colleges...</p>
                        </div>
                      )}
                    </div>

                    {/* Selected Colleges Section */}
                    <div className="mb-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">
                        Selected Colleges ({selectedColleges.length})
                      </h3>
                      
                      {selectedColleges.length === 0 ? (
                        <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                          <p>No colleges selected yet</p>
                          <p className="text-sm mt-1">Search and add colleges using the form above</p>
                        </div>
                      ) : (
                        <div className="space-y-2 max-h-60 overflow-y-auto border border-gray-200 rounded-lg p-4">
                          {selectedColleges.map((college, index) => (
                            <DraggableCollegeItem
                              key={college.uniqueId || college.id}
                              college={college}
                              index={index}
                              moveCollege={moveCollege}
                              onRemove={() => removeCollegeFromList(index)}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  </>
                )}

                {/* Form Actions */}
                <div className="flex justify-end gap-4 pt-4 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  
                  {/* Only show save button if not in template selection mode */}
                  {(
                    <button
                      type="submit"
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      disabled={!formData.title.trim()}
                    >
                      {editingList?.id ? 'Update List' : 'Create List'}
                    </button>
                  )}
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Export Colleges Modal */}
      {showExportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-60">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-900">Export Colleges</h3>
                <button
                  onClick={() => setShowExportModal(false)}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-4">
              {/* Export Type Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  What to export?
                </label>
                <div className="space-y-2">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="exportType"
                      value="all"
                      checked={exportType === 'all'}
                      onChange={(e) => setExportType(e.target.value)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                    />
                    <span className="ml-2 text-sm text-gray-700">
                      All Colleges ({selectedColleges.length} colleges)
                    </span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="exportType"
                      value="selected"
                      checked={exportType === 'selected'}
                      onChange={(e) => setExportType(e.target.value)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                    />
                    <span className="ml-2 text-sm text-gray-700">
                      Selected Colleges ({selectedForExport.length} colleges)
                    </span>
                  </label>
                </div>
              </div>

              {/* Target List Selection */}
              {exportType && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Export to which list?
                  </label>
                  <select
                    value={selectedTargetList}
                    onChange={(e) => setSelectedTargetList(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  >
                    <option value="">Select a list...</option>
                    {availableTemplates
                      .filter(list => list.id !== editingList?.id) // Exclude current list
                      .map(list => (
                        <option key={list.id} value={list.id}>
                          {list.title} ({list.colleges?.length || 0} colleges)
                        </option>
                      ))}
                  </select>
                </div>
              )}

              {/* Export Summary */}
              {exportType && selectedTargetList && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-800">
                    📤 Ready to export{' '}
                    <strong>
                      {exportType === 'all' ? selectedColleges.length : selectedForExport.length} colleges
                    </strong>{' '}
                    to{' '}
                    <strong>
                      {availableTemplates.find(list => list.id === selectedTargetList)?.title}
                    </strong>
                  </p>
                </div>
              )}
            </div>

            <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
              <button
                onClick={() => setShowExportModal(false)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                disabled={isExporting}
              >
                Cancel
              </button>
              <button
                onClick={handleExportColleges}
                disabled={!exportType || !selectedTargetList || isExporting}
                className={`px-4 py-2 rounded-lg text-white transition-colors flex items-center gap-2 ${
                  !exportType || !selectedTargetList || isExporting
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700'
                }`}
              >
                {isExporting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
                    Exporting...
                  </>
                ) : (
                  <>
                    <Upload size={16} />
                    Export Colleges
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Template Selection - For new lists */}
      {!editingList?.id && showTemplateSelection && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-6xl w-full max-h-[90vh] overflow-hidden">
            <div className="p-6 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-900">
                Create New List
              </h2>
              <button
                onClick={closeModal}
                className="text-gray-400 hover:text-gray-500 text-2xl font-bold"
              >
                <X size={24} />
              </button>
            </div>

            <div className="overflow-y-auto max-h-[calc(90vh-140px)]">
              <form onSubmit={handleSubmit} className="p-6">
                {/* Template Selection Section - Only show for new lists */}
                {!editingList?.id && showTemplateSelection && (
                  <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <h3 className="text-lg font-semibold text-blue-900 mb-3 flex items-center gap-2">
                      <Copy size={20} />
                      Select Template (Optional)
                    </h3>
                    <p className="text-sm text-blue-700 mb-4">
                      Choose an existing list as a template to copy its colleges to your new list.
                    </p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-blue-900 mb-2">
                          Available Templates
                        </label>
                        <select
                          value={selectedTemplate}
                          onChange={(e) => onTemplateSelect(e.target.value)}
                          className="w-full px-3 py-2 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                          <option value="">Create from scratch</option>
                          {availableTemplates.map(template => (
                            <option key={template.id} value={template.id}>
                              {template.title} ({template.colleges?.length || 0} colleges)
                            </option>
                          ))}
                        </select>
                      </div>
                      
                      {selectedTemplate && (
                        <div className="flex items-end">
                          <button
                            type="button"
                            onClick={onResetToTemplate}
                            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                          >
                            <RotateCcw size={16} />
                            Change Template
                          </button>
                        </div>
                      )}
                    </div>

                    {selectedTemplate && (
                      <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                        <p className="text-sm text-green-700">
                          ✅ Template applied! {selectedColleges.length} colleges have been copied to your new list.
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* Template Info for New Lists (after selection) */}
                {!editingList?.id && !showTemplateSelection && selectedTemplate && (
                  <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex justify-between items-center">
                      <p className="text-sm text-green-700">
                        📋 Using template: <strong>{availableTemplates.find(t => t.id === selectedTemplate)?.title}</strong>
                      </p>
                      <button
                        type="button"
                        onClick={onResetToTemplate}
                        className="text-xs text-blue-600 hover:text-blue-800 underline"
                      >
                        Change template
                      </button>
                    </div>
                  </div>
                )}

                {/* List Title */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    List Title *
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter list title..."
                    required
                  />
                </div>

                {/* Folder Selection */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Folder
                  </label>
                  <select
                    value={formData.folderId || ''}
                    onChange={(e) => setFormData({ ...formData, folderId: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">No Folder</option>
                    {folders?.filter(folder => !folder.archived).map(folder => (
                      <option key={folder.id} value={folder.id}>
                        {folder.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Category Selection */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Category *
                  </label>
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  >
                    {categories.map(category => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Show college search and management only if not in template selection mode */}
                {(!showTemplateSelection || editingList?.id) && (
                  <>
                    {/* Search and Filter Section */}
                    <div className="mb-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Search and Add Colleges</h3>
                      
                      {/* College Search */}
                      <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Search Colleges
                        </label>
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                          <input
                            type="text"
                            value={searchQuery}
                            onChange={handleSearchChange}
                            placeholder="Search by institute name or code..."
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                      </div>

                      {/* Filters */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        {/* City Filter */}
                        <div className="relative">
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Filter by City
                          </label>
                          <button
                            type="button"
                            onClick={() => setShowCityFilter(!showCityFilter)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-left flex justify-between items-center focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          >
                            <span>{selectedCity || 'All Cities'}</span>
                            <ChevronDown size={16} />
                          </button>
                          
                          {showCityFilter && (
                            <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                              <div className="p-2">
                                <input
                                  type="text"
                                  value={citySearchInput}
                                  onChange={(e) => setCitySearchInput(e.target.value)}
                                  placeholder="Search cities..."
                                  className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                                />
                              </div>
                              <div className="max-h-48 overflow-y-auto">
                                <button
                                  type="button"
                                  onClick={() => handleCitySelect('')}
                                  className="w-full px-3 py-2 text-left hover:bg-gray-100 text-sm"
                                >
                                  All Cities
                                </button>
                                {filteredCities.map(city => (
                                  <button
                                    key={city}
                                    type="button"
                                    onClick={() => handleCitySelect(city)}
                                    className="w-full px-3 py-2 text-left hover:bg-gray-100 text-sm"
                                  >
                                    {city}
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Branch Filter */}
                        <div className="relative">
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Filter by Branch
                          </label>
                          <button
                            type="button"
                            onClick={() => setShowBranchFilter(!showBranchFilter)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-left flex justify-between items-center focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          >
                            <span>{selectedBranch || 'All Branches'}</span>
                            <ChevronDown size={16} />
                          </button>
                          
                          {showBranchFilter && (
                            <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                              <div className="p-2">
                                <input
                                  type="text"
                                  value={branchSearchInput}
                                  onChange={(e) => setBranchSearchInput(e.target.value)}
                                  placeholder="Search branches..."
                                  className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                                />
                              </div>
                              <div className="max-h-48 overflow-y-auto">
                                <button
                                  type="button"
                                  onClick={() => handleBranchSelect('')}
                                  className="w-full px-3 py-2 text-left hover:bg-gray-100 text-sm"
                                >
                                  All Branches
                                </button>
                                {filteredBranches.map(branch => (
                                  <button
                                    key={branch}
                                    type="button"
                                    onClick={() => handleBranchSelect(branch)}
                                    className="w-full px-3 py-2 text-left hover:bg-gray-100 text-sm"
                                  >
                                    {branch}
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Search Results */}
                      {searchResults.length > 0 && (
                        <div className="mb-4">
                          <h4 className="text-sm font-medium text-gray-700 mb-2">
                            Search Results ({searchResults.length} colleges found)
                          </h4>
                          <div className="max-h-60 overflow-y-auto border border-gray-200 rounded-lg">
                            {searchResults.map(college => (
                              <div key={college.id} className="border-b border-gray-100 last:border-b-0">
                                <div className="p-3">
                                  <div className="flex justify-between items-start">
                                    <div className="flex-1">
                                      <h5 className="font-medium text-gray-900">{college.instituteName}</h5>
                                      <p className="text-sm text-gray-500">
                                        Code: {college.instituteCode} | City: {college.city}
                                      </p>
                                    </div>
                                    <button
                                      type="button"
                                      onClick={() => addCollegeToList(college)}
                                      className="ml-2 px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                                    >
                                      Add College
                                    </button>
                                  </div>
                                  
                                  {college.branches && college.branches.length > 0 && (
                                    <div className="mt-2">
                                      <button
                                        type="button"
                                        onClick={() => toggleCollegeBranches(college.id)}
                                        className="flex items-center text-sm text-blue-600 hover:text-blue-800"
                                      >
                                        {expandedColleges[college.id] ? (
                                          <>
                                            <ChevronUp size={16} className="mr-1" />
                                            Hide Branches ({college.branches.length})
                                          </>
                                        ) : (
                                          <>
                                            <ChevronDown size={16} className="mr-1" />
                                            Show Branches ({college.branches.length})
                                          </>
                                        )}
                                      </button>
                                      
                                      {expandedColleges[college.id] && (
                                        <div className="mt-2 space-y-1">
                                          {college.branches.map(branch => (
                                            <div key={branch.branchCode} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                                              <span className="text-sm text-gray-700">{branch.branchName}</span>
                                              <button
                                                type="button"
                                                onClick={() => addCollegeToList(college, branch)}
                                                className="px-2 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700"
                                              >
                                                Add Branch
                                              </button>
                                            </div>
                                          ))}
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {isSearching && (
                        <div className="text-center py-4">
                          <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
                          <p className="text-sm text-gray-500 mt-2">Searching colleges...</p>
                        </div>
                      )}
                    </div>

                    {/* Selected Colleges Section */}
                    <div className="mb-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">
                        Selected Colleges ({selectedColleges.length})
                      </h3>
                      
                      {selectedColleges.length === 0 ? (
                        <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                          <p>No colleges selected yet</p>
                          <p className="text-sm mt-1">Search and add colleges using the form above</p>
                        </div>
                      ) : (
                        <div className="space-y-2 max-h-60 overflow-y-auto border border-gray-200 rounded-lg p-4">
                          {selectedColleges.map((college, index) => (
                            <DraggableCollegeItem
                              key={college.uniqueId || college.id}
                              college={college}
                              index={index}
                              moveCollege={moveCollege}
                              onRemove={() => removeCollegeFromList(index)}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  </>
                )}

                {/* Form Actions */}
                <div className="flex justify-end gap-4 pt-4 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  
                  {/* Only show save button if not in template selection mode */}
                  {(
                    <button
                      type="submit"
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      disabled={!formData.title.trim()}
                    >
                      {editingList?.id ? 'Update List' : 'Create List'}
                    </button>
                  )}
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Export Colleges Modal */}
      {showExportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-60">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-900">Export Colleges</h3>
                <button
                  onClick={() => setShowExportModal(false)}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-4">
              {/* Export Type Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  What to export?
                </label>
                <div className="space-y-2">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="exportType"
                      value="all"
                      checked={exportType === 'all'}
                      onChange={(e) => setExportType(e.target.value)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                    />
                    <span className="ml-2 text-sm text-gray-700">
                      All Colleges ({selectedColleges.length} colleges)
                    </span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="exportType"
                      value="selected"
                      checked={exportType === 'selected'}
                      onChange={(e) => setExportType(e.target.value)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                    />
                    <span className="ml-2 text-sm text-gray-700">
                      Selected Colleges ({selectedForExport.length} colleges)
                    </span>
                  </label>
                </div>
              </div>

              {/* Target List Selection */}
              {exportType && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Export to which list?
                  </label>
                  <select
                    value={selectedTargetList}
                    onChange={(e) => setSelectedTargetList(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  >
                    <option value="">Select a list...</option>
                    {availableTemplates
                      .filter(list => list.id !== editingList?.id) // Exclude current list
                      .map(list => (
                        <option key={list.id} value={list.id}>
                          {list.title} ({list.colleges?.length || 0} colleges)
                        </option>
                      ))}
                  </select>
                </div>
              )}

              {/* Export Summary */}
              {exportType && selectedTargetList && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-800">
                    📤 Ready to export{' '}
                    <strong>
                      {exportType === 'all' ? selectedColleges.length : selectedForExport.length} colleges
                    </strong>{' '}
                    to{' '}
                    <strong>
                      {availableTemplates.find(list => list.id === selectedTargetList)?.title}
                    </strong>
                  </p>
                </div>
              )}
            </div>

            <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
              <button
                onClick={() => setShowExportModal(false)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                disabled={isExporting}
              >
                Cancel
              </button>
              <button
                onClick={handleExportColleges}
                disabled={!exportType || !selectedTargetList || isExporting}
                className={`px-4 py-2 rounded-lg text-white transition-colors flex items-center gap-2 ${
                  !exportType || !selectedTargetList || isExporting
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700'
                }`}
              >
                {isExporting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
                    Exporting...
                  </>
                ) : (
                  <>
                    <Upload size={16} />
                    Export Colleges
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Template Selection - For new lists */}
      {!editingList?.id && showTemplateSelection && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-6xl w-full max-h-[90vh] overflow-hidden">
            <div className="p-6 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-900">
                Create New List
              </h2>
              <button
                onClick={closeModal}
                className="text-gray-400 hover:text-gray-500 text-2xl font-bold"
              >
                <X size={24} />
              </button>
            </div>

            <div className="overflow-y-auto max-h-[calc(90vh-140px)]">
              <form onSubmit={handleSubmit} className="p-6">
                {/* Template Selection Section - Only show for new lists */}
                {!editingList?.id && showTemplateSelection && (
                  <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <h3 className="text-lg font-semibold text-blue-900 mb-3 flex items-center gap-2">
                      <Copy size={20} />
                      Select Template (Optional)
                    </h3>
                    <p className="text-sm text-blue-700 mb-4">
                      Choose an existing list as a template to copy its colleges to your new list.
                    </p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-blue-900 mb-2">
                          Available Templates
                        </label>
                        <select
                          value={selectedTemplate}
                          onChange={(e) => onTemplateSelect(e.target.value)}
                          className="w-full px-3 py-2 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                          <option value="">Create from scratch</option>
                          {availableTemplates.map(template => (
                            <option key={template.id} value={template.id}>
                              {template.title} ({template.colleges?.length || 0} colleges)
                            </option>
                          ))}
                        </select>
                      </div>
                      
                      {selectedTemplate && (
                        <div className="flex items-end">
                          <button
                            type="button"
                            onClick={onResetToTemplate}
                            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                          >
                            <RotateCcw size={16} />
                            Change Template
                          </button>
                        </div>
                      )}
                    </div>

                    {selectedTemplate && (
                      <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                        <p className="text-sm text-green-700">
                          ✅ Template applied! {selectedColleges.length} colleges have been copied to your new list.
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* Template Info for New Lists (after selection) */}
                {!editingList?.id && !showTemplateSelection && selectedTemplate && (
                  <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex justify-between items-center">
                      <p className="text-sm text-green-700">
                        📋 Using template: <strong>{availableTemplates.find(t => t.id === selectedTemplate)?.title}</strong>
                      </p>
                      <button
                        type="button"
                        onClick={onResetToTemplate}
                        className="text-xs text-blue-600 hover:text-blue-800 underline"
                      >
                        Change template
                      </button>
                    </div>
                  </div>
                )}

                {/* List Title */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    List Title *
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter list title..."
                    required
                  />
                </div>

                {/* Folder Selection */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Folder
                  </label>
                  <select
                    value={formData.folderId || ''}
                    onChange={(e) => setFormData({ ...formData, folderId: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">No Folder</option>
                    {folders?.filter(folder => !folder.archived).map(folder => (
                      <option key={folder.id} value={folder.id}>
                        {folder.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Category Selection */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Category *
                  </label>
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  >
                    {categories.map(category => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Show college search and management only if not in template selection mode */}
                {(!showTemplateSelection || editingList?.id) && (
                  <>
                    {/* Search and Filter Section */}
                    <div className="mb-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Search and Add Colleges</h3>
                      
                      {/* College Search */}
                      <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Search Colleges
                        </label>
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                          <input
                            type="text"
                            value={searchQuery}
                            onChange={handleSearchChange}
                            placeholder="Search by institute name or code..."
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                      </div>

                      {/* Filters */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        {/* City Filter */}
                        <div className="relative">
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Filter by City
                          </label>
                          <button
                            type="button"
                            onClick={() => setShowCityFilter(!showCityFilter)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-left flex justify-between items-center focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          >
                            <span>{selectedCity || 'All Cities'}</span>
                            <ChevronDown size={16} />
                          </button>
                          
                          {showCityFilter && (
                            <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                              <div className="p-2">
                                <input
                                  type="text"
                                  value={citySearchInput}
                                  onChange={(e) => setCitySearchInput(e.target.value)}
                                  placeholder="Search cities..."
                                  className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                                />
                              </div>
                              <div className="max-h-48 overflow-y-auto">
                                <button
                                  type="button"
                                  onClick={() => handleCitySelect('')}
                                  className="w-full px-3 py-2 text-left hover:bg-gray-100 text-sm"
                                >
                                  All Cities
                                </button>
                                {filteredCities.map(city => (
                                  <button
                                    key={city}
                                    type="button"
                                    onClick={() => handleCitySelect(city)}
                                    className="w-full px-3 py-2 text-left hover:bg-gray-100 text-sm"
                                  >
                                    {city}
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Branch Filter */}
                        <div className="relative">
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Filter by Branch
                          </label>
                          <button
                            type="button"
                            onClick={() => setShowBranchFilter(!showBranchFilter)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-left flex justify-between items-center focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          >
                            <span>{selectedBranch || 'All Branches'}</span>
                            <ChevronDown size={16} />
                          </button>
                          
                          {showBranchFilter && (
                            <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                              <div className="p-2">
                                <input
                                  type="text"
                                  value={branchSearchInput}
                                  onChange={(e) => setBranchSearchInput(e.target.value)}
                                  placeholder="Search branches..."
                                  className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                                />
                              </div>
                              <div className="max-h-48 overflow-y-auto">
                                <button
                                  type="button"
                                  onClick={() => handleBranchSelect('')}
                                  className="w-full px-3 py-2 text-left hover:bg-gray-100 text-sm"
                                >
                                  All Branches
                                </button>
                                {filteredBranches.map(branch => (
                                  <button
                                    key={branch}
                                    type="button"
                                    onClick={() => handleBranchSelect(branch)}
                                    className="w-full px-3 py-2 text-left hover:bg-gray-100 text-sm"
                                  >
                                    {branch}
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Search Results */}
                      {searchResults.length > 0 && (
                        <div className="mb-4">
                          <h4 className="text-sm font-medium text-gray-700 mb-2">
                            Search Results ({searchResults.length} colleges found)
                          </h4>
                          <div className="max-h-60 overflow-y-auto border border-gray-200 rounded-lg">
                            {searchResults.map(college => (
                              <div key={college.id} className="border-b border-gray-100 last:border-b-0">
                                <div className="p-3">
                                  <div className="flex justify-between items-start">
                                    <div className="flex-1">
                                      <h5 className="font-medium text-gray-900">{college.instituteName}</h5>
                                      <p className="text-sm text-gray-500">
                                        Code: {college.instituteCode} | City: {college.city}
                                      </p>
                                    </div>
                                    <button
                                      type="button"
                                      onClick={() => addCollegeToList(college)}
                                      className="ml-2 px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                                    >
                                      Add College
                                    </button>
                                  </div>
                                  
                                  {college.branches && college.branches.length > 0 && (
                                    <div className="mt-2">
                                      <button
                                        type="button"
                                        onClick={() => toggleCollegeBranches(college.id)}
                                        className="flex items-center text-sm text-blue-600 hover:text-blue-800"
                                      >
                                        {expandedColleges[college.id] ? (
                                          <>
                                            <ChevronUp size={16} className="mr-1" />
                                            Hide Branches ({college.branches.length})
                                          </>
                                        ) : (
                                          <>
                                            <ChevronDown size={16} className="mr-1" />
                                            Show Branches ({college.branches.length})
                                          </>
                                        )}
                                      </button>
                                      
                                      {expandedColleges[college.id] && (
                                        <div className="mt-2 space-y-1">
                                          {college.branches.map(branch => (
                                            <div key={branch.branchCode} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                                              <span className="text-sm text-gray-700">{branch.branchName}</span>
                                              <button
                                                type="button"
                                                onClick={() => addCollegeToList(college, branch)}
                                                className="px-2 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700"
                                              >
                                                Add Branch
                                              </button>
                                            </div>
                                          ))}
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {isSearching && (
                        <div className="text-center py-4">
                          <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
                          <p className="text-sm text-gray-500 mt-2">Searching colleges...</p>
                        </div>
                      )}
                    </div>

                    {/* Selected Colleges Section */}
                    <div className="mb-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">
                        Selected Colleges ({selectedColleges.length})
                      </h3>
                      
                      {selectedColleges.length === 0 ? (
                        <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                          <p>No colleges selected yet</p>
                          <p className="text-sm mt-1">Search and add colleges using the form above</p>
                        </div>
                      ) : (
                        <div className="space-y-2 max-h-60 overflow-y-auto border border-gray-200 rounded-lg p-4">
                          {selectedColleges.map((college, index) => (
                            <DraggableCollegeItem
                              key={college.uniqueId || college.id}
                              college={college}
                              index={index}
                              moveCollege={moveCollege}
                              onRemove={() => removeCollegeFromList(index)}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  </>
                )}

                {/* Form Actions */}
                <div className="flex justify-end gap-4 pt-4 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  
                  {/* Only show save button if not in template selection mode */}
                  {(
                    <button
                      type="submit"
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      disabled={!formData.title.trim()}
                    >
                      {editingList?.id ? 'Update List' : 'Create List'}
                    </button>
                  )}
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Exit Confirmation Modal */}
      {showExitConfirmation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-70">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="p-6">
              <div className="flex items-center mb-4">
                <div className="flex-shrink-0 w-10 h-10 mx-auto bg-yellow-100 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
              </div>
              <div className="text-center">
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Unsaved Changes
                </h3>
                <p className="text-sm text-gray-500 mb-6">
                  You have unsaved changes. Are you sure you want to leave without saving? Your changes will be lost.
                </p>
                <div className="flex gap-3 justify-center">
                  <button
                    onClick={handleCancelExit}
                    className="px-4 py-2 bg-gray-100 text-gray-800 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    Continue Editing
                  </button>
                  <button
                    onClick={handleConfirmExit}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                  >
                    Discard Changes
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ListFormModal;