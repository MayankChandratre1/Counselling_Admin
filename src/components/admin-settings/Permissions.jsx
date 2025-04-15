import React, { useState } from 'react';
import { Bug, Save, Edit2, X, Plus } from 'lucide-react';
import axiosInstance from '../../utils/axios';

const ALL_PAGES = [
  'home',
  'users',
  'colleges',
  'lists',
  'forms',
  'change-password',
  'registrationform',
  'add-user',
  'cutoff',
  'admin-settings'
];

const Permissions = ({ permissions }) => {
  const [editingRole, setEditingRole] = useState(null);
  const [loading, setLoading] = useState(false);
  const [editedPages, setEditedPages] = useState([]);

  const handleEdit = (role) => {
    setEditingRole(role);
    setEditedPages(permissions.find(p => p.role === role)?.pages || []);
  };

  const handleSave = async (role) => {
    try {
      setLoading(true);
      await axiosInstance.post(`/api/admin/permissions/${role}`, {
        pages: editedPages
      });
      setEditingRole(null);
      // Refresh permissions (you might want to lift this up to parent)
      window.location.reload();
    } catch (error) {
      console.error('Error saving permissions:', error);
      alert('Failed to save permissions');
    } finally {
      setLoading(false);
    }
  };

  const togglePage = (page) => {
    setEditedPages(prev => 
      prev.includes(page) 
        ? prev.filter(p => p !== page)
        : [...prev, page]
    );
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Roles & Permissions</h2>
        <button
          onClick={() => console.log('Permissions:', permissions)}
          className="inline-flex items-center px-3 py-1.5 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
        >
          <Bug className="w-4 h-4 mr-2" />
          Debug
        </button>
      </div>

      <div className="space-y-6">
        {permissions?.map((roleData) => (
          <div key={roleData.role} className="border rounded-lg p-4">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-lg font-medium capitalize">{roleData.role}</h3>
              {editingRole === roleData.role ? (
                <div className="space-x-2">
                  <button
                    onClick={() => handleSave(roleData.role)}
                    disabled={loading}
                    className="inline-flex items-center px-3 py-1.5 border border-green-500 text-green-500 rounded-md hover:bg-green-50"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    Save
                  </button>
                  <button
                    onClick={() => setEditingRole(null)}
                    className="inline-flex items-center px-3 py-1.5 border border-gray-300 rounded-md hover:bg-gray-50"
                  >
                    <X className="w-4 h-4 mr-2" />
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => handleEdit(roleData.role)}
                  className="inline-flex items-center px-3 py-1.5 border border-blue-500 text-blue-500 rounded-md hover:bg-blue-50"
                >
                  <Edit2 className="w-4 h-4 mr-2" />
                  Edit
                </button>
              )}
            </div>

            <div className="flex items-center flex-wrap gap-2">
              {editingRole === roleData.role ? (
                ALL_PAGES.map(page => (
                  <label key={page} className="flex items-center space-x-2 mx-4">
                    <input
                      type="checkbox"
                      checked={editedPages.includes(page)}
                      onChange={() => togglePage(page)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm">{page}</span>
                  </label>
                ))
              ) : (
                roleData.pages.map(page => (
                  <span key={page} className="inline-flex items-center px-2.5 py-1.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 w-fit">
                    {page}
                  </span>
                ))
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Permissions;
