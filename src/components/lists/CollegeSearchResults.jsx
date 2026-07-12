import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Plus, MapPin } from 'lucide-react';

const CollegeSearchResults = ({ searchResults, selectedColleges, addCollegeToList, searchQuery, selectedCity, selectedBranch, selectedCategory }) => {
  const [expandedColleges, setExpandedColleges] = useState({});
  const [showIndexModal, setShowIndexModal] = useState(false);
  const [indexInput, setIndexInput] = useState('');
  const [pendingAddition, setPendingAddition] = useState(null);

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

  // Handle showing index modal for individual branch addition
  const handleAddBranchWithIndex = (college, branch) => {
    setPendingAddition({
      type: 'single',
      college,
      branch
    });
    setIndexInput('');
    setShowIndexModal(true);
  };

  // Handle showing index modal for batch addition
  const handleAddAllBranchesWithIndex = (college) => {
    const notSelectedBranches = college.branches?.filter(branch => 
      !selectedColleges.some(c => 
        c.id === college.id && c.selectedBranchCode === branch.branchCode
      )
    ) || [];

    if (notSelectedBranches.length === 0) {
      return;
    }

    setPendingAddition({
      type: 'batch',
      college,
      branches: notSelectedBranches
    });
    setIndexInput('');
    setShowIndexModal(true);
  };

  // Handle regular addition without index
  const handleAddAllBranches = (college) => {
    const notSelectedBranches = college.branches?.filter(branch => 
      !selectedColleges.some(c => 
        c.id === college.id && c.selectedBranchCode === branch.branchCode
      )
    ) || [];

    if (notSelectedBranches.length > 0) {
      const addAllColleges = notSelectedBranches.map(branch => ({
        ...college,
        uniqueId: `${college.id}_${branch.branchCode}`,
        selectedBranch: branch.branchName,
        selectedBranchCode: branch.branchCode
      }));
      
      addCollegeToList(college, null, addAllColleges);
    }
  };

  // Handle confirming the index and adding the college(s)
  const handleConfirmIndex = () => {
    if (!pendingAddition) return;

    const index = indexInput === '' ? null : parseInt(indexInput, 10);
    
    // Validate index
    if (indexInput !== '' && (isNaN(index) || index < 0 || index > selectedColleges.length)) {
      alert(`Please enter a valid index between 0 and ${selectedColleges.length}`);
      return;
    }

    if (pendingAddition.type === 'single') {
      // Add single branch at index
      addCollegeToList(pendingAddition.college, pendingAddition.branch, null, index);
    } else if (pendingAddition.type === 'batch') {
      // Add all branches at index
      const addAllColleges = pendingAddition.branches.map(branch => ({
        ...pendingAddition.college,
        uniqueId: `${pendingAddition.college.id}_${branch.branchCode}`,
        selectedBranch: branch.branchName,
        selectedBranchCode: branch.branchCode
      }));
      
      addCollegeToList(pendingAddition.college, null, addAllColleges, index);
    }

    // Reset modal state
    setShowIndexModal(false);
    setPendingAddition(null);
    setIndexInput('');
  };

  const handleCancelIndex = () => {
    setShowIndexModal(false);
    setPendingAddition(null);
    setIndexInput('');
  };

  return (
    <>
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
                          <>
                            {/* Regular Add All Button */}
                            <button
                              onClick={() => handleAddAllBranches(college)}
                              className="px-3 py-1 text-sm font-medium text-green-600 bg-green-50 hover:bg-green-100 rounded-md flex items-center"
                            >
                              <Plus size={16} className="mr-1" />
                              Add all
                            </button>
                            
                            {/* Add All at Index Button */}
                            <button
                              onClick={() => handleAddAllBranchesWithIndex(college)}
                              className="px-3 py-1 text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-md flex items-center"
                              title="Add all at specific position"
                            >
                              <MapPin size={16} className="mr-1" />
                              Add After
                            </button>
                          </>
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
                                      {cutoff && cutoff.year == 2025 && cutoff.category === selectedCategory && (
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
                              
                              {/* Individual Branch Add Buttons */}
                              <div className="flex gap-2">
                                {/* Regular Add Button */}
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
                                
                                {/* Add at Index Button */}
                                {!isSelected && (
                                  <button
                                    type="button"
                                    onClick={() => handleAddBranchWithIndex(college, branch)}
                                    className="px-2 py-1 rounded-md text-sm font-medium bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors"
                                    title="Add at specific position"
                                  >
                                    <MapPin size={14} />
                                  </button>
                                )}
                              </div>
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

      {/* Index Input Modal */}
      {showIndexModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Add {pendingAddition?.type === 'batch' ? 'All Branches' : 'Branch'} at Position
              </h3>
              
              <div className="mb-4">
                <p className="text-sm text-gray-600 mb-2">
                  {pendingAddition?.type === 'batch' 
                    ? `Adding ${pendingAddition?.branches?.length || 0} branches from "${pendingAddition?.college?.instituteName}"`
                    : `Adding "${pendingAddition?.branch?.branchName}" from "${pendingAddition?.college?.instituteName}"`
                  }
                </p>
                <p className="text-xs text-gray-500 mb-3">
                  Current list has {selectedColleges.length} colleges. Leave empty to add at the end.
                </p>
                
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Position (0 to {selectedColleges.length}):
                </label>
                <input
                  type="number"
                  min="0"
                  max={selectedColleges.length}
                  value={indexInput}
                  onChange={(e) => setIndexInput(e.target.value)}
                  placeholder={`Enter position (0-${selectedColleges.length})`}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  autoFocus
                />
                <p className="text-xs text-gray-500 mt-1">
                  0 = beginning, {selectedColleges.length} = end
                </p>
              </div>

              <div className="flex gap-3 justify-end">
                <button
                  onClick={handleCancelIndex}
                  className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmIndex}
                  className="px-4 py-2 text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
                >
                  Add {pendingAddition?.type === 'batch' ? 'All' : 'Branch'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default CollegeSearchResults;
