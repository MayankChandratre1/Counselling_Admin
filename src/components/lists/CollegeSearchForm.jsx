import React from 'react';
import { Search } from 'lucide-react';
import FilterDropdown from './FilterDropdown';

const CollegeSearchForm = ({
  searchQuery,
  handleSearchChange,
  searchColleges,
  isSearching,
  selectedCity,
  citySearchInput,
  setCitySearchInput,
  showCityFilter,
  setShowCityFilter,
  handleCitySelect,
  filteredCities,
  selectedBranch,
  branchSearchInput,
  setBranchSearchInput,
  showBranchFilter,
  setShowBranchFilter,
  handleBranchSelect,
  filteredBranches,
  compact = false
}) => {
 

  return (
    <div className={`${compact ? 'flex items-center gap-4' : 'space-y-3'}`}>
      <div className={`${compact ? 'flex-1 ' : ''}`}>
        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={handleSearchChange}
            placeholder="Search by name or code..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search size={16} className="text-gray-400" />
          </div>
          {isSearching && (
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
            </div>
          )}
        </div>
      </div>

      <div className={`flex gap-2 ${compact ? 'flex-none' : ''}`}>
        <FilterDropdown 
          label="City"
          compact={compact}
          searchValue={citySearchInput}
          onSearchChange={(e) => setCitySearchInput(e.target.value)}
          placeholder="Search cities..."
          showFilter={showCityFilter}
          toggleFilter={() => {
            if (selectedCity) {
              handleCitySelect('');
            } else {
              setShowCityFilter(!showCityFilter);
            }
          }}
          selectedValue={selectedCity}
          onValueSelect={handleCitySelect}
          filteredOptions={filteredCities}
          bgColor="blue"
        />
        
        <FilterDropdown 
          label="Branch"
          compact={compact}
          searchValue={branchSearchInput}
          onSearchChange={(e) => setBranchSearchInput(e.target.value)}
          placeholder="Search branches..."
          showFilter={showBranchFilter}
          toggleFilter={() => {
            if (selectedBranch) {
              handleBranchSelect('');
            } else {
              setShowBranchFilter(!showBranchFilter);
            }
          }}
          selectedValue={selectedBranch}
          onValueSelect={handleBranchSelect}
          filteredOptions={filteredBranches}
          bgColor="green"
        />
        <button
          type="button"
          onClick={() => searchColleges(searchQuery, selectedCity, selectedBranch)}
          className="inline-flex items-center px-3 py-2 border border-blue-300 text-sm font-medium rounded-lg text-blue-700 bg-blue-50 hover:bg-blue-100"
        >
          <Search size={16} className="mr-1.5" />
          Search
        </button>
      </div>
    </div>
  );
};

export default CollegeSearchForm;
