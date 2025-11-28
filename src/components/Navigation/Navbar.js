import React, { useState } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  IconButton,
  Menu,
  MenuItem,
  Badge,
  Box,
  Avatar,
  Chip,
} from '@mui/material';
import {
  ShoppingCart,
  AccountCircle,
  ExitToApp,
  Dashboard,
  Store,
  Notifications,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

const Navbar = ({ user, onLogout }) => {
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = useState(null);
  const [notificationsAnchor, setNotificationsAnchor] = useState(null);

  const handleMenu = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleNotifications = (event) => {
    setNotificationsAnchor(event.currentTarget);
  };

  const handleNotificationsClose = () => {
    setNotificationsAnchor(null);
  };

  const handleLogoutClick = () => {
    onLogout();
    handleClose();
    navigate('/login');
  };

  const handleProfileClick = () => {
    handleClose();
    navigate('/profile');
  };

  const handleDashboardClick = () => {
    navigate(user.user_type === 'farmer' ? '/farmer' : '/buyer');
  };

  return (
    <AppBar 
      position="static" 
      sx={{ 
        backgroundColor: 'white', 
        color: 'primary.main',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
      }}
    >
      <Toolbar>
        {/* Logo/Brand */}
        <Typography
          variant="h6"
          component="div"
          sx={{
            flexGrow: 0,
            mr: 4,
            fontWeight: 'bold',
            cursor: 'pointer',
            background: 'linear-gradient(45deg, #4caf50, #66bb6a)',
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            color: 'transparent',
          }}
          onClick={() => navigate('/')}
        >
          🌱 Share Crop
        </Typography>

        {/* Navigation Links */}
        <Box sx={{ flexGrow: 1, display: 'flex', gap: 2 }}>
          <Button
            color="inherit"
            startIcon={<Dashboard />}
            onClick={handleDashboardClick}
            sx={{ fontWeight: 'bold' }}
          >
            Dashboard
          </Button>
          <Button
            color="inherit"
            startIcon={<Store />}
            onClick={() => navigate('/marketplace')}
            sx={{ fontWeight: 'bold' }}
          >
            Marketplace
          </Button>
        </Box>

        {/* Farm Coins Balance */}
        <Chip
          icon={<span>🪙</span>}
          label="1,250 Coins"
          variant="outlined"
          sx={{ 
            mr: 2,
            fontWeight: 'bold',
            borderColor: 'warning.main',
            color: 'warning.dark',
          }}
        />

        {/* Notifications */}
        <IconButton
          size="large"
          color="inherit"
          onClick={handleNotifications}
          sx={{ mr: 1 }}
        >
          <Badge badgeContent={3} color="error">
            <Notifications />
          </Badge>
        </IconButton>

        {/* Shopping Cart (for buyers) */}
        {user.user_type === 'buyer' && (
          <IconButton
            size="large"
            color="inherit"
            onClick={() => navigate('/cart')}
            sx={{ mr: 1 }}
          >
            <Badge badgeContent={2} color="error">
              <ShoppingCart />
            </Badge>
          </IconButton>
        )}

        {/* User Menu */}
        <Box sx={{ display: 'flex', alignItems: 'center', ml: 2 }}>
          <Avatar
            sx={{ 
              width: 32, 
              height: 32, 
              mr: 1,
              backgroundColor: 'primary.main',
              fontSize: '14px',
            }}
          >
            {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
          </Avatar>
          <Typography variant="body2" sx={{ mr: 1 }}>
            {user.name}
          </Typography>
          <IconButton
            size="large"
            color="inherit"
            onClick={handleMenu}
          >
            <AccountCircle />
          </IconButton>
        </Box>

        {/* User Dropdown Menu */}
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleClose}
        >
          <MenuItem onClick={handleProfileClick}>
            <AccountCircle sx={{ mr: 1 }} />
            Profile
          </MenuItem>
          <MenuItem onClick={handleDashboardClick}>
            <Dashboard sx={{ mr: 1 }} />
            Dashboard
          </MenuItem>
          <MenuItem onClick={handleLogoutClick}>
            <ExitToApp sx={{ mr: 1 }} />
            Logout
          </MenuItem>
        </Menu>

        {/* Notifications Menu */}
        <Menu
          anchorEl={notificationsAnchor}
          open={Boolean(notificationsAnchor)}
          onClose={handleNotificationsClose}
        >
          <MenuItem onClick={handleNotificationsClose}>
            🎉 New order received!
          </MenuItem>
          <MenuItem onClick={handleNotificationsClose}>
            🌱 Your crops are ready for harvest
          </MenuItem>
          <MenuItem onClick={handleNotificationsClose}>
            💰 Payment received for order #123
          </MenuItem>
        </Menu>
      </Toolbar>
    </AppBar>
  );
};

export default Navbar;