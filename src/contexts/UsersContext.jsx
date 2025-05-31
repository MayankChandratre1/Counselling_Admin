import React, { createContext, useState, useContext, useCallback, useEffect } from 'react';
import axiosInstance from '../utils/axios';

const UsersContext = createContext();

export const UsersProvider = ({ children }) => {
  const [allUsers, setAllUsers] = useState([]); // Store all loaded users
  const [users, setUsers] = useState([]); // Current page users
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [hasMore, setHasMore] = useState(false);
  const [notes, setNotes] = useState({});
  const [dataLoaded, setDataLoaded] = useState(false);
  const [toatlUsersNumber, setTotalUsersNumber] = useState(0); // Total number of users fetched
  
  // New state for pagination tracking
  const [pageDocuments, setPageDocuments] = useState({}); // Track lastDoc for each page
  const [maxLoadedPage, setMaxLoadedPage] = useState(0); // Highest page we've loaded from backend

  // Get users for current page from allUsers array
  const getCurrentPageUsers = useCallback((page, size, allUsersArray = allUsers) => {
    const startIndex = (page - 1) * size;
    const endIndex = startIndex + size;
    return allUsersArray.slice(startIndex, endIndex);
  }, [allUsers]);

  // Update current page users when page or pageSize changes
  useEffect(() => {
    if (allUsers.length > 0) {
      const currentPageUsers = getCurrentPageUsers(currentPage, pageSize);
      setUsers(currentPageUsers);
    }
  }, [currentPage, pageSize, allUsers, getCurrentPageUsers]);

  const fetchUsers = useCallback(async (page = currentPage) => {
    // If navigating to a previously loaded page, use existing data
    if (page <= maxLoadedPage && allUsers.length > 0) {
      const pageUsers = getCurrentPageUsers(page, pageSize);
      setUsers(pageUsers);
      
      // Update hasMore based on whether we have more users beyond current page
      const totalLoadedUsers = allUsers.length;
      const currentPageEndIndex = page * pageSize;
      setHasMore(totalLoadedUsers > currentPageEndIndex || (page <= maxLoadedPage && hasMore));
      
      return;
    }

    // Only fetch from backend for new pages
    if (!dataLoaded || page > maxLoadedPage) {
      try {
        setLoading(true);
        console.log(`Fetching page ${page}, size ${pageSize}`);
        
        // Get lastDoc for the previous page
        const lastDoc = page > 1 ? pageDocuments[page - 1] : null;
        
        const response = await axiosInstance.get('/api/admin/all-users', {
          params: {
            page,
            limit: pageSize,
            lastDoc: lastDoc
          }
        });

        const newUsers = response.data.users || [];
        const newLastDoc = response.data.lastDoc;
        const newHasMore = response.data.hasMore;

        if (page === 1) {
          // First page - replace all data
          setAllUsers(newUsers);
          setUsers(newUsers);
          setMaxLoadedPage(1);
          setTotalUsersNumber(response.data.totalUsers || newUsers.length);
        } else {
          // Subsequent pages - append to existing data
          setAllUsers(prev => [...prev, ...newUsers]);
          setUsers(newUsers);
          setMaxLoadedPage(page);
        }

        // Store lastDoc for this page
        setPageDocuments(prev => ({
          ...prev,
          [page]: newLastDoc
        }));

        setHasMore(newHasMore);
        setError(null);
        setDataLoaded(true);
      } catch (err) {
        console.error('Error fetching users:', err);
        setError('Failed to fetch users. Please try again.');
      } finally {
        setLoading(false);
      }
    }
  }, [currentPage, pageSize, dataLoaded, maxLoadedPage, allUsers, pageDocuments, hasMore, getCurrentPageUsers]);

  const goToPage = useCallback((page) => {
    if (page < 1) return;
    
    setCurrentPage(page);
    
    // If going to a page we haven't loaded yet, fetch it
    if (page > maxLoadedPage) {
      fetchUsers(page);
    } else {
      // Use existing data
      const pageUsers = getCurrentPageUsers(page, pageSize);
      setUsers(pageUsers);
      
      // Calculate hasMore for existing pages
      const totalLoadedUsers = allUsers.length;
      const currentPageEndIndex = page * pageSize;
      setHasMore(totalLoadedUsers > currentPageEndIndex);
    }
  }, [maxLoadedPage, fetchUsers, getCurrentPageUsers, pageSize, allUsers]);

  const goToNextPage = useCallback(() => {
    if (hasMore || currentPage < maxLoadedPage) {
      goToPage(currentPage + 1);
    }
  }, [hasMore, currentPage, maxLoadedPage, goToPage]);

  const goToPrevPage = useCallback(() => {
    if (currentPage > 1) {
      goToPage(currentPage - 1);
    }
  }, [currentPage, goToPage]);

  const changePageSize = useCallback((newSize) => {
    setPageSize(newSize);
    setCurrentPage(1);
    
    // Recalculate current page users with new page size
    const pageUsers = getCurrentPageUsers(1, newSize);
    setUsers(pageUsers);
    
    // Reset pagination state since page size changed
    setMaxLoadedPage(Math.ceil(allUsers.length / newSize));
    setPageDocuments({});
    
    // Recalculate hasMore
    setHasMore(allUsers.length > newSize);
  }, [allUsers.length, getCurrentPageUsers]);

  const refreshUsers = useCallback(async () => {
    // Reset all pagination state and fetch fresh data
    setAllUsers([]);
    setUsers([]);
    setCurrentPage(1);
    setMaxLoadedPage(0);
    setPageDocuments({});
    setDataLoaded(false);
    setHasMore(false);
    
    await fetchUsers(1);
  }, [fetchUsers]);

  // ...existing addNote, updateNote, deleteNote functions...

  // Initial fetch
  useEffect(() => {
    if (!dataLoaded) {
      fetchUsers(1);
    }
  }, [fetchUsers, dataLoaded]);

  const value = {
    users,
    allUsers, // Expose all users for components that need it
    loading,
    error,
    currentPage,
    pageSize,
    hasMore,
    maxLoadedPage, // Expose for debugging/info
    totalLoadedUsers: allUsers.length, // Total users loaded so far
    totalUsersNumber: toatlUsersNumber, // Total users fetched from backend
    
    // Pagination functions
    goToPage,
    goToNextPage,
    goToPrevPage,
    changePageSize,
    fetchUsers,
    refreshUsers,
    
    // Notes functions
    // notes,
    // addNote,
    // updateNote,
    // deleteNote
  };

  return (
    <UsersContext.Provider value={value}>
      {children}
    </UsersContext.Provider>
  );
};

export const useUsers = () => {
  const context = useContext(UsersContext);
  if (context === undefined) {
    throw new Error('useUsers must be used within a UsersProvider');
  }
  return context;
};
