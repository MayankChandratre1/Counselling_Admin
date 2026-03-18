import React, { createContext, useContext, useState, useCallback } from 'react';
import axiosInstance from '../utils/axios';
import { usePremiumPage } from './PremiumPageContext';

const FormProgressContext = createContext();

export const useFormProgress = () => {
  const context = useContext(FormProgressContext);
  if (!context) {
    throw new Error('useFormProgress must be used within a FormProgressProvider');
  }
  return context;
};

export const FormProgressProvider = ({ children }) => {
  const [forms, setForms] = useState([]);
  const [selectedForm, setSelectedForm] = useState(null);
  const [formSteps, setFormSteps] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(800);
  const [totalPages, setTotalPages] = useState(0);
  const [totalUsers, setTotalUsers] = useState(0);
  
  // Data state
  const [stepData, setStepData] = useState({});
  const [paginatedUserProgress, setPaginatedUserProgress] = useState([]);
  const [enrolledUserIds, setEnrolledUserIds] = useState([]);
  
  // Cache for pagination
  const [pageCache, setPageCache] = useState(new Map());


  // Get premium plans from context
  const { premiumPlans } = usePremiumPage();

  const normalizeStatus = (status) => {
    if (typeof status !== 'string') return null;
    const normalized = status.trim().toLowerCase();
    if (normalized === 'yes') return 'yes';
    if (normalized === 'no') return 'no';
    return null;
  };

  const fetchForms = useCallback(async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get('/api/admin/formsteps');
      setForms(response.data);
      setError(null);
    } catch (err) {
      console.error('Error fetching forms:', err);
      setError('Failed to fetch forms');
    } finally {
      setLoading(false);
    }
  }, []);

  const selectForm = useCallback((formId) => {
    setSelectedForm(formId);
    const selectedFormData = forms.find(form => form.id === formId);
    if (selectedFormData) {
      setFormSteps(selectedFormData.steps.sort((a, b) => a.number - b.number));
    } else {
      setFormSteps([]);
    }
    
    // Reset pagination when form changes
    setCurrentPage(1);
    setPageCache(new Map());
    setPaginatedUserProgress([]);
    setStepData({});
  }, [forms]);

  const initializeFormProgress = useCallback((analyticsData) => {
    const enrolledUsers = analyticsData?.metrics?.enrolled?.users || [];
    
    // Filter users based on selected form and premium plans
    let filteredUsers = enrolledUsers;
    
    if (selectedForm && premiumPlans && premiumPlans.length > 0) {
      const planWithForm = premiumPlans.find(plan => plan.form === selectedForm);
      
      if (planWithForm) {
        filteredUsers = enrolledUsers.filter(user => 
          user.planTitle === planWithForm.title
        );
        
        console.log(`Filtering users for form ${selectedForm} with plan ${planWithForm.title}:`, {
          totalEnrolled: enrolledUsers.length,
          filteredForPlan: filteredUsers.length,
          planTitle: planWithForm.title
        });
      } else {
        console.warn(`No plan found with form ${selectedForm}. Falling back to enrolled users.`);
      }
    }
    
    const userIds = filteredUsers.map(user => user.id);
    
    setEnrolledUserIds(userIds);
    setTotalUsers(userIds.length);
    setTotalPages(Math.ceil(userIds.length / itemsPerPage));
    
    // Reset pagination and clear cache when form changes
    setCurrentPage(1);
    setPageCache(new Map());
    setPaginatedUserProgress([]);
    setStepData({});
  }, [itemsPerPage, selectedForm, premiumPlans]);

  const fetchStepDataForPage = useCallback(async (page, userIds, formId) => {
    if (!formId) return [];

    const cacheKey = `${formId}-${page}`;
    
    // Check cache first
    if (pageCache.has(cacheKey)) {
      const cachedData = pageCache.get(cacheKey);
      setPaginatedUserProgress(cachedData);
      return cachedData;
    }

    try {
      setLoading(true);
      
      // Calculate pagination
      const startIndex = (page - 1) * itemsPerPage;
      const endIndex = startIndex + itemsPerPage;
      const hasUserIds = Array.isArray(userIds) && userIds.length > 0;
      const pageUserIds = hasUserIds ? userIds.slice(startIndex, endIndex) : [];
      const response = await axiosInstance.post(`/api/admin/users/form/${formId}`, {
        userIds: pageUserIds
      });

      const backendUserData = Array.isArray(response.data)
        ? response.data
        : (response.data?.users || []);

      const backendTotalUsers = Number(response.data?.totalUsers);
      const resolvedTotalUsers = Number.isFinite(backendTotalUsers)
        ? backendTotalUsers
        : (hasUserIds ? userIds.length : backendUserData.length);

      setTotalUsers(resolvedTotalUsers);
      setTotalPages(Math.max(1, Math.ceil(resolvedTotalUsers / itemsPerPage)));
      
      // Create a complete user data array for all requested IDs
      const completeUserData = hasUserIds
        ? pageUserIds.map(userId => {
            const existingData = backendUserData.find(userData => userData.id === userId);
            
            if (existingData) {
              return existingData;
            } else {
              // For users without data, create a placeholder with empty steps
              return {
                id: userId,
                stepsData: {
                  id: formId,
                  steps: []
                }
              };
            }
          })
        : backendUserData;
      
      // Cache the complete result (including users without data)
      setPageCache(prev => new Map(prev.set(cacheKey, completeUserData)));
      setPaginatedUserProgress(completeUserData);
      setError(null);
      
      return completeUserData;
    } catch (err) {
      console.error('Error fetching step data:', err);
      setError('Failed to fetch step data');
      return [];
    } finally {
      setLoading(false);
    }
  }, [itemsPerPage, pageCache]);

  const processStepData = useCallback((allUserData, analyticsData) => {
    const stepsProgress = {};
    const enrolledUsers = analyticsData?.metrics?.enrolled?.users || [];
    const enrolledUsersMap = new Map(enrolledUsers.map(user => [user.id, user]));
    
    // Process all cached data to get complete step statistics
    const allCachedData = Array.from(pageCache.values()).flat();
    const allUserProgressData = [...allCachedData, ...allUserData];
    
    // Remove duplicates based on user ID
    const uniqueUserData = allUserProgressData.reduce((acc, current) => {
      const existing = acc.find(item => item.id === current.id);
      if (!existing) {
        acc.push(current);
      }
      return acc;
    }, []);

    uniqueUserData.forEach(userData => {
      if (userData.stepsData?.steps) {
        const user = enrolledUsersMap.get(userData.id);
        
        const userBatch = user?.batch || 'unknown';
        
        userData.stepsData.steps.forEach(step => {
          if (!stepsProgress[step.number]) {
            stepsProgress[step.number] = {
              title: step.title,
              completedCount: 0,
              rejectedCount: 0,
              online: 0,
              offline: 0,
              totalCount: uniqueUserData.length
            };
          }
          
          const normalizedStatus = normalizeStatus(step.status);

          if (normalizedStatus === 'yes') {
            stepsProgress[step.number].completedCount++;
            if (userBatch === 'online') {
              stepsProgress[step.number].online++;
            } else if (userBatch === 'offline') {
              stepsProgress[step.number].offline++;
            }
          } else if (normalizedStatus === 'no') {
            stepsProgress[step.number].rejectedCount++;
          }
        });
      }
    });

    setStepData(stepsProgress);
  }, [pageCache]);

  const goToPage = useCallback(async (page, analyticsData) => {
    if (page < 1 || !selectedForm) return;
    if (totalPages > 0 && page > totalPages) return;
    
    const userData = await fetchStepDataForPage(page, enrolledUserIds, selectedForm);
    
    if (userData && analyticsData) {
      processStepData(userData, analyticsData);
      // Only set current page after successful fetch
      setCurrentPage(page);
    }
  }, [totalPages, selectedForm, enrolledUserIds, fetchStepDataForPage, processStepData]); // Remove processStepData and fetchStepDataForPage from dependencies

  // Add a new function specifically for form initialization
  const initializeFormData = useCallback(async (analyticsData) => {
    if (!selectedForm || !analyticsData) return;
    
    // Fetch page 1 data after form initialization
    const userData = await fetchStepDataForPage(1, enrolledUserIds, selectedForm);
    
    if (userData) {
      processStepData(userData, analyticsData);
    }
  }, [selectedForm, enrolledUserIds, fetchStepDataForPage, processStepData]); // Stable dependencies

  // Add the missing refreshCurrentPage function
  const refreshCurrentPage = useCallback(async (analyticsData) => {
    if (!selectedForm || !analyticsData) return;
    
    // Clear the current page cache and refetch
    const cacheKey = `${selectedForm}-${currentPage}`;
    setPageCache(prev => {
      const newCache = new Map(prev);
      newCache.delete(cacheKey);
      return newCache;
    });
    
    // Refetch the current page without changing currentPage
    const userData = await fetchStepDataForPage(currentPage, enrolledUserIds, selectedForm);
    
    if (userData && analyticsData) {
      processStepData(userData, analyticsData);
    }
  }, [selectedForm, currentPage, enrolledUserIds, fetchStepDataForPage, processStepData]);

  const getStepUsers = useCallback((stepNumber, batch, analyticsData) => {
    const complete = [];
    const rejected = [];
    const unattended = [];
    const enrolledUsers = analyticsData?.metrics?.enrolled?.users || [];
    const enrolledUsersMap = new Map(enrolledUsers.map(user => [user.id, user]));

    // Get all cached user progress data
    const allCachedData = Array.from(pageCache.values()).flat();
    
    // Create a set of processed user IDs from cache
    const processedUserIds = new Set();
    
    // Process users with cached data
    allCachedData.forEach(userData => {
      const user = enrolledUsersMap.get(userData.id);
      
      processedUserIds.add(userData.id);
      
      if (batch && user?.batch !== batch) return;
      
      const userWithProgress = {
        id: userData.id,
        name: userData.name || user?.name || '-',
        phone: user?.phone || '-',
        batch: user?.batch || 'unknown',
        steps: userData.stepsData?.steps || []
      };
      
      const step = userData.stepsData?.steps?.find(s => s.number === stepNumber);
      const normalizedStatus = normalizeStatus(step?.status);
      
      if (!step  || userData.stepsData?.steps?.length === 0) {
        // If no step data exists or steps array is empty, user is unattended
        unattended.push(userWithProgress);
      } else if (normalizedStatus === 'yes') {
        complete.push(userWithProgress);
      } else if (normalizedStatus === 'no') {
        rejected.push(userWithProgress);
      } else{
        unattended.push(userWithProgress);
      }
    });

    return { complete, rejected, unattended };
  }, [pageCache]);

  const getCurrentFormPlan = useCallback(() => {
    return premiumPlans.find(plan => plan.form === selectedForm);
  }, [selectedForm, premiumPlans]);

  const value = {
    // Forms data
    forms,
    selectedForm,
    formSteps,
    
    // Pagination
    currentPage,
    itemsPerPage,
    totalPages,
    totalUsers,
    
    // Data
    stepData,
    paginatedUserProgress,
    enrolledUserIds,
    
    // Loading states
    loading,
    error,
    
    // Actions
    fetchForms,
    selectForm,
    initializeFormProgress,
    initializeFormData, // Add new function
    goToPage,
    getStepUsers,
    refreshCurrentPage,
    
    // Cache info
    getCachedPagesCount: () => pageCache.size,
    getTotalCachedUsers: () => Array.from(pageCache.values()).flat().length,

    // Add new helper
    getCurrentFormPlan,
  };

  return (
    <FormProgressContext.Provider value={value}>
      {children}
    </FormProgressContext.Provider>
  );
};
