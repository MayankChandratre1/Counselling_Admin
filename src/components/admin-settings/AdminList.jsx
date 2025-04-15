import React, { useState } from 'react';
import { Pencil, Trash2, Activity, Download } from 'lucide-react';
import ActivityModal from './ActivityModal';
import axiosInstance from '../../utils/axios';

const AdminList = ({ admins, onEdit, onDelete }) => {
  const [selectedAdmin, setSelectedAdmin] = useState(null);
  const [showActivityModal, setShowActivityModal] = useState(false);

  const handleExportCSV = async (adminId) => {
    try {
      const response = await axiosInstance.get(`/api/admin/activity/${adminId}`);
      const data = await response.data;
      
      const csvContent = [
        ['Timestamp', 'Method', 'Path','Status', 'Body','Response'],
        ...data.activities.map(activity => [
          activity.timestamp,
          activity.method,
          activity.path,
          activity.status,
          `${JSON.stringify(activity.body).replace(/,/g, ';')}`,
          `${JSON.stringify(activity.response).replace(/,/g, ';')}`,
        ])
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
                    className="text-green-600 hover:text-green-900"
                    title="View Activities"
                  >
                    <Activity className="w-4 h-4 inline" />
                  </button>
                  <button 
                    onClick={() => handleExportCSV(admin.id)} 
                    className="text-purple-600 hover:text-purple-900"
                    title="Export Activities"
                  >
                    <Download className="w-4 h-4 inline" />
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
