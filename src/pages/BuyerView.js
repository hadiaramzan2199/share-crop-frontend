import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import {
  Box,
} from '@mui/material';
import EnhancedFarmMap from '../components/Map/EnhancedFarmMap';
import EnhancedHeader from '../components/Layout/EnhancedHeader';
import NotificationSystem from '../components/Notification/NotificationSystem';
import useNotifications from '../hooks/useNotifications';
import RentedFields from './RentedFields';
import Orders from './Orders';
import Profile from './Profile';
import Messages from './Messages';
import ChangeCurrency from './ChangeCurrency';
import Settings from './Settings';
import { useAuth } from '../contexts/AuthContext';
import fieldsService from '../services/fields';
import farmsService from '../services/farms';
import coinService from '../services/coinService';
// import productsService from '../services/products'; // Removed - using fields directly

const BuyerView = () => {
  const location = useLocation();
  const { user: currentUser, switchToRole } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [farms, setFarms] = useState([]);
  const [fields, setFields] = useState([]);
  // const [products, setProducts] = useState([]); // Removed - using fields directly
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const mapRef = useRef(null);
  const headerRef = useRef(null);
  const { 
    notifications, 
    backendNotifications, 
    addNotification, 
    removeNotification, 
    markNotificationAsRead,
    fetchBackendNotifications
  } = useNotifications();
  const isMapPage = location.pathname === '/buyer' || location.pathname === '/buyer/';
  const isMessagesPage = location.pathname === '/buyer/messages';
  const isCurrencyPage = location.pathname === '/buyer/currency';
  const isSettingsPage = location.pathname === '/buyer/settings';

  // Force buyer role when component mounts
  useEffect(() => {
    switchToRole('buyer');
  }, [switchToRole]);

  // Initialize user coins when user is available
  useEffect(() => {
    if (currentUser && currentUser.id) {
      coinService.initializeUserCoins(currentUser.id);
      loadAllFieldsFromStorage();
    }
  }, [currentUser]);

  const loadAllFieldsFromStorage = useCallback(async () => {
    if (!currentUser) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const [farmsResponse, fieldsResponse] = await Promise.all([
        farmsService.getAll(),
        fieldsService.getAll(),
      ]);
      setFarms(farmsResponse.data || []);
      
      // Map database field names to frontend expected names
      const mappedFields = (fieldsResponse.data || [])
        .filter(field => field && field.id) // Only include fields with valid id
        .map(field => ({
          ...field,
          harvestDates: field.harvest_dates, // Map harvest_dates to harvestDates
          pricePerM2: field.price_per_m2, // Map price_per_m2 to pricePerM2
          fieldSize: field.field_size, // Map field_size to fieldSize
          productionRate: field.production_rate, // Map production_rate to productionRate
        }));
      setFields(mappedFields);
    } catch (err) {
      console.error('Error loading buyer data:', err);
      setError('Failed to load data. Please try again later.');
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  const handleSearchChange = (query) => {
    setSearchQuery(query);
  };

  const handleFarmSelect = (farm) => {
    if (mapRef.current && mapRef.current.zoomToFarm) {
      mapRef.current.zoomToFarm(farm);
    }
  };

  const handleFarmsLoad = useCallback((loadedData) => {
    // Check if the loaded data contains field properties (indicating it's fields data)
    if (loadedData && loadedData.length > 0) {
      const firstItem = loadedData[0];
      // If it has field-specific properties, treat it as fields data
      if (firstItem.harvest_dates || firstItem.harvestDates || firstItem.price_per_m2 || firstItem.pricePerM2) {
        // Map database field names to frontend expected names if needed
        const mappedFields = loadedData.map(field => ({
          ...field,
          harvestDates: field.harvestDates || field.harvest_dates,
          pricePerM2: field.pricePerM2 || field.price_per_m2,
          fieldSize: field.fieldSize || field.field_size,
          productionRate: field.productionRate || field.production_rate,
        }));
        setFields(mappedFields);
      } else {
        // Otherwise, treat it as farms data
        setFarms(loadedData);
      }
    }
  }, []);

  const handleCoinRefresh = () => {
    if (headerRef.current && headerRef.current.refreshCoins) {
      headerRef.current.refreshCoins();
    }
  };

  return (
    <Box sx={{ flexGrow: 1, height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <EnhancedHeader 
        ref={headerRef}
        onSearchChange={handleSearchChange}
        fields={fields}
        onFarmSelect={handleFarmSelect}
        userType="buyer"
        user={currentUser}
      />
      
      <Box sx={{
        flexGrow: 1,
        mt: '64px', // Account for fixed header height
        height: 'calc(100vh - 64px)', // Subtract AppBar height from viewport
        overflow: (isMapPage || isMessagesPage || isCurrencyPage || isSettingsPage) ? 'hidden' : 'auto', // No scroll for map, messages, currency, and settings pages, scroll for other pages
        position: 'relative'
      }}>
        <Routes>
          <Route path="/" element={
            <EnhancedFarmMap
              ref={mapRef}
              onProductSelect={handleFarmSelect}
              userType="buyer"
              searchQuery={searchQuery}
              onFarmsLoad={handleFarmsLoad}
              onNotification={addNotification}
              onNotificationRefresh={fetchBackendNotifications}
              onCoinRefresh={handleCoinRefresh}
              farms={farms}
              fields={fields}
            />
          } />
          <Route path="/rented-fields" element={<RentedFields />} />
          <Route path="/orders" element={<Orders />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/messages" element={<Messages />} />
          <Route path="/currency" element={<ChangeCurrency />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </Box>
      
      {/* Notification System */}
      <NotificationSystem 
        notifications={[...notifications, ...backendNotifications.filter(n => !n.read)]} 
        onRemove={(id) => {
          // Check if it's a backend notification
          const backendNotif = backendNotifications.find(n => n.id === id);
          if (backendNotif) {
            markNotificationAsRead(id);
          } else {
            removeNotification(id);
          }
        }} 
      />
    </Box>
  );
};

export default BuyerView;