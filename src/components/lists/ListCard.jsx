import React from 'react';
import { Edit, Trash2, School, Users, ChevronDown, ChevronUp, Calendar, User } from 'lucide-react';
import ListDetails from './ListDetails';

const ListCard = ({ list, expandedListId, handleListClick, handleEdit, handleDelete }) => {
  const isExpanded = expandedListId === list.id;
  
  return (
    <div className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100 overflow-hidden">
      {/* Card Header */}
      <div 
        className={`p-6 cursor-pointer transition-colors duration-200 ${
          isExpanded 
            ? 'bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-200' 
            : 'hover:bg-gray-50'
        }`}
        onClick={() => handleListClick(list.id)}
      >
        <div className="flex justify-between items-start">
          <div className="space-y-4 flex-1">
            {/* Title and Expand Icon */}
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-800 truncate pr-4">
                {list.title}
              </h2>
              <div className="flex items-center space-x-2">
                {isExpanded ? (
                  <ChevronUp size={20} className="text-blue-600" />
                ) : (
                  <ChevronDown size={20} className="text-gray-400" />
                )}
              </div>
            </div>

            {/* Stats Row */}
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-2">
                <div className="flex items-center justify-center w-8 h-8 bg-blue-100 rounded-full">
                  <School size={16} className="text-blue-600" />
                </div>
                <div>
                  <span className="text-lg font-semibold text-gray-800">
                    {list.colleges?.length || 0}
                  </span>
                  <span className="text-sm text-gray-500 ml-1">
                    {(list.colleges?.length || 0) === 1 ? 'College' : 'Colleges'}
                  </span>
                </div>
              </div>
              
              {list.userIds && list.userIds.length > 0 && (
                <div className="flex items-center space-x-2">
                  <div className="flex items-center justify-center w-8 h-8 bg-green-100 rounded-full">
                    <Users size={16} className="text-green-600" />
                  </div>
                  <div>
                    <span className="text-lg font-semibold text-gray-800">
                      {list.userIds.length}
                    </span>
                    <span className="text-sm text-gray-500 ml-1">
                      {list.userIds.length === 1 ? 'User' : 'Users'}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Metadata */}
            <div className="space-y-2">
              {/* {list.category && (
                <div className="flex items-center space-x-2">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                    {list.category}
                  </span>
                </div>
              )} */}
              
              {list.lastUpdatedBy && (
                <div className="flex items-center space-x-2 text-sm text-gray-500">
                  <User size={14} />
                  <span>Last updated by: {list.lastUpdatedBy}</span>
                </div>
              )}
              
              {list.createdAt && (
                <div className="flex items-center space-x-2 text-sm text-gray-500">
                  <Calendar size={14} />
                  <span>Created: {new Date(list.createdAt).toLocaleDateString()}</span>
                </div>
              )}
            </div>
          </div>
          
          {/* Action Buttons */}
          <div className="flex space-x-2 ml-4">
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleEdit(list);
              }}
              className="flex items-center justify-center w-10 h-10 text-blue-600 hover:text-blue-800 hover:bg-blue-100 rounded-full transition-all duration-200"
              title="Edit list"
            >
              <Edit size={18} />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleDelete(list.id);
              }}
              className="flex items-center justify-center w-10 h-10 text-red-500 hover:text-red-700 hover:bg-red-100 rounded-full transition-all duration-200"
              title="Delete list"
            >
              <Trash2 size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="bg-gray-50">
          <ListDetails list={list} />
        </div>
      )}
    </div>
  );
};

export default ListCard;