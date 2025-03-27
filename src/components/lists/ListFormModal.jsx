import React, { useState } from 'react';
import { X, Plus, Search, Trash2, GraduationCap, List, Filter, ArrowBigLeft, ArrowLeft } from 'lucide-react';
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
  moveCollege,
  removeCollegeFromList
}) => {
  const [activeTab, setActiveTab] = useState('search');

  const clearColleges = () => {
    if (window.confirm('Are you sure you want to clear all selected colleges?')) {
      setSelectedColleges([]);
    }
  };


  return (
    <div className="fixed inset-0 bg-white z-50 flex flex-col h-screen w-screen">
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
      </div>

      {/* Search Bar and Filters - Horizontal */}
      <div className="bg-white border-b border-gray-200 px-6 py-3">
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
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-hidden bg-gray-50">
        <DndProvider backend={HTML5Backend}>
          <div className="h-full flex">
            {/* Search Results Panel - 50% width */}
            <div className="w-1/2 p-4 flex flex-col h-full border-r border-gray-200">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-medium text-gray-800 flex items-center">
                  <Search size={20} className="text-blue-600 mr-2" />
                  Search Results
                </h3>
                {searchResults.length > 0 && (
                  <span className="bg-blue-100 text-blue-800 text-sm px-2 py-1 rounded-full">
                    {searchResults.length} colleges
                  </span>
                )}
              </div>
              <div className="flex-1 overflow-y-auto bg-white rounded-lg border border-gray-200">
                <CollegeSearchResults
                  searchResults={searchResults}
                  selectedColleges={selectedColleges}
                  addCollegeToList={addCollegeToList}
                  searchQuery={searchQuery}
                  selectedCity={selectedCity}
                  selectedBranch={selectedBranch}
                />
              </div>
            </div>

            {/* Selected Colleges Panel - 50% width */}
            <div className="w-1/2 p-4 flex flex-col h-full">
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
                  selectedColleges={selectedColleges}
                  moveCollege={moveCollege}
                  removeCollegeFromList={removeCollegeFromList}
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