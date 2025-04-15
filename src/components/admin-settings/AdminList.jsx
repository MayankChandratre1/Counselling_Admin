import React, { useState } from 'react';
import { Pencil, Trash2, Activity, Download, Loader2 } from 'lucide-react';
import ActivityModal from './ActivityModal';
import axiosInstance from '../../utils/axios';

const AdminList = ({ admins, onEdit, onDelete }) => {
  const [selectedAdmin, setSelectedAdmin] = useState(null);
  const [showActivityModal, setShowActivityModal] = useState(false);
  const [downloadingCSV, setDownloadingCSV] = useState(null); // Store admin ID that's being downloaded

  const formatFieldForCSV = (field, maxLength = 500) => {
    if (!field) return '';
    const stringified = JSON.stringify(field).replaceAll(',', ';').replaceAll('"', '');
    if (stringified.length > maxLength) {
      return stringified.substring(0, maxLength) + '... [truncated]';
    }
    return stringified.replace(/,/g, ';');
  };

  const handleExportCSV = async (adminId) => {
    try {
      setDownloadingCSV(adminId);
      const response = await axiosInstance.get(`/api/admin/activity/${adminId}`);
      const data = await response.data;
      
      const csvContent = [
        ['Timestamp', 'Method', 'Path', 'Status', 'Body', 'Response'],
        ...data.activities.map(activity => {
          // Skip body and response if they're too large (over 1MB)
          const body = activity.body && JSON.stringify(activity.body).length > 1000000 
            ? '[Content too large]' 
            : formatFieldForCSV(activity.body);
          
          const response = activity.response && JSON.stringify(activity.response).length > 1000000
            ? '[Content too large]'
            : formatFieldForCSV(activity.response);

          return [
            activity.timestamp,
            activity.method,
            activity.path,
            activity.status,
            body,
            response,
          ];
        })
      ].map(row => row.join(',')).join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `admin-activity-${adminId}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting CSV:', error);
      // Show error toast or alert here
    } finally {
      setDownloadingCSV(null);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-semibold mb-4">Admin List</h2>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {admins.map(admin => (
              <tr key={admin.id}>
                <td className="px-6 py-4 whitespace-nowrap">{admin.email}</td>
                <td className="px-6 py-4 whitespace-nowrap">{admin.role}</td>
                <td className="px-6 py-4 whitespace-nowrap text-right space-x-3">
                  <button 
                    onClick={() => {
                      setSelectedAdmin(admin);
                      setShowActivityModal(true);
                    }} 
                    className="text-green-600 hover:text-green-900 transition-colors"
                    title="View Activities"
                  >
                    <Activity className="w-4 h-4 inline" />
                  </button>
                  <button 
                    onClick={() => handleExportCSV(admin.id)} 
                    disabled={downloadingCSV === admin.id}
                    className={`text-purple-600 hover:text-purple-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed
                      ${downloadingCSV === admin.id ? 'animate-pulse' : ''}`}
                    title={downloadingCSV === admin.id ? "Downloading..." : "Export Activities"}
                  >
                    {downloadingCSV === admin.id ? (
                      <Loader2 className="w-4 h-4 inline animate-spin" />
                    ) : (
                      <Download className="w-4 h-4 inline" />
                    )}
                  </button>
                  <button onClick={() => onEdit(admin)} className="text-blue-600 hover:text-blue-900">
                    <Pencil className="w-4 h-4 inline" />
                  </button>
                  <button onClick={() => onDelete(admin.id)} className="text-red-600 hover:text-red-900">
                    <Trash2 className="w-4 h-4 inline" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {showActivityModal && selectedAdmin && (
        <ActivityModal
          adminId={selectedAdmin.id}
          onClose={() => {
            setShowActivityModal(false);
            setSelectedAdmin(null);
          }}
        />
      )}
    </div>
  );
};

export default AdminList;
