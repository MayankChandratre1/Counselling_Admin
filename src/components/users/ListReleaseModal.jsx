import React, { useState } from 'react';
import { X } from 'lucide-react';
import axios from 'axios';
import axiosInstance from '../../utils/axios';

const API_URL = import.meta.env.VITE_REACT_APP_ADMIN_API_URL;

const ListReleaseModal = ({ 
  showModal, 
  onClose, 
  selectedUser,
  onListReleased 
}) => {
  const [loading, setLoading] = useState(false);

  const getAuthAxios = () => {
    const token = localStorage.getItem('adminToken');
    return axios.create({
      baseURL: API_URL,
      headers: { token }
    });
  };

  const handleReleaseClick = (list) => {
    const confirmed = window.confirm(
      `Are you sure you want to release the list "${list.title}"?\n\n` +
      `This action will make the list available for other users and remove it from ${selectedUser?.name}'s created lists.`
    );

    if (confirmed) {
      handleReleaseConfirm(list.id);
    }
  };

  const handleReleaseConfirm = async (listId) => {
    try {
      setLoading(true);
      const authAxios = getAuthAxios();
      
      await axiosInstance.post(`/api/admin/user/${selectedUser.id}/release-list`, {
        listId
      });

      // Call the callback to update the parent component
      if (onListReleased) {
        onListReleased(listId);
      }

      alert('List released successfully');
    } catch (error) {
      console.error('Error releasing list:', error);
      alert('Failed to release list. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!showModal) return null;

  const createdLists = selectedUser?.createdList || [];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-md p-6 max-h-[80vh] overflow-hidden">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Release Created Lists</h2>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X size={20} />
          </button>
        </div>

        <div className="mb-4">
          <p className="text-sm text-gray-600">
            User: <span className="font-medium">{selectedUser?.name}</span>
          </p>
          <p className="text-sm text-gray-500 mt-1">
            Release lists created by this user to make them available for other users.
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-32">
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : createdLists.length > 0 ? (
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {createdLists.map(list => (
              <div 
                key={list.id}
                className="p-3 border rounded-md bg-gray-50 hover:bg-gray-100 transition-colors"
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900">{list.title}</h3>
                    {list.description && (
                      <p className="text-sm text-gray-500 mt-1">{list.description}</p>
                    )}
                    <div className="flex items-center space-x-2 mt-2">
                      <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                        {list.colleges?.length || 0} colleges
                      </span>
                      <span className="text-sm text-indigo-600 bg-indigo-50 px-2 py-1 rounded-full">
                        Created List
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => handleReleaseClick(list)}
                    disabled={loading}
                    className="ml-3 px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700 disabled:bg-red-400 transition-colors"
                  >
                    Release
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-6 text-gray-500">
            <div className="mb-2">📝</div>
            <p>No created lists found for this user.</p>
          </div>
        )}

        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default ListReleaseModal;
            