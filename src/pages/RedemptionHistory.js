import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Container,
  Grid,
  Chip,
  CircularProgress,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
} from '@mui/material';
import {
  CheckCircle,
  Cancel,
  HourglassEmpty,
  AccountBalance,
  CreditCard,
  ArrowBack,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import redemptionService from '../services/redemptionService';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';

const RedemptionHistory = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [data, setData] = useState({ redemptions: [], balance: { coins: 0, locked_coins: 0 } });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currencyRates, setCurrencyRates] = useState([]);

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

  useEffect(() => {
    loadHistory();
    // Load currency rates for symbol lookup
    const loadCurrencyRates = async () => {
      try {
        const response = await api.get('/api/coins/currency-rates');
        if (response.data?.rates) {
          setCurrencyRates(response.data.rates);
        }
      } catch (err) {
        console.warn('Could not load currency rates:', err);
      }
    };
    loadCurrencyRates();
  }, []);

  const loadHistory = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await redemptionService.getRedemptions();
      setData(result);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load redemption history');
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'paid':
        return <CheckCircle color="success" />;
      case 'rejected':
        return <Cancel color="error" />;
      case 'pending':
      case 'under_review':
        return <HourglassEmpty color="warning" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'paid':
        return 'success';
      case 'rejected':
        return 'error';
      case 'pending':
      case 'under_review':
        return 'warning';
      case 'approved':
        return 'info';
      default:
        return 'default';
    }
  };

  if (loading) {
    return (
      <Container maxWidth="lg">
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Button
        startIcon={<ArrowBack />}
        onClick={() => navigate(-1)}
        sx={{ mb: 3 }}
      >
        Back
      </Button>

      <Typography variant="h4" gutterBottom>
        Redemption History
      </Typography>

      <Alert severity="info" sx={{ mb: 3 }}>
        <Typography variant="body2" fontWeight={600} gutterBottom>
          How Redemption Works:
        </Typography>
        <Typography variant="body2" component="div">
          <strong>1. Submit Request:</strong> Your coins are locked and cannot be spent<br/>
          <strong>2. Admin Review:</strong> We review your request (usually within 24-48 hours)<br/>
          <strong>3. Transfer Initiated:</strong> Once approved, payment is sent immediately via Stripe<br/>
          <strong>4. Funds Arrive:</strong> Money appears in your bank account within <strong>1-2 business days</strong> (Stripe processing time)<br/>
          <strong>Note:</strong> If rejected or failed, your coins are automatically returned to your account
        </Typography>
      </Alert>

      {/* Balance Summary */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2}>
            <Grid item xs={4}>
              <Typography variant="body2" color="text.secondary">
                Available Coins
              </Typography>
              <Typography variant="h6">
                {data.balance?.coins?.toLocaleString() || 0}
              </Typography>
            </Grid>
            <Grid item xs={4}>
              <Typography variant="body2" color="text.secondary">
                Locked (Pending)
              </Typography>
              <Typography variant="h6" color="warning.main">
                {data.balance?.locked_coins?.toLocaleString() || 0}
              </Typography>
            </Grid>
            <Grid item xs={4}>
              <Typography variant="body2" color="text.secondary">
                Total
              </Typography>
              <Typography variant="h6">
                {((data.balance?.coins || 0) + (data.balance?.locked_coins || 0)).toLocaleString()}
              </Typography>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {data.redemptions?.length === 0 ? (
        <Card>
          <CardContent>
            <Box textAlign="center" py={4}>
              <Typography variant="h6" color="text.secondary">
                No redemption requests yet
              </Typography>
            </Box>
          </CardContent>
        </Card>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Request Date</TableCell>
                <TableCell>Coins</TableCell>
                <TableCell>Payout Amount</TableCell>
                <TableCell>Payout Method</TableCell>
                <TableCell>Status & Timeline</TableCell>
                <TableCell>Notes</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {data.redemptions.map((redemption) => (
                <TableRow key={redemption.id}>
                  <TableCell>
                    <Typography variant="body2">
                      {new Date(redemption.created_at).toLocaleDateString()}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {new Date(redemption.created_at).toLocaleTimeString()}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    {redemption.coins_requested?.toLocaleString()}
                  </TableCell>
                  <TableCell>
                    {getCurrencySymbol(redemption.currency)}{((redemption.payout_amount_cents || 0) / 100).toFixed(2)}
                  </TableCell>
                  <TableCell>
                    <Box display="flex" alignItems="center" gap={1}>
                      {redemption.payout_method_type === 'bank_account' ? (
                        <AccountBalance fontSize="small" />
                      ) : (
                        <CreditCard fontSize="small" />
                      )}
                      <Typography variant="body2">
                        {redemption.payout_method_label || 'N/A'}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box>
                      <Chip
                        icon={getStatusIcon(redemption.status)}
                        label={redemption.status}
                        color={getStatusColor(redemption.status)}
                        size="small"
                        sx={{ mb: 0.5 }}
                      />
                      {redemption.status === 'pending' && (
                        <Typography variant="caption" color="text.secondary" display="block">
                          Awaiting admin review
                        </Typography>
                      )}
                      {redemption.status === 'under_review' && (
                        <Typography variant="caption" color="text.secondary" display="block">
                          Under review by admin
                        </Typography>
                      )}
                      {redemption.status === 'paid' && (
                        <Typography variant="caption" color="success.main" display="block" sx={{ mt: 0.5 }}>
                          ✓ Transfer completed. Funds will arrive in your bank account within <strong>1-2 business days</strong>.
                        </Typography>
                      )}
                      {redemption.status === 'rejected' && (
                        <Typography variant="caption" color="error.main" display="block" sx={{ mt: 0.5 }}>
                          Request rejected. Coins have been returned to your account.
                        </Typography>
                      )}
                      {redemption.status === 'failed' && (
                        <Typography variant="caption" color="error.main" display="block" sx={{ mt: 0.5 }}>
                          Transfer failed. Coins have been returned to your account. You can try again.
                        </Typography>
                      )}
                      {redemption.reviewed_at && (
                        <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5 }}>
                          Reviewed: {new Date(redemption.reviewed_at).toLocaleDateString()}
                        </Typography>
                      )}
                    </Box>
                  </TableCell>
                  <TableCell>
                    {redemption.admin_notes ? (
                      <Typography variant="body2" color="text.secondary">
                        {redemption.admin_notes}
                      </Typography>
                    ) : (
                      <Typography variant="body2" color="text.secondary">
                        -
                      </Typography>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Container>
  );
};

export default RedemptionHistory;
