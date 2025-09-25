/**
 * Simplified Weather Service for weatherlayers-gl integration
 * Provides basic weather configuration and utilities
 */

class WeatherService {
  constructor() {
    this.mapboxToken = process.env.REACT_APP_MAPBOX_ACCESS_TOKEN;
  }

  /**
   * Get weather layer configuration for weatherlayers-gl
   * @returns {Object} Weather layer configurations
   */
  getWeatherLayerConfig() {
    return {
      // Sample weather data URLs - replace with your actual weather data sources
      windDataUrl: 'https://api.example.com/wind-data',
      precipitationDataUrl: 'https://api.example.com/precipitation-data',
      temperatureDataUrl: 'https://api.example.com/temperature-data',
      
      // Layer styling options
      windOptions: {
        opacity: 0.8,
        particleCount: 1000,
        particleSize: 1.5,
        speedFactor: 0.5
      },
      precipitationOptions: {
        opacity: 0.6,
        colorScale: ['#00ff00', '#ffff00', '#ff0000']
      },
      temperatureOptions: {
        opacity: 0.5,
        colorScale: ['#0000ff', '#00ffff', '#ffff00', '#ff0000']
      }
    };
  }

  /**
   * Get current weather for a specific location
   * @param {number} lat - Latitude
   * @param {number} lng - Longitude
   * @returns {Promise<Object>} Current weather data
   */
  async getCurrentWeather(lat, lng) {
    try {
      const url = `${this.baseUrl}/current?lat=${lat}&lng=${lng}&access_token=${this.mapboxToken}`;
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`Weather API error: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.warn('Failed to fetch current weather:', error);
      return {
        temperature: 20,
        humidity: 60,
        windSpeed: 5,
        windDirection: 45,
        description: 'Clear'
      };
    }
  }
}

export default new WeatherService();