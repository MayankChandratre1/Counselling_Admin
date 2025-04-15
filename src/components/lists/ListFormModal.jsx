import React, { useState } from 'react';
import { X, Plus, Search, Trash2, GraduationCap, List, Filter, ArrowBigLeft, ArrowLeft, ChevronLeft, ChevronRight } from 'lucide-react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import CollegeSearchForm from './CollegeSearchForm';
import CollegeSearchResults from './CollegeSearchResults';
import SelectedColleges from './SelectedColleges';

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
  removeCollegeFromList
}) => {
  const [activeTab, setActiveTab] = useState('search');
  const [selectedForDrag, setSelectedForDrag] = useState([]);
  const [isSearchPanelCollapsed, setIsSearchPanelCollapsed] = useState(false);

  const clearColleges = () => {
    if (window.confirm('Are you sure you want to clear all selected colleges?')) {
      setSelectedColleges([]);
    }
  };

  const handleSelectForDrag = (collegeId) => {
    setSelectedForDrag(prev => 
      prev.includes(collegeId) 
        ? prev.filter(id => id !== collegeId)
        : [...prev, collegeId]
    );
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

  const toggleSearchPanel = () => {
    setIsSearchPanelCollapsed(!isSearchPanelCollapsed);
  };

  return (
    <div className="fixed inset-0 bg-white z-50 flex flex-col min-h-screen w-screen">
      {/* Header with title input */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 px-6 py-3 flex items-center gap-3">
        <button
          onClick={closeModal}
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
          <select
            id="category"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-2 text-sm bg-white/10 text-white border border-white/20 rounded-lg focus:ring-2 focus:ring-white/50 focus:border-transparent appearance-none cursor-pointer w-32"
          >
            {categories.map((category) => (
              <option key={category} value={category} className="text-gray-900">
                {category}
              </option>
            ))}
          </select>
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

            {/* Selected Colleges Panel - Dynamic Width */}
            <div className={`
              transition-all duration-300 ease-in-out
              ${isSearchPanelCollapsed ? 'w-full' : 'w-1/2'}
              p-4 flex flex-col h-full
            `}>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-medium text-gray-800 flex items-center">
                  <GraduationCap size={20} className="text-blue-600 mr-2" />
                  Selected Colleges ({selectedColleges.length})
                </h3>
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
                  moveCollege={moveCollege}
                  removeCollegeFromList={removeCollegeFromList}
                  isSearchPanelCollapsed={isSearchPanelCollapsed}
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
    </div>
  );
};

export default ListFormModal;