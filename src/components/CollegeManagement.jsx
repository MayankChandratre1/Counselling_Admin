import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { PlusCircle, MinusCircle, Plus, X, Eye } from 'lucide-react';
import CollegeDetailsModal from './colleges/CollegeDetailsModal';

const API_URL = import.meta.env.VITE_REACT_APP_ADMIN_API_URL || 'http://localhost:3008';

const CollegeManagement = () => {
  const [colleges, setColleges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [hasMore, setHasMore] = useState(false);
  const [nextPageId, setNextPageId] = useState(null);
  const [searchParams, setSearchParams] = useState({
    instituteName: '',
    instituteCode: '',
    city: ''
  });
  const [isSearchMode, setIsSearchMode] = useState(false);
  const [editingCollege, setEditingCollege] = useState(null);
  const [viewingCollege, setViewingCollege] = useState(null);
  const [formData, setFormData] = useState({
    instituteName: '',
    instituteCode: '',
    city: '',
    status: '',
    additionalMetadata: {
      status: '',
      totalIntake: 0,
      autonomyStatus: '',
      minorityStatus: '',
      address: '',
      region: '',
      university: ''
    },
    branches: []
  });

  useEffect(() => {
    if (!isSearchMode) {
      fetchColleges();
    }
  }, [currentPage, pageSize]);

  const fetchColleges = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/api/colleges`, {
        params: {
          page: currentPage,
          limit: pageSize,
          lastDocId: nextPageId
        }
      });
      
      setColleges(response.data.colleges);
      setNextPageId(response.data.nextPageId);
      setHasMore(response.data.hasMore);
      setLoading(false);
    } catch (err) {
      setError('Failed to fetch colleges');
      setLoading(false);
      console.error('Error fetching colleges:', err);
    }
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      setIsSearchMode(true);
      
      const filteredParams = Object.entries(searchParams)
        .filter(([_, value]) => value !== '')
        .reduce((obj, [key, value]) => {
          obj[key] = value;
          return obj;
        }, {});
      
      filteredParams.page = currentPage? currentPage : 1;
      filteredParams.limit = pageSize;
      
      const response = await axios.get(`${API_URL}/api/colleges/search`, {
        params: filteredParams
      });
      
      setColleges(response.data.colleges);
      setHasMore(response.data.hasMore);
      setCurrentPage(response.data.currentPage);
      setLoading(false);
    } catch (err) {
      setError('Failed to search colleges');
      setLoading(false);
      console.error('Error searching colleges:', err);
    }
  };

  const resetSearch = () => {
    setSearchParams({
      instituteName: '',
      instituteCode: '',
      city: ''
    });
    setIsSearchMode(false);
    setCurrentPage(1);
    setNextPageId(null);
    fetchColleges();
  };

  const handleEdit = (college) => {
    setEditingCollege(college);
    setFormData({
      instituteName: college.instituteName || '',
      instituteCode: college.instituteCode || '',
      city: college.city || '',
      status: college.status || '',
      additionalMetadata: {
        status: college.additionalMetadata?.status || '',
        totalIntake: college.additionalMetadata?.totalIntake || 0,
        autonomyStatus: college.additionalMetadata?.autonomyStatus || '',
        minorityStatus: college.additionalMetadata?.minorityStatus || '',
        address: college.additionalMetadata?.address || '',
        region: college.additionalMetadata?.region || '',
        university: college.additionalMetadata?.university || ''
      },
      branches: Array.isArray(college.branches) 
        ? college.branches.map(branch => ({
            branchCode: branch.branchCode || '',
            branchName: branch.branchName || '',
            branchShort: branch.branchShort || '',
            cutoffs: Array.isArray(branch.cutoffs) ? [...branch.cutoffs] : []
          })) 
        : []
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this college?')) {
      try {
        await axios.delete(`${API_URL}/api/colleges/${id}`);
        setColleges(colleges.filter(college => college.id !== id));
      } catch (err) {
        setError('Failed to delete college');
        console.error('Error deleting college:', err);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const collegeData = {
        ...formData,
        instituteCode: parseInt(formData.instituteCode) || formData.instituteCode,
      };

      if (editingCollege && editingCollege.id) {
        await axios.put(`${API_URL}/api/colleges/${editingCollege.id}`, collegeData);
        setColleges(colleges.map(college => 
          college.id === editingCollege.id ? { ...college, ...collegeData } : college
        ));
      } else {
        const response = await axios.post(`${API_URL}/api/colleges`, collegeData);
        setColleges([...colleges, response.data]);
      }
      setEditingCollege(null);
      setFormData({
        instituteName: '',
        instituteCode: '',
        city: '',
        status: '',
        additionalMetadata: {
          status: '',
          totalIntake: 0,
          autonomyStatus: '',
          minorityStatus: '',
          address: '',
          region: '',
          university: ''
        },
        branches: []
      });
    } catch (err) {
      setError(editingCollege?.id ? 'Failed to update college' : 'Failed to add college');
      console.error('Error saving college:', err);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleMetadataChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      additionalMetadata: {
        ...formData.additionalMetadata,
        [name]: value
      }
    });
  };

  const handleAddBranch = () => {
    setFormData({
      ...formData,
      branches: [
        ...formData.branches, 
        {
          branchCode: '',
          branchName: '',
          branchShort: '',
          cutoffs: []
        }
      ]
    });
  };

  const handleRemoveBranch = (index) => {
    const newBranches = [...formData.branches];
    newBranches.splice(index, 1);
    setFormData({
      ...formData,
      branches: newBranches
    });
  };

  const handleBranchChange = (index, field, value) => {
    const newBranches = [...formData.branches];
    newBranches[index][field] = value;
    setFormData({
      ...formData,
      branches: newBranches
    });
  };

  const handleAddCutoff = (branchIndex) => {
    const newBranches = [...formData.branches];
    if (!newBranches[branchIndex].cutoffs) {
      newBranches[branchIndex].cutoffs = [];
    }
    
    newBranches[branchIndex].cutoffs.push({
      category: '',
      percentile: 0,
      rank: 0,
      capRound: 'cap1',
      year: new Date().getFullYear()
    });

    setFormData({
      ...formData,
      branches: newBranches
    });
  };

  const handleRemoveCutoff = (branchIndex, cutoffIndex) => {
    const newBranches = [...formData.branches];
    newBranches[branchIndex].cutoffs.splice(cutoffIndex, 1);
    setFormData({
      ...formData,
      branches: newBranches
    });
  };

  const handleCutoffChange = (branchIndex, cutoffIndex, field, value) => {
    const newBranches = [...formData.branches];
    
    if (field === 'percentile' || field === 'rank' || field === 'year') {
      value = Number(value);
    }
    
    newBranches[branchIndex].cutoffs[cutoffIndex][field] = value;
    setFormData({
      ...formData,
      branches: newBranches
    });
  };

  const handleSearchParamChange = (e) => {
    const { name, value } = e.target;
    setSearchParams({
      ...searchParams,
      [name]: value
    });
  };

  const handleAddNewCollege = () => {
    setEditingCollege({});
    setFormData({
      instituteName: '',
      instituteCode: '',
      city: '',
      status: '',
      additionalMetadata: {
        status: '',
        totalIntake: 0,
        autonomyStatus: '',
        minorityStatus: '',
        address: '',
        region: '',
        university: ''
      },
      branches: []
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleView = (college) => {
    setViewingCollege(college);
  };

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">College Management System</h1>
          {!editingCollege && (
            <button
              onClick={handleAddNewCollege}
              className="w-full sm:w-auto px-4 py-2 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg shadow-md hover:from-green-600 hover:to-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-opacity-50 flex items-center justify-center"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
              </svg>
              Add New College
            </button>
          )}
        </div>
        
        {editingCollege && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">{editingCollege.id ? 'Edit College' : 'Add New College'}</h2>
              <button 
                onClick={() => setEditingCollege(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-800 mb-3">Basic Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Institute Name*</label>
                    <input
                      type="text"
                      name="instituteName"
                      value={formData.instituteName}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Institute Code*</label>
                    <input
                      type="text"
                      name="instituteCode"
                      value={formData.instituteCode}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                    <p className="text-xs text-gray-500 mt-1">This will be used as the unique identifier</p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">City*</label>
                    <input
                      type="text"
                      name="city"
                      value={formData.city}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                </div>
              </div>
              
              <div>
                <h3 className="text-lg font-medium text-gray-800 mb-3">Additional Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                    <select
                      name="status"
                      value={formData.additionalMetadata.status}
                      onChange={handleMetadataChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select Status</option>
                      <option value="Government">Government</option>
                      <option value="Private">Private</option>
                      <option value="Government-Aided">Government-Aided</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Total Intake</label>
                    <input
                      type="number"
                      name="totalIntake"
                      value={formData.additionalMetadata.totalIntake}
                      onChange={handleMetadataChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Autonomy Status</label>
                    <select
                      name="autonomyStatus"
                      value={formData.additionalMetadata.autonomyStatus}
                      onChange={handleMetadataChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select Status</option>
                      <option value="Autonomous">Autonomous</option>
                      <option value="Non-Autonomous">Non-Autonomous</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Minority Status</label>
                    <select
                      name="minorityStatus"
                      value={formData.additionalMetadata.minorityStatus}
                      onChange={handleMetadataChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select Status</option>
                      <option value="Minority">Minority</option>
                      <option value="Non-Minority">Non-Minority</option>
                    </select>
                  </div>
                  
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                    <input
                      type="text"
                      name="address"
                      value={formData.additionalMetadata.address}
                      onChange={handleMetadataChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Region</label>
                    <input
                      type="text"
                      name="region"
                      value={formData.additionalMetadata.region}
                      onChange={handleMetadataChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">University</label>
                    <input
                      type="text"
                      name="university"
                      value={formData.additionalMetadata.university}
                      onChange={handleMetadataChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>
              
              <div>
                <div className="flex justify-between items-center mb-3">
                  <h3 className="text-lg font-medium text-gray-800">Branches</h3>
                  <button
                    type="button"
                    onClick={handleAddBranch}
                    className="px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center text-sm"
                  >
                    <PlusCircle size={16} className="mr-1" /> Add Branch
                  </button>
                </div>
                
                {formData.branches.length === 0 ? (
                  <div className="text-center py-4 bg-gray-50 rounded-lg border border-gray-200">
                    <p className="text-gray-500">No branches added. Click the button above to add a branch.</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {formData.branches.map((branch, branchIndex) => (
                      <div key={branchIndex} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                        <div className="flex justify-between items-start mb-4">
                          <h4 className="font-medium text-gray-700">Branch #{branchIndex + 1}</h4>
                          <button
                            type="button"
                            onClick={() => handleRemoveBranch(branchIndex)}
                            className="text-red-600 hover:text-red-800"
                          >
                            <X size={18} />
                          </button>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Branch Code*</label>
                            <input
                              type="text"
                              value={branch.branchCode}
                              onChange={(e) => handleBranchChange(branchIndex, 'branchCode', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                              required
                            />
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Branch Name*</label>
                            <input
                              type="text"
                              value={branch.branchName}
                              onChange={(e) => handleBranchChange(branchIndex, 'branchName', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                              required
                            />
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Short Name</label>
                            <input
                              type="text"
                              value={branch.branchShort}
                              onChange={(e) => handleBranchChange(branchIndex, 'branchShort', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                              placeholder="e.g. CSE"
                            />
                          </div>
                        </div>
                        
                        <div>
                          <div className="flex justify-between items-center mb-2">
                            <h5 className="font-medium text-gray-600 text-sm">Cutoffs</h5>
                            <button
                              type="button"
                              onClick={() => handleAddCutoff(branchIndex)}
                              className="px-2 py-1 bg-gray-600 text-white rounded hover:bg-gray-700 flex items-center text-xs"
                            >
                              <Plus size={12} className="mr-1" /> Add Cutoff
                            </button>
                          </div>
                          
                          {branch.cutoffs && branch.cutoffs.length > 0 ? (
                            <div className="overflow-x-auto">
                              <table className="min-w-full divide-y divide-gray-200 text-sm">
                                <thead className="bg-gray-100">
                                  <tr>
                                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Percentile</th>
                                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Rank</th>
                                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">CAP Round</th>
                                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Year</th>
                                    <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                                  </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                  {branch.cutoffs.map((cutoff, cutoffIndex) => (
                                    <tr key={cutoffIndex}>
                                      <td className="px-3 py-2">
                                        <input
                                          type="text"
                                          value={cutoff.category || ''}
                                          onChange={(e) => handleCutoffChange(branchIndex, cutoffIndex, 'category', e.target.value)}
                                          className="w-full px-2 py-1 border border-gray-300 rounded-md text-sm"
                                          placeholder="e.g. GOPENS"
                                        />
                                      </td>
                                      <td className="px-3 py-2">
                                        <input
                                          type="number"
                                          step="0.0001"
                                          value={cutoff.percentile || 0}
                                          onChange={(e) => handleCutoffChange(branchIndex, cutoffIndex, 'percentile', e.target.value)}
                                          className="w-24 px-2 py-1 border border-gray-300 rounded-md text-sm"
                                        />
                                      </td>
                                      <td className="px-3 py-2">
                                        <input
                                          type="number"
                                          value={cutoff.rank || 0}
                                          onChange={(e) => handleCutoffChange(branchIndex, cutoffIndex, 'rank', e.target.value)}
                                          className="w-24 px-2 py-1 border border-gray-300 rounded-md text-sm"
                                        />
                                      </td>
                                      <td className="px-3 py-2">
                                        <select
                                          value={cutoff.capRound || 'cap1'}
                                          onChange={(e) => handleCutoffChange(branchIndex, cutoffIndex, 'capRound', e.target.value)}
                                          className="w-24 px-2 py-1 border border-gray-300 rounded-md text-sm"
                                        >
                                          <option value="cap1">CAP 1</option>
                                          <option value="cap2">CAP 2</option>
                                          <option value="cap3">CAP 3</option>
                                        </select>
                                      </td>
                                      <td className="px-3 py-2">
                                        <input
                                          type="number"
                                          value={cutoff.year || new Date().getFullYear()}
                                          onChange={(e) => handleCutoffChange(branchIndex, cutoffIndex, 'year', e.target.value)}
                                          className="w-20 px-2 py-1 border border-gray-300 rounded-md text-sm"
                                        />
                                      </td>
                                      <td className="px-3 py-2 text-right">
                                        <button
                                          type="button"
                                          onClick={() => handleRemoveCutoff(branchIndex, cutoffIndex)}
                                          className="text-red-500 hover:text-red-700"
                                        >
                                          <MinusCircle size={16} />
                                        </button>
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          ) : (
                            <div className="text-center py-2 bg-gray-100 rounded text-sm text-gray-500">
                              No cutoffs added. Click the button above to add a cutoff.
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              
              <div className="flex justify-end gap-4">
                <button 
                  type="button"
                  onClick={() => setEditingCollege(null)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {editingCollege.id ? 'Update College' : 'Add College'}
                </button>
              </div>
            </form>
          </div>
        )}
        
        <div className="bg-white rounded-lg shadow-md p-4 sm:p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Search Colleges</h2>
          <form onSubmit={handleSearch} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Institute Name</label>
                <input
                  type="text"
                  name="instituteName"
                  value={searchParams.instituteName}
                  onChange={handleSearchParamChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Search by name"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Institute Code</label>
                <input
                  type="text"
                  name="instituteCode"
                  value={searchParams.instituteCode}
                  onChange={handleSearchParamChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Code"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                <input
                  type="text"
                  name="city"
                  value={searchParams.city}
                  onChange={handleSearchParamChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="City"
                />
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row justify-end gap-2 sm:space-x-4">
              <button 
                type="button" 
                onClick={resetSearch}
                className="w-full sm:w-auto px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500"
              >
                Reset
              </button>
              <button 
                type="submit" 
                className="w-full sm:w-auto px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                Search
              </button>
            </div>
          </form>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
          <h2 className="text-xl font-semibold mb-6 text-gray-800">Colleges List</h2>
          
          {error && (
            <div className="bg-red-100 text-red-700 p-4 rounded-md mb-6 flex items-center">
              <svg className="h-5 w-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd"/>
              </svg>
              {error}
            </div>
          )}
          
          {loading ? (
            <div className="flex justify-center items-center h-32">
              <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          ) : colleges.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/>
              </svg>
              <p className="mt-2 text-gray-500 text-lg">
                No colleges found. {!isSearchMode && "Add a new college to get started."}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto -mx-4 sm:-mx-6">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Institute Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Code
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      City
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {colleges.map(college => (
                    <tr key={college.id} className="hover:bg-gray-50 transition-colors duration-200">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {college.instituteName}
                        </div>
                        <div className="text-xs text-gray-500">
                          Status: {college.status || 'N/A'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                          {college.instituteCode}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {college.city}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => handleView(college)}
                          className="text-indigo-600 hover:text-indigo-900 mr-4 transition-colors duration-200"
                          title="View college details"
                        >
                          <Eye size={16} className="inline mr-1" />
                          View
                        </button>
                        <button
                          onClick={() => handleEdit(college)}
                          className="text-blue-600 hover:text-blue-900 mr-4 transition-colors duration-200"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(college.id)}
                          className="text-red-600 hover:text-red-900 transition-colors duration-200"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          
          {!loading && colleges.length > 0 && (
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mt-6">
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-700">
                  Page {currentPage}
                </span>
                <select
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="border rounded-md px-2 py-1 text-sm"
                >
                  <option value="5">5 per page</option>
                  <option value="10">10 per page</option>
                  <option value="25">25 per page</option>
                  <option value="50">50 per page</option>
                </select>
              </div>
              
              <div className="flex space-x-2">
                <button
                  onClick={() => {
                    if (currentPage > 1) {
                      setCurrentPage(currentPage - 1);
                      setNextPageId(null);
                    }
                  }}
                  disabled={currentPage === 1}
                  className={`px-3 py-1 rounded-md ${
                    currentPage === 1
                      ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                      : 'bg-gray-800 text-white hover:bg-gray-700'
                  }`}
                >
                  Previous
                </button>
                <button
                  onClick={() => {
                    if (hasMore && !isSearchMode) {
                      setCurrentPage(currentPage + 1);
                    }
                    if(hasMore && isSearchMode){
                      handleSearch({preventDefault: () => {}});
                    }
                  }}
                  disabled={!hasMore}
                  className={`px-3 py-1 rounded-md ${
                    !hasMore
                      ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                      : 'bg-gray-800 text-white hover:bg-gray-700'
                  }`}
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* College Details Modal */}
      {viewingCollege && (
        <CollegeDetailsModal 
          college={viewingCollege}
          onClose={() => setViewingCollege(null)}
        />
      )}
    </div>
  );
};

export default CollegeManagement;