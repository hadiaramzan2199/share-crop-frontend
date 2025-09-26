import React, { useState, useEffect, useCallback, forwardRef, useRef, useImperativeHandle } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import coinService from '../../services/coinService';
import fieldsService from '../../services/fields';
import { mockProductService } from '../../services/mockServices';
import notificationsService from '../../services/notifications';
import { orderService } from '../../services/orders';
import { mockOrderService } from '../../services/mockServices';
import CustomScaleBar from './CustomScaleBar';
import ProductSummaryBar from './ProductSummaryBar';
import { Map as MapboxMap, Marker, NavigationControl, FullscreenControl } from 'react-map-gl';
import { cachedReverseGeocode } from '../../utils/geocoding';
import { getProductIcon } from '../../utils/productIcons';

// Detect mobile screens
const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    checkIsMobile();
    window.addEventListener('resize', checkIsMobile);

    return () => window.removeEventListener('resize', checkIsMobile);
  }, []);

  return isMobile;
};



const EnhancedFarmMap = forwardRef(({ 
  onProductSelect, 
  userType, 
  user,
  purchasedProductIds = [], 
  onFieldCreate,
  searchQuery,
  onFarmsLoad,
  onNotification,
  onNotificationRefresh,
  onCoinRefresh,
  farms: externalFarms,
  fields: externalFields,
  onEditField
}, ref) => {
  const mapRef = useRef();
  const { user: currentUser } = useAuth();
  const isMobile = useIsMobile();

  const [viewState, setViewState] = useState({
    longitude: 15, // Center on Central Europe
    latitude: 45, // Center on Central Europe
    zoom: isMobile ? 8 : 4, // Zoom out more on mobile for better overview
  });
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [popupPosition, setPopupPosition] = useState(null);
  const [farms, setFarms] = useState([]);
  const [filteredFarms, setFilteredFarms] = useState([]);
  const [purchasedFarms, setPurchasedFarms] = useState(new Set());
  const [rentedFields, setRentedFields] = useState(new Set());
  const [blinkingFarms, setBlinkingFarms] = useState(new Set());
  const [selectedShipping, setSelectedShipping] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [insufficientFunds, setInsufficientFunds] = useState(false);
  const [selectedHarvestDate, setSelectedHarvestDate] = useState(null);
  const [productLocations, setProductLocations] = useState(new Map());
  const [userCoins, setUserCoins] = useState(0);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Robust image src resolver for products (supports various shapes)
  const getProductImageSrc = useCallback((product) => {
    try {
      if (!product) {
        return getProductIcon('Fruits');
      }
      
      // Always use local icon paths based on category/subcategory (like mockFarms.js)
      // Ignore database image data (base64, external URLs) and use local icons instead
      const category = product.subcategory || product.category;
      const iconPath = getProductIcon(category);
      
      return iconPath;
    } catch (e) {
      console.warn('Failed to resolve product image, using fallback:', e);
      return getProductIcon(product?.subcategory || product?.category || 'Fruits');
    }
  }, []);
  // Function to fetch location for a product
  const fetchLocationForProduct = useCallback(async (product) => {   
    const productId = product.id;
    
    // Use functional update to check current state without dependency
    setProductLocations(prev => {
      // Check if we already have the location for this product
      if (prev.has(productId)) {
        console.log('🌍 Location already cached for product:', productId, 'Location:', prev.get(productId));
        return prev; // Return same state if already exists
      }
      
      // If product already has a valid location field, use it directly
      if (product.location && product.location !== 'Unknown Location' && !product.location.includes(',')) {
        console.log('🌍 Using existing location for:', productId, 'Location:', product.location);
        setProductLocations(current => new Map(current.set(productId, product.location)));
        return prev;
      }
      
      // Only geocode if we don't have a valid location and have coordinates
      if (!product.coordinates) {
        console.log('🌍 No coordinates available for product:', productId);
        return prev;
      }
      
      const [longitude, latitude] = product.coordinates;
      
      // Fetch location asynchronously only if needed
      (async () => {
        try {
          console.log('🌍 Starting geocoding for:', productId, 'at coords:', latitude, longitude);
          // Fix: Pass latitude first, then longitude to match the geocoding function signature
          const locationName = await cachedReverseGeocode(latitude, longitude);
          console.log('🌍 Geocoding successful for:', productId, 'Location:', locationName);
          setProductLocations(current => new Map(current.set(productId, locationName)));
        } catch (error) {
          console.error('🌍 Failed to fetch location for product:', productId, error);
          // Set fallback location
          const fallbackLocation = `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
          console.log('🌍 Using fallback location for:', productId, 'Fallback:', fallbackLocation);
          setProductLocations(current => new Map(current.set(productId, fallbackLocation)));
        }
      })();
      
      return prev; // Return current state while async operation runs
    });
  }, [userType]); // Add userType to dependencies for debugging

  const handleProductClick = useCallback((event, product) => {
    event.stopPropagation();
    
    // Use functional update to avoid stale state issues
    setSelectedProduct(prevSelected => {
      // If clicking the same product, close the popup
      if (prevSelected && prevSelected.id === product.id) {
        return null;
      }
      return product;
    });
    
    setSelectedShipping(null);
    setQuantity(1);
    setInsufficientFunds(false);
    setSelectedHarvestDate(null);
    
    // Zoom to the product location
    if (mapRef.current && product.coordinates) {
      const map = mapRef.current.getMap();
      map.flyTo({
        center: product.coordinates,
        zoom: 8,
        duration: 2000,
        essential: true,
        easing: (t) => t * (2 - t)
      });
    }
    
    // Fetch location for the selected product
    fetchLocationForProduct(product);
    
    if (onProductSelect) {
      onProductSelect(product);
    }
  }, [onProductSelect, fetchLocationForProduct]);

  // Expose methods to parent component
  useImperativeHandle(ref, () => ({
    zoomToFarm: (farm, autoOpenPopup = true) => {
      if (farm && farm.coordinates && mapRef.current) {
        // Use the map's native flyTo method instead of updating React state
        // This prevents unnecessary re-renders that could cause markers to disappear
        mapRef.current.flyTo({
          center: [farm.coordinates[0], farm.coordinates[1]],
          zoom: 15,
          duration: 1000,
          easing: (t) => t * (2 - t)
        });
        
        if (autoOpenPopup) {
          // Set the selected product to open the popup
          setSelectedProduct(farm);
          
          // Fetch location for the product
          fetchLocationForProduct(farm);
          
          // Use setTimeout to ensure the map has finished transitioning before calculating popup position
          setTimeout(() => {
            if (mapRef.current) {
              const map = mapRef.current.getMap();
              const [lng, lat] = farm.coordinates || [];
              if (lng !== undefined && lat !== undefined) {
                const point = map.project([lng, lat]);
                const mapContainer = map.getContainer();
                const rect = mapContainer.getBoundingClientRect();
                
                setPopupPosition({
                  left: point.x,
                  top: point.y - 10,
                  transform: 'translate(-50%, -100%)'
                });
              }
            }
          }, 1200); // Wait for zoom transition to complete
        }
      }
    },
    refreshData: () => {
      console.log('🔄 Manually refreshing farm data...');
      setRefreshTrigger(prev => prev + 1);
    }
  }), [fetchLocationForProduct]); // Removed viewState dependency to prevent unnecessary re-creation

  // Load farms data
  // In the useEffect that loads farms data, replace with this:

useEffect(() => {
  console.log('🔄 EnhancedFarmMap useEffect triggered - externalFarms:', externalFarms?.length, 'externalFields:', externalFields?.length);
  
  // Priority: externalFields > externalFarms > API call
  if (externalFields && externalFields.length > 0) {
    console.log('🔄 Using external fields from props:', externalFields.length);
    const validFields = externalFields.filter(field => field.coordinates);
    console.log('✅ Valid external fields with coordinates:', validFields.length);
    setFarms(validFields);
    setFilteredFarms(validFields);
  } else if (externalFarms && externalFarms.length > 0) {
    console.log('🔄 Using external farms from props:', externalFarms.length);
    const validFarms = externalFarms.filter(farm => farm.coordinates);
    console.log('✅ Valid external farms with coordinates:', validFarms.length);
    setFarms(validFarms);
    setFilteredFarms(validFarms);
    if (onFarmsLoad) {
      onFarmsLoad(validFarms);
    }
  } else {
    // Load only from database API, skip mock data to avoid conflicts
    const loadFarms = async () => {
      try {
        console.log('🔄 Loading fields from database API only...');
        const response = await fieldsService.getAll();
        const databaseFields = response.data || [];
        console.log('🗄️ Loaded fields from database:', databaseFields.length);
        
        // Filter only fields with valid coordinates
        const validFields = databaseFields.filter(field => {
          if (!field.coordinates) return false;
          
          let lng, lat;
          if (Array.isArray(field.coordinates)) {
            lng = field.coordinates[0];
            lat = field.coordinates[1];
          } else {
            lng = field.coordinates.lng || field.coordinates.longitude;
            lat = field.coordinates.lat || field.coordinates.latitude;
          }
          
          return lng != null && lat != null && !isNaN(lng) && !isNaN(lat);
        });
        
        console.log('✅ Valid database fields with coordinates:', validFields.length);
        setFarms(validFields);
        setFilteredFarms(validFields);
        
        // Auto-fit to valid fields only
        if (mapRef.current && validFields.length > 0) {
          const coordinates = validFields.map(field => {
            if (Array.isArray(field.coordinates)) {
              return [field.coordinates[0], field.coordinates[1]];
            } else {
              return [
                field.coordinates.lng || field.coordinates.longitude,
                field.coordinates.lat || field.coordinates.latitude
              ];
            }
          });
          
          if (coordinates.length > 0) {
            const lngs = coordinates.map(coord => coord[0]);
            const lats = coordinates.map(coord => coord[1]);
            const minLng = Math.min(...lngs);
            const maxLng = Math.max(...lngs);
            const minLat = Math.min(...lats);
            const maxLat = Math.max(...lats);
            
            mapRef.current.fitBounds(
              [[minLng, minLat], [maxLng, maxLat]],
              { padding: 50, duration: 2000 }
            );
          }
        }
      } catch (error) {
        console.error('❌ Failed to load fields from database:', error);
        // Set empty arrays on error to avoid showing old/mock data
        setFarms([]);
        setFilteredFarms([]);
      }
    };
    
    loadFarms();
  }
}, [onFarmsLoad, externalFarms, externalFields, refreshTrigger]);

  // Filter farms based on search query
  useEffect(() => {
    console.log('🔍 SEARCH FILTER DEBUG - searchQuery:', searchQuery, 'farms length:', farms.length);
    if (!searchQuery || searchQuery.trim() === '') {
      // If no search query, show all farms
      console.log('🔍 SEARCH FILTER DEBUG - No search query, setting filteredFarms to all farms:', farms.length);
      setFilteredFarms(farms);
    } else {
      // Filter farms based on search query
      const searchTerm = searchQuery.toLowerCase();
      const filtered = farms.filter(farm => {
        return (
          farm.name?.toLowerCase().includes(searchTerm) ||
          farm.category?.toLowerCase().includes(searchTerm) ||
          farm.farmer?.toLowerCase().includes(searchTerm) ||
          farm.description?.toLowerCase().includes(searchTerm) ||
          farm.location?.toLowerCase().includes(searchTerm) ||
          farm.products?.some(product => 
            product.name?.toLowerCase().replace(/-/g, ' ').includes(searchTerm)
          )
        );
      });
      setFilteredFarms(filtered);
    }
  }, [searchQuery, farms]);

  const isPurchased = useCallback((productId) => {
    const farm = farms.find(f => f.id === productId);
    return farm ? farm.isPurchased : false || purchasedFarms.has(productId) || purchasedProductIds.includes(productId);
  }, [farms, purchasedFarms, purchasedProductIds]);

  // Load user coins when user changes
  useEffect(() => {
    const loadUserCoins = async () => {
      if (currentUser && currentUser.id) {
        try {
          const coins = await coinService.getUserCoins(currentUser.id);
          setUserCoins(coins);
        } catch (error) {
          console.error('Error loading user coins:', error);
          setUserCoins(0);
        }
      } else {
        setUserCoins(0);
      }
    };

    loadUserCoins();
  }, [currentUser]);

  const handleBuyNow = async (product) => {
  console.log('=== PURCHASE DEBUG START ===');
  console.log('Current user object:', currentUser);
  console.log('Current user ID:', currentUser?.id);
  console.log('Product being purchased:', product);
  console.log('=== PURCHASE DEBUG END ===');
  
  if (!currentUser || !currentUser.id) {
    if (onNotification) {
      onNotification('Please log in to make a purchase.', 'error');
    }
    return;
  }
  
  const totalCostInDollars = (product.price_per_m2 || 0.55) * quantity;
  const totalCostInCoins = Math.ceil(totalCostInDollars);
  
  // Reset insufficient funds error
  setInsufficientFunds(false);
  
  // Check if user has sufficient coins using coinService
  const hasSufficientCoins = await coinService.hasSufficientCoins(currentUser.id, totalCostInCoins);
  if (!hasSufficientCoins) {
    setInsufficientFunds(true);
    return;
  }
  
  // Check if user is trying to purchase from their own farm
  if (currentUser && (product.farmer_id === currentUser.id || product.created_by === currentUser.id)) {
    if (onNotification) {
      onNotification('You cannot purchase from your own farm!', 'error');
    }
    return;
  }
  
  try {
    // Create order data
    const orderData = {
      id: Date.now(),
      fieldId: product.id,
      product_name: product.name,
      name: product.name,
      farmer_name: product.farmer_name || 'Farm Owner',
      farmer_id: product.farmer_id || product.created_by,
      location: product.location || 'Unknown Location',
      area_rented: quantity,
      area: quantity,
      crop_type: product.category || 'Mixed Crops',
      total_cost: totalCostInDollars,
      cost: totalCostInDollars,
      price_per_unit: product.price || 0.55,
      monthly_rent: Math.round(totalCostInDollars / 6),
      status: 'confirmed',
      start_date: new Date().toISOString(),
      end_date: new Date(Date.now() + 6 * 30 * 24 * 60 * 60 * 1000).toISOString(),
      progress: 0,
      notes: `Purchased via marketplace. Shipping: ${selectedShipping || 'Delivery'}`,
      shipping_method: selectedShipping || 'Delivery',
      selected_harvest_date: selectedHarvestDate ? selectedHarvestDate.date : null,
      selected_harvest_label: selectedHarvestDate ? selectedHarvestDate.label : null,
      created_at: new Date().toISOString()
    };
    
    // Create order via real API
    console.log('Current user for order creation:', currentUser);
    if (currentUser && currentUser.id) {
      const apiOrderData = {
        buyer_id: currentUser.id,
        field_id: product.id,
        quantity: quantity,
        total_price: totalCostInDollars,
        status: 'active',
        selected_harvest_date: selectedHarvestDate ? selectedHarvestDate.date : null,
        selected_harvest_label: selectedHarvestDate ? selectedHarvestDate.label : null
      };
      
      console.log('Creating order with API data:', apiOrderData);
      try {
        const orderResponse = await orderService.createOrder(apiOrderData);
        console.log('Order created successfully:', orderResponse.data);
        
        // Create notification for the farmer
        const farmerId = product.farmer_id || product.created_by;
        if (farmerId) {
          const notificationData = {
            user_id: farmerId,
            message: `New order received! ${currentUser.name || 'A buyer'} purchased ${quantity}m² of your field "${product.name}" for $${totalCostInDollars.toFixed(2)}`,
            type: 'success'
          };
          
          try {
            await notificationsService.create(notificationData);
            console.log('Farmer notification created successfully');
          } catch (notifError) {
            console.error('Failed to create farmer notification:', notifError);
          }
        }
      } catch (error) {
        console.error('Failed to create order via API:', error);
        console.error('Error details:', error.response?.data || error.message);
        // Fall back to mock service for now
        await mockOrderService.createOrder(orderData);
      }
    } else {
      console.log('No current user or user ID, falling back to mock service');
      await mockOrderService.createOrder(orderData);
    }
    
    // START: Purchase Animation Logic
    // Add to purchased farms for permanent glow
    setPurchasedFarms(prev => new Set([...prev, product.id]));
    
    setBlinkingFarms(prev => new Set([...prev, product.id]));
      setTimeout(() => {
        setBlinkingFarms(prev => {
          const newSet = new Set(prev);
          newSet.delete(product.id);
          return newSet;
        });
      }, 3000);
    
    // Deduct coins using coinService
    await coinService.deductCoins(currentUser.id, totalCostInCoins);
    
    // Refresh coin balance
    const updatedCoins = await coinService.getUserCoins(currentUser.id);
    setUserCoins(updatedCoins);
    
    // Immediately refresh notifications to show purchase notification
    if (onNotificationRefresh) {
      onNotificationRefresh();
    }
    
    // Immediately refresh coin count in header
    if (onCoinRefresh) {
      onCoinRefresh();
    }
    
    // Note: Notification is automatically created by the backend when order is placed
    setSelectedProduct(null);
    setQuantity(1);
    setInsufficientFunds(false);
    setSelectedHarvestDate(null);
    
    if (onNotification) {
      onNotification(`Successfully purchased ${quantity}m² of ${product.name}!`, 'success');
    }
    
  } catch (error) {
    console.error('Failed to create order:', error);
    if (onNotification) {
      onNotification('Purchase failed. Please try again.', 'error');
    }
    setSelectedProduct(null);
    setInsufficientFunds(false);
    setQuantity(1);
  }
};



  // Update popup position whenever selectedProduct or map view changes
  useEffect(() => {
    if (selectedProduct && mapRef.current) {
      const map = mapRef.current.getMap();
      const [lng, lat] = selectedProduct.coordinates || [];
      if (typeof lng === 'number' && typeof lat === 'number') {
        const point = map.project([lng, lat]);
        
        // Get map container dimensions
        const mapContainer = mapRef.current.getContainer();
        const mapWidth = mapContainer.offsetWidth;
        const mapHeight = mapContainer.offsetHeight;
        
        // Popup dimensions (approximate)
        const popupWidth = 380;
        const popupHeight = 400;
        
        // Calculate optimal position to prevent cropping
        let left = point.x;
        let top = point.y;
        let transform = 'translate(-50%, -100%)';
        
        // Adjust horizontal position if popup would be cropped
        if (point.x - popupWidth / 2 < 0) {
          // Too close to left edge
          left = popupWidth / 2 + 10;
          transform = 'translate(-50%, -100%)';
        } else if (point.x + popupWidth / 2 > mapWidth) {
          // Too close to right edge
          left = mapWidth - popupWidth / 2 - 10;
          transform = 'translate(-50%, -100%)';
        }
        
        // Adjust vertical position if popup would be cropped
        if (point.y - popupHeight < 0) {
          // Too close to top edge, show popup below the marker
          top = point.y + 20;
          transform = transform.replace('-100%', '0%');
        } else if (point.y > mapHeight - 50) {
          // Too close to bottom edge, show popup above
          top = point.y - 20;
          transform = transform.replace('-100%', '-100%');
        }
        
        setPopupPosition({ left, top, transform });
      } else {
        setPopupPosition(null);
      }
    } else {
      setPopupPosition(null);
    }
  }, [selectedProduct, viewState]);


  return (
    <div style={{ height: '100vh', width: '100%', position: 'relative'}}>
      <MapboxMap
  ref={mapRef}
  {...viewState}
  onMove={evt => setViewState(evt.viewState)}
  onClick={() => {
    setSelectedProduct(null);
    setPopupPosition(null);
    setInsufficientFunds(false);
  }}
  mapStyle="mapbox://styles/superfroggy/cmfwppeyl00dl01r0287fe98o"
  style={{ width: '100%', height: '100%', marginTop: '-65px' }}
  mapboxAccessToken={process.env.REACT_APP_MAPBOX_ACCESS_TOKEN}
  projection="globe"
  initialViewState={{
    longitude: 120,
    latitude: 0,
    zoom: isMobile ? 8 : 4, // Consistent zoom level for both mobile and desktop
  }}
>

        <NavigationControl position="top-right" style={{ marginTop: '80px', marginRight: '10px' }} />
        <FullscreenControl position="top-right" style={{ marginTop: '35px', marginRight: '10px' }} />
        
        {/* Home Control Button */}
        
<div 
  style={{
    position: 'absolute',
    top: '170px',
    right: '10px',
    zIndex: 1
  }}
>
  <button
    onClick={() => {
      setSelectedProduct(null);
      setPopupPosition(null);
      setInsufficientFunds(false);
      
      if (mapRef.current && filteredFarms.length > 0) {
        const farmsWithCoords = filteredFarms.filter(farm => farm.coordinates);
        
        if (farmsWithCoords.length > 0) {
          const coordinates = farmsWithCoords.map(farm => {
            if (Array.isArray(farm.coordinates)) {
              return farm.coordinates;
            } else if (typeof farm.coordinates === 'object') {
              return [farm.coordinates.lng || farm.coordinates.longitude, farm.coordinates.lat || farm.coordinates.latitude];
            }
            return null;
          }).filter(coord => coord && coord[0] != null && coord[1] != null);
          
          if (coordinates.length > 0) {
            const lngs = coordinates.map(coord => coord[0]);
            const lats = coordinates.map(coord => coord[1]);
            const minLng = Math.min(...lngs);
            const maxLng = Math.max(...lngs);
            const minLat = Math.min(...lats);
            const maxLat = Math.max(...lats);
            
            mapRef.current.fitBounds(
              [[minLng, minLat], [maxLng, maxLat]],
              { padding: 100, duration: 2000 }
            );
          } else {
            // Fallback to default view with consistent zoom
            mapRef.current.flyTo({
              center: [120, 0],
              zoom: 4, // Consistent zoom for mobile and desktop
              duration: 2000,
              easing: (t) => t * (2 - t)
            });
          }
        } else {
          // Fallback to default view with consistent zoom
          mapRef.current.flyTo({
            center: [15, 45],
            zoom: 8, // Consistent zoom for mobile and desktop
            duration: 2000,
            easing: (t) => t * (2 - t)
          });
        }
      }
    }}
    style={{
      background: '#fff',
      border: '2px solid rgba(0,0,0,.1)',
      borderRadius: '4px',
      cursor: 'pointer',
      padding: '0',
      fontSize: '14px',
      fontWeight: 'bold',
      color: '#333',
      boxShadow: '0 0 0 2px rgba(0,0,0,.1)',
      width: '29px',
      height: '29px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }}
    title="Reset to home view"
  >
    🏠
  </button>
</div>



        {/* Farm Markers */}
        // EnhancedFarmMap.js - Fix the marker rendering section

// Replace the entire marker rendering section with this:

        {/* Farm Markers */}
        {(() => {
          console.log('🔍 MARKER RENDER DEBUG - filteredFarms length:', filteredFarms.length);
          console.log('🔍 MARKER RENDER DEBUG - filteredFarms:', filteredFarms.map(f => ({ 
            id: f.id, 
            name: f.name, 
            coordinates: f.coordinates,
            hasValidCoords: f.coordinates && Array.isArray(f.coordinates) && f.coordinates.length === 2
          })));
          
          // Filter only farms with valid coordinates
          const farmsWithValidCoords = filteredFarms.filter(farm => {
            if (!farm.coordinates) {
              console.warn('⚠️ Skipping farm with no coordinates:', farm.name);
              return false;
            }
            
            let longitude, latitude;
            
            if (Array.isArray(farm.coordinates)) {
              longitude = farm.coordinates[0];
              latitude = farm.coordinates[1];
            } else if (typeof farm.coordinates === 'object') {
              longitude = farm.coordinates.lng || farm.coordinates.longitude;
              latitude = farm.coordinates.lat || farm.coordinates.latitude;
            } else {
              return false;
            }
            
            const isValid = longitude != null && latitude != null && 
                          !isNaN(parseFloat(longitude)) && !isNaN(parseFloat(latitude));
            
            if (!isValid) {
              console.warn('⚠️ Skipping farm with invalid coordinates:', farm.name, farm.coordinates);
            }
            
            return isValid;
          });
          
          console.log('✅ Farms with valid coordinates:', farmsWithValidCoords.length);
          
          return farmsWithValidCoords.map((product) => {
            console.log('🎯 Rendering marker for:', product.name, 'at', product.coordinates);
            
            let longitude, latitude;
            
            if (Array.isArray(product.coordinates)) {
              longitude = product.coordinates[0];
              latitude = product.coordinates[1];
            } else {
              longitude = product.coordinates.lng || product.coordinates.longitude;
              latitude = product.coordinates.lat || product.coordinates.latitude;
            }
            
            // Final validation
            if (longitude == null || latitude == null || isNaN(longitude) || isNaN(latitude)) {
              console.error('❌ Invalid coordinates after processing:', product.name, product.coordinates);
              return null;
            }
            
            return (
              <Marker
                key={`marker-${product.id}-${longitude}-${latitude}`} // Unique key with coordinates
                longitude={parseFloat(longitude)}
                latitude={parseFloat(latitude)}
                anchor="center"
              >
                <div 
                  style={{ 
                    position: 'relative', 
                    cursor: 'pointer', 
                    transition: 'all 0.3s ease',
                    width: isMobile ? '20px' : '30px',
                    height: isMobile ? '20px' : '30px'
                  }} 
                  onClick={(e) => handleProductClick(e, product)}
                >
                  <img
                    src={getProductImageSrc(product)}
                    alt={product.name || product.productName || 'Product'}
                    onError={(e) => { 
                      console.warn('[Marker Image Error] Fallback to icon for:', product.id, product.name);
                      const fallback = getProductIcon(product.subcategory || product.category);
                      if (e.currentTarget.src !== fallback) {
                        e.currentTarget.src = fallback;
                        e.currentTarget.style.objectFit = 'contain'; // Ensure icon fits
                      }
                    }}
                    onLoad={(e) => {
                      console.log('✅ Marker image loaded successfully:', product.name);
                      e.currentTarget.style.opacity = '1';
                    }}
                    style={{
                      width: '30px',
                  height: '30px',
                  borderRadius: '50%',
                  border: product.isFarmerCreated ? '3px solid #4CAF50' : 'none',
                  filter: blinkingFarms.has(product.id) 
                    ? 'drop-shadow(0 0 15px rgba(255, 193, 7, 0.9)) drop-shadow(0 0 30px rgba(255, 193, 7, 0.7))'
                    : isPurchased(product.id) 
                    ? 'brightness(1) drop-shadow(0 0 12px rgba(255, 255, 255, 0.9)) drop-shadow(0 0 25px rgba(255, 255, 255, 0.7))'
                    : rentedFields.has(product.id)
                    ? 'brightness(1.1) drop-shadow(0 0 10px rgba(76, 175, 80, 0.8)) drop-shadow(0 0 20px rgba(76, 175, 80, 0.6))'
                    : product.isFarmerCreated
                    ? 'brightness(1.1) drop-shadow(0 0 8px rgba(76, 175, 80, 0.6)) drop-shadow(0 0 16px rgba(76, 175, 80, 0.4))'
                    : 'none',
                  backgroundColor: 'transparent',
                  padding: '0',
                  transition: 'all 0.3s ease',

                  animation: blinkingFarms.has(product.id) 
                    ? 'glow-blink 0.8s infinite' 
                    : isPurchased(product.id) 
                    ? 'glow-pulse-white 1.5s infinite, heartbeat 2s infinite' 
                    : rentedFields.has(product.id)
                    ? 'glow-steady-green 2s infinite'
                    : product.isFarmerCreated
                    ? 'glow-farmer-created 3s infinite'
                    : 'none',
                    }}
                  />
                  
                  {/* Farmer Created Badge */}
                  {product.isFarmerCreated && (
                    <div style={{
                      position: 'absolute',
                      top: isMobile ? '-5px' : '-8px',
                      right: isMobile ? '-5px' : '-8px',
                      width: isMobile ? '12px' : '16px',
                      height: isMobile ? '12px' : '16px',
                      backgroundColor: '#4CAF50',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: isMobile ? '8px' : '10px',
                      color: 'white',
                      fontWeight: 'bold',
                      border: '2px solid white',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                      zIndex: 10
                    }}>
                      F
                    </div>
                  )}
                </div>
              </Marker>
            );
          });
        })()}


      </MapboxMap>

      {/* Custom Scale Bar */}
      <CustomScaleBar map={mapRef.current?.getMap()} />



      {/* Temporary debug button */}
      <button 
        onClick={() => {
          console.log('🎯 Manual zoom to watermelon coordinates');
          setViewState({
            longitude: 12.476713,
            latitude: 41.899986,
            zoom: 10,
            transitionDuration: 1000
          });
        }}
        style={{
          position: 'absolute',
          top: '10px',
          right: '10px',
          zIndex: 1000,
          padding: '8px 12px',
          backgroundColor: '#ff6b6b',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer',
          fontSize: '12px'
        }}
      >
        🍉 Zoom to Watermelon
      </button>

      {/* Product Summary Bar */}
      <ProductSummaryBar 
        mapRef={mapRef} 
        farms={farms} 
        onProductClick={handleProductClick}
      />

      {/* Custom Popup */}
      {selectedProduct && popupPosition && (
  <div
  key={`popup-${selectedProduct.id}-${Date.now()}`}
    style={{
      position: 'absolute',
      left: popupPosition.left,
      top: popupPosition.top,
      transform: popupPosition.transform || 'translate(-50%, -100%)',
      zIndex: 1000,
    }}
  >
    <div
      style={{
        backgroundColor: 'white',
        borderRadius: isMobile ? '8px' : '12px',
        padding: '0',
        width: isMobile ? '280px' : '380px',
        boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
        border: '1px solid #e9ecef',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        overflow: 'hidden'
      }}
    >
      {/* Header with close button and webcam icon */}
      <div style={{ position: 'relative', padding: isMobile ? '6px 12px 0' : '8px 16px 0' }}>
        <div
          onClick={() => {
          setSelectedProduct(null);
          setInsufficientFunds(false);
        }}
          style={{
            cursor: 'pointer',
            fontSize: isMobile ? '12px' : '14px',
            color: '#6c757d',
            width: isMobile ? '20px' : '24px',
            height: isMobile ? '20px' : '24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '50%',
            backgroundColor: '#f0f0f0',
            position: 'absolute',
            top: isMobile ? '6px' : '8px',
            right: isMobile ? '6px' : '8px',
            fontWeight: 'bold',
            zIndex: 10
          }}
        >
          ✕
        </div>
        
        {/* Edit button for farmers - only show for farmer's own fields */}
        {userType === 'farmer' && selectedProduct.isOwnField && onEditField && (
          <div style={{
            position: 'absolute',
            top: isMobile ? '6px' : '8px',
            right: isMobile ? '60px' : '72px',
            width: isMobile ? '28px' : '32px',
            height: isMobile ? '28px' : '32px',
            backgroundColor: '#28a745',
            borderRadius: isMobile ? '6px' : '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            boxShadow: '0 2px 8px rgba(40, 167, 69, 0.3)',
            transition: 'all 0.2s ease',
            border: '2px solid white',
            zIndex: 10
          }}
          onMouseEnter={(e) => {
            e.target.style.backgroundColor = '#218838';
            e.target.style.transform = 'scale(1.1)';
            e.target.style.boxShadow = '0 4px 12px rgba(40, 167, 69, 0.4)';
          }}
          onMouseLeave={(e) => {
            e.target.style.backgroundColor = '#28a745';
            e.target.style.transform = 'scale(1)';
            e.target.style.boxShadow = '0 2px 8px rgba(40, 167, 69, 0.3)';
          }}
          onClick={() => onEditField(selectedProduct)}
          title="Edit Field"
          >
            <svg width={isMobile ? "14" : "16"} height={isMobile ? "14" : "16"} viewBox="0 0 24 24" fill="white">
              <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
            </svg>
          </div>
        )}

        {/* Webcam icon - positioned in header */}
        <div style={{
          position: 'absolute',
          top: isMobile ? '6px' : '8px',
          right: isMobile ? '32px' : '40px',
          width: isMobile ? '28px' : '32px',
          height: isMobile ? '28px' : '32px',
          backgroundColor: '#007bff',
          borderRadius: isMobile ? '6px' : '8px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          boxShadow: '0 2px 8px rgba(0, 123, 255, 0.3)',
          transition: 'all 0.2s ease',
          border: '2px solid white',
          zIndex: 10
        }}
        onMouseEnter={(e) => {
          e.target.style.backgroundColor = '#0056b3';
          e.target.style.transform = 'scale(1.1)';
          e.target.style.boxShadow = '0 4px 12px rgba(0, 123, 255, 0.4)';
        }}
        onMouseLeave={(e) => {
          e.target.style.backgroundColor = '#007bff';
          e.target.style.transform = 'scale(1)';
          e.target.style.boxShadow = '0 2px 8px rgba(0, 123, 255, 0.3)';
        }}
        title="View Live Camera Feed"
        >
          <svg width={isMobile ? "16" : "18"} height={isMobile ? "16" : "18"} viewBox="0 0 24 24" fill="white">
            <path d="M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4zM14 13h-3v3H9v-3H6v-2h3V8h2v3h3v2z"/>
          </svg>
        </div>
        
        {/* Location */}
        <div style={{
          fontSize: isMobile ? '9px' : '10px',
          color: '#6c757d',
          marginBottom: isMobile ? '6px' : '8px',
          textTransform: 'uppercase',
          letterSpacing: '0.5px',
          fontWeight: 500
        }}>
          {(() => {
            const cachedLocation = productLocations.get(selectedProduct.id);
            const fallbackLocation = selectedProduct.location;
            const displayLocation = cachedLocation || fallbackLocation || 'LOADING LOCATION...';
            console.log('🌍 POPUP DISPLAY - Product:', selectedProduct.name, 'ID:', selectedProduct.id, 'UserType:', userType, 'Cached:', cachedLocation, 'Fallback:', fallbackLocation, 'Display:', displayLocation);
            return displayLocation;
          })()}
        </div>
      </div>

      {/* Content */}
      <div style={{ padding: isMobile ? '0 12px 12px' : '0 16px 16px' }}>
        {/* Main Content Row */}
        <div style={{ display: 'flex', gap: isMobile ? '8px' : '10px', marginBottom: isMobile ? '10px' : '12px' }}>
          {/* Left side - Product Image */}
          <div style={{ 
            width: isMobile ? '60px' : '70px', 
            height: isMobile ? '60px' : '70px', 
            backgroundColor: '#f8f9fa', 
            borderRadius: isMobile ? '4px' : '6px',
            flexShrink: 0
          }}>
            <img
              src={getProductImageSrc(selectedProduct)}
              alt={selectedProduct.name || selectedProduct.productName || 'Product'}
              style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: isMobile ? '4px' : '6px' }}
              onError={(e) => { e.currentTarget.src = getProductIcon(selectedProduct?.subcategory || selectedProduct?.category); }}
            />
          </div>

          {/* Middle - Product Info */}
          <div style={{ flex: 1 }}>
            {/* Product Name and Category */}
            <div style={{ fontSize: isMobile ? '10px' : '12px', color: '#6c757d', marginBottom: '2px' }}>
              {selectedProduct.category || 'Category'}
            </div>
            <div style={{ fontSize: isMobile ? '12px' : '14px', fontWeight: 600, color: '#212529', marginBottom: '2px' }}>
              {selectedProduct.name || 'Product Name'}
            </div>
            
            {/* Farm Name */}
            {selectedProduct.farmName && (
              <div style={{ fontSize: isMobile ? '9px' : '11px', color: '#28a745', marginBottom: '2px', fontWeight: 500 }}>
                🏡 {selectedProduct.farmName}
              </div>
            )}
            
            {/* Farmer Name */}
            <div style={{ fontSize: isMobile ? '9px' : '11px', color: '#6c757d', marginBottom: isMobile ? '6px' : '8px' }}>
              ({selectedProduct.farmer_name || (selectedProduct.isOwnField && user?.name) || user?.name || 'Farmer Name'})
            </div>

            {/* Rating */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '1px', marginBottom: '2px' }}>
              {[1,2,3,4,5].map((star) => (
                <span key={star} style={{ color: star <= 4 ? '#ffc107' : '#e9ecef', fontSize: isMobile ? '10px' : '12px' }}>★</span>
              ))}
            </div>

            {/* Weather */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
              <span style={{ fontSize: isMobile ? '10px' : '12px' }}>🌤️</span>
              <div style={{ fontSize: isMobile ? '9px' : '11px', color: '#6c757d' }}>
                {selectedProduct.weather || '6.4°C - overcast clouds'}
              </div>
            </div>
          </div>

          {/* Right side - Area Info */}
          <div style={{ 
            width: isMobile ? '60px' : '70px', 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'flex-end',
            justifyContent: 'center'
          }}>
            <div style={{ fontSize: isMobile ? '10px' : '12px', color: '#6c757d', marginBottom: '3px' }}>
              {selectedProduct.occupied_area || 0}/{selectedProduct.total_area || selectedProduct.fieldSize || 0}m²
            </div>
            <div style={{
              width: '100%',
              height: isMobile ? '4px' : '6px',
              backgroundColor: '#e9ecef',
              borderRadius: isMobile ? '2px' : '3px',
              overflow: 'hidden',
              marginBottom: '3px'
            }}>
              <div style={{
                width: `${Math.round(((selectedProduct.occupied_area || 0) / (selectedProduct.total_area || selectedProduct.fieldSize || 1)) * 100)}%`,
                height: '100%',
                backgroundColor: '#28a745'
              }} />
            </div>
            <div style={{ 
              fontSize: isMobile ? '9px' : '11px', 
              color: '#28a745', 
              fontWeight: 600,
              textAlign: 'right'
            }}>
              {Math.round(((selectedProduct.occupied_area || 0) / (selectedProduct.total_area || selectedProduct.fieldSize || 1)) * 100)}%
            </div>
          </div>
        </div>

        {/* Divider Line */}
        <div style={{ height: '1px', backgroundColor: '#e9ecef', margin: isMobile ? '10px 0' : '12px 0' }} />

        {/* Harvest Dates */}
        <div style={{ fontSize: isMobile ? '10px' : '12px', color: '#6c757d', marginBottom: isMobile ? '10px' : '12px' }}>
          {(() => {
            const harvestDates = selectedProduct.harvest_dates || selectedProduct.harvestDates;
            const singleDate = selectedProduct.harvest_date || selectedProduct.harvestDate;
            
            // Function to format a date
            const formatDate = (date) => {
              if (!date) return null;
              
              // If it's already in the desired format, return as is
              if (typeof date === 'string' && /^\d{1,2}\s\w{3}\s\d{4}$/.test(date)) {
                return date;
              }
              
              // Try to parse and format the date
              try {
                const parsedDate = new Date(date);
                if (isNaN(parsedDate.getTime())) return date; // Return original if invalid
                
                const day = parsedDate.getDate();
                const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
                               'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                const month = months[parsedDate.getMonth()];
                const year = parsedDate.getFullYear();
                
                return `${day} ${month} ${year}`;
              } catch (e) {
                return date; // Return original if parsing fails
              }
            };
            
            // Handle multiple harvest dates - make them selectable
            if (harvestDates && Array.isArray(harvestDates) && harvestDates.length > 0) {
              const validDates = harvestDates.filter(hd => hd.date && hd.date.trim() !== '');
              
              if (validDates.length === 0) {
                return 'Estimated harvest Date: Not specified';
              }
              
              if (validDates.length === 1) {
                const formattedDate = formatDate(validDates[0].date);
                const label = validDates[0].label ? ` (${validDates[0].label})` : '';
                const dateObj = validDates[0];
                
                // Auto-select the single date if not already selected
                if (!selectedHarvestDate) {
                  setSelectedHarvestDate(dateObj);
                }
                
                return (
                  <div>
                    <div style={{ marginBottom: '4px', fontWeight: '500' }}>Estimated harvest Date:</div>
                    <div 
                      style={{ 
                        marginLeft: '8px', 
                        fontSize: '11px',
                        padding: '4px 8px',
                        backgroundColor: '#007bff',
                        color: 'white',
                        borderRadius: '4px',
                        display: 'inline-block',
                        cursor: 'pointer'
                      }}
                    >
                      {formattedDate}{label}
                    </div>
                  </div>
                );
              }
              
              // Multiple dates - make them selectable
              return (
                <div>
                  <div style={{ marginBottom: '6px', fontWeight: '500' }}>Select harvest Date:</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    {validDates.map((hd, index) => {
                      const formattedDate = formatDate(hd.date);
                      const label = hd.label ? ` (${hd.label})` : '';
                      const isSelected = selectedHarvestDate && selectedHarvestDate.date === hd.date;
                      
                      return (
                        <div 
                          key={index} 
                          onClick={() => setSelectedHarvestDate(hd)}
                          style={{ 
                            marginLeft: '8px', 
                            fontSize: '11px',
                            padding: '4px 8px',
                            backgroundColor: isSelected ? '#007bff' : '#f8f9fa',
                            color: isSelected ? 'white' : '#6c757d',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            border: isSelected ? 'none' : '1px solid #e9ecef',
                            fontWeight: isSelected ? '500' : 'normal',
                            transition: 'all 0.2s ease',
                            width: '70px',
                            textAlign: 'center',
                          }}
                        >
                          {formattedDate}{label}
                        </div>
                      );
                    })}
                  </div>
                  {!selectedHarvestDate && (
                    <div style={{ 
                      fontSize: '10px', 
                      color: '#dc3545', 
                      marginTop: '4px',
                      marginLeft: '8px'
                    }}>
                      Please select a harvest date to proceed
                    </div>
                  )}
                </div>
              );
            }
            
            // Fallback to single date
            const formattedDate = formatDate(singleDate);
            if (singleDate) {
              // Auto-select the single date if not already selected
              if (!selectedHarvestDate) {
                setSelectedHarvestDate({ date: singleDate, label: '' });
              }
              
              return (
                <div>
                  <div style={{ marginBottom: '4px', fontWeight: '500' }}>Estimated harvest Date:</div>
                  <div 
                    style={{ 
                      marginLeft: '8px', 
                      fontSize: '11px',
                      padding: '4px 8px',
                      backgroundColor: '#007bff',
                      color: 'white',
                      borderRadius: '4px',
                      display: 'inline-block'
                    }}
                  >
                    {formattedDate || 'Not specified'}
                  </div>
                </div>
              );
            }
            
            return 'Estimated harvest Date: Not specified';
          })()}
        </div>

        {/* Bottom Section */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          {/* Left Side - Quantity, Price, Shipping */}
          <div style={{ flex: 1 }}>
            {/* Quantity Selector */}
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  style={{
                    width: isMobile ? '20px' : '24px',
                    height: isMobile ? '20px' : '24px',
                    fontSize: isMobile ? '10px' : '12px',
                    backgroundColor: '#f8f9fa',
                    borderRadius: '3px',
                    border: '1px solid #e9ecef',
                    color: '#6c757d',
                    cursor: 'pointer'
                  }}
                >
                  −
                </button>
                <input
                  type="number"
                  min="1"
                  value={quantity}
                  onChange={(e) => {
                    const value = parseInt(e.target.value) || 1;
                    setQuantity(Math.max(1, value));
                    setInsufficientFunds(false);
                  }}
                  style={{
                    width: isMobile ? '32px' : '40px',
                    height: isMobile ? '20px' : '24px',
                    fontSize: isMobile ? '10px' : '12px',
                    fontWeight: 600,
                    textAlign: 'center',
                    border: '1px solid #e9ecef',
                    borderRadius: '3px',
                    backgroundColor: '#fff',
                    color: '#212529',
                    outline: 'none'
                  }}
                />
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  style={{
                    width: isMobile ? '20px' : '24px',
                    height: isMobile ? '20px' : '24px',
                    fontSize: isMobile ? '10px' : '12px',
                    backgroundColor: '#f8f9fa',
                    borderRadius: '3px',
                    border: '1px solid #e9ecef',
                    color: '#6c757d',
                    cursor: 'pointer'
                  }}
                >
                  +
                </button>
                <div style={{ fontSize: isMobile ? '10px' : '12px', color: '#6c757d' }}>m²</div>
              </div>
            </div>

            {/* Price Info */}
            <div style={{ marginBottom: isMobile ? '6px' : '8px' }}>
              <div style={{ fontSize: isMobile ? '10px' : '12px', color: '#6c757d' }}>
                Price {(parseFloat(selectedProduct.price_per_m2) || parseFloat(selectedProduct.price) || parseFloat(selectedProduct.sellingPrice) || 0).toFixed(2)}$/m²
              </div>
              <div style={{ fontSize: isMobile ? '10px' : '12px', color: '#6c757d' }}>
                Exp Prod {selectedProduct.production_rate || selectedProduct.productionRate || 'N/A'} {selectedProduct.production_rate_unit || 'Kg'}
              </div>
            </div>

            {/* Shipping Options */}
            <div>
              <div style={{ fontSize: isMobile ? '10px' : '12px', color: '#6c757d', marginBottom: isMobile ? '4px' : '6px', fontWeight: 500 }}>
                {isPurchased(selectedProduct.id) ? 'Selected Shipping:' : 'Shipping Options:'}
              </div>
              <div style={{ display: 'flex', gap: '6px' }}>
                {isPurchased(selectedProduct.id) ? (
                  // For purchased products, show only the selected shipping option
                  <div
                    style={{
                      padding: '4px 8px',
                      backgroundColor: '#28a745',
                      color: 'white',
                      borderRadius: '4px',
                      fontSize: '11px',
                      fontWeight: 500
                    }}
                  >
                    {(() => {
                      // Determine selected shipping based on available options
                      const availableOptions = [];
                      if (selectedProduct.shipping_pickup) availableOptions.push('Pickup');
                      if (selectedProduct.shipping_delivery) availableOptions.push('Delivery');
                      
                      // If both are available, show the currently selected one, otherwise show the available one
                      if (availableOptions.length === 2) {
                        return selectedShipping || 'Delivery';
                      } else if (availableOptions.length === 1) {
                        return availableOptions[0];
                      } else {
                        return 'Delivery'; // Default fallback
                      }
                    })()
                    }
                  </div>
                ) : (
                  // For non-purchased products, show selectable options
                  (() => {
                    const availableOptions = [];
                    if (selectedProduct.shipping_pickup) availableOptions.push('Pickup');
                    if (selectedProduct.shipping_delivery) availableOptions.push('Delivery');
                    
                    return (availableOptions.length > 0 ? availableOptions : ['Delivery', 'Pickup']).map((option) => (
                      <div
                        key={option}
                        onClick={() => setSelectedShipping(option)}
                        style={{
                          padding: '4px 8px',
                          backgroundColor: selectedShipping === option ? '#007bff' : '#f8f9fa',
                          color: selectedShipping === option ? 'white' : '#6c757d',
                          borderRadius: '4px',
                          fontSize: '11px',
                          cursor: 'pointer',
                          border: selectedShipping === option ? 'none' : '1px solid #e9ecef',
                          fontWeight: 500
                        }}
                      >
                        {option}
                      </div>
                    ));
                  })()
                )}
              </div>
            </div>
          </div>

          {/* Right Side - Buy Now Button and Total Price */}
          <div style={{ 
            width: isMobile ? '80px' : '100px', 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center',
            marginLeft: isMobile ? '8px' : '12px'
          }}>
            <button
              onClick={() => handleBuyNow(selectedProduct)}
              disabled={isPurchased(selectedProduct.id) || !selectedShipping || !selectedHarvestDate}
              style={{
                width: '100%',
                backgroundColor: isPurchased(selectedProduct.id) ? '#28a745' : '#007bff',
                color: 'white',
                border: 'none',
                borderRadius: isMobile ? '4px' : '6px',
                padding: isMobile ? '6px 0' : '8px 0',
                fontSize: isMobile ? '10px' : '12px',
                fontWeight: 600,
                cursor: isPurchased(selectedProduct.id) || !selectedShipping || !selectedHarvestDate ? 'not-allowed' : 'pointer',
                opacity: isPurchased(selectedProduct.id) || !selectedShipping || !selectedHarvestDate ? 0.7 : 1,
                marginBottom: isMobile ? '6px' : '8px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
              }}
            >
              {isPurchased(selectedProduct.id) ? 'Purchased' : 'BUY NOW'}
            </button>

            {/* Total Price */}
            <div style={{ 
              fontSize: isMobile ? '10px' : '12px', 
              fontWeight: 600, 
              color: '#212529', 
              textAlign: 'center',
              marginBottom: isMobile ? '4px' : '6px'
            }}>
              Total Price ${((parseFloat(selectedProduct.price_per_m2) || parseFloat(selectedProduct.price) || 0) * quantity).toFixed(2)}
            </div>

            {/* User Coins */}
            <div style={{
              fontSize: isMobile ? '9px' : '11px',
              color: '#6c757d',
              textAlign: 'center'
            }}>
              <div style={{ marginBottom: '1px' }}>Available Coins: {userCoins}</div>
            </div>

            {/* Insufficient Funds Error */}
            {insufficientFunds && (
              <div style={{
                fontSize: isMobile ? '9px' : '11px',
                color: '#dc3545',
                textAlign: 'center',
                marginTop: isMobile ? '6px' : '8px',
                fontWeight: 600
              }}>
                Can't be bought - you have insufficient coins!
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  </div>
)}

      {/* Keyframes for animations */}
      <style>
        {`
          @keyframes glow-blink {
            0% { 
              filter: drop-shadow(0 0 15px rgba(255, 193, 7, 0.9)) drop-shadow(0 0 30px rgba(255, 193, 7, 0.7));
            }
            50% { 
              filter: drop-shadow(0 0 8px rgba(255, 193, 7, 0.5)) drop-shadow(0 0 16px rgba(255, 193, 7, 0.3));
            }
            100% { 
              filter: drop-shadow(0 0 15px rgba(255, 193, 7, 0.9)) drop-shadow(0 0 30px rgba(255, 193, 7, 0.7));
            }
          }

          @keyframes glow-pulse-white {
            0% { 
              filter: brightness(1) drop-shadow(0 0 12px rgba(255, 255, 255, 0.9)) drop-shadow(0 0 25px rgba(255, 255, 255, 0.7));
              transform: scale(1);
            }
            50% { 
              filter: brightness(1.2) drop-shadow(0 0 20px rgba(255, 255, 255, 1)) drop-shadow(0 0 35px rgba(255, 255, 255, 0.9));
              transform: scale(1.05);
            }
            100% { 
              filter: brightness(1) drop-shadow(0 0 12px rgba(255, 255, 255, 0.9)) drop-shadow(0 0 25px rgba(255, 255, 255, 0.7));
              transform: scale(1);
            }
          }

          @keyframes heartbeat {
            0% {
              transform: scale(1);
            }
            25% {
              transform: scale(1.1);
            }
            50% {
              transform: scale(1);
            }
            75% {
              transform: scale(1.1);
            }
            100% {
              transform: scale(1);
            }
          }

          @keyframes enhanced-pulse {
            0% {
              filter: brightness(1) drop-shadow(0 0 0px rgba(255, 255, 255, 0.7));
            }
            50% {
              filter: brightness(1.2) drop-shadow(0 0 5px rgba(255, 255, 255, 0.9));
            }
            100% {
              filter: brightness(1) drop-shadow(0 0 0px rgba(255, 255, 255, 0.7));
            }
          }

          @keyframes glow-steady-blue {

            0% { 
              filter: drop-shadow(0 0 8px rgba(59, 130, 246, 0.8)) drop-shadow(0 0 16px rgba(59, 130, 246, 0.6));
            }
            100% { 
              filter: drop-shadow(0 0 8px rgba(59, 130, 246, 0.8)) drop-shadow(0 0 16px rgba(59, 130, 246, 0.6));
            }
          }

          @keyframes glow-steady-green {
            0% { 
              filter: brightness(1.1) drop-shadow(0 0 10px rgba(76, 175, 80, 0.8)) drop-shadow(0 0 20px rgba(76, 175, 80, 0.6));
            }
            50% { 
              filter: brightness(1.2) drop-shadow(0 0 15px rgba(76, 175, 80, 0.9)) drop-shadow(0 0 25px rgba(76, 175, 80, 0.7));
            }
            100% { 
              filter: brightness(1.1) drop-shadow(0 0 10px rgba(76, 175, 80, 0.8)) drop-shadow(0 0 20px rgba(76, 175, 80, 0.6));
            }
          }

          @keyframes glow-farmer-created {
            0% { 
              filter: brightness(1.05) drop-shadow(0 0 6px rgba(76, 175, 80, 0.5)) drop-shadow(0 0 12px rgba(76, 175, 80, 0.3));
            }
            50% { 
              filter: brightness(1.15) drop-shadow(0 0 10px rgba(76, 175, 80, 0.7)) drop-shadow(0 0 20px rgba(76, 175, 80, 0.5));
            }
            100% { 
              filter: brightness(1.05) drop-shadow(0 0 6px rgba(76, 175, 80, 0.5)) drop-shadow(0 0 12px rgba(76, 175, 80, 0.3));
            }
          }
        `}
      </style>
    </div>
  );
});
export default EnhancedFarmMap;
