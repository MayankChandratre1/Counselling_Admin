import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';
import axiosInstance from '../utils/axios';
import {
  applyPurchaseYearToAnalyticsData,
  readStoredPurchaseYear,
  writeStoredPurchaseYear,
} from '../utils/analyticsYearFilter';
import { getDateMillis, parseDate, formatDisplayDate } from '../utils/formatDate';

const AnalyticsContext = createContext();

export const useAnalytics = () => {
  const context = useContext(AnalyticsContext);
  if (!context) {
    throw new Error('useAnalytics must be used within an AnalyticsProvider');
  }
  return context;
};

const initialAnalyticsState = {
  totalUsers: 0,
  metrics: {
    installs: 0,
    enrolled: { total: 0, users: [] },
    todayEnrolled: { total: 0, users: [] },
    paymentPending: { total: 0, users: [] }
  },
  premiumPlanDistribution: {},
  usersWithLists: 0,
  usersWithoutLists: 0,
  listData: null
};

export const AnalyticsProvider = ({ children }) => {
  const [rawAnalyticsData, setRawAnalyticsData] = useState(initialAnalyticsState);
  const [purchaseYearFilter, setPurchaseYearFilterState] = useState(() =>
    readStoredPurchaseYear()
  );

  const analyticsData = useMemo(
    () => applyPurchaseYearToAnalyticsData(rawAnalyticsData, purchaseYearFilter),
    [rawAnalyticsData, purchaseYearFilter]
  );

  const setPurchaseYearFilter = useCallback((value) => {
    setPurchaseYearFilterState(value);
    writeStoredPurchaseYear(value);
  }, []);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastFetched, setLastFetched] = useState(null);

  const fetchAnalyticsData = useCallback(async (forceRefresh = false) => {
    // Don't fetch if data is fresh (less than 5 minutes old) unless forced
    if (!forceRefresh && lastFetched && Date.now() - lastFetched < 5 * 60 * 1000) {
      return rawAnalyticsData;
    }

    setLoading(true);
    setError(null);
    
    try {
      const response = await axiosInstance('/api/admin/get-analytics');
      const data = response.data;
      
      setRawAnalyticsData(data);
      setLastFetched(Date.now());
      return data;
    } catch (error) {
      console.error('Error fetching analytics data:', error);
      setError(error.message || 'Failed to fetch analytics data');
      throw error;
    } finally {
      setLoading(false);
    }
  }, [rawAnalyticsData, lastFetched]);

  const refreshAnalytics = useCallback(() => {
    return fetchAnalyticsData(true);
  }, [fetchAnalyticsData]);

  // Helper function to get metric users with filters
  const getMetricUsers = useCallback((metricType, filters = {}) => {
    let users = [];
    
    switch (metricType) {
      case 'enrolled':
        users = analyticsData.metrics.enrolled.users || [];
        break;
      case 'todayEnrolled':
        users = analyticsData.metrics.todayEnrolled.users || [];
        break;
      case 'paymentPending':
        users = analyticsData.metrics.paymentPending.users || [];
        break;
      default:
        return [];
    }

    // Apply filters
    let filteredUsers = [...users];

    // Plan filter
    if (filters.planFilter && filters.planFilter !== 'all') {
      filteredUsers = filteredUsers.filter(user => {
        const userPlan = user.planTitle || '';
        return userPlan.toLowerCase() == filters.planFilter.toLowerCase();
      });
    }

    // Date filters
    if (filters.fromDate || filters.toDate) {
      filteredUsers = filteredUsers.filter(user => {
        if (!user.purchasedDate) return false;

        const purchaseDate = parseDate(user.purchasedDate);
        if (!purchaseDate) return false;

        const fromDate = filters.fromDate ? parseDate(filters.fromDate) : null;
        const toDate = filters.toDate ? parseDate(filters.toDate) : null;

        if (fromDate) {
          fromDate.setHours(0, 0, 0, 0);
        }
        if (toDate) {
          toDate.setHours(23, 59, 59, 999);
        }

        if (fromDate && purchaseDate < fromDate) return false;
        if (toDate && purchaseDate > toDate) return false;

        return true;
      });
    }

    // Apply sorting
    if (filters.sortOrder) {
      filteredUsers.sort((a, b) => {
        const dateA = getDateMillis(a.purchasedDate);
        const dateB = getDateMillis(b.purchasedDate);

        if (filters.sortOrder === 'desc') {
          return dateB - dateA;
        }
        return dateA - dateB;
      });
    }

    return filteredUsers;
  }, [analyticsData]);

  // Helper function to get unique plans for a metric
  const getUniquePlans = useCallback((metricType) => {
    const users = (() => {
      switch (metricType) {
        case 'enrolled':
          return analyticsData.metrics.enrolled.users || [];
        case 'todayEnrolled':
          return analyticsData.metrics.todayEnrolled.users || [];
        case 'paymentPending':
          return analyticsData.metrics.paymentPending.users || [];
        default:
          return [];
      }
    })();

    const plans = [...new Set(users.map(user => user.planTitle).filter(Boolean))];
    return plans.sort();
  }, [analyticsData]);

  // Helper function to get available list names
  const getAvailableListNames = useCallback(() => {
    if (!analyticsData.listData) return [];
    
    const lists = new Set();
    const data = analyticsData.listData;
    
    [...(data.usersWithListsOnline?.users || []), ...(data.usersWithListsOffline?.users || [])]
      .forEach(user => {
        user.lists?.forEach(listName => lists.add(listName));
      });
    
    return Array.from(lists);
  }, [analyticsData]);

  // Calculate derived metrics
  const getDerivedMetrics = useCallback(() => {
    return {
      totalEnrolled: analyticsData.metrics.enrolled.total,
      enrollmentRate: analyticsData.totalUsers > 0 ? 
        (analyticsData.metrics.enrolled.total / analyticsData.totalUsers * 100).toFixed(2) : 0,
      listAssignmentRate: analyticsData.totalUsers > 0 ? 
        (analyticsData.usersWithLists / analyticsData.totalUsers * 100).toFixed(2) : 0,
      isDataStale: lastFetched && Date.now() - lastFetched > 5 * 60 * 1000,
      lastUpdated: lastFetched ? formatDisplayDate(lastFetched) : null
    };
  }, [analyticsData, lastFetched]);

  const value = {
    // Data (scoped by purchaseYearFilter when not ALL)
    analyticsData,
    rawAnalyticsData,
    purchaseYearFilter,
    setPurchaseYearFilter,
    loading,
    error,
    lastFetched,
    
    // Actions
    fetchAnalyticsData,
    refreshAnalytics,
    
    // Helper functions
    getMetricUsers,
    getUniquePlans,
    getAvailableListNames,
    getDerivedMetrics,
    
    // Computed values
    isDataAvailable: Object.keys(analyticsData.metrics).length > 0,
    isDataStale: lastFetched && Date.now() - lastFetched > 5 * 60 * 1000,
  };

  return (
    <AnalyticsContext.Provider value={value}>
      {children}
    </AnalyticsContext.Provider>
  );
};

export default AnalyticsContext;
