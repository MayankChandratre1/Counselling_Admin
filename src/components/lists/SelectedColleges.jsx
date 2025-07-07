import React, { use, useEffect, useState, useRef, useCallback } from 'react';
import { Plus, Trash2, MoveVertical, Tag, ChevronDown } from 'lucide-react';
import DraggableCollegeItem from './DraggableCollegeItem';
import NavigationSearch from './NavigationSearch';
import { set, throttle } from 'lodash';
import axiosInstance from '../../utils/axios';
import ScrollZone from 'react-dnd-scrollzone';

const SelectedColleges = ({ 
  selectedColleges, 
  moveCollege, 
  removeCollegeFromList, 
  isSearchPanelCollapsed, 
  selectedUserMarks, 
  selectedUserCategory, 
  fetchCutoffs, 
  selectedCategory,
  // Export selection props
  editingList,
  selectedForExport,
  onSelectForExport
}) => {
  const [selectedItems, setSelectedItems] = useState([]);
  const [lastSelectedIndex, setLastSelectedIndex] = useState(null);
  const [showMoveBox, setShowMoveBox] = useState(false);
  const [moveToIndex, setMoveToIndex] = useState('');
  const [searchMatches, setSearchMatches] = useState([]);
  const [currentMatchIndex, setCurrentMatchIndex] = useState(0);
  const [highlightedIndices, setHighlightedIndices] = useState(new Set());
  const [eligibleBranches, setEligibleBranches] = useState([]);
  const [selectedCollegesCutoffs, setSelectedCollegesCutoffs] = useState([]);
  const [recentlyMoved, setRecentlyMoved] = useState(new Set());
  const [isDragging, setIsDragging] = useState(false);
  const [showColorMenu, setShowColorMenu] = useState(false);
  const [showBulkColorMenu, setShowBulkColorMenu] = useState(false);
  const [bulkColorAction, setBulkColorAction] = useState('selected'); // 'selected', 'before', 'after'
  const [bulkColorIndex, setBulkColorIndex] = useState(0);
  const scrollContainerRef = useRef(null);
  const originalScrollBehaviorRef = useRef('smooth');
  const colorMenuRef = useRef(null);
  const bulkColorMenuRef = useRef(null);

  const colorOptions = [
    { id: 'none', name: 'No Label', bgClass: 'bg-transparent', textClass: 'text-gray-500', borderClass: 'border-gray-300' },
    { id: 'blue', name: 'Blue', bgClass: 'bg-blue-100', textClass: 'text-blue-700', borderClass: 'border-blue-300' },
    { id: 'green', name: 'Green', bgClass: 'bg-green-100', textClass: 'text-green-700', borderClass: 'border-green-300' },
    { id: 'amber', name: 'Amber', bgClass: 'bg-amber-100', textClass: 'text-amber-700', borderClass: 'border-amber-300' },
    { id: 'rose', name: 'Rose', bgClass: 'bg-rose-100', textClass: 'text-rose-700', borderClass: 'border-rose-300' },
    { id: 'purple', name: 'Purple', bgClass: 'bg-purple-100', textClass: 'text-purple-700', borderClass: 'border-purple-300' },
  ];

  const fetchCutoffs2 = async (callback) => {
    try {
      const collegeIds = selectedColleges.map(college => college.id);
      const response = await axiosInstance.post('/api/admin/getcutoff', { collegeIds: [...new Set(collegeIds)] });
      if (response.data && response.data.length > 0) {
        const cutoffs = response.data
        setSelectedCollegesCutoffs(cutoffs);
        callback(cutoffs);
      }
    } catch (err) {
      console.error('Error fetching city list:', err);
    }
  };

  useEffect(() => {
    fetchCutoffs2 && fetchCutoffs2(setSelectedCollegesCutoffs);
    console.log('Selected colleges cutoffs:', selectedColleges);
    
  },[selectedColleges])

  useEffect(() => {    
    if (selectedCollegesCutoffs && selectedCollegesCutoffs.length > 0) {
      const selectedBranchCodes = selectedColleges.map(college => college.selectedBranchCode || college.branchCode);
      let extractedData;
      if(selectedCategory)
      extractedData = selectedCollegesCutoffs.map(college => {
        const eligibleBranches = college.branches
          .filter(branch => {

            const categoryData = branch.cutoffs.find(
              c => c.category === selectedCategory 
            );
            return selectedBranchCodes.includes(branch.branchCode) && categoryData && selectedUserMarks >= categoryData.percentile;
          })
          .map(branch => ({
            collegeId: college.id,
            branchCode: branch.branchCode,
            branchName: branch.branchName,
            cutoffData: branch.cutoffs.find(c => c.category === selectedCategory)
          }));
       
        

          

        return {
          collegeId: college.id,
          eligibleBranches
        };
      }).filter(college => college.eligibleBranches.length > 0);
      else
      extractedData = selectedCollegesCutoffs.map(college => {
        const eligibleBranches = college.branches
          .filter(branch => {
            const categoryData = branch.cutoffs.find(
              c => c.category === selectedCategory
            );
            return categoryData && selectedUserMarks >= categoryData.percentile;
          })
          .map(branch => ({
            collegeId: college.id,
            branchCode: branch.branchCode,
            branchName: branch.branchName,
            cutoffData: branch.cutoffs.find(c => c.category === selectedCategory)
          }));

          
          
          return {
            collegeId: college.id,
            eligibleBranches
          };
        });
        console.log(extractedData, 'extractedData');
      setEligibleBranches(extractedData);
    }
  }, [selectedCollegesCutoffs, selectedUserCategory, selectedUserMarks]);

  const handleSelectCollege = (index, checked, event) => {
    if (!event) return;
    
    const shiftKey = event.nativeEvent.shiftKey;
    const ctrlKey = event.nativeEvent.ctrlKey || event.nativeEvent.metaKey;

    if (shiftKey && lastSelectedIndex !== null) {
      const start = Math.min(lastSelectedIndex, index);
      const end = Math.max(lastSelectedIndex, index);
      const range = Array.from(
        { length: end - start + 1 },
        (_, i) => start + i
      );

      // If ctrl is also pressed, toggle the range
      if (ctrlKey) {
        setSelectedItems(prev => {
          const newSelection = new Set(prev);
          range.forEach(i => {
            if (newSelection.has(i)) {
              newSelection.delete(i);
            } else {
              newSelection.add(i);
            }
          });
          
          return Array.from(newSelection).sort((a, b) => a - b);
        });
        
      } else {
        // Simple shift-click replaces the selection
        setSelectedItems(checked ? range : []);
      }
    } else if (ctrlKey) {
      // Regular ctrl+click for toggling individual items
      setSelectedItems(prev => {
        const newSelection = new Set(prev);
        if (checked) {
          newSelection.add(index);
        } else {
          newSelection.delete(index);
        }
        // Convert to array and sort        
        return Array.from(newSelection).sort((a, b) => a - b);
      });
      setLastSelectedIndex(index);
    } else {
      // Regular click for selecting single item
      setSelectedItems(checked ? [index] : []);
      setLastSelectedIndex(checked ? index : null);
    }
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

  // Handle drag start/end to control scroll speed
  const handleDragStart = () => {
    setIsDragging(true);
    if (scrollContainerRef.current) {
      // Store original scroll behavior
      originalScrollBehaviorRef.current = scrollContainerRef.current.style.scrollBehavior || 'smooth';
      
      // Reduce scroll speed during drag
      scrollContainerRef.current.style.scrollBehavior = 'auto';
      scrollContainerRef.current.style.overflowY = 'auto';
      
      // Add custom CSS for slower scrolling
      scrollContainerRef.current.classList.add('drag-scroll-slow');
    }
  };

  const handleDragEnd = () => {
    setIsDragging(false);
    if (scrollContainerRef.current) {
      // Restore original scroll behavior
      scrollContainerRef.current.style.scrollBehavior = originalScrollBehaviorRef.current;
      
      // Remove slow scroll class
      scrollContainerRef.current.classList.remove('drag-scroll-slow');
    }
  };

   const throttledMoveCollege = useRef(
    throttle((dragIndex, hoverIndex, newOrder) => {
      moveCollege(dragIndex, hoverIndex, newOrder);
    }, 100) // Throttle to max 10 moves per second
  );

  // Enhanced move function with drag state management
  const moveSelectedColleges = useCallback((dragIndex, hoverIndex) => {
    // Prevent unnecessary operations
    if (dragIndex === hoverIndex) return;
    
    const newColleges = [...selectedColleges];
    
    if (selectedItems.includes(dragIndex)) {
      // Multi-item move with optimized algorithm
      const itemsToMove = selectedItems
        .sort((a, b) => a - b)
        .map(index => newColleges[index]);
      
      // Batch remove operation
      const indicesToRemove = [...selectedItems].sort((a, b) => b - a);
      indicesToRemove.forEach(index => newColleges.splice(index, 1));
      
      // Calculate optimal insert position
      const effectiveHoverIndex = selectedItems.filter(idx => idx < hoverIndex).length;
      const targetIndex = Math.max(0, hoverIndex - effectiveHoverIndex);
      
      // Batch insert operation
      newColleges.splice(targetIndex, 0, ...itemsToMove);
      
      // Update selection indices
      const newSelectedIndices = itemsToMove.map((_, i) => targetIndex + i);
      setSelectedItems(newSelectedIndices);
      
      // Use throttled move
      throttledMoveCollege.current(null, null, newColleges);
      
      // Smooth scroll to moved items
      requestAnimationFrame(() => {
        const element = document.getElementById(`college-row-${targetIndex}`);
        if (element) {
          element.scrollIntoView({
            behavior: 'smooth',
            block: 'nearest',
            inline: 'nearest'
          });
        }
      });
    } else {
      // Single item move
      const [draggedItem] = newColleges.splice(dragIndex, 1);
      newColleges.splice(hoverIndex, 0, draggedItem);
      
      // Use throttled move
      throttledMoveCollege.current(dragIndex, hoverIndex);
      
      // Update selection if needed
      if (selectedItems.includes(dragIndex)) {
        setSelectedItems([hoverIndex]);
      }
    }
    
    // Add visual feedback
    setRecentlyMoved(new Set([hoverIndex]));
    setTimeout(() => setRecentlyMoved(new Set()), 1500);
    
  }, [selectedColleges, selectedItems, moveCollege]);

  const handleMove = (dragIndex, hoverIndex) => {
    // Save current state and perform move
    moveCollege(dragIndex, hoverIndex);
    
    // Track moved items for highlighting
    setRecentlyMoved(new Set([dragIndex, hoverIndex]));
    
    // Clear highlight after animation
    setTimeout(() => {
      setRecentlyMoved(new Set());
    }, 1000);

    // Scroll to the moved item
    setTimeout(() => {
      const element = document.getElementById(`college-row-${hoverIndex}`);
      if (element) {
        element.scrollIntoView({
          behavior: 'smooth',
          block: 'center'
        });
      }
    }, 100);
  };

  const handleBulkMove = (targetIndex) => {
    if (selectedItems.length === 0) return;
    
    // Convert to 0-based index (UI shows 1-based)
    const targetPosition = parseInt(targetIndex) - 1;
    
    // Calculate valid range
    const maxValidPosition = selectedColleges.length - selectedItems.length;
    
    // Ensure target is within valid range
    if (isNaN(targetPosition) || targetPosition < 0 || targetPosition > maxValidPosition) {
      alert(`Please enter a valid position between 1 and ${maxValidPosition + 1}`);
      return;
    }

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

    const movedIndices = new Set(newSelectedIndices);
    setRecentlyMoved(movedIndices);
    
    setTimeout(() => {
      setRecentlyMoved(new Set());
    }, 1000);

    // Scroll to first moved item
    setTimeout(() => {
      const element = document.getElementById(`college-row-${targetPosition}`);
      if (element) {
        element.scrollIntoView({
          behavior: 'smooth',
          block: 'center'
        });
      }
    }, 100);
  };

  const moveToTop = () => {
    if (selectedItems.length === 0) return;
    const newColleges = [...selectedColleges];
    
    // Extract selected colleges
    const itemsToMove = selectedItems
      .sort((a, b) => a - b)
      .map(index => newColleges[index]);

    // Remove from highest to lowest to maintain correct indices
    selectedItems
      .sort((a, b) => b - a)
      .forEach(index => newColleges.splice(index, 1));

    // Insert at the beginning
    newColleges.unshift(...itemsToMove);

    // Update selected indices to reflect new positions
    const newSelectedIndices = Array.from({ length: itemsToMove.length }, (_, i) => i);
    setSelectedItems(newSelectedIndices);
    moveCollege(null, null, newColleges);

    // Add highlight effect
    setRecentlyMoved(new Set(newSelectedIndices));
    setTimeout(() => {
      setRecentlyMoved(new Set());
    }, 1000);

    // Scroll to top
    setTimeout(() => {
      const element = document.getElementById(`college-row-0`);
      if (element) {
        element.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });
      }
    }, 100);
  };

  const moveToBottom = () => {
    if (selectedItems.length === 0) return;
    const newColleges = [...selectedColleges];
    
    // Extract selected colleges
    const itemsToMove = selectedItems
      .sort((a, b) => a - b)
      .map(index => newColleges[index]);

    // Remove from highest to lowest to maintain correct indices
    selectedItems
      .sort((a, b) => b - a)
      .forEach(index => newColleges.splice(index, 1));

    // Add to the end
    newColleges.push(...itemsToMove);

    // Update selected indices to reflect new positions
    const newSelectedIndices = Array.from({ length: itemsToMove.length }, (_, i) => newColleges.length - itemsToMove.length + i);
    setSelectedItems(newSelectedIndices);
    moveCollege(null, null, newColleges);

    // Add highlight effect
    setRecentlyMoved(new Set(newSelectedIndices));
    setTimeout(() => {
      setRecentlyMoved(new Set());
    }, 1000);

    // Scroll to bottom
    setTimeout(() => {
      const element = document.getElementById(`college-row-${newColleges.length - 1}`);
      if (element) {
        element.scrollIntoView({
          behavior: 'smooth',
          block: 'end'
        });
      }
    }, 100);
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

  useEffect(() => {
  const el = scrollContainerRef.current;
  if (!el) return;

  const handleDragOver = (e) => {
    e.preventDefault();
    const rect = el.getBoundingClientRect();
    const offset = 40;
    const speed = 20;

    if (e.clientY < rect.top + offset) {
      el.scrollTop -= speed;
    } else if (e.clientY > rect.bottom - offset) {
      el.scrollTop += speed;
    }
  };

  el.addEventListener('dragover', handleDragOver);
  return () => el.removeEventListener('dragover', handleDragOver);
}, []);

// Function to handle bulk removal of selected colleges
const handleBulkRemove = () => {
  if (selectedItems.length === 0) return;
  
  // Confirm before removing
  if (window.confirm(`Are you sure you want to remove ${selectedItems.length} selected colleges?`)) {
    // Create a new array excluding the selected items
    const indicesToRemove = new Set(selectedItems);
    const newColleges = selectedColleges.filter((_, index) => !indicesToRemove.has(index));
    
    // Update the entire list at once
    moveCollege(null, null, newColleges);
    
    // Clear selection after removal
    setSelectedItems([]);
    setLastSelectedIndex(null);
  }
};


 // Apply color label to a single college
const applyColorLabel = (index, colorId) => {
  const updatedColleges = [...selectedColleges];
  updatedColleges[index] = {
    ...updatedColleges[index],
    colorLabel: colorId === 'none' ? null : colorId
  };
  
  // Using the parent's moveCollege function to update the colleges array
  moveCollege(null, null, updatedColleges);
};

// Apply color label to multiple colleges
const applyBulkColorLabel = (colorId) => {
  const updatedColleges = [...selectedColleges];
  
  switch (bulkColorAction) {
    case 'selected':
      // Apply to all selected items
      selectedItems.forEach(index => {
        updatedColleges[index] = {
          ...updatedColleges[index],
          colorLabel: colorId === 'none' ? null : colorId
        };
      });
      break;
    
    case 'before':
      // Apply to all items before the specified index
      for (let i = 0; i < bulkColorIndex; i++) {
        updatedColleges[i] = {
          ...updatedColleges[i],
          colorLabel: colorId === 'none' ? null : colorId
        };
      }
      break;
    
    case 'after':
      // Apply to all items after and including the specified index
      for (let i = bulkColorIndex; i < updatedColleges.length; i++) {
        updatedColleges[i] = {
          ...updatedColleges[i],
          colorLabel: colorId === 'none' ? null : colorId
        };
      }
      break;
  }
  
  // Update colleges with the modified array
  moveCollege(null, null, updatedColleges);
  setShowBulkColorMenu(false);
}

  if (selectedColleges.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg border border-dashed border-gray-300">
        <p>No colleges selected yet</p>
        <p className="text-sm mt-1">Search and add colleges using the form above</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col relative h-full">
      {/* Add drag scroll CSS */}
      <style jsx>{`
        .drag-container {
          position: relative;
          overflow: hidden;
          height: 100%;
        }
        
        .drag-container.dragging {
          cursor: grabbing;
        }
        
        .drag-container .scroll-area {
          height: 100%;
          overflow-y: auto;
          scroll-behavior: smooth;
          transition: scroll-behavior 0.2s ease;
        }
        
        .drag-container.dragging .scroll-area {
          scroll-behavior: auto;
        }
        
        /* Smooth scrollbar styling */
        .scroll-area::-webkit-scrollbar {
          width: 8px;
        }
        
        .scroll-area::-webkit-scrollbar-track {
          background: #f1f5f9;
          border-radius: 4px;
        }
        
        .scroll-area::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 4px;
          transition: background 0.2s ease;
        }
        
        .scroll-area::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
        }
        
        .drag-container.dragging .scroll-area::-webkit-scrollbar-thumb {
          background: #64748b;
        }
        
        /* Visual feedback for drag zones */
        .drag-container.dragging::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 80px;
          background: linear-gradient(to bottom, rgba(59, 130, 246, 0.1), transparent);
          pointer-events: none;
          z-index: 10;
        }
        
        .drag-container.dragging::after {
          content: '';
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          height: 80px;
          background: linear-gradient(to top, rgba(59, 130, 246, 0.1), transparent);
          pointer-events: none;
          z-index: 10;
        }
        
        /* Table optimizations */
        .drag-table {
          border-collapse: separate;
          border-spacing: 0;
        }
        
        .drag-table tbody tr {
          transition: background-color 0.15s ease;
        }
        
        .drag-table tbody tr.dragging {
          background-color: rgba(59, 130, 246, 0.1);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
          transform: scale(1.02);
          z-index: 1000;
        }
        
        .drag-table tbody tr.drag-over {
          background-color: rgba(59, 130, 246, 0.05);
          border-top: 2px solid #3b82f6;
        }
      `}</style>

      {/* Move Items Box */}
      {selectedItems.length > 0 && (
        <div className="sticky top-0 right-0 z-20 bg-white p-4 rounded-lg shadow-lg border border-gray-200 flex items-center gap-3">
          <span className="text-sm font-medium">
            {selectedItems.length} item{selectedItems.length > 1 ? 's' : ''} selected
          </span>
          <button
            onClick={moveToTop}
            className="px-3 py-1.5 bg-blue-50 text-blue-600 rounded-md flex items-center gap-2 hover:bg-blue-100"
          >
            Move to Top
          </button>
          <button
            onClick={moveToBottom}
            className="px-3 py-1.5 bg-blue-50 text-blue-600 rounded-md flex items-center gap-2 hover:bg-blue-100"
          >
            Move to Bottom
          </button>
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
          
          {/* Add Bulk Color Label Button */}
          <div className="relative" ref={bulkColorMenuRef}>
            <button
              onClick={() => setShowBulkColorMenu(!showBulkColorMenu)}
              className="px-3 py-1.5 bg-violet-50 text-violet-600 rounded-md flex items-center gap-2 hover:bg-violet-100"
            >
              <Tag size={16} />
              Color Label
              <ChevronDown size={14} className={`transition-transform ${showBulkColorMenu ? 'rotate-180' : ''}`} />
            </button>
            
            {showBulkColorMenu && (
              <div className="absolute left-0 top-full mt-1 w-64 bg-white shadow-lg rounded-md border border-gray-200 z-50 py-2">
                <div className="px-3 py-2 border-b border-gray-100">
                  <p className="font-medium text-sm text-gray-700">Apply color to:</p>
                  <div className="mt-2 space-y-2">
                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="radio"
                        checked={bulkColorAction === 'selected'}
                        onChange={() => setBulkColorAction('selected')}
                        className="text-violet-600 focus:ring-violet-500"
                      />
                      Selected items ({selectedItems.length})
                    </label>
                    
                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="radio"
                        checked={bulkColorAction === 'before'}
                        onChange={() => setBulkColorAction('before')}
                        className="text-violet-600 focus:ring-violet-500"
                      />
                      All items before index:
                      <input
                        type="number"
                        min="1"
                        max={selectedColleges.length}
                        value={bulkColorAction === 'before' ? bulkColorIndex : ''}
                        onChange={(e) => setBulkColorIndex(parseInt(e.target.value) || 0)}
                        className="w-16 px-2 py-0.5 border border-gray-300 rounded text-sm"
                        onClick={(e) => {
                          if (bulkColorAction !== 'before') {
                            setBulkColorAction('before');
                          }
                          e.stopPropagation();
                        }}
                      />
                    </label>
                    
                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="radio"
                        checked={bulkColorAction === 'after'}
                        onChange={() => setBulkColorAction('after')}
                        className="text-violet-600 focus:ring-violet-500"
                      />
                      All items from index:
                      <input
                        type="number"
                        min="1"
                        max={selectedColleges.length}
                        value={bulkColorAction === 'after' ? bulkColorIndex : ''}
                        onChange={(e) => setBulkColorIndex(parseInt(e.target.value) || 0)}
                        className="w-16 px-2 py-0.5 border border-gray-300 rounded text-sm"
                        onClick={(e) => {
                          if (bulkColorAction !== 'after') {
                            setBulkColorAction('after');
                          }
                          e.stopPropagation();
                        }}
                      />
                    </label>
                  </div>
                </div>
                
                <div className="px-3 py-2">
                  <p className="font-medium text-sm text-gray-700 mb-2">Select color:</p>
                  <div className="grid grid-cols-3 gap-2">
                    {colorOptions.map(color => (
                      <button
                        key={color.id}
                        onClick={() => applyBulkColorLabel(color.id)}
                        className={`p-2 rounded border ${color.borderClass} ${color.bgClass} ${color.textClass} text-xs flex flex-col items-center transition-all hover:shadow`}
                      >
                        <div className={`w-4 h-4 rounded-full ${color.id === 'none' ? 'border border-gray-300' : color.bgClass} mb-1`}></div>
                        {color.name}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
          
          {/* Add Bulk Remove Button */}
          <button
            onClick={handleBulkRemove}
            className="px-3 py-1.5 bg-red-50 text-red-600 rounded-md flex items-center gap-2 hover:bg-red-100"
          >
            <Trash2 size={16} />
            Remove Selected
          </button>
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
                <button
                  onClick={handleBulkRemove}
                  className="px-3 py-1 text-sm bg-red-50 text-red-600 rounded-md hover:bg-red-100 border border-red-200"
                >
                  Remove Selected
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Colleges List */}
      <div className={`flex-1 drag-container ${isDragging ? 'dragging' : ''}`}>
        <div 
          ref={scrollContainerRef}
          className="scroll-area"
        >
          {selectedColleges.length > 0 ? (
            <div className="p-2">
              <div className="overflow-x-auto border rounded-lg">
                <table className="min-w-full divide-y divide-gray-200 drag-table">
                  <thead className="bg-gray-50 sticky top-0 z-10">
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
                      {/* Label column header */}
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Label
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Cutoff
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
                    {selectedColleges.map((college, index) => {
                      // Check if this college and branch combination is eligible
                      const eligibleCollege = eligibleBranches.find(ec => ec.collegeId === college.id);
                      const isEligible = eligibleCollege?.eligibleBranches.some(
                        branch => branch.branchCode === college.selectedBranchCode
                      );

                      const selectedCategoryCuttoff = selectedCollegesCutoffs?.find(clg => clg.id === college.id)?.branches?.find(
                        branch => branch.branchCode === college.selectedBranchCode)?.cutoffs?.find(cutoff => cutoff.year == 2024 && cutoff.category === selectedCategory);
                      
                      // Get color option based on college's colorLabel
                      const colorOption = colorOptions.find(c => c.id === (college.colorLabel || 'none')) || colorOptions[0];
                      
                      return (
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
                          selectedUserMarks={selectedUserMarks}
                          selectedUserCategory={selectedUserCategory}
                          selectedCategoryCuttoff={selectedCategoryCuttoff}
                          isEligible={isEligible}
                          eligibleData={eligibleCollege?.eligibleBranches.find(
                            branch => branch.branchCode === college.selectedBranchCode
                          )}
                          recentlyMoved={recentlyMoved.has(index)}
                          onMove={handleMove}
                          // Pass export props
                          editingList={editingList}
                          selectedForExport={selectedForExport}
                          onSelectForExport={onSelectForExport}
                          // Pass drag state handlers
                          onDragStart={handleDragStart}
                          onDragEnd={handleDragEnd}
                          // Pass color label props
                          colorOption={colorOption}
                          onChangeColorLabel={(colorId) => applyColorLabel(index, colorId)}
                          colorOptions={colorOptions}
                        />
                      );
                    })}
                  </tbody>
                </table>
              </div>
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

