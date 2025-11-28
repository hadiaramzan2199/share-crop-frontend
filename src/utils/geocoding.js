/**
 * Utility functions for geocoding operations
 */

/**
 * Reverse geocode coordinates to get location information
 * @param {number} latitude - Latitude coordinate
 * @param {number} longitude - Longitude coordinate
 * @returns {Promise<string>} - Location name (city, state/country)
 */
export const reverseGeocode = async (latitude, longitude) => {
  try {
    // Using OpenStreetMap Nominatim API for reverse geocoding (free)
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=10&addressdetails=1`,
      {
        headers: {
          'User-Agent': 'ShareCrop-Frontend/1.0'
        }
      }
    );

    if (!response.ok) {
      throw new Error('Geocoding request failed');
    }

    const data = await response.json();
    
    if (data && data.address) {
      const address = data.address;
      
      // Build location string with priority: city, state/province, country
      const locationParts = [];
      
      // Add city/town/village
      if (address.city) {
        locationParts.push(address.city);
      } else if (address.town) {
        locationParts.push(address.town);
      } else if (address.village) {
        locationParts.push(address.village);
      } else if (address.county) {
        locationParts.push(address.county);
      }
      
      // Add state/province
      if (address.state) {
        locationParts.push(address.state);
      } else if (address.province) {
        locationParts.push(address.province);
      }
      
      // Add country
      if (address.country) {
        locationParts.push(address.country);
      }
      
      // Return formatted location string
      if (locationParts.length > 0) {
        return locationParts.join(', ');
      }
    }
    
    // Fallback if no proper address found
    return `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
    
  } catch (error) {
    console.error('Reverse geocoding failed:', error);
    // Return coordinates as fallback
    return `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
  }
};

/**
 * Cache for geocoding results to avoid repeated API calls
 */
const geocodingCache = new Map();

/**
 * Cached reverse geocode function
 * @param {number} latitude - Latitude coordinate
 * @param {number} longitude - Longitude coordinate
 * @returns {Promise<string>} - Location name (city, state/country)
 */
export const cachedReverseGeocode = async (latitude, longitude) => {
  // Create cache key from rounded coordinates (to avoid cache misses for tiny differences)
  const cacheKey = `${latitude.toFixed(4)},${longitude.toFixed(4)}`;
  
  // Check cache first
  if (geocodingCache.has(cacheKey)) {
    return geocodingCache.get(cacheKey);
  }
  
  // Get location from API
  const location = await reverseGeocode(latitude, longitude);
  
  // Cache the result
  geocodingCache.set(cacheKey, location);
  
  return location;
};