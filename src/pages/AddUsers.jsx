import React, { useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import axiosInstance from '../utils/axios';

const AddUsers = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    // Basic Information
    name: '',
    phone: '',
    batch: '',
    isPremium: false,
    
    // Counselling Data
    counsellingData: {
      fullName: '',
      dob: '',
      mobile: '',
      email: '',
      city: '',
      state: '',
      boardMarks: '',
      boardType: '',
      jeeMarks: '',
      cetMarks: '',
      preferredField: '',
      cetSeatNumber: '',
      jeeSeatNumber: '',
      preferredLocations: '',
      budget: '',
      termsAccepted: false
    }
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (name.includes('.')) {
      // Handle nested counsellingData fields
      const [parent, child] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: type === 'checkbox' ? checked : value
        }
      }));
    } else {
      // Handle top-level fields
      setFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      
      // Generate a random password for the user
      const password = Math.random().toString(36).slice(-8);
      
      const userData = {
        ...formData,
        counsellingData: {
          ...formData.counsellingData,
          password, // Add the generated password
          mobile: formData.phone // Sync phone number
        },
        password, // Add password to root level
        hasLoggedIn: false,
        createdAt: new Date().toISOString(),
        shouldAskForPasswordChange: true,
      };

      await axiosInstance.post('/api/admin/users', userData);
      navigate('/users');
    } catch (error) {
      console.error('Error adding user:', error);
      alert('Failed to add user');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <Link to="/users" className="inline-flex items-center text-blue-600 hover:text-blue-700">
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back to Users
          </Link>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">Add New User</h1>

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Basic Information */}
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-800">Basic Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Name *</label>
                  <input
                    type="text"
                    name="name"
                    required
                    value={formData.name}
                    onChange={handleChange}
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Phone *</label>
                  <input
                    type="tel"
                    name="phone"
                    required
                    value={formData.phone}
                    onChange={handleChange}
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Batch</label>
                  <select
                    name="batch"
                    value={formData.batch}
                    onChange={handleChange}
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                  >
                    <option value="">Select Batch</option>
                    <option value="online">Online</option>
                    <option value="offline">Offline</option>
                  </select>
                </div>
                <div className="flex items-center">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      name="isPremium"
                      checked={formData.isPremium}
                      onChange={handleChange}
                      className="rounded border-gray-300 text-blue-600 mr-2"
                    />
                    <span className="text-sm font-medium text-gray-700">Premium User</span>
                  </label>
                </div>
              </div>
            </div>

            {/* Counselling Data */}
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-800">Counselling Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Date of Birth</label>
                  <input
                    type="date"
                    name="counsellingData.dob"
                    value={formData.counsellingData.dob}
                    onChange={handleChange}
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Email</label>
                  <input
                    type="email"
                    name="counsellingData.email"
                    value={formData.counsellingData.email}
                    onChange={handleChange}
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">City</label>
                  <input
                    type="text"
                    name="counsellingData.city"
                    value={formData.counsellingData.city}
                    onChange={handleChange}
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">State</label>
                  <input
                    type="text"
                    name="counsellingData.state"
                    value={formData.counsellingData.state}
                    onChange={handleChange}
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Board Marks</label>
                  <input
                    type="text"
                    name="counsellingData.boardMarks"
                    value={formData.counsellingData.boardMarks}
                    onChange={handleChange}
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Board Type</label>
                  <select
                    name="counsellingData.boardType"
                    value={formData.counsellingData.boardType}
                    onChange={handleChange}
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                  >
                    <option value="">Select Board</option>
                    <option value="State Board">State Board</option>
                    <option value="CBSE">CBSE</option>
                    <option value="ICSE">ICSE</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">JEE Marks</label>
                  <input
                    type="text"
                    name="counsellingData.jeeMarks"
                    value={formData.counsellingData.jeeMarks}
                    onChange={handleChange}
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">CET Marks</label>
                  <input
                    type="text"
                    name="counsellingData.cetMarks"
                    value={formData.counsellingData.cetMarks}
                    onChange={handleChange}
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                  />
                </div>
                {/* Add remaining counselling fields similarly */}
              </div>
            </div>

            <div className="flex justify-end gap-4">
              <Link
                to="/users"
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400"
              >
                {loading ? 'Adding...' : 'Add User'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AddUsers;