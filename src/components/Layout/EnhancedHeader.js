import React, { useState, useEffect, forwardRef, useImperativeHandle, useRef } from 'react';
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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
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
  ExpandMore,
  ReportProblem
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import coinService from '../../services/coinService';
import { orderService } from '../../services/orders';
import { getProductIcon } from '../../utils/productIcons';

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

const EnhancedHeader = forwardRef(({ user, onLogout, onSearchChange, onFilterApply, fields = [], onFarmSelect, farmerCoins = 12500, onCreateField, onCreateFarm, userType = 'farmer', onMenuClick }, ref) => {
  const navigate = useNavigate();
  const location = useLocation();
  const isMobile = useIsMobile();
  const isAdmin = userType === 'admin';
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchAnchorEl, setSearchAnchorEl] = useState(null);
  const [filteredFields, setFilteredFields] = useState([]);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [filterAnchorEl, setFilterAnchorEl] = useState(null);
  const [activeFilters, setActiveFilters] = useState({
    categories: [],
    subcategories: [],
    locations: []
  });
  const [expanded, setExpanded] = useState({});
  const [userCoins, setUserCoins] = useState(12500);
  const [pickupReadyCount, setPickupReadyCount] = useState(0);
  const [pickupPanelOpen, setPickupPanelOpen] = useState(false);
  const [pickupReadyList, setPickupReadyList] = useState([]);

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
  const canonicalize = (raw) => {
    const s = (raw || '').toString().trim().toLowerCase();
    const slug = s.replace(/[\s_]+/g, '-');
    const compact = slug.replace(/-/g, '');
    const synonyms = {
      greenapple: 'green-apple',
      redapple: 'red-apple',
      lemons: 'lemon',
      lemon: 'lemon',
      tangarine: 'tangerine',
      tangerines: 'tangerine',
      corns: 'corn',
      corn: 'corn',
      strawberries: 'strawberry',
      strawberry: 'strawberry',
      tomatoes: 'tomato',
      tomato: 'tomato',
      eggplants: 'eggplant',
      eggplant: 'eggplant',
      peaches: 'peach',
      peach: 'peach',
      watermelons: 'watermelon',
      watermelon: 'watermelon',
      mangoes: 'mango',
      mango: 'mango',
      avocados: 'avocado',
      avocado: 'avocado',
      grapes: 'grape',
      grape: 'grape',
      bananas: 'banana',
      banana: 'banana'
    };
    const syn = synonyms[compact] || slug;
    return syn.replace(/-/g, ' ');
  };
  const applyFilters = (fieldsToFilter) => {
    let filtered = fieldsToFilter;

    const hasSubs = activeFilters.subcategories.length > 0;
    const hasCats = activeFilters.categories.length > 0;

    if (hasSubs) {
      filtered = filtered.filter(field => {
        const prodRaw = field.subcategory || field.product_name || field.productName || '';
        const sub = canonicalize(prodRaw);
        return activeFilters.subcategories.some(s => {
          const key = canonicalize(s);
          return sub === key || sub.includes(key);
        });
      });
    } else if (hasCats) {
      filtered = filtered.filter(field => {
        const cat = canonicalize(field.category);
        const prodRaw = field.product_name || field.productName || field.subcategory || '';
        const sub = canonicalize(prodRaw);
        return activeFilters.categories.some(category => {
          const c = canonicalize(category);
          return cat === c || sub === c || cat.includes(c) || sub.includes(c);
        });
      });
    }

    return filtered;
  };

  const handleFilterApply = () => {
    const filtered = applyFilters(fields);
    setFilteredFields(filtered);
    if (onSearchChange) {
      onSearchChange(searchQuery, filtered);
    }
    if (typeof onFilterApply === 'function') {
      onFilterApply({
        categories: activeFilters.categories.slice(),
        subcategories: activeFilters.subcategories.slice(),
      });
    }
    setFilterAnchorEl(null);
  };

  const isHarvestToday = (f) => {
    const today = new Date();
    const toDate = (val) => {
      if (!val) return null;
      if (typeof val === 'string') {
        const s = val.trim();
        if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
          const d0 = new Date(`${s}T00:00:00`);
          if (!isNaN(d0.getTime())) return d0;
        }
      }
      const d = new Date(val);
      if (!isNaN(d.getTime())) return d;
      const s = String(val);
      const parts = s.split(/[-/\s]/);
      if (parts.length >= 3) {
        const tryStr = `${parts[0]} ${parts[1]} ${parts[2]}`;
        const d2 = new Date(tryStr);
        if (!isNaN(d2.getTime())) return d2;
      }
      return null;
    };
    const sameDay = (a, b) => a && b && a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
    const list = Array.isArray(f?.harvestDates) ? f.harvestDates : Array.isArray(f?.harvest_dates) ? f.harvest_dates : [];
    for (const hd of list) {
      const d = toDate(hd?.date || hd);
      if (sameDay(d, today)) return true;
    }
    const single = f?.harvest_date || f?.harvestDate;
    const d = toDate(single);
    return sameDay(d, today);
  };

  const hasPickupShipping = (f) => {
    const normalize = (s) => String(s || '').toLowerCase().replace(/[^a-z]/g, '');
    const list = Array.isArray(f?.shipping_modes) ? f.shipping_modes : [];
    const lower = list.map(m => normalize(m));
    const single = normalize(f?.shipping_option || f?.mode_of_shipping || f?.shipping_method || '');
    const hasArrayInfo = lower.length > 0;
    const hasSingleInfo = single.length > 0;
    const hasPickupWord = (v) => v.includes('pickup') || v.includes('pick') || v.includes('selfpickup') || v.includes('selfpick');
    const hasDeliveryWord = (v) => v.includes('delivery');

    if (hasSingleInfo) {
      const singleHasPickup = hasPickupWord(single) || single.includes('both');
      const singleHasDelivery = hasDeliveryWord(single);
      if (singleHasPickup) return true;
      if (singleHasDelivery && !singleHasPickup) return false;
      return false;
    }
    if (hasArrayInfo) {
      const arrayHasPickup = lower.some(v => hasPickupWord(v) || v.includes('both')) || (lower.some(hasPickupWord) && lower.some(hasDeliveryWord));
      const arrayHasDeliveryOnly = lower.some(hasDeliveryWord) && !arrayHasPickup;
      if (arrayHasPickup) return true;
      if (arrayHasDeliveryOnly) return false;
      return false;
    }
    return f?.shipping_pickup === true;
  };

  useEffect(() => {
    const loadPickupReadyFromOrders = async () => {
      try {
        if (!user || !user.id) { setPickupReadyCount(0); setPickupReadyList([]); return; }
        const res = await orderService.getBuyerOrdersWithFields(user.id);
        const orders = Array.isArray(res?.data) ? res.data : (res?.data?.orders || []);
        const byField = new Map();
        orders.forEach((o) => {
          const fid = o.field_id || o.fieldId || o.field?.id;
          if (!fid) return;
          const prev = byField.get(fid) || { created_at: null, selected_harvest_date: null, mode: null, purchased: false, field: o.field };
          const createdAt = o.created_at || o.createdAt || null;
          const prevTs = prev.created_at ? new Date(prev.created_at).getTime() : -Infinity;
          const curTs = createdAt ? new Date(createdAt).getTime() : -Infinity;
          const m = (o.mode_of_shipping || o.shipping_method || '').trim().toLowerCase();
          const canon = m === 'pickup' ? 'Pickup' : (m === 'delivery' ? 'Delivery' : (m ? m : null));
          if (curTs >= prevTs) {
            const purchased = (o.purchased === true)
              || (() => { const q = o.quantity ?? o.area_rented ?? o.area; const v = typeof q === 'string' ? parseFloat(q) : q; return Number.isFinite(v) && v > 0; })()
              || (() => { const s = String(o.status || '').toLowerCase(); return s === 'active' || s === 'pending'; })();
            byField.set(fid, { created_at: createdAt, selected_harvest_date: o.selected_harvest_date || null, mode: canon, purchased, field: o.field });
          }
        });
        const withinGrace = (val, days = 4) => {
          if (!val) return false;
          const today = new Date();
          const d = new Date(val);
          if (isNaN(d.getTime())) return false;
          const t0 = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
          const h0 = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
          const diffDays = Math.round((h0 - t0) / (24 * 60 * 60 * 1000));
          return diffDays <= 0 && diffDays >= -days;
        };
        const getModes = (f, last) => {
          const arr = [];
          if (last?.mode) arr.push(last.mode);
          if (f?.shipping_pickup) arr.push('Pickup');
          if (f?.shipping_delivery) arr.push('Delivery');
          const single = f?.shipping_option || f?.mode_of_shipping || f?.shipping_method || '';
          const s = String(single).trim().toLowerCase();
          if (s === 'pickup') arr.push('Pickup'); else if (s === 'delivery') arr.push('Delivery'); else if (s.includes('both')) arr.push('Delivery');
          const set = new Set();
          return arr.filter(m => { const k = String(m || '').toLowerCase(); if (set.has(k)) return false; set.add(k); return true; });
        };
        const toDate = (val) => {
          if (!val) return null;
          if (typeof val === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(val.trim())) {
            const d0 = new Date(`${val}T00:00:00`);
            if (!isNaN(d0.getTime())) return d0;
          }
          const d = new Date(val);
          return isNaN(d.getTime()) ? null : d;
        };
        const ready = Array.isArray(fields) ? fields.filter((f) => {
          const last = byField.get(f.id);
          if (!last) return false;
          if (last.purchased !== true) return false;
          const modes = getModes(f, last).map(m => String(m || '').toLowerCase());
          const mode = modes.includes('pickup') ? 'pickup' : (modes.includes('delivery') ? 'delivery' : null);
          if (mode !== 'pickup') return false;
          return withinGrace(last.selected_harvest_date, 4);
        }) : [];
        setPickupReadyCount(ready.length);
        setPickupReadyList(ready);
      } catch {
        setPickupReadyCount(0);
        setPickupReadyList([]);
      }
    };
    loadPickupReadyFromOrders();
  }, [fields, user]);

  const handleFilterClear = () => {
    setActiveFilters({ categories: [], subcategories: [], locations: [] });
    setFilteredFields(fields);
    if (onSearchChange) {
      onSearchChange(searchQuery, fields);
    }
    if (typeof onFilterApply === 'function') {
      onFilterApply({ categories: [], subcategories: [] });
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
    { text: 'Complaints', icon: <ReportProblem />, path: '/farmer/complaints' },
  ];

  const buyerMenuItems = [
    { text: 'Rented Fields', icon: <Landscape />, path: '/buyer/rented-fields' },
    { text: 'My Orders', icon: <History />, path: '/buyer/orders' },
    { text: 'Profile', icon: <Person />, path: '/buyer/profile' },
    { text: 'Messages', icon: <Message />, path: '/buyer/messages' },
    { text: 'Change Currency', icon: <CurrencyExchange />, path: '/buyer/currency' },
    { text: 'Settings', icon: <Settings />, path: '/buyer/settings' },
    { text: 'Complaints', icon: <ReportProblem />, path: '/buyer/complaints' },
  ];

  const menuItems = userType === 'farmer' ? farmerMenuItems : buyerMenuItems;

  const appBarRef = useRef(null);

  useEffect(() => {
    const el = appBarRef.current;
    if (!el) return;
    const update = () => {
      const h = el.offsetHeight || 0;
      document.documentElement.style.setProperty('--app-header-height', `${h}px`);
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    window.addEventListener('resize', update);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', update);
    };
  }, [pickupReadyCount, isMobile]);

  return (
    <>
      <AppBar 
        ref={appBarRef}
        sx={{ 
          backgroundColor: 'rgba(255, 255, 255, 0.9)',
          backdropFilter: 'blur(10px)',
          color: 'text.primary',
          boxShadow: '0 2px 20px rgba(0,0,0,0.1)',
          borderBottom: '1px solid rgba(0,0,0,0.05)',
          zIndex: 1300,
        }}
      >
        {pickupReadyCount > 0 && (
          <Box
            sx={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'linear-gradient(90deg, rgba(255,235,59,0.18), rgba(255,152,0,0.2))',
              borderBottom: '1px solid rgba(255,152,0,0.35)',
              px: 2,
              py: 0.75,
              cursor: 'pointer'
            }}
            onClick={() => setPickupPanelOpen(true)}
          >
            <style>{`@keyframes popPulse{0%{transform:scale(1)}50%{transform:scale(1.07)}100%{transform:scale(1)}}`}</style>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1.5,
                fontWeight: 700,
                color: '#F57C00',
                textTransform: 'none',
                letterSpacing: '0.02em',
                animation: 'popPulse 1200ms ease-in-out infinite',
                willChange: 'transform',
                transform: 'translateZ(0)',
                backfaceVisibility: 'hidden',
                whiteSpace: 'nowrap',
                lineHeight: '20px',
                height: '20px',
                transformOrigin: 'center',
                contain: 'layout paint style',
              }}
            >
              <span style={{ fontSize: '14px' }}>✅</span>
              <span style={{ fontSize: '14px' }}>Your Product is ready for pickup</span>
            </Box>
          </Box>
        )}
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
              onClick={onMenuClick ? onMenuClick : toggleDrawer}
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
            {!isAdmin && (
              <>
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
                                  let fieldsToSearch = applyFilters(fields);
                                  
                                  const filtered = fieldsToSearch.filter(field => {
                                    const searchTerm = query.toLowerCase();
                                    return (
                                      field.product_name?.toLowerCase().includes(searchTerm) ||
                                      field.productName?.toLowerCase().includes(searchTerm) ||
                                      field.name?.toLowerCase().includes(searchTerm) ||
                                      field.category?.toLowerCase().includes(searchTerm) ||
                                      field.subcategory?.toLowerCase().includes(searchTerm) ||
                                      field.farmer?.toLowerCase().includes(searchTerm) ||
                                      field.owner?.toLowerCase().includes(searchTerm) ||
                                      field.description?.toLowerCase().includes(searchTerm) ||
                                      field.location?.toLowerCase().includes(searchTerm) ||
                                      field.farm_name?.toLowerCase().includes(searchTerm) ||
                                      field.farmName?.toLowerCase().includes(searchTerm)
                                    );
                                  });
                                  setFilteredFields(filtered.slice(0, 5));
                                  setSearchAnchorEl(e.currentTarget.parentElement);
                                } else {
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
                          let fieldsToSearch = applyFilters(fields);
                          
                          const filtered = fieldsToSearch.filter(field => {
                            const searchTerm = query.toLowerCase();
                            return (
                              field.product_name?.toLowerCase().includes(searchTerm) ||
                              field.productName?.toLowerCase().includes(searchTerm) ||
                              field.name?.toLowerCase().includes(searchTerm) ||
                              field.category?.toLowerCase().includes(searchTerm) ||
                              field.subcategory?.toLowerCase().includes(searchTerm) ||
                              field.farmer?.toLowerCase().includes(searchTerm) ||
                              field.owner?.toLowerCase().includes(searchTerm) ||
                              field.description?.toLowerCase().includes(searchTerm) ||
                              field.location?.toLowerCase().includes(searchTerm) ||
                              field.farm_name?.toLowerCase().includes(searchTerm) ||
                              field.farmName?.toLowerCase().includes(searchTerm)
                            );
                          });
                          setFilteredFields(filtered.slice(0, 5));
                          setSearchAnchorEl(e.currentTarget.parentElement);
                        } else {
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
                  badgeContent={activeFilters.categories.length + activeFilters.subcategories.length}
                  color="primary"
                  invisible={activeFilters.categories.length + activeFilters.subcategories.length === 0}
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
                      ...(activeFilters.categories.length + activeFilters.subcategories.length > 0 && {
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
              </>
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
              {!isAdmin && (
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
              )}

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

      <Dialog open={pickupPanelOpen} onClose={() => setPickupPanelOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle sx={{ fontWeight: 700 }}>Ready for Pickup</DialogTitle>
        <DialogContent dividers>
          <List>
            {pickupReadyList.map((item) => (
              <ListItem
                key={`pickup-${item.id}`}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1.5,
                }}
              >
                <Avatar src={getProductIcon(item.subcategory || item.category)} sx={{ bgcolor: 'transparent' }} />
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography variant="body1" sx={{ fontWeight: 600 }}>{item.name || item.product_name || 'Product'}</Typography>
                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>{item.location || 'Location'}</Typography>
                </Box>
                <Button
                  variant="outlined"
                  color="warning"
                  onClick={() => {
                    if (onFarmSelect) onFarmSelect(item);
                    setTimeout(() => setPickupPanelOpen(false), 450);
                  }}
                >
                  View on Map
                </Button>
              </ListItem>
            ))}
            {pickupReadyList.length === 0 && (
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>No items ready today.</Typography>
            )}
          </List>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPickupPanelOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Collapsible Side Menu */}
      {userType !== 'admin' && (
      <Drawer
        anchor="left"
        open={drawerOpen}
        onClose={toggleDrawer}
        sx={{
          '& .MuiDrawer-paper': {
            width: isMobile ? 220 : 280,
            boxSizing: 'border-box',
            backgroundColor: 'background.paper',
            top: 'var(--app-header-height)',
            height: 'calc(100% - var(--app-header-height))',
            pt: 2,
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
                {user?.name?.split(' ')[0] || user?.name || 'User'}
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
      )}

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
              
              {/* Category and Subcategory Filters */}
              <Typography variant="body2" sx={{ mb: 1, fontWeight: 500, fontSize: '0.7rem', color: 'text.secondary' }}>
                Categories
              </Typography>
              {(() => {
                const CATEGORY_OPTIONS = {
                  'Beverages': ['Beer', 'Coffee', 'Juice', 'Milk', 'Soda', 'Teabags', 'Wine'],
                  'Bread & Bakery': ['Bagels', 'Bread', 'Cookies', 'Muffins', 'Pies', 'Tortillas'],
                  'Canned Goods': ['Fruit', 'Pasta Sauce', 'Soup', 'Vegetables'],
                  'Dairy': ['Butter', 'Cheese', 'Eggs', 'Milk'],
                  'Deli': ['Cheeses', 'Salami'],
                  'Fish & Seafood': ['Bivalves & Clams', 'Crab', 'Fish', 'Lobster', 'Octopus & Squid', 'Shrimp'],
                  'Frozen Food': ['Fish', 'Ice cream', 'Pizza', 'Potatoes', 'Ready Meals'],
                  'Fruits': ['Green Apple', 'Red Apple', 'Peach', 'Strawberry', 'Tangerine', 'Watermelon', 'Avocados', 'Mango', 'Grapes', 'Banana'],
                  'Vegetables': ['Corn', 'Eggplant', 'Lemon', 'Tomato', 'Broccoli', 'Capsicum', 'Carrot', 'Onions', 'Potatoes', 'Salad Greens'],
                  'Meat': ['Bacon', 'Chicken', 'Beef', 'Pork'],
                  'Oil': ['Coconut Oil', 'Olive Oil', 'Peanut Oil', 'Sunflower Oil'],
                  'Seeds': ['Hibiscus', 'Rice Seeds', 'Rose'],
                  'Snacks': ['Nuts', 'Popcorn', 'Pretzels']
                };
                const categories = Object.keys(CATEGORY_OPTIONS);
                const isAllSubsSelected = (category) => {
                  const subs = CATEGORY_OPTIONS[category] || [];
                  return subs.length > 0 && subs.every(s => activeFilters.subcategories.includes(s));
                };
                const isSomeSubsSelected = (category) => {
                  const subs = CATEGORY_OPTIONS[category] || [];
                  const count = subs.filter(s => activeFilters.subcategories.includes(s)).length;
                  return count > 0 && count < subs.length;
                };
                return (
                  <Box>
                    {categories.map((category) => {
                      const checkedCat = activeFilters.categories.includes(category) || isAllSubsSelected(category);
                      const indeterminateCat = !checkedCat && isSomeSubsSelected(category);
                      return (
                        <Box key={category} sx={{ mb: 1 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <FormControlLabel
                              control={
                                <Checkbox
                                  size="small"
                                  checked={checkedCat}
                                  indeterminate={indeterminateCat}
                                  onChange={(e) => {
                                    const checked = e.target.checked;
                                    setActiveFilters(prev => {
                                      const subs = CATEGORY_OPTIONS[category] || [];
                                      let categories = prev.categories;
                                      let subcategories = prev.subcategories;
                                      if (checked) {
                                        categories = categories.includes(category) ? categories : [...categories, category];
                                        const mergedSubs = new Set(subcategories);
                                        subs.forEach(s => mergedSubs.add(s));
                                        subcategories = Array.from(mergedSubs);
                                      } else {
                                        categories = categories.filter(c => c !== category);
                                        subcategories = subcategories.filter(s => !subs.includes(s));
                                      }
                                      return { ...prev, categories, subcategories };
                                    });
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
                            <IconButton size="small" onClick={() => setExpanded(prev => ({ ...prev, [category]: !prev[category] }))}>
                              <ExpandMore sx={{ transform: expanded[category] ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s ease' }} />
                            </IconButton>
                          </Box>
                          <Box sx={{ pl: 2 }}>
                            <Box sx={{ display: expanded[category] ? 'block' : 'none' }}>
                              <FormGroup>
                                {CATEGORY_OPTIONS[category].map((sub) => (
                                  <FormControlLabel
                                    key={`${category}-${sub}`}
                                    control={
                                      <Checkbox
                                        size="small"
                                        checked={activeFilters.subcategories.includes(sub)}
                                        onChange={(e) => {
                                          const checked = e.target.checked;
                                          setActiveFilters(prev => {
                                            const subs = CATEGORY_OPTIONS[category] || [];
                                            let categories = prev.categories;
                                            let subcategories = prev.subcategories;
                                            if (checked) {
                                              subcategories = subcategories.includes(sub) ? subcategories : [...subcategories, sub];
                                            } else {
                                              subcategories = subcategories.filter(s => s !== sub);
                                            }
                                            const allSelected = subs.every(s => subcategories.includes(s));
                                            if (allSelected) {
                                              categories = categories.includes(category) ? categories : [...categories, category];
                                            } else {
                                              categories = categories.filter(c => c !== category);
                                            }
                                            return { ...prev, categories, subcategories };
                                          });
                                        }}
                                      />
                                    }
                                    label={sub}
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
                            </Box>
                          </Box>
                          <Divider sx={{ my: 1 }} />
                        </Box>
                      );
                    })}
                  </Box>
                );
              })()}

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
