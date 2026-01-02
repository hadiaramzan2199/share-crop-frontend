import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { mockAuthService } from '../services/mockServices';
import { USER_ROLES } from '../utils/roles';
import axios from 'axios'; // Import axios
import api, { setAuthTokenProvider } from '../services/api';
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || `http://${window.location.hostname}:5000`;

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(null);

  useEffect(() => {
    setAuthTokenProvider(() => token);
  }, [token]);

  useEffect(() => {
    const initializeAuth = async () => {
      try {
      } catch (error) {
        console.error("Failed to initialize authentication", error);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const login = async (email, password) => {
    setLoading(true);
    try {
      const response = await axios.post(`${API_BASE_URL}/api/auth/login`, { email, password });
      const { user: loggedInUser, token } = response.data;
      setUser(loggedInUser);
      setToken(token);
      localStorage.setItem('userRole', loggedInUser.user_type);
      // In a real app, you'd store the token securely (e.g., httpOnly cookies)
      return loggedInUser;
    } catch (error) {
      console.error("Login failed", error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('userRole');
    // In a real app, you'd also clear any stored tokens
  };

  const switchToRole = useCallback(async (role) => {
    try {
      const roleLower = String(role).toLowerCase();
      const email = roleLower === USER_ROLES.FARMER
        ? 'farmer@example.com'
        : roleLower === USER_ROLES.ADMIN
        ? 'admin@example.com'
        : 'dummy@example.com';
      const userResponse = await axios.get(`${API_BASE_URL}/api/users/email/${email}`);
      setUser(userResponse.data);
      try {
        const loginResponse = await axios.post(`${API_BASE_URL}/api/auth/login`, {
          email,
          password: 'mock_password',
        });
        setToken(loginResponse.data.token);
      } catch (e) {
        console.warn('Role switch login failed:', e);
      }
      localStorage.setItem('userRole', role);
    } catch (error) {
      console.error('Failed to switch role:', error);
    }
  }, []);

  const value = {
    user,
    isAuthenticated: !!user,
    loading,
    token,
    login,
    logout,
    switchToRole,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext);
};
