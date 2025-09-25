import React, { useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  MenuItem,
  Avatar,
  InputBase,
  Box,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Chip,
  Paper,
  MenuList,
  ClickAwayListener,
  Popper,
  FormGroup,
  FormControlLabel,
  Checkbox,
  Button,
  Badge,
  Tooltip,
} from '@mui/material';
import {
  Search,
  Tune,
  Menu as MenuIcon,
  History,
  ExitToApp,
  Close,
  Landscape,
  Person,
  Message,
  CurrencyExchange,
  Settings,
  Agriculture,
  Receipt,
  Nature,
  AccountBalance,
  Add,
  HomeWork,
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import coinService from '../../services/coinService';

// Custom hook to detect mobile screens
const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    checkIsMobile();
    window.addEventListener('resize', checkIsMobile);

    return () => window.removeEventListener('resize', checkIsMobile);
  }, []);

  return isMobile;
};

// CSS animation styles
const slideDownAnimation = `
  @keyframes slideDown {
    from {
      opacity: 0;
      transform: translateY(-10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
`;

// Inject the animation styles
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = slideDownAnimation;
  document.head.appendChild(style);
}

const EnhancedHeader = forwardRef(({ user, onLogout, onSearchChange, fields = [], onFarmSelect, farmerCoins = 12500, onCreateField, onCreateFarm, userType = 'farmer' }, ref) => {
  const navigate = useNavigate();
  const location = useLocation();
  const isMobile = useIsMobile();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchAnchorEl, setSearchAnchorEl] = useState(null);
  const [filteredFields, setFilteredFields] = useState([]);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [filterAnchorEl, setFilterAnchorEl] = useState(null);
  const [activeFilters, setActiveFilters] = useState({
    categories: [],
    products: [],
    locations: []
  });
  const [userCoins, setUserCoins] = useState(12500);

  // Get user-specific coins when user changes
  const loadUserCoins = async () => {
    if (user && user.id) {
      try {
        const coins = await coinService.getUserCoins(user.id);
        setUserCoins(coins);
      } catch (error) {
        console.error('Error loading user coins:', error);
        setUserCoins(12500); // Default fallback
      }
    } else {
      setUserCoins(12500); // Default for logged out users
    }
  };

  useEffect(() => {
    loadUserCoins();
  }, [user]);

  // Expose refresh function to parent components
  useImperativeHandle(ref, () => ({
    refreshCoins: loadUserCoins
  }));

  const handleLogout = () => {
    onLogout();
  };

  const toggleDrawer = () => {
    setDrawerOpen(!drawerOpen);
  };

  const handleNavigation = (path) => {
    navigate(path);
    setDrawerOpen(false);
  };

  // Filter logic functions
  const applyFilters = (fieldsToFilter) => {
    let filtered = fieldsToFilter;

    // Apply category filters
    if (activeFilters.categories.length > 0) {
      filtered = filtered.filter(field => 
        activeFilters.categories.some(category => 
          field.category?.toLowerCase().includes(category.toLowerCase()) ||
          field.subcategory?.toLowerCase().includes(category.toLowerCase()) ||
          field.type?.toLowerCase().includes(category.toLowerCase())
        )
      );
    }

    // Apply product filters
    if (activeFilters.products.length > 0) {
      filtered = filtered.filter(field => 
        activeFilters.products.some(filterProduct => 
          field.product_name?.toLowerCase().includes(filterProduct.toLowerCase()) ||
          field.productName?.toLowerCase().includes(filterProduct.toLowerCase()) ||
          field.category?.toLowerCase().includes(filterProduct.toLowerCase())
        )
      );
    }

    return filtered;
  };

  const handleFilterApply = () => {
    const filtered = applyFilters(fields);
    setFilteredFields(filtered);
    if (onSearchChange) {
      onSearchChange(searchQuery, filtered);
    }
    setFilterAnchorEl(null);
  };

  const handleFilterClear = () => {
    setActiveFilters({ categories: [], products: [], locations: [] });
    setFilteredFields(fields);
    if (onSearchChange) {
      onSearchChange(searchQuery, fields);
    }
  };

  const farmerMenuItems = [
    { text: 'Rented Fields', icon: <Landscape />, path: '/farmer/rented-fields' },
    { text: 'My Farms', icon: <Agriculture />, path: '/farmer/my-farms' },
    { text: 'My Orders', icon: <History />, path: '/farmer/orders' },
    { text: 'Farm Orders', icon: <Receipt />, path: '/farmer/farm-orders' },
    { text: 'License Info', icon: <Nature />, path: '/farmer/license-info' },
    { text: 'Transaction', icon: <AccountBalance />, path: '/farmer/transaction' },
    { text: 'Profile', icon: <Person />, path: '/farmer/profile' },
    { text: 'Messages', icon: <Message />, path: '/farmer/messages' },
    { text: 'Change Currency', icon: <CurrencyExchange />, path: '/farmer/currency' },
    { text: 'Settings', icon: <Settings />, path: '/farmer/settings' },
  ];

  const buyerMenuItems = [
    { text: 'Rented Fields', icon: <Landscape />, path: '/buyer/rented-fields' },
    { text: 'My Orders', icon: <History />, path: '/buyer/orders' },
    { text: 'Profile', icon: <Person />, path: '/buyer/profile' },
    { text: 'Messages', icon: <Message />, path: '/buyer/messages' },
    { text: 'Change Currency', icon: <CurrencyExchange />, path: '/buyer/currency' },
    { text: 'Settings', icon: <Settings />, path: '/buyer/settings' },
  ];

  const menuItems = userType === 'farmer' ? farmerMenuItems : buyerMenuItems;

  return (
    <>
      <AppBar
        position="fixed"
        sx={{
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(10px)',
          color: 'text.primary',
          boxShadow: '0 2px 20px rgba(0,0,0,0.1)',
          borderBottom: '1px solid rgba(0,0,0,0.05)',
          zIndex: 1300,
        }}
      >
        <Toolbar sx={{ 
          justifyContent: 'space-between', 
          px: { xs: 1, sm: 2 },
          minHeight: { xs: 56, sm: 64 },
          gap: 1
        }}>
          {/* Left Section - Menu Button */}
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center',
            minWidth: 'fit-content'
          }}>
            <IconButton
              edge="start"
              color="inherit"
              onClick={toggleDrawer}
              sx={{ 
                mr: { xs: 0.5, sm: 1 },
                p: { xs: 1, sm: 1.5 },
                '& .MuiSvgIcon-root': {
                  fontSize: { xs: '20px', sm: '24px' }
                }
              }}
            >
              <MenuIcon />
            </IconButton>
          </Box>

          {/* Center Section - Company Logo/Name */}
          {!isMobile && (
            <Box 
              sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                cursor: 'pointer',
                position: 'absolute',
                left: '50%',
                transform: 'translateX(-50%)',
                zIndex: 1
              }} 
              onClick={() => navigate('/')}
            >
              <Typography
                variant="h5"
                sx={{
                  fontWeight: 800,
                  background: 'linear-gradient(135deg, #4CAF50 0%, #2E7D32 100%)',
                  backgroundClip: 'text',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  fontSize: { sm: '1.25rem', md: '1.5rem' }
                }}
              >
                🌱 ShareCrop
              </Typography>
            </Box>
          )}

          {/* Right Section - Search, Filter, Actions, Coins, Profile */}
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: { xs: 0.5, sm: 1 },
            position: 'relative',
            flex: 1,
            justifyContent: 'flex-end',
            maxWidth: { xs: '70%', sm: 'auto' }
          }}>
            {/* Search Section */}
            <Box sx={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              {/* Mobile Search Icon */}
              {isMobile && (
                <Box sx={{ position: 'relative' }}>
                  <IconButton
                    color="inherit"
                    onClick={() => setMobileSearchOpen(!mobileSearchOpen)}
                    size="small"
                    sx={{ 
                      backgroundColor: 'rgba(0,0,0,0.04)',
                      '&:hover': { backgroundColor: 'rgba(0,0,0,0.08)' },
                      '& .MuiSvgIcon-root': {
                        fontSize: '18px'
                      },
                      p: 1
                    }}
                  >
                    <Search />
                  </IconButton>
                  
                  {/* Mobile Search Bar - positioned relative to search icon */}
                  {mobileSearchOpen && (
                    <Box
                      sx={{
                        position: 'absolute',
                        top: '100%',
                        left: 0,
                        right: 0,
                        minWidth: '280px',
                        zIndex: 1000,
                        mt: 1.5,
                        ml: -16,
                        animation: 'slideDown 0.2s ease-out'
                      }}
                    >
                      <Box
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          backgroundColor: 'white',
                          borderRadius: 20,
                          px: 2,
                          py: 0.5,
                          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                          border: '1px solid rgba(0,0,0,0.1)',
                        }}
                      >
                        <InputBase
                          placeholder="Search fields, crops..."
                          value={searchQuery}
                          onChange={(e) => {
                            const query = e.target.value;
                            setSearchQuery(query);
                            
                            if (query.trim()) {
                              // First apply filters, then search within filtered results
                              let fieldsToSearch = applyFilters(fields);
                              
                              // Filter fields based on search query
                              const filtered = fieldsToSearch.filter(field => {
                                const searchTerm = query.toLowerCase();
                                return (
                                  // Handle field/product name variations
                                  field.product_name?.toLowerCase().includes(searchTerm) ||
                                  field.productName?.toLowerCase().includes(searchTerm) ||
                                  field.name?.toLowerCase().includes(searchTerm) ||
                                  // Handle categories
                                  field.category?.toLowerCase().includes(searchTerm) ||
                                  field.subcategory?.toLowerCase().includes(searchTerm) ||
                                  // Handle farmer/owner
                                  field.farmer?.toLowerCase().includes(searchTerm) ||
                                  field.owner?.toLowerCase().includes(searchTerm) ||
                                  // Handle descriptions
                                  field.description?.toLowerCase().includes(searchTerm) ||
                                  // Handle locations
                                  field.location?.toLowerCase().includes(searchTerm) ||
                                  // Handle farm name if available
                                  field.farm_name?.toLowerCase().includes(searchTerm) ||
                                  field.farmName?.toLowerCase().includes(searchTerm)
                                );
                              });
                              setFilteredFields(filtered.slice(0, 5)); // Limit to 5 suggestions
                              setSearchAnchorEl(e.currentTarget.parentElement);
                            } else {
                              // If no search query, clear suggestions
                              setFilteredFields([]);
                              setSearchAnchorEl(null);
                            }
                            
                            if (onSearchChange) {
                              onSearchChange(query);
                            }
                          }}
                          onFocus={(e) => {
                            if (searchQuery.trim() && filteredFields.length > 0) {
                              setSearchAnchorEl(e.currentTarget.parentElement);
                            }
                          }}
                          sx={{ flex: 1, fontSize: '14px', }}
                        />
                      </Box>
                    </Box>
                  )}
                </Box>
              )}
              
              {/* Desktop Search Bar */}
              {!isMobile && (
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    backgroundColor: 'rgba(0,0,0,0.04)',
                    borderRadius: 20,
                    px: 2,
                    py: 0.5,
                    minWidth: '220px',
                    position: 'relative'
                  }}
                >
                {!isMobile && <Search sx={{ color: 'grey.500', mr: 1, fontSize: '20px' }} />}
                <InputBase
                  placeholder="Search fields, crops..."
                  value={searchQuery}
                  onChange={(e) => {
                    const query = e.target.value;
                    setSearchQuery(query);
                    
                    if (query.trim()) {
                      // First apply filters, then search within filtered results
                      let fieldsToSearch = applyFilters(fields);
                      
                      // Filter fields based on search query
                      const filtered = fieldsToSearch.filter(field => {
                        const searchTerm = query.toLowerCase();
                        return (
                          // Handle field/product name variations
                          field.product_name?.toLowerCase().includes(searchTerm) ||
                          field.productName?.toLowerCase().includes(searchTerm) ||
                          field.name?.toLowerCase().includes(searchTerm) ||
                          // Handle categories
                          field.category?.toLowerCase().includes(searchTerm) ||
                          field.subcategory?.toLowerCase().includes(searchTerm) ||
                          // Handle farmer/owner
                          field.farmer?.toLowerCase().includes(searchTerm) ||
                          field.owner?.toLowerCase().includes(searchTerm) ||
                          // Handle descriptions
                          field.description?.toLowerCase().includes(searchTerm) ||
                          // Handle locations
                          field.location?.toLowerCase().includes(searchTerm) ||
                          // Handle farm name if available
                          field.farm_name?.toLowerCase().includes(searchTerm) ||
                          field.farmName?.toLowerCase().includes(searchTerm)
                        );
                      });
                      setFilteredFields(filtered.slice(0, 5)); // Limit to 5 suggestions
                      setSearchAnchorEl(e.currentTarget.parentElement);
                    } else {
                      // If no search query, clear suggestions
                      setFilteredFields([]);
                      setSearchAnchorEl(null);
                    }
                    
                    if (onSearchChange) {
                      onSearchChange(query);
                    }
                  }}
                  onFocus={(e) => {
                    if (searchQuery.trim() && filteredFields.length > 0) {
                      setSearchAnchorEl(e.currentTarget.parentElement);
                    }
                  }}
                  sx={{ flex: 1, fontSize: '14px' }}
                />
                </Box>
              )}
            </Box>

            {/* Filter Icon */}
              <Badge 
                badgeContent={activeFilters.categories.length + activeFilters.products.length}
                color="primary"
                invisible={activeFilters.categories.length + activeFilters.products.length === 0}
                sx={{
                  '& .MuiBadge-badge': {
                    fontSize: '0.6rem',
                    height: 16,
                    minWidth: 16,
                  }
                }}
              >
                <IconButton
                  color="inherit"
                  onClick={(e) => setFilterAnchorEl(e.currentTarget)}
                  size={isMobile ? "small" : "medium"}
                  sx={{ 
                    backgroundColor: 'rgba(0,0,0,0.04)',
                    '&:hover': { backgroundColor: 'rgba(0,0,0,0.08)' },
                    ...(filterAnchorEl && {
                      backgroundColor: 'rgba(76, 175, 80, 0.1)',
                      color: 'primary.main'
                    }),
                    ...(activeFilters.categories.length + activeFilters.products.length > 0 && {
                      backgroundColor: 'rgba(76, 175, 80, 0.1)',
                      color: 'primary.main'
                    }),
                    '& .MuiSvgIcon-root': {
                      fontSize: isMobile ? '18px' : '24px'
                    }
                  }}
                >
                  <Tune />
                </IconButton>
              </Badge>

              {/* Create Farm Button - Only show for farmers */}
              {userType === 'farmer' && (
                <Tooltip title="Create New Farm">
                  <IconButton
                    color="inherit"
                    onClick={onCreateFarm}
                    size={isMobile ? "small" : "medium"}
                    sx={{ 
                      backgroundColor: 'rgba(33, 150, 243, 0.1)',
                      color: '#2196F3',
                      '&:hover': { 
                        backgroundColor: 'rgba(33, 150, 243, 0.2)',
                        transform: 'scale(1.05)'
                      },
                      transition: 'all 0.2s ease-in-out',
                      border: '1px solid rgba(33, 150, 243, 0.3)',
                      '& .MuiSvgIcon-root': {
                        fontSize: isMobile ? '18px' : '24px'
                      }
                    }}
                  >
                    <HomeWork />
                  </IconButton>
                </Tooltip>
              )}

              {/* Create Field Button - Only show for farmers */}
              {userType === 'farmer' && (
                <Tooltip title="Create New Field">
                  <IconButton
                    color="inherit"
                    onClick={onCreateField}
                    size={isMobile ? "small" : "medium"}
                    sx={{ 
                      backgroundColor: 'rgba(76, 175, 80, 0.1)',
                      color: '#4CAF50',
                      '&:hover': { 
                        backgroundColor: 'rgba(76, 175, 80, 0.2)',
                        transform: 'scale(1.05)'
                      },
                      transition: 'all 0.2s ease-in-out',
                      border: '1px solid rgba(76, 175, 80, 0.3)',
                      '& .MuiSvgIcon-root': {
                        fontSize: isMobile ? '18px' : '24px'
                      }
                    }}
                  >
                    <Add />
                  </IconButton>
                </Tooltip>
              )}

              {/* Farmer Coins */}
              <Tooltip 
                title={
                  <Box sx={{ textAlign: 'center', py: 0.3 }}>
                    <Typography variant="caption" sx={{ fontWeight: 600, mb: 0.3, fontSize: '11px' }}>
                      Farmer Coins Balance
                    </Typography>
                    <Typography variant="caption" sx={{ display: 'block', mb: 0.3, fontSize: '10px' }}>
                      1 Farmer Coin = $100
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'success.light', fontSize: '10px' }}>
                      You have {userCoins.toLocaleString()} coins = ${(userCoins * 100).toLocaleString()}
                    </Typography>
                  </Box>
                }
                arrow
                placement="bottom"
                componentsProps={{
                  tooltip: {
                    sx: {
                      maxWidth: 180,
                      fontSize: '10px',
                      p: 1
                    }
                  }
                }}
              >
                <Chip
                  icon={<span style={{ fontSize: isMobile ? '12px' : '14px' }}>🪙</span>}
                  label={userCoins.toLocaleString()}
                  variant="outlined"
                  size={isMobile ? "small" : "medium"}
                  sx={{ 
                    fontWeight: 'bold',
                    borderColor: '#FF9800',
                    color: '#F57C00',
                    backgroundColor: 'rgba(255, 152, 0, 0.1)',
                    cursor: 'pointer',
                    height: isMobile ? 24 : 32,
                    '& .MuiChip-label': {
                      fontSize: isMobile ? '11px' : '12px',
                      px: isMobile ? 0.5 : 1
                    },
                    '& .MuiChip-icon': {
                      marginLeft: isMobile ? '4px' : '8px',
                      marginRight: isMobile ? '-2px' : '-6px'
                    },
                    '&:hover': {
                      backgroundColor: 'rgba(255, 152, 0, 0.2)',
                      borderColor: '#F57C00',
                    }
                  }}
                />
              </Tooltip>

              {/* Profile */}
              {!isMobile && (
                <Avatar 
                  sx={{ 
                    width: 36, 
                    height: 36, 
                    bgcolor: 'primary.main',
                    fontSize: '14px'
                  }}
                >
                  {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                </Avatar>
              )}
            </Box>
          </Toolbar>
      </AppBar>

      {/* Collapsible Side Menu */}
      <Drawer
        anchor="left"
        open={drawerOpen}
        onClose={toggleDrawer}
        sx={{
          '& .MuiDrawer-paper': {
            width: isMobile ? 220 : 280,
            boxSizing: 'border-box',
            backgroundColor: 'background.paper',
            pt: 8, // Account for fixed header
          },
        }}
      >
        <Box sx={{ p: isMobile ? 1.5 : 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: isMobile ? 1.5 : 2 }}>
            <Typography 
              variant="h6" 
              sx={{ 
                fontWeight: 'bold',
                fontSize: isMobile ? '1.1rem' : '1.25rem'
              }}
            >
              🌱 ShareCrop
            </Typography>
            <IconButton onClick={toggleDrawer} size="small">
              <Close />
            </IconButton>
          </Box>
          
          <Box sx={{ display: 'flex', alignItems: 'center', mb: isMobile ? 1.5 : 2 }}>
            <Avatar sx={{ 
              mr: isMobile ? 1.5 : 2, 
              bgcolor: 'primary.main',
              width: isMobile ? 36 : 40,
              height: isMobile ? 36 : 40,
              fontSize: isMobile ? '0.9rem' : '1rem'
            }}>
              {user?.name?.charAt(0)?.toUpperCase() || 'U'}
            </Avatar>
            <Box sx={{ minWidth: 0, flex: 1 }}>
              <Typography 
                variant="body1" 
                sx={{ 
                  fontWeight: 'bold',
                  fontSize: isMobile ? '0.9rem' : '1rem',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                }}
              >
                {user?.name || 'User'}
              </Typography>
              <Chip
                label={user?.user_type || 'User'}
                size="small"
                color={user?.user_type === 'farmer' ? 'primary' : 'secondary'}
                sx={{ 
                  textTransform: 'capitalize',
                  fontSize: isMobile ? '0.7rem' : '0.75rem',
                  height: isMobile ? 20 : 24
                }}
              />
            </Box>
          </Box>
        </Box>

        <Divider />

        <List sx={{ py: isMobile ? 0.5 : 1 }}>
          {menuItems.map((item) => (
            <ListItem
              button
              key={item.text}
              onClick={() => handleNavigation(item.path)}
              selected={location.pathname === item.path}
              sx={{
                py: isMobile ? 0.5 : 1,
                px: isMobile ? 1.5 : 2,
                minHeight: isMobile ? 40 : 48,
                '&.Mui-selected': {
                  backgroundColor: 'primary.light',
                  color: 'primary.main',
                  '& .MuiListItemIcon-root': {
                    color: 'primary.main',
                  },
                },
                '&.Mui-selected:hover': {
                  backgroundColor: 'primary.light',
                },
              }}
            >
              <ListItemIcon sx={{ 
                color: 'inherit',
                minWidth: isMobile ? 32 : 40,
                '& svg': {
                  fontSize: isMobile ? '1.2rem' : '1.5rem'
                }
              }}>
                {item.icon}
              </ListItemIcon>
              <ListItemText 
                primary={item.text}
                primaryTypographyProps={{
                  fontSize: isMobile ? '0.85rem' : '1rem',
                  fontWeight: location.pathname === item.path ? 600 : 400
                }}
              />
            </ListItem>
          ))}
        </List>

        <Divider />

        <List sx={{ py: isMobile ? 0.5 : 1 }}>
          <ListItem 
            button 
            onClick={handleLogout}
            sx={{
              py: isMobile ? 0.5 : 1,
              px: isMobile ? 1.5 : 2,
              minHeight: isMobile ? 40 : 48,
            }}
          >
            <ListItemIcon sx={{ 
              minWidth: isMobile ? 32 : 40,
              '& svg': {
                fontSize: isMobile ? '1.2rem' : '1.5rem'
              }
            }}>
              <ExitToApp />
            </ListItemIcon>
            <ListItemText 
              primary="Logout"
              primaryTypographyProps={{
                fontSize: isMobile ? '0.85rem' : '1rem',
                fontWeight: 400
              }}
            />
          </ListItem>
        </List>
      </Drawer>

      {/* Search Dropdown */}
      <Popper
        open={Boolean(searchAnchorEl) && filteredFields.length > 0}
        anchorEl={searchAnchorEl}
        placement="bottom-start"
        modifiers={[
          {
            name: 'offset',
            options: {
              offset: [0, 4],
            },
          },
        ]}
        sx={{ 
          zIndex: 1400, 
          width: Math.max(searchAnchorEl?.offsetWidth || 280, 280),
          ...(isMobile && {
            width: '260px',
          })
        }}
      >
        <ClickAwayListener onClickAway={() => setSearchAnchorEl(null)}>
          <Paper
            sx={{
              mt: 0.5,
              maxHeight: 'none',
              overflow: 'visible',
              boxShadow: '0 2px 12px rgba(0,0,0,0.1)',
              border: '1px solid rgba(0,0,0,0.08)',
              borderRadius: 2,
              ml: -2,
            }}
          >
            <MenuList sx={{ py: 0.5, }}>
              {filteredFields.map((field) => (
                <MenuItem
                  key={field.id}
                  onClick={() => {
                    if (onFarmSelect) {
                      onFarmSelect(field);
                    }
                    const displayName = field.product_name || field.productName || field.name;
                    setSearchQuery(displayName);
                    setSearchAnchorEl(null);
                    setFilteredFields([]);
                  }}
                  sx={{
                      flexDirection: 'column',
                      alignItems: 'flex-start',
                      py: isMobile ? 0.6 : 0.8,
                      px: isMobile ? 1.5 : 2,
                      minHeight: 'auto',
                      width: '100%',
                      '&:hover': {
                        backgroundColor: 'rgba(46, 125, 50, 0.04)',
                      },
                      '&:not(:last-child)': {
                        borderBottom: '1px solid rgba(0,0,0,0.08)',
                      },
                    }}
                >
                  <Typography 
                    variant="body2" 
                    sx={{ 
                      fontWeight: 500,
                      fontSize: isMobile ? '0.7rem' : '0.8rem',
                      color: 'text.primary',
                      mb: 0.2,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {field.product_name || field.productName || field.name}
                  </Typography>
                  <Typography 
                    variant="caption" 
                    sx={{
                      fontSize: isMobile ? '0.6rem' : '0.7rem',
                      color: 'text.secondary',
                      mb: 0.2,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {field.farmer || field.owner} • {field.location}
                  </Typography>
                  <Typography 
                    variant="caption" 
                    sx={{
                      fontSize: isMobile ? '0.55rem' : '0.65rem',
                      color: 'success.main',
                      fontWeight: 400,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {field.category || field.subcategory}
                  </Typography>
                </MenuItem>
              ))}
            </MenuList>
          </Paper>
        </ClickAwayListener>
      </Popper>

      {/* Filter Menu */}
      <Popper
        open={Boolean(filterAnchorEl)}
        anchorEl={filterAnchorEl}
        placement="bottom-end"
        modifiers={[
          {
            name: 'offset',
            options: {
              offset: [110, 5],
            },
          },
        ]}
        sx={{ zIndex: 1300 }}
      >
        <ClickAwayListener onClickAway={() => setFilterAnchorEl(null)}>
          <Paper
            elevation={8}
            sx={{
              width: 260,
              maxHeight: 400,
              overflow: 'auto',
              border: '1px solid rgba(0,0,0,0.12)',
              borderRadius: 2,
              mt: 0.5,
            }}
          >
            <Box sx={{ p: 2 }}>
              <Typography variant="subtitle1" sx={{ mb: 1.5, fontWeight: 600, fontSize: '0.8rem', color: 'text.primary' }}>
                Filter Farms
              </Typography>
              <Divider sx={{ mb: 2 }} />
              
              {/* Categories Filter */}
              <Typography variant="body2" sx={{ mb: 1, fontWeight: 500, fontSize: '0.7rem', color: 'text.secondary' }}>
                Categories
              </Typography>
              <FormGroup sx={{ mb: 1.5 }}>
                {['Organic', 'Conventional', 'Hydroponic', 'Greenhouse'].map((category) => (
                  <FormControlLabel
                    key={category}
                    control={
                      <Checkbox
                        size="small"
                        checked={activeFilters.categories.includes(category)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setActiveFilters(prev => ({
                              ...prev,
                              categories: [...prev.categories, category]
                            }));
                          } else {
                            setActiveFilters(prev => ({
                              ...prev,
                              categories: prev.categories.filter(c => c !== category)
                            }));
                          }
                        }}
                      />
                    }
                    label={category}
                    sx={{ 
                      '& .MuiFormControlLabel-label': { 
                        fontSize: '0.65rem',
                        color: 'text.primary'
                      },
                      '& .MuiCheckbox-root': {
                        color: 'rgba(76, 175, 80, 0.6)',
                        '&.Mui-checked': {
                          color: '#4CAF50'
                        }
                      }
                    }}
                  />
                ))}
              </FormGroup>
              <Divider sx={{ mb: 1.5 }} />

              {/* Products Filter */}
              <Typography variant="body2" sx={{ mb: 1, fontWeight: 500, fontSize: '0.7rem', color: 'text.secondary' }}>
                Products
              </Typography>
              <FormGroup sx={{ mb: 2 }}>
                {['Vegetables', 'Fruits', 'Grains', 'Herbs', 'Dairy', 'Livestock'].map((product) => (
                  <FormControlLabel
                    key={product}
                    control={
                      <Checkbox
                        size="small"
                        checked={activeFilters.products.includes(product)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setActiveFilters(prev => ({
                              ...prev,
                              products: [...prev.products, product]
                            }));
                          } else {
                            setActiveFilters(prev => ({
                              ...prev,
                              products: prev.products.filter(p => p !== product)
                            }));
                          }
                        }}
                      />
                    }
                    label={product}
                    sx={{ 
                       '& .MuiFormControlLabel-label': { 
                         fontSize: '0.65rem',
                         color: 'text.primary'
                       },
                       '& .MuiCheckbox-root': {
                         color: 'rgba(76, 175, 80, 0.6)',
                         '&.Mui-checked': {
                           color: '#4CAF50'
                         }
                       }
                     }}
                  />
                ))}
              </FormGroup>

              {/* Action Buttons */}
              <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
                <Button
                  variant="outlined"
                  size="small"
                  onClick={handleFilterClear}
                  sx={{ flex: 1 }}
                >
                  Clear All
                </Button>
                <Button
                  variant="contained"
                  size="small"
                  onClick={handleFilterApply}
                  sx={{ flex: 1 }}
                >
                  Apply
                </Button>
              </Box>
            </Box>
          </Paper>
        </ClickAwayListener>
      </Popper>
    </>
  );
});

export default EnhancedHeader;