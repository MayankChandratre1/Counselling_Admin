import React from 'react';
import { Plus, Trash2, CheckCircle } from 'lucide-react';
import DraggableCollegeItem from './DraggableCollegeItem';

const SelectedColleges = ({ selectedColleges, clearColleges, moveCollege, removeCollegeFromList }) => {

  const branchNameFormatter = (branchName) => {
    const commonWords = ['and', 'of', 'the', 'in', 'for', 'with', 'on', 'at', 'by', 'from'];
    return branchName
      .split(' ')
      .filter(word => !commonWords.includes(word.toLowerCase()))
      .map(word => word.charAt(0).toUpperCase())
      .join('');
  }

  const renderSelectedCollegesTable = () => (
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
              moveCollege={moveCollege}
              handleRemoveCollege={removeCollegeFromList}
            />
          ))}
        </tbody>
      </table>
    </div>
  );

  return (
    <div className=" flex flex-col">
      {/* <div className="bg-white p-4 rounded-md shadow-sm border border-gray-200 mb-2">
        <div className="flex justify-between items-center">
          <label className="block text-sm font-medium text-gray-700 flex items-center">
            <CheckCircle className="h-5 w-5 mr-2 text-green-500" />
            Selected Colleges
            {selectedColleges.length > 0 && (
              <span className="ml-2 px-2 py-0.5 bg-blue-100 text-blue-600 text-xs rounded-full">
                {selectedColleges.length}
              </span>
            )}
          </label>
          {selectedColleges.length > 0 && (
            <button
              type="button"
              onClick={clearColleges}
              className="text-sm text-red-500 hover:text-red-700 flex items-center"
            >
              <Trash2 size={14} className="mr-1" />
              Clear all
            </button>
          )}
        </div>
      </div> */}
      <div className="flex-1 border border-gray-200 rounded-md bg-gray-50 overflow-hidden shadow-sm">
        <div className="h-full overflow-y-auto p-2">
          {selectedColleges.length > 0 ? (
            renderSelectedCollegesTable()
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
