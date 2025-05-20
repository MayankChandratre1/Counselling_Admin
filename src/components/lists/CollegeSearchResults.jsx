import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Plus } from 'lucide-react';

const CollegeSearchResults = ({ searchResults, selectedColleges, addCollegeToList, searchQuery, selectedCity, selectedBranch, selectedCategory }) => {
  const [expandedColleges, setExpandedColleges] = useState({});
  

  const branchNameFormatter = (branchName) => {
    const commonWords = ['and', 'of', 'the', 'in', 'for', 'with', 'on', 'at', 'by', 'from'];
    return branchName
      .split(' ')
      .filter(word => !commonWords.includes(word.toLowerCase()))
      .map(word => word.charAt(0).toUpperCase())
      .join('');
  }

  const toggleCollege = (collegeId) => {
    setExpandedColleges(prev => ({
      ...prev,
      [collegeId]: !prev[collegeId]
    }));
  };

  const handleAddAllBranches = (college) => {
    // Check if any branches are already selected
    const notSelectedBranches = college.branches?.filter(branch => 
      !selectedColleges.some(c => 
        c.id === college.id && c.selectedBranchCode === branch.branchCode
      )
    ) || [];

    // If there are branches to add, add them all at once
    if (notSelectedBranches.length > 0) {
      const addAllColleges = notSelectedBranches.map(branch => ({
        ...college,
        uniqueId: `${college.id}_${branch.branchCode}`,
        selectedBranch: branch.branchName,
        selectedBranchCode: branch.branchCode
      }));
      
      // Call the parent's addCollegeToList with all colleges at once
      addCollegeToList(college, null, addAllColleges);
    }
  };

  return (
    <div className="flex-1 overflow-hidden border border-gray-200 rounded-md bg-white shadow-sm">
      <div className="bg-gray-50 px-4 py-2 border-b border-gray-200 flex justify-between items-center">
        <h4 className="text-sm font-medium text-gray-700">Search Results</h4>
        <div className="text-xs text-gray-500">
          {searchResults.length} Colleges found
        </div>
      </div>
      <div className="h-full overflow-y-auto">
        {searchResults.length > 0 ? (
          <div className="divide-y divide-gray-200">
            {searchResults.map(college => (
              <div key={college.id} className="border-b border-gray-200">
                <div className="p-3">
                  <div className="flex justify-between items-center bg-gray-50 p-3 rounded-md">
                    <div className="flex-1">
                      <div className="font-medium text-gray-800">{college.instituteName}</div>
                      <div className="text-sm text-gray-500 flex items-center mt-1">
                        <span className="bg-gray-100 px-2 py-0.5 rounded text-xs mr-2 font-semibold">
                          Code: {college.instituteCode}
                        </span>
                        {college.city && (
                          <span className="text-xs text-gray-500">
                            {college.city.toUpperCase()}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {college.branches?.length > 0 && (
                        <button
                          onClick={() => handleAddAllBranches(college)}
                          className="px-3 py-1 text-sm font-medium text-green-600 bg-green-50 hover:bg-green-100 rounded-md flex items-center"
                        >
                          <Plus size={16} className="mr-1" />
                          Add All
                        </button>
                      )}
                      <button
                        onClick={() => toggleCollege(college.id)}
                        className="p-1 hover:bg-gray-100 rounded"
                      >
                        {expandedColleges[college.id] ? (
                          <ChevronUp size={20} />
                        ) : (
                          <ChevronDown size={20} />
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Branches List */}
                {expandedColleges[college.id] && college.branches && (
                  <div className="pl-6 pb-2">
                    {college.branches
                      .filter(branch => !selectedBranch || 
                        branch.branchName.toLowerCase().includes(selectedBranch.toLowerCase())
                      )
                      .map(branch => {
                        const isSelected = selectedColleges.some(
                          c => c.id === college.id && c.selectedBranchCode === branch.branchCode
                        );
                        
                        return (
                          <div key={`${college.id}_${branch.branchCode}`} 
                               className="flex justify-between items-center py-2 px-3 hover:bg-gray-50 rounded-md">
                            <div className="flex-1">
                              <div className="text-sm font-medium text-gray-700 flex items-center">
                                <div className="w-2 h-2 rounded-full bg-indigo-400 mr-2"></div>
                                <span className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded-full text-xs">
                                  {branch.branchCode}
                                </span>
                                <div className="text-sm text-gray-600 ml-4">
                                {branch.branchName} 
                              </div>
                              </div>
                              
                              <div className='grid grid-cols-3 gap-2 mt-2 ml-4'>
                                {branch.cutoffs && branch.cutoffs.map((cutoff, index) => (
                                  <>
                                    {cutoff && cutoff.year == 2024 && cutoff.category === selectedCategory && (
                                      <div 
                                        key={index} 
                                        className='bg-blue-50 border border-blue-100 rounded-lg p-2 flex w-fit items-center gap-1'
                                      >
                                        <div className="text-xs font-semibold text-blue-700 mb-1">
                                          {cutoff.capRound?.toUpperCase().charAt(4-1)}
                                        </div>
                                        <div className="flex flex-col ">
                                          <span className="text-sm font-medium text-gray-700">
                                            {cutoff.percentile.toFixed(2) || '-'}%
                                          </span>
                                          <span className="text-xs text-gray-500">
                                            {cutoff.rank || '-'}
                                          </span>
                                        </div>
                                      </div>
                                    )}
                                  </>
                                ))}
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => addCollegeToList(college, branch)}
                              disabled={isSelected}
                              className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                                isSelected
                                  ? 'bg-gray-100 text-gray-500 cursor-not-allowed'
                                  : 'bg-green-50 text-green-600 hover:bg-green-100'
                              }`}
                            >
                              {isSelected ? 'Added' : 'Add'}
                            </button>
                          </div>
                        );
                      })}
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="p-4 text-center text-gray-500">
            {searchQuery || selectedCity || selectedBranch 
              ? 'No colleges found. Try different search terms.' 
              : 'Search for colleges to add them to your list.'}
          </div>
        )}
      </div>
    </div>
  );
};

export default CollegeSearchResults;
