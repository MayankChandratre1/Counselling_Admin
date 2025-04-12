import React from 'react';
import { useDrag, useDrop } from 'react-dnd';
import { GripVertical } from 'lucide-react';

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
  eligibleData
}) => {
  const branchNameFormatter = (branchName) => {
    const commonWords = ['and', 'of', 'the', 'in', 'for', 'with', 'on', 'at', 'by', 'from'];
    return branchName ? branchName
      .split(' ')
      .filter(word => !commonWords.includes(word.toLowerCase()))
      .map(word => word.charAt(0).toUpperCase())
      .join('') : 'N/A';
  }
  const [{ isDragging }, drag] = useDrag({
    type: 'COLLEGE',
    item: { 
      index,
      isSelected,
      selectedCount
    },
    collect: monitor => ({
      isDragging: !!monitor.isDragging(),
    }),
  });

  const [{ isOver }, drop] = useDrop({
    accept: 'COLLEGE',
    hover(item, monitor) {
      if (!monitor.isOver({ shallow: true })) return;
      if (item.index === index) return;
      moveCollege(item.index, index);
      item.index = index;
    },
    collect: monitor => ({
      isOver: monitor.isOver({ shallow: true })
    })
  });

  return (
    <tr 
      ref={(node) => drag(drop(node))} 
      id={`college-row-${index}`}
      className={`
        ${isDragging ? 'opacity-50' : ''}
        ${isOver ? 'bg-blue-50' : ''}
        ${isSelected ? 'bg-blue-100' : ''}
        
        ${isEligible ? 'bg-green-50 border-l-4 !border-l-green-500 hover:bg-green-100' : 'hover:bg-gray-50'}
        ${highlightedIndices?.has(index) ? '!bg-yellow-50 border-l-4 !border-yellow-500' : ''}
        transition-all duration-200
      `}
    >
      <td className="px-6 py-2 nowrap max-w-[300px]">
        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={(event) => onSelect(index, event.target.checked, event)}
            onKeyDown={(e) => {
              // Prevent spacebar from triggering drag
              if (e.key === ' ') {
                e.preventDefault();
              }
            }}
            className="rounded border-blue-500 text-blue-600 focus:ring-blue-500"
            onClick={e => e.stopPropagation()}
          />
          <div>{index+1}</div>
          <GripVertical size={16} className="text-gray-400 cursor-grabbing" />
          <div>
            <div className="text-xs font-medium text-gray-900">{!isSearchPanelCollapsed ? `${college.instituteName.substring(0,30)}...`:`${college.instituteName}`}</div>
            <div className="text-xs text-gray-500">Status: {college.Status || 'N/A'}</div>
          </div>
        </div>
      </td>
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
          title={college.selectedBranch || 'All Branches'}  // Added tooltip here
        >
          {branchNameFormatter(college.selectedBranch) || 'All Branches'}
        </span>
      </td>
      

    
  
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
        >
          Remove
        </button>
      </td>
    </tr>
  );
};

export default DraggableCollegeItem;
