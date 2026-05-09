import React, { useState } from 'react';
import { Menu } from 'lucide-react';
import Navbar from '../components/Navbar';
import PremiumPlanManager from '../components/premiumplan/PremiumPlanManager';
import DynamicPageManager from '../components/premiumplan/DynamicPageManager';
import FeatureFlagsPanel from '../components/premiumplan/FeatureFlagsPanel';

const PremiumPageManagement = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('plans'); // 'plans' | 'pages' | 'flags'

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
          <h1 className="text-2xl font-bold text-gray-800 mb-6">Premium & Dynamic Pages Management</h1>

          {/* Tab Navigation */}
          <div className="border-b border-gray-200 mb-6">
            <nav className="flex space-x-8">
              <button
                onClick={() => setActiveTab('plans')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'plans'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Premium Plans
              </button>
              <button
                onClick={() => setActiveTab('pages')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'pages'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Dynamic Pages
              </button>
              <button
                onClick={() => setActiveTab('flags')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'flags'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Feature Flags
              </button>
            </nav>
          </div>

          {/* Tab Content */}
          <div>
            {activeTab === 'plans' && <PremiumPlanManager />}
            {activeTab === 'pages' && <DynamicPageManager />}
            {activeTab === 'flags' && <FeatureFlagsPanel />}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PremiumPageManagement;