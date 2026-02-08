import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Grid,
  Paper,
  Stack,
  Avatar,
  Button,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TableContainer,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Divider,
  Tooltip,
  Badge,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
} from '@mui/material';
import {
  ShoppingCart,
  Visibility,
  FilterList,
  Download,
  TrendingUp,
  Assessment,
  Schedule,
  CheckCircle,
  Pending,
  Error as ErrorIcon,
  Receipt,
  LocalShipping,
  Person,
  Landscape,
  CalendarToday,
} from '@mui/icons-material';
import { orderService } from '../services/orders';
import { useAuth } from '../contexts/AuthContext';
import Loader from '../components/Common/Loader';
import ErrorMessage from '../components/Common/ErrorMessage';

const FarmOrders = () => {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [filter, setFilter] = useState('all');
  const [updatingStatus, setUpdatingStatus] = useState(false);

  const loadOrders = useCallback(async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      setError(null);
      const response = await orderService.getFarmerOrdersWithFields(user.id);
      const apiOrders = Array.isArray(response.data) ? response.data : [];

      const formattedOrders = apiOrders.map((order) => ({
        id: order.id,
        field_name: order.field_name || 'Unknown Field',
        buyer_name: order.buyer_name || 'Unknown Buyer',
        buyer_email: order.buyer_email || '',
        area_rented: `${order.quantity || 0} m²`,
        quantity: Number(order.quantity) || 0,
        total_cost: Number(order.total_price) || 0,
        status: order.status || 'pending',
        created_at: order.created_at,
        crop_type: order.crop_type || 'Mixed',
        price_per_unit: Number(order.price_per_m2) || 0,
        location: order.location || 'Unknown',
        delivery_date: order.selected_harvest_date || null,
        mode_of_shipping: order.mode_of_shipping || 'delivery',
        field_id: order.field_id,
        image_url: order.image_url || '',
      }));

      setOrders(formattedOrders);
    } catch (err) {
      console.error('Error loading farmer orders:', err);
      setError('Failed to load orders received. Please try again.');
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    if (user) {
      loadOrders();
    } else {
      setLoading(false);
    }
  }, [user, loadOrders]);

  const handleViewDetails = (order) => {
    setSelectedOrder(order);
    setDetailsOpen(true);
  };

  const handleStatusChange = async (orderId, newStatus) => {
    if (!orderId || !newStatus) return;
    try {
      setUpdatingStatus(true);
      await orderService.updateOrderStatus(orderId, newStatus);
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o))
      );
      if (selectedOrder?.id === orderId) {
        setSelectedOrder((prev) => (prev ? { ...prev, status: newStatus } : null));
      }
    } catch (err) {
      console.error('Update order status error:', err);
    } finally {
      setUpdatingStatus(false);
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

  const filteredOrders = orders.filter((order) => {
    if (filter === 'all') return true;
    return order.status === filter;
  });

  if (loading) return <Loader message="Loading orders received..." />;
  if (error) return <ErrorMessage message={error} onRetry={loadOrders} />;

  const totalRevenue = orders.reduce((sum, o) => sum + (Number(o.total_cost) || 0), 0);
  const activeOrders = orders.filter((o) =>
    ['active', 'pending'].includes(o.status)
  ).length;
  const completedOrders = orders.filter((o) => o.status === 'completed').length;
  const completionRate =
    orders.length > 0 ? (completedOrders / orders.length) * 100 : 0;

  return (
    <Box
      sx={{
        minHeight: '100vh',
        backgroundColor: '#f8fafc',
        p: 3,
      }}
    >
      <Box sx={{ maxWidth: '1400px', mx: 'auto', mb: 4 }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2.5 }}>
          <Box>
            <Typography
              variant="h5"
              sx={{
                fontWeight: 700,
                color: '#1e293b',
                mb: 0.5,
                fontSize: '1.75rem',
              }}
            >
              Orders Received
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.9rem' }}>
              Orders placed by buyers on your fields — manage and update status
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
              py: 1,
            }}
          >
            Order Report
          </Button>
        </Stack>

        {/* Stats */}
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
                  boxShadow: '0 6px 20px rgba(0,0,0,0.08)',
                },
              }}
            >
              <Stack direction="row" alignItems="center" spacing={1.5}>
                <Avatar sx={{ backgroundColor: '#dbeafe', color: '#1d4ed8', width: 40, height: 40 }}>
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
                  boxShadow: '0 6px 20px rgba(0,0,0,0.08)',
                },
              }}
            >
              <Stack direction="row" alignItems="center" spacing={1.5}>
                <Avatar sx={{ backgroundColor: '#dcfce7', color: '#059669', width: 40, height: 40 }}>
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
                  boxShadow: '0 6px 20px rgba(0,0,0,0.08)',
                },
              }}
            >
              <Stack direction="row" alignItems="center" spacing={1.5}>
                <Avatar sx={{ backgroundColor: '#fef3c7', color: '#d97706', width: 40, height: 40 }}>
                  <TrendingUp sx={{ fontSize: 20 }} />
                </Avatar>
                <Box>
                  <Typography variant="h5" sx={{ fontWeight: 700, color: '#1e293b', fontSize: '1.5rem' }}>
                    ${totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
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
                  boxShadow: '0 6px 20px rgba(0,0,0,0.08)',
                },
              }}
            >
              <Stack direction="row" alignItems="center" spacing={1.5}>
                <Avatar sx={{ backgroundColor: '#f3e8ff', color: '#7c3aed', width: 40, height: 40 }}>
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

        {/* Filters */}
        <Paper
          elevation={0}
          sx={{
            p: 2,
            mb: 2,
            border: '1px solid #e2e8f0',
            borderRadius: 2,
            backgroundColor: 'white',
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
              { key: 'active', label: 'Active', icon: <LocalShipping /> },
              { key: 'completed', label: 'Completed', icon: <CheckCircle /> },
              { key: 'cancelled', label: 'Cancelled', icon: <ErrorIcon /> },
            ].map(({ key, label, icon }) => (
              <Button
                key={key}
                variant={filter === key ? 'contained' : 'outlined'}
                size="medium"
                onClick={() => setFilter(key)}
                startIcon={icon}
                sx={{
                  borderRadius: 2,
                  px: 2,
                  py: 1,
                  ...(filter === key && {
                    backgroundColor: '#4caf50',
                    '&:hover': { backgroundColor: '#a1eda4' },
                  }),
                }}
              >
                {label}
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
            overflow: 'hidden',
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
                {filter === 'all' ? 'No orders received yet' : `No ${filter} orders found`}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.85rem' }}>
                {filter === 'all' ? 'Orders from buyers will appear here.' : 'Try a different filter.'}
              </Typography>
            </Box>
          ) : (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow sx={{ backgroundColor: '#f8fafc' }}>
                    <TableCell sx={{ fontWeight: 600, color: '#475569', fontSize: '0.8rem', py: 1.5 }}>Order ID</TableCell>
                    <TableCell sx={{ fontWeight: 600, color: '#475569', fontSize: '0.8rem', py: 1.5 }}>Field / Product</TableCell>
                    <TableCell sx={{ fontWeight: 600, color: '#475569', fontSize: '0.8rem', py: 1.5 }}>Buyer</TableCell>
                    <TableCell sx={{ fontWeight: 600, color: '#475569', fontSize: '0.8rem', py: 1.5 }}>Area</TableCell>
                    <TableCell sx={{ fontWeight: 600, color: '#475569', fontSize: '0.8rem', py: 1.5 }}>Revenue</TableCell>
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
                        borderBottom: index === filteredOrders.length - 1 ? 'none' : '1px solid #e2e8f0',
                      }}
                    >
                      <TableCell sx={{ py: 1.5 }}>
                        <Typography variant="body2" sx={{ fontWeight: 600, color: '#1e293b', fontSize: '0.8rem' }}>
                          #{order.id}
                        </Typography>
                      </TableCell>
                      <TableCell sx={{ py: 1.5 }}>
                        <Stack direction="row" alignItems="center" spacing={1.5}>
                          {order.image_url ? (
                            <Box
                              component="img"
                              src={order.image_url}
                              alt={order.field_name}
                              sx={{
                                width: 40,
                                height: 40,
                                borderRadius: 1.5,
                                objectFit: 'cover',
                                border: '1px solid #e2e8f0',
                              }}
                              onError={(e) => { e.target.style.display = 'none'; }}
                            />
                          ) : (
                            <Avatar sx={{ width: 40, height: 40, bgcolor: '#dcfce7', color: '#059669' }}>
                              <Landscape sx={{ fontSize: 20 }} />
                            </Avatar>
                          )}
                          <Typography variant="body2" sx={{ fontWeight: 500, fontSize: '0.8rem' }}>
                            {order.field_name}
                          </Typography>
                        </Stack>
                      </TableCell>
                      <TableCell sx={{ py: 1.5 }}>
                        <Typography variant="body2" sx={{ fontWeight: 500, fontSize: '0.8rem' }}>
                          {order.buyer_name}
                        </Typography>
                        {order.buyer_email && (
                          <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                            {order.buyer_email}
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell sx={{ py: 1.5 }}>
                        <Typography variant="body2" sx={{ fontSize: '0.8rem' }}>
                          {order.area_rented}
                        </Typography>
                      </TableCell>
                      <TableCell sx={{ py: 1.5 }}>
                        <Typography variant="body2" sx={{ fontWeight: 600, color: '#059669', fontSize: '0.8rem' }}>
                          ${Number(order.total_cost).toFixed(2)}
                        </Typography>
                      </TableCell>
                      <TableCell sx={{ py: 1.5 }}>
                        <Chip
                          label={order.status}
                          color={getStatusColor(order.status)}
                          size="small"
                          sx={{ fontWeight: 500, borderRadius: 1.5, fontSize: '0.7rem', height: 24 }}
                        />
                      </TableCell>
                      <TableCell sx={{ py: 1.5 }}>
                        <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem' }}>
                          {new Date(order.created_at).toLocaleDateString()}
                        </Typography>
                      </TableCell>
                      <TableCell sx={{ py: 1.5 }}>
                        <Tooltip title="View details & update status">
                          <IconButton
                            size="small"
                            onClick={() => handleViewDetails(order)}
                            sx={{
                              color: '#059669',
                              '&:hover': { backgroundColor: '#dcfce7' },
                              p: 0.5,
                            }}
                          >
                            <Visibility sx={{ fontSize: 16 }} />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Paper>
      </Box>

      {/* Order details dialog */}
      <Dialog
        open={detailsOpen}
        onClose={() => setDetailsOpen(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
          },
        }}
      >
        <DialogTitle sx={{ borderBottom: '1px solid #e2e8f0', backgroundColor: '#f8fafc' }}>
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
                    backgroundColor: '#f8fafc',
                  }}
                >
                  <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 2 }}>
                    {selectedOrder.image_url ? (
                      <Box
                        component="img"
                        src={selectedOrder.image_url}
                        alt={selectedOrder.field_name}
                        sx={{
                          width: 56,
                          height: 56,
                          borderRadius: 2,
                          objectFit: 'cover',
                          border: '1px solid #e2e8f0',
                        }}
                        onError={(e) => { e.target.style.display = 'none'; }}
                      />
                    ) : (
                      <Avatar sx={{ backgroundColor: '#dcfce7', color: '#059669', width: 40, height: 40 }}>
                        <Landscape />
                      </Avatar>
                    )}
                    <Typography variant="h6" sx={{ fontWeight: 600, color: '#1e293b' }}>
                      Field / Product
                    </Typography>
                  </Stack>
                  <Divider sx={{ mb: 2 }} />
                  <Stack spacing={1.5}>
                    <Box>
                      <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', fontWeight: 600 }}>
                        Field Name
                      </Typography>
                      <Typography variant="body1" sx={{ fontWeight: 500 }}>
                        {selectedOrder.field_name}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', fontWeight: 600 }}>
                        Crop / Category
                      </Typography>
                      <Typography variant="body1" sx={{ fontWeight: 500 }}>
                        {selectedOrder.crop_type}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', fontWeight: 600 }}>
                        Location
                      </Typography>
                      <Typography variant="body1" sx={{ fontWeight: 500 }}>
                        {selectedOrder.location}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', fontWeight: 600 }}>
                        Area
                      </Typography>
                      <Typography variant="body1" sx={{ fontWeight: 500 }}>
                        {selectedOrder.area_rented}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', fontWeight: 600 }}>
                        Price per m²
                      </Typography>
                      <Typography variant="body1" sx={{ fontWeight: 500, color: '#059669' }}>
                        ${Number(selectedOrder.price_per_unit).toFixed(2)}
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
                    backgroundColor: '#f8fafc',
                  }}
                >
                  <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 2 }}>
                    <Avatar sx={{ backgroundColor: '#fef3c7', color: '#d97706', width: 40, height: 40 }}>
                      <Person />
                    </Avatar>
                    <Typography variant="h6" sx={{ fontWeight: 600, color: '#1e293b' }}>
                      Buyer & Order
                    </Typography>
                  </Stack>
                  <Divider sx={{ mb: 2 }} />
                  <Stack spacing={1.5}>
                    <Box>
                      <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', fontWeight: 600 }}>
                        Buyer Name
                      </Typography>
                      <Typography variant="body1" sx={{ fontWeight: 500 }}>
                        {selectedOrder.buyer_name}
                      </Typography>
                    </Box>
                    {selectedOrder.buyer_email && (
                      <Box>
                        <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', fontWeight: 600 }}>
                          Buyer Email
                        </Typography>
                        <Typography variant="body1" sx={{ fontWeight: 500 }}>
                          {selectedOrder.buyer_email}
                        </Typography>
                      </Box>
                    )}
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
                        Update status
                      </Typography>
                      <FormControl size="small" fullWidth sx={{ mt: 1, minWidth: 160 }}>
                        <Select
                          value={selectedOrder.status}
                          onChange={(e) => handleStatusChange(selectedOrder.id, e.target.value)}
                          disabled={updatingStatus}
                          sx={{ borderRadius: 2 }}
                        >
                          <MenuItem value="pending">Pending</MenuItem>
                          <MenuItem value="active">Active</MenuItem>
                          <MenuItem value="completed">Completed</MenuItem>
                          <MenuItem value="cancelled">Cancelled</MenuItem>
                        </Select>
                      </FormControl>
                    </Box>
                    <Box>
                      <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', fontWeight: 600 }}>
                        Total Revenue
                      </Typography>
                      <Typography variant="h6" sx={{ fontWeight: 700, color: '#059669' }}>
                        ${Number(selectedOrder.total_cost).toFixed(2)}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', fontWeight: 600 }}>
                        Order Date
                      </Typography>
                      <Typography variant="body1" sx={{ fontWeight: 500 }}>
                        {new Date(selectedOrder.created_at).toLocaleDateString()}
                      </Typography>
                    </Box>
                    {selectedOrder.delivery_date && (
                      <Box>
                        <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', fontWeight: 600 }}>
                          Delivery / Harvest Date
                        </Typography>
                        <Typography variant="body1" sx={{ fontWeight: 500 }}>
                          {new Date(selectedOrder.delivery_date).toLocaleDateString()}
                        </Typography>
                      </Box>
                    )}
                  </Stack>
                </Paper>
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 3, borderTop: '1px solid #e2e8f0', backgroundColor: '#f8fafc' }}>
          <Button onClick={() => setDetailsOpen(false)} sx={{ borderRadius: 2 }}>
            Close
          </Button>
          <Button
            variant="contained"
            startIcon={<Download />}
            sx={{
              backgroundColor: '#059669',
              '&:hover': { backgroundColor: '#047857' },
              borderRadius: 2,
              px: 3,
            }}
          >
            Download
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default FarmOrders;
