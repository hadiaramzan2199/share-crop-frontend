import React from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import { ThemeProvider as MuiThemeProvider } from '@mui/material/styles';
import GlobalStyle from './styles/GlobalStyle';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { RoleProvider } from './contexts/RoleContext';
import { Box } from '@mui/material';
import farmvilleTheme from './styles/theme';
import FarmerView from './pages/FarmerView';
import BuyerView from './pages/BuyerView';
import Home from './pages/Home';


const AppContent = () => {
  const { isAuthenticated, user } = useAuth();

  return (
    <Router>
      <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <Routes>
          <Route path="/" element={isAuthenticated ? (
            user?.user_type === 'farmer' ? <Navigate to="/farmer" /> : <Navigate to="/buyer" />
          ) : <Home />} />
          <Route path="/farmer/*" element={isAuthenticated ? <FarmerView /> : <Navigate to="/" />} />
          <Route path="/buyer/*" element={isAuthenticated ? <BuyerView /> : <Navigate to="/" />} />
        </Routes>
      </Box>
    </Router>
  );
};

const App = () => {
  return (
    <MuiThemeProvider theme={farmvilleTheme}>
      <GlobalStyle />
      <AuthProvider>
        <RoleProvider>
          <AppContent />
        </RoleProvider>
      </AuthProvider>
    </MuiThemeProvider>
  );
};

export default App;