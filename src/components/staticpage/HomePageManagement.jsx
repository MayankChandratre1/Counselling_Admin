import { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp, Plus, Trash2, Save, Search, Youtube } from 'lucide-react';
import axiosInstance from '../../utils/axios';
import { v4 as uuidv4 } from 'uuid';

const cloudName = 'dqt03lz3g'; // from Cloudinary dashboard
const uploadPreset = 'counselling'; // optional, if unsigned uploads

const HomePageManagement = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessages, setSuccessMessages] = useState({
    events: false,
    updates: false,
    colleges: false,
    banners: false
  });
  const [widgetLoading, setWidgetLoading] = useState(false);
  
  // Expanded state for each section
  const [expandedSections, setExpandedSections] = useState({
    events: false,
    updates: false,
    colleges: false,
    cutoff_video: false,
    banners: false
  });

  // Form data
  const [homePageData, setHomePageData] = useState({
    events: [],
    updates: [],
    recommended_colleges: [],
    cutoff_video: '',
    banners: []
  });

  // New items form data
  const [newEvent, setNewEvent] = useState({
    id: '',
    title: '',
    date: '',
    description: '',
    type: 'general',
    link: ''
  });

  const [newUpdate, setNewUpdate] = useState({
    id: '',
    title: '',
    subtitle: '',
    type: 'news',
    date: '',
    link: '',
    thumbnail: ''
  });
  const [newBanner, setNewBanner] = useState({
    id: '',
    title: '',
    url: '',
    bannerUrl: '',
    isInAppNavigation: false,
    isForCounsellingDashboard: false,
    html: ''
  });

  const [collegeSearch, setCollegeSearch] = useState('');
  const [collegeSearchResults, setCollegeSearchResults] = useState([]);
  const [searchingColleges, setSearchingColleges] = useState(false);

  useEffect(() => {
    fetchHomePageData();
  }, []);

 


  const fetchHomePageData = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get('/api/admin/get-home-page');
      setHomePageData({
        ...response.data,
      });
      setError(null);
    } catch (error) {
      console.error('Error fetching home page data:', error);
      setError('Failed to load home page data. Please try again.');
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

  // Event handlers
  const handleNewEventChange = (field, value) => {
    setNewEvent(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleEventChange = (index, field, value) => {
    const updatedEvents = [...homePageData.events];
    updatedEvents[index] = {
      ...updatedEvents[index],
      [field]: value
    };
    setHomePageData(prev => ({
      ...prev,
      events: updatedEvents
    }));
  };

  const addEvent = () => {
    if (newEvent.title && newEvent.date && newEvent.description) {
      setHomePageData(prev => ({
        ...prev,
        events: [
          ...prev.events,
          {
            ...newEvent,
            id: uuidv4()
          }
        ]
      }));
      // Reset the form
      setNewEvent({
        id: '',
        title: '',
        date: '',
        description: '',
        type: 'general',
        link: ''
      });
    }
  };

  const removeEvent = (index) => {
    const updatedEvents = [...homePageData.events];
    updatedEvents.splice(index, 1);
    setHomePageData(prev => ({
      ...prev,
      events: updatedEvents
    }));
  };

  // Update handlers
  const handleNewUpdateChange = (field, value) => {
    setNewUpdate(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleUpdateChange = (index, field, value) => {
    const updatedUpdates = [...homePageData.updates];
    updatedUpdates[index] = {
      ...updatedUpdates[index],
      [field]: value
    };
    setHomePageData(prev => ({
      ...prev,
      updates: updatedUpdates
    }));
  };

  const addUpdate = () => {
    if (newUpdate.title && newUpdate.date) {
      setHomePageData(prev => ({
        ...prev,
        updates: [
          ...prev.updates,
          {
            ...newUpdate,
            id: uuidv4()
          }
        ]
      }));
      // Reset the form
      setNewUpdate({
        id: '',
        title: '',
        subtitle: '',
        type: 'news',
        date: '',
        link: '',
        thumbnail: ''
      });
    }
  };

  const removeUpdate = (index) => {
    const updatedUpdates = [...homePageData.updates];
    updatedUpdates.splice(index, 1);
    setHomePageData(prev => ({
      ...prev,
      updates: updatedUpdates
    }));
  };

  // College search handlers
  const searchColleges = async () => {
    if (!collegeSearch.trim()) return;
    
    try {
      setSearchingColleges(true);
      const params = {};
      
      // Check if search is a number (institute code) or text (institute name)
      if (!isNaN(collegeSearch)) {
        params.instituteCode = collegeSearch;
      } else {
        params.instituteName = collegeSearch;
      }
      
      const response = await axiosInstance.get('/api/colleges/search', { params });
      setCollegeSearchResults(response.data.colleges || []);
    } catch (error) {
      console.error('Error searching colleges:', error);
      setCollegeSearchResults([]);
    } finally {
      setSearchingColleges(false);
    }
  };

  const addCollege = (college) => {
    if (homePageData.recommended_colleges.some(c => c.instituteCode === college.instituteCode)) {
      return; // Already added
    }
    
    setHomePageData(prev => ({
      ...prev,
      recommended_colleges: [...prev.recommended_colleges, college]
    }));
  };

  const removeCollege = (index) => {
    const updatedColleges = [...homePageData.recommended_colleges];
    updatedColleges.splice(index, 1);
    setHomePageData(prev => ({
      ...prev,
      recommended_colleges: updatedColleges
    }));
  };

  // Banner handlers
  const handleNewBannerChange = (field, value) => {
    setNewBanner(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleBannerChange = (index, field, value) => {
    const updatedBanners = [...homePageData.banners];
    updatedBanners[index] = {
      ...updatedBanners[index],
      [field]: value
    };
    setHomePageData(prev => ({
      ...prev,
      banners: updatedBanners
    }));
  };

   const openWidget = (index) => {
    setWidgetLoading(true);
  window.cloudinary.openUploadWidget(
    {
      cloudName,
      uploadPreset,
      sources: ['local', 'url', 'camera', 'image_search'],
      multiple: false,
      cropping: false,
      folder: 'banners', // optional: your desired folder
      resourceType: 'image',
    },
    (error, result) => {
      if (!error && result && result.event === 'success') {
        const imageUrl = result.info.secure_url;
        handleBannerChange(index, 'bannerUrl', imageUrl);
      }
      setWidgetLoading(false);
    }
  );
};

const openNewBannerWidget = () => {
  if (!window.cloudinary) return;
  setWidgetLoading(true);
  const widget = window.cloudinary.createUploadWidget(
    {
      cloudName, // 🔁 Replace this
      uploadPreset, // 🔁 Replace this
      sources: ['local', 'url', 'camera'],
      multiple: false,
      cropping: false,
      folder: 'banners',
    },
    (error, result) => {
      if (!error && result && result.event === 'success') {
        const imageUrl = result.info.secure_url;
        handleNewBannerChange('bannerUrl', imageUrl);
      }
      setWidgetLoading(false);
    }
  );

  widget.open();
};


  const addBanner = () => {
    if (newBanner.title && newBanner.bannerUrl) {
      setHomePageData(prev => ({
        ...prev,
        banners: [
          ...prev.banners,
          {
            ...newBanner,
            id: uuidv4()
          }
        ]
      }));
      // Reset the form
      setNewBanner({
        id: '',
        title: '',
        url: '',
        bannerUrl: '',
        isInAppNavigation: false,
        isForCounsellingDashboard: false,
        html: ''
      });
    }
  };

  const removeBanner = (index) => {
    const updatedBanners = [...homePageData.banners];
    updatedBanners.splice(index, 1);
    setHomePageData(prev => ({
      ...prev,
      banners: updatedBanners
    }));
  };

  // Save section data
  const saveSection = async (section) => {
    try {
      let dataToSave = {};
      
      // Only send the specific fields for each section
      switch (section) {
        case 'events':
          dataToSave = { events: homePageData.events };
          break;
        case 'updates':
          dataToSave = { updates: homePageData.updates };
          break;
        case 'colleges':
          dataToSave = { recommended_colleges: homePageData.recommended_colleges };
          break;
        case 'video':
          dataToSave = { cutoff_video: homePageData.cutoff_video };
          break;
        case 'banners':
          dataToSave = { banners: homePageData.banners };
          break;
        default:
          console.error('Unknown section:', section);
          return;
      }
      
      console.log(`Saving ${section} data:`, dataToSave);
      
      const response = await axiosInstance.post('/api/admin/update-home-page', {
        section,
        data: dataToSave
      });
      
      console.log('Save response:', response.data);
      
      // Refetch latest data to ensure UI is in sync
      await fetchHomePageData();
      
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

  return (
    <div className="max-w-4xl mx-auto">
      {error && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6">
          <p>{error}</p>
        </div>
      )}

      {/* Section 1: Events */}
      <div className="bg-white rounded-lg shadow-md mb-6 overflow-hidden">
        {renderSectionHeader('Events', 'events')}
        
        {expandedSections.events && (
          <div className="p-6 border-t border-gray-200">
            <div className="mb-6">
              <h3 className="text-lg font-medium text-gray-800 mb-4">Current Events</h3>
              
              {homePageData.events.length === 0 ? (
                <p className="text-gray-500 italic">No events added yet.</p>
              ) : (
                <div className="space-y-4">
                  {homePageData.events.map((event, index) => (
                    <div key={event.id} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                      <div className="flex justify-between items-start">
                        <div className="space-y-2 flex-1">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Title
                              </label>
                              <input
                                type="text"
                                value={event.title}
                                onChange={(e) => handleEventChange(index, 'title', e.target.value)}
                                className="w-full p-2 border border-gray-300 rounded-md"
                              />
                            </div>
                            
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Date
                              </label>
                              <input
                                type="date"
                                value={event.date}
                                onChange={(e) => handleEventChange(index, 'date', e.target.value)}
                                className="w-full p-2 border border-gray-300 rounded-md"
                              />
                            </div>
                            
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Type
                              </label>
                              <select
                                value={event.type}
                                onChange={(e) => handleEventChange(index, 'type', e.target.value)}
                                className="w-full p-2 border border-gray-300 rounded-md"
                              >
                                <option value="general">General</option>
                                <option value="webinar">Webinar</option>
                                <option value="workshop">Workshop</option>
                                <option value="seminar">Seminar</option>
                              </select>
                            </div>
                            
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Link (Optional)
                              </label>
                              <input
                                type="url"
                                value={event.link || ''}
                                onChange={(e) => handleEventChange(index, 'link', e.target.value)}
                                className="w-full p-2 border border-gray-300 rounded-md"
                                placeholder="https://..."
                              />
                            </div>
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Description
                            </label>
                            <textarea
                              value={event.description}
                              onChange={(e) => handleEventChange(index, 'description', e.target.value)}
                              rows="3"
                              className="w-full p-2 border border-gray-300 rounded-md"
                            ></textarea>
                          </div>
                        </div>
                        
                        <button
                          onClick={() => removeEvent(index)}
                          className="ml-4 text-red-500 hover:text-red-700"
                          title="Remove event"
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
              <h3 className="text-lg font-medium text-gray-800 mb-4">Add New Event</h3>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="newEventTitle" className="block text-sm font-medium text-gray-700 mb-1">
                      Title
                    </label>
                    <input
                      type="text"
                      id="newEventTitle"
                      value={newEvent.title}
                      onChange={(e) => handleNewEventChange('title', e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded-md"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="newEventDate" className="block text-sm font-medium text-gray-700 mb-1">
                      Date
                    </label>
                    <input
                      type="date"
                      id="newEventDate"
                      value={newEvent.date}
                      onChange={(e) => handleNewEventChange('date', e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded-md"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="newEventType" className="block text-sm font-medium text-gray-700 mb-1">
                      Type
                    </label>
                    <select
                      id="newEventType"
                      value={newEvent.type}
                      onChange={(e) => handleNewEventChange('type', e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded-md"
                    >
                      <option value="general">General</option>
                      <option value="webinar">Webinar</option>
                      <option value="workshop">Workshop</option>
                      <option value="seminar">Seminar</option>
                    </select>
                  </div>
                  
                  <div>
                    <label htmlFor="newEventLink" className="block text-sm font-medium text-gray-700 mb-1">
                      Link (Optional)
                    </label>
                    <input
                      type="url"
                      id="newEventLink"
                      value={newEvent.link}
                      onChange={(e) => handleNewEventChange('link', e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded-md"
                      placeholder="https://..."
                    />
                  </div>
                </div>
                
                <div>
                  <label htmlFor="newEventDescription" className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    id="newEventDescription"
                    value={newEvent.description}
                    onChange={(e) => handleNewEventChange('description', e.target.value)}
                    rows="3"
                    className="w-full p-2 border border-gray-300 rounded-md"
                  ></textarea>
                </div>
                
                <div>
                  <button
                    onClick={addEvent}
                    disabled={!newEvent.title || !newEvent.date || !newEvent.description}
                    className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                  >
                    <Plus size={16} className="mr-2" />
                    Add Event
                  </button>
                </div>
              </div>
            </div>
            
            <div className="mt-6 flex justify-end">
              <button
                onClick={() => saveSection('events')}
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                <Save size={16} className="mr-2" />
                Save Events
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Section 2: Updates */}
      <div className="bg-white rounded-lg shadow-md mb-6 overflow-hidden">
        {renderSectionHeader('Updates', 'updates')}
        
        {expandedSections.updates && (
          <div className="p-6 border-t border-gray-200">
            <div className="mb-6">
              <h3 className="text-lg font-medium text-gray-800 mb-4">Current Updates</h3>
              
              {homePageData.updates.length === 0 ? (
                <p className="text-gray-500 italic">No updates added yet.</p>
              ) : (
                <div className="space-y-4">
                  {homePageData.updates.map((update, index) => (
                    <div key={update.id} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                      <div className="flex justify-between items-start">
                        <div className="space-y-3 flex-1">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Title
                              </label>
                              <input
                                type="text"
                                value={update.title}
                                onChange={(e) => handleUpdateChange(index, 'title', e.target.value)}
                                className="w-full p-2 border border-gray-300 rounded-md"
                              />
                            </div>
                            
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Date
                              </label>
                              <input
                                type="date"
                                value={update.date}
                                onChange={(e) => handleUpdateChange(index, 'date', e.target.value)}
                                className="w-full p-2 border border-gray-300 rounded-md"
                              />
                            </div>
                            
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Type
                              </label>
                              <select
                                value={update.type}
                                onChange={(e) => handleUpdateChange(index, 'type', e.target.value)}
                                className="w-full p-2 border border-gray-300 rounded-md"
                              >
                                <option value="news">News</option>
                                <option value="video">Video</option>
                                <option value="event">Event</option>
                              </select>
                            </div>
                            
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Link (Optional)
                              </label>
                              <input
                                type="url"
                                value={update.link || ''}
                                onChange={(e) => handleUpdateChange(index, 'link', e.target.value)}
                                className="w-full p-2 border border-gray-300 rounded-md"
                                placeholder="https://..."
                              />
                            </div>
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Subtitle
                            </label>
                            <input
                              type="text"
                              value={update.subtitle || ''}
                              onChange={(e) => handleUpdateChange(index, 'subtitle', e.target.value)}
                              className="w-full p-2 border border-gray-300 rounded-md"
                            />
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Thumbnail URL (Optional)
                            </label>
                            <input
                              type="url"
                              value={update.thumbnail || ''}
                              onChange={(e) => handleUpdateChange(index, 'thumbnail', e.target.value)}
                              className="w-full p-2 border border-gray-300 rounded-md"
                              placeholder="https://example.com/image.jpg"
                            />
                          </div>
                        </div>
                        
                        <button
                          onClick={() => removeUpdate(index)}
                          className="ml-4 text-red-500 hover:text-red-700"
                          title="Remove update"
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
              <h3 className="text-lg font-medium text-gray-800 mb-4">Add New Update</h3>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="newUpdateTitle" className="block text-sm font-medium text-gray-700 mb-1">
                      Title
                    </label>
                    <input
                      type="text"
                      id="newUpdateTitle"
                      value={newUpdate.title}
                      onChange={(e) => handleNewUpdateChange('title', e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded-md"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="newUpdateDate" className="block text-sm font-medium text-gray-700 mb-1">
                      Date
                    </label>
                    <input
                      type="date"
                      id="newUpdateDate"
                      value={newUpdate.date}
                      onChange={(e) => handleNewUpdateChange('date', e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded-md"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="newUpdateType" className="block text-sm font-medium text-gray-700 mb-1">
                      Type
                    </label>
                    <select
                      id="newUpdateType"
                      value={newUpdate.type}
                      onChange={(e) => handleNewUpdateChange('type', e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded-md"
                    >
                      <option value="news">News</option>
                      <option value="video">Video</option>
                      <option value="event">Event</option>
                    </select>
                  </div>
                  
                  <div>
                    <label htmlFor="newUpdateLink" className="block text-sm font-medium text-gray-700 mb-1">
                      Link (Optional)
                    </label>
                    <input
                      type="url"
                      id="newUpdateLink"
                      value={newUpdate.link}
                      onChange={(e) => handleNewUpdateChange('link', e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded-md"
                      placeholder="https://..."
                    />
                  </div>
                </div>
                
                <div>
                  <label htmlFor="newUpdateSubtitle" className="block text-sm font-medium text-gray-700 mb-1">
                    Subtitle
                  </label>
                  <input
                    type="text"
                    id="newUpdateSubtitle"
                    value={newUpdate.subtitle}
                    onChange={(e) => handleNewUpdateChange('subtitle', e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-md"
                  />
                </div>
                
                <div>
                  <label htmlFor="newUpdateThumbnail" className="block text-sm font-medium text-gray-700 mb-1">
                    Thumbnail URL (Optional)
                  </label>
                  <input
                    type="url"
                    id="newUpdateThumbnail"
                    value={newUpdate.thumbnail}
                    onChange={(e) => handleNewUpdateChange('thumbnail', e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-md"
                    placeholder="https://example.com/image.jpg"
                  />
                </div>
                
                <div>
                  <button
                    onClick={addUpdate}
                    disabled={!newUpdate.title || !newUpdate.date}
                    className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                  >
                    <Plus size={16} className="mr-2" />
                    Add Update
                  </button>
                </div>
              </div>
            </div>
            
            <div className="mt-6 flex justify-end">
              <button
                onClick={() => saveSection('updates')}
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                <Save size={16} className="mr-2" />
                Save Updates
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Section 3: Recommended Colleges */}
      <div className="bg-white rounded-lg shadow-md mb-6 overflow-hidden">
        {renderSectionHeader('Recommended Colleges', 'colleges')}
        
        {expandedSections.colleges && (
          <div className="p-6 border-t border-gray-200">
            <div className="mb-6">
              <h3 className="text-lg font-medium text-gray-800 mb-4">Current Recommended Colleges</h3>
              
              {homePageData.recommended_colleges.length === 0 ? (
                <p className="text-gray-500 italic">No colleges added yet.</p>
              ) : (
                <ul className="space-y-2">
                  {homePageData.recommended_colleges.map((college, index) => (
                    <li key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-md">
                      <div className="flex items-center">
                        <span className="font-medium">Institute Code:</span>
                        <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-800 rounded-md">{college.instituteCode}: {college.instituteName}</span>
                      </div>
                      <button
                        onClick={() => {
                            console.log('Remove college:', homePageData.recommended_colleges);
                            removeCollege(index);
                            
                        }}
                        className="text-red-500 hover:text-red-700"
                        title="Remove college"
                      >
                        <Trash2 size={16} />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            
            <div className="border-t border-gray-200 pt-6">
              <h3 className="text-lg font-medium text-gray-800 mb-4">Add New College</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Search College by Name or Institute Code
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={collegeSearch}
                      onChange={(e) => setCollegeSearch(e.target.value)}
                      className="w-full p-2 pl-10 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Search..."
                    />
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                    <button
                      onClick={searchColleges}
                      disabled={!collegeSearch.trim() || searchingColleges}
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 px-2 py-1 bg-blue-600 text-white rounded text-sm disabled:bg-gray-400"
                    >
                      {searchingColleges ? 'Searching...' : 'Search'}
                    </button>
                  </div>
                </div>
                
                {collegeSearchResults.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Search Results</h4>
                    <div className="max-h-64 overflow-y-auto border border-gray-200 rounded-md">
                      <ul className="divide-y divide-gray-200">
                        {collegeSearchResults.map((college) => (
                          <li 
                            key={college.id} 
                            className="p-3 hover:bg-gray-50 flex justify-between items-center"
                          >
                            <div>
                              <p className="font-medium">{college.instituteName}</p>
                              <div className="flex items-center text-sm text-gray-500">
                                <span className="bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded text-xs mr-2">
                                  {college.instituteCode}
                                </span>
                                <span>{college.city}</span>
                              </div>
                            </div>
                            <button
                              onClick={() => addCollege(college)}
                              disabled={homePageData.recommended_colleges.includes(college.instituteCode)}
                              className={`px-3 py-1 rounded text-sm ${
                                homePageData.recommended_colleges.includes(college.instituteCode)
                                  ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                                  : 'bg-green-600 text-white hover:bg-green-700'
                              }`}
                            >
                              {homePageData.recommended_colleges.includes(college.instituteCode)
                                ? 'Added'
                                : 'Add'
                              }
                            </button>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            <div className="mt-6 flex justify-end">
              <button
                onClick={() => saveSection('colleges')}
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                <Save size={16} className="mr-2" />
                Save Recommended Colleges
              </button>
            </div>
          </div>
        )}
      </div>
       {/* Section 2: Youtube Video URL */}
      <div className="bg-white rounded-lg shadow-md mb-6 overflow-hidden">
        {renderSectionHeader('Cutoff video', 'cutoff_video')}
        
        {expandedSections.cutoff_video && (
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
                  value={homePageData.cutoff_video || ''}
                  onChange={(e) => setHomePageData(prev => ({
                    ...prev,
                    cutoff_video: e.target.value
                  }))}
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

      {/* Section: Banners */}
      <div className="bg-white rounded-lg shadow-md mb-6 overflow-hidden">
        {renderSectionHeader('Banners', 'banners')}
        
        {expandedSections.banners && (
          <div className="p-6 border-t border-gray-200">
            <div className="mb-6">
              <h3 className="text-lg font-medium text-gray-800 mb-4">Current Banners</h3>
              
              {homePageData.banners.length === 0 ? (
                <p className="text-gray-500 italic">No banners added yet.</p>
              ) : (
                <div className="space-y-4">
                  {homePageData.banners.map((banner, index) => (
                    <div key={banner.id} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                      <div className="flex justify-between items-start">
                        <div className="space-y-3 flex-1">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Title
                              </label>
                              <input
                                type="text"
                                value={banner.title}
                                onChange={(e) => handleBannerChange(index, 'title', e.target.value)}
                                className="w-full p-2 border border-gray-300 rounded-md"
                              />
                            </div>
                            
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                URL (Optional)
                              </label>
                              <input
                                type="url"
                                value={banner.url || ''}
                                onChange={(e) => handleBannerChange(index, 'url', e.target.value)}
                                className="w-full p-2 border border-gray-300 rounded-md"
                                placeholder="https://..."
                              />
                            </div>
                          </div>
                          
                          <div>
  <label className="block text-sm font-medium text-gray-700 mb-1">
    Banner Image URL
  </label>
  <div className="flex gap-2">
    <input
      type="url"
      value={banner.bannerUrl || ''}
      onChange={(e) => handleBannerChange(index, 'bannerUrl', e.target.value)}
      className="flex-1 p-2 border border-gray-300 rounded-md"
      placeholder="https://example.com/image.jpg"
    />
    <button
      type="button"
      onClick={() => openWidget(index)}
      className="px-3 py-1 text-sm bg-blue-600 text-white rounded-md"
    >
      {
        widgetLoading ? "Opening...":"Upload"
      }
    </button>
  </div>

  {banner.bannerUrl && (
    <div className="mt-2">
      <img
        src={banner.bannerUrl}
        alt="Banner preview"
        className="h-30 w-60 object-cover rounded-md border"
      />
    </div>
  )}
</div>

                          
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              HTML (Optional)
                            </label>
                            <textarea
                              value={banner.html || ''}
                              onChange={(e) => handleBannerChange(index, 'html', e.target.value)}
                              className="w-full p-2 border border-gray-300 rounded-md"
                              rows="3"
                              placeholder="Custom HTML content"
                            />
                          </div>
                          
                          <div className="flex gap-4">
                            <label className="flex items-center">
                              <input
                                type="checkbox"
                                checked={banner.isInAppNavigation || false}
                                onChange={(e) => handleBannerChange(index, 'isInAppNavigation', e.target.checked)}
                                className="mr-2"
                              />
                              <span className="text-sm text-gray-700">In-App Navigation</span>
                            </label>
                            
                            <label className="flex items-center">
                              <input
                                type="checkbox"
                                checked={banner.isForCounsellingDashboard || false}
                                onChange={(e) => handleBannerChange(index, 'isForCounsellingDashboard', e.target.checked)}
                                className="mr-2"
                              />
                              <span className="text-sm text-gray-700">For Counselling Dashboard</span>
                            </label>
                          </div>
                        </div>
                        
                        <button
                          onClick={() => removeBanner(index)}
                          className="ml-4 text-red-500 hover:text-red-700"
                          title="Remove banner"
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
              <h3 className="text-lg font-medium text-gray-800 mb-4">Add New Banner</h3>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="newBannerTitle" className="block text-sm font-medium text-gray-700 mb-1">
                      Title
                    </label>
                    <input
                      type="text"
                      id="newBannerTitle"
                      value={newBanner.title}
                      onChange={(e) => handleNewBannerChange('title', e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded-md"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="newBannerUrl" className="block text-sm font-medium text-gray-700 mb-1">
                      URL (Optional)
                    </label>
                    <input
                      type="url"
                      id="newBannerUrl"
                      value={newBanner.url}
                      onChange={(e) => handleNewBannerChange('url', e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded-md"
                      placeholder="https://..."
                    />
                  </div>
                </div>
                
                <div>
  <label htmlFor="newBannerImageUrl" className="block text-sm font-medium text-gray-700 mb-1">
    Banner Image URL
  </label>

  <div className="flex gap-2">
    <input
      type="url"
      id="newBannerImageUrl"
      value={newBanner.bannerUrl}
      onChange={(e) => handleNewBannerChange('bannerUrl', e.target.value)}
      className="flex-1 p-2 border border-gray-300 rounded-md"
      placeholder="https://example.com/image.jpg"
    />
    <button
      type="button"
      onClick={openNewBannerWidget}
      className="px-3 py-1 text-sm bg-blue-600 text-white rounded-md"
    >
      {
        widgetLoading ? "Opening...":"Upload"
      }
    </button>
  </div>

  {newBanner.bannerUrl && (
    <div className="mt-2">
      <img
        src={newBanner.bannerUrl}
        alt="Banner preview"
        className="h-30 w-60 object-stretch rounded-md border"
      />
    </div>
  )}
</div>

                
                <div>
                  <label htmlFor="newBannerHtml" className="block text-sm font-medium text-gray-700 mb-1">
                    HTML (Optional)
                  </label>
                  <textarea
                    id="newBannerHtml"
                    value={newBanner.html}
                    onChange={(e) => handleNewBannerChange('html', e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-md"
                    rows="3"
                    placeholder="Custom HTML content"
                  />
                </div>
                
                <div className="flex gap-4">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={newBanner.isInAppNavigation}
                      onChange={(e) => handleNewBannerChange('isInAppNavigation', e.target.checked)}
                      className="mr-2"
                    />
                    <span className="text-sm text-gray-700">In-App Navigation</span>
                  </label>
                  
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={newBanner.isForCounsellingDashboard}
                      onChange={(e) => handleNewBannerChange('isForCounsellingDashboard', e.target.checked)}
                      className="mr-2"
                    />
                    <span className="text-sm text-gray-700">For Counselling Dashboard</span>
                  </label>
                </div>
                
                <div>
                  <button
                    onClick={addBanner}
                    disabled={!newBanner.title || !newBanner.bannerUrl}
                    className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                  >
                    <Plus size={16} className="mr-2" />
                    Add Banner
                  </button>
                </div>
              </div>
            </div>
            
            <div className="mt-6 flex justify-end">
              <button
                onClick={() => saveSection('banners')}
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                <Save size={16} className="mr-2" />
                Save Banners
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default HomePageManagement;