import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  CircularProgress,
  Alert,
  Container,
  Grid,
  Chip,
  Stack,
  Divider,
} from '@mui/material';
import {
  MonetizationOn,
  CheckCircle,
  Cancel,
  Security,
  Payment,
  TrendingUp,
  Star,
  ArrowBack,
  ShoppingCart,
  Verified,
} from '@mui/icons-material';
import { useSearchParams, useLocation, useNavigate } from 'react-router-dom';
import coinService from '../services/coinService';

const BuyCoins = ({ onSuccess }) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const basePath = location.pathname.replace(/\/buy-coins.*/, '/buy-coins');
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const successUrl = `${origin}${basePath}?success=1`;
  const cancelUrl = `${origin}${basePath}?cancel=1`;
  const [packs, setPacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(null);
  const [error, setError] = useState(null);
  const purchaseInProgressRef = useRef(false);
  const success = searchParams.get('success');
  const cancel = searchParams.get('cancel');

  useEffect(() => {
    if (success === '1') {
      window.dispatchEvent(new CustomEvent('sharecrop-refresh-coins'));
    }
  }, [success]);

  useEffect(() => {
    let mounted = true;
    coinService.getCoinPacks().then((data) => {
      if (mounted && data.packs) setPacks(data.packs);
    }).catch(() => {
      if (mounted) setPacks([
        { id: 'pack_small', coins: 100, usd: '9.99' },
        { id: 'pack_medium', coins: 500, usd: '44.99' },
        { id: 'pack_large', coins: 1200, usd: '99.99' },
      ]);
    }).finally(() => {
      if (mounted) setLoading(false);
    });
    return () => { mounted = false; };
  }, []);

  const handleBuy = async (packId) => {
    if (purchaseInProgressRef.current) return;
    setError(null);
    purchaseInProgressRef.current = true;
    setPurchasing(packId);
    try {
      const pack = packs.find((p) => p.id === packId);
      const { url } = await coinService.createPurchaseIntent(packId, {
        successUrl,
        cancelUrl,
        pack: pack ? { name: `${pack.coins} Coins`, coins: pack.coins, usd: pack.usd } : undefined,
      });
      if (url) {
        window.location.href = url;
        return;
      }
      setError('Could not start checkout');
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Checkout failed');
    } finally {
      purchaseInProgressRef.current = false;
      setPurchasing(null);
    }
  };

  if (success === '1') {
    return (
      <Container maxWidth="sm">
        <Box
          sx={{
            minHeight: '60vh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center',
            py: 6,
          }}
        >
          <Box
            sx={{
              width: 120,
              height: 120,
              borderRadius: '50%',
              bgcolor: 'success.light',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mb: 3,
              animation: 'pulse 2s ease-in-out infinite',
              '@keyframes pulse': {
                '0%, 100%': { transform: 'scale(1)' },
                '50%': { transform: 'scale(1.05)' },
              },
            }}
          >
            <CheckCircle sx={{ fontSize: 64, color: 'success.main' }} />
          </Box>
          <Typography variant="h3" sx={{ fontWeight: 700, mb: 1, color: 'success.main' }}>
            Payment Successful!
          </Typography>
          <Typography variant="h6" sx={{ color: 'text.secondary', mb: 4, fontWeight: 400 }}>
            Your coins have been added to your account. You can now use them to rent fields and make purchases.
          </Typography>
          <Stack direction="row" spacing={2}>
            <Button
              variant="contained"
              size="large"
              startIcon={<ShoppingCart />}
              onClick={() => navigate(window.location.pathname.replace(/\/buy-coins.*/, ''))}
              sx={{ px: 4, py: 1.5, borderRadius: 2 }}
            >
              Continue Shopping
            </Button>
            <Button
              variant="outlined"
              size="large"
              startIcon={<MonetizationOn />}
              onClick={() => navigate(window.location.pathname.replace(/\/buy-coins.*/, '/transaction'))}
              sx={{ px: 4, py: 1.5, borderRadius: 2 }}
            >
              View Transactions
            </Button>
          </Stack>
          {typeof onSuccess === 'function' && onSuccess()}
        </Box>
      </Container>
    );
  }

  if (cancel === '1') {
    return (
      <Container maxWidth="sm">
        <Box
          sx={{
            minHeight: '60vh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center',
            py: 6,
          }}
        >
          <Box
            sx={{
              width: 100,
              height: 100,
              borderRadius: '50%',
              bgcolor: 'grey.100',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mb: 3,
            }}
          >
            <Cancel sx={{ fontSize: 56, color: 'text.secondary' }} />
          </Box>
          <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
            Payment Cancelled
          </Typography>
          <Typography variant="body1" sx={{ color: 'text.secondary', mb: 4, maxWidth: 400 }}>
            No charges were made. Feel free to try again whenever you're ready.
          </Typography>
          <Button
            variant="contained"
            size="large"
            startIcon={<ArrowBack />}
            onClick={() => navigate(window.location.pathname.replace(/\/buy-coins.*/, ''))}
            sx={{ px: 4, py: 1.5, borderRadius: 2 }}
          >
            Go Back
          </Button>
        </Box>
      </Container>
    );
  }

  // Calculate savings and best value
  const packsWithSavings = packs.map((pack, index) => {
    const pricePerCoin = parseFloat(pack.usd) / pack.coins;
    const basePricePerCoin = parseFloat(packs[0]?.usd || '9.99') / (packs[0]?.coins || 100);
    const savings = index > 0 ? ((basePricePerCoin - pricePerCoin) / basePricePerCoin * 100).toFixed(0) : 0;
    const isPopular = index === 1 || index === 2;
    const isBestValue = index === packs.length - 1;
    return { ...pack, pricePerCoin, savings, isPopular, isBestValue };
  });

  if (loading) {
    return (
      <Container maxWidth="lg">
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
          <CircularProgress size={60} />
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: { xs: 3, md: 6 } }}>
      {/* Header Section */}
      <Box sx={{ textAlign: 'center', mb: 5 }}>
        <Typography variant="h3" sx={{ fontWeight: 700, mb: 2, color: 'text.primary' }}>
          Add Coins to Your Account
        </Typography>
        <Typography variant="h6" sx={{ color: 'text.secondary', fontWeight: 400, mb: 1 }}>
          1 coin = $0.10 in-app value
        </Typography>
        <Stack direction="row" spacing={2} justifyContent="center" sx={{ mt: 2, flexWrap: 'wrap' }}>
          <Chip icon={<Security />} label="Secure Payment" size="small" color="success" variant="outlined" />
          <Chip icon={<Payment />} label="Card, Apple Pay, Google Pay" size="small" color="primary" variant="outlined" />
          <Chip icon={<Verified />} label="Instant Delivery" size="small" color="info" variant="outlined" />
        </Stack>
      </Box>

      {error && (
        <Alert
          severity="error"
          onClose={() => setError(null)}
          sx={{ mb: 4, borderRadius: 2 }}
        >
          {error}
        </Alert>
      )}

      {/* Package Cards */}
      <Grid container spacing={3} justifyContent="center">
        {packsWithSavings.map((pack, index) => {
          const isPurchasing = purchasing === pack.id;
          return (
            <Grid item xs={12} sm={6} md={4} lg={3} key={pack.id}>
              <Card
                sx={{
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  position: 'relative',
                  border: pack.isBestValue ? '2px solid' : '1px solid',
                  borderColor: pack.isBestValue ? 'warning.main' : 'divider',
                  borderRadius: 3,
                  overflow: 'visible',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    transform: 'translateY(-8px)',
                    boxShadow: pack.isBestValue
                      ? '0 12px 24px rgba(255, 152, 0, 0.3)'
                      : '0 8px 16px rgba(0,0,0,0.15)',
                  },
                  cursor: purchasing ? 'wait' : 'pointer',
                  opacity: purchasing && !isPurchasing ? 0.6 : 1,
                }}
                onClick={() => !purchasing && handleBuy(pack.id)}
              >
                {/* Badge */}
                {pack.isBestValue && (
                  <Chip
                    label="Best Value"
                    color="warning"
                    size="small"
                    sx={{
                      position: 'absolute',
                      top: -12,
                      right: 16,
                      fontWeight: 700,
                      fontSize: '0.75rem',
                    }}
                  />
                )}
                {pack.isPopular && !pack.isBestValue && (
                  <Chip
                    label="Popular"
                    color="primary"
                    size="small"
                    sx={{
                      position: 'absolute',
                      top: -12,
                      right: 16,
                      fontWeight: 700,
                      fontSize: '0.75rem',
                    }}
                  />
                )}

                <CardContent sx={{ flexGrow: 1, p: 3, textAlign: 'center' }}>
                  {/* Icon */}
                  <Box
                    sx={{
                      width: 80,
                      height: 80,
                      borderRadius: '50%',
                      bgcolor: pack.isBestValue ? 'warning.light' : 'primary.light',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      mx: 'auto',
                      mb: 2,
                    }}
                  >
                    <MonetizationOn
                      sx={{
                        fontSize: 48,
                        color: pack.isBestValue ? 'warning.dark' : 'primary.main',
                      }}
                    />
                  </Box>

                  {/* Coins */}
                  <Typography variant="h3" sx={{ fontWeight: 700, mb: 0.5, color: 'text.primary' }}>
                    {pack.coins.toLocaleString()}
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2 }}>
                    Coins
                  </Typography>

                  <Divider sx={{ my: 2 }} />

                  {/* Price */}
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="h4" sx={{ fontWeight: 700, color: 'text.primary', mb: 0.5 }}>
                      ${pack.usd}
                    </Typography>
                    {pack.savings > 0 && (
                      <Typography variant="caption" sx={{ color: 'success.main', fontWeight: 600 }}>
                        Save {pack.savings}%
                      </Typography>
                    )}
                  </Box>

                  {/* Value */}
                  <Typography variant="body2" sx={{ color: 'text.secondary', mb: 3 }}>
                    ${(pack.coins * 0.1).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} in-app value
                  </Typography>

                  {/* Buy Button */}
                  <Button
                    fullWidth
                    variant="contained"
                    size="large"
                    color={pack.isBestValue ? 'warning' : 'primary'}
                    disabled={purchasing !== null}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleBuy(pack.id);
                    }}
                    sx={{
                      py: 1.5,
                      borderRadius: 2,
                      fontWeight: 700,
                      fontSize: '1rem',
                      textTransform: 'none',
                    }}
                    startIcon={
                      isPurchasing ? (
                        <CircularProgress size={20} color="inherit" />
                      ) : (
                        <ShoppingCart />
                      )
                    }
                  >
                    {isPurchasing ? 'Processing...' : 'Buy Now'}
                  </Button>
                </CardContent>
              </Card>
            </Grid>
          );
        })}
      </Grid>

      {/* Trust Indicators */}
      <Box sx={{ mt: 6, textAlign: 'center' }}>
        <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2 }}>
          Trusted by farmers and buyers worldwide
        </Typography>
        <Stack direction="row" spacing={3} justifyContent="center" sx={{ flexWrap: 'wrap', gap: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Security sx={{ fontSize: 20, color: 'success.main' }} />
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              Secure & Encrypted
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <TrendingUp sx={{ fontSize: 20, color: 'primary.main' }} />
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              Instant Delivery
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Star sx={{ fontSize: 20, color: 'warning.main' }} />
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              24/7 Support
            </Typography>
          </Box>
        </Stack>
      </Box>
    </Container>
  );
};

export default BuyCoins;
