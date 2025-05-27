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

  // Separate the initial fetch from explicit refresh operations
  const fetchUsers = useCallback(async (page = currentPage) => {
    // Only fetch if data hasn't been loaded yet
    if (!dataLoaded) {
      try {
        setLoading(true);
        console.log(`Initial fetch - page ${page}, size ${pageSize}, ${currentPage > 1 ? users[0]?.id : undefined} pagination}`);
        const response = await axiosInstance.get('/api/admin/all-users', {
          params: {
            page,
            limit: pageSize,
            lastDoc: lastDoc ? lastDoc: undefined // Use last user ID for pagination
          }
        });
        setUsers(response.data.users);
        setLastDoc(response.data.lastDoc); // Update lastDoc for future pagination
        setHasMore(response.data.hasMore);
        setError(null);
        setDataLoaded(true); // Mark that data has been loaded
      } catch (err) {
        setError('Failed to fetch users');
        console.error('Error fetching users:', err);
      } finally {
        setLoading(false);
      }
    }
  }, [currentPage, pageSize, dataLoaded]);

  // New function for explicit refreshes
  const refreshUsers = useCallback(async (page = currentPage) => {
    try {
      setLoading(true);
      console.log(`Refreshing users data - page ${page}, size ${pageSize}`);
      const response = await axiosInstance.get('/api/admin/all-users', {
        params: {
          page,
          limit: pageSize,
           lastDoc: lastDoc ? lastDoc: undefined // Use last user ID for pagination
        }
      });
      setUsers(response.data.users);
      setHasMore(response.data.hasMore);
      setLastDoc(response.data.lastDoc); // Update lastDoc for future pagination
      setError(null);
    } catch (err) {
      setError('Failed to refresh users');
      console.error('Error refreshing users:', err);
    } finally {
      setLoading(false);
    }
  }, [currentPage, pageSize]);

  const searchUsers = async (searchParams) => {
    try {
      setLoading(true);
      const response = await axiosInstance.post('/api/admin/user/search', searchParams);
      setUsers(response.data);
      setError(null);
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

  const value = {
    users,
    loading,
    error,
    currentPage,
    pageSize,
    hasMore,
    dataLoaded,
    setCurrentPage,
    setPageSize,
    fetchUsers,
    refreshUsers, // Add the new function to the context
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
