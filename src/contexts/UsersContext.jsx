import React, { createContext, useState, useContext, useCallback, useEffect, useRef } from 'react';
import axiosInstance from '../utils/axios';
import { encodeNoteKey } from '../utils/noteKeys';
import {
  DEFAULT_USER_FILTERS,
  isUserFilterActive,
  buildUserFilterParams,
} from '../utils/userFilterParams';

const UsersContext = createContext();

export const UsersProvider = ({ children }) => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastDoc, setLastDoc] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [hasMore, setHasMore] = useState(false);
  const [notes, setNotes] = useState({});
  const [dataLoaded, setDataLoaded] = useState(false);
  const [toatlUsersNumber, setTotalUsersNumber] = useState(0);

  const [paginationCache, setPaginationCache] = useState(new Map());
  const [lastDocCache, setLastDocCache] = useState(new Map());

  const [filters, setFilters] = useState({ ...DEFAULT_USER_FILTERS });
  const [isFilterActive, setIsFilterActive] = useState(false);
  const [premiumUsersOnly, setPremiumUsersOnly] = useState(false);

  const filtersRef = useRef(filters);
  filtersRef.current = filters;

  const paginationCacheRef = useRef(paginationCache);
  paginationCacheRef.current = paginationCache;

  const lastDocCacheRef = useRef(lastDocCache);
  lastDocCacheRef.current = lastDocCache;

  const pageSizeRef = useRef(pageSize);
  pageSizeRef.current = pageSize;

  const initialLoadDone = useRef(false);

  const getCacheKey = (page, activeFilters, size) => {
    return `${page}-${JSON.stringify(activeFilters)}-${size}`;
  };

  const fetchUsers = useCallback(async (
    page = 1,
    resetPagination = false,
    premiumOnly = false,
    filtersOverride = null
  ) => {
    const effectiveFilters = filtersOverride ?? filtersRef.current;
    setIsFilterActive(isUserFilterActive(effectiveFilters));

    const cacheKey = getCacheKey(page, effectiveFilters, pageSizeRef.current);
    const cache = paginationCacheRef.current;

    if (!resetPagination && cache.has(cacheKey)) {
      const cachedData = cache.get(cacheKey);
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

      const requestParams = {
        page,
        limit: pageSizeRef.current,
        ...buildUserFilterParams(effectiveFilters, { premiumOnly }),
      };

      if (page > 1 && !resetPagination) {
        const prevPageCacheKey = getCacheKey(page - 1, effectiveFilters, pageSizeRef.current);
        if (lastDocCacheRef.current.has(prevPageCacheKey)) {
          requestParams.lastDoc = lastDocCacheRef.current.get(prevPageCacheKey);
        }
      }

      const response = await axiosInstance.get('/api/admin/all-users', {
        params: requestParams,
      });

      const responseData = {
        users: response.data.users || [],
        hasMore: response.data.hasMore || false,
        lastDoc: response.data.lastDoc || null,
        totalUsers: response.data.totalUsers || response.data.users?.length || 0,
      };

      setPaginationCache((prev) => {
        const next = new Map(prev);
        next.set(cacheKey, responseData);
        paginationCacheRef.current = next;
        return next;
      });

      if (responseData.lastDoc) {
        setLastDocCache((prev) => {
          const next = new Map(prev);
          next.set(cacheKey, responseData.lastDoc);
          lastDocCacheRef.current = next;
          return next;
        });
      }

      setUsers(responseData.users);
      setHasMore(responseData.hasMore);
      setLastDoc(responseData.lastDoc);
      setTotalUsersNumber(responseData.totalUsers);
      setError(null);
      setDataLoaded(true);
      setCurrentPage(page);

      const notesMap = {};
      responseData.users.forEach((u) => {
        notesMap[u.id] = { notes: u.notes };
      });
      setNotes(notesMap);
    } catch (err) {
      setError('Failed to fetch users');
      console.error('Error fetching users:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const clearPaginationCache = useCallback(() => {
    const empty = new Map();
    paginationCacheRef.current = empty;
    lastDocCacheRef.current = empty;
    setPaginationCache(empty);
    setLastDocCache(empty);
  }, []);

  const updateFilters = useCallback((newFilters, premiumOnly = false) => {
    filtersRef.current = newFilters;
    setFilters(newFilters);
    clearPaginationCache();
    setCurrentPage(1);
    setLastDoc(null);
    fetchUsers(1, true, premiumOnly, newFilters);
  }, [fetchUsers, clearPaginationCache]);

  const clearFilters = useCallback((premiumOnly = false) => {
    const clearedFilters = { ...DEFAULT_USER_FILTERS };
    filtersRef.current = clearedFilters;
    setFilters(clearedFilters);
    clearPaginationCache();
    setCurrentPage(1);
    setLastDoc(null);
    fetchUsers(1, true, premiumOnly, clearedFilters);
  }, [fetchUsers, clearPaginationCache]);

  const goToPage = useCallback((page, premiumOnly = false) => {
    if (page < 1) return;
    if (page === currentPage && dataLoaded) return;
    fetchUsers(page, false, premiumOnly);
  }, [fetchUsers, currentPage, dataLoaded]);

  const goToNextPage = useCallback((premiumOnly = false) => {
    if (hasMore) {
      goToPage(currentPage + 1, premiumOnly);
    }
  }, [hasMore, currentPage, goToPage]);

  const goToPrevPage = useCallback((premiumOnly = false) => {
    if (currentPage > 1) {
      goToPage(currentPage - 1, premiumOnly);
    }
  }, [currentPage, goToPage]);

  const changePageSize = useCallback((newSize, premiumOnly = false) => {
    pageSizeRef.current = newSize;
    setPageSize(newSize);
    setCurrentPage(1);
    setLastDoc(null);
    clearPaginationCache();
    fetchUsers(1, true, premiumOnly, filtersRef.current);
  }, [fetchUsers, clearPaginationCache]);

  const refreshUsers = useCallback(async (page = 1, premiumOnly = false) => {
    clearPaginationCache();
    setLastDoc(null);
    await fetchUsers(page, true, premiumOnly, filtersRef.current);
  }, [fetchUsers, clearPaginationCache]);

  const searchUsers = async (searchParams) => {
    try {
      setLoading(true);
      const response = await axiosInstance.post('/api/admin/user/search', searchParams);
      clearPaginationCache();
      setLastDoc(null);
      setUsers(response.data);

      const notesMap = {};
      response.data.forEach((u) => {
        notesMap[u.id] = { notes: u.notes };
      });
      setNotes(notesMap);
      setError(null);
      setDataLoaded(true);
      return response.data;
    } catch (err) {
      setError('Failed to search users');
      console.error('Error searching users:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateUser = async (userId, userData) => {
    try {
      setLoading(true);
      const response = await axiosInstance.put(`/api/admin/update-user/${userId}`, userData);
      setUsers(users.map((user) => (user.id === userId ? response.data : user)));
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
      setUsers(users.filter((user) => user.id !== userId));
      setError(null);
    } catch (err) {
      setError('Failed to delete user');
      console.error('Error deleting user:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserNotes = async (userId) => {
    try {
      const response = await axiosInstance.get(`/api/admin/get-notes/${userId}`);
      return response.data || { id: userId, notes: {} };
    } catch (err) {
      console.error(`Error fetching notes for user ${userId}:`, err);
      return { id: userId, notes: {} };
    }
  };

  useEffect(() => {
    const fetchAllNotes = async () => {
      const notesPromises = users.map((user) => fetchUserNotes(user.id));
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
      fetchAllNotes();
    }
  }, [users]);

  const updateUserNotes = (userId, adminEmail, note, createdAt) => {
    setNotes((prevNotes) => ({
      ...prevNotes,
      [userId]: {
        id: userId,
        notes: {
          ...(prevNotes[userId]?.notes || {}),
          [encodeNoteKey(adminEmail)]: {
            note,
            createdAt,
          },
        },
      },
    }));
  };

  useEffect(() => {
    const hasToken = !!sessionStorage.getItem('adminToken');
    if (!initialLoadDone.current && hasToken) {
      initialLoadDone.current = true;
      fetchUsers(1, true, premiumUsersOnly);
    }
  }, [fetchUsers, premiumUsersOnly]);

  const exportFilteredUsers = useCallback(async ({ batch, isSearchMode, searchParams } = {}) => {
    const exportFilters = { ...filtersRef.current };
    if (batch && batch !== 'all') {
      exportFilters.batch = batch;
    }
    if (isSearchMode && searchParams) {
      if (searchParams.name?.trim()) exportFilters.name = searchParams.name.trim();
      if (searchParams.phone?.trim()) exportFilters.phone = searchParams.phone.trim();
    }
    const params = buildUserFilterParams(exportFilters);
    const response = await axiosInstance.get('/api/admin/all-users/export', { params });
    return response.data;
  }, []);

  const value = {
    users,
    loading,
    error,
    currentPage,
    pageSize,
    hasMore,
    dataLoaded,
    totalUsersNumber: toatlUsersNumber,
    filters,
    isFilterActive,
    updateFilters,
    clearFilters,
    goToPage,
    goToNextPage,
    goToPrevPage,
    changePageSize,
    fetchUsers,
    refreshUsers,
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
    setPremiumUsersOnly,
    exportFilteredUsers,
    refetchIfNeeded: useCallback(() => {
      if (users.length === 0 && !loading && sessionStorage.getItem('adminToken')) {
        initialLoadDone.current = false;
        fetchUsers(1, true, premiumUsersOnly);
        initialLoadDone.current = true;
      }
    }, [users.length, loading, fetchUsers, premiumUsersOnly]),
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
