import React, { useState, useRef, useEffect } from 'react';
import { Box } from '@mui/material';
import EnhancedHeader from '../components/Layout/EnhancedHeader';
import AdminSidebar from '../components/Navigation/AdminSidebar';
import { useAuth } from '../contexts/AuthContext';
import { Outlet } from 'react-router-dom';

const AdminView = () => {
  const { user, logout, switchToRole } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const headerRef = useRef(null);

  useEffect(() => {
    setSidebarOpen(false);
    // No need to force role - use actual logged-in user
  }, []);

  return (
    <Box sx={{ flexGrow: 1, height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <EnhancedHeader ref={headerRef} user={user} onLogout={logout} userType={'admin'} onMenuClick={() => setSidebarOpen((v) => !v)} />
      <AdminSidebar user={user || { name: 'Admin', user_type: 'admin' }} onLogout={logout} open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <Box sx={{
        flexGrow: 1,
        mt: 'var(--app-header-height)',
        height: 'calc(100vh - var(--app-header-height))',
        overflow: 'auto',
        position: 'relative',
        px: { xs: 2, sm: 3, md: 4 },
        pb: { xs: 2, sm: 3, md: 4 }
      }}>
        <Outlet />
      </Box>
    </Box>
  );
};

export default AdminView;
