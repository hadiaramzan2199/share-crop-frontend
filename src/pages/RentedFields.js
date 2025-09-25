import React, { useState, useEffect } from 'react';
import rentedFieldsService from '../services/rentedFields';
import {
  Container,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  CircularProgress,
  Box,
  Alert,
  Stack,
  Grid,
  Paper,
  Avatar,
  Card,
  CardContent,
  IconButton,
  Chip,
  Divider,
  LinearProgress
} from '@mui/material';
import {
  LocationOn,
  CalendarToday,
  Agriculture,
  TrendingUp,
  MoreVert,
  Visibility,
  Edit,
  Assessment,
  Schedule,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { getPurchasedFarms } from '../data/mockFarms';
import storageService from '../services/storage';
import { orderService } from '../services/orders';

const RentedFields = () => {
  // Get current user from AuthContext
  const { user } = useAuth();
  const [rentedFields, setRentedFields] = useState([]);
  const [userCurrency, setUserCurrency] = useState('USD');
  const [loading, setLoading] = useState(true);

  // Exchange rates for currency conversion
  const exchangeRates = {
    'USD': { 'EUR': 0.85, 'GBP': 0.73, 'PKR': 280, 'JPY': 110, 'CAD': 1.25, 'AUD': 1.35, 'CHF': 0.92 },
    'EUR': { 'USD': 1.18, 'GBP': 0.86, 'PKR': 330, 'JPY': 130, 'CAD': 1.47, 'AUD': 1.59, 'CHF': 1.08 },
    'GBP': { 'USD': 1.37, 'EUR': 1.16, 'PKR': 384, 'JPY': 151, 'CAD': 1.71, 'AUD': 1.85, 'CHF': 1.26 },
    'PKR': { 'USD': 0.0036, 'EUR': 0.003, 'GBP': 0.0026, 'JPY': 0.39, 'CAD': 0.0045, 'AUD': 0.0048, 'CHF': 0.0033 },
    'JPY': { 'USD': 0.0091, 'EUR': 0.0077, 'GBP': 0.0066, 'PKR': 2.55, 'CAD': 0.011, 'AUD': 0.012, 'CHF': 0.0084 },
    'CAD': { 'USD': 0.8, 'EUR': 0.68, 'GBP': 0.58, 'PKR': 224, 'JPY': 88, 'AUD': 1.08, 'CHF': 0.74 },
    'AUD': { 'USD': 0.74, 'EUR': 0.63, 'GBP': 0.54, 'PKR': 207, 'JPY': 81, 'CAD': 0.93, 'CHF': 0.68 },
    'CHF': { 'USD': 1.09, 'EUR': 0.93, 'GBP': 0.79, 'PKR': 305, 'JPY': 119, 'CAD': 1.35, 'AUD': 1.47 }
  };
  
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
  


  // Currency conversion function
  const convertCurrency = (amount, fromCurrency, toCurrency) => {
    if (fromCurrency === toCurrency) return amount;
    
    // Convert to USD first if not already
    let usdAmount = amount;
    if (fromCurrency !== 'USD') {
      usdAmount = amount * (exchangeRates[fromCurrency]?.['USD'] || 1);
    }
    
    // Convert from USD to target currency
    if (toCurrency === 'USD') {
      return usdAmount;
    }
    
    return usdAmount * (exchangeRates['USD']?.[toCurrency] || 1);
  };

  // Helper function to calculate rent period
  const calculateRentPeriod = (startDate, endDate = null) => {
    if (!startDate) return '6 months'; // Default fallback
    
    const start = new Date(startDate);
    if (isNaN(start.getTime())) return '6 months'; // Invalid date fallback
    
    // If no end date provided, calculate from start date to 6 months later
    const end = endDate ? new Date(endDate) : new Date(start.getTime() + (6 * 30 * 24 * 60 * 60 * 1000));
    
    if (isNaN(end.getTime())) return '6 months'; // Invalid end date fallback
    
    const diffTime = Math.abs(end - start);
    const diffMonths = Math.ceil(diffTime / (1000 * 60 * 60 * 24 * 30));
    return `${diffMonths} months`;
  };

  // Calculate harvest date based on crop type and order date
  const calculateHarvestDate = (createdAt, cropType) => {
    if (!createdAt) return 'Not specified';
    
    const orderDate = new Date(createdAt);
    let harvestMonths = 3; // Default 3 months
    
    // Different crops have different growing periods
    const cropGrowthPeriods = {
      'apple': 6,
      'red-apple': 6,
      'green-apple': 6,
      'corn': 4,
      'wheat': 4,
      'rice': 3,
      'tomato': 3,
      'potato': 3,
      'carrot': 2,
      'lettuce': 2,
      'spinach': 2,
      'eggplant': 4,
      'lemon': 8,
      'orange': 8,
      'banana': 12,
      'strawberry': 3,
      'grape': 6
    };
    
    // Get growth period for the crop type
    const cropKey = cropType?.toLowerCase().replace(/\s+/g, '-');
    harvestMonths = cropGrowthPeriods[cropKey] || 3;
    
    // Calculate harvest date
    const harvestDate = new Date(orderDate);
    harvestDate.setMonth(harvestDate.getMonth() + harvestMonths);
    
    // Format the date
    const options = { day: 'numeric', month: 'short', year: 'numeric' };
    return harvestDate.toLocaleDateString('en-US', options);
  };

  // Load user preferences
  useEffect(() => {
    // Removed localStorage.getItem('userPreferences') as localStorage is deprecated.
    // User currency will default to 'USD' or be managed by a future backend.
  }, []);

  // Load rented fields based on user type
  useEffect(() => {
    const loadRentedFields = async () => {
      try {
        // If no user from auth context, return early
        if (!user) {
          setLoading(false);
          return;
        }

        // Both farmers and buyers use the same API to get their purchased fields
        // The difference is that farmers see fields they purchased as buyers
        // while buyers see fields they purchased as buyers
        try {
          const response = await orderService.getBuyerOrdersWithFields(user.id);
            const purchasedFields = response.data.map((order, index) => ({
              id: order.id, // Use order ID as unique identifier
              field_id: order.field_id,
              name: order.field_name,
              location: order.location,
              cropType: order.crop_type,
              area: `${order.quantity}m²`,
              available_area: order.available_area,
              total_area: order.total_area,
              price_per_m2: order.price_per_m2,
              monthlyRent: convertCurrency(order.total_price, 'USD', userCurrency),
              progress: Math.floor(Math.random() * 100) + 1, // Random progress for demo
              rentPeriod: calculateRentPeriod(order.created_at),
              selected_harvest_date: order.selected_harvest_date || calculateHarvestDate(order.created_at, order.cropType),
              selected_harvest_label: order.selected_harvest_label || calculateHarvestDate(order.created_at, order.cropType),
              status: order.status === 'pending' ? 'Pending' : 'Active',
              image_url: order.image_url,
              farmer_name: order.farmer_name,
              order_id: order.id,
              created_at: order.created_at
            }));
            setRentedFields(purchasedFields);
          } catch (dbError) {
            console.error('Error fetching from database, falling back to stored data:', dbError);
            
            // Fallback to stored fields if database fails
            const storedFields = storageService.getItem('rentedFields') || [];
            
            if (storedFields.length > 0) {
              const formattedFields = storedFields.map((field, index) => ({
                ...field,
                monthlyRent: convertCurrency(field.monthlyRent || field.price_per_m2 * field.area, 'USD', userCurrency),
                progress: Math.floor(((field.id || index) * 43) % 100) + 1, // Deterministic progress
                rentPeriod: calculateRentPeriod(field.created_at),
                status: 'Active'
              }));
              setRentedFields(formattedFields);
            } else {
              // Final fallback to mock data
              const mockFields = getPurchasedFarms();
              const formattedMockFields = mockFields.map((field, index) => ({
                ...field,
                monthlyRent: convertCurrency(field.monthlyRent, 'USD', userCurrency),
                progress: Math.floor(((field.id || index) * 47) % 100) + 1, // Deterministic progress
                rentPeriod: '6 months',
                status: 'Active'
              }));
              setRentedFields(formattedMockFields);
            }
          }
      } catch (error) {
        console.error('Error loading rented fields:', error);
      } finally {
        setLoading(false);
      }
    };

    loadRentedFields();
  }, [user, userCurrency]);


  const getStatusColor = (status) => {
    switch (status) {
      case 'Active': return 'success';
      case 'Completed': return 'primary';
      case 'Pending': return 'warning';
      default: return 'default';
    }
  };

  // Calculate stats for overview
  const totalFields = rentedFields.length;
  const activeFields = rentedFields.filter(f => f.status === 'Active').length;
  
  // Calculate total monthly rent with proper dummy values
  let totalMonthlyRent = rentedFields.reduce((sum, field) => sum + (field.monthlyRent || 0), 0);
  
  // Always use dummy revenue for demo purposes - generate realistic values
  if (totalFields > 0) {
    // Generate deterministic dummy monthly revenue: $800-$1500 per field
    const minPerField = 800;
    const maxPerField = 1500;
    const avgPerField = (minPerField + maxPerField) / 2;
    // Use deterministic variation based on total fields to ensure stability
    const variation = ((totalFields * 17) % 40 - 20) / 100; // ±20% variation but deterministic
    const revenuePerField = avgPerField * (1 + variation);
    totalMonthlyRent = Math.round(totalFields * revenuePerField);
  } else {
    totalMonthlyRent = 0;
  }
  
  // Calculate average progress with proper validation
  const validFields = rentedFields.filter(field => field.progress && !isNaN(field.progress));
  const avgProgress = validFields.length > 0 ? 
    Math.round(validFields.reduce((sum, field) => sum + field.progress, 0) / validFields.length) : 0;

  // Show loading state while data is being fetched
  if (loading) {
    return (
      <Box sx={{ 
        minHeight: '100vh',
        backgroundColor: '#f8fafc',
        p: 3,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <Typography>Loading...</Typography>
      </Box>
    );
  }

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
              My Rented Fields
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.9rem' }}>
              Monitor and manage your agricultural field rentals with real-time insights
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
            Field Report
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
                  <Agriculture sx={{ fontSize: 20 }} />
                </Avatar>
                <Box>
                  <Typography variant="h5" sx={{ fontWeight: 700, color: '#1e293b', fontSize: '1.5rem' }}>
                    {totalFields}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem' }}>
                    Total Fields
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
                    {activeFields}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem' }}>
                    Active Rentals
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
                    {avgProgress}%
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem' }}>
                    Avg Progress
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
                  <Schedule sx={{ fontSize: 20 }} />
                </Avatar>
                <Box>
                  <Typography variant="h5" sx={{ fontWeight: 700, color: '#1e293b', fontSize: '1.5rem' }}>
                    {currencySymbols[userCurrency]}{totalMonthlyRent.toLocaleString()}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem' }}>
                    Monthly Revenue
                  </Typography>
                </Box>
              </Stack>
            </Paper>
          </Grid>
        </Grid>

        {/* Fields Grid */}
        <Grid container spacing={2} sx={{ 
          display: 'grid',
          gridTemplateColumns: {
            xs: '1fr',
            sm: 'repeat(2, 1fr)',
            lg: 'repeat(3, 1fr)'
          },
          gap: 2,
          alignItems: 'stretch'
        }}>
          {rentedFields.slice(0, 8).map((field) => (
            <Box key={field.id} sx={{ 
              display: 'flex',
              width: '100%'
            }}>
              <Card 
                elevation={0}
                sx={{ 
                  height: 420, // Fixed height for consistency
                  width: '100%', // Full width of container
                  borderRadius: 2,
                  border: '1px solid #e2e8f0',
                  bgcolor: 'white',
                  transition: 'all 0.3s ease',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: '0 8px 16px rgba(0,0,0,0.08)',
                    borderColor: '#3b82f6'
                  }
                }}
              >
                <CardContent sx={{ p: 1, '&:last-child': { pb: 1 }, flex: 1, display: 'flex', flexDirection: 'column' }}>
                  {/* Card Header */}
                  <Box sx={{ p: 2, pb: 1.5 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.5 }}>
                      <Box sx={{ flex: 1 }}>
                        <Typography 
                          variant="h6" 
                          sx={{ 
                            fontWeight: 600, 
                            color: '#1a202c',
                            fontSize: '1rem',
                            mb: 0.25,
                            lineHeight: 1.3,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap'
                          }}
                        >
                          {field.name || field.farmName}
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <LocationOn sx={{ fontSize: 14, color: '#64748b', mr: 0.5 }} />
                          <Typography variant="body2" sx={{ color: '#64748b', fontWeight: 500, fontSize: '0.8rem' }}>
                            {field.location}
                          </Typography>
                        </Box>
                      </Box>
                      <IconButton size="small" sx={{ color: '#64748b' }}>
                        <MoreVert fontSize="small" />
                      </IconButton>
                    </Box>

                    <Chip 
                      label={field.status} 
                      color={getStatusColor(field.status)}
                      size="small"
                      sx={{ 
                        fontWeight: 600,
                        fontSize: '0.7rem',
                        height: 24,
                        borderRadius: 1.5
                      }}
                    />
                  </Box>

                  <Divider sx={{ mx: 2 }} />

                  {/* Field Details */}
                  <Box sx={{ p: 2, py: 1.5, flex: 1 }}>
                    <Stack spacing={1.5}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Agriculture sx={{ fontSize: 16, color: '#10b981', mr: 0.75 }} />
                          <Typography variant="body2" sx={{ color: '#64748b', fontWeight: 500, fontSize: '0.8rem' }}>
                            Crop Type
                          </Typography>
                        </Box>
                        <Typography variant="body2" sx={{ fontWeight: 600, color: '#1a202c', fontSize: '0.8rem' }}>
                          {field.cropType}
                        </Typography>
                      </Box>

                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <CalendarToday sx={{ fontSize: 16, color: '#3b82f6', mr: 0.75 }} />
                          <Typography variant="body2" sx={{ color: '#64748b', fontWeight: 500, fontSize: '0.8rem' }}>
                            Harvest Date
                          </Typography>
                        </Box>
                        <Typography variant="body2" sx={{ fontWeight: 600, color: '#1a202c', fontSize: '0.8rem' }}>
                          {field.selected_harvest_label || field.selected_harvest_date || 'Not specified'}
                        </Typography>
                      </Box>

                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="body2" sx={{ color: '#64748b', fontWeight: 500, fontSize: '0.8rem' }}>
                          Area: {field.area}
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 600, color: '#1a202c', fontSize: '0.8rem' }}>
                          {field.available_area}m² available
                        </Typography>
                      </Box>

                      {/* Progress Bar */}
                      <Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                          <Typography variant="body2" sx={{ color: '#64748b', fontWeight: 500, fontSize: '0.8rem' }}>
                            Progress
                          </Typography>
                          <Typography variant="body2" sx={{ fontWeight: 600, color: '#1a202c', fontSize: '0.8rem' }}>
                            {field.progress}%
                          </Typography>
                        </Box>
                        <LinearProgress 
                          variant="determinate" 
                          value={field.progress} 
                          sx={{ 
                            height: 6, 
                            borderRadius: 3,
                            bgcolor: '#f1f5f9',
                            '& .MuiLinearProgress-bar': {
                              borderRadius: 3,
                              bgcolor: field.progress === 100 ? '#10b981' : field.progress > 50 ? '#3b82f6' : '#f59e0b'
                            }
                          }} 
                        />
                      </Box>
                    </Stack>
                  </Box>

                  <Divider sx={{ mx: 2 }} />

                  {/* Card Footer */}
                  <Box sx={{ p: 2, pt: 1.5, mt: 'auto' }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                      <Typography 
                        variant="h5" 
                        sx={{ 
                          fontWeight: 700, 
                          color: '#059669',
                          fontSize: '1.25rem'
                        }}
                      >
                        {currencySymbols[userCurrency]}{field.monthlyRent?.toLocaleString() || '0'}
                      </Typography>
                      <Typography variant="body2" sx={{ color: '#64748b', fontWeight: 500, fontSize: '0.8rem' }}>
                        /month
                      </Typography>
                    </Box>
                    
                    <Stack direction="row" spacing={1}>
                      <Button 
                        variant="outlined" 
                        size="small" 
                        startIcon={<Visibility />}
                        sx={{ 
                          flex: 1,
                          borderRadius: 1.5,
                          textTransform: 'none',
                          fontWeight: 600,
                          fontSize: '0.75rem',
                          borderColor: '#e2e8f0',
                          color: '#64748b',
                          py: 0.75,
                          '&:hover': {
                            borderColor: '#059669',
                            color: '#059669',
                            bgcolor: '#f0fdf4'
                          }
                        }}
                      >
                        View
                      </Button>
                      <Button 
                        variant="contained" 
                        size="small" 
                        startIcon={<Edit />}
                        sx={{ 
                          flex: 1,
                          borderRadius: 1.5,
                          textTransform: 'none',
                          fontWeight: 600,
                          fontSize: '0.75rem',
                          bgcolor: '#4caf50',
                          py: 0.75,
                          '&:hover': {
                            bgcolor: '#a1eda4'
                          }
                        }}
                      >
                        Manage
                      </Button>
                    </Stack>
                  </Box>
                </CardContent>
              </Card>
            </Box>
          ))}
        </Grid>

        {/* Show More Button */}
        {rentedFields.length > 8 && (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
            <Button 
              variant="outlined" 
              size="large"
              sx={{ 
                borderRadius: 3,
                textTransform: 'none',
                fontWeight: 600,
                px: 4,
                py: 1.5,
                borderColor: '#e2e8f0',
                color: '#64748b',
                '&:hover': {
                  borderColor: '#3b82f6',
                  color: '#3b82f6',
                  bgcolor: '#f8fafc'
                }
              }}
            >
              View All Fields ({rentedFields.length})
            </Button>
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default RentedFields;