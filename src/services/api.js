import axios from 'axios';

const getBaseUrl = () => {
  if (process.env.REACT_APP_API_BASE_URL) return process.env.REACT_APP_API_BASE_URL;
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    return 'http://localhost:5050';
  }
  // Try to guess based on protocol
  const protocol = window.location.protocol;
  return `${protocol}//${window.location.hostname.replace('frontend', 'backend')}`;
};

const API_BASE_URL = getBaseUrl();

// Debug logging to verify the API base URL
console.log('Environment variable REACT_APP_API_BASE_URL:', process.env.REACT_APP_API_BASE_URL);
console.log('Using API_BASE_URL:', API_BASE_URL);

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

let authTokenProvider = null;
export const setAuthTokenProvider = (provider) => {
  authTokenProvider = typeof provider === 'function' ? provider : null;
};

// Add token to requests
api.interceptors.request.use(
  (config) => {
    const token = authTokenProvider ? authTokenProvider() : null;
    if (token) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Handle authentication errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    return Promise.reject(error);
  }
);

export default api;
