import React, { useState, useEffect } from 'react';
import { ArrowLeft, Menu, Save, ChevronDown, ChevronUp, Plus, Trash2, Youtube } from 'lucide-react';
import { Link } from 'react-router-dom';
import axiosInstance from '../utils/axios';
import Navbar from '../components/Navbar';

const LandingPage = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessages, setSuccessMessages] = useState({
    header: false,
    video: false,
    testimonials: false,
    features: false,
    cta: false
  });
  
  // Expanded state for each section
  const [expandedSections, setExpandedSections] = useState({
    header: true,
    video: false,
    testimonials: false,
    features: false,
    cta: false
  });

  // Form data
  const [landingPageData, setLandingPageData] = useState({
    title: '',
    slogan: '',
    videoUrl: '',
    testimonials: [],
    features: [],
    ctaText: ''
  });

  // New testimonial form data
  const [newTestimonial, setNewTestimonial] = useState({
    name: '',
    designation: '',
    feedback: ''
  });

  // New feature text
  const [newFeature, setNewFeature] = useState('');

  useEffect(() => {
    fetchLandingPageData();
  }, []);

  const fetchLandingPageData = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get('/api/admin/get-landing-page');
      setLandingPageData(response.data);
      setError(null);
    } catch (error) {
      console.error('Error fetching landing page data:', error);
      setError('Failed to load landing page data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const handleInputChange = (section, field, value) => {
    setLandingPageData(prev => ({
      ...prev,
      [section]: value
    }));
  };

  const handleTestimonialChange = (index, field, value) => {
    const updatedTestimonials = [...landingPageData.testimonials];
    updatedTestimonials[index] = {
      ...updatedTestimonials[index],
      [field]: value
    };
    setLandingPageData(prev => ({
      ...prev,
      testimonials: updatedTestimonials
    }));
  };

  const handleNewTestimonialChange = (field, value) => {
    setNewTestimonial(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const addTestimonial = () => {
    if (newTestimonial.name && newTestimonial.designation && newTestimonial.feedback) {
      if(!landingPageData.testimonials || landingPageData.testimonials.length === 0) {
        setLandingPageData(prev => ({
          ...prev,
          testimonials: [newTestimonial]
        }));
      }
      else
      setLandingPageData(prev => ({
        ...prev,
        testimonials: [...prev.testimonials, { ...newTestimonial }]
      }));
      // Reset the form
      setNewTestimonial({
        name: '',
        designation: '',
        feedback: ''
      });
    }
  };

  const removeTestimonial = (index) => {
    const updatedTestimonials = [...landingPageData.testimonials];
    updatedTestimonials.splice(index, 1);
    setLandingPageData(prev => ({
      ...prev,
      testimonials: updatedTestimonials
    }));
  };

  const addFeature = () => {
    if (newFeature.trim()) {
      setLandingPageData(prev => ({
        ...prev,
        features: [...prev.features, newFeature.trim()]
      }));
      setNewFeature('');
    }
  };

  const removeFeature = (index) => {
    const updatedFeatures = [...landingPageData.features];
    updatedFeatures.splice(index, 1);
    setLandingPageData(prev => ({
      ...prev,
      features: updatedFeatures
    }));
  };

  const saveSection = async (section) => {
    try {
      let dataToSave = {};
      
      switch (section) {
        case 'header':
          dataToSave = {
            title: landingPageData.title,
            slogan: landingPageData.slogan
          };
          break;
        case 'video':
          dataToSave = { videoUrl: landingPageData.videoUrl };
          break;
        case 'testimonials':
          dataToSave = { testimonials: landingPageData.testimonials };
          break;
        case 'features':
          dataToSave = { features: landingPageData.features };
          break;
        case 'cta':
          dataToSave = { ctaText: landingPageData.ctaText };
          break;
        default:
          console.error('Unknown section:', section);
          return;
      }
      
      await axiosInstance.put('/api/admin/edit-landing-page', {
        section,
        data: dataToSave
      });
      
      // Show success message
      setSuccessMessages(prev => ({
        ...prev,
        [section]: true
      }));
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccessMessages(prev => ({
          ...prev,
          [section]: false
        }));
      }, 3000);
      
    } catch (error) {
      console.error(`Error saving ${section}:`, error);
      alert(`Failed to save ${section}. Please try again.`);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-500"></div>
      </div>
    );
  }
  
  const renderSectionHeader = (title, section) => (
    <div 
      className="flex justify-between items-center p-4 bg-gray-50 rounded-lg cursor-pointer"
      onClick={() => toggleSection(section)}
    >
      <h2 className="text-xl font-semibold text-gray-800">{title}</h2>
      <div className="flex items-center">
        {successMessages[section] && (
          <span className="mr-4 text-sm text-green-600">
            Saved successfully!
          </span>
        )}
        {expandedSections[section] ? (
          <ChevronUp className="text-gray-600" />
        ) : (
          <ChevronDown className="text-gray-600" />
        )}
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Mobile menu button */}
      <button
        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        className="lg:hidden fixed top-4 left-4 z-20 p-2 rounded-md bg-gray-800 text-white"
      >
        <Menu size={24} />
      </button>

      {/* Sidebar */}
      <div className={`
        fixed inset-y-0 left-0 transform z-10
        lg:relative lg:translate-x-0 transition duration-200 ease-in-out
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <Navbar onClose={() => setIsSidebarOpen(false)} />
      </div>

      {/* Main content */}
      <div className="flex-1 overflow-auto p-4 md:p-6">
        <div className="max-w-4xl mx-auto">
          <div className="mb-6">
            <Link to="/home" className="inline-flex items-center text-blue-600 hover:text-blue-700">
              <ArrowLeft className="w-5 h-5 mr-2" />
              Back to Dashboard
            </Link>
          </div>

          <h1 className="text-3xl font-bold text-gray-800 mb-6">Landing Page Settings</h1>

          {error && (
            <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6">
              <p>{error}</p>
            </div>
          )}

          {/* Section 1: Title and Slogan */}
          <div className="bg-white rounded-lg shadow-md mb-6 overflow-hidden">
            {renderSectionHeader('Header Content', 'header')}
            
            {expandedSections.header && (
              <div className="p-6 border-t border-gray-200 space-y-4">
                <div>
                  <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                    Page Title
                  </label>
                  <input
                    type="text"
                    id="title"
                    value={landingPageData.title}
                    onChange={(e) => handleInputChange('title', 'title', e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                
                <div>
                  <label htmlFor="slogan" className="block text-sm font-medium text-gray-700 mb-1">
                    Page Slogan
                  </label>
                  <textarea
                    id="slogan"
                    value={landingPageData.slogan}
                    onChange={(e) => handleInputChange('slogan', 'slogan', e.target.value)}
                    rows="2"
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  ></textarea>
                </div>
                
                <div className="flex justify-end">
                  <button
                    onClick={() => saveSection('header')}
                    className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    <Save size={16} className="mr-2" />
                    Save Header
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Section 2: Youtube Video URL */}
          <div className="bg-white rounded-lg shadow-md mb-6 overflow-hidden">
            {renderSectionHeader('Video Content', 'video')}
            
            {expandedSections.video && (
              <div className="p-6 border-t border-gray-200 space-y-4">
                <div>
                  <label htmlFor="videoUrl" className="block text-sm font-medium text-gray-700 mb-1">
                    YouTube Video URL
                  </label>
                  <div className="flex">
                    <div className="flex-shrink-0 bg-gray-100 border border-r-0 border-gray-300 rounded-l-md flex items-center px-3">
                      <Youtube size={20} className="text-red-600" />
                    </div>
                    <input
                      type="url"
                      id="videoUrl"
                      value={landingPageData.videoUrl}
                      onChange={(e) => handleInputChange('videoUrl', 'videoUrl', e.target.value)}
                      placeholder="https://www.youtube.com/watch?v=..."
                      className="w-full p-2 border border-gray-300 rounded-r-md focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Enter the full YouTube video URL, for example: https://www.youtube.com/watch?v=AbCdEfGhIjK
                  </p>
                </div>
                
                
                
                <div className="flex justify-end">
                  <button
                    onClick={() => saveSection('video')}
                    className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    <Save size={16} className="mr-2" />
                    Save Video
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Section 3: Testimonials */}
          <div className="bg-white rounded-lg shadow-md mb-6 overflow-hidden">
            {renderSectionHeader('Testimonials', 'testimonials')}
            
            {expandedSections.testimonials && (
              <div className="p-6 border-t border-gray-200">
                <div className="mb-6">
                  <h3 className="text-lg font-medium text-gray-800 mb-4">Current Testimonials</h3>
                  
                  {!landingPageData.testimonials || landingPageData.testimonials.length === 0 ? (
                    <p className="text-gray-500 italic">No testimonials added yet.</p>
                  ) : (
                    <div className="space-y-4">
                      {landingPageData.testimonials.map((testimonial, index) => (
                        <div key={index} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                          <div className="flex justify-between items-start">
                            <div className="space-y-2 flex-1">
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                  Name
                                </label>
                                <input
                                  type="text"
                                  value={testimonial.name}
                                  onChange={(e) => handleTestimonialChange(index, 'name', e.target.value)}
                                  className="w-full p-2 border border-gray-300 rounded-md"
                                />
                              </div>
                              
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                  Designation
                                </label>
                                <input
                                  type="text"
                                  value={testimonial.designation}
                                  onChange={(e) => handleTestimonialChange(index, 'designation', e.target.value)}
                                  className="w-full p-2 border border-gray-300 rounded-md"
                                />
                              </div>
                              
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                  Feedback
                                </label>
                                <textarea
                                  value={testimonial.feedback}
                                  onChange={(e) => handleTestimonialChange(index, 'feedback', e.target.value)}
                                  rows="3"
                                  className="w-full p-2 border border-gray-300 rounded-md"
                                ></textarea>
                              </div>
                            </div>
                            
                            <button
                              onClick={() => removeTestimonial(index)}
                              className="ml-4 text-red-500 hover:text-red-700"
                              title="Remove testimonial"
                            >
                              <Trash2 size={18} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                
                <div className="border-t border-gray-200 pt-6">
                  <h3 className="text-lg font-medium text-gray-800 mb-4">Add New Testimonial</h3>
                  <div className="space-y-4">
                    <div>
                      <label htmlFor="newName" className="block text-sm font-medium text-gray-700 mb-1">
                        Name
                      </label>
                      <input
                        type="text"
                        id="newName"
                        value={newTestimonial.name}
                        onChange={(e) => handleNewTestimonialChange('name', e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded-md"
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="newDesignation" className="block text-sm font-medium text-gray-700 mb-1">
                        Designation
                      </label>
                      <input
                        type="text"
                        id="newDesignation"
                        value={newTestimonial.designation}
                        onChange={(e) => handleNewTestimonialChange('designation', e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded-md"
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="newFeedback" className="block text-sm font-medium text-gray-700 mb-1">
                        Feedback
                      </label>
                      <textarea
                        id="newFeedback"
                        value={newTestimonial.feedback}
                        onChange={(e) => handleNewTestimonialChange('feedback', e.target.value)}
                        rows="3"
                        className="w-full p-2 border border-gray-300 rounded-md"
                      ></textarea>
                    </div>
                    
                    <div>
                      <button
                        onClick={addTestimonial}
                        disabled={!newTestimonial.name || !newTestimonial.designation || !newTestimonial.feedback}
                        className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                      >
                        <Plus size={16} className="mr-2" />
                        Add Testimonial
                      </button>
                    </div>
                  </div>
                </div>
                
                <div className="mt-6 flex justify-end">
                  <button
                    onClick={() => saveSection('testimonials')}
                    className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    <Save size={16} className="mr-2" />
                    Save Testimonials
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Section 4: What We Do (Features) */}
          <div className="bg-white rounded-lg shadow-md mb-6 overflow-hidden">
            {renderSectionHeader('What We Do', 'features')}
            
            {expandedSections.features && (
              <div className="p-6 border-t border-gray-200">
                <div className="mb-6">
                  <h3 className="text-lg font-medium text-gray-800 mb-4">Current Features</h3>
                  
                  {landingPageData.features.length === 0 ? (
                    <p className="text-gray-500 italic">No features added yet.</p>
                  ) : (
                    <ul className="space-y-2">
                      {landingPageData.features.map((feature, index) => (
                        <li key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-md">
                          <span>{feature}</span>
                          <button
                            onClick={() => removeFeature(index)}
                            className="text-red-500 hover:text-red-700"
                            title="Remove feature"
                          >
                            <Trash2 size={16} />
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
                
                <div className="border-t border-gray-200 pt-6">
                  <h3 className="text-lg font-medium text-gray-800 mb-4">Add New Feature</h3>
                  <div className="flex">
                    <input
                      type="text"
                      value={newFeature}
                      onChange={(e) => setNewFeature(e.target.value)}
                      className="flex-1 p-2 border border-r-0 border-gray-300 rounded-l-md"
                      placeholder="Enter feature description..."
                    />
                    <button
                      onClick={addFeature}
                      disabled={!newFeature.trim()}
                      className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-r-md hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                    >
                      <Plus size={16} className="mr-2" />
                      Add
                    </button>
                  </div>
                </div>
                
                <div className="mt-6 flex justify-end">
                  <button
                    onClick={() => saveSection('features')}
                    className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    <Save size={16} className="mr-2" />
                    Save Features
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Section 5: CTA Text */}
          <div className="bg-white rounded-lg shadow-md mb-6 overflow-hidden">
            {renderSectionHeader('Call to Action', 'cta')}
            
            {expandedSections.cta && (
              <div className="p-6 border-t border-gray-200 space-y-4">
                <div>
                  <label htmlFor="ctaText" className="block text-sm font-medium text-gray-700 mb-1">
                    CTA Text
                  </label>
                  <textarea
                    id="ctaText"
                    value={landingPageData.ctaText}
                    onChange={(e) => handleInputChange('ctaText', 'ctaText', e.target.value)}
                    rows="3"
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter call to action text..."
                  ></textarea>
                </div>
                
                <div className="flex justify-end">
                  <button
                    onClick={() => saveSection('cta')}
                    className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    <Save size={16} className="mr-2" />
                    Save CTA
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;