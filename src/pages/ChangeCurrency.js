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
  CircularProgress,
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
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import coinService from '../services/coinService';

const ChangeCurrency = () => {
  const { user } = useAuth();
  const [currentCurrency, setCurrentCurrency] = useState('USD');
  const [selectedCurrency, setSelectedCurrency] = useState('USD');
  const [availableCurrencies, setAvailableCurrencies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);

  // Load user's preferred currency and available currencies
  useEffect(() => {
    const loadData = async () => {
      if (!user?.id) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // Get user's preferred currency
        const currencyResponse = await api.get(`/api/users/${user.id}/preferred-currency`);
        const preferredCurrency = currencyResponse.data?.preferred_currency || 'USD';
        setCurrentCurrency(preferredCurrency);
        setSelectedCurrency(preferredCurrency);

        // Get available currencies from system
        const ratesResponse = await coinService.getCurrencyRates();
        const rates = ratesResponse.rates || [];
        setAvailableCurrencies(rates);
      } catch (err) {
        console.error('Error loading currency data:', err);
        setError(err.response?.data?.error || 'Failed to load currency data');
        // Fallback to USD
        setCurrentCurrency('USD');
        setSelectedCurrency('USD');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [user]);

  const handleCurrencyChange = async () => {
    if (!user?.id) {
      setError('You must be logged in to change currency');
      return;
    }

    if (selectedCurrency === currentCurrency) {
      return;
    }

    setSaving(true);
    setError(null);
    setSuccess(false);

    try {
      const response = await api.patch(`/api/users/${user.id}/preferred-currency`, {
        preferred_currency: selectedCurrency,
      });

      if (response.data.success) {
        setCurrentCurrency(selectedCurrency);
        setSuccess(true);
        // Update user context if possible
        if (user) {
          // Trigger a refresh of user data
          window.dispatchEvent(new CustomEvent('sharecrop-currency-updated', { 
            detail: { currency: selectedCurrency } 
          }));
        }
        
        // Hide success message after 3 seconds
        setTimeout(() => setSuccess(false), 3000);
      }
    } catch (err) {
      console.error('Error updating currency:', err);
      setError(err.response?.data?.error || err.response?.data?.message || 'Failed to update currency preference');
    } finally {
      setSaving(false);
    }
  };

  const getCurrentCurrencyInfo = () => {
    return availableCurrencies.find(c => c.currency === currentCurrency);
  };

  const getSelectedCurrencyInfo = () => {
    return availableCurrencies.find(c => c.currency === selectedCurrency);
  };

  const getCurrencyFlag = (currencyCode) => {
    const flags = {
      'USD': '🇺🇸', 'EUR': '🇪🇺', 'GBP': '🇬🇧', 'JPY': '🇯🇵',
      'PKR': '🇵🇰', 'CAD': '🇨🇦', 'AUD': '🇦🇺', 'CHF': '🇨🇭',
    };
    return flags[currencyCode] || '💱';
  };

  return (
    <Box sx={{ 
      width: '100%',
      backgroundColor: '#f8fafc',
      p: 3,
      pb: 4
    }}>
      {/* Single Full-Width Container */}
      <Box sx={{ maxWidth: '1200px', mx: 'auto' }}>
        <Card
          elevation={0}
          sx={{
            border: '1px solid #e2e8f0',
            borderRadius: 3,
            backgroundColor: 'white',
            boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
          }}
        >
          <CardContent sx={{ p: 4 }}>
            {/* Header */}
            <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 3 }}>
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
                  Select your preferred currency for all transactions
                </Typography>
              </Box>
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
                onClose={() => setSuccess(false)}
              >
                Currency updated successfully! Your preferred currency is now {getSelectedCurrencyInfo()?.display_name || selectedCurrency}. 
                This will be used for all future redemptions and transactions.
              </Alert>
            )}

            {/* Error Alert */}
            {error && (
              <Alert 
                severity="error" 
                sx={{ 
                  mb: 3,
                  borderRadius: 2,
                }}
                onClose={() => setError(null)}
              >
                {error}
              </Alert>
            )}

            <Divider sx={{ my: 3 }} />

            {/* Current Currency Display */}
            <Box sx={{ mb: 4 }}>
              <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 2, fontSize: '0.85rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Current Currency
              </Typography>
              <Paper
                elevation={0}
                sx={{
                  p: 3,
                  backgroundColor: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: 2
                }}
              >
                <Stack direction="row" alignItems="center" spacing={3}>
                  <Typography variant="h3" sx={{ fontSize: '3rem' }}>
                    {getCurrencyFlag(currentCurrency)}
                  </Typography>
                  <Box>
                    <Typography variant="h5" sx={{ fontWeight: 600, mb: 0.5 }}>
                      {getCurrentCurrencyInfo()?.display_name || currentCurrency}
                    </Typography>
                    <Typography variant="body1" color="text.secondary">
                      {getCurrentCurrencyInfo()?.currency || currentCurrency} • {getCurrentCurrencyInfo()?.symbol || '$'}
                    </Typography>
                    {getCurrentCurrencyInfo() && (
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                        Rate: {getCurrentCurrencyInfo().coins_per_unit} coins = {getCurrentCurrencyInfo().symbol}1.00
                      </Typography>
                    )}
                  </Box>
                </Stack>
              </Paper>
            </Box>

            {/* Currency Selection */}
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 2, fontSize: '0.85rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Select Preferred Currency
              </Typography>
              <FormControl fullWidth sx={{ mb: 3 }}>
                <InputLabel>Choose Currency</InputLabel>
                <Select
                  value={selectedCurrency}
                  onChange={(e) => setSelectedCurrency(e.target.value)}
                  label="Choose Currency"
                  sx={{ borderRadius: 2 }}
                  disabled={loading || saving}
                >
                  {availableCurrencies.length === 0 ? (
                    <MenuItem disabled>Loading currencies...</MenuItem>
                  ) : (
                    availableCurrencies.map((rate) => (
                      <MenuItem key={rate.currency} value={rate.currency} sx={{ py: 1.5 }}>
                        <Stack direction="row" alignItems="center" spacing={2}>
                          <Typography sx={{ fontSize: '1.5rem' }}>{getCurrencyFlag(rate.currency)}</Typography>
                          <Box>
                            <Typography sx={{ fontWeight: 500 }}>{rate.display_name}</Typography>
                            <Typography variant="body2" color="text.secondary">
                              {rate.currency} • {rate.symbol} • {rate.coins_per_unit} coins = {rate.symbol}1.00
                            </Typography>
                          </Box>
                        </Stack>
                      </MenuItem>
                    ))
                  )}
                </Select>
              </FormControl>

              {/* Update Button - Moved to top */}
              <Button
                variant="contained"
                fullWidth
                size="large"
                onClick={handleCurrencyChange}
                disabled={selectedCurrency === currentCurrency || loading || saving || !user?.id}
                startIcon={saving ? <CircularProgress size={20} color="inherit" /> : <CurrencyExchange />}
                sx={{
                  py: 1.75,
                  borderRadius: 2,
                  backgroundColor: '#4caf50',
                  '&:hover': { backgroundColor: '#45a049' },
                  fontWeight: 600,
                  fontSize: '1.1rem',
                  textTransform: 'none',
                  mb: 3
                }}
              >
                {saving ? 'Saving...' : selectedCurrency === currentCurrency ? 'Already Selected' : 'Save Currency Preference'}
              </Button>
            </Box>

            {/* Rate Info */}
            {getSelectedCurrencyInfo() && selectedCurrency !== currentCurrency && (
              <Box sx={{ mb: 4 }}>
                <Paper
                  elevation={0}
                  sx={{
                    p: 3,
                    backgroundColor: '#f0fdf4',
                    border: '1px solid #bbf7d0',
                    borderRadius: 2
                  }}
                >
                  <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1, fontSize: '0.85rem', fontWeight: 600 }}>
                    New Currency Rate
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 600, color: '#16a34a', mb: 1 }}>
                    {getSelectedCurrencyInfo().coins_per_unit} coins = {getSelectedCurrencyInfo().symbol}1.00
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    This rate will be used for coin purchases and redemptions
                  </Typography>
                </Paper>
              </Box>
            )}

            {/* Info Section */}
            <Box sx={{ mb: 4 }}>
              <Paper
                elevation={0}
                sx={{
                  p: 3,
                  backgroundColor: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: 2
                }}
              >
                <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 2, fontSize: '0.85rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  How This Works
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Your selected currency will be used as the default for:
                </Typography>
                <Box component="ul" sx={{ mt: 1, pl: 2.5, mb: 0 }}>
                  <Typography component="li" variant="body2" color="text.secondary" sx={{ fontSize: '0.9rem', mb: 1 }}>
                    Coin purchases and redemptions
                  </Typography>
                  <Typography component="li" variant="body2" color="text.secondary" sx={{ fontSize: '0.9rem', mb: 1 }}>
                    Transaction displays and calculations
                  </Typography>
                  <Typography component="li" variant="body2" color="text.secondary" sx={{ fontSize: '0.9rem' }}>
                    Payout methods and money transfers
                  </Typography>
                </Box>
              </Paper>
            </Box>

            {loading && (
              <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
                <CircularProgress />
              </Box>
            )}
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
};

export default ChangeCurrency;