import React, { useState, useEffect } from 'react';
import { Grid, Card, CardContent, Typography, Box, Chip, Button } from '@mui/material';
import { Agriculture, TrendingUp, ShoppingCart, Assessment, Store } from '@mui/icons-material';
import { fieldService } from '../../services/fields';
// import { productService } from '../../services/products'; // Removed - using fields directly
import { orderService } from '../../services/orders';
import storageService from '../../services/storage';
import Loader from '../Common/Loader';
import ErrorMessage from '../Common/ErrorMessage';

const FarmerDashboard = ({ user }) => {
  const [fields, setFields] = useState([]);
  // const [products, setProducts] = useState([]); // Removed - using fields directly
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // Load orders from persistent storage first
      const storedOrders = storageService.getFarmOrders();
      
      if (storedOrders && storedOrders.length > 0) {
        // Convert stored orders to the expected format
        const formattedOrders = storedOrders.map(order => ({
          id: order.id,
          product_name: order.productName || order.farmName || 'Unknown Product',
          total_cost: order.totalCost || order.totalAmount || 0,
          status: order.status || 'pending',
          created_at: order.created_at || order.orderDate || new Date().toISOString(),
          buyer_name: order.buyerName || 'Unknown Buyer'
        }));
        
        setOrders(formattedOrders);
        
        // For fields and products, try to get from API or use defaults
        try {
          const fieldsResponse = await fieldService.getFields();
          setFields(fieldsResponse.data.fields);
        } catch (apiError) {
          setFields([]);
        }
        
        setError(null);
        setLoading(false);
        return;
      }
      
      // Fallback to API services if no stored orders
      const [fieldsResponse, ordersResponse] = await Promise.all([
        fieldService.getFields(),
        orderService.getFarmerOrders()
      ]);
      setFields(fieldsResponse.data.fields);
      setOrders(ordersResponse.data.orders);
      setError(null);
    } catch (err) {
      setError('Failed to load dashboard data');
      console.error('Dashboard error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <Loader message="Loading your dashboard..." />;
  if (error) return <ErrorMessage message={error} onRetry={loadDashboardData} />;

  const totalRevenue = orders.reduce((sum, order) => sum + order.total_cost, 0);
  const pendingOrders = orders.filter(o => o.status === 'pending').length;

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        👨‍🌾 Farmer Dashboard
      </Typography>

      <Grid container spacing={3} sx={{ mb: 4 }}>
        {/* Fields Card */}
        <Grid item xs={12} md={3}>
          <Card className="farmville-card">
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Agriculture sx={{ mr: 1, color: 'primary.main' }} />
                <Typography variant="h6">Fields</Typography>
              </Box>
              <Typography variant="h4" color="primary.main" gutterBottom>
                {fields.length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Total fields
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Fields Card */}
        <Grid item xs={12} md={3}>
          <Card className="farmville-card">
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Agriculture sx={{ mr: 1, color: 'secondary.main' }} />
                <Typography variant="h6">Fields</Typography>
              </Box>
              <Typography variant="h4" color="secondary.main" gutterBottom>
                {fields.length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Available fields
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Revenue Card */}
        <Grid item xs={12} md={3}>
          <Card className="farmville-card">
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <AttachMoney sx={{ mr: 1, color: 'success.main' }} />
                <Typography variant="h6">Revenue</Typography>
              </Box>
              <Typography variant="h4" color="success.main" gutterBottom>
                ${totalRevenue.toFixed(2)}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Total earnings
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Orders Card */}
        <Grid item xs={12} md={3}>
          <Card className="farmville-card">
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <TrendingUp sx={{ mr: 1, color: 'warning.main' }} />
                <Typography variant="h6">Orders</Typography>
              </Box>
              <Typography variant="h4" color="warning.main" gutterBottom>
                {orders.length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {pendingOrders} pending
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Recent Activity */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card className="farmville-card">
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Recent Orders
              </Typography>
              {orders.slice(0, 5).map((order) => (
                <Box key={order.id} sx={{ mb: 2, p: 1, borderBottom: '1px solid', borderColor: 'grey.100' }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="body2">{order.product_name}</Typography>
                    <Chip label={order.status} size="small" />
                  </Box>
                  <Typography variant="caption" color="text.secondary">
                    {order.buyer_name} • {order.area_rented}m² • ${order.total_cost}
                  </Typography>
                </Box>
              ))}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card className="farmville-card">
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Quick Actions
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Button variant="contained" className="farmville-button">
                  Add New Field
                </Button>
                <Button variant="outlined">
                  Manage Fields
                </Button>
                <Button variant="outlined">
                  View Orders
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default FarmerDashboard;