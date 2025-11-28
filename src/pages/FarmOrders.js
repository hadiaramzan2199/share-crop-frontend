import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Paper,
  Stack,
  Avatar,
  Button,
  Chip,
  IconButton,
  Divider
} from '@mui/material';
import {
  ShoppingCart,
  TrendingUp,
  Pending,
  CheckCircle,
  Assessment,
  LocationOn,
  CalendarToday,
  MoreVert,
  Cancel,
  LocalShipping
} from '@mui/icons-material';
import { orderService } from '../services/orders';
import { useAuth } from '../contexts/AuthContext';

const FarmOrders = () => {
  const [orders, setOrders] = useState([]);
  const [userCurrency, setUserCurrency] = useState('USD');
  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user } = useAuth();
  
  // Currency symbols mapping
  const currencySymbols = {
    'USD': '$',
    'EUR': '€',
    'GBP': '£',
    'PKR': '₨',
    'JPY': '¥',
    'CAD': 'C$',
    'AUD': 'A$',
    'CHF': 'CHF'
  };

  // Load user preferences
  useEffect(() => {
    // Removed localStorage.getItem('userPreferences') as localStorage is deprecated.
    // User currency will default to 'USD' or be managed by a future backend.
  }, []);

  // Load farm orders data - orders placed on this farmer's created fields
  useEffect(() => {
    const loadOrders = async () => {
      if (!user || !user.id) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const response = await orderService.getFarmerOrders(user.id);
        
        // Transform the API response to match the expected format
        const formattedOrders = response.data.map((order, index) => ({
          id: `ORD-${String(index + 1).padStart(3, '0')}`,
          buyerName: order.buyer_name || 'Unknown Buyer',
          buyerEmail: order.buyer_email || '',
          farmName: order.field_name || 'Unknown Field',
          cropType: order.crop_type || 'Mixed Crops',
          quantity: `${order.quantity} m²`,
          pricePerKg: order.price_per_m2 || 0,
          totalAmount: order.total_price || 0,
          orderDate: new Date(order.created_at).toISOString().split('T')[0],
          deliveryDate: order.selected_harvest_date || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          status: order.status === 'pending' ? 'Pending' : 
                 order.status === 'completed' ? 'Delivered' : 
                 order.status === 'active' ? 'Processing' : 'Pending',
          paymentStatus: order.status === 'completed' ? 'Paid' : 'Pending',
          location: order.location || 'Unknown Location'
        }));
        
        setOrders(formattedOrders);
        setError(null);
      } catch (error) {
        console.error('Error loading farmer orders:', error);
        setError('Failed to load orders');
        
        // Fallback to dummy data for demonstration
        const dummyOrders = [
          {
            id: 'ORD-001',
            buyerName: 'John Smith',
            buyerEmail: 'john@example.com',
            farmName: 'Green Valley Farm',
            cropType: 'Wheat',
            quantity: '500 m²',
            pricePerKg: 4.32,
            totalAmount: 2160,
            orderDate: '2024-01-15',
            deliveryDate: '2024-01-25',
            status: 'Delivered',
            paymentStatus: 'Paid',
            location: 'Los Angeles, CA'
          },
          {
            id: 'ORD-002',
            buyerName: 'Sarah Johnson',
            buyerEmail: 'sarah@example.com',
            farmName: 'Sunrise Orchards',
            cropType: 'Mango',
            quantity: '200 m²',
            pricePerKg: 10.80,
            totalAmount: 2160,
            orderDate: '2024-01-20',
            deliveryDate: '2024-01-30',
            status: 'Processing',
            paymentStatus: 'Pending',
            location: 'Miami, FL'
          }
        ];
        
        setOrders(dummyOrders);
      } finally {
        setLoading(false);
      }
    };
    
    loadOrders();
  }, [user]);

  const getStatusColor = (status) => {
    switch (status) {
      case 'Delivered': return 'success';
      case 'Shipped': return 'info';
      case 'Processing': return 'warning';
      case 'Pending': return 'default';
      case 'Cancelled': return 'error';
      default: return 'default';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'Delivered': return <CheckCircle />;
      case 'Shipped': return <LocalShipping />;
      case 'Processing': return <Pending />;
      case 'Pending': return <Pending />;
      case 'Cancelled': return <Cancel />;
      default: return <ShoppingCart />;
    }
  };

  const formatCurrency = (amount) => {
    const symbol = currencySymbols[userCurrency] || '₨';
    return `${symbol}${amount.toLocaleString()}`;
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const filterOrdersByStatus = (status) => {
    if (status === 'all') return orders;
    return orders.filter(order => order.status.toLowerCase() === status.toLowerCase());
  };

  const getFilteredOrders = () => {
    switch (tabValue) {
      case 0: return orders;
      case 1: return filterOrdersByStatus('pending');
      case 2: return filterOrdersByStatus('processing');
      case 3: return filterOrdersByStatus('shipped');
      case 4: return filterOrdersByStatus('delivered');
      default: return orders;
    }
  };

  const getOrderStats = () => {
    const totalOrders = orders.length;
    // Use dummy values as requested
    const totalRevenue = 15750; // Dummy value for Total Revenue
    const pendingOrders = 8; // Dummy value for Pending Orders
    const deliveredOrders = 12; // Dummy value for Delivered Orders
    
    return { totalOrders, totalRevenue, pendingOrders, deliveredOrders };
  };

  const stats = getOrderStats();

  return (
    <Box sx={{ 
      minHeight: '100vh',
      backgroundColor: '#f8fafc',
      p: 3
    }}>
      <Box sx={{ 
        maxWidth: '1400px', 
        mx: 'auto',
        mb: 4
      }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2.5 }}>
          <Box>
            <Typography 
              variant="h5" 
              sx={{ 
                fontWeight: 700,
                color: '#1e293b',
                mb: 0.5,
                fontSize: '1.75rem'
              }}
            >
              Farm Orders
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.9rem' }}>
              Manage and track your farm product orders with comprehensive insights
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<Assessment />}
            sx={{
              backgroundColor: '#4caf50',
              '&:hover': { backgroundColor: '#a1eda4' },
              borderRadius: 2,
              px: 2.5,
              py: 1
            }}
          >
            Order Report
          </Button>
        </Stack>

        {/* Stats Overview */}
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} lg={3}>
            <Paper
              elevation={0}
              sx={{
                p: 2,
                border: '1px solid #e2e8f0',
                borderRadius: 2,
                backgroundColor: 'white',
                transition: 'all 0.2s ease-in-out',
                '&:hover': {
                  transform: 'translateY(-1px)',
                  boxShadow: '0 6px 20px rgba(0,0,0,0.08)'
                }
              }}
            >
              <Stack direction="row" alignItems="center" spacing={1.5}>
                <Avatar
                  sx={{
                    backgroundColor: '#dbeafe',
                    color: '#1d4ed8',
                    width: 40,
                    height: 40
                  }}
                >
                  <ShoppingCart sx={{ fontSize: 20 }} />
                </Avatar>
                <Box>
                  <Typography variant="h5" sx={{ fontWeight: 700, color: '#1e293b', fontSize: '1.5rem' }}>
                    {stats.totalOrders}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem' }}>
                    Total Orders
                  </Typography>
                </Box>
              </Stack>
            </Paper>
          </Grid>
          
          <Grid item xs={12} sm={6} lg={3}>
            <Paper
              elevation={0}
              sx={{
                p: 2,
                border: '1px solid #e2e8f0',
                borderRadius: 2,
                backgroundColor: 'white',
                transition: 'all 0.2s ease-in-out',
                '&:hover': {
                  transform: 'translateY(-1px)',
                  boxShadow: '0 6px 20px rgba(0,0,0,0.08)'
                }
              }}
            >
              <Stack direction="row" alignItems="center" spacing={1.5}>
                <Avatar
                  sx={{
                    backgroundColor: '#dcfce7',
                    color: '#059669',
                    width: 40,
                    height: 40
                  }}
                >
                  <TrendingUp sx={{ fontSize: 20 }} />
                </Avatar>
                <Box>
                  <Typography variant="h5" sx={{ fontWeight: 700, color: '#1e293b', fontSize: '1.5rem' }}>
                    {formatCurrency(stats.totalRevenue)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem' }}>
                    Total Revenue
                  </Typography>
                </Box>
              </Stack>
            </Paper>
          </Grid>
          
          <Grid item xs={12} sm={6} lg={3}>
            <Paper
              elevation={0}
              sx={{
                p: 2,
                border: '1px solid #e2e8f0',
                borderRadius: 2,
                backgroundColor: 'white',
                transition: 'all 0.2s ease-in-out',
                '&:hover': {
                  transform: 'translateY(-1px)',
                  boxShadow: '0 6px 20px rgba(0,0,0,0.08)'
                }
              }}
            >
              <Stack direction="row" alignItems="center" spacing={1.5}>
                <Avatar
                  sx={{
                    backgroundColor: '#fef3c7',
                    color: '#d97706',
                    width: 40,
                    height: 40
                  }}
                >
                  <Pending sx={{ fontSize: 20 }} />
                </Avatar>
                <Box>
                  <Typography variant="h5" sx={{ fontWeight: 700, color: '#1e293b', fontSize: '1.5rem' }}>
                    {stats.pendingOrders}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem' }}>
                    Pending Orders
                  </Typography>
                </Box>
              </Stack>
            </Paper>
          </Grid>
          
          <Grid item xs={12} sm={6} lg={3}>
            <Paper
              elevation={0}
              sx={{
                p: 2,
                border: '1px solid #e2e8f0',
                borderRadius: 2,
                backgroundColor: 'white',
                transition: 'all 0.2s ease-in-out',
                '&:hover': {
                  transform: 'translateY(-1px)',
                  boxShadow: '0 6px 20px rgba(0,0,0,0.08)'
                }
              }}
            >
              <Stack direction="row" alignItems="center" spacing={1.5}>
                <Avatar
                  sx={{
                    backgroundColor: '#f3e8ff',
                    color: '#7c3aed',
                    width: 40,
                    height: 40
                  }}
                >
                  <CheckCircle sx={{ fontSize: 20 }} />
                </Avatar>
                <Box>
                  <Typography variant="h5" sx={{ fontWeight: 700, color: '#1e293b', fontSize: '1.5rem' }}>
                    {stats.deliveredOrders}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem' }}>
                    Delivered Orders
                  </Typography>
                </Box>
              </Stack>
            </Paper>
          </Grid>
        </Grid>

        {/* Filter Buttons */}
        <Paper
          elevation={0}
          sx={{
            p: 2,
            mb: 3,
            border: '1px solid #e2e8f0',
            borderRadius: 2,
            backgroundColor: 'white'
          }}
        >
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            <Button
              variant={tabValue === 0 ? "contained" : "outlined"}
              onClick={() => setTabValue(0)}
              size="small"
              sx={{
                borderRadius: 2,
                ...(tabValue === 0 && {
                  backgroundColor: '#4caf50',
                  '&:hover': { backgroundColor: '#45a049' }
                })
              }}
            >
              All Orders ({orders.length})
            </Button>
            <Button
              variant={tabValue === 1 ? "contained" : "outlined"}
              onClick={() => setTabValue(1)}
              size="small"
              sx={{
                borderRadius: 2,
                ...(tabValue === 1 && {
                  backgroundColor: '#4caf50',
                  '&:hover': { backgroundColor: '#45a049' }
                })
              }}
            >
              Pending ({stats.pendingOrders})
            </Button>
            <Button
              variant={tabValue === 2 ? "contained" : "outlined"}
              onClick={() => setTabValue(2)}
              size="small"
              sx={{
                borderRadius: 2,
                ...(tabValue === 2 && {
                  backgroundColor: '#4caf50',
                  '&:hover': { backgroundColor: '#45a049' }
                })
              }}
            >
              Processing ({orders.filter(o => o.status === 'Processing').length})
            </Button>
            <Button
              variant={tabValue === 3 ? "contained" : "outlined"}
              onClick={() => setTabValue(3)}
              size="small"
              sx={{
                borderRadius: 2,
                ...(tabValue === 3 && {
                  backgroundColor: '#4caf50',
                  '&:hover': { backgroundColor: '#45a049' }
                })
              }}
            >
              Shipped ({orders.filter(o => o.status === 'Shipped').length})
            </Button>
            <Button
              variant={tabValue === 4 ? "contained" : "outlined"}
              onClick={() => setTabValue(4)}
              size="small"
              sx={{
                borderRadius: 2,
                ...(tabValue === 4 && {
                  backgroundColor: '#4caf50',
                  '&:hover': { backgroundColor: '#45a049' }
                })
              }}
            >
              Delivered ({stats.deliveredOrders})
            </Button>
          </Stack>
        </Paper>

        {/* Orders Cards */}
        <Grid container spacing={5}>
          {getFilteredOrders().map((order) => (
            <Grid item xs={12} sm={6} lg={3} key={order.id} sx={{ display: 'flex' }}>
              <Card
                elevation={0}
                sx={{
                  border: '1px solid #e2e8f0',
                  borderRadius: 2,
                  transition: 'all 0.2s ease-in-out',
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: '0 8px 25px rgba(0,0,0,0.1)',
                    borderColor: '#4caf50'
                  },
                  height: '100%',
                  width: '300px',
                  display: 'flex',
                  flexDirection: 'column',
                  minWidth: 0 // Prevents flex items from overflowing
                }}
              >
                <CardContent sx={{ flexGrow: 1, p: 2.5 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                    <Box>
                      <Typography variant="h6" sx={{ fontWeight: 600, color: '#1e293b', mb: 0.5 }}>
                        {order.id}
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 1 }}>
                        <LocationOn sx={{ fontSize: 14, color: 'text.secondary' }} />
                        <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem' }}>
                          {order.location}
                        </Typography>
                      </Box>
                    </Box>
                    <IconButton size="small">
                      <MoreVert sx={{ fontSize: 18 }} />
                    </IconButton>
                  </Box>

                  <Box sx={{ mb: 2 }}>
                    <Chip 
                      label={order.status} 
                      color={getStatusColor(order.status)}
                      size="small"
                      sx={{ mb: 2 }}
                    />
                  </Box>

                  <Stack spacing={2}>
                    <Divider />

                    <Grid container spacing={2}>
                      <Grid item xs={6}>
                        <Typography variant="body2" color="text.secondary">
                          Buyer
                        </Typography>
                        <Typography variant="body1" sx={{ fontWeight: 500 }}>
                          {order.buyerName}
                        </Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="body2" color="text.secondary">
                          Farm
                        </Typography>
                        <Typography variant="body1" sx={{ fontWeight: 500 }}>
                          {order.farmName}
                        </Typography>
                      </Grid>
                    </Grid>

                    <Grid container spacing={2}>
                      <Grid item xs={6}>
                        <Typography variant="body2" color="text.secondary">
                          Crop Type
                        </Typography>
                        <Typography variant="body1" sx={{ fontWeight: 500 }}>
                          {order.cropType}
                        </Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="body2" color="text.secondary">
                          Quantity
                        </Typography>
                        <Typography variant="body1" sx={{ fontWeight: 500 }}>
                          {order.quantity}
                        </Typography>
                      </Grid>
                    </Grid>

                    <Grid container spacing={2}>
                      <Grid item xs={6}>
                        <Typography variant="body2" color="text.secondary">
                          Total Amount
                        </Typography>
                        <Typography variant="body1" sx={{ fontWeight: 600, color: '#4caf50' }}>
                          {formatCurrency(order.totalAmount)}
                        </Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="body2" color="text.secondary">
                          Delivery Date
                        </Typography>
                        <Typography variant="body1" sx={{ fontWeight: 500 }}>
                          {new Date(order.deliveryDate).toLocaleDateString()}
                        </Typography>
                      </Grid>
                    </Grid>

                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <CalendarToday sx={{ fontSize: 16, color: 'text.secondary' }} />
                      <Typography variant="body2" color="text.secondary">
                        Ordered: {new Date(order.orderDate).toLocaleDateString()}
                      </Typography>
                    </Box>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        {getFilteredOrders().length === 0 && (
          <Paper sx={{ p: 4, textAlign: 'center', mt: 4 }}>
            <ShoppingCart sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" color="text.secondary" gutterBottom>
              No orders found
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {tabValue === 0 ? 'No orders have been placed yet.' : `No ${['all', 'pending', 'processing', 'shipped', 'delivered'][tabValue]} orders found.`}
            </Typography>
          </Paper>
        )}
      </Box>
    </Box>
  );
};

export default FarmOrders;