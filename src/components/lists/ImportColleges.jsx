import React, { useState, useEffect } from 'react';
import { X, Search, Check, ChevronDown, ChevronUp } from 'lucide-react';
import axiosInstance from '../../utils/axios';

const ImportColleges = ({ 
  isOpen, 
  onClose, 
  onImport, 
  availableLists, 
  currentListId,
  currentCollegesCount
}) => {
  const [selectedListId, setSelectedListId] = useState('');
  const [selectedList, setSelectedList] = useState(null);
  const [selectedColleges, setSelectedColleges] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredColleges, setFilteredColleges] = useState([]);
  const [showInsertModal, setShowInsertModal] = useState(false);
  const [insertPosition, setInsertPosition] = useState('end');
  const [insertIndex, setInsertIndex] = useState(0);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [expandedColleges, setExpandedColleges] = useState({});

  // Reset state when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setSelectedListId('');
      setSelectedList(null);
      setSelectedColleges([]);
      setSearchQuery('');
      setFilteredColleges([]);
      setShowInsertModal(false);
      setInsertPosition('end');
      setInsertIndex(0);
      setShowConfirmation(false);
    }
  }, [isOpen]);

  // Filter colleges based on search
  useEffect(() => {
    if (!selectedList) return;
    
    if (!searchQuery) {
      // When no search query, preserve the original indices
      const collegesWithIndices = (selectedList.colleges || []).map((college, index) => ({
        ...college,
        originalIndex: index // Store the original index
      }));
      setFilteredColleges(collegesWithIndices);
      return;
    }
    
    const lowerQuery = searchQuery.toLowerCase();
    // Filter but preserve original indices
    const filtered = (selectedList.colleges || [])
      .map((college, index) => ({ ...college, originalIndex: index }))
      .filter(college => 
        college.instituteName?.toLowerCase().includes(lowerQuery) || 
        college.selectedBranchCode?.toString().includes(lowerQuery) ||
        college.selectedBranch?.toLowerCase().includes(lowerQuery) ||
        college.city?.toLowerCase().includes(lowerQuery)
      );
    
    setFilteredColleges(filtered);
  }, [searchQuery, selectedList]);

  // Fetch list details when list is selected
  const handleListSelect = async (listId) => {
    if (!listId) {
      setSelectedList(null);
      setSelectedColleges([]);
      setFilteredColleges([]);
      return;
    }

    setLoading(true);
    try {
      const response = await axiosInstance.get(`/api/admin/list/${listId}`);
      setSelectedList(response.data);
      setFilteredColleges(response.data.colleges || []);
    } catch (error) {
      console.error('Error fetching list details:', error);
    } finally {
      setLoading(false);
    }
  };

  // Toggle college selection
  const toggleCollegeSelection = (collegeId) => {
    setSelectedColleges(prev => {
      if (prev.includes(collegeId)) {
        return prev.filter(id => id !== collegeId);
      } else {
        return [...prev, collegeId];
      }
    });
  };

  // Select all visible colleges
  const selectAllColleges = () => {
    const allCollegeIds = filteredColleges.map(college => college.uniqueId || college.id);
    setSelectedColleges(allCollegeIds);
  };

  // Clear all selections
  const clearSelection = () => {
    setSelectedColleges([]);
  };

  // Handle import button click
  const handleImportClick = () => {
    if (selectedColleges.length === 0) return;
    setShowInsertModal(true);
  };

  // Handle confirmation of import position
  const handlePositionConfirm = () => {
    setShowInsertModal(false);
    setShowConfirmation(true);
  };

  // Handle final import
  const handleConfirmImport = () => {
    const collegesForImport = filteredColleges.filter(college => 
      selectedColleges.includes(college.uniqueId || college.id)
    );
    
    const position = insertPosition === 'end' ? -1 : parseInt(insertIndex, 10);
    
    onImport(collegesForImport, position);
    onClose();
  };

  // Toggle college details expansion
  const toggleCollegeExpansion = (collegeId) => {
    setExpandedColleges(prev => ({
      ...prev,
      [collegeId]: !prev[collegeId]
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 flex justify-between items-center">
          <h3 className="text-xl font-semibold text-gray-900">Import Colleges</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-500">
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden flex flex-col">
          {/* List Selection */}
          {!showConfirmation && (
            <div className="p-4 border-b border-gray-200">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select a list to import colleges from:
              </label>
              <select
                value={selectedListId}
                onChange={(e) => {
                  setSelectedListId(e.target.value);
                  handleListSelect(e.target.value);
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Select a list...</option>
                {availableLists
                  .filter(list => list.id !== currentListId)
                  .map(list => (
                    <option key={list.id} value={list.id}>
                      {list.title} ({list.colleges?.length || 0} colleges)
                    </option>
                  ))}
              </select>
            </div>
          )}

          {/* Loading State */}
          {loading && (
            <div className="flex-1 flex items-center justify-center">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          )}

          {/* No List Selected */}
          {!loading && !selectedList && !showConfirmation && (
            <div className="flex-1 flex items-center justify-center p-6 text-center">
              <div>
                <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                  <Search size={24} className="text-gray-400" />
                </div>
                <p className="text-gray-500">Select a list to view available colleges</p>
              </div>
            </div>
          )}

          {/* Selected List Content */}
          {!loading && selectedList && !showConfirmation && (
            <>
              {/* Search and Controls */}
              <div className="p-4 bg-gray-50 border-b border-gray-200">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  {/* Search */}
                  <div className="relative w-full sm:max-w-xs">
                    <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search colleges..."
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg"
                    />
                  </div>
                  
                  {/* Selection Controls */}
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-gray-500">
                      {selectedColleges.length} of {filteredColleges.length} selected
                    </span>
                    <button
                      onClick={selectAllColleges}
                      className="px-3 py-1.5 text-sm bg-blue-50 text-blue-600 rounded hover:bg-blue-100"
                      disabled={filteredColleges.length === 0}
                    >
                      Select All
                    </button>
                    {selectedColleges.length > 0 && (
                      <button
                        onClick={clearSelection}
                        className="px-3 py-1.5 text-sm bg-gray-100 text-gray-600 rounded hover:bg-gray-200"
                      >
                        Clear
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Colleges List */}
              <div className="flex-1 overflow-y-auto p-4">
                {filteredColleges.length === 0 ? (
                  <div className="text-center py-10">
                    <p className="text-gray-500">No colleges found</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {filteredColleges.map((college) => (
                      <div 
                        key={college.uniqueId || college.id} 
                        className={`border rounded-lg ${
                          selectedColleges.includes(college.uniqueId || college.id) 
                            ? 'border-blue-300 bg-blue-50' 
                            : 'border-gray-200'
                        } transition-colors duration-150 overflow-hidden`}
                      >
                        {/* College Header */}
                        <div className="flex items-center p-3">
                          <div className="flex-shrink-0">
                            <input
                              type="checkbox"
                              checked={selectedColleges.includes(college.uniqueId || college.id)}
                              onChange={() => toggleCollegeSelection(college.uniqueId || college.id)}
                              className="h-5 w-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                            />
                          </div>
                          <div className="ml-3 flex-1 min-w-0" onClick={() => toggleCollegeSelection(college.uniqueId || college.id)}>
                            <div className="flex justify-between items-start">
                              <div>
                                <h4 className="text-sm font-medium text-gray-900 truncate flex items-center">
                                  <span className="inline-flex items-center justify-center px-2 py-1 mr-2 text-xs font-bold leading-none text-gray-600 bg-gray-200 rounded-full">
                                    #{college.originalIndex + 1}
                                  </span>
                                  {college.instituteName}
                                </h4>
                                <div className="mt-1 flex flex-wrap gap-2">
                                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                                    Code: {college.selectedBranchCode || college.instituteCode}
                                  </span>
                                  {college.city && (
                                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                                      {college.city}
                                    </span>
                                  )}
                                  {college.selectedBranch && (
                                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                                      {college.selectedBranch}
                                    </span>
                                  )}
                                </div>
                              </div>
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleCollegeExpansion(college.uniqueId || college.id);
                                }}
                                className="ml-2 text-gray-400 hover:text-gray-500"
                              >
                                {expandedColleges[college.uniqueId || college.id] ? (
                                  <ChevronUp size={18} />
                                ) : (
                                  <ChevronDown size={18} />
                                )}
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* Expanded College Details */}
                        {expandedColleges[college.uniqueId || college.id] && (
                          <div className="px-3 pb-3 pt-1 bg-gray-50 border-t border-gray-200">
                            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2 text-sm">
                              {college.selectedBranchCode && (
                                <>
                                  <dt className="text-gray-500">Branch Code:</dt>
                                  <dd className="text-gray-900">{college.selectedBranchCode}</dd>
                                </>
                              )}
                              {college.university && (
                                <>
                                  <dt className="text-gray-500">University:</dt>
                                  <dd className="text-gray-900">{college.university}</dd>
                                </>
                              )}
                              {college.address && (
                                <>
                                  <dt className="text-gray-500">Address:</dt>
                                  <dd className="text-gray-900">{college.address}</dd>
                                </>
                              )}
                            </dl>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}

          {/* Insert Position Modal */}
          {showInsertModal && (
            <div className="flex-1 flex items-center justify-center p-6">
              <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
                <h4 className="text-lg font-medium text-gray-900 mb-4">Where would you like to insert these colleges?</h4>
                
                <div className="space-y-4">
                  <label className="flex items-center space-x-3">
                    <input
                      type="radio"
                      checked={insertPosition === 'end'}
                      onChange={() => setInsertPosition('end')}
                      className="h-4 w-4 text-blue-600"
                    />
                    <span className="text-gray-700">Append at the end</span>
                  </label>
                  
                  <label className="flex items-center space-x-3">
                    <input
                      type="radio"
                      checked={insertPosition === 'index'}
                      onChange={() => setInsertPosition('index')}
                      className="h-4 w-4 text-blue-600"
                    />
                    <span className="text-gray-700">After a specific position:</span>
                  </label>
                  
                  {insertPosition === 'index' && (
                    <div className="ml-7">
                      <input
                        type="number"
                        min="0"
                        max={currentCollegesCount}
                        value={insertIndex}
                        onChange={(e) => setInsertIndex(e.target.value)}
                        className="w-24 px-3 py-2 border border-gray-300 rounded-lg"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Enter a number between 0 and {currentCollegesCount} (0 = at beginning)
                      </p>
                    </div>
                  )}
                </div>

                <div className="mt-6 flex justify-end gap-3">
                  <button
                    onClick={() => setShowInsertModal(false)}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                  >
                    Back
                  </button>
                  <button
                    onClick={handlePositionConfirm}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Continue
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Confirmation Modal */}
          {showConfirmation && (
            <div className="flex-1 flex items-center justify-center p-6">
              <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
                <div className="flex items-center justify-center w-12 h-12 mx-auto bg-blue-100 rounded-full mb-4">
                  <Check size={24} className="text-blue-600" />
                </div>
                
                <h4 className="text-lg font-medium text-center text-gray-900 mb-2">Confirm Import</h4>
                
                <p className="text-center text-gray-600 mb-4">
                  You are about to import {selectedColleges.length} colleges to your list.
                </p>
                
                <div className="bg-blue-50 border border-blue-200 rounded-md p-3 mb-6">
                  <p className="text-sm text-blue-800">
                    <span className="font-semibold">Import location:</span>{' '}
                    {insertPosition === 'end' 
                      ? 'At the end of the list' 
                      : `After position ${insertIndex}`}
                  </p>
                </div>

                <div className="flex justify-center gap-3">
                  <button
                    onClick={() => setShowConfirmation(false)}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                  >
                    Back
                  </button>
                  <button
                    onClick={handleConfirmImport}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Confirm Import
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        {!showInsertModal && !showConfirmation && selectedList && (
          <div className="p-4 border-t border-gray-200 bg-gray-50">
            <div className="flex justify-end">
              <button
                onClick={handleImportClick}
                disabled={selectedColleges.length === 0}
                className={`px-4 py-2 rounded-lg text-white ${
                  selectedColleges.length === 0 
                    ? 'bg-gray-400 cursor-not-allowed' 
                    : 'bg-blue-600 hover:bg-blue-700'
                }`}
              >
                Import Selected ({selectedColleges.length})
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ImportColleges;