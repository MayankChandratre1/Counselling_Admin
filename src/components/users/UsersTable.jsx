import React from 'react';
import { useNavigate } from 'react-router-dom';

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
  onDelete,
  onViewDetails // Add this prop
}) => {
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="flex justify-center items-center h-32">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (users.length === 0) {
    return (
      <div className="text-center py-12 bg-gray-50 rounded-lg">
        <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
        </svg>
        <p className="mt-2 text-gray-500 text-lg">
          No users found. {!isSearchMode && "Use the search function to find users."}
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="overflow-x-auto -mx-4 sm:-mx-6">
        <table className="min-w-full divide-y divide-gray-200">
          <thead>
            <tr className="bg-gray-50">
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Phone
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Premium
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Assigned Lists
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
                  <div className="text-xs text-gray-500">
                    {user.email || 'No email'}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                    {user.phone}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {user.isPremium ? (
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                      Premium
                    </span>
                  ) : (
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
                      Standard
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
                    onClick={() => navigate(`/users/${user.id}`)}
                    className="text-blue-600 hover:text-blue-900 mr-4 transition-colors duration-200"
                  >
                    View Details
                  </button>
                  <button 
                    onClick={() => onAddToList(user.id)}
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
              disabled={currentPage === 1}
              onClick={() => onPageChange(currentPage - 1)}
              className={`px-3 py-1 rounded-md ${currentPage === 1 ? 'bg-gray-200 text-gray-500 cursor-not-allowed' : 'bg-gray-800 text-white hover:bg-gray-700'}`}
            >
              Previous
            </button>
            <button 
              disabled={!hasMore}
              onClick={() => onPageChange(currentPage + 1)}
              className={`px-3 py-1 rounded-md ${!hasMore ? 'bg-gray-200 text-gray-500 cursor-not-allowed' : 'bg-gray-800 text-white hover:bg-gray-700'}`}
            >
              Next
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default UsersTable;
