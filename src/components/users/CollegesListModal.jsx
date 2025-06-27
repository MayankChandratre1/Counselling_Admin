import React, { useState, useEffect } from 'react';
import { X, GraduationCap, Search, MapPin, Building, Filter, Download, Copy, Check, ChevronLeft, ChevronRight } from 'lucide-react';

const CollegesListModal = ({ show, onClose, list }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCity, setFilterCity] = useState('');
  const [filterBranch, setFilterBranch] = useState('');
  const [copiedCode, setCopiedCode] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(15);

  const colleges = list?.colleges || [];

  // Get unique cities and branches for filters
  const uniqueCities = [...new Set(colleges.map(c => c.city).filter(Boolean))].sort();
  const uniqueBranches = [...new Set(colleges.map(c => c.selectedBranch).filter(Boolean))].sort();

  // Filter colleges (without sorting to maintain original order)
  const filteredColleges = colleges
    .filter(college => {
      const matchesSearch = !searchTerm || 
        college.instituteName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        college.instituteCode?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        college.selectedBranchCode?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesCity = !filterCity || college.city === filterCity;
      const matchesBranch = !filterBranch || college.selectedBranch === filterBranch;
      
      return matchesSearch && matchesCity && matchesBranch;
    });

  // Pagination calculations
  const totalPages = Math.ceil(filteredColleges.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedColleges = filteredColleges.slice(startIndex, endIndex);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterCity, filterBranch, itemsPerPage]);

  const copyToClipboard = async (text, collegeId) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedCode(collegeId);
      setTimeout(() => setCopiedCode(null), 2000);
    } catch (err) {
      console.error('Failed to copy: ', err);
    }
  };

  const exportToCSV = () => {
    const headers = ['Index', 'Institute Name', 'Institute Code', 'Branch Code', 'City', 'Branch'];
    const csvData = filteredColleges.map((college, index) => [
      index + 1,
      college.instituteName || '',
      college.instituteCode || '',
      college.selectedBranchCode || college.instituteCode || '',
      college.city || '',
      college.selectedBranch || 'All Branches'
    ]);

    const csvContent = [headers, ...csvData]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${list?.title?.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_colleges.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const goToPage = (page) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };
  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center z-[60] overflow-hidden">
      <div className="absolute inset-0 backdrop-blur-sm"></div>
      <div className="relative bg-white w-full max-w-7xl max-h-[95vh] flex flex-col rounded-xl shadow-2xl animate-fadeIn overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white p-4 flex justify-between items-center border-b">
          <div>
            <h2 className="text-xl font-bold flex items-center">
              <GraduationCap size={24} className="mr-3" />
              {list?.title}
            </h2>
            <p className="text-blue-100 mt-1 text-sm">
              Showing {startIndex + 1}-{Math.min(endIndex, filteredColleges.length)} of {filteredColleges.length} colleges
              {searchTerm || filterCity || filterBranch ? ' (filtered)' : ''}
            </p>
          </div>
          <div className="flex items-center gap-3">
            {/* Items per page selector */}
            <div className="flex items-center gap-2">
              <span className="text-blue-100 text-sm">Show:</span>
              <select
                value={itemsPerPage}
                onChange={(e) => setItemsPerPage(Number(e.target.value))}
                className="bg-white bg-opacity-20 border border-white border-opacity-30 rounded px-2 py-1 text-sm text-white focus:ring-2 focus:ring-white focus:ring-opacity-50"
              >
                <option value={10} className="text-gray-800">10</option>
                <option value={15} className="text-gray-800">15</option>
                <option value={25} className="text-gray-800">25</option>
                <option value={50} className="text-gray-800">50</option>
              </select>
            </div>
            
            {colleges.length > 0 && (
              <button
                onClick={exportToCSV}
                className="inline-flex items-center px-3 py-2 bg-white bg-opacity-20 text-white text-sm font-medium rounded-lg hover:bg-opacity-30 transition-colors"
              >
                <Download size={16} className="mr-2" />
                Export CSV
              </button>
            )}
            
            <button 
              onClick={onClose}
              className="text-white hover:text-blue-200 bg-white bg-opacity-20 hover:bg-opacity-30 p-2 rounded-full transition-all"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {colleges.length === 0 ? (
          <div className="flex-1 flex items-center justify-center p-12">
            <div className="text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <GraduationCap size={32} className="text-gray-400" />
              </div>
              <h4 className="text-lg font-medium text-gray-800 mb-2">No colleges in this list</h4>
              <p className="text-gray-500">This list is empty.</p>
            </div>
          </div>
        ) : (
          <>
            {/* Search and Filter Controls */}
            <div className="bg-gray-50 border-b p-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Search */}
                <div className="relative">
                  <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search colleges..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                {/* City Filter */}
                <div className="relative">
                  <Filter size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <select
                    value={filterCity}
                    onChange={(e) => setFilterCity(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none"
                  >
                    <option value="">All Cities</option>
                    {uniqueCities.map(city => (
                      <option key={city} value={city}>{city}</option>
                    ))}
                  </select>
                </div>

                {/* Branch Filter */}
                <div className="relative">
                  <Filter size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <select
                    value={filterBranch}
                    onChange={(e) => setFilterBranch(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none"
                  >
                    <option value="">All Branches</option>
                    {uniqueBranches.map(branch => (
                      <option key={branch} value={branch}>{branch}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Colleges Table */}
            <div className="flex-1 overflow-auto">
              <div className="min-h-full">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200 sticky top-0">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-16">
                        #
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        College Name
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Selected Branch
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Branch Code
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        City
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {paginatedColleges.map((college, index) => {
                      const globalIndex = startIndex + index + 1;
                      const collegeId = college.uniqueId || `${college.id}_${index}`;
                      
                      return (
                        <tr key={collegeId} className="hover:bg-gray-50 transition-colors">
                          {/* Index */}
                          <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                            {globalIndex}
                          </td>
                          
                          {/* College Name */}
                          <td className="px-4 py-3">
                            <div className="flex flex-col">
                              <div className="text-sm font-medium text-gray-900 truncate max-w-xs" title={college.instituteName}>
                                {college.instituteName}
                              </div>
                              <div className="text-xs text-gray-500 font-mono">
                                {college.instituteCode}
                              </div>
                            </div>
                          </td>
                          
                          {/* Selected Branch */}
                          <td className="px-4 py-3">
                            {college.selectedBranch ? (
                              <div className="flex items-center space-x-2">
                                <Building size={14} className="text-blue-500 flex-shrink-0" />
                                <span className="text-sm text-gray-900 truncate max-w-xs" title={college.selectedBranch}>
                                  {college.selectedBranch}
                                </span>
                              </div>
                            ) : (
                              <span className="text-sm text-gray-400">All Branches</span>
                            )}
                          </td>
                          
                          {/* Branch Code */}
                          <td className="px-4 py-3">
                            {college.selectedBranchCode ? (
                              <div className="flex items-center space-x-2">
                                <span className="text-sm font-mono font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded">
                                  {college.selectedBranchCode}
                                </span>
                                <button
                                  onClick={() => copyToClipboard(college.selectedBranchCode, collegeId)}
                                  className="inline-flex items-center justify-center w-6 h-6 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                                  title="Copy branch code"
                                >
                                  {copiedCode === collegeId ? (
                                    <Check size={14} className="text-green-600" />
                                  ) : (
                                    <Copy size={14} />
                                  )}
                                </button>
                              </div>
                            ) : (
                              <span className="text-sm text-gray-400">-</span>
                            )}
                          </td>
                          
                          {/* City */}
                          <td className="px-4 py-3">
                            {college.city ? (
                              <div className="flex items-center space-x-2">
                                <MapPin size={14} className="text-gray-400 flex-shrink-0" />
                                <span className="text-sm text-gray-900">
                                  {college.city}
                                </span>
                              </div>
                            ) : (
                              <span className="text-sm text-gray-400">-</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Footer with Pagination */}
            {totalPages > 1 && (
              <div className="border-t bg-white px-4 py-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center text-sm text-gray-500">
                    Page {currentPage} of {totalPages}
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => goToPage(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="inline-flex items-center px-3 py-1 border border-gray-300 text-sm font-medium rounded text-gray-500 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ChevronLeft size={16} className="mr-1" />
                      Previous
                    </button>
                    
                    {/* Page numbers */}
                    <div className="flex items-center space-x-1">
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        let pageNum;
                        if (totalPages <= 5) {
                          pageNum = i + 1;
                        } else if (currentPage <= 3) {
                          pageNum = i + 1;
                        } else if (currentPage >= totalPages - 2) {
                          pageNum = totalPages - 4 + i;
                        } else {
                          pageNum = currentPage - 2 + i;
                        }
                        
                        return (
                          <button
                            key={pageNum}
                            onClick={() => goToPage(pageNum)}
                            className={`px-3 py-1 text-sm font-medium rounded ${
                              currentPage === pageNum
                                ? 'bg-blue-600 text-white'
                                : 'text-gray-500 hover:bg-gray-50 border border-gray-300'
                            }`}
                          >
                            {pageNum}
                          </button>
                        );
                      })}
                    </div>
                    
                    <button
                      onClick={() => goToPage(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className="inline-flex items-center px-3 py-1 border border-gray-300 text-sm font-medium rounded text-gray-500 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Next
                      <ChevronRight size={16} className="ml-1" />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {filteredColleges.length === 0 && (searchTerm || filterCity || filterBranch) && (
              <div className="flex-1 flex items-center justify-center p-8">
                <div className="text-center">
                  <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Search size={24} className="text-gray-400" />
                  </div>
                  <h4 className="text-lg font-medium text-gray-800 mb-2">No colleges found</h4>
                  <p className="text-gray-500">Try adjusting your search or filter criteria.</p>
                </div>
              </div>
            )}
          </>        )}
      </div>
    </div>
  );
};

export default CollegesListModal;
