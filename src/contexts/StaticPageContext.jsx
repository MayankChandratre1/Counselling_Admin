import React, { createContext, useContext, useState, useEffect } from 'react';
import axiosInstance from '../utils/axios';

const StaticPageContext = createContext();

export function useStaticPage() {
  const context = useContext(StaticPageContext);
  if (!context) {
    throw new Error('useStaticPage must be used within a StaticPageProvider');
  }
  return context;
}

export function StaticPageProvider({ children }) {
  // Landing page state
  const [landingPageData, setLandingPageData] = useState({
    title: '',
    slogan: '',
    videoUrl: '',
    testimonials: [],
    features: [],
    ctaText: ''
  });
  const [landingLoading, setLandingLoading] = useState(true);
  const [landingError, setLandingError] = useState(null);

  // Home page state
  const [homePageData, setHomePageData] = useState({
    events: [],
    updates: [],
    recommended_colleges: []
  });
  const [homeLoading, setHomeLoading] = useState(true);
  const [homeError, setHomeError] = useState(null);

  // Contact data state
  const [contactData, setContactData] = useState({
    company: { name: '' },
    address: { value: '', link: '' },
    phone: '',
    whatsapp: { number: '', groupinvite: '' },
    youtube: ''
  });
  const [contactLoading, setContactLoading] = useState(true);
  const [contactError, setContactError] = useState(null);

  // Fetch landing page data
  const fetchLandingPageData = async () => {
    try {
      setLandingLoading(true);
      setLandingError(null);
      const response = await axiosInstance.get('/api/admin/landing-page');
      setLandingPageData(response.data);
    } catch (error) {
      console.error('Error fetching landing page data:', error);
      setLandingError('Failed to load landing page data. Please try again.');
    } finally {
      setLandingLoading(false);
    }
  };

  // Update landing page section
  const updateLandingPageSection = async (section, data) => {
    try {
      await axiosInstance.put('/api/admin/edit-landing-page', {
        section,
        data
      });
      setLandingPageData(prev => ({
        ...prev,
        ...data
      }));
      return { success: true };
    } catch (error) {
      console.error(`Error updating landing page ${section}:`, error);
      return { success: false, error: `Failed to update ${section}.` };
    }
  };

  // Fetch home page data
  const fetchHomePageData = async () => {
    try {
      setHomeLoading(true);
      setHomeError(null);
      const response = await axiosInstance.get('/api/admin/get-home-page');
      setHomePageData(response.data);
    } catch (error) {
      console.error('Error fetching home page data:', error);
      setHomeError('Failed to load home page data. Please try again.');
    } finally {
      setHomeLoading(false);
    }
  };

  // Update home page data
  const updateHomePageData = async (section, data) => {
    try {
      await axiosInstance.post('/api/admin/update-home-page', {
        section,
        data
      });
      setHomePageData(prev => ({
        ...prev,
        ...data
      }));
      return { success: true };
    } catch (error) {
      console.error(`Error updating home page ${section}:`, error);
      return { success: false, error: `Failed to update ${section}.` };
    }
  };

  // Fetch contact data
  const fetchContactData = async () => {
    try {
      setContactLoading(true);
      setContactError(null);
      const response = await axiosInstance.get('/api/admin/get-contact-data');
      setContactData(response.data);
    } catch (error) {
      console.error('Error fetching contact data:', error);
      setContactError('Failed to load contact data. Please try again.');
    } finally {
      setContactLoading(false);
    }
  };

  // Update contact data
  const updateContactData = async (updatedData) => {
    try {
      await axiosInstance.post('/api/admin/update-contact-data', updatedData);
      setContactData(updatedData);
      return { success: true };
    } catch (error) {
      console.error('Error updating contact data:', error);
      return { success: false, error: 'Failed to update contact data.' };
    }
  };

  // Load data on mount
  useEffect(() => {
    fetchLandingPageData();
    fetchHomePageData();
    fetchContactData();
  }, []);

  const value = {
    // Landing page data
    landingPageData,
    landingLoading,
    landingError,
    fetchLandingPageData,
    updateLandingPageSection,

    // Home page data
    homePageData,
    homeLoading,
    homeError,
    fetchHomePageData,
    updateHomePageData,

    // Contact data
    contactData,
    contactLoading,
    contactError,
    fetchContactData,
    updateContactData
  };

  return (
    <StaticPageContext.Provider value={value}>
      {children}
    </StaticPageContext.Provider>
  );
}
