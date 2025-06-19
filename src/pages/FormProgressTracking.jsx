import React, { useState } from 'react';
import { Menu, Target, Award, BarChart3, TrendingUp } from 'lucide-react';
import Navbar from '../components/Navbar';
import FormProgressTracker from '../components/analytics/FormProgressTracker';
import CapProgressTracker from '../components/analytics/CapProgressTracker';
import { FormProgressProvider } from '../contexts/FormProgressContext';

const FormProgressTracking = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('forms');

  const tabs = [
    {
      id: 'forms',
      label: 'Form Progress',
      icon: <Target size={20} />,
      description: 'Track user completion across form steps',
      component: <FormProgressTracker />
    },
    {
      id: 'cap',
      label: 'CAP Progress',
      icon: <Award size={20} />,
      description: 'Monitor Centralized Admission Process progress',
      component: <CapProgressTracker />
    }
  ];

  const activeTabData = tabs.find(tab => tab.id === activeTab);

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
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center mb-4">
              <div className="bg-blue-100 p-3 rounded-lg mr-4">
                <BarChart3 className="h-8 w-8 text-blue-600" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Form Progress Tracking</h1>
                <p className="text-gray-600 mt-1">
                  Monitor and analyze user progress across different form types and CAP processes
                </p>
              </div>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
            <div className="border-b border-gray-200">
              <nav className="flex space-x-0">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`
                      flex items-center space-x-3 px-6 py-4 text-sm font-medium border-b-2 transition-all duration-200
                      ${activeTab === tab.id
                        ? 'border-blue-500 text-blue-600 bg-blue-50'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                      }
                    `}
                  >
                    <span className={`${activeTab === tab.id ? 'text-blue-600' : 'text-gray-400'}`}>
                      {tab.icon}
                    </span>
                    <div className="text-left">
                      <div className="font-medium">{tab.label}</div>
                      <div className="text-xs text-gray-500 mt-0.5">{tab.description}</div>
                    </div>
                  </button>
                ))}
              </nav>
            </div>

            {/* Tab Content Header */}
            <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white">
              <div className="flex items-center space-x-3">
                <div className={`p-2 rounded-lg ${
                  activeTab === 'forms' ? 'bg-blue-100' : 'bg-purple-100'
                }`}>
                  <span className={`${
                    activeTab === 'forms' ? 'text-blue-600' : 'text-purple-600'
                  }`}>
                    {activeTabData?.icon}
                  </span>
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">
                    {activeTabData?.label} Analytics
                  </h2>
                  <p className="text-gray-600 text-sm mt-1">
                    {activeTabData?.description}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Tab Content */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 min-h-[600px]">
            <div className="p-6">
              <FormProgressProvider>
                {activeTabData?.component}
              </FormProgressProvider>
            </div>
          </div>

          {/* Footer Info */}
          <div className="mt-6 text-center text-sm text-gray-500">
            <div className="flex items-center justify-center space-x-4">
              <div className="flex items-center space-x-1">
                <TrendingUp size={16} />
                <span>Real-time progress tracking</span>
              </div>
              <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
              <div className="flex items-center space-x-1">
                <Target size={16} />
                <span>Plan-based filtering</span>
              </div>
              <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
              <div className="flex items-center space-x-1">
                <Award size={16} />
                <span>CAP round analytics</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FormProgressTracking;
