import React from 'react';
import { Search, X, CheckCircle } from 'lucide-react';

const FilterDropdown = ({ 
  label, 
  searchValue, 
  onSearchChange, 
  placeholder, 
  showFilter, 
  toggleFilter, 
  selectedValue, 
  onValueSelect, 
  filteredOptions, 
  bgColor = 'blue' 
}) => {
  // Function to get the proper color classes based on bgColor prop
  const getColorClasses = () => {
    const colorMap = {
      blue: {
        bg: 'bg-blue-100',
        text: 'text-blue-800',
        hover: 'text-blue-800',
        icon: 'text-blue-600'
      },
      green: {
        bg: 'bg-green-100',
        text: 'text-green-800',
        hover: 'text-green-800',
        icon: 'text-green-600'
      },
      red: {
        bg: 'bg-red-100',
        text: 'text-red-800',
        hover: 'text-red-800',
        icon: 'text-red-600'
      },
      indigo: {
        bg: 'bg-indigo-100',
        text: 'text-indigo-800',
        hover: 'text-indigo-800',
        icon: 'text-indigo-600'
      }
    };
    
    return colorMap[bgColor] || colorMap.blue;
  };

  const colorClasses = getColorClasses();
  
  return (
    <div className="relative bg-white">
      {/* <label className="block text-sm font-medium text-gray-700 mb-2">{label}</label> */}
      <div className="flex items-center space-x-2 mb-2">
        <div className="relative flex-grow">
          <input
            type="text"
            value={searchValue}
            onChange={onSearchChange}
            placeholder={placeholder}
            className="w-full pl-8 pr-3 py-1.5 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
          />
          <div className="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none">
            <Search size={14} className="text-gray-400" />
          </div>
        </div>
        <button
          type="button"
          onClick={toggleFilter}
          className="inline-flex items-center px-2 py-1.5 border border-gray-300 text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-1 focus:ring-blue-500"
        >
          {selectedValue ? <X size={14} /> : 'Browse'}
        </button>
      </div>
      
      {selectedValue && (
        <div className="mt-1 flex items-center">
          <span className={`${colorClasses.bg} ${colorClasses.text} text-xs px-2 py-1 rounded-full flex items-center`}>
            {selectedValue}
            <button 
              className={`ml-1 ${colorClasses.icon} hover:${colorClasses.hover}`}
              onClick={() => onValueSelect('')}
            >
              <X size={12} />
            </button>
          </span>
        </div>
      )}
      
      {showFilter && (
        <div className="absolute z-10 mt-1 w-full bg-white shadow-lg max-h-60 rounded-md py-1 text-base ring-1 ring-black ring-opacity-5 overflow-auto focus:outline-none sm:text-sm">
          <div 
            className="cursor-pointer select-none relative py-2 pl-3 pr-9 hover:bg-gray-100"
            onClick={() => onValueSelect('')}
          >
            All {label.replace('Filter by ', '')}
          </div>
          {filteredOptions.map((option) => (
            <div
              key={option}
              className={`cursor-pointer select-none relative py-2 pl-3 pr-9 hover:bg-gray-100 ${
                option === selectedValue ? `${colorClasses.bg.replace('100', '50')} ${colorClasses.text}` : ''
              }`}
              onClick={() => onValueSelect(option)}
            >
              {option}
              {option === selectedValue && (
                <span className="absolute inset-y-0 right-0 flex items-center pr-4">
                  <CheckCircle size={16} className={colorClasses.icon} />
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default FilterDropdown;
