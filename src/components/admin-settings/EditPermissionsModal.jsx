import React, { useState, useEffect } from 'react';
import { X, Save } from 'lucide-react';
import { getAllPagePermissions, ANALYTICS_COMPONENTS } from '../../config/routes';
import {
  USER_CAPABILITIES,
  USER_CAPABILITY_KEYS,
  expandLegacyUserCapabilities,
} from '../../utils/checkPermission';

const ALL_PAGES = getAllPagePermissions();
const ALL_COMPONENTS = ANALYTICS_COMPONENTS.map(c => c.key);
const COMPONENT_LABELS = ANALYTICS_COMPONENTS.reduce((acc, c) => ({ ...acc, [c.key]: c.label }), {});

const EditPermissionsModal = ({ admin, onClose, onSave }) => {
  const [pages, setPages] = useState([]);
  const [components, setComponents] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setPages(expandLegacyUserCapabilities(admin.pages || []));
    setComponents(admin.components || []);
  }, [admin]);

  const hasUsersAccess = pages.includes('users');

  const togglePage = (page) => {
    setPages(prev => {
      let next = prev.includes(page)
        ? prev.filter(p => p !== page)
        : [...prev, page];

      // Granting Users access → enable all user capabilities by default
      if (page === 'users' && next.includes('users')) {
        for (const key of USER_CAPABILITY_KEYS) {
          if (!next.includes(key)) next.push(key);
        }
      }

      // Revoking Users access → drop user capability flags
      if (page === 'users' && !next.includes('users')) {
        next = next.filter(p => !USER_CAPABILITY_KEYS.includes(p) && p !== 'edit-users');
      }

      return next;
    });
  };

  const toggleCapability = (key) => {
    setPages(prev =>
      prev.includes(key)
        ? prev.filter(p => p !== key)
        : [...prev, key]
    );
  };

  const toggleComponent = (component) => {
    setComponents(prev =>
      prev.includes(component)
        ? prev.filter(c => c !== component)
        : [...prev, component]
    );
  };

  const selectAllPages = () => {
    const keys = ALL_PAGES.map(p => p.key);
    const withCaps = [...new Set([...keys, ...USER_CAPABILITY_KEYS])];
    setPages(withCaps);
  };
  const deselectAllPages = () => setPages([]);
  const selectAllComponents = () => setComponents([...ALL_COMPONENTS]);
  const deselectAllComponents = () => setComponents([]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      // Keep edit-users in sync with users-write for older checks
      let pagesToSave = [...pages];
      if (pagesToSave.includes('users-write') && !pagesToSave.includes('edit-users')) {
        pagesToSave.push('edit-users');
      }
      if (!pagesToSave.includes('users-write')) {
        pagesToSave = pagesToSave.filter(p => p !== 'edit-users');
      }

      await onSave(admin.id, { pages: pagesToSave, components });
      onClose();
    } catch (error) {
      console.error('Error saving permissions:', error);
      alert('Failed to save permissions');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 flex justify-between items-center">
          <div>
            <h3 className="text-xl font-semibold text-gray-900">Edit Permissions</h3>
            <p className="text-sm text-gray-500 mt-1">{admin.email}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
          <div className="p-6 space-y-8">
            {/* Pages Section */}
            <div>
              <div className="flex justify-between items-center mb-4">
                <h4 className="text-lg font-medium text-gray-900">Page Access</h4>
                <div className="space-x-2 text-sm">
                  <button
                    type="button"
                    onClick={selectAllPages}
                    className="text-blue-600 hover:text-blue-700 underline"
                  >
                    Select All
                  </button>
                  <button
                    type="button"
                    onClick={deselectAllPages}
                    className="text-gray-600 hover:text-gray-700 underline"
                  >
                    Deselect All
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-1 gap-3">
                {ALL_PAGES.map(page => (
                  <label
                    key={page.key}
                    className="flex items-start space-x-3 bg-gray-50 px-4 py-3 rounded-md hover:bg-gray-100 cursor-pointer transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={pages.includes(page.key)}
                      onChange={() => togglePage(page.key)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 h-4 w-4 mt-1"
                    />
                    <div className="flex-1">
                      <div className="text-sm font-medium text-gray-900">{page.label}</div>
                      <div className="text-xs text-gray-500 mt-0.5">{page.description}</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Users capabilities — only when Users page is granted */}
            {hasUsersAccess && (
              <div>
                <div className="mb-4">
                  <h4 className="text-lg font-medium text-gray-900">Users / Premium Users capabilities</h4>
                  <p className="text-sm text-gray-500 mt-1">
                    Uncheck write access for read-only. Control whether this admin can see steps and payment info, and whether they can modify user lists.
                  </p>
                </div>
                <div className="grid grid-cols-1 gap-3">
                  {USER_CAPABILITIES.map(cap => (
                    <label
                      key={cap.key}
                      className="flex items-start space-x-3 bg-amber-50 px-4 py-3 rounded-md hover:bg-amber-100 cursor-pointer transition-colors border border-amber-100"
                    >
                      <input
                        type="checkbox"
                        checked={pages.includes(cap.key)}
                        onChange={() => toggleCapability(cap.key)}
                        className="rounded border-gray-300 text-amber-600 focus:ring-amber-500 h-4 w-4 mt-1"
                      />
                      <div className="flex-1">
                        <div className="text-sm font-medium text-gray-900">{cap.label}</div>
                        <div className="text-xs text-gray-500 mt-0.5">{cap.description}</div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Components Section */}
            <div>
              <div className="flex justify-between items-center mb-4">
                <h4 className="text-lg font-medium text-gray-900">Analytics Dashboard Components</h4>
                <div className="space-x-2 text-sm">
                  <button
                    type="button"
                    onClick={selectAllComponents}
                    className="text-blue-600 hover:text-blue-700 underline"
                  >
                    Select All
                  </button>
                  <button
                    type="button"
                    onClick={deselectAllComponents}
                    className="text-gray-600 hover:text-gray-700 underline"
                  >
                    Deselect All
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {ALL_COMPONENTS.map(component => (
                  <label
                    key={component}
                    className="flex items-center space-x-3 bg-green-50 px-4 py-3 rounded-md hover:bg-green-100 cursor-pointer transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={components.includes(component)}
                      onChange={() => toggleComponent(component)}
                      className="rounded border-gray-300 text-green-600 focus:ring-green-500 h-4 w-4"
                    />
                    <span className="text-sm font-medium text-gray-700">
                      {COMPONENT_LABELS[component]}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-gray-200 bg-gray-50 flex justify-between items-center">
            <div className="text-sm text-gray-500">
              {pages.filter(p => !USER_CAPABILITY_KEYS.includes(p) && p !== 'edit-users').length} pages
              {' • '}
              {USER_CAPABILITY_KEYS.filter(k => pages.includes(k)).length} user caps
              {' • '}
              {components.length} components
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                {loading ? 'Saving...' : 'Save Permissions'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditPermissionsModal;
