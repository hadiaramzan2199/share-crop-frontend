import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Chip,
  Avatar,
  LinearProgress,
  Divider,
  Button,
  IconButton,
  Stack,
  Paper,
  Modal,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Badge,
} from '@mui/material';
import {
  LocationOn,
  CalendarToday,
  Agriculture,
  TrendingUp,
  MoreVert,
  Assessment,
  Nature,
  WaterDrop,
  Visibility,
  Terrain,
  Park,
  AttachMoney,
  Close,
  Info,
  Settings,
} from '@mui/icons-material';
import storageService from '../services/storage';
import fieldsService from '../services/fields';
import farmsService from '../services/farms';
import { useAuth } from '../contexts/AuthContext';

const MyFarms = () => {
  const [myFarms, setMyFarms] = useState([]);
  const [myFields, setMyFields] = useState([]);
  const [userCurrency, setUserCurrency] = useState('USD');
  const [selectedFarm, setSelectedFarm] = useState(null);
  const [farmDetailOpen, setFarmDetailOpen] = useState(false);
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

  // Handle farm detail modal
  const handleFarmClick = (farm) => {
    setSelectedFarm(farm);
    setFarmDetailOpen(true);
  };

  const handleCloseFarmDetail = () => {
    setFarmDetailOpen(false);
    setSelectedFarm(null);
  };

  // Generate mock farm data for demo purposes
  const generateMockFarms = () => [
    {
      id: 'mock-1',
      name: 'Green Valley Farm',
      location: 'California, USA',
      cropType: 'Organic Vegetables',
      plantingDate: '2024-03-15',
      harvestDate: '2024-07-20',
      progress: 85,
      area: '25 acres',
      soilType: 'Loamy',
      irrigationType: 'Drip Irrigation',
      monthlyRevenue: 8500,
      status: 'Active',
      image: '/api/placeholder/400/200',
      description: 'Sustainable organic vegetable farm with modern irrigation systems',
      totalFields: 3,
      activeFields: 3,
      fields: [
        { id: 'field-1', name: 'North Field', crop: 'Tomatoes', area: '8 acres', status: 'Active' },
        { id: 'field-2', name: 'South Field', crop: 'Lettuce', area: '7 acres', status: 'Active' },
        { id: 'field-3', name: 'East Field', crop: 'Carrots', area: '10 acres', status: 'Active' }
      ]
    },
    {
      id: 'mock-2',
      name: 'Sunrise Orchards',
      location: 'Florida, USA',
      cropType: 'Citrus Fruits',
      plantingDate: '2024-01-10',
      harvestDate: '2024-12-15',
      progress: 65,
      area: '40 acres',
      soilType: 'Sandy',
      irrigationType: 'Sprinkler System',
      monthlyRevenue: 7250,
      status: 'Active',
      image: '/api/placeholder/400/200',
      description: 'Premium citrus orchard specializing in oranges and lemons',
      totalFields: 2,
      activeFields: 2,
      fields: [
        { id: 'field-4', name: 'Orange Grove A', crop: 'Oranges', area: '20 acres', status: 'Active' },
        { id: 'field-5', name: 'Lemon Grove B', crop: 'Lemons', area: '20 acres', status: 'Active' }
      ]
    }
  ];

  // Load user preferences
  useEffect(() => {
    // Removed localStorage.getItem('userPreferences') as localStorage is deprecated.
    // User currency will default to 'USD' or be managed by a future backend.
  }, []);

  const fetchFarms = async () => {
    try {
      // Fetch farms data from database
      const farmsResponse = await farmsService.getAll();
      const rawFarms = farmsResponse.data || [];
      
      // Transform database farms to match the card display format
      const transformedFarms = rawFarms.map(farm => ({
        id: farm.id,
        name: farm.farm_name || farm.name,
        location: farm.location || 'Not specified',
        cropType: farm.crop_type || 'Mixed',
        plantingDate: farm.planting_date || new Date().toISOString(),
        harvestDate: farm.harvest_date || new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
        progress: farm.progress || Math.floor(Math.random() * 100),
        area: farm.area || '25 acres',
        soilType: farm.soil_type || 'Loamy',
        irrigationType: farm.irrigation_type || 'Drip Irrigation',
        monthlyRevenue: farm.monthly_revenue || Math.floor(Math.random() * 10000) + 5000,
        status: farm.status || 'Active',
        image: farm.image || '/api/placeholder/400/200',
        description: farm.description || '',
        fields: farm.fields || []
      }));
      
      setMyFarms(transformedFarms);
      console.log('Loaded farms from database:', transformedFarms);

      // Fetch farmer-created fields if user is available
      if (user && user.id) {
        try {
          const fieldsResponse = await fieldsService.getAll();
          // Filter fields created by the current farmer
          const farmerFields = fieldsResponse.data?.filter(field => 
            field.farmer_name === user.name || field.created_by === user.id || field.owner_id === user.id
          ) || [];
          
          // Transform fields data to match the expected format for display
          const transformedFields = farmerFields.map(field => ({
            id: field.id,
            name: field.name,
            location: field.location || 'Not specified',
            cropType: field.category || field.product_type || 'Unknown',
            plantingDate: field.planting_date || new Date().toISOString(),
            harvestDate: field.harvest_dates ? 
              (Array.isArray(field.harvest_dates) ? field.harvest_dates[0] : field.harvest_dates) : 
              new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
            progress: field.progress || Math.floor(Math.random() * 100),
            area: field.area_m2 ? `${field.area_m2} m²` : field.field_size || 'Not specified',
            soilType: field.soil_type || 'Loamy',
            irrigationType: field.irrigation_type || 'Drip Irrigation',
            monthlyRevenue: (field.production_rate && !isNaN(field.production_rate)) ? field.production_rate * 10 : Math.floor(Math.random() * 5000),
            status: field.status || 'Active',
            image: field.image || '/api/placeholder/400/200',
            farm_id: field.farm_id, // Include farm_id for proper association
            isFarmerCreated: true
          }));
          
          setMyFields(transformedFields);
          console.log('Loaded farmer fields:', transformedFields);
        } catch (fieldsError) {
          console.error('Error fetching farmer fields:', fieldsError);
          setMyFields([]);
        }
      }
    } catch (error) {
      console.error('Error fetching farms:', error);
      setMyFarms([]);
    }
  };

  // Load my farms data
  useEffect(() => {
    fetchFarms();
  }, [user]);

  const getStatusColor = (status) => {
    switch (status) {
      case 'Active': return 'success';
      case 'Growing': return 'info';
      case 'Harvesting': return 'warning';
      case 'Planning': return 'default';
      default: return 'default';
    }
  };

  const formatCurrency = (amount) => {
    const symbol = currencySymbols[userCurrency] || '₨';
    const safeAmount = amount || 0;
    return `${symbol}${safeAmount.toLocaleString()}`;
  };

  // Calculate stats for overview (only farms, not fields)
  const mockFarms = generateMockFarms();
  const displayFarms = myFarms.length > 0 ? myFarms : mockFarms;
  
  const totalFarms = displayFarms.length;
  const activeFarms = displayFarms.filter(f => f.status === 'Active').length;
  const totalMonthlyRevenue = displayFarms.reduce((sum, farm) => sum + (farm.monthlyRevenue || 0), 0);
  const avgProgress = displayFarms.length > 0 ? 
    Math.round(displayFarms.reduce((sum, farm) => sum + (farm.progress || 0), 0) / displayFarms.length) : 0;

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
              My Farms
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.9rem' }}>
              Monitor and manage your agricultural farm properties with real-time insights
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
            Farm Report
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
                    {totalFarms}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem' }}>
                    Total Farms
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
                    color: '#16a34a',
                    width: 40,
                    height: 40
                  }}
                >
                  <Nature sx={{ fontSize: 20 }} />
                </Avatar>
                <Box>
                  <Typography variant="h5" sx={{ fontWeight: 700, color: '#1e293b', fontSize: '1.5rem' }}>
                    {activeFarms}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem' }}>
                    Active Farms
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
                    backgroundColor: '#ffedd5',
                    color: '#ea580c',
                    width: 40,
                    height: 40
                  }}
                >
                  <TrendingUp sx={{ fontSize: 20 }} />
                </Avatar>
                <Box>
                  <Typography variant="h5" sx={{ fontWeight: 700, color: '#1e293b', fontSize: '1.5rem' }}>
                    {formatCurrency(totalMonthlyRevenue)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem' }}>
                    Monthly Revenue
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
                    backgroundColor: '#e0e7ff',
                    color: '#4f46e5',
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
                    Avg. Progress
                  </Typography>
                </Box>
              </Stack>
            </Paper>
          </Grid>
        </Grid>

        {/* Farms List */}
        <Grid container spacing={3}>
          {displayFarms.map((farm) => (
              <Grid item xs={12} sm={6} md={4} key={farm.id}>
                <Card
                  elevation={0}
                  sx={{
                    height: 450,
                    minHeight: 450,
                    maxHeight: 450,
                    width: '100%',
                    borderRadius: 2,
                    border: '1px solid #e5e7eb',
                    backgroundColor: '#ffffff',
                    transition: 'all 0.2s ease-in-out',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    '&:hover': {
                      boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                      transform: 'translateY(-2px)'
                    }
                  }}
                  onClick={() => handleFarmClick(farm)}
                >
                  <CardContent sx={{ 
                    p: 2.5, 
                    display: 'flex', 
                    flexDirection: 'column', 
                    height: '100%',
                    justifyContent: 'space-between'
                  }}>
                    {/* Top Section */}
                    <Box sx={{ flex: 1 }}>
                      {/* Header with location and menu */}
                      <Stack direction="row" justifyContent="space-between" alignItems="flex-start" mb={1}>
                        <Stack direction="row" alignItems="center" spacing={0.5}>
                          <LocationOn sx={{ fontSize: 16, color: '#6b7280' }} />
                          <Typography variant="body2" color="#6b7280" sx={{ fontSize: '0.875rem' }}>
                            {farm.location}
                          </Typography>
                        </Stack>
                        <IconButton 
                          size="small" 
                          sx={{ 
                            color: '#6b7280',
                            p: 0.5,
                            '&:hover': { backgroundColor: '#f3f4f6' }
                          }}
                          onClick={(e) => {
                            e.stopPropagation();
                            // Handle menu click
                          }}
                        >
                          <MoreVert sx={{ fontSize: 18 }} />
                        </IconButton>
                      </Stack>

                      {/* Status Badge */}
                      <Box sx={{ mb: 2 }}>
                        <Chip 
                          label={farm.status} 
                          size="small"
                          sx={{ 
                            backgroundColor: '#dcfce7',
                            color: '#166534',
                            fontSize: '0.75rem',
                            height: 24,
                            fontWeight: 600,
                            borderRadius: 1
                          }}
                        />
                      </Box>

                      {/* Farm Details in Rows */}
                      <Stack spacing={1.5} mb={2.5}>
                        {/* Crop Type Row */}
                        <Stack direction="row" alignItems="center" spacing={1}>
                          <Park sx={{ fontSize: 16, color: '#10b981' }} />
                          <Typography variant="body2" sx={{ fontWeight: 500, color: '#374151' }}>
                            Crop Type
                          </Typography>
                          <Typography variant="body2" sx={{ fontWeight: 600, color: '#111827', ml: 'auto' }}>
                            {farm.cropType}
                          </Typography>
                        </Stack>

                        {/* Area Row */}
                        <Stack direction="row" alignItems="center" spacing={1}>
                          <Terrain sx={{ fontSize: 16, color: '#8b5cf6' }} />
                          <Typography variant="body2" sx={{ fontWeight: 500, color: '#374151' }}>
                            Area
                          </Typography>
                          <Typography variant="body2" sx={{ fontWeight: 600, color: '#111827', ml: 'auto' }}>
                            {farm.area}
                          </Typography>
                        </Stack>

                        {/* Soil Type Row */}
                        <Stack direction="row" alignItems="center" spacing={1}>
                          <Nature sx={{ fontSize: 16, color: '#f59e0b' }} />
                          <Typography variant="body2" sx={{ fontWeight: 500, color: '#374151' }}>
                            Soil Type
                          </Typography>
                          <Typography variant="body2" sx={{ fontWeight: 600, color: '#111827', ml: 'auto' }}>
                            {farm.soilType}
                          </Typography>
                        </Stack>

                        {/* Irrigation Row */}
                        <Stack direction="row" alignItems="center" spacing={1}>
                          <WaterDrop sx={{ fontSize: 16, color: '#3b82f6' }} />
                          <Typography variant="body2" sx={{ fontWeight: 500, color: '#374151' }}>
                            Irrigation
                          </Typography>
                          <Typography variant="body2" sx={{ fontWeight: 600, color: '#111827', ml: 'auto' }}>
                            {farm.irrigationType}
                          </Typography>
                        </Stack>
                      </Stack>

                      {/* Progress Section */}
                      <Box sx={{ mb: 2.5 }}>
                        <Typography variant="body2" sx={{ fontWeight: 500, color: '#374151', mb: 1.5 }}>
                          Progress
                        </Typography>
                        <LinearProgress 
                          variant="determinate" 
                          value={farm.progress} 
                          sx={{
                            height: 8,
                            borderRadius: 4,
                            backgroundColor: '#e5e7eb',
                            '& .MuiLinearProgress-bar': {
                              backgroundColor: '#3b82f6',
                              borderRadius: 4
                            }
                          }}
                        />
                        <Typography variant="body2" sx={{ fontWeight: 600, color: '#111827', mt: 0.5, textAlign: 'right' }}>
                          {farm.progress}%
                        </Typography>
                      </Box>
                    </Box>

                    {/* Bottom Section */}
                    <Box>
                      {/* Revenue */}
                      <Typography variant="h6" sx={{ fontWeight: 700, color: '#111827', mb: 2.5 }}>
                        {formatCurrency(farm.monthlyRevenue)}
                        <Typography component="span" variant="body2" sx={{ color: '#6b7280', fontWeight: 400 }}>
                          /month
                        </Typography>
                      </Typography>

                      {/* Action Buttons */}
                       <Stack direction="row" spacing={1.5}>
                         <Button
                           variant="outlined"
                           size="small"
                           startIcon={<Visibility />}
                           sx={{
                             flex: 1,
                             borderColor: '#d1d5db',
                             color: '#374151',
                             fontSize: '0.75rem',
                             py: 1,
                             px: 1.5,
                             minHeight: 36,
                             '&:hover': {
                               borderColor: '#9ca3af',
                               backgroundColor: '#f9fafb'
                             }
                           }}
                           onClick={(e) => {
                             e.stopPropagation();
                             handleFarmClick(farm);
                           }}
                         >
                           View Details
                         </Button>
                         <Button
                           variant="contained"
                           size="small"
                           startIcon={<Settings />}
                           sx={{
                             flex: 1,
                             backgroundColor: '#10b981',
                             fontSize: '0.75rem',
                             py: 1,
                             px: 1.5,
                             minHeight: 36,
                             '&:hover': {
                               backgroundColor: '#059669'
                             }
                           }}
                           onClick={(e) => {
                             e.stopPropagation();
                             // Handle manage click
                           }}
                         >
                           Manage
                         </Button>
                       </Stack>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
        </Grid>

        {/* Farm Detail Modal */}
        <Dialog
          open={farmDetailOpen}
          onClose={handleCloseFarmDetail}
          maxWidth="md"
          fullWidth
          PaperProps={{
            sx: {
              borderRadius: 3,
              maxHeight: '90vh'
            }
          }}
        >
          <DialogTitle sx={{ pb: 1 }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Box>
                <Typography variant="h5" sx={{ fontWeight: 700, color: '#1e293b' }}>
                  {selectedFarm?.name}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Farm Details & Affiliated Fields
                </Typography>
              </Box>
              <IconButton onClick={handleCloseFarmDetail} sx={{ color: '#64748b' }}>
                <Close />
              </IconButton>
            </Stack>
          </DialogTitle>
          <DialogContent>
            {selectedFarm && (
              <Box>
                {/* Farm Image */}
                

                {/* Farm Information */}
                <Grid container spacing={3} mb={3}>
                  <Grid item xs={12} md={6}>
                    <Paper sx={{ p: 2, backgroundColor: '#f8fafc', borderRadius: 2, minHeight: '80px', display: 'flex', flexDirection: 'column' }}>
                      <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, color: '#1e293b' }}>
                        Farm Information
                      </Typography>
                      <Stack spacing={1.5} sx={{ flex: 1 }}>
                        <Stack direction="row" alignItems="center" spacing={1}>
                          <LocationOn sx={{ fontSize: 18, color: '#3b82f6' }} />
                          <Typography variant="body2">{selectedFarm.location}</Typography>
                        </Stack>
                        <Stack direction="row" alignItems="center" spacing={1}>
                          <Park sx={{ fontSize: 18, color: '#10b981' }} />
                          <Typography variant="body2">{selectedFarm.cropType}</Typography>
                        </Stack>
                        <Stack direction="row" alignItems="center" spacing={1}>
                          <Terrain sx={{ fontSize: 18, color: '#8b5cf6' }} />
                          <Typography variant="body2">{selectedFarm.area} • {selectedFarm.soilType}</Typography>
                        </Stack>
                        <Stack direction="row" alignItems="center" spacing={1}>
                          <WaterDrop sx={{ fontSize: 18, color: '#06b6d4' }} />
                          <Typography variant="body2">{selectedFarm.irrigationType}</Typography>
                        </Stack>
                      </Stack>
                    </Paper>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Paper sx={{ p: 2, backgroundColor: '#f0fdf4', borderRadius: 2, minHeight: '80px', display: 'flex', flexDirection: 'column' }}>
                      <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, color: '#1e293b' }}>
                        Performance Metrics
                      </Typography>
                      <Stack spacing={2.5} sx={{ flex: 1, justifyContent: 'space-between' }}>
                        <Box>
                          <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1}>
                            <Typography variant="body2" color="text.secondary">Progress</Typography>
                            <Typography variant="body2" sx={{ fontWeight: 700 }}>{selectedFarm.progress}%</Typography>
                          </Stack>
                          <LinearProgress 
                            variant="determinate" 
                            value={selectedFarm.progress} 
                            sx={{
                              height: 8,
                              borderRadius: 4,
                              backgroundColor: '#e2e8f0',
                              '& .MuiLinearProgress-bar': {
                                backgroundColor: '#10b981',
                                borderRadius: 4
                              }
                            }}
                          />
                        </Box>
                        <Stack direction="row" justifyContent="space-between">
                          <Typography variant="body2" color="text.secondary">Monthly Revenue</Typography>
                          <Typography variant="body1" sx={{ fontWeight: 700, color: '#10b981' }}>
                            {formatCurrency(selectedFarm.monthlyRevenue)}
                          </Typography>
                        </Stack>
                        <Stack direction="row" justifyContent="space-between">
                          <Typography variant="body2" color="text.secondary">Status</Typography>
                          <Chip 
                            label={selectedFarm.status} 
                            color={getStatusColor(selectedFarm.status)}
                            size="small"
                            sx={{ fontWeight: 600 }}
                          />
                        </Stack>
                      </Stack>
                    </Paper>
                  </Grid>
                </Grid>

                {/* Affiliated Fields */}
                <Box sx={{ mt: 3 }}>
                  <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, color: '#1e293b' }}>
                    Affiliated Fields
                  </Typography>
                  <Grid container spacing={2}>
                    {/* Show fields associated with this farm */}
                    {myFields.filter(field => field.farmId === selectedFarm?.id || field.farm_id === selectedFarm?.id).length > 0 ? (
                      myFields
                        .filter(field => field.farmId === selectedFarm?.id || field.farm_id === selectedFarm?.id)
                        .map((field) => (
                          <Grid item xs={12} sm={6} md={4} key={field.id}>
                            <Card 
                              sx={{ 
                                height: 220,
                                minHeight: 220,
                                maxHeight: 220,
                                width: '195px',
                                borderRadius: 2,
                                border: '1px solid #e5e7eb',
                                backgroundColor: '#ffffff',
                                transition: 'all 0.2s ease-in-out',
                                '&:hover': {
                                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                                  transform: 'translateY(-2px)'
                                }
                              }}
                            >
                              <CardContent sx={{ 
                                p: 2, 
                                height: '100%',
                                display: 'flex',
                                flexDirection: 'column',
                                justifyContent: 'space-between'
                              }}>
                                <Box sx={{ flex: 1 }}>
                                  {/* Field Header */}
                                  <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1}>
                                    <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#111827', fontSize: '0.9rem' }}>
                                      {field.name}
                                    </Typography>
                                    <Chip 
                                      label={field.status} 
                                      size="small"
                                      sx={{ 
                                        backgroundColor: '#dcfce7',
                                        color: '#166534',
                                        fontSize: '0.7rem',
                                        height: 20,
                                        fontWeight: 600
                                      }}
                                    />
                                  </Stack>

                                  {/* Field Details */}
                                  <Stack spacing={0.5} mb={1.5}>
                                    <Stack direction="row" alignItems="center" spacing={1}>
                                      <Park sx={{ fontSize: 14, color: '#10b981' }} />
                                      <Typography variant="body2" sx={{ fontSize: '0.8rem', color: '#6b7280' }}>
                                        {field.cropType}
                                      </Typography>
                                    </Stack>
                                    <Stack direction="row" alignItems="center" spacing={1}>
                                      <Terrain sx={{ fontSize: 14, color: '#8b5cf6' }} />
                                      <Typography variant="body2" sx={{ fontSize: '0.8rem', color: '#6b7280' }}>
                                        {field.area}
                                      </Typography>
                                    </Stack>
                                    <Stack direction="row" alignItems="center" spacing={1}>
                                      <Nature sx={{ fontSize: 14, color: '#f59e0b' }} />
                                      <Typography variant="body2" sx={{ fontSize: '0.8rem', color: '#6b7280' }}>
                                        {field.soilType}
                                      </Typography>
                                    </Stack>
                                  </Stack>

                                  {/* Field Progress */}
                                  <Box sx={{ mb: 1 }}>
                                    <LinearProgress 
                                      variant="determinate" 
                                      value={field.progress} 
                                      sx={{
                                        height: 6,
                                        borderRadius: 3,
                                        backgroundColor: '#e5e7eb',
                                        '& .MuiLinearProgress-bar': {
                                          backgroundColor: '#3b82f6',
                                          borderRadius: 3
                                        }
                                      }}
                                    />
                                    <Typography variant="caption" sx={{ color: '#6b7280', fontSize: '0.7rem' }}>
                                      {field.progress}% Complete
                                    </Typography>
                                  </Box>
                                </Box>

                                {/* Field Revenue */}
                                <Typography variant="body2" sx={{ fontWeight: 600, color: '#10b981', fontSize: '0.85rem', marginBottom: '30px' }}>
                                  {formatCurrency(field.monthlyRevenue)}/month
                                </Typography>
                              </CardContent>
                            </Card>
                          </Grid>
                        ))
                    ) : (
                      // Show mock fields if no real fields are associated
                      selectedFarm?.fields?.map((field) => (
                        <Grid item xs={12} sm={6} md={4} key={field.id}>
                          <Card 
                            sx={{ 
                              height: 280,
                              minHeight: 280,
                              maxHeight: 280,
                              width: '100%',
                              borderRadius: 2,
                              border: '1px solid #e5e7eb',
                              backgroundColor: '#ffffff',
                              transition: 'all 0.2s ease-in-out',
                              '&:hover': {
                                boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                                transform: 'translateY(-2px)'
                              }
                            }}
                          >
                            <CardContent sx={{ 
                              p: 2, 
                              height: '100%',
                              display: 'flex',
                              flexDirection: 'column',
                              justifyContent: 'space-between'
                            }}>
                              <Box sx={{ flex: 1 }}>
                                {/* Field Header */}
                                <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1}>
                                  <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#111827', fontSize: '0.9rem' }}>
                                    {field.name}
                                  </Typography>
                                  <Chip 
                                    label={field.status} 
                                    size="small"
                                    sx={{ 
                                      backgroundColor: '#dcfce7',
                                      color: '#166534',
                                      fontSize: '0.7rem',
                                      height: 20,
                                      fontWeight: 600
                                    }}
                                  />
                                </Stack>

                                {/* Field Details */}
                                <Stack spacing={0.5} mb={1.5}>
                                  <Stack direction="row" alignItems="center" spacing={1}>
                                    <Park sx={{ fontSize: 14, color: '#10b981' }} />
                                    <Typography variant="body2" sx={{ fontSize: '0.8rem', color: '#6b7280' }}>
                                      {field.crop}
                                    </Typography>
                                  </Stack>
                                  <Stack direction="row" alignItems="center" spacing={1}>
                                    <Terrain sx={{ fontSize: 14, color: '#8b5cf6' }} />
                                    <Typography variant="body2" sx={{ fontSize: '0.8rem', color: '#6b7280' }}>
                                      {field.area}
                                    </Typography>
                                  </Stack>
                                </Stack>

                                {/* Field Progress */}
                                <Box sx={{ mb: 1 }}>
                                  <LinearProgress 
                                    variant="determinate" 
                                    value={75} 
                                    sx={{
                                      height: 6,
                                      borderRadius: 3,
                                      backgroundColor: '#e5e7eb',
                                      '& .MuiLinearProgress-bar': {
                                        backgroundColor: '#3b82f6',
                                        borderRadius: 3
                                      }
                                    }}
                                  />
                                  <Typography variant="caption" sx={{ color: '#6b7280', fontSize: '0.7rem' }}>
                                    75% Complete
                                  </Typography>
                                </Box>
                              </Box>

                              {/* Field Revenue */}
                              <Typography variant="body2" sx={{ fontWeight: 600, color: '#10b981', fontSize: '0.85rem' }}>
                                {formatCurrency(Math.floor(Math.random() * 3000) + 1000)}/month
                              </Typography>
                            </CardContent>
                          </Card>
                        </Grid>
                      )) || (
                        <Grid item xs={12}>
                          <Paper sx={{ p: 3, textAlign: 'center', backgroundColor: '#f9fafb', borderRadius: 2 }}>
                            <Typography variant="body2" color="text.secondary">
                              No fields associated with this farm yet.
                            </Typography>
                          </Paper>
                        </Grid>
                      )
                    )}
                  </Grid>
                </Box>

                {/* Farm Description */}
                {selectedFarm.description && (
                  <Box sx={{ mt: 3 }}>
                    <Typography variant="h6" sx={{ fontWeight: 600, mb: 1, color: '#1e293b' }}>
                      Description
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6 }}>
                      {selectedFarm.description}
                    </Typography>
                  </Box>
                )}
              </Box>
            )}
          </DialogContent>
          <DialogActions sx={{ p: 3, pt: 1 }}>
            <Button onClick={handleCloseFarmDetail} sx={{ color: '#64748b' }}>
              Close
            </Button>
            <Button variant="contained" sx={{ backgroundColor: '#3b82f6', '&:hover': { backgroundColor: '#2563eb' } }}>
              Manage Farm
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Box>
  );
};

export default MyFarms;