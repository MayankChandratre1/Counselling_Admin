import { useState, useEffect } from 'react';
import {  ChevronDown, ChevronUp, Plus, Trash2, Youtube, Save, Globe } from 'lucide-react';
import axiosInstance from '../../utils/axios';
import { formatDisplayDate } from '../../utils/formatDate';
import { FaHeartPulse } from 'react-icons/fa6';
import { set } from 'lodash';

const getInitialLandingPageData = () => ({
  title: { english: '', marathi: '' },
  slogan: { english: '', marathi: '' },
  videoUrl: '',
  testimonials: [],
  features: [],
  ctaText: { english: '', marathi: '' },
  updatedAt: ''
});

const normalizeMultilingualField = (value) => {
  if (!value) return { english: '', marathi: '' };

  if (typeof value === 'string') {
    return { english: value, marathi: '' };
  }

  if (typeof value === 'object' && !Array.isArray(value)) {
    return {
      ...value,
      english: value.english || '',
      marathi: value.marathi || ''
    };
  }

  return { english: '', marathi: '' };
};

const normalizeLandingPageData = (apiPayload) => {
  const rawPayload = apiPayload?.data || apiPayload || {};
  const payload = rawPayload.homepage && typeof rawPayload.homepage === 'object'
    ? rawPayload.homepage
    : rawPayload;

  const base = getInitialLandingPageData();

  return {
    ...base,
    ...payload,
    title: normalizeMultilingualField(payload.title),
    slogan: normalizeMultilingualField(payload.slogan),
    ctaText: normalizeMultilingualField(payload.ctaText),
    videoUrl: payload.videoUrl || payload.videoURL || '',
    testimonials: Array.isArray(payload.testimonials) ? payload.testimonials : [],
    features: Array.isArray(payload.features) ? payload.features : [],
    updatedAt: payload.updatedAt || payload.createdAt || ''
  };
};

const LandingPageManager = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedLanguage, setSelectedLanguage] = useState('english');
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
    cta: false,
    cutoff_video: false
  });

  // Form data - updated to match multilingual structure
  const [landingPageData, setLandingPageData] = useState({
    title: { english: '', marathi: '' },
    slogan: { english: '', marathi: '' },
    videoUrl: '',
    testimonials: [],
    features: [],
    ctaText: { english: '', marathi: '' },
    updatedAt: ''
  });

  // New testimonial form data (feedback remains a simple string)
  const [newTestimonial, setNewTestimonial] = useState({
    name: '',
    designation: '',
    feedback: ''
  });

  // New feature text - with multilingual structure
  const [newFeature, setNewFeature] = useState({ english: '', marathi: '' });

  const [cutoffVideo, setCutoffVideo] = useState("");

  useEffect(() => {
    fetchLandingPageData();
  }, []);

  const fetchLandingPageData = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get('/api/admin/get-landing-page');
      const normalizedPayload = normalizeLandingPageData(response?.data);
      setLandingPageData(normalizedPayload);
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

  const handleInputChange = (section, field, value, language = null) => {
    if (language) {
      // For multilingual fields - preserve numeric keys if they exist
      setLandingPageData(prev => {
        const currentSection = prev[section] || {};
        // Create a copy that keeps any numeric keys or other special keys
        const updatedSection = { ...currentSection };
        // Update only the specific language
        updatedSection[language] = value;
        return {
          ...prev,
          [section]: updatedSection
        };
      });
    } else {
      // For non-multilingual fields like videoUrl
      setLandingPageData(prev => ({
        ...prev,
        [section]: value
      }));
    }
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
      setLandingPageData(prev => ({
        ...prev,
        testimonials: [...(prev.testimonials || []), { ...newTestimonial }]
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

  const handleNewFeatureChange = (language, value) => {
    setNewFeature(prev => ({
      ...prev,
      [language]: value
    }));
  };

  const handleFeatureChange = (index, language, value) => {
    const updatedFeatures = [...landingPageData.features];
    // Preserve existing structure including numeric keys
    const existingFeature = updatedFeatures[index] || {};
    updatedFeatures[index] = {
      ...existingFeature,
      [language]: value
    };
    
    setLandingPageData(prev => ({
      ...prev,
      features: updatedFeatures
    }));
  };

  const addFeature = () => {
    if (newFeature.english.trim() || newFeature.marathi.trim()) {
      setLandingPageData(prev => ({
        ...prev,
        features: [...(prev.features || []), { ...newFeature }]
      }));
      setNewFeature({ english: '', marathi: '' });
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
      
      // Additional logging to debug what's being sent to the API
      console.log(`Saving ${section} data:`, dataToSave);
      
      const response = await axiosInstance.put('/api/admin/edit-landing-page', {
        section,
        data: dataToSave
      });
      
      console.log('Save response:', response.data);
      
      // Refetch latest data to ensure UI is in sync
      await fetchLandingPageData();
      
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
      const errorMsg = error.response?.data?.error || error.message || 'Unknown error';
      alert(`Failed to save ${section}: ${errorMsg}`);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
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

  // Helper function to get display value for multilingual fields
  const getDisplayValue = (field, language) => {
    if (!field) return '';
    if (typeof field === 'string') {
      return language === 'english' ? field : '';
    }
    return field[language] || '';
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Language Selector */}
      <div className="mb-4 flex justify-end items-center">
        <Globe className="mr-2 text-gray-600" size={18} />
        <select 
          value={selectedLanguage}
          onChange={(e) => setSelectedLanguage(e.target.value)}
          className="p-2 border border-gray-300 rounded-md text-sm"
        >
          <option value="english">English</option>
          <option value="marathi">मराठी (Marathi)</option>
        </select>
      </div>

      {error && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6">
          <p>{error}</p>
        </div>
      )}

      {landingPageData.updatedAt && (
        <div className="text-sm text-gray-500 mb-4">
          Last updated: {formatDisplayDate(landingPageData.updatedAt)}
        </div>
      )}

      {/* Section 1: Title and Slogan */}
      <div className="bg-white rounded-lg shadow-md mb-6 overflow-hidden">
        {renderSectionHeader('Header Content', 'header')}
        
        {expandedSections.header && (
          <div className="p-6 border-t border-gray-200 space-y-4">
            <div className="space-y-4">
              <label className="block text-sm font-medium text-gray-700">
                Page Title
              </label>
              <div className="space-y-3">
                <div>
                  <label className=" text-sm font-medium text-gray-700 mb-1 flex items-center">
                    <span className="mr-1">English</span> 
                    <span className="px-1.5 py-0.5 text-xs rounded-full bg-blue-100 text-blue-700">EN</span>
                  </label>
                  <input
                    type="text"
                    value={getDisplayValue(landingPageData.title, 'english')}
                    onChange={(e) => handleInputChange('title', null, e.target.value, 'english')}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter title in English"
                  />
                </div>
                <div>
                  <label className=" text-sm font-medium text-gray-700 mb-1 flex items-center">
                    <span className="mr-1">Marathi</span>
                    <span className="px-1.5 py-0.5 text-xs rounded-full bg-orange-100 text-orange-700">MR</span>
                  </label>
                  <input
                    type="text"
                    value={getDisplayValue(landingPageData.title, 'marathi')}
                    onChange={(e) => handleInputChange('title', null, e.target.value, 'marathi')}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter title in Marathi"
                  />
                </div>
              </div>
            </div>
            
            <div className="space-y-4">
              <label className="block text-sm font-medium text-gray-700">
                Page Slogan
              </label>
              <div className="space-y-3">
                <div>
                  <label className=" text-sm font-medium text-gray-700 mb-1 flex items-center">
                    <span className="mr-1">English</span> 
                    <span className="px-1.5 py-0.5 text-xs rounded-full bg-blue-100 text-blue-700">EN</span>
                  </label>
                  <textarea
                    value={getDisplayValue(landingPageData.slogan, 'english')}
                    onChange={(e) => handleInputChange('slogan', null, e.target.value, 'english')}
                    rows="2"
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter slogan in English"
                  ></textarea>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                    <span className="mr-1">Marathi</span>
                    <span className="px-1.5 py-0.5 text-xs rounded-full bg-orange-100 text-orange-700">MR</span>
                  </label>
                  <textarea
                    value={getDisplayValue(landingPageData.slogan, 'marathi')}
                    onChange={(e) => handleInputChange('slogan', null, e.target.value, 'marathi')}
                    rows="2"
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter slogan in Marathi"
                  ></textarea>
                </div>
              </div>
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
                  onChange={(e) => handleInputChange('videoUrl', null, e.target.value)}
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
                              value={testimonial.name || ''}
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
                              value={testimonial.designation || ''}
                              onChange={(e) => handleTestimonialChange(index, 'designation', e.target.value)}
                              className="w-full p-2 border border-gray-300 rounded-md"
                            />
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Feedback
                            </label>
                            <textarea
                              value={testimonial.feedback || ''}
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
              
              {!landingPageData.features || landingPageData.features.length === 0 ? (
                <p className="text-gray-500 italic">No features added yet.</p>
              ) : (
                <ul className="space-y-3">
                  {landingPageData.features.map((feature, index) => (
                    <li key={index} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                      <div className="flex justify-between items-start">
                        <div className="space-y-3 w-full">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                              <span className="mr-1">English</span> 
                              <span className="px-1.5 py-0.5 text-xs rounded-full bg-blue-100 text-blue-700">EN</span>
                            </label>
                            <input
                              type="text"
                              value={getDisplayValue(feature, 'english')}
                              onChange={(e) => handleFeatureChange(index, 'english', e.target.value)}
                              className="w-full p-2 border border-gray-300 rounded-md"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                              <span className="mr-1">Marathi</span>
                              <span className="px-1.5 py-0.5 text-xs rounded-full bg-orange-100 text-orange-700">MR</span>
                            </label>
                            <input
                              type="text"
                              value={getDisplayValue(feature, 'marathi')}
                              onChange={(e) => handleFeatureChange(index, 'marathi', e.target.value)}
                              className="w-full p-2 border border-gray-300 rounded-md"
                            />
                          </div>
                        </div>
                        <button
                          onClick={() => removeFeature(index)}
                          className="ml-4 text-red-500 hover:text-red-700 self-start"
                          title="Remove feature"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            
            <div className="border-t border-gray-200 pt-6">
              <h3 className="text-lg font-medium text-gray-800 mb-4">Add New Feature</h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                    <span className="mr-1">English</span> 
                    <span className="px-1.5 py-0.5 text-xs rounded-full bg-blue-100 text-blue-700">EN</span>
                  </label>
                  <input
                    type="text"
                    value={newFeature.english}
                    onChange={(e) => handleNewFeatureChange('english', e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-md"
                    placeholder="Enter feature in English..."
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                    <span className="mr-1">Marathi</span>
                    <span className="px-1.5 py-0.5 text-xs rounded-full bg-orange-100 text-orange-700">MR</span>
                  </label>
                  <input
                    type="text"
                    value={newFeature.marathi}
                    onChange={(e) => handleNewFeatureChange('marathi', e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-md"
                    placeholder="Enter feature in Marathi..."
                  />
                </div>
                
                <div className="mt-2">
                  <button
                    onClick={addFeature}
                    disabled={!newFeature.english.trim() && !newFeature.marathi.trim()}
                    className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                  >
                    <Plus size={16} className="mr-2" />
                    Add Feature
                  </button>
                </div>
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
            <div className="space-y-4">
              <label className="block text-sm font-medium text-gray-700">
                CTA Text
              </label>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                    <span className="mr-1">English</span> 
                    <span className="px-1.5 py-0.5 text-xs rounded-full bg-blue-100 text-blue-700">EN</span>
                  </label>
                  <textarea
                    value={getDisplayValue(landingPageData.ctaText, 'english')}
                    onChange={(e) => handleInputChange('ctaText', null, e.target.value, 'english')}
                    rows="3"
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter CTA text in English..."
                  ></textarea>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                    <span className="mr-1">Marathi</span>
                    <span className="px-1.5 py-0.5 text-xs rounded-full bg-orange-100 text-orange-700">MR</span>
                  </label>
                  <textarea
                    value={getDisplayValue(landingPageData.ctaText, 'marathi')}
                    onChange={(e) => handleInputChange('ctaText', null, e.target.value, 'marathi')}
                    rows="3"
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter CTA text in Marathi..."
                  ></textarea>
                </div>
              </div>
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
  );
};

export default LandingPageManager;