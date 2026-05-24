import React, { useState, useEffect } from 'react';
import { X, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import axiosInstance from '../../utils/axios';

const ITEMS_PER_PAGE = 10;

const ActivityModal = ({ adminId, onClose }) => {
  const [activities, setActivities] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchActivities = async () => {
      try {
        const response = await axiosInstance.get(`/api/admin/activity/${adminId}`);
        const data = await response.data;
        setActivities(data.activities || []);
      } catch (error) {
        console.error('Error fetching activities:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchActivities();
  }, [adminId]);

  const totalPages = Math.ceil(activities.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const currentActivities = activities.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  // New function to handle direct page input
  const handlePageInput = (e) => {
    const value = parseInt(e.target.value);
    if (!isNaN(value) && value >= 1 && value <= totalPages) {
      setCurrentPage(value);
    }
  };

  // Function to get visible page numbers
  const getVisiblePages = () => {
    const delta = 2; // Number of pages to show before and after current page
    const range = [];
    const rangeWithDots = [];
    let l;

    for (let i = 1; i <= totalPages; i++) {
      if (i === 1 || i === totalPages || (i >= currentPage - delta && i <= currentPage + delta)) {
        range.push(i);
      }
    }

    for (let i of range) {
      if (l) {
        if (i - l === 2) {
          rangeWithDots.push(l + 1);
        } else if (i - l !== 1) {
          rangeWithDots.push('...');
        }
      }
      rangeWithDots.push(i);
      l = i;
    }

    return rangeWithDots;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-11/12 max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Admin Activities</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="w-5 h-5" />
          </button>
        </div>

        {loading ? (
          <div className="text-center py-4">Loading...</div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left">Timestamp</th>
                    <th className="px-4 py-2 text-left">Admin</th>
                    <th className="px-4 py-2 text-left">Method</th>
                    <th className="px-4 py-2 text-left">Path</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {currentActivities.map((activity) => (
                    <tr key={activity.id} className="hover:bg-gray-50">
                      <td className="px-4 py-2">{new Date(activity.timestamp).toLocaleString()}</td>
                      <td className="px-4 py-2">{activity.adminEmail || activity.adminId}</td>
                      <td className="px-4 py-2">{activity.method}</td>
                      <td className="px-4 py-2 ">{activity.path}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-4 flex flex-col items-center space-y-2">
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setCurrentPage(1)}
                  disabled={currentPage === 1}
                  className="px-2 py-1 rounded bg-gray-200 text-gray-700 hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronsLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="px-2 py-1 rounded bg-gray-200 text-gray-700 hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                {getVisiblePages().map((page, index) => (
                  <React.Fragment key={index}>
                    {page === '...' ? (
                      <span className="px-3 py-1">...</span>
                    ) : (
                      <button
                        onClick={() => setCurrentPage(page)}
                        className={`px-3 py-1 rounded ${
                          currentPage === page
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        }`}
                      >
                        {page}
                      </button>
                    )}
                  </React.Fragment>
                ))}

                <button
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="px-2 py-1 rounded bg-gray-200 text-gray-700 hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setCurrentPage(totalPages)}
                  disabled={currentPage === totalPages}
                  className="px-2 py-1 rounded bg-gray-200 text-gray-700 hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronsRight className="w-4 h-4" />
                </button>
              </div>

              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <span>Page</span>
                <input
                  type="number"
                  value={currentPage}
                  onChange={handlePageInput}
                  min="1"
                  max={totalPages}
                  className="w-16 px-2 py-1 border rounded text-center"
                />
                <span>of {totalPages}</span>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ActivityModal;
