import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Alert,
  Switch,
  FormControlLabel,
  Chip,
  Avatar,
  Stack,
  Paper,
  Divider,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  CurrencyExchange,
  TrendingUp,
  Update,
  Notifications,
  History,
  AttachMoney,
  Euro,
  CurrencyPound,
  CurrencyYen,
  Settings,
  Refresh,
  CheckCircle,
  Schedule,
} from '@mui/icons-material';
import { authService } from '../services/auth';

const ChangeCurrency = () => {
  // Mock user data since we're using authService
  const user = { name: 'John Doe', email: 'john@example.com' };
  const [currentCurrency, setCurrentCurrency] = useState('USD');
  const [selectedCurrency, setSelectedCurrency] = useState('USD');
  const [autoUpdate, setAutoUpdate] = useState(true);
  const [notifications, setNotifications] = useState(true);
  const [conversionHistory, setConversionHistory] = useState([]);
  const [exchangeRates, setExchangeRates] = useState({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const currencies = [
    { code: 'PKR', name: 'Pakistani Rupee', symbol: '₨', flag: '🇵🇰', icon: <AttachMoney /> },
    { code: 'USD', name: 'US Dollar', symbol: '$', flag: '🇺🇸', icon: <AttachMoney /> },
    { code: 'EUR', name: 'Euro', symbol: '€', flag: '🇪🇺', icon: <Euro /> },
    { code: 'GBP', name: 'British Pound', symbol: '£', flag: '🇬🇧', icon: <CurrencyPound /> },
    { code: 'JPY', name: 'Japanese Yen', symbol: '¥', flag: '🇯🇵', icon: <CurrencyYen /> },
    { code: 'CAD', name: 'Canadian Dollar', symbol: 'C$', flag: '🇨🇦', icon: <AttachMoney /> },
    { code: 'AUD', name: 'Australian Dollar', symbol: 'A$', flag: '🇦🇺', icon: <AttachMoney /> },
    { code: 'CHF', name: 'Swiss Franc', symbol: 'CHF', flag: '🇨🇭', icon: <AttachMoney /> },
  ];

  // Mock exchange rates
  useEffect(() => {
    const mockRates = {
      'PKR': { USD: 0.0036, EUR: 0.0033, GBP: 0.0028, JPY: 0.54, CAD: 0.0049, AUD: 0.0054, CHF: 0.0032 },
      'USD': { PKR: 278.50, EUR: 0.92, GBP: 0.79, JPY: 149.80, CAD: 1.35, AUD: 1.50, CHF: 0.88 },
      'EUR': { PKR: 302.75, USD: 1.09, GBP: 0.86, JPY: 163.20, CAD: 1.47, AUD: 1.63, CHF: 0.96 },
    };
    setExchangeRates(mockRates);

    // Mock conversion history
    const mockHistory = [
      { date: '2024-01-10', from: 'USD', to: 'PKR', amount: 1000, converted: 278500, rate: 278.50 },
      { date: '2024-01-08', from: 'EUR', to: 'PKR', amount: 500, converted: 151375, rate: 302.75 },
      { date: '2024-01-05', from: 'PKR', to: 'USD', amount: 50000, converted: 179.53, rate: 0.0036 },
    ];
    setConversionHistory(mockHistory);
  }, []);

  const handleCurrencyChange = async () => {
    setLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      setCurrentCurrency(selectedCurrency);
      setSuccess(true);
      setLoading(false);
      
      // Hide success message after 3 seconds
      setTimeout(() => setSuccess(false), 3000);
    }, 1000);
  };

  const getCurrentCurrencyInfo = () => {
    return currencies.find(c => c.code === currentCurrency);
  };

  const getSelectedCurrencyInfo = () => {
    return currencies.find(c => c.code === selectedCurrency);
  };

  const getExchangeRate = (from, to) => {
    if (from === to) return 1;
    return exchangeRates[from]?.[to] || 0;
  };

  const formatCurrency = (amount, currencyCode) => {
    const currency = currencies.find(c => c.code === currencyCode);
    return `${currency?.symbol}${amount.toLocaleString()}`;
  };

  return (
    <Box sx={{ 
      minHeight: '100vh',
      backgroundColor: '#f8fafc',
      p: 2
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
              Currency Management
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.9rem' }}>
              Manage your preferred currency and monitor exchange rates
            </Typography>
          </Box>
          <Tooltip title="Refresh Exchange Rates">
            <IconButton
              sx={{
                backgroundColor: '#4caf50',
                color: 'white',
                '&:hover': { backgroundColor: '#45a049' },
                borderRadius: 2,
                p: 1.5
              }}
            >
              <Refresh />
            </IconButton>
          </Tooltip>
        </Stack>

        {/* Success Alert */}
        {success && (
          <Alert 
            severity="success" 
            sx={{ 
              mb: 3,
              borderRadius: 2,
              border: '1px solid #d4edda'
            }}
          >
            Currency updated successfully! All prices will now be displayed in {getSelectedCurrencyInfo()?.name}.
          </Alert>
        )}

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
                  <CurrencyExchange sx={{ fontSize: 20 }} />
                </Avatar>
                <Box>
                  <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem' }}>
                    Current Currency
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 600, fontSize: '1rem' }}>
                    {getCurrentCurrencyInfo()?.code}
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
                  <TrendingUp sx={{ fontSize: 20 }} />
                </Avatar>
                <Box>
                  <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem' }}>
                    Exchange Rates
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 600, fontSize: '1rem' }}>
                    Live Updates
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
                  <History sx={{ fontSize: 20 }} />
                </Avatar>
                <Box>
                  <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem' }}>
                    Conversions
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 600, fontSize: '1rem' }}>
                    {conversionHistory.length}
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
                    backgroundColor: autoUpdate ? '#dcfce7' : '#fee2e2',
                    color: autoUpdate ? '#16a34a' : '#dc2626',
                    width: 40,
                    height: 40
                  }}
                >
                  {autoUpdate ? <CheckCircle sx={{ fontSize: 20 }} /> : <Schedule sx={{ fontSize: 20 }} />}
                </Avatar>
                <Box>
                  <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem' }}>
                    Auto Update
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 600, fontSize: '1rem' }}>
                    {autoUpdate ? 'Enabled' : 'Disabled'}
                  </Typography>
                </Box>
              </Stack>
            </Paper>
          </Grid>
        </Grid>
      </Box>

      {/* Main Content */}
      <Box sx={{ maxWidth: '1400px', mx: 'auto' }}>
        <Grid container spacing={3}>
          {/* Currency Selection */}
          <Grid item xs={12} lg={6}>
            <Card
              elevation={0}
              sx={{
                border: '1px solid #e2e8f0',
                borderRadius: 2,
                backgroundColor: 'white',
                height: 'fit-content'
              }}
            >
              <CardContent sx={{ p: 3 }}>
                <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 3 }}>
                  <Avatar
                    sx={{
                      backgroundColor: '#dbeafe',
                      color: '#1d4ed8',
                      width: 40,
                      height: 40
                    }}
                  >
                    <CurrencyExchange sx={{ fontSize: 20 }} />
                  </Avatar>
                  <Box>
                    <Typography variant="h6" sx={{ fontWeight: 600, fontSize: '1.1rem' }}>
                      Change Currency
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.85rem' }}>
                      Select your preferred currency
                    </Typography>
                  </Box>
                </Stack>

                {/* Current Currency Display */}
                <Paper
                  elevation={0}
                  sx={{
                    p: 2.5,
                    mb: 3,
                    backgroundColor: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    borderRadius: 2
                  }}
                >
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1, fontSize: '0.8rem' }}>
                    Current Currency
                  </Typography>
                  <Stack direction="row" alignItems="center" spacing={2}>
                    <Typography variant="h4" sx={{ fontSize: '2rem' }}>
                      {getCurrentCurrencyInfo()?.flag}
                    </Typography>
                    <Box>
                      <Typography variant="h6" sx={{ fontWeight: 600 }}>
                        {getCurrentCurrencyInfo()?.name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {getCurrentCurrencyInfo()?.code} • {getCurrentCurrencyInfo()?.symbol}
                      </Typography>
                    </Box>
                  </Stack>
                </Paper>

                {/* Currency Selection */}
                <FormControl fullWidth sx={{ mb: 3 }}>
                  <InputLabel>Select New Currency</InputLabel>
                  <Select
                    value={selectedCurrency}
                    onChange={(e) => setSelectedCurrency(e.target.value)}
                    label="Select New Currency"
                    sx={{ borderRadius: 2 }}
                  >
                    {currencies.map((currency) => (
                      <MenuItem key={currency.code} value={currency.code} sx={{ py: 1.5 }}>
                        <Stack direction="row" alignItems="center" spacing={2}>
                          <Typography sx={{ fontSize: '1.2rem' }}>{currency.flag}</Typography>
                          <Box>
                            <Typography sx={{ fontWeight: 500 }}>{currency.name}</Typography>
                            <Typography variant="body2" color="text.secondary">
                              {currency.code} • {currency.symbol}
                            </Typography>
                          </Box>
                        </Stack>
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                {/* Exchange Rate Preview */}
                {selectedCurrency !== currentCurrency && (
                  <Paper
                    elevation={0}
                    sx={{
                      p: 2.5,
                      mb: 3,
                      backgroundColor: '#f0fdf4',
                      border: '1px solid #bbf7d0',
                      borderRadius: 2
                    }}
                  >
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1, fontSize: '0.8rem' }}>
                      Exchange Rate Preview
                    </Typography>
                    <Typography variant="h6" sx={{ fontWeight: 600, color: '#16a34a' }}>
                      1 {currentCurrency} = {getExchangeRate(currentCurrency, selectedCurrency).toFixed(4)} {selectedCurrency}
                    </Typography>
                  </Paper>
                )}

                {/* Update Button */}
                <Button
                  variant="contained"
                  fullWidth
                  size="large"
                  onClick={handleCurrencyChange}
                  disabled={selectedCurrency === currentCurrency || loading}
                  startIcon={loading ? <Update /> : <CurrencyExchange />}
                  sx={{
                    py: 1.5,
                    borderRadius: 2,
                    backgroundColor: '#4caf50',
                    '&:hover': { backgroundColor: '#45a049' },
                    fontWeight: 600,
                    fontSize: '1rem'
                  }}
                >
                  {loading ? 'Updating...' : 'Update Currency'}
                </Button>
              </CardContent>
            </Card>
          </Grid>

          {/* Settings */}
          <Grid item xs={12} lg={6}>
            <Card
              elevation={0}
              sx={{
                border: '1px solid #e2e8f0',
                borderRadius: 2,
                backgroundColor: 'white',
                height: 'fit-content'
              }}
            >
              <CardContent sx={{ p: 3 }}>
                <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 3 }}>
                  <Avatar
                    sx={{
                      backgroundColor: '#fef3c7',
                      color: '#d97706',
                      width: 40,
                      height: 40
                    }}
                  >
                    <Settings sx={{ fontSize: 20 }} />
                  </Avatar>
                  <Box>
                    <Typography variant="h6" sx={{ fontWeight: 600, fontSize: '1.1rem' }}>
                      Currency Settings
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.85rem' }}>
                      Configure your preferences
                    </Typography>
                  </Box>
                </Stack>

                <Stack spacing={2}>
                  <Paper
                    elevation={0}
                    sx={{
                      p: 2.5,
                      backgroundColor: '#f8fafc',
                      border: '1px solid #e2e8f0',
                      borderRadius: 2
                    }}
                  >
                    <FormControlLabel
                      control={
                        <Switch
                          checked={autoUpdate}
                          onChange={(e) => setAutoUpdate(e.target.checked)}
                          sx={{
                            '& .MuiSwitch-switchBase.Mui-checked': {
                              color: '#4caf50'
                            },
                            '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                              backgroundColor: '#4caf50'
                            }
                          }}
                        />
                      }
                      label={
                        <Box>
                          <Typography sx={{ fontWeight: 500, fontSize: '0.95rem' }}>Auto-update Exchange Rates</Typography>
                          <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem' }}>
                            Automatically refresh rates every hour
                          </Typography>
                        </Box>
                      }
                    />
                  </Paper>

                  <Paper
                    elevation={0}
                    sx={{
                      p: 2.5,
                      backgroundColor: '#f8fafc',
                      border: '1px solid #e2e8f0',
                      borderRadius: 2
                    }}
                  >
                    <FormControlLabel
                      control={
                        <Switch
                          checked={notifications}
                          onChange={(e) => setNotifications(e.target.checked)}
                          sx={{
                            '& .MuiSwitch-switchBase.Mui-checked': {
                              color: '#4caf50'
                            },
                            '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                              backgroundColor: '#4caf50'
                            }
                          }}
                        />
                      }
                      label={
                        <Box>
                          <Typography sx={{ fontWeight: 500, fontSize: '0.95rem' }}>Rate Change Notifications</Typography>
                          <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem' }}>
                            Get notified when rates change significantly
                          </Typography>
                        </Box>
                      }
                    />
                  </Paper>

                  <Paper
                    elevation={0}
                    sx={{
                      p: 2.5,
                      backgroundColor: '#f0fdf4',
                      border: '1px solid #bbf7d0',
                      borderRadius: 2,
                      textAlign: 'center'
                    }}
                  >
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1, fontSize: '0.8rem' }}>
                      Last Updated
                    </Typography>
                    <Typography variant="h6" sx={{ fontWeight: 600, color: '#16a34a' }}>
                      {new Date().toLocaleString()}
                    </Typography>
                  </Paper>
                </Stack>
              </CardContent>
            </Card>
          </Grid>

          {/* Exchange Rates */}
          <Grid item xs={12}>
            <Card
              elevation={0}
              sx={{
                border: '1px solid #e2e8f0',
                borderRadius: 2,
                backgroundColor: 'white'
              }}
            >
              
            </Card>
          </Grid>

          {/* Conversion History */}
          <Grid item xs={12}>
            <Card
              elevation={0}
              sx={{
                border: '1px solid #e2e8f0',
                borderRadius: 2,
                backgroundColor: 'white'
              }}
            >
              
            </Card>
          </Grid>
        </Grid>
      </Box>
    </Box>
  );
};

export default ChangeCurrency;