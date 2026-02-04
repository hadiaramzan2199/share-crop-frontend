/**
 * Simplified Weather Service for weatherlayers-gl integration
 * Provides basic weather configuration and utilities
 */

class WeatherService {
  constructor() {
    this.mapboxToken = process.env.REACT_APP_MAPBOX_ACCESS_TOKEN;
    this.apiKey = process.env.REACT_APP_OPENWEATHER_API_KEY;
    this.baseUrl = 'https://api.openweathermap.org/data/2.5';
  }

  /**
   * Get current weather for a specific location
   * @param {number} lat - Latitude
   * @param {number} lng - Longitude
   * @returns {Promise<Object>} Current weather data
   */
  async getCurrentWeather(lat, lng) {
    if (!this.apiKey) {
      console.warn('🌤️ WeatherService: OpenWeather API Key is missing in .env (REACT_APP_OPENWEATHER_API_KEY)');
      return null;
    }

    try {
      const url = `${this.baseUrl}/weather?lat=${lat}&lon=${lng}&appid=${this.apiKey}&units=metric`;
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`Weather API error: ${response.status}`);
      }

      const data = await response.json();

      return {
        temperature: data.main.temp,
        feelsLike: data.main.feels_like,
        description: data.weather[0].description,
        mainWeather: data.weather[0].main,
        icon: data.weather[0].icon,
        humidity: data.main.humidity,
        pressure: data.main.pressure,
        windSpeed: data.wind.speed,
        windDeg: data.wind.deg,
        visibility: data.visibility,
        clouds: data.clouds.all,
        name: data.name,
        weatherString: `${data.main.temp.toFixed(1)}°C - ${data.weather[0].description}`
      };

    } catch (error) {
      console.warn('Failed to fetch current weather:', error);
      return null;
    }
  }
}

const weatherService = new WeatherService();
export default weatherService;
