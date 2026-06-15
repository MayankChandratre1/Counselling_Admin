import React, { useEffect, useState } from 'react';
import { Loader2, ToggleLeft, ToggleRight } from 'lucide-react';
import axiosInstance from '../../utils/axios';
import { formatDisplayDate } from '../../utils/formatDate';

/** Mirrors backend SUPPORTED_FLAGS so the panel stays complete before API redeploy. */
const KNOWN_FLAGS = [
  {
    key: 'college_range_enabled',
    label: 'College Range (Premium)',
    description:
      'Premium-only screen that lets students filter cutoffs by category, gender and branch and highlights colleges around their percentile.',
    defaultEnabled: false
  },
  {
    key: 'home_countdown_cards_enabled',
    label: 'Home Countdown Cards',
    description:
      'Premium offer countdown banners on the app home screen for non-premium users. Turn off to hide the entire section.',
    defaultEnabled: true
  }
];

const mergeFlags = (apiFlags = []) => {
  const byKey = apiFlags.reduce((acc, flag) => ({ ...acc, [flag.key]: flag }), {});
  return KNOWN_FLAGS.map((meta) => {
    const fromApi = byKey[meta.key];
    if (fromApi) return fromApi;
    return {
      key: meta.key,
      label: meta.label,
      description: meta.description,
      enabled: meta.defaultEnabled,
      updatedAt: null,
      updatedBy: null
    };
  });
};
const FeatureFlagsPanel = () => {
  const [flags, setFlags] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savingKey, setSavingKey] = useState(null);
  const [error, setError] = useState('');

  const fetchFlags = async () => {
    try {
      setLoading(true);
      const res = await axiosInstance.get('/api/admin/feature-flags');
      setFlags(mergeFlags(res.data?.flags));
      setError('');
    } catch (err) {
      console.error('Failed to load feature flags:', err);
      setError('Failed to load feature flags.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFlags();
  }, []);

  const toggleFlag = async (flag) => {
    const next = !flag.enabled;
    try {
      setSavingKey(flag.key);
      const res = await axiosInstance.put(`/api/admin/feature-flags/${flag.key}`, {
        enabled: next
      });
      setFlags((prev) =>
        prev.map((f) => (f.key === flag.key ? { ...f, ...res.data } : f))
      );
    } catch (err) {
      console.error('Failed to update feature flag:', err);
      const message = err?.response?.status === 404
        ? 'This flag is not available on the deployed admin API yet. Redeploy Counselling-admin, or use the Home Countdown toggle on the Premium Plans tab.'
        : 'Failed to update feature flag. Try again.';
      alert(message);
    } finally {
      setSavingKey(null);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h2 className="text-xl font-semibold">Feature Flags</h2>
          <p className="text-sm text-gray-500">
            Toggle premium / experimental screens in the mobile app. Changes go live on the next launch.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center text-gray-500">
          <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Loading flags…
        </div>
      ) : error ? (
        <div className="text-red-600">{error}</div>
      ) : flags.length === 0 ? (
        <div className="text-gray-500 italic">No feature flags configured.</div>
      ) : (
        <div className="space-y-3">
          {flags.map((flag) => {
            const isSaving = savingKey === flag.key;
            const Icon = flag.enabled ? ToggleRight : ToggleLeft;
            return (
              <div
                key={flag.key}
                className="flex items-start justify-between p-4 border rounded-lg hover:bg-gray-50"
              >
                <div className="flex-1 mr-4">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{flag.label}</span>
                    <code className="text-xs px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded">
                      {flag.key}
                    </code>
                  </div>
                  <p className="text-sm text-gray-500 mt-1">{flag.description}</p>
                  {flag.updatedAt && (
                    <p className="text-xs text-gray-400 mt-1">
                      Last changed {formatDisplayDate(flag.updatedAt)}
                      {flag.updatedBy ? ` by ${flag.updatedBy}` : ''}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => toggleFlag(flag)}
                  disabled={isSaving}
                  className={`inline-flex items-center px-3 py-1.5 rounded-md border transition
                    ${flag.enabled
                      ? 'bg-green-50 border-green-500 text-green-700 hover:bg-green-100'
                      : 'bg-gray-50 border-gray-300 text-gray-700 hover:bg-gray-100'}
                    ${isSaving ? 'opacity-60 cursor-not-allowed' : ''}`}
                >
                  {isSaving ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Icon className="w-4 h-4 mr-2" />
                  )}
                  {flag.enabled ? 'Enabled' : 'Disabled'}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default FeatureFlagsPanel;
