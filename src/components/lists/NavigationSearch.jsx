import React, { useState, useEffect } from 'react';
import { Search, ArrowUp, ArrowDown } from 'lucide-react';

const NavigationSearch = ({ onSearch, totalMatches, currentMatch, onNext, onPrevious }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchType, setSearchType] = useState('instituteName');

  const handleSearch = (e) => {
    e.preventDefault();
    onSearch(searchTerm, searchType);
  };

  return (
    <div className="bg-white border-b border-gray-200 p-4">
      <form onSubmit={handleSearch} className="flex items-center gap-2">
        <div className="flex-1 flex items-center gap-2">
          <select
            value={searchType}
            onChange={(e) => setSearchType(e.target.value)}
            className="rounded-md border-gray-300 text-sm"
          >
            <option value="instituteName">Institute Name</option>
            <option value="instituteCode">Institute Code</option>
            <option value="branchCode">Branch Code</option>
          </select>
          <div className="flex-1 relative">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-md border-gray-300 pr-24 text-sm"
              placeholder="Search in selected colleges..."
            />
            {totalMatches > 0 && (
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-500">
                {currentMatch + 1} of {totalMatches}
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={onPrevious}
            disabled={totalMatches === 0}
            className="p-1.5 rounded hover:bg-gray-100 disabled:opacity-50"
          >
            <ArrowUp size={16} />
          </button>
          <button
            type="button"
            onClick={onNext}
            disabled={totalMatches === 0}
            className="p-1.5 rounded hover:bg-gray-100 disabled:opacity-50"
          >
            <ArrowDown size={16} />
          </button>
          <button
            type="submit"
            className="bg-blue-600 text-white px-3 py-1.5 rounded-md hover:bg-blue-700 text-sm"
          >
            Find
          </button>
        </div>
      </form>
    </div>
  );
};

export default NavigationSearch;
