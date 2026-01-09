import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Box, CircularProgress, Typography } from '@mui/material';

/**
 * ProtectedRoute - Protects routes based on user authentication and role
 * 
 * @param {Object} props
 * @param {React.ReactNode} props.children - The component to render if authorized
 * @param {string|string[]} props.allowedRoles - Role(s) allowed to access this route ('farmer', 'buyer', 'admin')
 * @param {boolean} props.requireAuth - Whether authentication is required (default: true)
 */
const ProtectedRoute = ({ children, allowedRoles = [], requireAuth = true }) => {
  const { user, isAuthenticated, loading } = useAuth();
  const location = useLocation();

  // Show loading while checking authentication
  if (loading) {
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          gap: 2,
        }}
      >
        <CircularProgress size={40} />
        <Typography variant="body2" color="text.secondary">
          Loading...
        </Typography>
      </Box>
    );
  }

  // If authentication is required but user is not authenticated
  if (requireAuth && !isAuthenticated) {
    // Redirect to login with return URL
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // If no role restrictions, allow access
  if (!allowedRoles || allowedRoles.length === 0) {
    return <>{children}</>;
  }

  // Check if user has required role
  const userRole = user?.user_type?.toLowerCase();
  const allowedRolesArray = Array.isArray(allowedRoles) 
    ? allowedRoles.map(r => r.toLowerCase())
    : [allowedRoles.toLowerCase()];

  if (!userRole || !allowedRolesArray.includes(userRole)) {
    // User doesn't have required role - redirect based on their actual role
    if (userRole === 'admin') {
      return <Navigate to="/admin" replace />;
    } else if (userRole === 'farmer') {
      return <Navigate to="/farmer" replace />;
    } else if (userRole === 'buyer') {
      return <Navigate to="/buyer" replace />;
    } else {
      // Unknown role or no role - redirect to home
      return <Navigate to="/" replace />;
    }
  }

  // User is authenticated and has required role
  return <>{children}</>;
};

export default ProtectedRoute;

