import React from 'react';
import { Edit, Trash2, School, Users } from 'lucide-react';
import ListDetails from './ListDetails';

const ListCard = ({ list, expandedListId, handleListClick, handleEdit, handleDelete }) => {
  return (
    <div className="bg-white rounded-lg shadow-md transition-all hover:shadow-lg">
      <div 
        className={`p-6 cursor-pointer ${
          expandedListId === list.id ? 'border-b border-gray-200' : ''
        }`}
        onClick={() => handleListClick(list.id)}
      >
        <div className="flex justify-between items-start">
          <div className="space-y-3 flex-1">
            <h2 className="text-xl font-semibold text-gray-800">{list.title}</h2>
            <div className="flex items-center space-x-4">
              <div className="flex items-center text-blue-600">
                <School size={16} className="mr-1.5" />
                <span className="text-sm font-medium">{list.colleges?.length || 0}</span>
              </div>
              {list.userIds && list.userIds.length > 0 && (
                <div className="flex items-center text-green-600">
                  <Users size={16} className="mr-1.5" />
                  <span className="text-sm font-medium">{list.userIds.length}</span>
                </div>
              )}
            </div>
          </div>
          
          <div className="flex space-x-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleEdit(list);
              }}
              className="text-blue-600 hover:text-blue-800 hover:bg-blue-50 p-2 rounded-full transition-colors"
              title="Edit list"
            >
              <Edit size={18} />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleDelete(list.id);
              }}
              className="text-red-500 hover:text-red-700 hover:bg-red-50 p-2 rounded-full transition-colors"
              title="Delete list"
            >
              <Trash2 size={18} />
            </button>
          </div>
        </div>
      </div>

      {expandedListId === list.id && (
        <div className="p-6">
          <ListDetails list={list} />
        </div>
      )}
    </div>
  );
};

export default ListCard;