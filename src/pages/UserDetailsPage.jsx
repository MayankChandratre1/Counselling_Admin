import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Copy, ArrowLeft, CheckCircle } from 'lucide-react';
import axios from 'axios';
import Navbar from '../components/Navbar';
import { useUsers } from '../contexts/UsersContext';

const API_URL = import.meta.env.VITE_REACT_APP_ADMIN_API_URL;



const UserDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notesToShow, setNotesToShow] = useState({});
  const [error, setError] = useState(null);
  const [copiedField, setCopiedField] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const {notes} = useUsers();

  useEffect(() => {
    fetchUserDetails();
  }, [id]);

  const fetchUserDetails = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await axios.get(`${API_URL}/api/admin/user/${id}`, {
        headers: { token }
      });
      setUser(response.data);
      if(notes){
        console.log(notes[`${id}`]);
        setNotesToShow(notes[`${id}`]?.notes);
      }
      setLoading(false);
    } catch (err) {
      setError('Failed to fetch user details');
      setLoading(false);
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    return new Date(timestamp._seconds * 1000).toLocaleDateString();
  };

  const copyToClipboard = async (text, field) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const copyAllCounsellingData = () => {
    if (!user?.counsellingData) return;
    
    const formattedData = Object.entries(user.counsellingData)
      .map(([key, value]) => {
        if (key === 'password' || key === 'confirmPassword' || key === 'termsAccepted') return null;
        return `${key}: ${value}`;
      })
      .filter(Boolean)
      .join('\n');
    
    copyToClipboard(formattedData, 'all');
  };

  if (loading) return (
    <div className="flex justify-center items-center h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
    </div>
  );

  if (error) return (
    <div className="flex justify-center items-center h-screen">
      <div className="text-red-500">{error}</div>
    </div>
  );

  if (!user) return (
    <div className="flex justify-center items-center h-screen">
      <div className="text-gray-500">User not found</div>
    </div>
  );

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <div className={`
        fixed inset-y-0 left-0 transform z-10
        lg:relative lg:translate-x-0 transition duration-200 ease-in-out
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <Navbar onClose={() => setIsSidebarOpen(false)} />
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto p-8">
        <div className="max-w-7xl mx-auto">
          {/* Back Button and Header */}
          <div className="flex items-center mb-8 gap-4">
            <button
              onClick={() => navigate('/users')}
              className="flex items-center text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft size={20} className="mr-2" />
              Back to Users
            </button>
            <h1 className="text-3xl font-bold text-gray-900">{user.name}'s Profile</h1>
          </div>

          {/* Basic Info Card */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Basic Information</h2>
              <span className={`px-3 py-1 rounded-full text-sm ${
                user.isPremium ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
              }`}>
                {user.isPremium ? 'Premium' : 'Standard'}
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Name</p>
                <p className="font-medium">{user.name}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Phone</p>
                <p className="font-medium">{user.phone}</p>
              </div>
              {user.email && (
                <div>
                  <p className="text-sm text-gray-600">Email</p>
                  <p className="font-medium">{user.email}</p>
                </div>
              )}
            </div>
          </div>

          {notesToShow && Object.keys(notesToShow).length > 0 && (
            <div className="bg-white rounded-lg shadow-md p-6  mb-6">
              <h2 className="text-xl font-semibold mb-4">Notes</h2>
              <div className="space-y-4">
                {Object.entries(notesToShow).map(([noteKey, noteData], index) => (
                  <div 
                    key={index} 
                    className="border-l-4 border-blue-500 bg-gray-50 p-4 rounded-r-lg hover:shadow-md transition-shadow"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <span className="font-medium text-blue-600">
                        {noteKey.replace('note-', '')}
                      </span>
                      <span className="text-sm text-gray-500">
                        {new Date(noteData.createdAt).toLocaleString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    </div>
                    <p className="text-gray-700 whitespace-pre-wrap break-words">
                      {noteData.note}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

            {/* Steps Progress */}
            {user.stepsData && (
            <div className="bg-white rounded-lg shadow-md mb-6 p-6">
              <h2 className="text-xl font-semibold mb-4">Progress Steps</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {user.stepsData.steps.map((step, index) => (
                  <div key={index} className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 flex items-center justify-center rounded-full bg-blue-100 text-blue-800 text-sm">
                        {step.number}
                      </span>
                      <p className="font-medium">{step.title}</p>
                    </div>
                    <div className="mt-2">
                      <span className={`px-2 py-1 rounded-full text-sm ${
                        step.status === 'Yes' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {step.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Counselling Data Card */}
          {user.counsellingData && (
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold">Counselling Information</h2>
                <button
                  onClick={copyAllCounsellingData}
                  className="px-4 py-2 bg-blue-50 text-blue-600 rounded-md hover:bg-blue-100 flex items-center gap-2"
                >
                  {copiedField === 'all' ? <CheckCircle size={16} /> : <Copy size={16} />}
                  Copy All Info
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {Object.entries(user.counsellingData).map(([key, value]) => {
                  if (key === 'password' || key === 'confirmPassword' || key === 'termsAccepted') return null;
                  
                  return (
                    <div key={key} className="relative group">
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <p className="text-sm text-gray-600 capitalize">
                          {key.replace(/([A-Z])/g, ' $1').toLowerCase()}
                        </p>
                        <div className="flex justify-between items-center mt-1">
                          <p className="font-medium">{String(value)}</p>
                          <button
                            onClick={() => copyToClipboard(String(value), key)}
                            className="opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            {copiedField === key ? (
                              <CheckCircle size={16} className="text-green-500" />
                            ) : (
                              <Copy size={16} className="text-gray-400 hover:text-gray-600" />
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Premium Plan Details */}
          {user.premiumPlan && (
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <h2 className="text-xl font-semibold mb-4">Premium Plan Details</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Plan Title</p>
                  <p className="font-medium">{user.premiumPlan.planTitle}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Purchased Date</p>
                  <p className="font-medium">{formatDate(user.premiumPlan.purchasedDate)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Expiry Date</p>
                  <p className="font-medium">{formatDate(user.premiumPlan.expiryDate)}</p>
                </div>
              </div>
            </div>
          )}

        

        
        </div>
      </div>
    </div>
  );
};

export default UserDetailsPage;