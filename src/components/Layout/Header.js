import React, { useState } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  IconButton,
  Menu,
  MenuItem,
  Avatar,
  Badge,
  InputBase,
  Tooltip,
  Fade,
} from '@mui/material';
import {
  Search,
  Notifications,
  ShoppingCart,
  AccountCircle,
  Menu as MenuIcon,
  KeyboardArrowDown,
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';

const Header = ({ user, onLogout }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [anchorEl, setAnchorEl] = useState(null);

  const handleMenu = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    onLogout();
    handleClose();
  };

  return (
    <AppBar
      position="sticky"
      elevation={0}
      sx={{
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(0, 0, 0, 0.08)',
        color: 'text.primary',
        zIndex: 1300,
      }}
    >
      <Toolbar 
        sx={{ 
          justifyContent: 'space-between',
          minHeight: '72px !important',
          px: { xs: 2, sm: 3, md: 4 },
        }}
      >
        {/* Logo */}
        <Box 
          sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            cursor: 'pointer',
            transition: 'transform 0.2s ease-in-out',
            '&:hover': {
              transform: 'scale(1.02)',
            }
          }} 
          onClick={() => navigate('/')}
        >
          <Typography
            variant="h5"
            sx={{
              fontWeight: 700,
              fontSize: { xs: '1.5rem', sm: '1.75rem' },
              background: 'linear-gradient(135deg, #2E7D32 0%, #4CAF50 50%, #66BB6A 100%)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              letterSpacing: '-0.02em',
            }}
          >
            🌱 ShareCrop
          </Typography>
        </Box>

        {/* Search Bar - Only show on marketplace pages */}
        {(location.pathname.includes('/buyer') || location.pathname === '/') && (
          <Box
            sx={{
              display: { xs: 'none', md: 'flex' },
              alignItems: 'center',
              backgroundColor: 'rgba(0, 0, 0, 0.04)',
              border: '1px solid rgba(0, 0, 0, 0.08)',
              borderRadius: '12px',
              px: { xs: 2, sm: 3 },
              py: { xs: 1, sm: 1.5 },
              mx: { xs: 2, sm: 3, md: 4 },
              flex: 1,
              maxWidth: { xs: 300, sm: 400, lg: 480 },
              transition: 'all 0.2s ease-in-out',
              '&:hover': {
                backgroundColor: 'rgba(0, 0, 0, 0.06)',
                borderColor: 'rgba(76, 175, 80, 0.3)',
              },
              '&:focus-within': {
                backgroundColor: 'white',
                borderColor: 'primary.main',
                boxShadow: '0 0 0 3px rgba(76, 175, 80, 0.1)',
              }
            }}
          >
            <Search sx={{ color: 'grey.500', mr: { xs: 1, sm: 2 }, fontSize: { xs: 18, sm: 20 } }} />
            <InputBase
              placeholder="Search crops, farms, products..."
              sx={{ 
                flex: 1,
                fontSize: { xs: '0.9rem', sm: '0.95rem' },
                '& input::placeholder': {
                  color: 'grey.500',
                  opacity: 1,
                }
              }}
            />
          </Box>
        )}
        
        {/* Mobile Search Icon */}
        {(location.pathname.includes('/buyer') || location.pathname === '/') && (
          <IconButton
            sx={{
              display: { xs: 'flex', md: 'none' },
              color: 'text.secondary',
              '&:hover': {
                backgroundColor: 'rgba(76, 175, 80, 0.08)',
                color: 'primary.main',
              },
            }}
          >
            <Search />
          </IconButton>
        )}

        {/* Navigation Links */}
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: { xs: 0.5, sm: 1, md: 1.5 },
          flex: { md: 1 },
          justifyContent: { md: 'flex-end' },
        }}>
          {user ? (
            <>
              {/* Quick Actions */}
              <Box sx={{ 
                display: { xs: 'none', md: 'flex' }, 
                alignItems: 'center', 
                gap: { md: 0.5, lg: 1 },
              }}>
                {user.user_type === 'buyer' && (
                  <Button
                    variant="text"
                    onClick={() => navigate('/buyer')}
                    sx={{ 
                      fontWeight: 500,
                      fontSize: '0.9rem',
                      textTransform: 'none',
                      color: 'text.primary',
                      px: 2,
                      py: 1,
                      borderRadius: '8px',
                      '&:hover': {
                        backgroundColor: 'rgba(76, 175, 80, 0.08)',
                        color: 'primary.main',
                      }
                    }}
                  >
                    Marketplace
                  </Button>
                )}
                {user.user_type === 'farmer' && (
                  <Button
                    variant="text"
                    onClick={() => navigate('/farmer')}
                    sx={{ 
                      fontWeight: 500,
                      fontSize: '0.9rem',
                      textTransform: 'none',
                      color: 'text.primary',
                      px: 2,
                      py: 1,
                      borderRadius: '8px',
                      '&:hover': {
                        backgroundColor: 'rgba(76, 175, 80, 0.08)',
                        color: 'primary.main',
                      }
                    }}
                  >
                    My Farm
                  </Button>
                )}
              </Box>

              {/* Action Icons */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 0.25, sm: 0.5 } }}>
                <Tooltip title="Shopping Cart" arrow>
                  <IconButton 
                    onClick={() => navigate('/buyer/cart')}
                    sx={{ 
                      color: 'text.secondary',
                      p: { xs: 1, sm: 1.25 },
                      '&:hover': { 
                        backgroundColor: 'rgba(76, 175, 80, 0.08)',
                        color: 'primary.main',
                      }
                    }}
                  >
                    <Badge 
                      badgeContent={4} 
                      color="error"
                      sx={{
                        '& .MuiBadge-badge': {
                          fontSize: { xs: '0.65rem', sm: '0.7rem' },
                          minWidth: { xs: '16px', sm: '18px' },
                          height: { xs: '16px', sm: '18px' },
                        }
                      }}
                    >
                      <ShoppingCart sx={{ fontSize: { xs: 20, sm: 22 } }} />
                    </Badge>
                  </IconButton>
                </Tooltip>

                <Tooltip title="Notifications" arrow>
                  <IconButton 
                    sx={{ 
                      color: 'text.secondary',
                      p: { xs: 1, sm: 1.25 },
                      '&:hover': { 
                        backgroundColor: 'rgba(76, 175, 80, 0.08)',
                        color: 'primary.main',
                      }
                    }}
                  >
                    <Badge 
                      badgeContent={3} 
                      color="error"
                      sx={{
                        '& .MuiBadge-badge': {
                          fontSize: { xs: '0.65rem', sm: '0.7rem' },
                          minWidth: { xs: '16px', sm: '18px' },
                          height: { xs: '16px', sm: '18px' },
                        }
                      }}
                    >
                      <Notifications sx={{ fontSize: { xs: 20, sm: 22 } }} />
                    </Badge>
                  </IconButton>
                </Tooltip>
              </Box>

              {/* User Profile */}
              <Button
                onClick={handleMenu}
                sx={{
                  ml: { xs: 0.5, sm: 1 },
                  p: { xs: 0.25, sm: 0.5 },
                  minWidth: 'auto',
                  borderRadius: '12px',
                  '&:hover': {
                    backgroundColor: 'rgba(76, 175, 80, 0.08)',
                  }
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 0.5, sm: 1 } }}>
                  <Avatar 
                    sx={{ 
                      width: { xs: 32, sm: 36 }, 
                      height: { xs: 32, sm: 36 }, 
                      bgcolor: 'primary.main',
                      fontSize: { xs: '0.8rem', sm: '0.9rem' },
                      fontWeight: 600,
                    }}
                  >
                    {user.name?.charAt(0)?.toUpperCase() || 'U'}
                  </Avatar>
                  <Box sx={{ display: { xs: 'none', sm: 'block' }, textAlign: 'left' }}>
                    <Typography variant="body2" sx={{ fontWeight: 500, color: 'text.primary', lineHeight: 1.2, fontSize: { sm: '0.875rem', md: '0.9rem' } }}>
                      {user.name || 'User'}
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'text.secondary', textTransform: 'capitalize', fontSize: { sm: '0.75rem', md: '0.8rem' } }}>
                      {user.user_type}
                    </Typography>
                  </Box>
                  <KeyboardArrowDown sx={{ fontSize: { sm: 16, md: 18 }, color: 'text.secondary', display: { xs: 'none', sm: 'block' } }} />
                </Box>
              </Button>
            </>
          ) : (
            <>
              <Button
                color="inherit"
                onClick={() => navigate('/login')}
                sx={{ fontWeight: 600 }}
              >
                Sign In
              </Button>
              <Button
                variant="contained"
                onClick={() => navigate('/register')}
                sx={{
                  borderRadius: 25,
                  px: 3,
                  background: 'linear-gradient(135deg, #4CAF50 0%, #2E7D32 100%)',
                }}
              >
                Join Now
              </Button>
            </>
          )}
        </Box>

        {/* Mobile Menu Button */}
        {user && (
          <IconButton
            color="inherit"
            sx={{ 
              display: { xs: 'flex', md: 'none' },
              ml: 1,
              color: 'text.secondary',
              '&:hover': {
                backgroundColor: 'rgba(76, 175, 80, 0.08)',
                color: 'primary.main',
              },
            }}
            onClick={handleMenu}
          >
            <MenuIcon />
          </IconButton>
        )}

        {/* User Menu */}
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleClose}
        >
          {user ? (
            [
              <MenuItem key="profile" onClick={() => { navigate('/profile'); handleClose(); }}>
                <AccountCircle sx={{ mr: 2 }} /> Profile
              </MenuItem>,
              <MenuItem key="logout" onClick={handleLogout}>
                <AccountCircle sx={{ mr: 2 }} /> Logout
              </MenuItem>
            ]
          ) : (
            [
              <MenuItem key="login" onClick={() => { navigate('/login'); handleClose(); }}>
                Sign In
              </MenuItem>,
              <MenuItem key="register" onClick={() => { navigate('/register'); handleClose(); }}>
                Create Account
              </MenuItem>
            ]
          )}
        </Menu>
      </Toolbar>
    </AppBar>
  );
};

export default Header;