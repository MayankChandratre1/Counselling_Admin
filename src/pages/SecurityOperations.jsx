import React, { useState } from 'react';
import { ArrowLeft, Menu } from 'lucide-react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import SecurityAccessPanel from '../components/admin-settings/SecurityAccessPanel';

const SecurityOperations = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen bg-gray-100">
      <button
        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        className="lg:hidden fixed top-4 left-4 z-20 p-2 rounded-md bg-gray-800 text-white"
      >
        <Menu size={24} />
      </button>

      <div className={`
        fixed inset-y-0 left-0 transform z-10
        lg:relative lg:translate-x-0 transition duration-200 ease-in-out
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <Navbar onClose={() => setIsSidebarOpen(false)} />
      </div>

      <div className="flex-1 overflow-auto p-4">
        <div className="max-w-6xl mx-auto">
          <div className="mb-6">
            <Link to="/home" className="inline-flex items-center text-blue-600 hover:text-blue-700">
              <ArrowLeft className="w-5 h-5 mr-2" />
              Back
            </Link>
          </div>

          <SecurityAccessPanel />
        </div>
      </div>
    </div>
  );
};

export default SecurityOperations;
