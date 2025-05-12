import React, { createContext, useContext, useState, useEffect } from 'react';
import axiosInstance from '../utils/axios';

const PremiumPageContext = createContext();

export function usePremiumPage() {
  const context = useContext(PremiumPageContext);
  if (!context) {
    throw new Error('usePremiumPage must be used within a PremiumPageProvider');
  }
  return context;
}

export function PremiumPageProvider({ children }) {
  // Premium plans state
  const [premiumPlans, setPremiumPlans] = useState([]);
  const [plansLoading, setPlansLoading] = useState(true);
  const [plansError, setPlansError] = useState(null);

  // Dynamic pages state
  const [dynamicPages, setDynamicPages] = useState([]);
  const [pagesLoading, setPagesLoading] = useState(true);
  const [pagesError, setPagesError] = useState(null);

  // Fetch premium plans
  const fetchPremiumPlans = async () => {
    try {
      setPlansLoading(true);
      setPlansError(null);
      const response = await axiosInstance.get('/api/admin/get-premium-plans');
      setPremiumPlans(response.data.plans || []);
    } catch (error) {
      console.error('Error fetching premium plans:', error);
      setPlansError('Failed to load premium plans. Please try again.');
    } finally {
      setPlansLoading(false);
    }
  };

  // Update premium plans
  const updatePremiumPlans = async (updatedPlans) => {
    try {
      setPlansLoading(true);
      await axiosInstance.post('/api/admin/update-premium-plans', {
        plans: updatedPlans
      });
      setPremiumPlans(updatedPlans);
      return { success: true };
    } catch (error) {
      console.error('Error updating premium plans:', error);
      return { success: false, error: 'Failed to update premium plans.' };
    } finally {
      setPlansLoading(false);
    }
  };

  // Fetch dynamic pages
  const fetchDynamicPages = async () => {
    try {
      setPagesLoading(true);
      setPagesError(null);
      const response = await axiosInstance.get('/api/admin/get-dynamic-pages');
      setDynamicPages(response.data.data || []);
    } catch (error) {
      console.error('Error fetching dynamic pages:', error);
      setPagesError('Failed to load dynamic pages. Please try again.');
    } finally {
      setPagesLoading(false);
    }
  };

  // Update dynamic pages
  const updateDynamicPages = async (updatedPages) => {
    try {
      setPagesLoading(true);
      await axiosInstance.post('/api/admin/update-dynamic-pages', {
        data: updatedPages
      });
      setDynamicPages(updatedPages);
      return { success: true };
    } catch (error) {
      console.error('Error updating dynamic pages:', error);
      return { success: false, error: 'Failed to update dynamic pages.' };
    } finally {
      setPagesLoading(false);
    }
  };

  // Load data on mount
  useEffect(() => {
    fetchPremiumPlans();
    fetchDynamicPages();
  }, []);

  const value = {
    // Premium plans
    premiumPlans,
    plansLoading,
    plansError,
    fetchPremiumPlans,
    updatePremiumPlans,

    // Dynamic pages
    dynamicPages,
    pagesLoading,
    pagesError,
    fetchDynamicPages,
    updateDynamicPages
  };

  return (
    <PremiumPageContext.Provider value={value}>
      {children}
    </PremiumPageContext.Provider>
  );
}
