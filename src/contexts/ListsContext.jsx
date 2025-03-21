import React, { createContext, useState, useContext, useCallback } from 'react';
import axiosInstance from '../utils/axios';

const ListsContext = createContext();

export const ListsProvider = ({ children }) => {
  const [lists, setLists] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchLists = useCallback(async () => {
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
  }, []);

  const createList = async (listData) => {
    try {
      setLoading(true);
      const response = await axiosInstance.post('/api/admin/add-list', listData);
      setLists([...lists, response.data]);
      setError(null);
      return response.data;
    } catch (err) {
      setError('Failed to create list');
      console.error('Error creating list:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateList = async (listId, listData) => {
    try {
      setLoading(true);
      const response = await axiosInstance.post(`/api/admin/edit-list/${listId}`, listData);
      setLists(lists.map(list => list.id === listId ? response.data : list));
      setError(null);
      return response.data;
    } catch (err) {
      setError('Failed to update list');
      console.error('Error updating list:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const deleteList = async (listId) => {
    try {
      setLoading(true);
      await axiosInstance.delete(`/api/admin/delete-list/${listId}`);
      setLists(lists.filter(list => list.id !== listId));
      setError(null);
    } catch (err) {
      setError('Failed to delete list');
      console.error('Error deleting list:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const value = {
    lists,
    loading,
    error,
    fetchLists,
    createList,
    updateList,
    deleteList
  };

  return <ListsContext.Provider value={value}>{children}</ListsContext.Provider>;
};

export const useLists = () => {
  const context = useContext(ListsContext);
  if (context === undefined) {
    throw new Error('useLists must be used within a ListsProvider');
  }
  return context;
};
