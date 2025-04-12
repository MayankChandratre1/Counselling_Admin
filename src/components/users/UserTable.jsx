import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';

const UsersTable = ({
  users,
  loading,
  error,
  isSearchMode,
  currentPage,
  pageSize,
  hasMore,
  onPageChange,
  onPageSizeChange,
  onAddToList,
  onViewLists,
  onEdit,
  onDelete
}) => {
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    userId: null,
    userName: '',
    listName: '',
    onConfirm: null
  });

  // Handler for initial add to list click
  const handleAddToList = (userId, userName) => {
    // This will be called by the list selection modal with the selected list
    return (listName, confirmCallback) => {
      setConfirmModal({
        isOpen: true,
        userId,
        userName,
        listName,
        onConfirm: () => {
          confirmCallback();
          setConfirmModal(prev => ({ ...prev, isOpen: false }));
        }
      });
    };
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-100 text-red-700 p-4 rounded-md mb-4">
        {error}
      </div>
    );
  }

  if (users.length === 0) {
    return (
      <div className="text-center py-12 bg-gray-50 rounded-lg">
        <div className="flex flex-col items-center justify-center">
          <div className="bg-gray-100 p-4 rounded-full mb-4">
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              className="h-12 w-12 text-gray-400" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <p className="text-gray-500 text-lg">
            {isSearchMode ? "No users found matching your search criteria." : "No users available."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      <div className="overflow-x-auto -mx-4 sm:-mx-6">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Email
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Phone
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Lists
              </th>
              <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {users.map(user => (
              <tr key={user.id} className="hover:bg-gray-50 transition-colors duration-200">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">
                    {user.name}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-500">
                    {user.email}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-500">
                    {user.phone || "—"}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {user.premium ? (
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                      Premium
                    </span>
                  ) : (
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
                      Regular
                    </span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                {user.lists && user.lists.length > 0 ? (
                    <div className="flex flex-wrap gap-1">
                        {user.lists.slice(0, 2).map((list, idx) => (
                            <span key={idx} className="px-2 py-1 text-xs leading-tight rounded-full bg-indigo-100 text-indigo-800">
                                {list.title}
                            </span>
                        ))}
                        {user.lists.length > 2 && (
                            <span className="px-2 py-1 text-xs leading-tight rounded-full bg-gray-100 text-gray-600">
                                +{user.lists.length - 2} more
                            </span>
                        )}
                    </div>
                ) : (
                    <span className="text-xs text-gray-500">No lists assigned</span>
                )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button 
                    onClick={() => onAddToList(user.id, handleAddToList(user.id, user.name))}
                    className="text-green-600 hover:text-green-900 mr-4 transition-colors duration-200"
                  >
                    Add to List
                  </button>
                  <button 
                    onClick={() => onViewLists(user.id, user.name)}
                    className="text-blue-600 hover:text-blue-900 mr-4 transition-colors duration-200"
                  >
                    View Lists
                  </button>
                  <button 
                    onClick={() => onEdit(user)}
                    className="text-blue-600 hover:text-blue-900 mr-4 transition-colors duration-200"
                  >
                    Edit
                  </button>
                  <button 
                    onClick={() => onDelete(user.id)}
                    className="text-red-600 hover:text-red-900 transition-colors duration-200"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {users.length > 0 && (
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mt-6">
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-700">
              Page {currentPage}
            </span>
            <select 
              value={pageSize}
              onChange={(e) => onPageSizeChange(Number(e.target.value))}
              className="border rounded-md px-2 py-1 text-sm"
            >
              <option value="5">5 per page</option>
              <option value="10">10 per page</option>
              <option value="25">25 per page</option>
              <option value="50">50 per page</option>
            </select>
          </div>
          
          <div className="flex space-x-2">
            <button
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className={`px-3 py-1 rounded-md ${
                currentPage === 1
                  ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                  : 'bg-gray-800 text-white hover:bg-gray-700'
              }`}
            >
              <ChevronLeft size={16} />
            </button>
            <button
              onClick={() => onPageChange(currentPage + 1)}
              disabled={!hasMore}
              className={`px-3 py-1 rounded-md ${
                !hasMore
                  ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                  : 'bg-gray-800 text-white hover:bg-gray-700'
              }`}
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {confirmModal.isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">Confirm List Assignment</h3>
              <button
                onClick={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
                className="text-gray-400 hover:text-gray-500 transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            <p className="text-gray-600 mb-6">
              Do you want to assign <span className="font-medium">{confirmModal.listName}</span> to <span className="font-medium">{confirmModal.userName}</span>?
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmModal.onConfirm}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UsersTable;
