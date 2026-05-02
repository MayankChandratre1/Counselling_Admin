import React, { useEffect, useState } from 'react';
import axiosInstance from '../../utils/axios';

const formatDate = (value) => {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';

  const dd = String(date.getDate()).padStart(2, '0');
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const yyyy = date.getFullYear();
  const hh = String(date.getHours()).padStart(2, '0');
  const min = String(date.getMinutes()).padStart(2, '0');

  return `${dd}/${mm}/${yyyy} ${hh}:${min}`;
};

const statusClass = (status) => {
  switch (status) {
    case 'approved':
      return 'bg-green-100 text-green-800';
    case 'pending':
      return 'bg-amber-100 text-amber-800';
    case 'revoked':
    case 'rejected':
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-gray-100 text-gray-700';
  }
};

const SecurityAccessPanel = () => {
  const [approvals, setApprovals] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionError, setActionError] = useState('');

  const loadData = async () => {
    setLoading(true);
    setActionError('');
    try {
      const [approvalsRes, sessionsRes] = await Promise.all([
        axiosInstance.get('/api/admin/security/device-approvals?limit=100'),
        axiosInstance.get('/api/admin/security/sessions?limit=100')
      ]);

      setApprovals(approvalsRes.data.approvals || []);
      setSessions(sessionsRes.data.sessions || []);
    } catch (error) {
      console.error('Error loading security panel data:', error);
      setActionError(error.response?.data?.error || 'Failed to load security data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAction = async (approvalId, action) => {
    try {
      await axiosInstance.post(`/api/admin/security/device-approvals/${approvalId}/${action}`);
      await loadData();
    } catch (error) {
      console.error(`Error ${action} device:`, error);
      setActionError(error.response?.data?.error || `Failed to ${action} device`);
    }
  };

  const pendingApprovals = approvals.filter(item => item.status === 'pending');

  return (
    <div className="bg-white rounded-lg shadow-md p-6 space-y-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Security Operations</h2>
          <p className="text-sm text-gray-600 mt-1">Review first-login device approvals, revoke access, and audit user sessions.</p>
        </div>
        <button
          onClick={loadData}
          className="px-3 py-2 rounded-md border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          Refresh
        </button>
      </div>

      {actionError && (
        <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
          {actionError}
        </div>
      )}

      <section>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-medium text-gray-900">Pending device approvals</h3>
          <span className="text-sm text-gray-500">{pendingApprovals.length} pending</span>
        </div>

        {loading ? (
          <div className="text-sm text-gray-500">Loading approvals...</div>
        ) : pendingApprovals.length === 0 ? (
          <div className="text-sm text-gray-500">No pending approvals.</div>
        ) : (
          <div className="overflow-x-auto border rounded-lg">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                <tr>
                  <th className="px-4 py-3 text-left">User</th>
                  <th className="px-4 py-3 text-left">Device</th>
                  <th className="px-4 py-3 text-left">Location</th>
                  <th className="px-4 py-3 text-left">Requested</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {pendingApprovals.map((approval) => (
                  <tr key={approval.id}>
                    <td className="px-4 py-3 text-sm text-gray-900">
                      <div className="font-medium">{approval.userName || approval.userId}</div>
                      <div className="text-gray-500">{approval.userEmail || 'No email'}</div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      <div className="font-medium">{approval.deviceId}</div>
                      <div className="text-gray-500">{approval.deviceName || 'Unknown device'}</div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      <div>{approval.city || '—'}</div>
                      <div className="text-gray-500">{approval.region || '—'}</div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">{formatDate(approval.requestedAt)}</td>
                    <td className="px-4 py-3 text-right space-x-2">
                      <button
                        onClick={() => handleAction(approval.id, 'approve')}
                        className="px-3 py-1.5 rounded-md bg-green-600 text-white text-sm hover:bg-green-700"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => handleAction(approval.id, 'reject')}
                        className="px-3 py-1.5 rounded-md bg-amber-600 text-white text-sm hover:bg-amber-700"
                      >
                        Reject
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-medium text-gray-900">Recent user sessions</h3>
          <span className="text-sm text-gray-500">{sessions.length} loaded</span>
        </div>

        {loading ? (
          <div className="text-sm text-gray-500">Loading sessions...</div>
        ) : sessions.length === 0 ? (
          <div className="text-sm text-gray-500">No session records yet.</div>
        ) : (
          <div className="overflow-x-auto border rounded-lg">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                <tr>
                  <th className="px-4 py-3 text-left">User</th>
                  <th className="px-4 py-3 text-left">Device</th>
                  <th className="px-4 py-3 text-left">Login</th>
                  <th className="px-4 py-3 text-left">Logout</th>
                  <th className="px-4 py-3 text-left">Duration</th>
                  <th className="px-4 py-3 text-left">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {sessions.map((session) => (
                  <tr key={session.id}>
                    <td className="px-4 py-3 text-sm text-gray-900">
                      <div className="font-medium">{session.userName || session.userId}</div>
                      <div className="text-gray-500">{session.userEmail || 'No email'}</div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      <div className="font-medium">{session.deviceId}</div>
                      <div className="text-gray-500">{session.city || '—'} {session.region ? `• ${session.region}` : ''}</div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">{formatDate(session.loginTime)}</td>
                    <td className="px-4 py-3 text-sm text-gray-700">{formatDate(session.logoutTime)}</td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      {session.sessionDuration ? `${Math.round(session.sessionDuration / 60000)} min` : '—'}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${statusClass(session.status)}`}>
                        {session.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
};

export default SecurityAccessPanel;