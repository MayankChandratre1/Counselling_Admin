import React, { useState, useEffect, useRef } from 'react';
import axiosInstance from '../../utils/axios';
import { Plus } from 'lucide-react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';

// Import extracted components
import ListCard from './ListCard';
import NoListsPlaceholder from './NoListsPlaceholder';
import BackButton from './BackButton';
import ListFormModal from './ListFormModal';
import LoadingSpinner from '../common/LoadingSpinner';

const PREDEFINED_CATEGORIES =[
  "AI",
  "DEFOBCS",
  "DEFOPENS",
  "DEFRNT1S",
  "DEFRNT2S",
  "DEFRNT3S",
  "DEFROBCS",
  "DEFRSCS",
  "DEFRSEBC",
  "DEFRVJS",
  "DEFSCS",
  "DEFSEBCS",
  "DEFSTS",
  "EWS",
  "GNT1H",
  "GNT1O",
  "GNT1S",
  "GNT2H",
  "GNT2O",
  "GNT2S",
  "GNT3H",
  "GNT3O",
  "GNT3S",
  "GOBCH",
  "GOBCO",
  "GOBCS",
  "GOPENH",
  "GOPENO",
  "GOPENS",
  "GSCH",
  "GSCO",
  "GSCS",
  "GSEBCH",
  "GSEBCO",
  "GSEBCS",
  "GSTH",
  "GSTO",
  "GSTS",
  "GVJH",
  "GVJO",
  "GVJS",
  "LNT1H",
  "LNT1O",
  "LNT1S",
  "LNT2H",
  "LNT2S",
  "LNT3H",
  "LNT3S",
  "LOBCH",
  "LOBCO",
  "LOBCS",
  "LOPENH",
  "LOPENO",
  "LOPENS",
  "LSCH",
  "LSCO",
  "LSCS",
  "LSEBCH",
  "LSEBCO",
  "LSEBCS",
  "LSTH",
  "LSTO",
  "LSTS",
  "LVJH",
  "LVJO",
  "LVJS",
  "MI",
  "ORPHAN",
  "PWDOBCH",
  "PWDOBCS",
  "PWDOPENH",
  "PWDOPENS",
  "PWDRNT1H",
  "PWDRNT1S",
  "PWDRNT2S",
  "PWDRNT3S",
  "PWDROBC",
  "PWDRSCH",
  "PWDRSCS",
  "PWDRSEBC",
  "PWDRSTH",
  "PWDRSTS",
  "PWDRVJS",
  "PWDSCH",
  "PWDSCS",
  "PWDSEBCH",
  "PWDSEBCS",
  "PWDSTS",
  "SDEFRNT1S",
  "SDEFRNT2S",
  "SDEFRNT3S",
  "SDEFROBCS",
  "SDEFRSCS",
  "SDEFRSEBC",
  "SDEFRVJS",
  "SEWS",
  "SORPHAN",
  "TFWS"
]

const PREDEFINED_CITIES=[
  "ahmednagar",
  "akola",
  "amravati",
  "beed",
  "bhandara",
  "buldhana",
  "chandrapur",
  "chhatrapati sambhajinagar",
  "dharashiv",
  "dhule",
  "dist",
  "district",
  "jalgaon",
  "jalna",
  "karjat",
  "kolhapur",
  "latur",
  "malwadi-bota",
  "mumbai",
  "mumbai city",
  "mumbai suburban",
  "nadurbar",
  "nagpur",
  "nanded",
  "nandurbar",
  "nashik",
  "pal",
  "palghar",
  "paniv",
  "parbhani",
  "pune",
  "raigad",
  "ratnagiri",
  "sakoli",
  "sangli",
  "satara",
  "shevgaon",
  "shirpur",
  "sindhudurg",
  "solapur",
  "thane",
  "wardha",
  "washim",
  "yavatmal",
  "yelur"
]

const PREDEFINED_BRANCHES =[
  "5G",
  "Aeronautical Engineering",
  "Agricultural Engineering",
  "Architectural Assistantship",
  "Artificial Intelligence",
  "Artificial Intelligence (AI) and Data Science",
  "Artificial Intelligence and Data Science",
  "Artificial Intelligence and Machine Learning",
  "Automation and Robotics",
  "Automobile Engineering",
  "Bio Medical Engineering",
  "Bio Technology",
  "Chemical Engineering",
  "Civil Engineering",
  "Civil Engineering (Structural Engineering)",
  "Civil Engineering and Planning",
  "Civil and Environmental Engineering",
  "Civil and infrastructure Engineering",
  "Computer Engineering",
  "Computer Engineering (Software Engineering)",
  "Computer Science",
  "Computer Science and Business Systems",
  "Computer Science and Design",
  "Computer Science and Engineering",
  "Computer Science and Engineering (Artificial Intelligence and Data Science)",
  "Computer Science and Engineering (Artificial Intelligence)",
  "Computer Science and Engineering (Cyber Security)",
  "Computer Science and Engineering (Internet of Things and Cyber Security Including Block Chain",
  "Computer Science and Engineering (IoT)",
  "Computer Science and Engineering(Artificial Intelligence and Machine Learning)",
  "Computer Science and Engineering(Cyber Security)",
  "Computer Science and Engineering(Data Science)",
  "Computer Science and Information Technology",
  "Computer Science and Technology",
  "Computer Technology",
  "Cyber Security",
  "Data Engineering",
  "Data Science",
  "Dyestuff Technology",
  "Electrical Engg [Electrical and Power]",
  "Electrical Engg[Electronics and Power]",
  "Electrical Engineering",
  "Electrical and Computer Engineering",
  "Electrical and Electronics Engineering",
  "Electrical, Electronics and Power",
  "Electronics Engineering",
  "Electronics Engineering ( VLSI Design and Technology)",
  "Electronics and Biomedical Engineering",
  "Electronics and Communication (Advanced Communication Technology)",
  "Electronics and Communication Engineering",
  "Electronics and Communication(Advanced Communication Technology)",
  "Electronics and Computer Engineering",
  "Electronics and Computer Science",
  "Electronics and Telecommunication Engg",
  "Fashion Technology",
  "Fibres and Textile Processing Technology",
  "Fire Engineering",
  "Food Engineering",
  "Food Engineering and Technology",
  "Food Technology",
  "Food Technology And Management",
  "Industrial IoT",
  "Information Technology",
  "Instrumentation Engineering",
  "Instrumentation and Control Engineering",
  "Internet of Things (IoT)",
  "Logistics",
  "Man Made Textile Technology",
  "Manufacturing Science and Engineering",
  "Mechanical & Automation Engineering",
  "Mechanical Engineering",
  "Mechanical Engineering Automobile",
  "Mechanical Engineering[Sandwich]",
  "Mechanical and Automation Engineering",
  "Mechanical and Mechatronics Engineering (Additive Manufacturing)",
  "Mechatronics Engineering",
  "Metallurgy and Material Technology",
  "Mining Engineering",
  "Oil Fats and Waxes Technology",
  "Oil Technology",
  "Oil and Paints Technology",
  "Oil,Oleochemicals and Surfactants Technology",
  "Paints Technology",
  "Paper and Pulp Technology",
  "Petro Chemical Engineering",
  "Pharmaceutical and Fine Chemical Technology",
  "Pharmaceuticals Chemistry and Technology",
  "Plastic Technology",
  "Plastic and Polymer Engineering",
  "Polymer Engineering and Technology",
  "Printing Technology",
  "Printing and Packing Technology",
  "Production Engineering",
  "Production Engineering[Sandwich]",
  "Robotics and Artificial Intelligence",
  "Robotics and Automation",
  "Safety and Fire Engineering",
  "Structural Engineering",
  "Surface Coating Technology",
  "Technical Textiles",
  "Textile Chemistry",
  "Textile Engineering / Technology",
  "Textile Plant Engineering",
  "Textile Technology",
  "VLSI"
]

const ListsManagement = () => {
  const [lists, setLists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingList, setEditingList] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    items: [],
    userIds: [],
    category: PREDEFINED_CATEGORIES[0]
  });
  const [newItem, setNewItem] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedColleges, setSelectedColleges] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [expandedListId, setExpandedListId] = useState(null);
  const [usersInList, setUsersInList] = useState({});
  const [availableCities, setAvailableCities] = useState(PREDEFINED_CITIES.map(c => c.toLowerCase()));
  const [showCityFilter, setShowCityFilter] = useState(false);
  const [selectedCity, setSelectedCity] = useState('');
  const [availableBranches, setAvailableBranches] = useState(PREDEFINED_BRANCHES);
  const [showBranchFilter, setShowBranchFilter] = useState(false);
  const [selectedBranch, setSelectedBranch] = useState('');
  const [expandedColleges, setExpandedColleges] = useState({});
  const [citySearchInput, setCitySearchInput] = useState('');
  const [branchSearchInput, setBranchSearchInput] = useState('');
  const [filteredCities, setFilteredCities] = useState([]);
  const [filteredBranches, setFilteredBranches] = useState([]);
  const searchTimeoutRef = useRef(null);
  const [selectedCategory, setSelectedCategory] = useState(PREDEFINED_CATEGORIES[0]);
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [showTemplateSelection, setShowTemplateSelection] = useState(false);

  useEffect(() => {
    fetchLists();
  }, []);

  const fetchLists = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get('/api/admin/lists');
      setLists(response.data);
      
      // Fetch user details for each list that has users
      const usersToFetch = new Set();
      response.data.forEach(list => {
        if (list.userIds && list.userIds.length > 0) {
          list.userIds.forEach(userId => usersToFetch.add(userId));
        }
      });
      
      if (usersToFetch.size > 0) {
        // Fetch details for all users in batches
        const userDetails = {};
        // In a real app, you might want to batch these requests
        for (const userId of usersToFetch) {
          try {
            const userResponse = await axiosInstance.get(`/api/admin/user/${userId}`);
            userDetails[userId] = userResponse.data;
          } catch (err) {
            console.error(`Error fetching user ${userId}:`, err);
            userDetails[userId] = { name: 'Unknown user', id: userId };
          }
        }
        setUsersInList(userDetails);
      }
      
      setError(null);
    } catch (err) {
      setError('Failed to fetch lists');
      console.error('Error fetching lists:', err);
    } finally {
      setLoading(false);
    }
  };

  



  const handleBranchSelect = (branch) => {
    setSelectedBranch(branch);
    setShowBranchFilter(false);
    
    if (branch || selectedCity) {
      searchColleges(searchQuery, selectedCity, branch);
    } else {
      setSearchResults([]);
    }
  };

  const handleCitySelect = (city) => {
    setSelectedCity(city);
    setShowCityFilter(false);
    
    if (city || selectedBranch) {
      searchColleges(searchQuery, city, selectedBranch);
    } else {
      setSearchResults([]);
    }
  };

  const handleEdit = (list) => {
    setEditingList(list);
    openModal(list);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this list?')) {
      try {
        await axiosInstance.delete(`/api/admin/delete-list/${id}`);
        setLists(lists.filter(list => list.id !== id));
      } catch (err) {
        setError('Failed to delete list');
      }
    }
  };

  const handleAddItem = () => {
    if (newItem.trim()) {
      setFormData({
        ...formData,
        items: [...formData.items, newItem.trim()]
      });
      setNewItem('');
    }
  };

  const handleRemoveItem = (index) => {
    setFormData({
      ...formData,
      items: formData.items.filter((_, i) => i !== index)
    });
  };

  // Improve the search function to properly handle city and branch filters togethernal
  const searchColleges = async (query, cityFilter = selectedCity, branchFilter = selectedBranch) => {
    try {
      setIsSearching(true);
      
      // Build query parameters
      const params = {};
      if (query) {
        if (!isNaN(query)) {
          params.instituteCode = query;
        } else {
          params.instituteName = query;
        }
      }
      
      // Add city as an optional filter
      if (cityFilter) {
        params.city = cityFilter;
      }
      
      // Always make the API call regardless of whether we have parameters
      // This allows searching all colleges when no filters are applied
      const response = await axiosInstance.get('/api/colleges/search', { params });
      let results = response.data.colleges;
      
      // If branch filter is applied, filter colleges with matching branches on client side
      // This is because branch is a nested property that might be harder to filter on the backend
      if (branchFilter) {
        const newExpandedColleges = {};
        
        results = results.filter(college => {
          if (college.branches && college.branches.some(branch => 
            branch.branchName.toLowerCase().includes(branchFilter.toLowerCase())
          )) {
            // Auto-expand colleges with matching branches
            newExpandedColleges[college.id] = true;
            return true;
          }
          return false;
        });
        
        // Update expanded colleges state
        setExpandedColleges(prev => ({...prev, ...newExpandedColleges}));
      }
      
      setSearchResults(results);
    } catch (err) {
      console.error('Error searching colleges:', err);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  // Update the search input to trigger search on every change
  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchQuery(value);
    // Debounce the search to avoid too many requests
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    searchTimeoutRef.current = setTimeout(() => {
      searchColleges(value, selectedCity, selectedBranch);
    }, 1000);
  };

  // Modify the add college to list functionality
  
  const addCollegeToList = (college, branch = null, batchColleges = null) => {
    if (batchColleges) {
      // Handle batch addition
      setSelectedColleges(prev => [...prev, ...batchColleges]);
      return;
    }

    // Handle single college addition (existing logic)
    const uniqueId = branch ? `${college.id}_${branch.branchCode}` : college.id;
    if (!selectedColleges.some(c => 
      (branch && c.id === college.id && c.selectedBranchCode === branch.branchCode) ||
      (!branch && c.id === college.id && !c.selectedBranchCode)
    )) {
      const collegeToAdd = {
        ...college,
        uniqueId,
        selectedBranch: branch ? branch.branchName : null,
        selectedBranchCode: branch ? branch.branchCode : null
      };
      setSelectedColleges([...selectedColleges, collegeToAdd]);
    }
  };

  // Fix the removeCollegeFromList function to use index instead of id and branchCode
  const removeCollegeFromList = (index) => {
    const updatedColleges = [...selectedColleges];
    updatedColleges.splice(index, 1);
    setSelectedColleges(updatedColleges);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const submitData = {
        title: formData.title,
        colleges: selectedColleges.map(college => ({
          ...college,
          category: selectedCategory, // Add category to each college
          branches: undefined, // Remove branches from the college object before sending,
          searchIndex: undefined, // Remove searchIndex if it exists
          additionalMetadata: undefined, // Remove additional metadata if it exists,
          keywords: undefined,
        })),
        userIds: formData.userIds || [],
        category: selectedCategory
      };

      if (editingList?.id) {
        await axiosInstance.post(`/api/admin/edit-list/${editingList.id}`, submitData);
        setLists(lists.map(list => 
          list.id === editingList.id ? { ...list, ...submitData } : list
        ));
      } else {
        const response = await axiosInstance.post('/api/admin/add-list', submitData);
        setLists([...lists, response.data]);
      }
      setShowModal(false);
      setEditingList(null);
      setFormData({ title: '' });
      setSelectedColleges([]);
    } catch (err) {
      console.log(err);
      
      setError('Failed to save list');
    }
  };

  const handleAppendColleges = async (exportedColleges = []) => {
    e.preventDefault();
    try {
      const submitData = {
        title: formData.title,
        colleges: exportedColleges.map(college => {
        }),
        userIds: formData.userIds || [],
        category: selectedCategory
      };

      if (editingList?.id) {
        await axiosInstance.post(`/api/admin/edit-list/${editingList.id}`, submitData);
        setLists(lists.map(list => 
          list.id === editingList.id ? { ...list, ...submitData } : list
        ));
      } else {
        const response = await axiosInstance.post('/api/admin/add-list', submitData);
        setLists([...lists, response.data]);
      }
      setShowModal(false);
      setEditingList(null);
      setFormData({ title: '' });
      setSelectedColleges([]);
    } catch (err) {
      console.log(err);
      
      setError('Failed to save list');
    }
  };

  const openModal = (list = null) => {
    if (list) {
      setFormData({
        title: list.title || ''
      });
      setSelectedColleges(list.colleges || []);
      setEditingList(list);
      setShowTemplateSelection(false);
      setSelectedTemplate('');
    } else {
      setFormData({ title: '' });
      setSelectedColleges([]);
      setEditingList(null);
      setSelectedTemplate('');
      setShowTemplateSelection(true); // Show template selection for new lists
    }
    setShowModal(true);
  };

  const handleTemplateSelect = (templateId) => {
    if (templateId === '') {
      // No template selected
      setSelectedColleges([]);
      setSelectedTemplate('');
      setShowTemplateSelection(false);
      return;
    }

    const templateList = lists.find(list => list.id === templateId);
    if (templateList && templateList.colleges) {
      setSelectedColleges([...templateList.colleges]); // Copy colleges from template
      setSelectedTemplate(templateId);
      setShowTemplateSelection(false);
      // Set the category from template as well
      if (templateList.category) {
        setSelectedCategory(templateList.category);
      }
    }
  };

  const resetToTemplate = () => {
    setShowTemplateSelection(true);
    setSelectedTemplate('');
    setSelectedColleges([]);
  };

  const moveItem = (dragIndex, hoverIndex) => {
    const dragItem = formData.items[dragIndex];
    const newItems = [...formData.items];
    newItems.splice(dragIndex, 1);
    newItems.splice(hoverIndex, 0, dragItem);
    setFormData({
      ...formData,
      items: newItems
    });
  };

  const moveCollege = (dragIndex, hoverIndex) => {
    const dragCollege = selectedColleges[dragIndex];
    const newColleges = [...selectedColleges];
    newColleges.splice(dragIndex, 1);
    newColleges.splice(hoverIndex, 0, dragCollege);
    setSelectedColleges(newColleges);
  };

  const handleListClick = (listId) => {
    setExpandedListId(expandedListId === listId ? null : listId);
  };

  // Add toggle function for college branches
  const toggleCollegeBranches = (collegeId) => {
    setExpandedColleges(prev => ({
      ...prev,
      [collegeId]: !prev[collegeId]
    }));
  };

  // Filter cities based on search input
  useEffect(() => {
    if (citySearchInput) {
      const filtered = availableCities.filter(city => 
        city.toLowerCase().includes(citySearchInput.toLowerCase())
      );
      setFilteredCities(filtered);
    } else {
      setFilteredCities(availableCities);
    }
  }, [citySearchInput, availableCities]);

  // Filter branches based on search input
  useEffect(() => {
    if (branchSearchInput) {
      const filtered = availableBranches.filter(branch => 
        branch.toLowerCase().includes(branchSearchInput.toLowerCase())
      );
      setFilteredBranches(filtered);
    } else {
      setFilteredBranches(availableBranches);
    }
  }, [branchSearchInput, availableBranches]);

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="p-6 bg-gray-50 min-h-screen">
        <div className="max-w-6xl mx-auto">
          {/* Show back button when a list is expanded */}
          {expandedListId && <BackButton onClick={() => setExpandedListId(null)} />}

          {/* Header section */}
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-gray-800">
              {expandedListId ? 'List Details' : 'Lists Management'}
            </h1>
            {!expandedListId && (
              <button
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center shadow-sm"
                onClick={() => openModal()}
              >
                <Plus size={20} className="mr-2" />
                Add New List
              </button>
            )}
          </div>

          {error && (
            <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6 rounded-r-md shadow-sm">
              {error}
            </div>
          )}

          {/* List Form Modal */}
          {showModal && (
            <ListFormModal
              editingList={editingList}
              formData={formData}
              setFormData={setFormData}
              handleSubmit={handleSubmit}
              closeModal={() => {
                setShowModal(false);
                setSelectedTemplate('');
                setShowTemplateSelection(false);
              }}
              selectedColleges={selectedColleges}
              setSelectedColleges={setSelectedColleges}
              searchQuery={searchQuery}
              handleSearchChange={handleSearchChange}
              isSearching={isSearching}
              searchResults={searchResults}
              searchColleges={searchColleges}
              addCollegeToList={addCollegeToList}
              citySearchInput={citySearchInput}
              setCitySearchInput={setCitySearchInput}
              showCityFilter={showCityFilter}
              setShowCityFilter={setShowCityFilter}
              handleCitySelect={handleCitySelect}
              filteredCities={filteredCities}
              selectedCity={selectedCity}
              branchSearchInput={branchSearchInput}
              setBranchSearchInput={setBranchSearchInput}
              showBranchFilter={showBranchFilter}
              setShowBranchFilter={setShowBranchFilter}
              handleBranchSelect={handleBranchSelect}
              filteredBranches={filteredBranches}
              selectedBranch={selectedBranch}
              moveCollege={moveCollege}
              removeCollegeFromList={removeCollegeFromList}
              selectedCategory={selectedCategory}
              setSelectedCategory={setSelectedCategory}
              categories={PREDEFINED_CATEGORIES}
              // Template selection props
              showTemplateSelection={showTemplateSelection}
              selectedTemplate={selectedTemplate}
              availableTemplates={lists}
              onTemplateSelect={handleTemplateSelect}
              onResetToTemplate={resetToTemplate}
            />
          )}

          {/* Lists Grid */}
          <div className="grid lg:grid-cols-3 gap-6">
            {lists.length > 0 ? (
              lists.map((list) => (
                <ListCard 
                  key={list.id}
                  list={list}
                  expandedListId={expandedListId}
                  handleListClick={handleListClick}
                  handleEdit={handleEdit}
                  handleDelete={handleDelete}
                />
              ))
            ) : (
              <NoListsPlaceholder openModal={openModal} />
            )}
          </div>
        </div>
      </div>
    </DndProvider>
  );
};

export default ListsManagement;