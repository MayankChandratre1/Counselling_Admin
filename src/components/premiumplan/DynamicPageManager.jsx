import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Link, Lock, Globe } from 'lucide-react';
import axiosInstance from '../../utils/axios';
import PageFormModal from './PageFormModal';
import { usePremiumPage } from '../../contexts/PremiumPageContext';

const DynamicPageManager = () => {
  const [pages, setPages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(null);
  const {premiumPlans} = usePremiumPage()

  useEffect(() => {
    fetchPages();
  }, []);

  const fetchPages = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get('/api/admin/get-dynamic-pages');
      setPages(response.data.data || []);
      setError(null);
    } catch (error) {
      console.error('Error fetching dynamic pages:', error);
      setError('Failed to load dynamic pages. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSavePage = async (pageData) => {
    try {
      // Make a deep copy of the current pages
      let updatedPages = JSON.parse(JSON.stringify(pages));

      if (currentPage) {
        // Update existing page
        const index = updatedPages.findIndex(p => p.title === currentPage.title);
        if (index !== -1) {
          updatedPages[index] = pageData;
        }
      } else {
        // Add new page
        updatedPages.push(pageData);
      }

      // Save to backend
      await axiosInstance.post('/api/admin/update-dynamic-pages', {
        data: updatedPages
      });

      setPages(updatedPages);
      setShowModal(false);
      setCurrentPage(null);
    } catch (error) {
      console.error('Error saving page:', error);
      alert('Failed to save page. Please try again.');
    }
  };

  const handleDeletePage = async (page) => {
    if (window.confirm(`Are you sure you want to delete the page "${page.title}"?`)) {
      try {
        const updatedPages = pages.filter(p => p.title !== page.title);
        
        await axiosInstance.post('/api/admin/update-dynamic-pages', {
          data: updatedPages
        });
        
        setPages(updatedPages);
      } catch (error) {
        console.error('Error deleting page:', error);
        alert('Failed to delete page. Please try again.');
      }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {error && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6">
          <p>{error}</p>
        </div>
      )}

      <div className="mb-6 flex justify-between items-center">
        <h2 className="text-xl font-semibold text-gray-800">Dynamic Pages</h2>
        <button
          onClick={() => {
            setCurrentPage(null);
            setShowModal(true);
          }}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center"
        >
          <Plus size={18} className="mr-2" />
          Add New Page
        </button>
      </div>

      {pages.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg border border-gray-200 shadow-sm">
          <div className="flex flex-col items-center">
            <Globe size={48} className="text-gray-300 mb-3" />
            <h3 className="text-lg font-medium text-gray-500 mb-1">No Dynamic Pages</h3>
            <p className="text-gray-400 mb-4">Add a new page to get started</p>
            <button
              onClick={() => {
                setCurrentPage(null);
                setShowModal(true);
              }}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center"
            >
              <Plus size={18} className="mr-2" />
              Add First Page
            </button>
          </div>
        </div>
      ) : (
        <div className="grid gap-4">
          {pages.map((page, index) => (
            <div 
              key={index} 
              className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden"
            >
              <div className="p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-xl font-semibold text-gray-800 mb-2 flex items-center">
                      {page.title} 
                      <span className="text-sm text-gray-500 ml-2">
                        for ({page.plan ? page.plan : 'All Plans'})
                      </span>
                      {page.isPremiumOnly && (
                        <Lock size={16} className="ml-2 text-amber-500" title="Premium Only" />
                      )}
                    </h3>
                    
                    {page.url && (
                      <a 
                        href={page.url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 hover:underline flex items-center"
                      >
                        <Link size={14} className="mr-1" />
                        {page.url}
                      </a>
                    )}
                    
                    {page.html && (
                      <div className="mt-2 text-sm text-gray-600">
                        <strong>Has HTML Content</strong>
                      </div>
                    )}
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => {
                        setCurrentPage(page);
                        setShowModal(true);
                      }}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-full"
                      title="Edit page"
                    >
                      <Edit size={18} />
                    </button>
                    <button
                      onClick={() => handleDeletePage(page)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-full"
                      title="Delete page"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <PageFormModal 
          page={currentPage}
          onClose={() => {
            setShowModal(false);
            setCurrentPage(null);
          }}
          onSave={handleSavePage}
          plans={premiumPlans} // Pass premium plans to the modal
        />
      )}
    </div>
  );
};

export default DynamicPageManager;
