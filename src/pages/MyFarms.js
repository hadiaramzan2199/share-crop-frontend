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
  Pagination,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TableContainer,
} from '@mui/material';
import {
  LocationOn,
  CalendarToday,
  Agriculture,
  TrendingUp,
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
  Download,
  Description,
} from '@mui/icons-material';
import storageService from '../services/storage';
import fieldsService from '../services/fields';
import farmsService from '../services/farms';
import { useAuth } from '../contexts/AuthContext';
import AddFarmForm from '../components/Forms/AddFarmForm';
import supabase from '../services/supabase';
import { v4 as uuidv4 } from 'uuid';
import { userDocumentsService } from '../services/userDocuments';

const MyFarms = () => {
  const [myFarms, setMyFarms] = useState([]);
  const [myFields, setMyFields] = useState([]);
  const [userCurrency, setUserCurrency] = useState('USD');
  const [selectedFarm, setSelectedFarm] = useState(null);
  const [farmDetailOpen, setFarmDetailOpen] = useState(false);
  const [addFarmOpen, setAddFarmOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(6);
  const [showAllFarms, setShowAllFarms] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
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

  const handleAddFarmOpen = () => setAddFarmOpen(true);
  const handleAddFarmClose = () => setAddFarmOpen(false);
  const handleAddFarmSubmit = async (farmData) => {
    try {
      const newFarm = {
        ...farmData,
        name: farmData.farmName, // key mapping for backend
        owner_id: user.id
      };
      await farmsService.create(newFarm);

      // Handle License Upload
      if (farmData.licenseFile) {
        try {
          const file = farmData.licenseFile;
          const fileExt = file.name.split('.').pop();
          const fileName = `${uuidv4()}-${file.name}`;
          const filePath = `documents/${fileName}`;

          const { error: uploadError } = await supabase.storage
            .from('user-documents')
            .upload(filePath, file);

          if (uploadError) throw uploadError;

          const { data: { publicUrl } } = supabase.storage
            .from('user-documents')
            .getPublicUrl(filePath);

          await userDocumentsService.addDocument({
            user_id: user.id,
            file_name: file.name,
            file_url: publicUrl,
            file_type: fileExt
          });

          console.log('License uploaded successfully');
        } catch (uploadErr) {
          console.error('Error uploading license:', uploadErr);
        }
      }

      await fetchFarms();
    } catch (error) {
      setMyFarms(prev => [{
        id: farmData.id || Date.now(),
        name: farmData.farmName,
        location: farmData.location || 'Not specified',
        cropType: 'Mixed',
        plantingDate: new Date().toISOString(),
        harvestDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
        progress: 0,
        area: 'Not specified',
        soilType: 'Loamy',
        irrigationType: 'Drip Irrigation',
        monthlyRevenue: 0,
        status: 'Active',
        image: '/api/placeholder/400/200',
        description: farmData.description || '',
        fields: []
      }, ...prev]);
    }
    setAddFarmOpen(false);
  };


  // Check for URL params to auto-open modal
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('action') === 'add-farm') {
      setAddFarmOpen(true);
      // Clean up URL without refreshing
      const newUrl = window.location.pathname;
      window.history.replaceState({}, '', newUrl);
    }
  }, []);

  const fetchFarms = async () => {
    try {
      // Fetch only farms owned by the current farmer (filtered by owner_id)
      if (!user || !user.id) {
        setMyFarms([]);
        setMyFields([]);
        return;
      }

      const farmsResponse = await farmsService.getAll(user.id);
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
  useEffect(() => { // eslint-disable-line react-hooks/exhaustive-deps
    fetchFarms();
  }, [user?.id]); // Only depend on user.id to prevent excessive refetching

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

  // Farm Report functionality
  const handleReportClick = () => {
    setReportOpen(true);
  };

  const handleCloseReport = () => {
    setReportOpen(false);
  };

  const handleDownloadReport = (format = 'pdf') => {
    const reportData = {
      generatedAt: new Date().toLocaleString(),
      totalFarms: displayFarms.length,
      activeFarms: displayFarms.filter(f => f.status === 'Active').length,
      totalMonthlyRevenue: totalMonthlyRevenue,
      avgProgress: avgProgress,
      farms: displayFarms.map(farm => ({
        name: farm.name,
        location: farm.location,
        cropType: farm.cropType,
        area: farm.area,
        monthlyRevenue: farm.monthlyRevenue,
        progress: farm.progress,
        status: farm.status,
        soilType: farm.soilType,
        irrigationType: farm.irrigationType
      }))
    };

    if (format === 'csv') {
      const headers = ['Farm Name', 'Location', 'Crop Type', 'Area', 'Monthly Revenue', 'Occupied Area', 'Status', 'Soil Type', 'Irrigation'];
      const rows = reportData.farms.map(f => [
        f.name,
        f.location,
        f.cropType,
        f.area,
        `${currencySymbols[userCurrency]}${(parseFloat(f.monthlyRevenue) || 0).toFixed(2)}`,
        `${f.progress}%`,
        f.status,
        f.soilType,
        f.irrigationType
      ]);

      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `farms-report-${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      const printWindow = window.open('', '_blank');
      const reportHTML = `
        <!DOCTYPE html>
        <html>
          <head>
            <title>Farms Report</title>
            <style>
              body { font-family: Arial, sans-serif; padding: 20px; color: #333; }
              h1 { color: #1e293b; border-bottom: 2px solid #4caf50; padding-bottom: 10px; }
              h2 { color: #059669; margin-top: 30px; }
              .summary { display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px; margin: 20px 0; }
              .summary-card { background: #f8fafc; padding: 15px; border-radius: 8px; text-align: center; border: 1px solid #e2e8f0; }
              .summary-value { font-size: 24px; font-weight: bold; color: #1e293b; margin-bottom: 5px; }
              .summary-label { font-size: 12px; color: #64748b; }
              table { width: 100%; border-collapse: collapse; margin-top: 20px; }
              th { background-color: #4caf50; color: white; padding: 12px; text-align: left; font-weight: bold; }
              td { padding: 10px; border-bottom: 1px solid #e2e8f0; }
              tr:nth-child(even) { background-color: #f8fafc; }
              .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0; font-size: 12px; color: #64748b; text-align: center; }
              @media print { body { margin: 0; padding: 15px; } .no-print { display: none; } }
            </style>
          </head>
          <body>
            <h1>Farms Report</h1>
            <p><strong>Generated:</strong> ${reportData.generatedAt}</p>
            <div class="summary">
              <div class="summary-card">
                <div class="summary-value">${reportData.totalFarms}</div>
                <div class="summary-label">Total Farms</div>
              </div>
              <div class="summary-card">
                <div class="summary-value">${reportData.activeFarms}</div>
                <div class="summary-label">Active Farms</div>
              </div>
              <div class="summary-card">
                <div class="summary-value">${reportData.avgProgress}%</div>
                <div class="summary-label">Avg Occupied Area</div>
              </div>
              <div class="summary-card">
                <div class="summary-value">${currencySymbols[userCurrency]}${totalMonthlyRevenue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                <div class="summary-label">Monthly Revenue</div>
              </div>
            </div>
            <h2>Farms Summary</h2>
            <table>
              <thead>
                <tr>
                  <th>Farm Name</th>
                  <th>Location</th>
                  <th>Crop Type</th>
                  <th>Area</th>
                  <th>Monthly Revenue</th>
                  <th>Occupied Area</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                ${reportData.farms.map(farm => `
                  <tr>
                    <td>${farm.name}</td>
                    <td>${farm.location}</td>
                    <td>${farm.cropType}</td>
                    <td>${farm.area}</td>
                    <td>${currencySymbols[userCurrency]}${(parseFloat(farm.monthlyRevenue) || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                    <td>${farm.progress}%</td>
                    <td>${farm.status}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
            <div class="footer">
              <p>This report was generated on ${reportData.generatedAt}</p>
            </div>
            <script>
              window.onload = function() {
                window.print();
                window.onafterprint = function() {
                  window.close();
                };
              };
            </script>
          </body>
        </html>
      `;

      printWindow.document.write(reportHTML);
      printWindow.document.close();
    }
  };

  // Calculate stats for overview (only farms, not fields)
  // Use only API data, no mock data fallback
  const displayFarms = myFarms;

  const totalFarms = displayFarms.length;
  const activeFarms = displayFarms.filter(f => f.status === 'Active').length;
  const totalMonthlyRevenue = displayFarms.reduce((sum, farm) => sum + (farm.monthlyRevenue || 0), 0);
  const avgProgress = displayFarms.length > 0 ?
    Math.round(displayFarms.reduce((sum, farm) => sum + (farm.progress || 0), 0) / displayFarms.length) : 0;

  // Pagination logic (after displayFarms is defined)
  const totalPages = Math.ceil(displayFarms.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const displayedFarms = showAllFarms ? displayFarms : displayFarms.slice(startIndex, endIndex);

  const handlePageChange = (event, value) => {
    setCurrentPage(value);
    window.scrollTo({ top: 400, behavior: 'smooth' });
  };

  const handleViewAllClick = () => {
    setShowAllFarms(!showAllFarms);
    setCurrentPage(1);
  };

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
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              variant="outlined"
              startIcon={<Agriculture />}
              onClick={handleAddFarmOpen}
              sx={{
                backgroundColor: 'rgba(33, 150, 243, 0.1)',
                color: '#2196F3',
                border: '1px solid rgba(33, 150, 243, 0.3)',
                '&:hover': { backgroundColor: 'rgba(33, 150, 243, 0.2)', transform: 'scale(1.05)' },
                transition: 'all 0.2s ease-in-out',
                borderRadius: 2,
                px: 2,
                py: 1
              }}
            >
              Add New Farm
            </Button>
            <Button
              variant="contained"
              startIcon={<Assessment />}
              onClick={handleReportClick}
              sx={{
                backgroundColor: '#4caf50',
                '&:hover': { backgroundColor: '#059669' },
                borderRadius: 2,
                px: 2.5,
                py: 1
              }}
            >
              Farm Report
            </Button>
          </Box>
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
                    Avg. Occupied Area
                  </Typography>
                </Box>
              </Stack>
            </Paper>
          </Grid>
        </Grid>

        {/* Farms List */}
        <Box sx={{
          display: 'grid',
          gridTemplateColumns: {
            xs: '1fr',
            sm: 'repeat(2, 1fr)',
            md: 'repeat(3, 1fr)'
          },
          gap: 3,
          alignItems: 'stretch',
          width: '100%'
        }}>
          {displayedFarms.map((farm) => (
            <Card
              key={farm.id}
              elevation={0}
              sx={{
                height: 450,
                minHeight: 450,
                maxHeight: 450,
                minWidth: 0,
                maxWidth: '100%',
                width: '100%',
                borderRadius: 2,
                border: '1px solid #e5e7eb',
                backgroundColor: '#ffffff',
                transition: 'all 0.2s ease-in-out',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
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
                justifyContent: 'space-between',
                minWidth: 0,
                width: '100%',
                boxSizing: 'border-box'
              }}>
                {/* Top Section */}
                <Box sx={{ flex: 1, minWidth: 0, width: '100%' }}>
                  {/* Header with location and menu */}
                  <Stack direction="row" alignItems="center" spacing={0.5} mb={1}>
                    <LocationOn sx={{ fontSize: 16, color: '#6b7280' }} />
                    <Typography variant="body2" color="#6b7280" sx={{ fontSize: '0.875rem' }}>
                      {farm.location}
                    </Typography>
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

                  {/* Occupied Area Section */}
                  <Box sx={{ mb: 2.5 }}>
                    <Typography variant="body2" sx={{ fontWeight: 500, color: '#374151', mb: 1.5 }}>
                      Occupied Area
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
                <Box sx={{ minWidth: 0, width: '100%' }}>
                  {/* Revenue */}
                  <Typography variant="h6" sx={{ fontWeight: 700, color: '#111827', mb: 2.5 }}>
                    {formatCurrency(farm.monthlyRevenue)}
                    <Typography component="span" variant="body2" sx={{ color: '#6b7280', fontWeight: 400 }}>
                      /month
                    </Typography>
                  </Typography>

                  {/* Action Button */}
                  <Button
                    variant="contained"
                    fullWidth
                    size="small"
                    startIcon={<Visibility />}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleFarmClick(farm);
                    }}
                    sx={{
                      borderRadius: 1.5,
                      textTransform: 'none',
                      fontWeight: 600,
                      fontSize: '0.75rem',
                      bgcolor: '#4caf50',
                      py: 1,
                      '&:hover': {
                        bgcolor: '#059669'
                      }
                    }}
                  >
                    View Details
                  </Button>
                </Box>
              </CardContent>
            </Card>
          ))}
        </Box>

        {/* Pagination Controls */}
        {displayFarms.length > itemsPerPage && (
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, mt: 4 }}>
            {!showAllFarms ? (
              <>
                <Pagination
                  count={totalPages}
                  page={currentPage}
                  onChange={handlePageChange}
                  color="primary"
                  size="large"
                  sx={{
                    '& .MuiPaginationItem-root': {
                      fontSize: '0.9rem',
                      fontWeight: 600
                    }
                  }}
                />
                <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                  Showing {startIndex + 1}-{Math.min(endIndex, displayFarms.length)} of {displayFarms.length} farms
                </Typography>
                <Button
                  variant="outlined"
                  size="medium"
                  onClick={handleViewAllClick}
                  sx={{
                    borderRadius: 2,
                    textTransform: 'none',
                    fontWeight: 600,
                    px: 3,
                    py: 1,
                    borderColor: '#e2e8f0',
                    color: '#64748b',
                    '&:hover': {
                      borderColor: '#3b82f6',
                      color: '#3b82f6',
                      bgcolor: '#f8fafc'
                    }
                  }}
                >
                  View All Farms ({displayFarms.length})
                </Button>
              </>
            ) : (
              <Button
                variant="outlined"
                size="medium"
                onClick={handleViewAllClick}
                sx={{
                  borderRadius: 2,
                  textTransform: 'none',
                  fontWeight: 600,
                  px: 3,
                  py: 1,
                  borderColor: '#e2e8f0',
                  color: '#64748b',
                  '&:hover': {
                    borderColor: '#3b82f6',
                    color: '#3b82f6',
                    bgcolor: '#f8fafc'
                  }
                }}
              >
                Show Paginated View
              </Button>
            )}
          </Box>
        )}

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
          <DialogContent sx={{ mt: 2 }}>
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
                            <Typography variant="body2" color="text.secondary">Occupied Area</Typography>
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

                                  {/* Field Occupied Area */}
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
                                      {field.progress}% Occupied
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

                                {/* Field Occupied Area */}
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
                                    75% Occupied
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
          <DialogActions sx={{ p: 2.5, pt: 2, borderTop: '1px solid #e2e8f0' }}>
            <Button
              onClick={handleCloseFarmDetail}
              variant="outlined"
              sx={{
                borderRadius: 2,
                textTransform: 'none',
                fontWeight: 600,
                px: 3,
                borderColor: '#e2e8f0',
                color: '#64748b',
                '&:hover': {
                  borderColor: '#059669',
                  color: '#059669',
                  bgcolor: '#f0fdf4'
                }
              }}
            >
              Close
            </Button>
          </DialogActions>
        </Dialog>

        {/* Farm Report Modal */}
        <Dialog
          open={reportOpen}
          onClose={handleCloseReport}
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
                  Farms Report
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Comprehensive overview of your farms
                </Typography>
              </Box>
              <IconButton onClick={handleCloseReport} sx={{ color: '#64748b' }}>
                <Close />
              </IconButton>
            </Stack>
          </DialogTitle>
          <DialogContent>
            <Box>
              {/* Summary Statistics */}
              <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={12} sm={6} md={3}>
                  <Paper sx={{ p: 2, backgroundColor: '#f8fafc', borderRadius: 2, textAlign: 'center' }}>
                    <Typography variant="h4" sx={{ fontWeight: 700, color: '#1e293b', mb: 0.5 }}>
                      {totalFarms}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Total Farms
                    </Typography>
                  </Paper>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Paper sx={{ p: 2, backgroundColor: '#f0fdf4', borderRadius: 2, textAlign: 'center' }}>
                    <Typography variant="h4" sx={{ fontWeight: 700, color: '#059669', mb: 0.5 }}>
                      {activeFarms}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Active Farms
                    </Typography>
                  </Paper>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Paper sx={{ p: 2, backgroundColor: '#fef3c7', borderRadius: 2, textAlign: 'center' }}>
                    <Typography variant="h4" sx={{ fontWeight: 700, color: '#d97706', mb: 0.5 }}>
                      {avgProgress}%
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Avg Occupied Area
                    </Typography>
                  </Paper>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Paper sx={{ p: 2, backgroundColor: '#f0fdf4', borderRadius: 2, textAlign: 'center' }}>
                    <Typography variant="h4" sx={{ fontWeight: 700, color: '#059669', mb: 0.5 }}>
                      {formatCurrency(totalMonthlyRevenue)}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Monthly Revenue
                    </Typography>
                  </Paper>
                </Grid>
              </Grid>

              {/* Farms Summary Table */}
              <Paper sx={{ p: 2, backgroundColor: '#f8fafc', borderRadius: 2 }}>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, color: '#1e293b' }}>
                  Farms Summary
                </Typography>
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 700 }}>Farm Name</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>Location</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>Crop Type</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>Area</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>Monthly Revenue</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>Occupied Area</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {displayFarms.map((farm) => (
                        <TableRow key={farm.id}>
                          <TableCell>{farm.name}</TableCell>
                          <TableCell>{farm.location}</TableCell>
                          <TableCell>{farm.cropType}</TableCell>
                          <TableCell>{farm.area}</TableCell>
                          <TableCell>{formatCurrency(farm.monthlyRevenue)}</TableCell>
                          <TableCell>{farm.progress}%</TableCell>
                          <TableCell>
                            <Chip
                              label={farm.status}
                              color={getStatusColor(farm.status)}
                              size="small"
                              sx={{ fontWeight: 600 }}
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Paper>

              <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: 'block' }}>
                Report generated on {new Date().toLocaleString()}
              </Typography>
            </Box>
          </DialogContent>
          <DialogActions sx={{ p: 2, pt: 1, gap: 1 }}>
            <Button
              onClick={() => handleDownloadReport('csv')}
              variant="outlined"
              startIcon={<Download />}
              sx={{ borderRadius: 1.5 }}
            >
              Download CSV
            </Button>
            <Button
              onClick={() => handleDownloadReport('pdf')}
              variant="outlined"
              startIcon={<Description />}
              sx={{ borderRadius: 1.5 }}
            >
              Download PDF
            </Button>
            <Button onClick={handleCloseReport} variant="contained" sx={{ borderRadius: 1.5, bgcolor: '#4caf50', '&:hover': { bgcolor: '#059669' } }}>
              Close
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
      <AddFarmForm open={addFarmOpen} onClose={handleAddFarmClose} onSubmit={handleAddFarmSubmit} />
    </Box>
  );
};

export default MyFarms;
