import React, { useState } from 'react';
import { Search, MapPin, Building, GraduationCap, Filter, Download, Copy, Check, ChevronLeft, ChevronRight, RotateCcw } from 'lucide-react';

const ListDetails = ({ 
  list, 
  handleCopyBranchCode, 
  isCodeCopied, 
  resetCopiedStatus 
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCity, setFilterCity] = useState('');
  const [filterBranch, setFilterBranch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);

  const colleges = list.colleges || [];

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
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterCity, filterBranch, itemsPerPage]);
  
  // Count how many codes have been copied
  const copiedCount = list?.colleges?.reduce((count, college) => {
    return count + (isCodeCopied(college.uniqueId || college.id) ? 1 : 0);
  }, 0) || 0;

  const exportToCSV = () => {
    const headers = ['Index', 'Institute Name', 'Institute Code', 'Branch Code', 'City', 'Branch', 'Status'];
    const csvData = filteredColleges.map((college, index) => [
      index + 1,
      college.instituteName || '',
      college.instituteCode || '',
      college.selectedBranchCode || college.instituteCode || '',
      college.city || '',
      college.selectedBranch || 'All Branches',
      college.status || 'N/A'
    ]);

    const csvContent = [headers, ...csvData]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${list.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_colleges.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const goToPage = (page) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header with Search and Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-800 mb-1">
            Colleges in this list
          </h3>
          <p className="text-sm text-gray-600">
            Showing {startIndex + 1}-{Math.min(endIndex, filteredColleges.length)} of {filteredColleges.length} colleges
            {searchTerm || filterCity || filterBranch ? ' (filtered)' : ''}
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          {/* Items per page selector */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">Show:</span>
            <select
              value={itemsPerPage}
              onChange={(e) => setItemsPerPage(Number(e.target.value))}
              className="border border-gray-300 rounded px-2 py-1 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>
          
          {colleges.length > 0 && (
            <button
              onClick={exportToCSV}
              className="inline-flex items-center px-3 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors"
            >
              <Download size={16} className="mr-2" />
              Export CSV
            </button>
          )}
        </div>
      </div>

      {/* Add progress indicator and reset button for copied status */}
      {colleges.length > 0 && (
        <div className="flex justify-between items-center mb-3">
          <div className="text-sm text-gray-600">
            <span className="font-medium">{copiedCount}</span> of <span className="font-medium">{colleges.length}</span> codes copied
            {copiedCount > 0 && (
              <div className="w-full bg-gray-200 rounded-full h-2.5 mt-1">
                <div 
                  className="bg-blue-600 h-2.5 rounded-full" 
                  style={{ width: `${(copiedCount / colleges.length) * 100}%` }}
                ></div>
              </div>
            )}
          </div>
          {copiedCount > 0 && (
            <button
              onClick={resetCopiedStatus}
              className="text-xs flex items-center gap-1 px-2 py-1 text-blue-600 hover:bg-blue-50 rounded"
              title="Reset copied status"
            >
              <RotateCcw size={14} />
              Reset
            </button>
          )}
        </div>
      )}

      {colleges.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-lg p-12 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <GraduationCap size={32} className="text-gray-400" />
          </div>
          <h4 className="text-lg font-medium text-gray-800 mb-2">No colleges in this list</h4>
          <p className="text-gray-500">Add some colleges to get started.</p>
        </div>
      ) : (
        <>
          {/* Search and Filter Controls */}
          <div className="bg-white rounded-lg border border-gray-200 p-4">
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
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-16">
                      #
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      College Name
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Branch Code
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Selected Branch
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      City
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {paginatedColleges.map((college, index) => {
                    const globalIndex = startIndex + index + 1;
                    const collegeId = college.uniqueId || college.id;
                    const isCopied = isCodeCopied(collegeId);
                    
                    return (
                      <tr key={collegeId} className={isCopied ? "bg-green-50" : "hover:bg-gray-50 transition-colors"}>
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
                        
                        
                        
                        {/* Branch Code */}
                        <td className="px-4 py-3">
                          {college.selectedBranchCode ? (
                            <div className="flex items-center space-x-2">
                              <span className={`text-sm font-mono font-medium ${
                                isCopied ? "bg-green-100 text-green-600" : "bg-blue-50 text-blue-600"
                              } px-2 py-1 rounded`}>
                                {college.selectedBranchCode}
                              </span>
                              <button
                                onClick={() => handleCopyBranchCode(college)}
                                className={`inline-flex items-center justify-center w-6 h-6 ${
                                  isCopied 
                                    ? 'text-green-600 bg-green-50' 
                                    : 'text-gray-400 hover:text-blue-600 hover:bg-blue-50'
                                } rounded transition-colors`}
                                title="Copy branch code"
                              >
                                {isCopied ? (
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

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between bg-white px-4 py-3 border border-gray-200 rounded-lg">
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
          )}

          {filteredColleges.length === 0 && (searchTerm || filterCity || filterBranch) && (
            <div className="bg-white border border-gray-200 rounded-lg p-8 text-center">
              <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Search size={24} className="text-gray-400" />
              </div>
              <h4 className="text-lg font-medium text-gray-800 mb-2">No colleges found</h4>
              <p className="text-gray-500">Try adjusting your search or filter criteria.</p>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default ListDetails;