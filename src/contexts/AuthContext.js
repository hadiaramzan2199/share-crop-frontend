import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { mockAuthService } from '../services/mockServices';
import { USER_ROLES } from '../utils/roles';
import axios from 'axios'; // Import axios

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const storedRole = localStorage.getItem('userRole');
        let currentUser = null;

        if (storedRole) {
          currentUser = {
            name: storedRole === USER_ROLES.FARMER ? 'Farmer Mock' : 'Dummy User',
            email: storedRole === USER_ROLES.FARMER ? 'farmer@example.com' : 'dummy@example.com',
            user_type: storedRole,
            avatar: 'https://i.pravatar.cc/150?img=1',
          };
        } else {
          // Automatically log in the dummy buyer if no role is stored
          currentUser = {
            name: 'Dummy User',
            email: 'dummy@example.com',
            user_type: USER_ROLES.BUYER,
            avatar: 'https://i.pravatar.cc/150?img=1',
          };
          localStorage.setItem('userRole', USER_ROLES.BUYER);
        }

        // Check if user exists in backend by email, if not, create them
        try {
          const userResponse = await axios.get(`http://localhost:5000/api/users/email/${currentUser.email}`);
          setUser(userResponse.data); // User found, set it
        } catch (error) {
          if (error.response && error.response.status === 404) {
            // User not found by email, try to create them
            try {
              const createResponse = await axios.post('http://localhost:5000/api/users', {
                name: currentUser.name,
                email: currentUser.email,
                password: 'mock_password', // Mock password for mock user
                user_type: currentUser.user_type
              });
              setUser(createResponse.data);
            } catch (createError) {
              // If creation fails, it might be due to duplicate email. Try to log in.
              console.warn('User creation failed, attempting to log in:', createError);
              try {
                const loginResponse = await axios.post('http://localhost:5000/api/auth/login', {
                  email: currentUser.email,
                  password: 'mock_password',
                });
                setUser(loginResponse.data.user); // Assuming login returns user data
              } catch (loginError) {
                console.error('Login failed after creation attempt:', loginError);
                throw loginError; // Re-throw if login also fails
              }
            }
          } else {
            console.error('Error checking user existence by email:', error);
            throw error; // Re-throw other errors
          }
        }
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
      const response = await axios.post('http://localhost:5000/api/auth/login', { email, password });
      const { user: loggedInUser, token } = response.data;
      setUser(loggedInUser);
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
    localStorage.removeItem('userRole');
    // In a real app, you'd also clear any stored tokens
  };

  const switchToRole = useCallback(async (role) => {
    try {
      const email = role === USER_ROLES.FARMER ? 'farmer@example.com' : 'dummy@example.com';
      const userResponse = await axios.get(`http://localhost:5000/api/users/email/${email}`);
      setUser(userResponse.data);
      localStorage.setItem('userRole', role);
    } catch (error) {
      console.error('Failed to switch role:', error);
    }
  }, []);

  const value = {
    user,
    isAuthenticated: !!user,
    loading,
    login,
    logout,
    switchToRole,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext);
};