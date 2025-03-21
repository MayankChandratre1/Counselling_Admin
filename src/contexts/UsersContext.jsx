import React, { createContext, useState, useContext, useCallback } from 'react';
import axiosInstance from '../utils/axios';

const UsersContext = createContext();

export const UsersProvider = ({ children }) => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [hasMore, setHasMore] = useState(false);

  const fetchUsers = useCallback(async (page = currentPage) => {
    try {
      setLoading(true);
      const response = await axiosInstance.get('/api/admin/all-users', {
        params: {
          page,
          limit: pageSize
        }
      });
      setUsers(response.data);
      setHasMore(response.data.hasMore);
      setError(null);
    } catch (err) {
      setError('Failed to fetch users');
      console.error('Error fetching users:', err);
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

  const value = {
    users,
    loading,
    error,
    currentPage,
    pageSize,
    hasMore,
    setCurrentPage,
    setPageSize,
    fetchUsers,
    searchUsers,
    updateUser,
    deleteUser,
    setLoading,
    setError,
    setUsers
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
