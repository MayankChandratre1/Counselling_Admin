import React, { useState } from 'react';
import { X, ChevronDown, ChevronUp } from 'lucide-react';

const CollegeDetailsModal = ({ college, onClose }) => {
  const [expandedBranches, setExpandedBranches] = useState({});

  const toggleBranch = (branchCode) => {
    setExpandedBranches(prev => ({
      ...prev,
      [branchCode]: !prev[branchCode]
    }));
  };

  if (!college) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto">
      <div className="bg-white rounded-lg w-full max-w-4xl mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 sticky top-0 bg-white">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-gray-800">{college.instituteName}</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X size={24} />
            </button>
          </div>
        </div>

        {/* College details */}
        <div className="p-6">
          {/* Basic Information Section */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Basic Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Institute Code</p>
                <p className="font-medium">{college.instituteCode}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">City</p>
                <p className="font-medium">{college.city}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Status</p>
                <p className="font-medium">{college.status}</p>
              </div>
            </div>
          </div>

          {/* Additional Metadata Section */}
          {college.additionalMetadata && (
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Additional Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Status</p>
                  <p className="font-medium">{college.additionalMetadata.status || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Total Intake</p>
                  <p className="font-medium">{college.additionalMetadata.totalIntake || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Autonomy Status</p>
                  <p className="font-medium">{college.additionalMetadata.autonomyStatus || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Minority Status</p>
                  <p className="font-medium">{college.additionalMetadata.minorityStatus || 'N/A'}</p>
                </div>
                <div className="md:col-span-2">
                  <p className="text-sm text-gray-500">Address</p>
                  <p className="font-medium">{college.additionalMetadata.address || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Region</p>
                  <p className="font-medium">{college.additionalMetadata.region || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">University</p>
                  <p className="font-medium">{college.additionalMetadata.university || 'N/A'}</p>
                </div>
              </div>
            </div>
          )}

          {/* Branches Section */}
          {college.branches && college.branches.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Branches ({college.branches.length})</h3>
              <div className="space-y-4">
                {college.branches.map((branch) => (
                  <div key={branch.branchCode} className="border rounded-lg overflow-hidden">
                    <div 
                      className="flex justify-between items-center p-4 bg-gray-50 cursor-pointer"
                      onClick={() => toggleBranch(branch.branchCode)}
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <span className="px-2.5 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
                            {branch.branchCode}
                          </span>
                          <h4 className="font-medium text-gray-800">{branch.branchName}</h4>
                          <span className="text-xs text-gray-500">({branch.branchShort || 'N/A'})</span>
                        </div>
                      </div>
                      {expandedBranches[branch.branchCode] ? (
                        <ChevronUp className="text-gray-500" size={20} />
                      ) : (
                        <ChevronDown className="text-gray-500" size={20} />
                      )}
                    </div>
                    
                    {expandedBranches[branch.branchCode] && branch.cutoffs && branch.cutoffs.length > 0 && (
                      <div className="p-4 border-t border-gray-200">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Percentile</th>
                              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Rank</th>
                              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Round</th>
                              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Year</th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {branch.cutoffs.map((cutoff, index) => (
                              <tr key={index} className="hover:bg-gray-50">
                                <td className="px-3 py-2 whitespace-nowrap text-sm font-medium">{cutoff.category}</td>
                                <td className="px-3 py-2 whitespace-nowrap text-sm">{cutoff.percentile.toFixed(2)}</td>
                                <td className="px-3 py-2 whitespace-nowrap text-sm">{cutoff.rank}</td>
                                <td className="px-3 py-2 whitespace-nowrap text-sm">{cutoff.capRound}</td>
                                <td className="px-3 py-2 whitespace-nowrap text-sm">{cutoff.year}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Keywords Section */}
          {college.keywords && college.keywords.length > 0 && (
            <div className="mt-8">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Keywords</h3>
              <div className="flex flex-wrap gap-2">
                {college.keywords.map((keyword, index) => (
                  <span key={index} className="px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-sm">
                    {keyword}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CollegeDetailsModal;
