import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  TextField,
  Alert,
  Container,
  Grid,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  CircularProgress,
  Divider,
  Chip,
  Stack,
} from '@mui/material';
import {
  AccountBalance,
  CreditCard,
  ArrowBack,
  CheckCircle,
  Cancel,
  HourglassEmpty,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import redemptionService from '../services/redemptionService';
import coinService from '../services/coinService';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';

const RedeemCoins = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [config, setConfig] = useState(null);
  const [balance, setBalance] = useState({ coins: 0, locked_coins: 0 });
  const [payoutMethods, setPayoutMethods] = useState([]);
  const [coinsRequested, setCoinsRequested] = useState('');
  const [selectedMethodId, setSelectedMethodId] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [userCurrency, setUserCurrency] = useState('USD');

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

  const getCurrencySymbol = (currency) => {
    if (!currency) return '$';
    return currencySymbols[currency.toUpperCase()] || currency.toUpperCase();
  };

  const loadData = useCallback(async () => {
    if (!user?.id) return;
    
    setLoading(true);
    setError(null);
    try {
      // Load user's preferred currency
      try {
        const currencyResponse = await api.get(`/api/users/${user.id}/preferred-currency`);
        if (currencyResponse.data?.preferred_currency) {
          setUserCurrency(currencyResponse.data.preferred_currency);
        }
      } catch (err) {
        console.warn('Could not load user currency preference:', err);
      }

      const [configData, balanceResponse, methodsData] = await Promise.all([
        redemptionService.getConfig(),
        api.get(`/api/coins/${user.id}`).then(r => r.data).catch(() => ({ coins: 0, locked_coins: 0 })),
        redemptionService.getPayoutMethods().catch(() => ({ methods: [] }))
      ]);

      const balanceData = balanceResponse;

      setConfig(configData);
      setBalance(balanceData);
      setPayoutMethods(methodsData.methods || []);
      if (methodsData.methods?.length > 0) {
        const defaultMethod = methodsData.methods.find(m => m.is_default) || methodsData.methods[0];
        setSelectedMethodId(defaultMethod.id);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleRedeem = async () => {
    if (!selectedMethodId) {
      setError('Please select a payout method');
      return;
    }

    const coins = parseInt(coinsRequested);
    if (!coins || coins < (config?.min_coins || 1000)) {
      setError(`Minimum redemption is ${config?.min_coins || 1000} coins`);
      return;
    }

    if (coins > balance.coins) {
      setError(`Insufficient coins. Available: ${balance.coins}`);
      return;
    }

    setSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      const result = await redemptionService.createRedemption(coins, selectedMethodId);
      const currencySymbol = getCurrencySymbol(result.currency || userCurrency);
      setSuccess(`Redemption request submitted! You will receive ${currencySymbol}${(result.payout_amount_cents / 100).toFixed(2)} after approval.`);
      setCoinsRequested('');
      loadData(); // Refresh balance
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Redemption failed');
    } finally {
      setSubmitting(false);
    }
  };

  const calculatePayout = (coins) => {
    if (!config || !coins) return { fiat: 0, fee: 0, payout: 0 };
    const fiat = (coins / config.coins_per_usd);
    const fee = fiat * (config.platform_fee_percent / 100);
    const payout = fiat - fee;
    return { fiat, fee, payout };
  };

  const payout = calculatePayout(parseInt(coinsRequested) || 0);

  if (loading) {
    return (
      <Container maxWidth="md">
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Button
        startIcon={<ArrowBack />}
        onClick={() => navigate(-1)}
        sx={{ mb: 3 }}
      >
        Back
      </Button>

      <Typography variant="h4" gutterBottom>
        Redeem Coins for Cash
      </Typography>

      <Grid container spacing={3} sx={{ mt: 1 }}>
        {/* Balance Card */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Your Balance
              </Typography>
              <Stack direction="row" spacing={2}>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Available
                  </Typography>
                  <Typography variant="h5" color="primary">
                    {balance.coins?.toLocaleString() || 0} coins
                  </Typography>
                </Box>
                <Divider orientation="vertical" flexItem />
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Locked (Pending)
                  </Typography>
                  <Typography variant="h5" color="warning.main">
                    {balance.locked_coins?.toLocaleString() || 0} coins
                  </Typography>
                </Box>
                <Divider orientation="vertical" flexItem />
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Total
                  </Typography>
                  <Typography variant="h5">
                    {(balance.coins || 0) + (balance.locked_coins || 0)} coins
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        {/* Payout Methods */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6">
                  Payout Method
                </Typography>
                <Button
                  size="small"
                  onClick={() => navigate('/wallet/payout-methods')}
                >
                  Manage Methods
                </Button>
              </Box>
              {payoutMethods.length === 0 ? (
                <Alert severity="warning" sx={{ mb: 2 }}>
                  You need to add a payout method before redeeming. 
                  <Button size="small" onClick={() => navigate('/wallet/payout-methods')} sx={{ ml: 1 }}>
                    Add Now
                  </Button>
                </Alert>
              ) : (
                <FormControl fullWidth>
                  <InputLabel>Select Payout Method</InputLabel>
                  <Select
                    value={selectedMethodId}
                    onChange={(e) => setSelectedMethodId(e.target.value)}
                    label="Select Payout Method"
                  >
                    {payoutMethods.map((method) => (
                      <MenuItem key={method.id} value={method.id}>
                        <Box display="flex" alignItems="center" gap={1}>
                          {method.method_type === 'bank_account' ? (
                            <AccountBalance />
                          ) : (
                            <CreditCard />
                          )}
                          <Typography>
                            {method.display_label}
                            {method.is_default && (
                              <Chip label="Default" size="small" sx={{ ml: 1 }} />
                            )}
                          </Typography>
                        </Box>
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Redemption Form */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Redemption Amount
              </Typography>
              
              <TextField
                fullWidth
                label="Coins to Redeem"
                type="number"
                value={coinsRequested}
                onChange={(e) => setCoinsRequested(e.target.value)}
                inputProps={{ min: config?.min_coins || 1000, max: balance.coins }}
                helperText={`Minimum: ${config?.min_coins || 1000} coins`}
                sx={{ mb: 2 }}
                disabled={payoutMethods.length === 0}
              />

              {coinsRequested && parseInt(coinsRequested) > 0 && (
                <Box sx={{ mb: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Redemption Summary
                  </Typography>
                  <Stack spacing={1}>
                    <Box display="flex" justifyContent="space-between">
                      <Typography>Coins:</Typography>
                      <Typography>{parseInt(coinsRequested).toLocaleString()}</Typography>
                    </Box>
                    <Box display="flex" justifyContent="space-between">
                      <Typography>Value:</Typography>
                      <Typography>{getCurrencySymbol(userCurrency)}{payout.fiat.toFixed(2)}</Typography>
                    </Box>
                    <Box display="flex" justifyContent="space-between">
                      <Typography>Platform Fee ({config?.platform_fee_percent || 20}%):</Typography>
                      <Typography color="error">-{getCurrencySymbol(userCurrency)}{payout.fee.toFixed(2)}</Typography>
                    </Box>
                    <Divider />
                    <Box display="flex" justifyContent="space-between">
                      <Typography variant="h6">You Receive:</Typography>
                      <Typography variant="h6" color="primary">
                        {getCurrencySymbol(userCurrency)}{payout.payout.toFixed(2)}
                      </Typography>
                    </Box>
                  </Stack>
                </Box>
              )}

              {error && (
                <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
                  {error}
                </Alert>
              )}

              {success && (
                <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(null)}>
                  <Typography variant="body2" fontWeight={600} gutterBottom>
                    {success}
                  </Typography>
                  <Typography variant="body2">
                    Your request is now pending admin review. Once approved, funds will be transferred to your bank account and arrive within <strong>1-2 business days</strong>.
                  </Typography>
                </Alert>
              )}

              <Alert severity="info" sx={{ mb: 2 }}>
                <Typography variant="body2">
                  <strong>Processing Time:</strong> After approval, funds are transferred immediately via Stripe and will arrive in your bank account within <strong>1-2 business days</strong>. Your coins will be locked until the request is processed.
                </Typography>
              </Alert>

              <Button
                fullWidth
                variant="contained"
                size="large"
                onClick={handleRedeem}
                disabled={submitting || payoutMethods.length === 0 || !coinsRequested}
                sx={{ mt: 2 }}
              >
                {submitting ? <CircularProgress size={24} /> : 'Submit Redemption Request'}
              </Button>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Container>
  );
};

export default RedeemCoins;
