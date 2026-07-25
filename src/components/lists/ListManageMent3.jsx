import React, { useState, useEffect, useRef, useCallback } from 'react';
import axiosInstance from '../../utils/axios';
import { Plus, ChevronDown, ChevronRight, Lock, Archive, Folder, FolderOpen } from 'lucide-react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';

// Import extracted components
import ListCard from './ListCard';
import NoListsPlaceholder from './NoListsPlaceholder';
import BackButton from './BackButton';
import ListFormModal from './ListFormModal';
import LoadingSpinner from '../common/LoadingSpinner';
import { useLists } from '../../contexts/ListsContext';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import ListFormModalForUsers from './ListFormModalForUsers';

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

const ListsManagement3 = ({list, user, users, setSelectedUsersCreatedLists, setUsers, setSelectedUserLists, selectedUserLists, selectedUsersCreatedLists, isCreatedList}) => {
  console.log("isCreaetedList:", isCreatedList);
  
  const [lists, setLists] = useState([]);
  const [folders, setFolders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingList, setEditingList] = useState(list) || null;
  const [showModal, setShowModal] = useState(true);
  const [showFolderModal, setShowFolderModal] = useState(false);
  const [editingFolder, setEditingFolder] = useState(null);
  const [folderFormData, setFolderFormData] = useState({
    name: '',
    description: ''
  });
  const [formData, setFormData] = useState({
    title: '',
    items: [],
    userIds: [],
    category: PREDEFINED_CATEGORIES[0],
    folderId: ''
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
  const [expandedFolders, setExpandedFolders] = useState({});
  const navigation = useNavigate()
  const [activeTab, setActiveTab] = useState('folders'); // Add new state for active tab
  const [copiedCodes, setCopiedCodes] = useState({}); // Track copied codes by list and college ID
  const [loadingLists, setLoadingLists] = useState(false); // New loading state for list operations
  const [editingUserList, setEditingUserList] = useState(null); // State to manage user list editing
  const [showEditListModal, setShowEditListModal] = useState(false); // Modal for editing user lists
  const [selectedUserListsId, setSelectedUserListsId] = useState(null); // For tracking selected user list ID

  useEffect(() => {
        if(list) {
            if (list) {
                setEditingList(list);
                setFormData({
                    title: list.title || '',
                    items: list.colleges || [],
                    userIds: list.userIds || [],
                    category: user.counsellingData?.category || PREDEFINED_CATEGORIES[0]
                });
                setSelectedColleges(list.colleges || []);
                setShowModal(true);
            }
        }
  }, [list,user]);

  useEffect(()=>{
    if(user){
      if(user.counsellingData?.category) {
        const categories = PREDEFINED_CATEGORIES.filter(c => c.toLowerCase().includes("g"+user.counsellingData.category.toLowerCase()+"h"));
        console.log('Filtered categories:', categories);
        
        setSelectedCategory(categories[0] || PREDEFINED_CATEGORIES[0]);
      }
    }
  },[user])

  useEffect(() => {
    fetchLists();
    fetchFolders();
  }, []);



  const fetchFolders = async () => {
    try {
      const response = await axiosInstance.get('/api/admin/list-folders');
      setFolders(response.data);
    } catch (err) {
      console.error('Error fetching folders:', err);
      setError('Failed to fetch folders');
    }
  };

  // Folder management functions
  const handleCreateFolder = async (e) => {
    e.preventDefault();
    try {
      const response = await axiosInstance.post('/api/admin/list-folder', folderFormData);
      setFolders([...folders, response.data]);
      setShowFolderModal(false);
      setFolderFormData({ name: '', description: '' });
      setEditingFolder(null);
    } catch (err) {
      setError('Failed to create folder');
      console.error('Error creating folder:', err);
    }
  };

  const handleUpdateFolder = async (e) => {
    e.preventDefault();
    try {
      const response = await axiosInstance.put(`/api/admin/list-folder/${editingFolder.id}`, folderFormData);
      setFolders(folders.map(folder => 
        folder.id === editingFolder.id ? response.data : folder
      ));
      setShowFolderModal(false);
      setFolderFormData({ name: '', description: '' });
      setEditingFolder(null);
    } catch (err) {
      setError('Failed to update folder');
      console.error('Error updating folder:', err);
    }
  };

  const handleDeleteFolder = async (folderId) => {
    if (window.confirm('Are you sure you want to delete this folder? Lists in this folder will be moved to "No Folder".')) {
      try {
        await axiosInstance.delete(`/api/admin/list-folder/${folderId}`);
        setFolders(folders.filter(folder => folder.id !== folderId));
        // Refresh lists to update folder associations
        fetchLists();
      } catch (err) {
        setError('Failed to delete folder');
        console.error('Error deleting folder:', err);
      }
    }
  };

  const handleArchiveFolder = async (folderId) => {
    try {
      const response = await axiosInstance.put(`/api/admin/list-folder/${folderId}/archive`);
      setFolders(folders.map(folder => 
        folder.id === folderId ? response.data : folder
      ));
    } catch (err) {
      setError('Failed to archive folder');
      console.error('Error archiving folder:', err);
    }
  };

  const openFolderModal = (folder = null) => {
    if (folder) {
      setEditingFolder(folder);
      setFolderFormData({
        name: folder.name || '',
        description: folder.description || ''
      });
    } else {
      setEditingFolder(null);
      setFolderFormData({ name: '', description: '' });
    }
    setShowFolderModal(true);
  };

  const toggleFolder = (folderId) => {
    setExpandedFolders(prev => ({
      ...prev,
      [folderId]: !prev[folderId]
    }));
  };

  // Group lists by folder - include archived folders
  const groupedLists = React.useMemo(() => {
    const grouped = {
      'no-folder': []
    };
    
    // Initialize groups for ALL folders (including archived)
    folders.forEach(folder => {
      grouped[folder.id] = [];
    });
    
    // Group lists by their folderId
    lists.forEach(list => {
      const folderId = list.folderId || 'no-folder';
      if(list.isDeleted) {
        // Skip deleted lists
        if(!grouped['archive_1']) {
          grouped['archive_1'] = [];
        }
        grouped['archive_1'].push(list);
        return;
      }
      if (grouped[folderId]) {
        grouped[folderId].push(list);
      } else {
        grouped['no-folder'].push(list);
      }
    });
    
    return grouped;
  }, [lists, folders]);

  const fetchLists = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get('/api/admin/lists');
      setLists(response.data);
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
    // setEditingList(list);
    // openModal(list);
    navigation(`/lists/${list.id}`);
    
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

  const handleRestore = async (id) => {
    if (window.confirm('Are you sure you want to restore this list?')) {
      try {
        const response = await axiosInstance.post(`/api/admin/list/restore-list/${id}`);
        setLists(lists.map(list => 
          list.id === id ? { ...list, isDeleted: false } : list
        ));
      } catch (err) {
        setError('Failed to restore list');
      }
    }
  }

  // New function to handle moving list to another folder
  const handleFolderMove = async (listId, folderId) => {
    try {
      await axiosInstance.post(`/api/admin/list/${listId}/move-to-folder/${folderId}`);
      // Update the list in state to reflect its new folder
      setLists(lists.map(list => 
        list.id === listId ? { ...list, folderId } : list
      ));
      return true;
    } catch (err) {
      console.error('Error moving list to folder:', err);
      setError('Failed to move list to folder');
      return false;
    }
  };

  // New function to handle copying list to another folder
  const handleFolderCopy = async (listId, folderId) => {
    try {
      const response = await axiosInstance.post(`/api/admin/list/${listId}/copy-to-folder/${folderId}`);
      // Add the new copied list to our state
      if (response.data) {
        setLists([...lists, response.data]);
      } else {
        // If no response data, just refresh the list
        fetchLists();
      }
      return true;
    } catch (err) {
      console.error('Error copying list to folder:', err);
      setError('Failed to copy list to folder');
      return false;
    }
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
        params.cities = [cityFilter]; // Include 'latur' as a default city
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
  
  const addCollegeToList = (college, branch = null, batchColleges = null, index = null) => {
    if (batchColleges) {
      // Handle batch addition
      if (!Array.isArray(batchColleges)) {
        console.error('batchColleges should be an array');
        return;
      }
      if(index !== null && index >= 0 && index < selectedColleges.length) {
        // If index is provided, insert at that index
        const updatedColleges = [...selectedColleges];
        updatedColleges.splice(index, 0, ...batchColleges);
        setSelectedColleges(updatedColleges);
        return;
      }
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

      if(index !== null && index >= 0 && index < selectedColleges.length) {
        // If index is provided, insert at that index
        const updatedColleges = [...selectedColleges];
        updatedColleges.splice(index, 0, collegeToAdd);
        setSelectedColleges(updatedColleges);
        return;
      }
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
      
      
      await handleSaveUserList(editingList?.id);

      toast.success('List saved successfully!');
    } catch (err) {
      console.log(err);
      
      setError('Failed to save list');
    }
  };

  const handleSaveUserList = async (listId, isCreatedListProp=false) => {
    try {
      setLoadingLists(true);
      const authAxios = axiosInstance;

      
      
      // Use the listId passed from EditListModal component
      const targetListId = listId || editingUserList.id || editingUserList.listId || editingUserList.originalListId;
      
      if (!targetListId) {
        throw new Error('No valid list ID found');
      }
      
      // Determine if this is a created list or assigned list based on where it came from
      const isCreatedList = window.confirm('Is it a created List ?');;
      const userId = selectedUserListsId || user?.id;
      
      if (!userId) {
        throw new Error('No valid user ID found');
      }
      
      const listData = {
        title: formData.title,
        colleges: selectedColleges || formData.items || [],
        isCustomized: true
      };

      listData.colleges = listData.colleges.map(c => {
        return {
          ...c,
          branches: [],
          additionalMetadata: {},
          keywords: []
        }
      })
      
      console.log(`Saving ${isCreatedList ? 'created' : ''} list with ID: ${targetListId} for user ${userId}`);
      
      const endpoint = isCreatedList 
        ? `/api/admin/user/${userId}/created-list/${targetListId}`
        : `/api/admin/user/${userId}/list/${targetListId}`;
        
      const response = await axiosInstance.put(endpoint, listData);

      // Update the appropriate state based on list type
      if (isCreatedList) {
        setSelectedUsersCreatedLists(prevLists => 
          prevLists.map(list => 
            (list.id === targetListId || list.listId === targetListId) ? response.data : list
          )
        );
        
        setUsers(users.map(user => {
          if (user.id === userId) {
            return {
              ...user,
              createdList: (user.createdList || []).map(list => 
                (list.id === targetListId || list.listId === targetListId) ? response.data : list
              )
            };
          }
          return user;
        }));
      } else {
        setSelectedUserLists(prevLists => 
          prevLists.map(list => 
            (list.id === targetListId || list.listId === targetListId) ? response.data : list
          )
        );

        setUsers(users.map(user => {
          if (user.id === userId) {
            return {
              ...user,
              lists: (user.lists || []).map(list => 
                (list.id === targetListId || list.listId === targetListId) ? response.data : list
              )
            };
          }
          return user;
        }));
      }

      setShowEditListModal(false);
      setEditingUserList(null);
      setError(null);
      toast.success('List updated successfully!');
    } catch (err) {
      console.error('Error saving user list:', err);
      setError(`Failed to save user list: ${err.message}`);
      toast.error(`Failed to save list: ${err.message}`);
    } finally {
      setLoadingLists(false);
    }
  };

  const handleAppendColleges = async (listId, exportedColleges = []) => {
    try {
      if (listId) {
        const isCreatedList = (editingUserList && editingUserList.isCreatedList) && user.createdList?.some(l => l.id === listId); ;
        const userId = selectedUserListsId || user?.id;
        
        if (!userId) {
          throw new Error('No valid user ID found');
        }
        
        // Find the current list to get existing colleges
        let currentList;
        if (isCreatedList) {
          currentList = selectedUsersCreatedLists.find(l => l.id === listId);
        } else {
          currentList = selectedUserLists.find(l => l.id === listId);
        }

        let updatedColleges = [];

        if (currentList && currentList.colleges) {
          // Create a Set of existing uniqueIds for efficient lookup
          const existingCollegeUniqueIds = new Set(currentList.colleges.map(college => college.uniqueId));

          // Filter out duplicates from exportedColleges
          const newUniqueColleges = exportedColleges.filter(college => 
            !existingCollegeUniqueIds.has(college.uniqueId));

          // Combine existing colleges with the new unique colleges
          updatedColleges = [...currentList.colleges, ...newUniqueColleges];
        } else {
          // If there are no existing colleges, simply use exportedColleges
          // Also, ensure no duplicates within exportedColleges itself if that's a possibility
          const uniqueExportedColleges = Array.from(
            new Map(exportedColleges.map(college => [college.uniqueId, college])).values()
          );
          updatedColleges = uniqueExportedColleges;
        }
        
        const submitData = {
          title: currentList?.title || "Updated List",
          colleges: updatedColleges ? updatedColleges.map(c => {
            return {
              ...c,
              branches: [],
              additionalMetadata: {},
              keywords: []
            }
          }) : [],
          isCustomized: true
        };

        

        const endpoint = isCreatedList 
          ? `/api/admin/user/${userId}/created-list/${listId}`
          : `/api/admin/user/${userId}/list/${listId}`;
          
        const response = await axiosInstance.put(endpoint, submitData);

        // Update the appropriate state based on list type
        if (isCreatedList) {
          setSelectedUsersCreatedLists(prevLists => 
            prevLists.map(list => 
              list.id === listId ? response.data : list
            )
          );
          
          setUsers(users.map(user => {
            if (user.id === userId) {
              return {
                ...user,
                createdList: (user.createdList || []).map(list => 
                  list.id === listId ? response.data : list
                )
              };
            }
            return user;
          }));
        } else {
          setSelectedUserLists(prevLists => 
            prevLists.map(list => 
              list.id === listId ? response.data : list
            )
          );

          setUsers(users.map(user => {
            if (user.id === userId) {
              return {
                ...user,
                lists: (user.lists || []).map(list => 
                  list.id === listId ? response.data : list
                )
              };
            }
            return user;
          }));
        }
        
        toast.success('Colleges appended successfully!');
      }
      
      setShowModal(false);
      setEditingList(null);
      setFormData({ title: '' });
      setSelectedColleges([]);
    } catch (err) {
      console.log(err);
      setError('Failed to update list');
      toast.error(`Failed to update list: ${err.message}`);
    }
  };

  const handleSaveOrder = async (updatedList) => {
    try {
      setLoadingLists(true);
      const authAxios = axiosInstance;
      
      const isCreatedList = updatedList.isCreatedList;
      const userId = selectedUserListsId || user?.id;
      
      if (!userId) {
        throw new Error('No valid user ID found');
      }

      const targetListId = updatedList.id || updatedList.listId;
      if (!targetListId) {
        throw new Error('No valid list ID found');
      }
      
      const submitData = {
        title: updatedList.title,
        colleges: updatedList.colleges,
        isCustomized: true
      };
      
      const endpoint = isCreatedList 
        ? `/api/admin/user/${userId}/created-list/${targetListId}`
        : `/api/admin/user/${userId}/list/${targetListId}`;
        
      const response = await axiosInstance.put(endpoint, submitData);
  
      // Update the appropriate state based on list type
      if (isCreatedList) {
        setSelectedUsersCreatedLists(prevLists => 
          prevLists.map(list => 
            list.id === targetListId ? response.data : list
          )
        );
        
        setUsers(users.map(user => {
          if (user.id === userId) {
            return {
              ...user,
              createdList: (user.createdList || []).map(list => 
                list.id === targetListId ? response.data : list
              )
            };
          }
          return user;
        }));
      } else {
        setSelectedUserLists(prevLists => 
          prevLists.map(list => 
            list.id === targetListId ? response.data : list
          )
        );

        setUsers(users.map(user => {
          if (user.id === userId) {
            return {
              ...user,
              lists: (user.lists || []).map(list => 
                list.id === targetListId ? response.data : list
              )
            };
          }
          return user;
        }));
      }
      
      setError(null);
      toast.success('List order updated successfully!');
    } catch (err) {
      console.error('Error saving list order:', err);
      setError('Failed to save list order');
      toast.error(`Failed to update list order: ${err.message}`);
    } finally {
      setLoadingLists(false);
    }
  };

  const openModal = (list = null) => {
    if (list) {
      setFormData({
        title: list.title || '',
        folderId: list.folderId || ''
      });
      // Set whether this is a created list or assigned list
      list.isCreatedList = !!list.isCreatedByUser;
      setEditingUserList(list);
      setEditListFormData({
        title: list.title,
        colleges: list.colleges || [],
        originalListId: list.originalListId || list.id
      });
      setSelectedColleges(list.colleges || []);
    } else {
      setFormData({ title: '', folderId: '' });
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

  // Function to handle copying of branch code
  const handleCopyBranchCode = (listId, college) => {
    const code = college.selectedBranchCode;
    if (!code) return;
    
    // Copy to clipboard
    navigator.clipboard.writeText(code)
      .then(() => {
        // Track that this college's code has been copied for this list
        setCopiedCodes(prev => ({
          ...prev,
          [listId]: {
            ...(prev[listId] || {}),
            [college.uniqueId || college.id]: true
          }
        }));
        
        // Provide feedback that code was copied (optional toast or alert)
        // You can use your existing feedback mechanism
      })
      .catch(err => {
        console.error('Failed to copy: ', err);
      });
  };
  
  // Function to check if a college code has been copied
  const isCodeCopied = (listId, collegeId) => {
    return copiedCodes[listId]?.[collegeId] || false;
  };
  
  // Function to reset copied status for a list
  const resetCopiedStatus = (listId) => {
    setCopiedCodes(prev => ({
      ...prev,
      [listId]: {}
    }));
  };

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
              <div className="flex gap-3">
                <button
                  className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center shadow-sm"
                  onClick={() => openFolderModal()}
                >
                  <Plus size={20} className="mr-2" />
                  Add Folder
                </button>
                <button
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center shadow-sm"
                  onClick={() => openModal()}
                >
                  <Plus size={20} className="mr-2" />
                  Add New List
                </button>
              </div>
            )}
          </div>

          {error && (
            <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6 rounded-r-md shadow-sm">
              {error}
            </div>
          )}

          {/* List Form Modal */}
          {showModal && (
            <ListFormModalForUsers
              userData={user}
              editingList={editingList}
              formData={formData}
              setFormData={setFormData}
              handleSave={handleSubmit}
              handleAppendColleges={handleAppendColleges}
              closeModal={() => {
                setShowModal(false);
                navigation(`/users/lists/${user.id}`);
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
              // Folder props
              folders={folders}
            />
          )}

          {/* Folder Management Modal */}
          {showFolderModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
                <div className="p-6 border-b border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {editingFolder ? 'Edit Folder' : 'Create New Folder'}
                  </h3>
                </div>
                <form onSubmit={editingFolder ? handleUpdateFolder : handleCreateFolder} className="p-6 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Folder Name *
                    </label>
                    <input
                      type="text"
                      value={folderFormData.name}
                      onChange={(e) => setFolderFormData({ ...folderFormData, name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Enter folder name..."
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Description
                    </label>
                    <textarea
                      value={folderFormData.description}
                      onChange={(e) => setFolderFormData({ ...folderFormData, description: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Enter folder description..."
                      rows={3}
                    />
                  </div>
                  <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                    <button
                      type="button"
                      onClick={() => setShowFolderModal(false)}
                      className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      {editingFolder ? 'Update Folder' : 'Create Folder'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Lists organized by folders */}
          {expandedListId ? (
            // Single expanded list - full width
            <div className="w-full">
              {lists
                .filter(list => list.id === expandedListId)
                .map((list) => (
                  <ListCard 
                    key={list.id}
                    list={list}
                    expandedListId={expandedListId}
                    handleListClick={handleListClick}
                     folders={folders || []}
                    handleEdit={handleEdit}
                    handleDelete={handleDelete}
                    handleFolderMove={handleFolderMove}
                    handleFolderCopy={handleFolderCopy}
                    folder={folders.find(f => f.id === list.folderId)}
                    originalFolder={folders.find(f => f.id === list.folderId) || null}
                  />
                ))
              }
            </div>
          ) : (
            // New tabbed interface for folder organization
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
              {/* Tab Navigation */}
              <div className="flex border-b border-gray-200">
                <button
                  onClick={() => setActiveTab('folders')}
                  className={`flex items-center gap-2 px-6 py-3 text-sm font-medium transition-colors ${
                    activeTab === 'folders' 
                      ? 'text-blue-600 border-b-2 border-blue-600 -mb-px' 
                      : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Folder size={18} />
                  Folders
                  <span className="bg-gray-100 text-gray-700 text-xs px-2 py-0.5 rounded-full ml-1">
                    {folders.filter(folder => !folder.isArchive).length}
                  </span>
                </button>
                <button
                  onClick={() => setActiveTab('archived')}
                  className={`flex items-center gap-2 px-6 py-3 text-sm font-medium transition-colors ${
                    activeTab === 'archived' 
                      ? 'text-amber-600 border-b-2 border-amber-600 -mb-px' 
                      : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Archive size={18} />
                  Archived Lists
                  
                </button>
              </div>
              
              {/* Tab Content */}
              <div className="p-6">
                {activeTab === 'folders' && (
                  <div className="space-y-6">
                    {/* Active Folders Section */}
                    {folders.filter(folder => !folder.isArchive).length > 0 ? (
                      <div className="space-y-3">
                        {folders.filter(folder => !folder.isArchive).map(folder => (
                          <div key={folder.id} className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
                            <div className="p-4 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-t-lg">
                              <div className="flex justify-between items-center">
                                <div className="flex items-center gap-3">
                                  <button
                                    onClick={() => toggleFolder(folder.id)}
                                    className="text-gray-600 hover:text-gray-800 p-1 rounded-full hover:bg-white/50 transition-colors"
                                  >
                                    {expandedFolders[folder.id] ? 
                                      <ChevronDown size={20} /> : 
                                      <ChevronRight size={20} />
                                    }
                                  </button>
                                  <div className="flex items-center gap-2">
                                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                                      <Folder size={20} className="text-blue-600" />
                                    </div>
                                    <div>
                                      <h3 className="text-lg font-semibold text-gray-900">{folder.name}</h3>
                                      {folder.description && (
                                        <p className="text-sm text-gray-600">{folder.description}</p>
                                      )}
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <span className="bg-blue-100 text-blue-800 text-xs px-3 py-1 rounded-full font-medium">
                                      {groupedLists[folder.id]?.length || 0} lists
                                    </span>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <button
                                    onClick={() => openFolderModal(folder)}
                                    className="text-blue-600 hover:text-blue-800 text-sm font-medium px-3 py-1.5 bg-blue-50 rounded-md hover:bg-blue-100 transition-colors"
                                  >
                                    Edit
                                  </button>
                                  <button
                                    onClick={() => handleDeleteFolder(folder.id)}
                                    className="text-red-600 hover:text-red-800 text-sm font-medium px-3 py-1.5 bg-red-50 rounded-md hover:bg-red-100 transition-colors"
                                  >
                                    Delete
                                  </button>
                                </div>
                              </div>
                            </div>
                            
                            {(expandedFolders[folder.id]) && (
                              <div className="p-4">
                                {groupedLists[folder.id]?.length > 0 ? (
                                  <div className="grid xl:grid-cols-1 gap-4">
                                    {groupedLists[folder.id].map((list) => (
                                      <ListCard 
                                        key={list.id}
                                        list={list}
                                         folders={folders || []}
                                        expandedListId={expandedListId}
                                        handleListClick={handleListClick}
                                        handleEdit={handleEdit}
                                        handleDelete={handleDelete}
                                        folder={folder}
                                        originalFolder={folders.find(f => f.id === list.folderId) || null}
                                        handleCopyBranchCode={handleCopyBranchCode}
                                        isCodeCopied={isCodeCopied}
                                        handleFolderMove={handleFolderMove}
                    handleFolderCopy={handleFolderCopy}
                                        resetCopiedStatus={resetCopiedStatus}
                                      />
                                    ))}
                                  </div>
                                ) : (
                                  <div className="text-center py-8 text-gray-500">
                                    <div className="text-gray-300 mb-2">
                                      <FolderOpen size={32} className="mx-auto" />
                                    </div>
                                    <p className="text-sm">No lists in this folder</p>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="bg-white rounded-lg border border-gray-200 p-8 text-center mb-6">
                        <div className="text-gray-400 mb-3">
                          <Folder size={48} className="mx-auto" />
                        </div>
                        <p className="text-gray-500 mb-2">No active folders yet</p>
                        <p className="text-sm text-gray-400">Create a folder to organize your lists</p>
                        <button
                          onClick={() => openFolderModal()}
                          className="mt-4 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors inline-flex items-center gap-2"
                        >
                          <Plus size={16} />
                          Create Folder
                        </button>
                      </div>
                    )}

                    {/* No Folder section - Now part of the Folders tab */}
                    {groupedLists['no-folder']?.length > 0 && (
                      <div className="mt-6">
                        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                          <div className="p-4 border-b border-gray-100 bg-gray-50 rounded-t-lg">
                            <div className="flex justify-between items-center">
                              <div className="flex items-center gap-3">
                                <button
                                  onClick={() => toggleFolder('no-folder')}
                                  className="text-gray-600 hover:text-gray-800 p-1 rounded-full hover:bg-gray-200 transition-colors"
                                >
                                  {expandedFolders['no-folder'] ? 
                                    <ChevronDown size={20} /> : 
                                    <ChevronRight size={20} />
                                  }
                                </button>
                                <div className="flex items-center gap-2">
                                  <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                                    <FolderOpen size={20} className="text-gray-500" />
                                  </div>
                                  <div>
                                    <h3 className="text-lg font-semibold text-gray-900">No Folder</h3>
                                    <p className="text-sm text-gray-600">Lists not assigned to any folder</p>
                                  </div>
                                </div>
                                <span className="bg-gray-100 text-gray-700 text-xs px-3 py-1 rounded-full font-medium">
                                  {groupedLists['no-folder']?.length || 0} lists
                                </span>
                              </div>
                            </div>
                          </div>
                          
                          {(expandedFolders['no-folder'] || expandedFolders['no-folder'] === undefined) && (
                            <div className="p-4">
                              <div className="grid xl:grid-cols-1 gap-4">
                                {groupedLists['no-folder'].map((list) => (
                                  <ListCard 
                                    key={list.id}
                                    list={list}
                                    expandedListId={expandedListId}
                                    handleListClick={handleListClick}
                                    handleEdit={handleEdit}
                                    handleDelete={handleDelete}
                                    handleFolderMove={handleFolderMove}
                                    handleFolderCopy={handleFolderCopy}
                                    folder={null}
                                     folders={folders || []}
                                    originalFolder={null} // No folder for unorganized lists
                                    handleCopyBranchCode={handleCopyBranchCode}
                                    isCodeCopied={isCodeCopied}
                                    resetCopiedStatus={resetCopiedStatus}
                                  />
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'archived' && (
                  <div className="space-y-6">
                    {/* Archived Folders Section */}
                    {folders.filter(folder => folder.isArchive).length > 0 ? (
                      <div className="space-y-3">
                        {folders.filter(folder => folder.isArchive).map(folder => (
                          <div key={folder.id} className="bg-amber-50 rounded-lg border-2 border-gray-300 shadow-sm opacity-90">
                            <div className="p-4 border-b border-amber-200 bg-gradient-to-r from-amber-100 to-yellow-100 rounded-t-lg">
                              <div className="flex justify-between items-center">
                                <div className="flex items-center gap-3">
                                  <button
                                    onClick={() => toggleFolder(folder.id)}
                                    className="text-amber-700 hover:text-amber-900 p-1 rounded-full hover:bg-amber-200/50 transition-colors"
                                  >
                                    {expandedFolders[folder.id] ? 
                                      <ChevronDown size={20} /> : 
                                      <ChevronRight size={20} />
                                    }
                                  </button>
                                  <div className="flex items-center gap-2">
                                    <div className="w-10 h-10 bg-amber-200 rounded-lg flex items-center justify-center relative">
                                      <Archive size={16} className="text-amber-700" />
                                      <Lock size={12} className="text-amber-800 absolute -top-1 -right-1 bg-amber-100 rounded-full p-0.5" />
                                    </div>
                                    <div>
                                      <h3 className="text-lg font-semibold text-amber-900 flex items-center gap-2">
                                        {folder.name}
                                        <Lock size={16} className="text-amber-600" />
                                      </h3>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <span className="bg-amber-200 text-amber-800 text-xs px-3 py-1 rounded-full font-medium">
                                      {groupedLists[folder.id]?.length || 0} lists
                                    </span>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <div className="text-xs text-amber-700 bg-amber-100 px-2 py-1 rounded-md">
                                    Read Only
                                  </div>
                                </div>
                              </div>
                            </div>
                            
                            {(expandedFolders[folder.id] || expandedFolders[folder.id] === undefined) && (
                              <div className="p-4 bg-gray-100">
                                {groupedLists[folder.id]?.length > 0 ? (
                                  <div className="space-y-3">
                                    <div className="flex items-center gap-2 text-sm text-amber-700 bg-amber-100 p-2 rounded-md">
                                      <Lock size={14} />
                                      <span>Lists in archived folders are read-only but can still be edited individually</span>
                                    </div>
                                    <div className="grid xl:grid-cols-1 gap-4">
                                      {groupedLists[folder.id].map((list) => (
                                        <div key={list.id} className="relative">
                                          <ListCard 
                                            list={list}
                                            handleRestore={handleRestore}
                                            expandedListId={expandedListId}
                                            handleListClick={handleListClick}
                                            handleEdit={handleEdit}
                                            handleDelete={handleDelete}
                                            folder={folder}
                                            folders={folders || []}
                                            originalFolder={folders.find(f => f.id === list.folderId) || null}
                                          />
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                ) : (
                                  <div className="text-center py-8 text-amber-600">
                                    <div className="text-amber-400 mb-2">
                                      <Archive size={32} className="mx-auto" />
                                    </div>
                                    <p className="text-sm">No lists in this archived folder</p>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
                        <div className="text-gray-400 mb-3">
                          <Archive size={48} className="mx-auto" />
                        </div>
                        <p className="text-gray-500 mb-2">No archived folders</p>
                        <p className="text-sm text-gray-400">Archived folders will appear here</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Show placeholder if no lists at all - outside the tabs */}
                {lists.length === 0 && folders.length === 0 && (
                  <div className="text-center py-16">
                    <div className="text-gray-300 mb-4">
                      <Folder size={64} className="mx-auto" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-700 mb-2">No Lists or Folders Yet</h3>
                    <p className="text-gray-500 mb-6">Get started by creating a folder to organize your lists</p>
                    <div className="flex justify-center gap-3">
                      <button
                        onClick={() => openFolderModal()}
                        className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
                      >
                        <Plus size={20} />
                        Create First Folder
                      </button>
                      <button
                        onClick={() => openModal()}
                        className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                      >
                        <Plus size={20} />
                        Create First List
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </DndProvider>
  );
};

export default ListsManagement3;