import React, { useState } from 'react';
import { Bug, Save, Edit2, X, Plus } from 'lucide-react';
import axiosInstance from '../../utils/axios';
import { getAllPagePermissions, ANALYTICS_COMPONENTS } from '../../config/routes';

const ALL_PAGES = getAllPagePermissions();
const ALL_COMPONENTS = ANALYTICS_COMPONENTS.map(c => c.key);
const COMPONENT_LABELS = ANALYTICS_COMPONENTS.reduce((acc, c) => ({ ...acc, [c.key]: c.label }), {});

const Permissions = ({ permissions }) => {
  const [editingRole, setEditingRole] = useState(null);
  const [loading, setLoading] = useState(false);
  const [editedPages, setEditedPages] = useState([]);
  const [editedComponents, setEditedComponents] = useState([]);

  const handleEdit = (role) => {
    setEditingRole(role);
    const roleData = permissions.find(p => p.role === role);
    setEditedPages(roleData?.pages || []);
    setEditedComponents(roleData?.components || []);
  };

  const handleSave = async (role) => {
    try {
      setLoading(true);
      await axiosInstance.post(`/api/admin/permissions/${role}`, {
        pages: editedPages,
        components: editedComponents
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

  const toggleComponent = (component) => {
    setEditedComponents(prev => 
      prev.includes(component) 
        ? prev.filter(c => c !== component)
        : [...prev, component]
    );
  };

  const selectAllPages = () => {
    setEditedPages(ALL_PAGES.map(p => p.key));
  };

  const deselectAllPages = () => {
    setEditedPages([]);
  };

  const selectAllComponents = () => {
    setEditedComponents([...ALL_COMPONENTS]);
  };

  const deselectAllComponents = () => {
    setEditedComponents([]);
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
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium capitalize">{roleData.role}</h3>
              {editingRole === roleData.role ? (
                <div className="space-x-2">
                  <button
                    onClick={() => handleSave(roleData.role)}
                    disabled={loading}
                    className="inline-flex items-center px-3 py-1.5 border border-green-500 text-green-500 rounded-md hover:bg-green-50 disabled:opacity-50"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    {loading ? 'Saving...' : 'Save'}
                  </button>
                  <button
                    onClick={() => setEditingRole(null)}
                    disabled={loading}
                    className="inline-flex items-center px-3 py-1.5 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
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

            {/* Pages Section */}
            <div className="mb-6">
              <div className="flex justify-between items-center mb-3">
                <h4 className="text-md font-medium text-gray-700">Pages Access</h4>
                {editingRole === roleData.role && (
                  <div className="space-x-2 text-sm">
                    <button
                      onClick={selectAllPages}
                      className="text-blue-600 hover:text-blue-700 underline"
                    >
                      Select All
                    </button>
                    <button
                      onClick={deselectAllPages}
                      className="text-gray-600 hover:text-gray-700 underline"
                    >
                      Deselect All
                    </button>
                  </div>
                )}
              </div>
              <div className="flex items-center flex-wrap gap-2">
                {editingRole === roleData.role ? (
                  ALL_PAGES.map(page => (
                    <label key={page.key} className="flex items-center space-x-2 bg-gray-50 px-3 py-2 rounded-md hover:bg-gray-100 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={editedPages.includes(page.key)}
                        onChange={() => togglePage(page.key)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <div className="flex flex-col">
                        <span className="text-sm font-medium">{page.label}</span>
                        <span className="text-xs text-gray-500">{page.description}</span>
                      </div>
                    </label>
                  ))
                ) : (
                  roleData.pages && roleData.pages.length > 0 ? (
                    roleData.pages.map(pageKey => {
                      const page = ALL_PAGES.find(p => p.key === pageKey);
                      return (
                        <span key={pageKey} className="inline-flex items-center px-3 py-1.5 rounded-md text-sm font-medium bg-blue-100 text-blue-800">
                          {page?.label || pageKey}
                        </span>
                      );
                    })
                  ) : (
                    <span className="text-sm text-gray-500 italic">No pages assigned</span>
                  )
                )}
              </div>
            </div>

            {/* Components Section */}
            <div>
              <div className="flex justify-between items-center mb-3">
                <h4 className="text-md font-medium text-gray-700">Analytics Components</h4>
                {editingRole === roleData.role && (
                  <div className="space-x-2 text-sm">
                    <button
                      onClick={selectAllComponents}
                      className="text-blue-600 hover:text-blue-700 underline"
                    >
                      Select All
                    </button>
                    <button
                      onClick={deselectAllComponents}
                      className="text-gray-600 hover:text-gray-700 underline"
                    >
                      Deselect All
                    </button>
                  </div>
                )}
              </div>
              <div className="flex items-center flex-wrap gap-2">
                {editingRole === roleData.role ? (
                  ALL_COMPONENTS.map(component => (
                    <label key={component} className="flex items-center space-x-2 bg-gray-50 px-3 py-2 rounded-md hover:bg-gray-100 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={editedComponents.includes(component)}
                        onChange={() => toggleComponent(component)}
                        className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                      />
                      <span className="text-sm">{COMPONENT_LABELS[component]}</span>
                    </label>
                  ))
                ) : (
                  roleData.components && roleData.components.length > 0 ? (
                    roleData.components.map(component => (
                      <span key={component} className="inline-flex items-center px-3 py-1.5 rounded-md text-sm font-medium bg-green-100 text-green-800">
                        {COMPONENT_LABELS[component] || component}
                      </span>
                    ))
                  ) : (
                    <span className="text-sm text-gray-500 italic">No components assigned</span>
                  )
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Permissions;
