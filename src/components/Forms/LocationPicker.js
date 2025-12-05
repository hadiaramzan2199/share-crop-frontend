import React, { useState, useEffect, useRef } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Typography,
  Paper,
  InputAdornment,
  IconButton,
  CircularProgress
} from '@mui/material';
import { Search, MyLocation, Close } from '@mui/icons-material';
import { Map as MapboxMap, Marker, NavigationControl } from 'react-map-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

const LocationPicker = ({ open, onClose, onLocationSelect, initialLocation }) => {
  // Custom hook to detect mobile screens
  const useIsMobile = () => {
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
      const checkIsMobile = () => {
        setIsMobile(window.innerWidth <= 768);
      };

      checkIsMobile();
      window.addEventListener('resize', checkIsMobile);

      return () => {
        window.removeEventListener('resize', checkIsMobile);
      };
    }, []);

    return isMobile;
  };

  const isMobile = useIsMobile();
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [address, setAddress] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [userLocationLoaded, setUserLocationLoaded] = useState(false);
  const searchTimeoutRef = useRef(null);
  const [viewState, setViewState] = useState({
    longitude: -74.0060, // Default fallback
    latitude: 40.7128,   // Default fallback
    zoom: 13
  });

  // Get user's current location when component opens
  useEffect(() => {
    if (open && !userLocationLoaded) {
      if (initialLocation) {
        setSelectedLocation(initialLocation);
        setViewState(prev => ({
          ...prev,
          longitude: initialLocation.lng,
          latitude: initialLocation.lat
        }));
        setUserLocationLoaded(true);
      } else {
        // Get user's current location
        if (navigator.geolocation) {
          setLoading(true);
          navigator.geolocation.getCurrentPosition(
            (position) => {
              const location = {
                lat: position.coords.latitude,
                lng: position.coords.longitude
              };
              setSelectedLocation(location);
              setViewState(prev => ({
                ...prev,
                longitude: location.lng,
                latitude: location.lat
              }));
              setUserLocationLoaded(true);
              setLoading(false);
            },
            (error) => {
              console.error('Error getting current location:', error);
              // Fallback to default location (New York)
              const fallbackLocation = { lat: 40.7128, lng: -74.0060 };
              setSelectedLocation(fallbackLocation);
              setViewState(prev => ({
                ...prev,
                longitude: fallbackLocation.lng,
                latitude: fallbackLocation.lat
              }));
              setUserLocationLoaded(true);
              setLoading(false);
            }
          );
        } else {
          // Geolocation not supported, use fallback
          const fallbackLocation = { lat: 40.7128, lng: -74.0060 };
          setSelectedLocation(fallbackLocation);
          setViewState(prev => ({
            ...prev,
            longitude: fallbackLocation.lng,
            latitude: fallbackLocation.lat
          }));
          setUserLocationLoaded(true);
        }
      }
    }
  }, [open, initialLocation, userLocationLoaded]);

  // Update view state when selected location changes
  useEffect(() => {
    if (selectedLocation) {
      setViewState(prev => ({
        ...prev,
        longitude: selectedLocation.lng,
        latitude: selectedLocation.lat
      }));
      reverseGeocode(selectedLocation);
    }
  }, [selectedLocation]);

  // Reset state when dialog closes
  useEffect(() => {
    if (!open) {
      setUserLocationLoaded(false);
      setSearchQuery('');
      setSearchResults([]);
      setAddress('');
    }
  }, [open]);

  const reverseGeocode = async (location) => {
    setLoading(true);
    try {
      // Use Mapbox Geocoding API for reverse geocoding
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${location?.lng?.toFixed(6) || 0},${location?.lat?.toFixed(6) || 0}.json?access_token=${process.env.REACT_APP_MAPBOX_ACCESS_TOKEN}`
      );
      const data = await response.json();
      
      if (data.features && data.features.length > 0) {
        setAddress(data.features[0].place_name);
      } else {
        setAddress(`${location.lat.toFixed(6)}, ${location.lng.toFixed(6)}`);
      }
    } catch (error) {
      console.error('Reverse geocoding failed:', error);
      setAddress(`${location.lat.toFixed(6)}, ${location.lng.toFixed(6)}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (query) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setLoading(true);
    try {
      // Use Mapbox Geocoding API for search suggestions worldwide
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?access_token=${process.env.REACT_APP_MAPBOX_ACCESS_TOKEN}`
      );
      const data = await response.json();
      
      if (data.features) {
        const results = data.features.map(feature => ({
          name: feature.text,
          formatted_address: feature.place_name,
          coordinates: feature.center,
          context: feature.context || []
        }));
        setSearchResults(results);
      } else {
        setSearchResults([]);
      }
    } catch (error) {
      console.error('Search failed:', error);
      setSearchResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchInputChange = (value) => {
    setSearchQuery(value);
    
    // Clear previous timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    // Set new timeout for search
    searchTimeoutRef.current = setTimeout(() => {
      handleSearch(value);
    }, 300);
  };

  const handleSearchResultClick = (place) => {
    const location = {
      lat: place.coordinates[1],
      lng: place.coordinates[0]
    };
    setSelectedLocation(location);
    setAddress(place.formatted_address);
    setSearchQuery('');
    setSearchResults([]);
  };

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      setLoading(true);
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          setSelectedLocation(location);
          setLoading(false);
        },
        (error) => {
          console.error('Error getting current location:', error);
          setLoading(false);
        }
      );
    }
  };

  const handleConfirm = () => {
    if (onLocationSelect) {
      onLocationSelect({
        coordinates: [selectedLocation.lng, selectedLocation.lat],
        address: address
      });
    }
    onClose();
  };

  const handleClose = () => {
    setSearchQuery('');
    setSearchResults([]);
    onClose();
  };

  const handleMapClick = (event) => {
    const { lng, lat } = event.lngLat;
    setSelectedLocation({ lat, lng });
  };

  return (
    <Dialog 
      open={open} 
      onClose={handleClose} 
      maxWidth={isMobile ? "sm" : "md"} 
      fullWidth
      PaperProps={{
        sx: {
          height: isMobile ? '90vh' : '80vh',
          maxHeight: isMobile ? '500px' : '600px',
          borderRadius: isMobile ? '12px' : '16px',
          margin: isMobile ? 1 : 2
        }
      }}
    >
      <DialogTitle sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        pb: 1,
        fontSize: isMobile ? '18px' : '20px',
        fontWeight: isMobile ? 600 : 500,
        padding: isMobile ? '12px 16px' : '16px 24px'
      }}>
        Select Farm Location
        <IconButton 
          onClick={handleClose} 
          size={isMobile ? "small" : "medium"}
          sx={{
            '& .MuiSvgIcon-root': {
              fontSize: isMobile ? '20px' : '24px'
            }
          }}
        >
          <Close />
        </IconButton>
      </DialogTitle>
      
      <DialogContent sx={{ p: 0, display: 'flex', flexDirection: 'column' }}>
        {/* Search Section */}
        <Box sx={{ p: isMobile ? 1.5 : 2, borderBottom: '1px solid #e0e0e0' }}>
          <TextField
            fullWidth
            placeholder="Search for a location..."
            value={searchQuery}
            onChange={(e) => handleSearchInputChange(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search sx={{ fontSize: isMobile ? '20px' : '24px' }} />
                </InputAdornment>
              ),
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton 
                    onClick={getCurrentLocation} 
                    disabled={loading}
                    size={isMobile ? "small" : "medium"}
                  >
                    {loading ? (
                      <CircularProgress size={isMobile ? 16 : 20} />
                    ) : (
                      <MyLocation sx={{ fontSize: isMobile ? '20px' : '24px' }} />
                    )}
                  </IconButton>
                </InputAdornment>
              )
            }}
            sx={{
              '& .MuiOutlinedInput-root': {
                fontSize: isMobile ? '14px' : '16px',
                '& input': {
                  fontSize: isMobile ? '14px' : '16px'
                },
                '& input::placeholder': {
                  fontSize: isMobile ? '14px' : '16px'
                },
                '&.Mui-focused fieldset': {
                  borderColor: '#4caf50'
                }
              }
            }}
          />
          
          {/* Search Results */}
          {searchResults.length > 0 && (
            <Paper 
              sx={{ 
                mt: 1, 
                maxHeight: isMobile ? 150 : 200, 
                overflow: 'auto',
                borderRadius: isMobile ? '8px' : '12px',
                border: '1px solid #e8f5e8',
                boxShadow: '0 4px 20px rgba(76, 175, 80, 0.1)',
                '& .MuiBox-root:first-of-type': {
                  borderTopLeftRadius: isMobile ? '8px' : '12px',
                  borderTopRightRadius: isMobile ? '8px' : '12px',
                },
                '& .MuiBox-root:last-of-type': {
                  borderBottomLeftRadius: isMobile ? '8px' : '12px',
                  borderBottomRightRadius: isMobile ? '8px' : '12px',
                  borderBottom: 'none !important',
                }
              }}
            >
              {searchResults.map((place, index) => (
                <Box
                  key={index}
                  sx={{
                    p: isMobile ? 1.5 : 2.5,
                    cursor: 'pointer',
                    borderBottom: index < searchResults.length - 1 ? '1px solid #f0f7f0' : 'none',
                    transition: 'all 0.2s ease',
                    '&:hover': { 
                      backgroundColor: '#f8fdf8',
                      borderLeft: '3px solid #4caf50',
                      paddingLeft: isMobile ? '18px' : '22px',
                    },
                    '&:active': {
                      backgroundColor: '#e8f5e8',
                    }
                  }}
                  onClick={() => handleSearchResultClick(place)}
                >
                  <Typography 
                    variant="body2" 
                    fontWeight={600}
                    sx={{ 
                      color: '#2e7d32',
                      mb: 0.2,
                      fontSize: isMobile ? '12px' : '14px'
                    }}
                  >
                    {place.name}
                  </Typography>
                  <Typography 
                    variant="caption" 
                    sx={{ 
                      color: '#666',
                      fontSize: isMobile ? '10px' : '12px',
                      lineHeight: 0.5
                    }}
                  >
                    {place.formatted_address}
                  </Typography>
                </Box>
              ))}
            </Paper>
          )}
        </Box>

        {/* Map Container */}
        <Box sx={{ flex: 1, position: 'relative' }}>
          {(!process.env.REACT_APP_MAPBOX_ACCESS_TOKEN) ? (
            <div style={{
              position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <div style={{
                background: 'rgba(0,0,0,0.6)', color: '#fff', padding: 12,
                borderRadius: 8, textAlign: 'center'
              }}>
                Add <code>REACT_APP_MAPBOX_ACCESS_TOKEN</code> to <code>.env</code> and restart to use Location Picker.
              </div>
            </div>
          ) : (
          <MapboxMap
            {...viewState}
            onMove={evt => setViewState(evt.viewState)}
            onClick={handleMapClick}
            mapboxAccessToken={process.env.REACT_APP_MAPBOX_ACCESS_TOKEN}
            attributionControl={false}
            style={{ width: '100%', height: '100%' }}
            mapStyle="mapbox://styles/superfroggy/cmfwppeyl00dl01r0287fe98o"
          >
            <NavigationControl position="top-right" />
            
            {selectedLocation && (
              <Marker
                longitude={selectedLocation.lng}
                latitude={selectedLocation.lat}
                anchor="bottom"
              >
                <div style={{
                  width: '32px',
                  height: '32px',
                  background: '#4CAF50',
                  borderRadius: '50% 50% 50% 0',
                  transform: 'rotate(-45deg)',
                  border: '3px solid white',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <div style={{
                    transform: 'rotate(45deg)',
                    color: 'white',
                    fontSize: '16px'
                  }}>
                    📍
                  </div>
                </div>
              </Marker>
            )}
          </MapboxMap>
          )}
          
          {loading && (
            <Box sx={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              bgcolor: 'rgba(255,255,255,0.8)',
              p: 2,
              borderRadius: 1
            }}>
              <CircularProgress />
            </Box>
          )}
        </Box>

        {/* Location Info */}
        <Box sx={{ p: isMobile ? 1.5 : 2, borderTop: '1px solid #e0e0e0', bgcolor: '#f9f9f9' }}>
          <Typography 
            variant="subtitle2" 
            gutterBottom
            sx={{ fontSize: isMobile ? '12px' : '14px', fontWeight: 600 }}
          >
            Selected Location:
          </Typography>
          <Typography 
            variant="body2" 
            color="text.secondary"
            sx={{ fontSize: isMobile ? '11px' : '13px', mb: 0.5 }}
          >
            {address || `${selectedLocation?.lat?.toFixed(6) || 0}, ${selectedLocation?.lng?.toFixed(6) || 0}`}
          </Typography>
          <Typography 
            variant="caption" 
            color="text.secondary"
            sx={{ fontSize: isMobile ? '9px' : '11px' }}
          >
            Coordinates: {selectedLocation?.lat?.toFixed(6) || 0}, {selectedLocation?.lng?.toFixed(6) || 0}
          </Typography>
        </Box>
      </DialogContent>

      <DialogActions sx={{ 
        p: isMobile ? 1.5 : 2,
        flexDirection: isMobile ? 'column' : 'row',
        gap: isMobile ? 1 : 0
      }}>
        <Button 
          onClick={handleClose} 
          color="inherit"
          fullWidth={isMobile}
          sx={{ 
            fontSize: isMobile ? '12px' : '14px',
            padding: isMobile ? '8px 16px' : '6px 16px'
          }}
        >
          Cancel
        </Button>
        <Button 
          onClick={handleConfirm} 
          variant="contained" 
          color="primary"
          disabled={!selectedLocation}
          fullWidth={isMobile}
          sx={{ 
            fontSize: isMobile ? '12px' : '14px',
            padding: isMobile ? '8px 16px' : '6px 16px'
          }}
        >
          Confirm Location
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default LocationPicker;
