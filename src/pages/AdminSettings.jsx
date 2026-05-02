import React, { useState, useEffect } from 'react';
import { ArrowLeft, Menu, Plus, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import axiosInstance from '../utils/axios';
import Navbar from '../components/Navbar';
import AdminList from '../components/admin-settings/AdminList';
import EditAdminModal from '../components/admin-settings/EditAdminModal';
import EditPermissionsModal from '../components/admin-settings/EditPermissionsModal';
import Permissions from '../components/admin-settings/Permissions';
import AddAdminForm from '../components/admin-settings/AddAdminForm';

const AdminSettings = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [admins, setAdmins] = useState([]);
  const [permissions, setPermissions] = useState(null);
  const [editModal, setEditModal] = useState({
    isOpen: false,
    admin: null
  });
  const [permissionsModal, setPermissionsModal] = useState({
    isOpen: false,
    admin: null
  });

  // Fetch admins and permissions
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [adminsRes, permsRes] = await Promise.all([
          axiosInstance.get('/api/admin/all-admins'),
          axiosInstance.get('/api/admin/permissions')
        ]);
        setAdmins(adminsRes.data);
        setPermissions(permsRes.data);
      } catch (error) {
        console.error('Error fetching data:', error);
        alert('Failed to fetch data');
      }
    };
    fetchData();
  }, []);

  const handleAdminAdded = async () => {
    try {
      const response = await axiosInstance.get('/api/admin/all-admins');
      setAdmins(response.data);
      setShowAddForm(false); // Close the form after successful addition
    } catch (error) {
      console.error('Error fetching admins:', error);
    }
  };

  const handleEditAdmin = async (adminId, updatedData) => {
    const email = (updatedData.email || '').trim().toLowerCase();
    const role = updatedData.role;
    const isSecurityMod = updatedData.isSecurityMod === true || updatedData.isSecurityMod === 'true';
    const password = typeof updatedData.password === 'string' ? updatedData.password.trim() : '';
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(email)) {
      alert('Please enter a valid email address');
      return;
    }

    if (password && password.length < 6) {
      alert('Password must be at least 6 characters long');
      return;
    }

    try {
      await axiosInstance.put(`/api/admin/update-admin/${adminId}`, {
        ...updatedData,
        email,
        role,
        isSecurityMod,
        password: password || undefined
      });
      // Refresh admin list
      const response = await axiosInstance.get('/api/admin/all-admins');
      setAdmins(response.data);
      setEditModal({ isOpen: false, admin: null });
    } catch (error) {
      console.error('Error updating admin:', error);
      alert('Failed to update admin');
    }
  };

  const handleDeleteAdmin = async (adminId) => {
    if (!window.confirm('Are you sure you want to delete this admin?')) return;
    
    try {
      await axiosInstance.delete(`/api/admin/delete-admin/${adminId}`);
      setAdmins(admins.filter(admin => admin.id !== adminId));
    } catch (error) {
      console.error('Error deleting admin:', error);
      alert('Failed to delete admin');
    }
  };

  const handleEditPermissions = async (adminId, permissionsData) => {
    try {
      await axiosInstance.put(`/api/admin/update-admin/${adminId}`, permissionsData);
      // Refresh admin list
      const response = await axiosInstance.get('/api/admin/all-admins');
      setAdmins(response.data);
    } catch (error) {
      console.error('Error updating permissions:', error);
      throw error;
    }
  };

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Mobile menu button */}
      <button
        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        className="lg:hidden fixed top-4 left-4 z-20 p-2 rounded-md bg-gray-800 text-white"
      >
        <Menu size={24} />
      </button>

      {/* Sidebar */}
      <div className={`
        fixed inset-y-0 left-0 transform z-10
        lg:relative lg:translate-x-0 transition duration-200 ease-in-out
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <Navbar onClose={() => setIsSidebarOpen(false)} />
      </div>

      {/* Main content */}
      <div className="flex-1 overflow-auto p-4">
        <div className="max-w-4xl mx-auto">
          <div className="mb-6">
            <Link to="/home" className="inline-flex items-center text-blue-600 hover:text-blue-700">
              <ArrowLeft className="w-5 h-5 mr-2" />
              Back 
            </Link>
          </div>

          <div className="space-y-6">
            <div className="bg-white p-4 rounded-lg shadow">
              <button
                onClick={() => setShowAddForm(!showAddForm)}
                className="flex items-center gap-2 text-blue-600 hover:text-blue-700"
              >
                {showAddForm ? <X size={20} /> : <Plus size={20} />}
                {showAddForm ? 'Cancel' : 'Add Admin'}
              </button>
              
              {showAddForm && <AddAdminForm onAdminAdded={handleAdminAdded} />}
            </div>

            <AdminList 
              admins={admins} 
              onEdit={(admin) => setEditModal({ isOpen: true, admin })}
              onDelete={handleDeleteAdmin}
              onEditPermissions={(admin) => setPermissionsModal({ isOpen: true, admin })}
            />
            <Permissions permissions={permissions} />
          </div>

          {editModal.isOpen && (
            <EditAdminModal
              admin={editModal.admin}
              onClose={() => setEditModal({ isOpen: false, admin: null })}
              onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.target);
                handleEditAdmin(editModal.admin.id, {
                  email: formData.get('email'),
                  role: formData.get('role'),
                  isSecurityMod: formData.get('isSecurityMod') === 'on',
                  password: formData.get('password') || undefined
                });
              }}
            />
          )}

          {permissionsModal.isOpen && (
            <EditPermissionsModal
              admin={permissionsModal.admin}
              onClose={() => setPermissionsModal({ isOpen: false, admin: null })}
              onSave={handleEditPermissions}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminSettings;