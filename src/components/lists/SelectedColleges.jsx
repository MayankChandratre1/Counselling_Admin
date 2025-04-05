import React, { useState } from 'react';
import { Plus, Trash2, MoveVertical } from 'lucide-react';
import DraggableCollegeItem from './DraggableCollegeItem';
import NavigationSearch from './NavigationSearch';

const SelectedColleges = ({ selectedColleges, clearColleges, moveCollege, removeCollegeFromList, isSearchPanelCollapsed }) => {
  const [selectedItems, setSelectedItems] = useState([]);
  const [lastSelectedIndex, setLastSelectedIndex] = useState(null);
  const [showMoveBox, setShowMoveBox] = useState(false);
  const [moveToIndex, setMoveToIndex] = useState('');
  const [searchMatches, setSearchMatches] = useState([]);
  const [currentMatchIndex, setCurrentMatchIndex] = useState(0);
  const [highlightedIndices, setHighlightedIndices] = useState(new Set());

  const handleSelectCollege = (index, checked, event) => {
    if (!event) return; // Guard against undefined event
    
    const shiftKey = event.nativeEvent.shiftKey;
    const ctrlKey = event.nativeEvent.ctrlKey || event.nativeEvent.metaKey;

    
    
    
    if (shiftKey && lastSelectedIndex !== null) {
      const start = Math.min(lastSelectedIndex, index);
      const end = Math.max(lastSelectedIndex, index);
      const range = Array.from(
        { length: end - start + 1 },
        (_, i) => start + i
      );

      setSelectedItems(prev => {
        const newSelection = new Set(prev);
        if (checked) {
          range.forEach(i => newSelection.add(i));
        } else {
          range.forEach(i => newSelection.delete(i));
        }
        return Array.from(newSelection).sort((a, b) => a - b);
      });
    } else if (ctrlKey) {
      setSelectedItems(prev => {
        const newSelection = new Set(prev);
        if (checked) {
          newSelection.add(index);
        } else {
          newSelection.delete(index);
        }
        return Array.from(newSelection).sort((a, b) => a - b);
      });
    } else {
      setSelectedItems(checked ? [index] : []);
    }
    
    setLastSelectedIndex(index);
  };

  const updateHighlightedIndices = (oldIndices, newOrder) => {
    const newIndices = new Set();
    oldIndices.forEach(oldIndex => {
      // Find the new position of the item that was at oldIndex
      const item = selectedColleges[oldIndex];
      const newIndex = newOrder.findIndex(c => 
        c.uniqueId === item.uniqueId || 
        (c.id === item.id && c.selectedBranchCode === item.selectedBranchCode)
      );
      if (newIndex !== -1) {
        newIndices.add(newIndex);
      }
    });
    return newIndices;
  };

  const moveSelectedColleges = (dragIndex, hoverIndex) => {
    const newColleges = [...selectedColleges];
    
    if (selectedItems.includes(dragIndex)) {
      // Get selected items in order
      const itemsToMove = selectedItems
        .sort((a, b) => a - b)
        .map(index => newColleges[index]);
      
      // Remove items from highest index to lowest
      [...selectedItems].sort((a, b) => b - a)
        .forEach(index => newColleges.splice(index, 1));
      
      // Calculate insert position
      const targetIndex = hoverIndex < dragIndex ? hoverIndex : hoverIndex - itemsToMove.length + 1;
      
      // Insert items at new position
      newColleges.splice(targetIndex, 0, ...itemsToMove);
      
      // Update selection to new positions
      const newSelectedIndices = [];
      for (let i = 0; i < itemsToMove.length; i++) {
        newSelectedIndices.push(targetIndex + i);
      }
      setSelectedItems(newSelectedIndices);
      
      // Update parent with new order
      moveCollege(null, null, newColleges);

      // Update highlighted indices for multi-item drag
      const newHighlightedIndices = updateHighlightedIndices(highlightedIndices, newColleges);
      setHighlightedIndices(newHighlightedIndices);
    } else {
      // Single item move
      const [draggedItem] = newColleges.splice(dragIndex, 1);
      newColleges.splice(hoverIndex, 0, draggedItem);
      moveCollege(dragIndex, hoverIndex);
      
      // Update selection if item was selected
      if (selectedItems.includes(dragIndex)) {
        setSelectedItems([hoverIndex]);
      }

      // Update highlighted indices for single item
      if (highlightedIndices.has(dragIndex)) {
        const newHighlightedIndices = new Set(highlightedIndices);
        newHighlightedIndices.delete(dragIndex);
        newHighlightedIndices.add(hoverIndex);
        setHighlightedIndices(newHighlightedIndices);
      }
    }
  };

  const handleBulkMove = (targetIndex) => {
    if (selectedItems.length === 0) return;
    
    // Convert to 0-based index (UI shows 1-based)
    const targetPosition = parseInt(targetIndex) - 1;
    if (isNaN(targetPosition) || targetPosition < 0 || targetPosition >= selectedColleges.length) return;

    const newColleges = [...selectedColleges];
    // Extract selected colleges
    const selectedCollegesArray = selectedItems
      .sort((a, b) => a - b)
      .map(index => newColleges[index]);
    
    // Remove selected colleges from highest index to lowest
    selectedItems
      .sort((a, b) => b - a)
      .forEach(index => newColleges.splice(index, 1));
    
    // Insert selected colleges at target position
    newColleges.splice(targetPosition, 0, ...selectedCollegesArray);
    
    // Update selected indices to reflect new positions
    const newSelectedIndices = [];
    for (let i = 0; i < selectedCollegesArray.length; i++) {
      newSelectedIndices.push(targetPosition + i);
    }
    
    // Update highlighted indices after move
    const newHighlightedIndices = updateHighlightedIndices(highlightedIndices, newColleges);
    setHighlightedIndices(newHighlightedIndices);
    
    setSelectedItems(newSelectedIndices);
    moveCollege(null, null, newColleges);
    setShowMoveBox(false);
    setMoveToIndex('');
  };

  const branchNameFormatter = (branchName) => {
    const commonWords = ['and', 'of', 'the', 'in', 'for', 'with', 'on', 'at', 'by', 'from'];
    return branchName
      .split(' ')
      .filter(word => !commonWords.includes(word.toLowerCase()))
      .map(word => word.charAt(0).toUpperCase())
      .join('');
  }

  const handleSearch = (searchTerm, searchType) => {
    if (!searchTerm) {
      setSearchMatches([]);
      setCurrentMatchIndex(0);
      setHighlightedIndices(new Set());
      return;
    }

    const matches = selectedColleges.reduce((acc, college, index) => {
      let searchValue = '';
      switch (searchType) {
        case 'instituteName':
          searchValue = college.instituteName?.toLowerCase() || '';
          break;
        case 'instituteCode':
          searchValue = college.instituteCode?.toString().toLowerCase() || '';
          break;
        case 'branchCode':
          searchValue = (college.selectedBranchCode || college.branchCode)?.toLowerCase() || '';
          break;
        default:
          return acc;
      }

      if (searchValue.includes(searchTerm.toLowerCase())) {
        acc.push(index);
      }
      return acc;
    }, []);

    setSearchMatches(matches);
    setCurrentMatchIndex(0);
    setHighlightedIndices(new Set(matches));
    
    if (matches.length > 0) {
      scrollToMatch(matches[0]);
    }
  };

  const scrollToMatch = (index) => {
    const element = document.getElementById(`college-row-${index}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  const handleNextMatch = () => {
    if (searchMatches.length > 0) {
      const nextIndex = (currentMatchIndex + 1) % searchMatches.length;
      setCurrentMatchIndex(nextIndex);
      scrollToMatch(searchMatches[nextIndex]);
    }
  };

  const handlePreviousMatch = () => {
    if (searchMatches.length > 0) {
      const prevIndex = (currentMatchIndex - 1 + searchMatches.length) % searchMatches.length;
      setCurrentMatchIndex(prevIndex);
      scrollToMatch(searchMatches[prevIndex]);
    }
  };

  const selectAllMatches = () => {
    setSelectedItems([...searchMatches]);
  };

  const clearSelection = () => {
    setSelectedItems([]);
    setLastSelectedIndex(null);
  };

  return (
    <div className="flex flex-col relative h-full">
      {/* Move Items Box */}
      {selectedItems.length > 0 && (
        <div className="sticky top-0 right-0 z-20 bg-white p-4 rounded-lg shadow-lg border border-gray-200 flex items-center gap-3">
          <span className="text-sm font-medium">
            {selectedItems.length} item{selectedItems.length > 1 ? 's' : ''} selected
          </span>
          {!showMoveBox ? (
            <button
              onClick={() => setShowMoveBox(true)}
              className="px-3 py-1.5 bg-blue-50 text-blue-600 rounded-md flex items-center gap-2 hover:bg-blue-100"
            >
              <MoveVertical size={16} />
              Move Items
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="1"
                max={selectedColleges.length}
                value={moveToIndex}
                onChange={(e) => setMoveToIndex(e.target.value)}
                className="w-20 px-2 py-1.5 border rounded-md"
                placeholder="Index..."
              />
              <button
                onClick={() => handleBulkMove(moveToIndex)}
                className="px-3 py-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Move
              </button>
              <button
                onClick={() => {
                  setShowMoveBox(false);
                  setMoveToIndex('');
                }}
                className="px-3 py-1.5 bg-gray-100 text-gray-600 rounded-md hover:bg-gray-200"
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      )}

      {/* Navigation Search with Enhanced Controls */}
      {isSearchPanelCollapsed && (
        <div className="sticky top-0 z-10">
          <NavigationSearch
            onSearch={handleSearch}
            totalMatches={searchMatches.length}
            currentMatch={currentMatchIndex}
            onNext={handleNextMatch}
            onPrevious={handlePreviousMatch}
          />
          {searchMatches.length > 0 && (
            <div className="bg-gray-50 border-b border-gray-200 px-4 py-2 flex justify-between items-center">
              <span className="text-sm text-gray-600">
                Found {searchMatches.length} matches
              </span>
              <div className="flex gap-2">
                <button
                  onClick={selectAllMatches}
                  className="px-3 py-1 text-sm bg-blue-50 text-blue-600 rounded-md hover:bg-blue-100 border border-blue-200"
                >
                  Select All Matches
                </button>
                {selectedItems.length > 0 && (
                  <button
                    onClick={clearSelection}
                    className="px-3 py-1 text-sm bg-gray-100 text-gray-600 rounded-md hover:bg-gray-200"
                  >
                    Clear Selection
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      <div className="flex-1 border border-gray-200 rounded-md bg-gray-50 overflow-hidden shadow-sm">
        <div className="h-full overflow-y-auto p-2">
          {selectedColleges.length > 0 ? (
            <div className="overflow-x-auto border rounded-lg">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Institute Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Branch Code
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Branch
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      City
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {selectedColleges.map((college, index) => (
                    <DraggableCollegeItem
                      key={college.uniqueId || `${college.id}_${index}`}
                      college={college}
                      index={index}
                      moveCollege={moveSelectedColleges}
                      handleRemoveCollege={removeCollegeFromList}
                      isSelected={selectedItems.includes(index)}
                      onSelect={handleSelectCollege}
                      selectedCount={selectedItems.length}
                      isSearchPanelCollapsed={isSearchPanelCollapsed}
                      highlightedIndices={highlightedIndices}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center text-gray-500 p-6">
              <div className="bg-gray-100 p-3 rounded-full mb-3">
                <Plus size={24} className="text-gray-400" />
              </div>
              <p className="font-medium">No colleges selected yet</p>
              <p className="text-sm mt-1">Search and select colleges from the left panel</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SelectedColleges;
