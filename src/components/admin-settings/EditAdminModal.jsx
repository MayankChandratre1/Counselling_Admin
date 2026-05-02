import React from 'react';

const EditAdminModal = ({ admin, onClose, onSubmit }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
      <div className="bg-white rounded-lg p-6 max-w-md w-full">
        <h3 className="text-lg font-medium mb-4">Edit Admin</h3>
        <form onSubmit={onSubmit}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Email</label>
              <input
                type="email"
                name="email"
                defaultValue={admin.email}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Role</label>
              <select
                name="role"
                defaultValue={admin.role || 'admin'}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              >
                <option value="admin">admin</option>
                <option value="security-admin">security-admin</option>
                <option value="super-admin">super-admin</option>
                <option value="editor">editor</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <input
                id="isSecurityMod"
                name="isSecurityMod"
                type="checkbox"
                defaultChecked={Boolean(admin.isSecurityMod)}
              />
              <label htmlFor="isSecurityMod" className="text-sm font-medium text-gray-700">
                Enable Security Mode
              </label>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                New Password (leave empty to keep unchanged)
              </label>
              <input
                type="password"
                name="password"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
              >
                Save Changes
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditAdminModal;
