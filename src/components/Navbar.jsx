import React from 'react';
import { User, Building, GraduationCap, X, LogOut, Lock, FormInput, List, Home } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

const VerticalNavbar = ({ onClose }) => {
  const navigate = useNavigate();

  const handleLogout = () => {
    // Clear all authentication data from localStorage
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminInfo');
    
    // Remove the token from axios headers if you're using axios
    if (window.axios && window.axios.defaults.headers.common['token']) {
      delete window.axios.defaults.headers.common['token'];
    }
    
    // Close the navbar if on mobile
    if (onClose) {
      onClose();
    }
    
    // Redirect to login page
    navigate('/');
  };

  return (
    <div className="h-screen w-64 bg-gray-900 text-white flex flex-col relative">
      {/* Close button for mobile */}
      <button
        onClick={onClose}
        className="lg:hidden absolute top-4 right-4 text-gray-400 hover:text-white"
      >
        <X size={24} />
      </button>

      {/* Logo/Header */}
      <div className="p-4 border-b border-gray-700 flex items-center">
        <GraduationCap className="mr-2" />
        <h1 className="text-xl font-bold">Education Portal</h1>
      </div>
      
      {/* Navigation Items */}
      <nav className="flex-1 overflow-y-auto p-2">
        {/* User Section */}
        <Link 
          to="/home"
          onClick={onClose}
          className="w-full flex items-center p-3 hover:bg-gray-800 rounded-md transition-colors mb-2"
        >
          <Home className="mr-3 text-white" />
          <span>Home</span>
        </Link>
        {/* User Section */}
        <Link 
          to="/users"
          onClick={onClose}
          className="w-full flex items-center p-3 hover:bg-gray-800 rounded-md transition-colors mb-2"
        >
          <User className="mr-3 text-blue-400" />
          <span>Users</span>
        </Link>
        
        {/* Colleges Section */}
        <Link 
          to="/colleges"
          onClick={onClose}
          className="w-full flex items-center p-3 hover:bg-gray-800 rounded-md transition-colors mb-2"
        >
          <Building className="mr-3 text-green-400" />
          <span>Colleges</span>
        </Link>

        <Link 
          to="/forms"
          onClick={onClose}
          className="w-full flex items-center p-3 hover:bg-gray-800 rounded-md transition-colors mb-2"
        >
          <FormInput className="mr-3 text-green-400" />
          <span>Forms</span>
        </Link>

        <Link 
          to="/lists"
          onClick={onClose}
          className="w-full flex items-center p-3 hover:bg-gray-800 rounded-md transition-colors mb-2"
        >
          <List className="mr-3 text-green-400" />
          <span>Lists</span>
        </Link>

        {/* Change Password Section */}
        <Link 
          to="/change-password"
          onClick={onClose}
          className="w-full flex items-center p-3 hover:bg-gray-800 rounded-md transition-colors mb-2"
        >
          <Lock className="mr-3 text-yellow-400" />
          <span>Change Password</span>
        </Link>
      </nav>
      
      {/* Logout Button */}
      <button
        onClick={handleLogout}
        className="mx-4 mb-4 flex items-center justify-center p-3 bg-red-600 hover:bg-red-700 rounded-md transition-colors"
      >
        <LogOut className="mr-2" size={18} />
        <span>Logout</span>
      </button>
      
      {/* Footer */}
      <div className="p-4 border-t border-gray-700 text-sm text-gray-400">
        © 2025 Education Portal
      </div>
    </div>
  );
};

export default VerticalNavbar;