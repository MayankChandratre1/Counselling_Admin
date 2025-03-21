import React, { createContext, useState, useContext, useCallback } from 'react';
import axiosInstance from '../utils/axios';

const CollegesContext = createContext();

export const CollegesProvider = ({ children }) => {
  const [colleges, setColleges] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [hasMore, setHasMore] = useState(false);
  const [nextPageId, setNextPageId] = useState(null);

  const fetchColleges = useCallback(async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get('/api/colleges', {
        params: {
          page: currentPage,
          limit: pageSize,
          lastDocId: nextPageId
        }
      });
      
      setColleges(response.data.colleges);
      setNextPageId(response.data.nextPageId);
      setHasMore(response.data.hasMore);
      setError(null);
    } catch (err) {
      setError('Failed to fetch colleges');
      console.error('Error fetching colleges:', err);
    } finally {
      setLoading(false);
    }
  }, [currentPage, pageSize, nextPageId]);

  const searchColleges = async (searchParams) => {
    try {
      setLoading(true);
      const response = await axiosInstance.get('/api/colleges/search', {
        params: {
          ...searchParams,
          page: 1,
          limit: pageSize
        }
      });
      
      setColleges(response.data.colleges);
      setHasMore(response.data.pagination.hasMore);
      setCurrentPage(response.data.pagination.currentPage);
      setError(null);
    } catch (err) {
      setError('Failed to search colleges');
      console.error('Error searching colleges:', err);
    } finally {
      setLoading(false);
    }
  };

  const createCollege = async (collegeData) => {
    try {
      setLoading(true);
      const response = await axiosInstance.post('/api/colleges', collegeData);
      setColleges([...colleges, response.data]);
      setError(null);
      return response.data;
    } catch (err) {
      setError('Failed to create college');
      console.error('Error creating college:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateCollege = async (collegeId, collegeData) => {
    try {
      setLoading(true);
      const response = await axiosInstance.put(`/api/colleges/${collegeId}`, collegeData);
      setColleges(colleges.map(college => 
        college.id === collegeId ? { ...college, ...response.data } : college
      ));
      setError(null);
      return response.data;
    } catch (err) {
      setError('Failed to update college');
      console.error('Error updating college:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const deleteCollege = async (collegeId) => {
    try {
      setLoading(true);
      await axiosInstance.delete(`/api/colleges/${collegeId}`);
      setColleges(colleges.filter(college => college.id !== collegeId));
      setError(null);
    } catch (err) {
      setError('Failed to delete college');
      console.error('Error deleting college:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const value = {
    colleges,
    loading,
    error,
    currentPage,
    pageSize,
    hasMore,
    nextPageId,
    setCurrentPage,
    setPageSize,
    fetchColleges,
    searchColleges,
    createCollege,
    updateCollege,
    deleteCollege
  };

  return <CollegesContext.Provider value={value}>{children}</CollegesContext.Provider>;
};

export const useColleges = () => {
  const context = useContext(CollegesContext);
  if (context === undefined) {
    throw new Error('useColleges must be used within a CollegesProvider');
  }
  return context;
};
