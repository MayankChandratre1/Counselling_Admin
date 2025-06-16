import React from 'react';
import { useUsers } from '../../contexts/UsersContext';

const ListSelectionModal = ({ 
  showModal, 
  onClose, 
  loading, 
  availableLists, 
  selectedUserId,
  onSelectList 
}) => {
  if (!showModal) return null;
  const {users} = useUsers();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-md p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Select List</h2>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>
        {loading ? (
          <div className="flex justify-center items-center h-32">
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : availableLists.length > 0 ? (
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {availableLists.map(list => {
              const isSelected2 = list.userIds && list.userIds.includes(selectedUserId);
              const selectedUser = users.find(user => user.id === selectedUserId.id);
              const isSelected = selectedUser?.lists?.map(l => l.listId).includes(list.id) || isSelected2;
              console.log(selectedUser);
              
              return (
                <div 
                  key={list.id}
                  className={`p-3 border rounded-md hover:bg-gray-50 cursor-pointer flex justify-between items-center ${
                    isSelected ? 'border-green-500 bg-green-50' : ''
                  }`}
                  onClick={() => !isSelected && onSelectList(list.id)}
                >
                  <div>
                    <h3 className="font-medium">{list.title}</h3>
                    {list.description && (
                      <p className="text-sm text-gray-500">{list.description}</p>
                    )}
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                        {list.colleges?.length || 0} colleges
                      </span>
                      {list.userIds && list.userIds.length > 0 && (
                        <span className="text-sm text-blue-500 bg-blue-50 px-2 py-1 rounded-full">
                          {list.userIds.length} users
                        </span>
                      )}
                    </div>
                  </div>
                  {isSelected && (
                    <span className="ml-2 px-2 py-0.5 bg-green-100 text-green-800 text-xs rounded-full">
                      Selected
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-6 text-gray-500">
            No lists available. Create a list first.
          </div>
        )}
      </div>
    </div>
  );
};

export default ListSelectionModal;
