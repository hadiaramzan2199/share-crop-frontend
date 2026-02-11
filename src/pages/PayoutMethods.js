import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Alert,
  Container,
  Grid,
  IconButton,
  Chip,
  Stack,
  CircularProgress,
  Divider,
} from '@mui/material';
import {
  AccountBalance,
  CreditCard,
  Add,
  Delete,
  Star,
  ArrowBack,
} from '@mui/icons-material';
import { useNavigate, useSearchParams } from 'react-router-dom';
import redemptionService from '../services/redemptionService';

const PayoutMethods = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [methods, setMethods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [adding, setAdding] = useState(false);

  const [syncing, setSyncing] = useState(false);

  const syncMethods = useCallback(async () => {
    setSyncing(true);
    setError(null);
    try {
      const data = await redemptionService.syncPayoutMethods();
      setMethods(data.methods || []);
    } catch (err) {
      console.error('Error syncing methods:', err);
      const msg = err.response?.data?.error || err.response?.data?.message || 'Failed to sync from Stripe';
      setError(msg);
    } finally {
      setSyncing(false);
    }
  }, []);

  useEffect(() => {
    loadMethods();
  }, []);

  // When returning from Stripe (return=1 or refresh=1), sync payout methods from Stripe
  useEffect(() => {
    const returnParam = searchParams.get('return');
    const refreshParam = searchParams.get('refresh');
    if (returnParam === '1' || refreshParam === '1') {
      syncMethods();
      // Clear query params from URL so refresh doesn't re-sync repeatedly
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, [searchParams, syncMethods]);

  const loadMethods = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await redemptionService.getPayoutMethods();
      setMethods(data.methods || []);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load payout methods');
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async () => {
    setAdding(true);
    setError(null);
    try {
      const result = await redemptionService.createPayoutMethod();
      if (result.url) {
        window.location.href = result.url;
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to start onboarding');
      setAdding(false);
    }
  };

  const handleSetDefault = async (methodId) => {
    try {
      await redemptionService.setDefaultPayoutMethod(methodId);
      loadMethods();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to set default');
    }
  };

  const handleDelete = async (methodId) => {
    if (!window.confirm('Are you sure you want to delete this payout method?')) {
      return;
    }
    try {
      await redemptionService.deletePayoutMethod(methodId);
      loadMethods();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to delete');
    }
  };

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

      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3} flexWrap="wrap" gap={2}>
        <Typography variant="h4">
          Payout Methods
        </Typography>
        <Stack direction="row" spacing={1}>
          <Button
            variant="outlined"
            onClick={syncMethods}
            disabled={syncing || adding}
          >
            {syncing ? <CircularProgress size={20} /> : 'Sync from Stripe'}
          </Button>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={handleAdd}
            disabled={adding}
          >
            {adding ? <CircularProgress size={20} /> : 'Add Bank or Card'}
          </Button>
        </Stack>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {methods.length === 0 ? (
        <Card>
          <CardContent>
            <Box textAlign="center" py={4}>
              <Typography variant="h6" color="text.secondary" gutterBottom>
                No payout methods added yet
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Add a bank account or debit card to receive redemption payouts
              </Typography>
              <Button
                variant="contained"
                startIcon={<Add />}
                onClick={handleAdd}
                disabled={adding}
              >
                {adding ? <CircularProgress size={20} /> : 'Add Your First Method'}
              </Button>
            </Box>
          </CardContent>
        </Card>
      ) : (
        <Grid container spacing={2}>
          {methods.map((method) => (
            <Grid item xs={12} key={method.id}>
              <Card>
                <CardContent>
                  <Box display="flex" justifyContent="space-between" alignItems="start">
                    <Box display="flex" alignItems="center" gap={2}>
                      {method.method_type === 'bank_account' ? (
                        <AccountBalance sx={{ fontSize: 40, color: 'primary.main' }} />
                      ) : (
                        <CreditCard sx={{ fontSize: 40, color: 'primary.main' }} />
                      )}
                      <Box>
                        <Typography variant="h6">
                          {method.display_label}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {method.method_type === 'bank_account' ? 'Bank Account' : 'Debit Card'}
                          {method.last4 && ` •••• ${method.last4}`}
                        </Typography>
                        {method.bank_name_or_brand && (
                          <Typography variant="caption" color="text.secondary">
                            {method.bank_name_or_brand}
                          </Typography>
                        )}
                      </Box>
                    </Box>
                    <Stack direction="row" spacing={1}>
                      {method.is_default ? (
                        <Chip
                          icon={<Star />}
                          label="Default"
                          color="primary"
                          size="small"
                        />
                      ) : (
                        <Button
                          size="small"
                          onClick={() => handleSetDefault(method.id)}
                        >
                          Set Default
                        </Button>
                      )}
                      <IconButton
                        color="error"
                        onClick={() => handleDelete(method.id)}
                        size="small"
                      >
                        <Delete />
                      </IconButton>
                    </Stack>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </Container>
  );
};

export default PayoutMethods;
