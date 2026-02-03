import React, { useState, useEffect } from 'react';
import ordersService from '../services/orders';
import {
  Box,
  Container,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  CircularProgress,
  Alert,
  Card,
  CardContent,
  Grid,
  Chip,
  TableContainer,
  Paper,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Avatar,
  Stack,
  Divider,
  LinearProgress,
  Tooltip,
  Badge,
} from '@mui/material';
import {
  ShoppingCart,
  Visibility,
  Cancel,
  FilterList,
  Download,
  TrendingUp,
  Assessment,
  Schedule,
  CheckCircle,
  Pending,
  Error as ErrorIcon,
  MoreVert,
  Receipt,
  LocalShipping,
} from '@mui/icons-material';
import { orderService } from '../services/orders';
import { useAuth } from '../contexts/AuthContext';
import Loader from '../components/Common/Loader';
import ErrorMessage from '../components/Common/ErrorMessage';

const Orders = () => {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [filter, setFilter] = useState('all');

  useEffect(() => { // eslint-disable-line react-hooks/exhaustive-deps
    if (user) {
      loadOrders();
    } else {
      setLoading(false);
    }
  }, [user]);

  const loadOrders = async () => {
    if (!user || !user.id) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Use real API - getBuyerOrders uses /my-orders endpoint which filters by authenticated user
      const response = await orderService.getBuyerOrders();
      const apiOrders = response.data || [];

      // Format API orders to match expected structure
      const formattedOrders = apiOrders.map(order => ({
        id: order.id,
        product_name: order.field_name || 'Unknown Field',
        buyer_name: user.name || 'You',
        area_rented: `${order.quantity || 0} m²`,
        total_cost: order.total_price || 0,
        status: order.status || 'pending',
        created_at: order.created_at,
        farm_name: order.field_name || 'Unknown Field',
        crop_type: order.crop_type || 'Mixed',
        price_per_unit: order.price_per_m2 || 0,
        location: order.location || 'Unknown',
        farmer_name: order.farmer_name || 'Unknown Farmer',
        farmer_email: order.farmer_email || '',
        delivery_date: order.selected_harvest_date || null,
        payment_status: order.status === 'completed' ? 'paid' : 'pending',
        mode_of_shipping: order.mode_of_shipping || 'delivery',
        field_id: order.field_id,
        notes: order.notes || ''
      }));

      setOrders(formattedOrders);
    } catch (err) {
      console.error('Error loading orders:', err);
      setError('Failed to load orders. Please try again.');
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };


  const handleViewDetails = (order) => {
    setSelectedOrder(order);
    setDetailsOpen(true);
  };

  const handleCancelOrder = async (orderId) => {
    try {
      await orderService.cancelOrder(orderId);
      loadOrders(); // Refresh orders
    } catch (err) {
      console.error('Cancel order error:', err);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'success';
      case 'confirmed':
      case 'active':
        return 'primary';
      case 'pending':
        return 'warning';
      case 'cancelled':
        return 'error';
      default:
        return 'default';
    }
  };

  const filteredOrders = orders.filter(order => {
    if (filter === 'all') return true;
    return order.status === filter;
  });

  if (loading) return <Loader message="Loading your orders..." />;
  if (error) return <ErrorMessage message={error} onRetry={loadOrders} />;

  const totalSpent = orders.reduce((sum, order) => sum + (order.total_cost || 0), 0);
  const activeOrders = orders.filter(o => ['confirmed', 'active', 'pending'].includes(o.status)).length;
  const completedOrders = orders.filter(o => o.status === 'completed').length;
  const pendingOrders = orders.filter(o => o.status === 'pending').length;
  const completionRate = orders.length > 0 ? (completedOrders / orders.length) * 100 : 0;

  return (
    <Box sx={{
      minHeight: '100vh',
      backgroundColor: '#f8fafc',
      p: 3
    }}>
      {/* Header Section */}
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
              Order Management
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.9rem' }}>
              Track and manage your agricultural orders and purchases
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<Receipt />}
            sx={{
              backgroundColor: '#4caf50',
              '&:hover': { backgroundColor: '#a1eda4' },
              borderRadius: 2,
              px: 2.5,
              py: 1
            }}
          >
            Export Orders
          </Button>
        </Stack>

        {/* Stats Overview */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
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
                    {orders.length}
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
                  <LocalShipping sx={{ fontSize: 20 }} />
                </Avatar>
                <Box>
                  <Typography variant="h5" sx={{ fontWeight: 700, color: '#1e293b', fontSize: '1.5rem' }}>
                    {activeOrders}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem' }}>
                    Active Orders
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
                  <TrendingUp sx={{ fontSize: 20 }} />
                </Avatar>
                <Box>
                  <Typography variant="h5" sx={{ fontWeight: 700, color: '#1e293b', fontSize: '1.5rem' }}>
                    ${totalSpent.toLocaleString()}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem' }}>
                    Total Spent
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
                  <Assessment sx={{ fontSize: 20 }} />
                </Avatar>
                <Box>
                  <Typography variant="h5" sx={{ fontWeight: 700, color: '#1e293b', fontSize: '1.5rem' }}>
                    {completionRate.toFixed(0)}%
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem' }}>
                    Completion Rate
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
            mb: 2,
            border: '1px solid #e2e8f0',
            borderRadius: 2,
            backgroundColor: 'white'
          }}
        >
          <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1.5 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#1e293b', fontSize: '1rem' }}>
              Filter Orders
            </Typography>
            <Badge badgeContent={filteredOrders.length} color="primary">
              <FilterList color="action" sx={{ fontSize: 20 }} />
            </Badge>
          </Stack>
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            {[
              { key: 'all', label: 'All Orders', icon: <ShoppingCart /> },
              { key: 'pending', label: 'Pending', icon: <Schedule /> },
              { key: 'confirmed', label: 'Confirmed', icon: <CheckCircle /> },
              { key: 'active', label: 'Active', icon: <LocalShipping /> },
              { key: 'completed', label: 'Completed', icon: <CheckCircle /> },
              { key: 'cancelled', label: 'Cancelled', icon: <ErrorIcon /> }
            ].map((status) => (
              <Button
                key={status.key}
                variant={filter === status.key ? 'contained' : 'outlined'}
                size="medium"
                onClick={() => setFilter(status.key)}
                startIcon={status.icon}
                sx={{
                  borderRadius: 2,
                  px: 2,
                  py: 1,
                  ...(filter === status.key && {
                    backgroundColor: '#4caf50',
                    '&:hover': { backgroundColor: '#a1eda4' }
                  })
                }}
              >
                {status.label}
              </Button>
            ))}
          </Stack>
        </Paper>

        {/* Orders Table */}
        <Paper
          elevation={0}
          sx={{
            border: '1px solid #e2e8f0',
            borderRadius: 2,
            backgroundColor: 'white',
            overflow: 'hidden'
          }}
        >
          <Box sx={{ p: 2, borderBottom: '1px solid #e2e8f0' }}>
            <Stack direction="row" alignItems="center" justifyContent="space-between">
              <Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#1e293b', fontSize: '1rem' }}>
                  Order History
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem' }}>
                  {filteredOrders.length} {filter === 'all' ? 'total' : filter} orders
                </Typography>
              </Box>
              <Button
                variant="outlined"
                startIcon={<Download sx={{ fontSize: 18 }} />}
                sx={{ borderRadius: 2, px: 2, py: 1, fontSize: '0.8rem' }}
              >
                Export
              </Button>
            </Stack>
          </Box>

          {filteredOrders.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 6 }}>
              <ShoppingCart sx={{ fontSize: 48, color: '#cbd5e1', mb: 1.5 }} />
              <Typography variant="subtitle1" color="text.secondary" gutterBottom sx={{ fontSize: '1rem' }}>
                {filter === 'all' ? 'No orders yet' : `No ${filter} orders found`}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.85rem' }}>
                {filter === 'all' ? 'Start shopping in the marketplace!' : 'Try adjusting your filter criteria'}
              </Typography>
            </Box>
          ) : (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow sx={{ backgroundColor: '#f8fafc' }}>
                    <TableCell sx={{ fontWeight: 600, color: '#475569', fontSize: '0.8rem', py: 1.5 }}>Order ID</TableCell>
                    <TableCell sx={{ fontWeight: 600, color: '#475569', fontSize: '0.8rem', py: 1.5 }}>Product</TableCell>
                    <TableCell sx={{ fontWeight: 600, color: '#475569', fontSize: '0.8rem', py: 1.5 }}>Area</TableCell>
                    <TableCell sx={{ fontWeight: 600, color: '#475569', fontSize: '0.8rem', py: 1.5 }}>Total Cost</TableCell>
                    <TableCell sx={{ fontWeight: 600, color: '#475569', fontSize: '0.8rem', py: 1.5 }}>Status</TableCell>
                    <TableCell sx={{ fontWeight: 600, color: '#475569', fontSize: '0.8rem', py: 1.5 }}>Date</TableCell>
                    <TableCell sx={{ fontWeight: 600, color: '#475569', fontSize: '0.8rem', py: 1.5 }}>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredOrders.map((order, index) => (
                    <TableRow
                      key={order.id}
                      sx={{
                        '&:hover': { backgroundColor: '#f8fafc' },
                        borderBottom: index === filteredOrders.length - 1 ? 'none' : '1px solid #e2e8f0'
                      }}
                    >
                      <TableCell sx={{ py: 1.5 }}>
                        <Typography variant="body2" sx={{ fontWeight: 600, color: '#1e293b', fontSize: '0.8rem' }}>
                          #{order.id}
                        </Typography>
                      </TableCell>
                      <TableCell sx={{ py: 1.5 }}>
                        <Typography variant="body2" sx={{ fontWeight: 500, fontSize: '0.8rem' }}>
                          {order.product_name || order.name}
                        </Typography>
                      </TableCell>
                      <TableCell sx={{ py: 1.5 }}>
                        <Typography variant="body2" sx={{ fontSize: '0.8rem' }}>
                          {order.area_rented || order.area}m²
                        </Typography>
                      </TableCell>
                      <TableCell sx={{ py: 1.5 }}>
                        <Typography variant="body2" sx={{ fontWeight: 600, color: '#059669', fontSize: '0.8rem' }}>
                          ${(order.total_cost || order.cost).toFixed(2)}
                        </Typography>
                      </TableCell>
                      <TableCell sx={{ py: 1.5 }}>
                        <Chip
                          label={order.status}
                          color={getStatusColor(order.status)}
                          size="small"
                          sx={{
                            fontWeight: 500,
                            borderRadius: 1.5,
                            fontSize: '0.7rem',
                            height: 24
                          }}
                        />
                      </TableCell>
                      <TableCell sx={{ py: 1.5 }}>
                        <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem' }}>
                          {new Date(order.created_at || order.date).toLocaleDateString()}
                        </Typography>
                      </TableCell>
                      <TableCell sx={{ py: 1.5 }}>
                        <Stack direction="row" spacing={0.5}>
                          <Tooltip title="View Details">
                            <IconButton
                              size="small"
                              onClick={() => handleViewDetails(order)}
                              sx={{
                                color: '#059669',
                                '&:hover': { backgroundColor: '#dcfce7' },
                                p: 0.5
                              }}
                            >
                              <Visibility sx={{ fontSize: 16 }} />
                            </IconButton>
                          </Tooltip>
                          {order.status === 'pending' && (
                            <Tooltip title="Cancel Order">
                              <IconButton
                                size="small"
                                onClick={() => handleCancelOrder(order.id)}
                                sx={{
                                  color: '#dc2626',
                                  '&:hover': { backgroundColor: '#fef2f2' },
                                  p: 0.5
                                }}
                              >
                                <Cancel sx={{ fontSize: 16 }} />
                              </IconButton>
                            </Tooltip>
                          )}
                        </Stack>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Paper>
      </Box>

      {/* Order Details Dialog */}
      <Dialog
        open={detailsOpen}
        onClose={() => setDetailsOpen(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
          }
        }}
      >
        <DialogTitle sx={{
          borderBottom: '1px solid #e2e8f0',
          backgroundColor: '#f8fafc'
        }}>
          <Stack direction="row" alignItems="center" spacing={2}>
            <Avatar sx={{ backgroundColor: '#dbeafe', color: '#1d4ed8' }}>
              <Receipt />
            </Avatar>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                Order Details
              </Typography>
              <Typography variant="body2" color="text.secondary">
                #{selectedOrder?.id}
              </Typography>
            </Box>
          </Stack>
        </DialogTitle>
        <DialogContent sx={{ p: 3 }}>
          {selectedOrder && (
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Paper
                  elevation={0}
                  sx={{
                    p: 3,
                    border: '1px solid #e2e8f0',
                    borderRadius: 2,
                    backgroundColor: '#f8fafc'
                  }}
                >
                  <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 2 }}>
                    <Avatar sx={{ backgroundColor: '#dcfce7', color: '#059669', width: 40, height: 40 }}>
                      <ShoppingCart />
                    </Avatar>
                    <Typography variant="h6" sx={{ fontWeight: 600, color: '#1e293b' }}>
                      Product Information
                    </Typography>
                  </Stack>
                  <Divider sx={{ mb: 2 }} />
                  <Stack spacing={1.5}>
                    <Box>
                      <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', fontWeight: 600 }}>
                        Product Name
                      </Typography>
                      <Typography variant="body1" sx={{ fontWeight: 500 }}>
                        {selectedOrder.product_name || selectedOrder.name}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', fontWeight: 600 }}>
                        Area
                      </Typography>
                      <Typography variant="body1" sx={{ fontWeight: 500 }}>
                        {selectedOrder.area_rented || selectedOrder.area}m²
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', fontWeight: 600 }}>
                        Price per m²
                      </Typography>
                      <Typography variant="body1" sx={{ fontWeight: 500, color: '#059669' }}>
                        ${selectedOrder.price_per_unit || (selectedOrder.cost / selectedOrder.area).toFixed(2)}
                      </Typography>
                    </Box>
                  </Stack>
                </Paper>
              </Grid>
              <Grid item xs={12} md={6}>
                <Paper
                  elevation={0}
                  sx={{
                    p: 3,
                    border: '1px solid #e2e8f0',
                    borderRadius: 2,
                    backgroundColor: '#f8fafc'
                  }}
                >
                  <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 2 }}>
                    <Avatar sx={{ backgroundColor: '#fef3c7', color: '#d97706', width: 40, height: 40 }}>
                      <Assessment />
                    </Avatar>
                    <Typography variant="h6" sx={{ fontWeight: 600, color: '#1e293b' }}>
                      Order Information
                    </Typography>
                  </Stack>
                  <Divider sx={{ mb: 2 }} />
                  <Stack spacing={1.5}>
                    <Box>
                      <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', fontWeight: 600 }}>
                        Status
                      </Typography>
                      <Box sx={{ mt: 0.5 }}>
                        <Chip
                          label={selectedOrder.status}
                          color={getStatusColor(selectedOrder.status)}
                          size="small"
                          sx={{ fontWeight: 500, borderRadius: 2 }}
                        />
                      </Box>
                    </Box>
                    <Box>
                      <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', fontWeight: 600 }}>
                        Total Cost
                      </Typography>
                      <Typography variant="h6" sx={{ fontWeight: 700, color: '#059669' }}>
                        ${(selectedOrder.total_cost || selectedOrder.cost).toFixed(2)}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', fontWeight: 600 }}>
                        Order Date
                      </Typography>
                      <Typography variant="body1" sx={{ fontWeight: 500 }}>
                        {new Date(selectedOrder.created_at || selectedOrder.date).toLocaleDateString()}
                      </Typography>
                    </Box>
                  </Stack>
                </Paper>
              </Grid>
              {selectedOrder.notes && (
                <Grid item xs={12}>
                  <Paper
                    elevation={0}
                    sx={{
                      p: 3,
                      border: '1px solid #e2e8f0',
                      borderRadius: 2,
                      backgroundColor: '#f8fafc'
                    }}
                  >
                    <Typography variant="h6" sx={{ fontWeight: 600, color: '#1e293b', mb: 2 }}>
                      Additional Notes
                    </Typography>
                    <Typography variant="body1">{selectedOrder.notes}</Typography>
                  </Paper>
                </Grid>
              )}
              {selectedOrder.farmer_name && (
                <Grid item xs={12}>
                  <Paper
                    elevation={0}
                    sx={{
                      p: 3,
                      border: '1px solid #e2e8f0',
                      borderRadius: 2,
                      backgroundColor: '#f8fafc'
                    }}
                  >
                    <Typography variant="h6" sx={{ fontWeight: 600, color: '#1e293b', mb: 2 }}>
                      Farmer Information
                    </Typography>
                    <Typography variant="body1">{selectedOrder.farmer_name}</Typography>
                  </Paper>
                </Grid>
              )}
            </Grid>
          )}
        </DialogContent>
        <DialogActions sx={{
          p: 3,
          borderTop: '1px solid #e2e8f0',
          backgroundColor: '#f8fafc'
        }}>
          <Button
            onClick={() => setDetailsOpen(false)}
            sx={{ borderRadius: 2 }}
          >
            Close
          </Button>
          <Button
            variant="contained"
            startIcon={<Download />}
            sx={{
              backgroundColor: '#059669',
              '&:hover': { backgroundColor: '#047857' },
              borderRadius: 2,
              px: 3
            }}
          >
            Download Receipt
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Orders;