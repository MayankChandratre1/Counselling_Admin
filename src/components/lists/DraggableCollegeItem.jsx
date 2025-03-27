import React from 'react';
import { useDrag, useDrop } from 'react-dnd';
import { GripVertical } from 'lucide-react';

const DraggableCollegeItem = ({ college, index, moveCollege, handleRemoveCollege }) => {
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
    item: { index },
    collect: monitor => ({
      isDragging: monitor.isDragging(),
    }),
  });

  const [, drop] = useDrop({
    accept: 'COLLEGE',
    hover(item) {
      if (item.index === index) return;
      moveCollege(item.index, index);
      item.index = index;
    },
  });

  return (
    <tr 
      ref={(node) => drag(drop(node))} 
      className={`${isDragging ? 'opacity-50 bg-gray-50' : 'hover:bg-gray-50'} transition-colors duration-200`}
    >
      <td className="px-6 py-2 whitespace-nowrap">
        <div className="flex items-center">
          <GripVertical size={16} className="text-gray-400 cursor-grabbing mr-2" />
          <div>
            <div className="text-xs font-medium text-gray-900">{college.instituteName}</div>
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
