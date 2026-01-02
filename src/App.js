import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { ThemeProvider as MuiThemeProvider } from '@mui/material/styles';
import GlobalStyle from './styles/GlobalStyle';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { RoleProvider } from './contexts/RoleContext';
import { Box } from '@mui/material';
import farmvilleTheme from './styles/theme';
import FarmerView from './pages/FarmerView';
import BuyerView from './pages/BuyerView';
import AdminView from './pages/AdminView';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminUsers from './pages/admin/AdminUsers';
import AdminQA from './pages/admin/AdminQA';
import AdminCoins from './pages/admin/AdminCoins';
import AdminPayments from './pages/admin/AdminPayments';
import AdminAudit from './pages/admin/AdminAudit';
import AdminAnalytics from './pages/admin/AdminAnalytics';
import Home from './pages/Home';


const AppContent = () => {
  useAuth();

  return (
    <Router>
      <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route
            path="/farmer/*"
            element={<FarmerView />}
          />
          <Route
            path="/buyer/*"
            element={<BuyerView />}
          />
          <Route
            path="/admin/*"
            element={<AdminView />}
          >
            <Route index element={<AdminDashboard />} />
            <Route path="users" element={<AdminUsers />} />
            <Route path="qa" element={<AdminQA />} />
            <Route path="coins" element={<AdminCoins />} />
            <Route path="payments" element={<AdminPayments />} />
            <Route path="audit" element={<AdminAudit />} />
            <Route path="analytics" element={<AdminAnalytics />} />
          </Route>
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
