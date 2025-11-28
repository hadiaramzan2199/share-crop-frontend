import axios from 'axios';

const API_BASE_URL =
  process.env.REACT_APP_API_BASE_URL || `http://${window.location.hostname}:5000`;

// Debug logging to verify the API base URL
console.log('Environment variable REACT_APP_API_BASE_URL:', process.env.REACT_APP_API_BASE_URL);
console.log('Using API_BASE_URL:', API_BASE_URL);

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
api.interceptors.request.use(
  (config) => {
    // localStorage interactions removed as it's deprecated.
    // Authentication token will be managed by a future backend or in-memory for mock auth.
    // const token = localStorage.getItem('token');
    // if (token) {
    //   config.headers.Authorization = `Bearer ${token}`;
    // }
    return config;
  },
  (error) => Promise.reject(error)
);

// Handle authentication errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // localStorage interactions removed as it's deprecated.
      // Token and user data will be managed by a future backend or in-memory for mock auth.
      // localStorage.removeItem('token');
      // localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
