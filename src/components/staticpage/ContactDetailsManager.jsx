import React, { useState, useEffect } from 'react';
import { ExternalLink, Phone, Save, AtSign, Youtube, MapPin, MessageCircle } from 'lucide-react';
import axiosInstance from '../../utils/axios';

const ContactDetailsManager = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [contactData, setContactData] = useState({
    company: { name: '' },
    address: { value: '', link: '' },
    phone: '',
    whatsapp: { number: '', groupinvite: '' },
    youtube: ''
  });

  useEffect(() => {
    fetchContactData();
  }, []);

  const fetchContactData = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get('/api/admin/get-contact-data');
      setContactData(response.data);
      setError(null);
    } catch (error) {
      console.error('Error fetching contact data:', error);
      setError('Failed to load contact data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (section, field, value) => {
    setContactData(prev => ({
      ...prev,
      [section]: typeof prev[section] === 'object' 
        ? { ...prev[section], [field]: value }
        : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      await axiosInstance.post('/api/admin/update-contact-data', contactData);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (error) {
      console.error('Error updating contact data:', error);
      setError('Failed to save contact data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (loading && !contactData.company) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {error && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6">
          <p>{error}</p>
        </div>
      )}

      {success && (
        <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 mb-6">
          <p>Contact details updated successfully!</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6 bg-white rounded-lg shadow-md p-6">
        {/* Company Name */}
        <div>
          <h3 className="text-lg font-medium text-gray-800 mb-3 flex items-center">
            <AtSign size={18} className="mr-2 text-blue-600" />
            Company Information
          </h3>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700">Company Name</label>
              <input
                type="text"
                value={contactData.company.name}
                onChange={(e) => handleChange('company', 'name', e.target.value)}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Address */}
        <div className="pt-4 border-t border-gray-200">
          <h3 className="text-lg font-medium text-gray-800 mb-3 flex items-center">
            <MapPin size={18} className="mr-2 text-blue-600" />
            Address
          </h3>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700">Address Text</label>
              <textarea
                value={contactData.address.value}
                onChange={(e) => handleChange('address', 'value', e.target.value)}
                rows={3}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Google Maps Link</label>
              <div className="mt-1 flex rounded-md shadow-sm">
                <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500 text-sm">
                  <ExternalLink size={16} />
                </span>
                <input
                  type="url"
                  value={contactData.address.link}
                  onChange={(e) => handleChange('address', 'link', e.target.value)}
                  className="flex-1 block w-full rounded-none rounded-r-md border-gray-300 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="https://maps.google.com/..."
                />
              </div>
            </div>
          </div>
        </div>

        {/* Phone */}
        <div className="pt-4 border-t border-gray-200">
          <h3 className="text-lg font-medium text-gray-800 mb-3 flex items-center">
            <Phone size={18} className="mr-2 text-blue-600" />
            Phone
          </h3>
          <div>
            <label className="block text-sm font-medium text-gray-700">Phone Number</label>
            <div className="mt-1 flex rounded-md shadow-sm">
              <input
                type="text"
                value={contactData.phone}
                onChange={(e) => handleChange('phone', null, e.target.value)}
                className="flex-1 block w-full rounded-md border-gray-300 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="+91XXXXXXXXXX"
              />
            </div>
            <p className="mt-1 text-sm text-gray-500">
              Include country code with the phone number (e.g., +917447609669)
            </p>
          </div>
        </div>

        {/* WhatsApp */}
        <div className="pt-4 border-t border-gray-200">
          <h3 className="text-lg font-medium text-gray-800 mb-3 flex items-center">
            <MessageCircle size={18} className="mr-2 text-blue-600" />
            WhatsApp
          </h3>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700">WhatsApp Number</label>
              <input
                type="text"
                value={contactData.whatsapp.number}
                onChange={(e) => handleChange('whatsapp', 'number', e.target.value)}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="917447609669"
              />
              <p className="mt-1 text-sm text-gray-500">
                Include country code without + (e.g., 917447609669)
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">WhatsApp Group Invite Link</label>
              <div className="mt-1 flex rounded-md shadow-sm">
                <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500 text-sm">
                  <ExternalLink size={16} />
                </span>
                <input
                  type="url"
                  value={contactData.whatsapp.groupinvite}
                  onChange={(e) => handleChange('whatsapp', 'groupinvite', e.target.value)}
                  className="flex-1 block w-full rounded-none rounded-r-md border-gray-300 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="https://chat.whatsapp.com/..."
                />
              </div>
            </div>
          </div>
        </div>

        {/* YouTube */}
        <div className="pt-4 border-t border-gray-200">
          <h3 className="text-lg font-medium text-gray-800 mb-3 flex items-center">
            <Youtube size={18} className="mr-2 text-blue-600" />
            YouTube
          </h3>
          <div>
            <label className="block text-sm font-medium text-gray-700">YouTube Channel Link</label>
            <div className="mt-1 flex rounded-md shadow-sm">
              <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500 text-sm">
                <ExternalLink size={16} />
              </span>
              <input
                type="url"
                value={contactData.youtube}
                onChange={(e) => handleChange('youtube', null, e.target.value)}
                className="flex-1 block w-full rounded-none rounded-r-md border-gray-300 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="https://youtube.com/c/..."
              />
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="pt-5">
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={loading}
              className="ml-3 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Saving...' : 'Save Contact Details'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default ContactDetailsManager;
