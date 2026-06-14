import React, { createContext, useState, useContext, useCallback, useEffect } from 'react';
import axiosInstance from '../utils/axios';

const UsersContext = createContext();

export const UsersProvider = ({ children }) => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastDoc, setLastDoc] = useState(null); // Track the last document for pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [hasMore, setHasMore] = useState(false);
  const [notes, setNotes] = useState({});  // Add notes state as an object with userId as key
  const [dataLoaded, setDataLoaded] = useState(false); // Track if data has been loaded
  const [toatlUsersNumber, setTotalUsersNumber] = useState(0);
  
  // Add pagination cache to store previous pages
  const [paginationCache, setPaginationCache] = useState(new Map());
  const [lastDocCache, setLastDocCache] = useState(new Map());
  
  // Add filter states - updated to remove batch and status, add listAssigned
  const [filters, setFilters] = useState({
    plan: 'all',
    listAssigned: 'all', // 'all', 'true', 'false'
    fromDate: '',
    toDate: ''
  });
  const [isFilterActive, setIsFilterActive] = useState(false);
  const [premiumUsersOnly, setPremiumUsersOnly] = useState(false);

  // Helper function to create cache key
  const getCacheKey = (page, filters, pageSize) => {
    return `${page}-${JSON.stringify(filters)}-${pageSize}`;
  };

  // Separate the initial fetch from explicit refresh operations
  const fetchUsers = useCallback(async (page = currentPage, resetPagination = false, premiumOnly = false, filtersOverride = null) => {
    const effectiveFilters = filtersOverride || filters;
    // Check if filters are active
    const activeFilters = Object.values(effectiveFilters).some(filter => filter !== 'all' && filter !== '');
    setIsFilterActive(activeFilters);

    // Create cache key for this request
    const cacheKey = getCacheKey(page, effectiveFilters, pageSize);
    
    // Check if we have this page cached (unless it's a reset)
    if (!resetPagination && paginationCache.has(cacheKey)) {
      console.log(`Using cached data for page ${page}`);
      const cachedData = paginationCache.get(cacheKey);
      setUsers(cachedData.users);
      setHasMore(cachedData.hasMore);
      setLastDoc(cachedData.lastDoc);
      setTotalUsersNumber(cachedData.totalUsers);
      setCurrentPage(page);
      setDataLoaded(true);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      console.log(`Fetching users - page ${page}, size ${pageSize}, filters:`, effectiveFilters, `premiumOnly: ${premiumOnly}`);
      
      // Prepare filter parameters
      const filterParams = {};
      if (effectiveFilters.plan !== 'all') {
        filterParams.plan = effectiveFilters.plan;
      }
      if (effectiveFilters.listAssigned !== 'all') {
        filterParams.listAssigned = effectiveFilters.listAssigned;
      }
      if (effectiveFilters.fromDate) {
        filterParams.fromDate = effectiveFilters.fromDate;
      }
      if (effectiveFilters.toDate) {
        filterParams.toDate = effectiveFilters.toDate;
      }

      // Build request parameters
      const requestParams = {
        page,
        limit: pageSize,
        ...filterParams
      };

      // Add premiumOnly parameter if true
      if (premiumOnly) {
        requestParams.isPremium = true;
        requestParams.dateFilterBy = 'purchasedDate';
      }

      // For pagination beyond page 1, include lastDoc from previous page
      if (page > 1 && !resetPagination) {
        const prevPageCacheKey = getCacheKey(page - 1, effectiveFilters, pageSize);
        if (lastDocCache.has(prevPageCacheKey)) {
          requestParams.lastDoc = lastDocCache.get(prevPageCacheKey);
        }
      }

      console.log('Request params:', requestParams);

      const response = await axiosInstance.get('/api/admin/all-users', {
        params: requestParams
      });

      const responseData = {
        users: response.data.users || [],
        hasMore: response.data.hasMore || false,
        lastDoc: response.data.lastDoc || null,
        totalUsers: response.data.totalUsers || response.data.users?.length || 0
      };

      // Cache the response
      setPaginationCache(prev => new Map(prev.set(cacheKey, responseData)));
      
      // Cache lastDoc for next page navigation
      if (responseData.lastDoc) {
        setLastDocCache(prev => new Map(prev.set(cacheKey, responseData.lastDoc)));
      }

      setUsers(responseData.users);
      setHasMore(responseData.hasMore);
      setLastDoc(responseData.lastDoc);
      setTotalUsersNumber(responseData.totalUsers);
      setError(null);
      setDataLoaded(true);

      let notes = {}
      
      responseData.users.forEach(u => {
        notes[u.id] = {notes: u.notes}
      })

      setNotes(notes) 

      // Update current page after successful fetch
      setCurrentPage(page);

    } catch (err) {
      setError('Failed to fetch users');
      console.error('Error fetching users:', err);
    } finally {
      setLoading(false);
    }
  }, [currentPage, pageSize, filters, dataLoaded, paginationCache, lastDocCache]);

  // New function to handle filter changes
  const updateFilters = useCallback((newFilters, premiumOnly = false) => {
    setFilters(newFilters);
    
    // Clear cache when filters change
    setPaginationCache(new Map());
    setLastDocCache(new Map());
    
    // Reset pagination when filters change
    setCurrentPage(1);
    setLastDoc(null);
    setDataLoaded(false);
    
    // Fetch with new filters from page 1
    fetchUsers(1, true, premiumOnly, newFilters);
  }, [fetchUsers]);

  const clearFilters = useCallback((premiumOnly = false) => {
    const clearedFilters = {
      plan: 'all',
      listAssigned: 'all',
      fromDate: '',
      toDate: ''
    };
    setFilters(clearedFilters);
    
    // Clear cache when filters change
    setPaginationCache(new Map());
    setLastDocCache(new Map());
    
    // Reset pagination when filters change
    setCurrentPage(1);
    setLastDoc(null);
    setDataLoaded(false);
    
    fetchUsers(1, true, premiumOnly, clearedFilters);
  }, [fetchUsers]);

  // Modified goToPage to work with caching
  const goToPage = useCallback((page, premiumOnly = false) => {
    if (page < 1) return;
    
    // Don't fetch if we're already on the target page
    if (page === currentPage && dataLoaded) {
      console.log(`Already on page ${page}, skipping fetch`);
      return;
    }
    
    console.log(`Going to page ${page}, current: ${currentPage}`);
    fetchUsers(page, false, premiumOnly);
  }, [fetchUsers, currentPage, dataLoaded]);

  const goToNextPage = useCallback((premiumOnly = false) => {
    if (hasMore && currentPage >= 1) {
      const nextPage = currentPage + 1;
      console.log(`Going to next page: ${nextPage}`);
      goToPage(nextPage, premiumOnly);
    }
  }, [hasMore, currentPage, goToPage]);

  const goToPrevPage = useCallback((premiumOnly = false) => {
    if (currentPage > 1) {
      const prevPage = currentPage - 1;
      console.log(`Going to previous page: ${prevPage}`);
      goToPage(prevPage, premiumOnly);
    }
  }, [currentPage, goToPage]);

  const changePageSize = useCallback((newSize, premiumOnly = false) => {
    setPageSize(newSize);
    setCurrentPage(1);
    setLastDoc(null);
    setDataLoaded(false);
    
    // Clear cache when page size changes
    setPaginationCache(new Map());
    setLastDocCache(new Map());
    
    fetchUsers(1, true, premiumOnly);
  }, [fetchUsers]);

  // New function for explicit refreshes
  const refreshUsers = useCallback(async (page = currentPage, premiumOnly = false) => {
    // Clear cache on refresh
    setPaginationCache(new Map());
    setLastDocCache(new Map());
    setDataLoaded(false);
    setLastDoc(null);
    await fetchUsers(page, true, premiumOnly);
  }, [fetchUsers, currentPage]);

  const searchUsers = async (searchParams) => {
    try {
      setLoading(true);
      const response = await axiosInstance.post('/api/admin/user/search', searchParams);
       setPaginationCache(new Map());
    setLastDocCache(new Map());
    setDataLoaded(false);
    setLastDoc(null);
      setUsers(response.data);
      
      let notes = {}
      
      response.data.forEach(u => {
        notes[u.id] = {notes: u.notes}
      })

      setNotes(notes)      
      setError(null);
      return response.data;
    } catch (err) {
      setError('Failed to search users');
      console.error('Error searching users:', err);
    } finally {
      setLoading(false);
    }
  };

  const updateUser = async (userId, userData) => {
    try {
      setLoading(true);
      const response = await axiosInstance.put(`/api/admin/update-user/${userId}`, userData);
      setUsers(users.map(user => user.id === userId ? response.data : user));
      setError(null);
      return response.data;
    } catch (err) {
      setError('Failed to update user');
      console.error('Error updating user:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const deleteUser = async (userId) => {
    try {
      setLoading(true);
      await axiosInstance.delete(`/api/admin/delete-user/${userId}`);
      setUsers(users.filter(user => user.id !== userId));
      setError(null);
    } catch (err) {
      setError('Failed to delete user');
      console.error('Error deleting user:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Add function to fetch notes for a specific user
  const fetchUserNotes = async (userId) => {
    try {
      const response = await axiosInstance.get(`/api/admin/get-notes/${userId}`);
      return response.data;
    } catch (err) {
      console.error(`Error fetching notes for user ${userId}:`, err);
      return [];
    }
  };

  // Effect to fetch notes when users change
  useEffect(() => {
    const fetchAllNotes = async () => {
      const notesPromises = users.map(user => fetchUserNotes(user.id));
      try {
        const allNotes = await Promise.all(notesPromises);
        const notesMap = users.reduce((acc, user, index) => {
          acc[user.id] = allNotes[index];
          return acc;
        }, {});
        
        setNotes(notesMap);
      } catch (err) {
        console.error('Error fetching notes:', err);
      }
    };

    if (users.length > 0) {
      // fetchAllNotes();
    }
  }, [users]);

  const updateUserNotes = (userId, adminEmail, note, createdAt) => {
    setNotes(prevNotes => ({
      ...prevNotes,
      [userId]: {
        id: userId,
        notes: {
          ...(prevNotes[userId]?.notes || {}),
          [`note-${adminEmail}`]: {
            note,
            createdAt
          }
        }
      }
    }));
  };

  // Initial fetch only when component mounts
  useEffect(() => {  
    if (!dataLoaded) {
      fetchUsers(1, true, premiumUsersOnly); // Default to non-premium users
    }
  }, [premiumUsersOnly]); // Empty dependency array - only run on mount

  // Handle page size changes
  useEffect(() => {
    if (dataLoaded) {
      // When page size changes, reset to page 1
      setCurrentPage(1);
      setLastDoc(null);
      setDataLoaded(false);
      
      // Clear cache when page size changes
      setPaginationCache(new Map());
      setLastDocCache(new Map());
      
      fetchUsers(1, true, premiumUsersOnly); // Default to non-premium users
    }
  }, [pageSize, premiumUsersOnly]); // Only trigger when pageSize changes

  const value = {
    users,
    loading,
    error,
    currentPage,
    pageSize,
    hasMore,
    dataLoaded,
    totalUsersNumber: toatlUsersNumber,
    
    // Filter functionality
    filters,
    isFilterActive,
    updateFilters,
    clearFilters,
    
    // Pagination functions
    goToPage,
    goToNextPage,
    goToPrevPage,
    changePageSize,
    fetchUsers,
    refreshUsers,
    
    // ...existing values...
    setCurrentPage,
    setPageSize,
    searchUsers,
    updateUser,
    deleteUser,
    setLoading,
    setError,
    setUsers,
    notes,
    setNotes,
    fetchUserNotes,
    updateUserNotes,
    setPremiumUsersOnly
  };

  return <UsersContext.Provider value={value}>{children}</UsersContext.Provider>;
};

export const useUsers = () => {
  const context = useContext(UsersContext);
  if (context === undefined) {
    throw new Error('useUsers must be used within a UsersProvider');
  }
  return context;
};

