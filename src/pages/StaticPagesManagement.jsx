import React, { useState } from 'react';
import { Menu, Globe } from 'lucide-react';
import Navbar from '../components/Navbar';
import LandingPageManager from '../components/staticpage/LandingPageManager';
import HomePageManagement from '../components/staticpage/HomePageManagement';
import ContactDetailsManager from '../components/staticpage/ContactDetailsManager';

const StaticPagesManagement = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('landing'); // 'landing', 'home', or 'contact'

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
      <div className="flex-1 overflow-auto p-4 md:p-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 mb-6">Static Pages Management</h1>

          {/* Tab Navigation */}
          <div className="border-b border-gray-200 mb-6">
            <nav className="flex space-x-8">
              <button
                onClick={() => setActiveTab('landing')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'landing'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Landing Page
              </button>
              <button
                onClick={() => setActiveTab('home')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'home'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Home Page
              </button>
              <button
                onClick={() => setActiveTab('contact')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'contact'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Contact Details
              </button>
            </nav>
          </div>

          {/* Tab Content */}
          <div>
            {activeTab === 'landing' && <LandingPageManager />}
            {activeTab === 'home' && <HomePageManagement />}
            {activeTab === 'contact' && <ContactDetailsManager />}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StaticPagesManagement;