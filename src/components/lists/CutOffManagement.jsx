import React, { useState, useEffect } from 'react';
import axios from 'axios';

// const API_URL = import.meta.env.VITE_REACT_APP_COLLEGE_API_URL || 'http://localhost:3002';
const API_URL = import.meta.env.VITE_REACT_APP_ADMIN_API_URL || 'http://localhost:3008';

function CutOffManagement() {
  const [cutoffs, setCutoffs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [hasMore, setHasMore] = useState(false);
  const [nextPageId, setNextPageId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    year: 2024,
    instituteCode: '',
    instituteName: '',
    branchCode: '',
    branchName: '',
    Category: '',
    capRound: 'cap1',
    rank: '',
    percentile: '',
    Status: '',
    city: '',
    additionalMetadata: {}
  });
  const [editingCutoff, setEditingCutoff] = useState(null);
  const [searchType, setSearchType] = useState('general'); // 'general' or 'instituteCode'
  const [searchCriteria, setSearchCriteria] = useState({
    collegeId: '',
    year: '',
    round: '',
    category: ''
  });
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    fetchCutoffs();
  }, [currentPage, pageSize]);

  const fetchCutoffs = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/api/cutoffs`, {
        params: {
          page: currentPage,
          limit: pageSize,
          lastDocId: nextPageId
        }
      });
      
      setCutoffs(response.data.cutoffs);
      setNextPageId(response.data.nextPageId);
      setHasMore(response.data.hasMore);
      setLoading(false);
    } catch (err) {
      setError('Failed to fetch cutoffs');
      setLoading(false);
      console.error('Error fetching cutoffs:', err);
    }
  };

  const handleEdit = (cutoff) => {
    setEditingCutoff(cutoff);
    setShowForm(true);
    setFormData({
      year: cutoff.year,
      instituteCode: cutoff.instituteCode,
      instituteName: cutoff.instituteName,
      branchCode: cutoff.branchCode,
      branchName: cutoff.branchName,
      Category: cutoff.Category,
      capRound: cutoff.capRound,
      rank: cutoff.rank,
      percentile: cutoff.percentile,
      Status: cutoff.Status,
      city: cutoff.city,
      additionalMetadata: cutoff.additionalMetadata || {}
    });
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this cutoff?')) {
      try {
        setLoading(true);
        await axios.delete(`${API_URL}/api/cutoffs/${id}`);
        setCutoffs(cutoffs.filter(cutoff => cutoff.id !== id));
        setLoading(false);
      } catch (err) {
        setError('Failed to delete cutoff');
        setLoading(false);
        console.error('Error deleting cutoff:', err);
      }
    }
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      
      if (editingCutoff) {
        // Update existing cutoff
        const response = await axios.put(`${API_URL}/api/cutoffs/${editingCutoff.id}`, formData);
        setCutoffs(cutoffs.map(cutoff => 
          cutoff.id === editingCutoff.id ? response.data : cutoff
        ));
      } else {
        // Add new cutoff (existing code)
        const response = await axios.post(`${API_URL}/api/cutoffs`, formData);
        setCutoffs([...cutoffs, response.data]);
      }

      setShowForm(false);
      setEditingCutoff(null);
      setFormData({
        year: 2024,
        instituteCode: '',
        instituteName: '',
        branchCode: '',
        branchName: '',
        Category: '',
        capRound: 'cap1',
        rank: '',
        percentile: '',
        Status: '',
        city: '',
        additionalMetadata: {}
      });
      setLoading(false);
    } catch (err) {
      setError(editingCutoff ? 'Failed to update cutoff' : 'Failed to add cutoff');
      setLoading(false);
      console.error('Error saving cutoff:', err);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'rank' || name === 'percentile' ? Number(value) : value
    }));
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      setIsSearching(true);
      let response;

      if (searchType === 'instituteCode') {
        response = await axios.get(`${API_URL}/api/cutoffs/institute/${searchCriteria.instituteCode}`);
        setCutoffs(response.data.data || []);
      } else {
        // Convert empty strings to undefined to avoid sending unnecessary parameters
        const filteredCriteria = Object.entries(searchCriteria)
          .filter(([_, value]) => value !== '')
          .reduce((obj, [key, value]) => {
            // Convert year to number if present
            if (key === 'year' && value) {
              obj[key] = Number(value);
            } else {
              obj[key] = value;
            }
            return obj;
          }, {});

        response = await axios.get(`${API_URL}/api/cutoffs/search`, {
          params: filteredCriteria
        });
        
        // Handle the response format from your backend
        const searchResults = response.data || [];
        setCutoffs(Array.isArray(searchResults) ? searchResults : []);
      }
      
      setHasMore(false);
      setLoading(false);
    } catch (err) {
      setError('Search failed: ' + err.message);
      setLoading(false);
    }
  };

  const resetSearch = () => {
    setSearchCriteria({
      collegeId: '',
      year: '',
      round: '',
      category: ''
    });
    setSearchType('general');
    setIsSearching(false);
    fetchCutoffs();
  };

  const handleSearchCriteriaChange = (e) => {
    const { name, value } = e.target;
    setSearchCriteria(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Cutoff Management</h1>
          <button
            onClick={() => setShowForm(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
          >
            Add New Cutoff
          </button>
        </div>

        {/* Modified Search Section */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <form onSubmit={handleSearch} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Search Type
                </label>
                <select
                  value={searchType}
                  onChange={(e) => setSearchType(e.target.value)}
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                >
                  <option value="general">General Search</option>
                  <option value="instituteCode">Search by Institute Code</option>
                </select>
              </div>

              {searchType === 'instituteCode' ? (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Institute Code
                  </label>
                  <input
                    type="text"
                    name="instituteCode"
                    value={searchCriteria.instituteCode}
                    onChange={handleSearchCriteriaChange}
                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    placeholder="Enter institute code..."
                  />
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:col-span-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">College ID</label>
                    <input
                      type="text"
                      name="collegeId"
                      value={searchCriteria.collegeId}
                      onChange={handleSearchCriteriaChange}
                      className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      placeholder="Enter college ID..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Year</label>
                    <input
                      type="number"
                      name="year"
                      value={searchCriteria.year}
                      onChange={handleSearchCriteriaChange}
                      className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      placeholder="Enter year..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Round</label>
                    <input
                      type="text"
                      name="round"
                      value={searchCriteria.round}
                      onChange={handleSearchCriteriaChange}
                      className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      placeholder="Enter round..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                    <input
                      type="text"
                      name="category"
                      value={searchCriteria.category}
                      onChange={handleSearchCriteriaChange}
                      className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      placeholder="Enter category..."
                    />
                  </div>
                </div>
              )}

              <div className="md:col-span-2 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={resetSearch}
                  className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600"
                >
                  Reset
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Search
                </button>
              </div>
            </div>
          </form>
        </div>

        {/* Add Cutoff Form */}
        {showForm && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">
                {editingCutoff ? 'Edit Cutoff' : 'Add New Cutoff'}
              </h2>
              <button 
                onClick={() => {
                  setShowForm(false);
                  setEditingCutoff(null);
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleFormSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Year</label>
                <input
                  type="number"
                  name="year"
                  value={formData.year}
                  onChange={handleInputChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Institute Code</label>
                <input
                  type="text"
                  name="instituteCode"
                  value={formData.instituteCode}
                  onChange={handleInputChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  required
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700">Institute Name</label>
                <input
                  type="text"
                  name="instituteName"
                  value={formData.instituteName}
                  onChange={handleInputChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Branch Code</label>
                <input
                  type="text"
                  name="branchCode"
                  value={formData.branchCode}
                  onChange={handleInputChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Branch Name</label>
                <input
                  type="text"
                  name="branchName"
                  value={formData.branchName}
                  onChange={handleInputChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Category</label>
                <input
                  type="text"
                  name="Category"
                  value={formData.Category}
                  onChange={handleInputChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">CAP Round</label>
                <input
                  type="text"
                  name="capRound"
                  value={formData.capRound}
                  onChange={handleInputChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Rank</label>
                <input
                  type="number"
                  name="rank"
                  value={formData.rank}
                  onChange={handleInputChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Percentile</label>
                <input
                  type="number"
                  step="0.0001"
                  name="percentile"
                  value={formData.percentile}
                  onChange={handleInputChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Status</label>
                <input
                  type="text"
                  name="Status"
                  value={formData.Status}
                  onChange={handleInputChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">City</label>
                <input
                  type="text"
                  name="city"
                  value={formData.city}
                  onChange={handleInputChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  required
                />
              </div>

              <div className="md:col-span-2 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setEditingCutoff(null);
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  {editingCutoff ? 'Update Cutoff' : 'Add Cutoff'}
                </button>
              </div>
            </form>
          </div>
        )}

        {error && (
          <div className="bg-red-100 text-red-700 p-4 rounded-md mb-6">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex justify-center items-center h-32">
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : cutoffs.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-6 text-center">
            <p className="text-gray-500">
              {isSearching ? 'No results found' : 'No cutoffs available'}
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Institute</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Branch</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rank</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Percentile</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase"></th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {cutoffs.map((cutoff) => (
                    <tr key={cutoff.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{cutoff.instituteName}</div>
                        <div className="text-sm text-gray-500">{cutoff.instituteCode}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{cutoff.branchName}</div>
                        <div className="text-sm text-gray-500">{cutoff.branchCode}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                          {cutoff.Category}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {cutoff.rank}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {cutoff.percentile != null ? 
                          Number(cutoff.percentile).toFixed(2) : 
                          'N/A'
                        }
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => handleEdit(cutoff)}
                          className="text-indigo-600 hover:text-indigo-900 mr-4"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(cutoff.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {!isSearching && (
              <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
                <div className="flex-1 flex justify-between sm:hidden">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setCurrentPage(prev => prev + 1)}
                    disabled={!hasMore}
                    className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                  >
                    Next
                  </button>
                </div>
                <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm text-gray-700">
                      Page <span className="font-medium">{currentPage}</span>
                    </p>
                  </div>
                  <div>
                    <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                      <button
                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                        disabled={currentPage === 1}
                        className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
                      >
                        Previous
                      </button>
                      {[...Array(3)].map((_, idx) => {
                        const pageNumber = currentPage + idx - 1;
                        if (pageNumber < 1) return null;
                        return (
                          <button
                            key={pageNumber}
                            onClick={() => setCurrentPage(pageNumber)}
                            className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                              currentPage === pageNumber
                                ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                                : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                            }`}
                          >
                            {pageNumber}
                          </button>
                        );
                      })}
                      <button
                        onClick={() => setCurrentPage(prev => prev + 1)}
                        disabled={!hasMore}
                        className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
                      >
                        Next
                      </button>
                    </nav>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default CutOffManagement;