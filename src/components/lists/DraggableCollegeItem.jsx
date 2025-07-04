import { useDrag, useDrop } from 'react-dnd';
import { GripVertical } from 'lucide-react';

import { useRef, useEffect, useCallback, useState } from 'react';

// Custom hook for smooth drag scrolling
const useDragScroll = (scrollContainerRef, isDragging) => {
  const scrollIntervalRef = useRef(null);
  const lastScrollTimeRef = useRef(0);
  const scrollVelocityRef = useRef(0);

  const smoothScroll = useCallback((direction, speed) => {
    if (!scrollContainerRef.current) return;

    const container = scrollContainerRef.current;
    const now = Date.now();
    const timeDelta = now - lastScrollTimeRef.current;
    
    // Smooth acceleration/deceleration
    const targetVelocity = direction * speed;
    const acceleration = 0.3; // Adjust for smoothness
    
    scrollVelocityRef.current += (targetVelocity - scrollVelocityRef.current) * acceleration;
    
    // Apply scroll with easing
    const scrollAmount = scrollVelocityRef.current * (timeDelta / 16); // Normalize to 60fps
    container.scrollTop += scrollAmount;
    
    lastScrollTimeRef.current = now;
  }, [scrollContainerRef]);

  const handleDragScroll = useCallback((e) => {
    if (!isDragging || !scrollContainerRef.current) return;

    const container = scrollContainerRef.current;
    const rect = container.getBoundingClientRect();
    const scrollZoneSize = 80; // Increased zone size for better UX
    const maxScrollSpeed = 8; // Reduced max speed
    const minScrollSpeed = 1;

    // Calculate mouse position relative to container
    const mouseY = e.clientY - rect.top;
    const containerHeight = rect.height;

    let scrollDirection = 0;
    let scrollSpeed = 0;

    // Top scroll zone
    if (mouseY < scrollZoneSize) {
      scrollDirection = -1;
      const proximity = (scrollZoneSize - mouseY) / scrollZoneSize;
      scrollSpeed = minScrollSpeed + (maxScrollSpeed - minScrollSpeed) * proximity;
    }
    // Bottom scroll zone
    else if (mouseY > containerHeight - scrollZoneSize) {
      scrollDirection = 1;
      const proximity = (mouseY - (containerHeight - scrollZoneSize)) / scrollZoneSize;
      scrollSpeed = minScrollSpeed + (maxScrollSpeed - minScrollSpeed) * proximity;
    }

    // Clear existing interval
    if (scrollIntervalRef.current) {
      clearInterval(scrollIntervalRef.current);
      scrollIntervalRef.current = null;
    }

    // Start smooth scrolling if in scroll zone
    if (scrollDirection !== 0) {
      scrollIntervalRef.current = setInterval(() => {
        smoothScroll(scrollDirection, scrollSpeed);
      }, 16); // ~60fps
    } else {
      // Reset velocity when not in scroll zone
      scrollVelocityRef.current = 0;
    }
  }, [isDragging, smoothScroll]);

  const stopDragScroll = useCallback(() => {
    if (scrollIntervalRef.current) {
      clearInterval(scrollIntervalRef.current);
      scrollIntervalRef.current = null;
    }
    scrollVelocityRef.current = 0;
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (scrollIntervalRef.current) {
        clearInterval(scrollIntervalRef.current);
      }
    };
  }, []);

  return { handleDragScroll, stopDragScroll };
};


const DraggableCollegeItem = ({ 
  college, 
  index, 
  moveCollege, 
  handleRemoveCollege,
  isSelected,
  onSelect,
  selectedCount,
  isSearchPanelCollapsed,
  highlighted,
  highlightedIndices,
  selectedUserMarks,
  selectedUserCategory,
  isEligible,
  eligibleData,
  selectedCategoryCuttoff,
  recentlyMoved,
  onMove,
  onSelectForExport,
  onDragEnd,
  onDragStart,
  isDragging: globalIsDragging
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isOver, setIsOver] = useState(false);
  const dragRef = useRef(null);
  const hoverTimeoutRef = useRef(null);

  const branchNameFormatter = (branchName) => {
    const commonWords = ['and', 'of', 'the', 'in', 'for', 'with', 'on', 'at', 'by', 'from'];

    if (branchName && branchName.includes('(') && !branchName.includes(')')) 
      branchName += ')';

    return branchName ? branchName
      .replace("(", ' ( ')
      .replace(")", ' ) ')
      .split(' ')
      .filter(word => !commonWords.includes(word.toLowerCase()))
      .map(word => word.charAt(0).toUpperCase())
      .join('') : 'N/A';
  }

  const [{ isDragging: dragMonitorIsDragging }, drag] = useDrag({
    type: 'COLLEGE',
    item: () => {
      setIsDragging(true);
      onDragStart();
      return { 
        index, 
        college,
        selectedCount
      };
    },
    end: () => {
      setIsDragging(false);
      onDragEnd();
    },
    collect: monitor => ({
      isDragging: !!monitor.isDragging(),
    }),
  });

  const [{ isOver: dropIsOver }, drop] = useDrop({
    accept: 'COLLEGE',
    hover: (item, monitor) => {
      if (!monitor.isOver({ shallow: true })) return;
      
      const dragIndex = item.index;
      const hoverIndex = index;
      
      if (dragIndex === hoverIndex) return;

      // Clear any existing timeout
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
      }

      // Get the hovered rectangle
      const hoverBoundingRect = dragRef.current?.getBoundingClientRect();
      if (!hoverBoundingRect) return;

      // Get vertical middle
      const hoverMiddleY = (hoverBoundingRect.bottom - hoverBoundingRect.top) / 2;
      
      // Determine mouse position
      const clientOffset = monitor.getClientOffset();
      if (!clientOffset) return;
      
      // Get pixels to the top
      const hoverClientY = clientOffset.y - hoverBoundingRect.top;

      // Enhanced hysteresis to prevent flickering
      const threshold = hoverBoundingRect.height * 0.25;
      
      // Only perform the move when the mouse has crossed the threshold
      if (dragIndex < hoverIndex && hoverClientY < threshold) return;
      if (dragIndex > hoverIndex && hoverClientY > hoverMiddleY + threshold) return;

      // Debounce the move operation to reduce jitter
      hoverTimeoutRef.current = setTimeout(() => {
        moveCollege(dragIndex, hoverIndex);
        item.index = hoverIndex;
      }, 8); // Small delay for smoother experience
    },
    collect: monitor => ({
      isOver: monitor.isOver({ shallow: true })
    })
  });

  // Combine drag and drop refs
  const dragDropRef = useCallback((node) => {
    dragRef.current = node;
    drag(drop(node));
  }, [drag, drop]);

  // Update local isOver state
  useEffect(() => {
    setIsOver(dropIsOver);
  }, [dropIsOver]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
      }
    };
  }, []);

  return (
    <tr 
      ref={dragDropRef}
      id={`college-row-${index}`}
      className={`
        ${isDragging || dragMonitorIsDragging ? 'dragging opacity-75 scale-105 shadow-lg z-50' : ''}
        ${isOver ? 'drag-over' : ''}
        ${isSelected ? 'bg-blue-100 border-l-4 border-l-blue-500' : ''}
        ${recentlyMoved ? 'animate-pulse bg-yellow-100' : ''}
        ${isEligible ? 'bg-green-50 border-l-4 !border-l-green-500 hover:bg-green-100' : 'hover:bg-gray-50'}
        ${highlightedIndices?.has(index) ? '!bg-yellow-50 border-l-4 !border-yellow-500' : ''}
        transition-all duration-150 ease-in-out
        ${globalIsDragging ? 'select-none' : ''}
      `}
    >
      <td className="px-6 py-2 nowrap max-w-[300px]">
        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={(event) => {
              onSelect(index, event.target.checked, event)
              onSelectForExport(college.uniqueId)
            }}
            onKeyDown={(e) => {
              if (e.key === ' ') {
                e.preventDefault();
              }
            }}
            className="rounded border-blue-500 text-blue-600 focus:ring-blue-500"
            onClick={e => e.stopPropagation()}
            disabled={globalIsDragging}
          />
          <div className="text-sm font-medium text-gray-600 min-w-[24px]">{index + 1}</div>
          <div className={`transition-opacity duration-150 ${isDragging ? 'opacity-50' : ''}`}>
            <GripVertical size={16} className="text-gray-400 cursor-grab hover:text-gray-600" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-sm font-medium text-gray-900 truncate">
              {!isSearchPanelCollapsed ? `${college.instituteName.substring(0,30)}...` : college.instituteName}
            </div>
            <div className="text-xs text-gray-500">Status: {college.Status || 'N/A'}</div>
          </div>
        </div>
      </td>
      
      {/* Rest of your table cells remain the same */}
      <td className="px-6 py-4 whitespace-nowrap">
        {college.selectedBranchCode ? (
          <span className="inline-flex items-center text-xs leading-5 font-semibold">
            <span className="bg-blue-100 text-blue-800 pl-2 pr-1 py-0.5 rounded-l-full font-bold">
              {college.selectedBranchCode.substring(0, 4)}
            </span>
            <span className="bg-indigo-100 text-indigo-800 pr-2 py-0.5 rounded-r-full">
              {college.selectedBranchCode.substring(4)}
            </span>
          </span>
        ) : (
          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
            {college.instituteCode}
          </span>
        )}
      </td>
      
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
        <span 
          className="px-2 py-1 bg-indigo-100 text-indigo-800 rounded-full text-xs font-bold cursor-help"
          title={college.selectedBranch || 'All Branches'}
        >
          {branchNameFormatter(college.selectedBranch) || 'All Branches'}
        </span>
      </td>
      
      {!selectedUserCategory && !selectedUserMarks && (
        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
          {selectedCategoryCuttoff ? (
            <div className="flex flex-col">
              <span className="text-gray-700 font-medium">
                {selectedCategoryCuttoff.percentile.toFixed(2)}%
              </span>
              <span className="text-xs text-blue-600">
                Rank: {selectedCategoryCuttoff.rank}
              </span>
            </div>
          ) : (
            <span className="text-gray-400">-</span>
          )}
        </td>
      )}
  
      {selectedUserCategory && selectedUserMarks && (
        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
          {isEligible && eligibleData ? (
            <div className="flex flex-col">
              <span className="text-green-700 font-medium">
                {eligibleData.cutoffData.percentile.toFixed(2)}%
              </span>
              <span className="text-xs text-green-600">
                Rank: {eligibleData.cutoffData.rank}
              </span>
            </div>
          ) : (
            <span className="text-gray-400">Not Eligible</span>
          )}
        </td>
      )}

      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
        {college.city ? college.city.toUpperCase() : 'N/A'}
      </td>

      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            handleRemoveCollege(index);
          }}
          className="text-red-600 hover:text-red-900 transition-colors duration-200"
          disabled={globalIsDragging}
        >
          Remove
        </button>
      </td>
    </tr>
  );
};

export default DraggableCollegeItem;
