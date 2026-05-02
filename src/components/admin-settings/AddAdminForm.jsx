import React, { useState } from 'react';
import axiosInstance from '../../utils/axios';

const ROLES = ['admin', 'super-admin', 'security-admin'];

const AddAdminForm = ({ onAdminAdded }) => {
  const [formData, setFormData] = useState({
    email: '',
    password: 'admin123',
    role: 'admin',
    isSecurityMod: false
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axiosInstance.post('/api/admin/add-admin', formData);
      setFormData({ email: '', password: 'admin123', role: 'admin', isSecurityMod: false });
      onAdminAdded();
    } catch (error) {
      console.error('Error adding admin:', error);
      alert('Failed to add admin');
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow mb-6">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Email</label>
          <input
            type="email"
            value={formData.email}
            onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
            className="w-full p-2 border rounded"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Password</label>
          <input
            type="text"
            value={formData.password}
            onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
            className="w-full p-2 border rounded"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Role</label>
          <select
            value={formData.role}
            onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value }))}
            className="w-full p-2 border rounded"
          >
            {ROLES.map(role => (
              <option key={role} value={role}>{role}</option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <input
            id="isSecurityMod"
            type="checkbox"
            checked={formData.isSecurityMod}
            onChange={(e) => setFormData(prev => ({ ...prev, isSecurityMod: e.target.checked }))}
          />
          <label htmlFor="isSecurityMod" className="text-sm font-medium">Enable Security Mode</label>
        </div>
        <button
          type="submit"
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Add Admin
        </button>
      </form>
    </div>
  );
};

export default AddAdminForm;
