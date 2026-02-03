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
  TableContainer,
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
  LinearProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Pagination
} from '@mui/material';
import {
  LocationOn,
  CalendarToday,
  Agriculture,
  TrendingUp,
  Visibility,
  Assessment,
  Schedule,
  Close,
  Download,
  Description,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import storageService from '../services/storage';
import { orderService } from '../services/orders';

const RentedFields = () => {
  // Get current user from AuthContext
  const { user } = useAuth();
  const [rentedFields, setRentedFields] = useState([]);
  const [userCurrency, setUserCurrency] = useState('USD');
  const [loading, setLoading] = useState(true);
  const [selectedField, setSelectedField] = useState(null);
  const [fieldDetailOpen, setFieldDetailOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(8);
  const [showAllFields, setShowAllFields] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);

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
          const orders = Array.isArray(response.data) ? response.data : (response.data?.orders || []);
          const byField = new Map();
          orders.forEach((order) => {
            const fid = order.field_id;
            if (!fid) return;
            const prev = byField.get(fid) || { quantity: 0, total_price: 0, selected_harvests: [], shipping_modes: [] };
            const qtyRaw = order.quantity ?? order.area_rented ?? order.area ?? 0;
            const qty = typeof qtyRaw === 'string' ? parseFloat(qtyRaw) : qtyRaw;
            byField.set(fid, {
              field_id: fid,
              id: fid,
              name: order.field_name,
              location: order.location,
              cropType: order.crop_type,
              total_area: order.total_area,
              price_per_m2: order.price_per_m2,
              image_url: order.image_url,
              farmer_name: order.farmer_name,
              created_at: order.created_at,
              status: order.status === 'pending' ? 'Pending' : 'Active',
              selected_harvest_date: order.selected_harvest_date || calculateHarvestDate(order.created_at, order.crop_type),
              selected_harvest_label: order.selected_harvest_label || null,
              selected_harvests: (() => {
                const listPrev = Array.isArray(prev.selected_harvests) ? prev.selected_harvests : [];
                const shDate = order.selected_harvest_date || null;
                const shLabel = order.selected_harvest_label || null;
                const item = { date: shDate, label: shLabel };
                const added = (item.date || item.label) ? [...listPrev, item] : listPrev;
                const s = new Set();
                return added.filter(it => {
                  const d = (() => { if (!it?.date) return ''; try { const nd = new Date(it.date); if (!isNaN(nd.getTime())) return nd.toISOString().split('T')[0]; } catch { } return typeof it.date === 'string' ? it.date : ''; })();
                  const k = `${d}|${(it?.label || '').trim().toLowerCase()}`;
                  if (s.has(k)) return false; s.add(k); return true;
                });
              })(),
              shipping_modes: (() => {
                const prevModes = Array.isArray(prev.shipping_modes) ? prev.shipping_modes : [];
                const m = (order.mode_of_shipping || order.shipping_method || '').trim();
                const canon = m.toLowerCase() === 'pickup' ? 'Pickup' : (m.toLowerCase() === 'delivery' ? 'Delivery' : (m ? m : null));
                const added = canon ? [...prevModes, canon] : prevModes;
                const set = new Set();
                return added.filter(x => { const k = (x || '').toLowerCase(); if (set.has(k)) return false; set.add(k); return true; });
              })(),
              quantity: (prev.quantity || 0) + qty,
              total_price: (prev.total_price || 0) + (order.total_price || 0)
            });
          });
          const aggregated = Array.from(byField.values()).map(f => ({
            ...f,
            area: `${f.quantity}m²`,
            available_area: Math.max(0, (typeof f.total_area === 'string' ? parseFloat(f.total_area) : (f.total_area || 0)) - (f.quantity || 0)),
            monthlyRent: convertCurrency(f.total_price || 0, 'USD', userCurrency),
            progress: Math.floor(Math.random() * 100) + 1,
            rentPeriod: calculateRentPeriod(f.created_at)
          }));
          setRentedFields(aggregated);
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
            // No fallback to mock data - just set empty array if no data
            setRentedFields([]);
          }
        }
      } catch (error) {
        console.error('Error loading rented fields:', error);
      } finally {
        setLoading(false);
      }
    };

    loadRentedFields();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, userCurrency]);


  const getStatusColor = (status) => {
    switch (status) {
      case 'Active': return 'success';
      case 'Completed': return 'primary';
      case 'Pending': return 'warning';
      default: return 'default';
    }
  };

  // Handle field detail modal
  const handleFieldClick = (field) => {
    setSelectedField(field);
    setFieldDetailOpen(true);
  };

  const handleCloseFieldDetail = () => {
    setFieldDetailOpen(false);
    setSelectedField(null);
  };

  // Pagination logic
  const totalPages = Math.ceil(rentedFields.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const displayedFields = showAllFields ? rentedFields : rentedFields.slice(startIndex, endIndex);

  const handlePageChange = (event, value) => {
    setCurrentPage(value);
    // Scroll to top of fields grid
    window.scrollTo({ top: 530, behavior: 'smooth' });
  };

  const handleViewAllClick = () => {
    setShowAllFields(!showAllFields);
    setCurrentPage(1);
  };

  // Field Report functionality
  const handleReportClick = () => {
    setReportOpen(true);
  };

  const handleCloseReport = () => {
    setReportOpen(false);
  };

  const handleDownloadReport = (format = 'pdf') => {
    // Generate report data
    const reportData = {
      generatedAt: new Date().toLocaleString(),
      totalFields: rentedFields.length,
      activeFields: rentedFields.filter(f => f.status === 'Active').length,
      totalMonthlyRent: totalMonthlyRent,
      avgProgress: avgProgress,
      fields: rentedFields.map(field => ({
        name: field.name || field.farmName,
        location: field.location,
        cropType: field.cropType,
        area: field.area,
        monthlyRent: field.monthlyRent,
        progress: field.progress,
        status: field.status
      }))
    };

    if (format === 'csv') {
      // Generate CSV
      const headers = ['Field Name', 'Location', 'Crop Type', 'Area', 'Monthly Rent', 'Occupied Area', 'Status'];
      const rows = reportData.fields.map(f => [
        f.name,
        f.location,
        f.cropType,
        f.area,
        `${currencySymbols[userCurrency]}${(parseFloat(f.monthlyRent) || 0).toFixed(2)}`,
        `${f.progress}%`,
        f.status
      ]);

      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `rented-fields-report-${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      // Generate PDF using browser print functionality
      const printWindow = window.open('', '_blank');
      const reportHTML = `
        <!DOCTYPE html>
        <html>
          <head>
            <title>Rented Fields Report</title>
            <style>
              body {
                font-family: Arial, sans-serif;
                padding: 20px;
                color: #333;
              }
              h1 {
                color: #1e293b;
                border-bottom: 2px solid #4caf50;
                padding-bottom: 10px;
              }
              h2 {
                color: #059669;
                margin-top: 30px;
              }
              .summary {
                display: grid;
                grid-template-columns: repeat(4, 1fr);
                gap: 15px;
                margin: 20px 0;
              }
              .summary-card {
                background: #f8fafc;
                padding: 15px;
                border-radius: 8px;
                text-align: center;
                border: 1px solid #e2e8f0;
              }
              .summary-value {
                font-size: 24px;
                font-weight: bold;
                color: #1e293b;
                margin-bottom: 5px;
              }
              .summary-label {
                font-size: 12px;
                color: #64748b;
              }
              table {
                width: 100%;
                border-collapse: collapse;
                margin-top: 20px;
              }
              th {
                background-color: #4caf50;
                color: white;
                padding: 12px;
                text-align: left;
                font-weight: bold;
              }
              td {
                padding: 10px;
                border-bottom: 1px solid #e2e8f0;
              }
              tr:nth-child(even) {
                background-color: #f8fafc;
              }
              .footer {
                margin-top: 30px;
                padding-top: 20px;
                border-top: 1px solid #e2e8f0;
                font-size: 12px;
                color: #64748b;
                text-align: center;
              }
              @media print {
                body { margin: 0; padding: 15px; }
                .no-print { display: none; }
              }
            </style>
          </head>
          <body>
            <h1>Rented Fields Report</h1>
            <p><strong>Generated:</strong> ${reportData.generatedAt}</p>
            
            <div class="summary">
              <div class="summary-card">
                <div class="summary-value">${reportData.totalFields}</div>
                <div class="summary-label">Total Fields</div>
              </div>
              <div class="summary-card">
                <div class="summary-value">${reportData.activeFields}</div>
                <div class="summary-label">Active Rentals</div>
              </div>
              <div class="summary-card">
                <div class="summary-value">${reportData.avgProgress}%</div>
                <div class="summary-label">Avg Occupied Area</div>
              </div>
              <div class="summary-card">
                <div class="summary-value">${currencySymbols[userCurrency]}${totalMonthlyRent.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                <div class="summary-label">Monthly Revenue</div>
              </div>
            </div>

            <h2>Fields Summary</h2>
            <table>
              <thead>
                <tr>
                  <th>Field Name</th>
                  <th>Location</th>
                  <th>Crop Type</th>
                  <th>Area</th>
                  <th>Monthly Rent</th>
                  <th>Occupied Area</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                ${reportData.fields.map(field => `
                  <tr>
                    <td>${field.name}</td>
                    <td>${field.location}</td>
                    <td>${field.cropType}</td>
                    <td>${field.area}</td>
                    <td>${currencySymbols[userCurrency]}${(parseFloat(field.monthlyRent) || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                    <td>${field.progress}%</td>
                    <td>${field.status}</td>
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
            onClick={handleReportClick}
            sx={{
              backgroundColor: '#4caf50',
              '&:hover': { backgroundColor: '#059669' },
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
        <Box sx={{
          display: 'grid',
          gridTemplateColumns: {
            xs: '1fr',
            sm: 'repeat(2, 1fr)',
            lg: 'repeat(3, 1fr)'
          },
          gap: 2,
          alignItems: 'stretch',
          width: '100%'
        }}>
          {displayedFields.map((field) => (
            <Card
              key={field.id}
              elevation={0}
              sx={{
                height: 420, // Fixed height for consistency
                minWidth: 0, // Prevent overflow
                maxWidth: '100%', // Ensure it doesn't exceed grid cell
                width: '100%', // Full width of grid cell
                borderRadius: 2,
                border: '1px solid #e2e8f0',
                bgcolor: 'white',
                transition: 'all 0.3s ease',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden', // Prevent content overflow
                '&:hover': {
                  transform: 'translateY(-2px)',
                  boxShadow: '0 8px 16px rgba(0,0,0,0.08)',
                  borderColor: '#3b82f6'
                }
              }}
            >
              <CardContent sx={{
                p: 0,
                '&:last-child': { pb: 0 },
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                minWidth: 0, // Prevent overflow
                width: '100%'
              }}>
                {/* Card Header */}
                <Box sx={{ p: 2, pb: 1.5, minWidth: 0, width: '100%', boxSizing: 'border-box' }}>
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
                <Box sx={{ p: 2, py: 1.5, flex: 1, minWidth: 0, width: '100%', boxSizing: 'border-box' }}>
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
                        {(() => {
                          const items = Array.isArray(field.selected_harvests) ? field.selected_harvests : [];
                          const format = (date) => {
                            if (!date) return '';
                            if (typeof date === 'string' && /\d{1,2}\s\w{3}\s\d{4}/.test(date)) return date;
                            const d = new Date(date);
                            if (isNaN(d.getTime())) return date;
                            return d.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
                          };
                          if (items.length) {
                            const mapped = items.map(it => {
                              const dt = format(it.date);
                              if (it.label && dt) return `${dt} (${it.label})`;
                              if (dt) return dt;
                              if (it.label) return it.label;
                              return '';
                            }).filter(Boolean);
                            const uniq = Array.from(new Set(mapped));
                            return uniq.join(', ');
                          }
                          return field.selected_harvest_label || field.selected_harvest_date || 'Not specified';
                        })()}
                      </Typography>
                    </Box>

                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="#f59e0b" style={{ marginRight: 6 }}><path d="M20 8h-3V4H7v4H4v12h16V8zm-9 0V6h2v2h-2zm9 10H4v-8h16v8z" /></svg>
                        <Typography variant="body2" sx={{ color: '#64748b', fontWeight: 500, fontSize: '0.8rem' }}>
                          Mode of Shipping
                        </Typography>
                      </Box>
                      <Typography variant="body2" sx={{ fontWeight: 600, color: '#1a202c', fontSize: '0.8rem' }}>
                        {(() => {
                          const modes = Array.isArray(field.shipping_modes) ? field.shipping_modes : [];
                          const uniq = (() => { const s = new Set(); return modes.filter(m => { const k = (m || '').toLowerCase(); if (s.has(k)) return false; s.add(k); return true; }); })();
                          return uniq.length ? uniq.join(', ') : 'Not specified';
                        })()}
                      </Typography>
                    </Box>

                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="body2" sx={{ color: '#64748b', fontWeight: 500, fontSize: '0.8rem' }}>
                        Occupied: {field.area}
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600, color: '#1a202c', fontSize: '0.8rem' }}>
                        {field.available_area}m² available
                      </Typography>
                    </Box>

                    {/* Progress Bar */}
                    <Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                        <Typography variant="body2" sx={{ color: '#64748b', fontWeight: 500, fontSize: '0.8rem' }}>
                          Occupied Area
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
                <Box sx={{ p: 2, pt: 1.5, mt: 'auto', minWidth: 0, width: '100%', boxSizing: 'border-box' }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography
                      variant="h5"
                      sx={{
                        fontWeight: 700,
                        color: '#059669',
                        fontSize: '1.25rem'
                      }}
                    >
                      {currencySymbols[userCurrency]}{(() => {
                        const amount = parseFloat(field.monthlyRent) || 0;
                        return amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                      })()}
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#64748b', fontWeight: 500, fontSize: '0.8rem' }}>
                      /month
                    </Typography>
                  </Box>

                  <Button
                    variant="contained"
                    fullWidth
                    size="small"
                    startIcon={<Visibility />}
                    onClick={() => handleFieldClick(field)}
                    sx={{
                      borderRadius: 1.5,
                      textTransform: 'none',
                      fontWeight: 600,
                      fontSize: '0.75rem',
                      bgcolor: '#4caf50',
                      py: 0.75,
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
        {rentedFields.length > itemsPerPage && (
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, mt: 4 }}>
            {!showAllFields ? (
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
                  Showing {startIndex + 1}-{Math.min(endIndex, rentedFields.length)} of {rentedFields.length} fields
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
                  View All Fields ({rentedFields.length})
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
      </Box>

      {/* Field Detail Modal */}
      <Dialog
        open={fieldDetailOpen}
        onClose={handleCloseFieldDetail}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            maxHeight: '90vh'
          }
        }}
      >
        <DialogTitle sx={{ pb: 2, borderBottom: '1px solid #e2e8f0' }}>
          <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
            <Box sx={{ flex: 1 }}>
              <Typography variant="h5" sx={{ fontWeight: 700, color: '#1e293b', mb: 0.5 }}>
                {selectedField?.name || selectedField?.farmName}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
                Rented Field Details
              </Typography>
              {selectedField?.status && (
                <Chip
                  label={selectedField.status}
                  color={getStatusColor(selectedField.status)}
                  size="small"
                  sx={{
                    fontWeight: 600,
                    height: 24,
                    fontSize: '0.7rem'
                  }}
                />
              )}
            </Box>
            <IconButton
              onClick={handleCloseFieldDetail}
              sx={{
                color: '#64748b',
                '&:hover': { backgroundColor: '#f3f4f6' }
              }}
            >
              <Close />
            </IconButton>
          </Stack>
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          {selectedField && (
            <Box>
              {/* Field Information Section */}
              <Paper sx={{ p: 2.5, backgroundColor: '#f8fafc', borderRadius: 2, mb: 2.5 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2, color: '#1e293b', fontSize: '0.95rem' }}>
                  Field Information
                </Typography>
                <Stack spacing={2}>
                  <Stack direction="row" alignItems="flex-start" spacing={1.5}>
                    <LocationOn sx={{ fontSize: 20, color: '#3b82f6', mt: 0.25 }} />
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 500, display: 'block', mb: 0.25 }}>
                        Location
                      </Typography>
                      <Typography variant="body2" sx={{ color: '#1e293b', fontWeight: 500 }}>
                        {selectedField.location}
                      </Typography>
                    </Box>
                  </Stack>

                  <Stack direction="row" alignItems="flex-start" spacing={1.5}>
                    <Agriculture sx={{ fontSize: 20, color: '#10b981', mt: 0.25 }} />
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 500, display: 'block', mb: 0.25 }}>
                        Crop Type
                      </Typography>
                      <Typography variant="body2" sx={{ color: '#1e293b', fontWeight: 500 }}>
                        {selectedField.cropType}
                      </Typography>
                    </Box>
                  </Stack>

                  <Stack direction="row" alignItems="flex-start" spacing={1.5}>
                    <CalendarToday sx={{ fontSize: 20, color: '#f59e0b', mt: 0.25 }} />
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 500, display: 'block', mb: 0.25 }}>
                        Harvest Date
                      </Typography>
                      <Typography variant="body2" sx={{ color: '#1e293b', fontWeight: 500 }}>
                        {(() => {
                          const items = Array.isArray(selectedField.selected_harvests) ? selectedField.selected_harvests : [];
                          const format = (date) => {
                            if (!date) return '';
                            if (typeof date === 'string' && /\d{1,2}\s\w{3}\s\d{4}/.test(date)) return date;
                            const d = new Date(date);
                            if (isNaN(d.getTime())) return date;
                            return d.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
                          };
                          if (items.length) {
                            const mapped = items.map(it => {
                              const dt = format(it.date);
                              if (it.label && dt) return `${dt} (${it.label})`;
                              if (dt) return dt;
                              if (it.label) return it.label;
                              return '';
                            }).filter(Boolean);
                            const uniq = Array.from(new Set(mapped));
                            return uniq.join(', ') || 'Not specified';
                          }
                          return selectedField.selected_harvest_label || selectedField.selected_harvest_date || 'Not specified';
                        })()}
                      </Typography>
                    </Box>
                  </Stack>

                  <Box sx={{ pt: 1, borderTop: '1px solid #e2e8f0' }}>
                    <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 500, display: 'block', mb: 1 }}>
                      Area Details
                    </Typography>
                    <Stack direction="row" spacing={2} flexWrap="wrap">
                      <Typography variant="body2" sx={{ color: '#64748b' }}>
                        Occupied: <span style={{ fontWeight: 600, color: '#1e293b' }}>{selectedField.area}</span>
                      </Typography>
                      <Typography variant="body2" sx={{ color: '#64748b' }}>
                        Available: <span style={{ fontWeight: 600, color: '#1e293b' }}>{selectedField.available_area}m²</span>
                      </Typography>
                      {selectedField.total_area && (
                        <Typography variant="body2" sx={{ color: '#64748b' }}>
                          Total: <span style={{ fontWeight: 600, color: '#1e293b' }}>{selectedField.total_area}m²</span>
                        </Typography>
                      )}
                    </Stack>
                  </Box>
                </Stack>
              </Paper>

              {/* Rental Details Section */}
              <Paper sx={{ p: 2.5, backgroundColor: '#f0fdf4', borderRadius: 2 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2, color: '#1e293b', fontSize: '0.95rem' }}>
                  Rental Details
                </Typography>
                <Stack spacing={2.5}>
                  <Box>
                    <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1}>
                      <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 500 }}>
                        Occupied Area
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 700, color: '#1e293b' }}>
                        {selectedField.progress}%
                      </Typography>
                    </Stack>
                    <LinearProgress
                      variant="determinate"
                      value={selectedField.progress}
                      sx={{
                        height: 10,
                        borderRadius: 5,
                        backgroundColor: '#e2e8f0',
                        '& .MuiLinearProgress-bar': {
                          backgroundColor: selectedField.progress === 100 ? '#10b981' : selectedField.progress > 50 ? '#3b82f6' : '#f59e0b',
                          borderRadius: 5
                        }
                      }}
                    />
                  </Box>

                  <Divider />

                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 500 }}>
                      Monthly Rent
                    </Typography>
                    <Typography variant="h6" sx={{ fontWeight: 700, color: '#059669' }}>
                      {currencySymbols[userCurrency]}{(() => {
                        const amount = parseFloat(selectedField.monthlyRent) || 0;
                        return amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                      })()}
                    </Typography>
                  </Stack>

                  {selectedField.rentPeriod && (
                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                      <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 500 }}>
                        Rent Period
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600, color: '#1e293b' }}>
                        {selectedField.rentPeriod}
                      </Typography>
                    </Stack>
                  )}

                  {selectedField.farmer_name && (
                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                      <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 500 }}>
                        Farmer
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600, color: '#1e293b' }}>
                        {selectedField.farmer_name}
                      </Typography>
                    </Stack>
                  )}

                  {selectedField.shipping_modes && selectedField.shipping_modes.length > 0 && (
                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                      <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 500 }}>
                        Shipping Mode
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600, color: '#1e293b' }}>
                        {(() => {
                          const modes = Array.isArray(selectedField.shipping_modes) ? selectedField.shipping_modes : [];
                          const uniq = (() => { const s = new Set(); return modes.filter(m => { const k = (m || '').toLowerCase(); if (s.has(k)) return false; s.add(k); return true; }); })();
                          return uniq.length ? uniq.join(', ') : 'Not specified';
                        })()}
                      </Typography>
                    </Stack>
                  )}
                </Stack>
              </Paper>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2.5, pt: 2, borderTop: '1px solid #e2e8f0' }}>
          <Button
            onClick={handleCloseFieldDetail}
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

      {/* Field Report Modal */}
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
                Field Rental Report
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Comprehensive overview of your rented fields
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
                    {totalFields}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total Fields
                  </Typography>
                </Paper>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Paper sx={{ p: 2, backgroundColor: '#f0fdf4', borderRadius: 2, textAlign: 'center' }}>
                  <Typography variant="h4" sx={{ fontWeight: 700, color: '#059669', mb: 0.5 }}>
                    {activeFields}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Active Rentals
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
                    {currencySymbols[userCurrency]}{totalMonthlyRent.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Monthly Revenue
                  </Typography>
                </Paper>
              </Grid>
            </Grid>

            {/* Fields Summary Table */}
            <Paper sx={{ p: 2, backgroundColor: '#f8fafc', borderRadius: 2 }}>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, color: '#1e293b' }}>
                Fields Summary
              </Typography>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 700 }}>Field Name</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Location</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Crop Type</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Area</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Monthly Rent</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Occupied Area</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {rentedFields.map((field) => (
                      <TableRow key={field.id}>
                        <TableCell>{field.name || field.farmName}</TableCell>
                        <TableCell>{field.location}</TableCell>
                        <TableCell>{field.cropType}</TableCell>
                        <TableCell>{field.area}</TableCell>
                        <TableCell>
                          {currencySymbols[userCurrency]}{(() => {
                            const amount = parseFloat(field.monthlyRent) || 0;
                            return amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                          })()}
                        </TableCell>
                        <TableCell>{field.progress}%</TableCell>
                        <TableCell>
                          <Chip
                            label={field.status}
                            color={getStatusColor(field.status)}
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
  );
};

export default RentedFields;
