import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';

const PageFormModal = ({ page, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    title: '',
    url: '',
    html: '',
    isPremiumOnly: false
  });
  
  useEffect(() => {
    if (page) {
      setFormData({
        title: page.title || '',
        url: page.url || '',
        html: page.html || '',
        isPremiumOnly: page.isPremiumOnly || false
      });
    }
  }, [page]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // If both url and html are empty, use url as the required field
    if (!formData.url && !formData.html) {
      alert('Please provide either a URL or HTML content');
      return;
    }
    
    onSave({
      ...formData,
      // If html is empty string, make it null
      html: formData.html.trim() === '' ? null : formData.html
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full mx-4 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <h3 className="text-xl font-semibold text-gray-800">
            {page ? 'Edit Dynamic Page' : 'Add New Dynamic Page'}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="space-y-4">
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                Page Title*
              </label>
              <input
                type="text"
                id="title"
                name="title"
                value={formData.title}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label htmlFor="url" className="block text-sm font-medium text-gray-700 mb-1">
                URL
              </label>
              <input
                type="url"
                id="url"
                name="url"
                value={formData.url}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="https://example.com/page"
              />
              <p className="text-xs text-gray-500 mt-1">
                External URL for the page (if not using HTML content)
              </p>
            </div>

            <div>
              <label htmlFor="html" className="block text-sm font-medium text-gray-700 mb-1">
                HTML Content
              </label>
              <textarea
                id="html"
                name="html"
                value={formData.html}
                onChange={handleChange}
                rows={8}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="<div>Your HTML content here</div>"
              ></textarea>
              <p className="text-xs text-gray-500 mt-1">
                HTML content for the page (if not using external URL)
              </p>
            </div>

            <div>
              <div className="flex items-center mb-2">
                <input
                  type="checkbox"
                  id="isPremiumOnly"
                  name="isPremiumOnly"
                  checked={formData.isPremiumOnly}
                  onChange={handleChange}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="isPremiumOnly" className="ml-2 block text-sm text-gray-700">
                  Premium Users Only
                </label>
              </div>
              <p className="text-xs text-gray-500">
                If checked, only premium users will be able to access this page
              </p>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 mt-6">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                {page ? 'Update Page' : 'Add Page'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PageFormModal;
