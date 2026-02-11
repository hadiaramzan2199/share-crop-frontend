import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Container,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  CircularProgress,
  Alert,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Stack,
  IconButton,
  Switch,
  FormControlLabel,
  Grid,
} from '@mui/material';
import {
  Add,
  Edit,
  Delete,
  Star,
  StarBorder,
  CheckCircle,
  Cancel,
} from '@mui/icons-material';
import { adminService } from '../../services/admin';

const AdminPackages = () => {
  const [packages, setPackages] = useState([]);
  const [currencyRates, setCurrencyRates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPackage, setEditingPackage] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    coins: '',
    price: '',
    currency: '',
    discount_percent: 0,
    display_order: 0,
    is_active: true,
    is_featured: false,
  });
  const [saving, setSaving] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [packagesRes, ratesRes] = await Promise.all([
        adminService.getPackages(),
        adminService.getCurrencyRates(),
      ]);
      setPackages(packagesRes.data?.packages || []);
      setCurrencyRates(ratesRes.data?.rates || []);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleOpenDialog = (pkg = null) => {
    if (pkg) {
      setEditingPackage(pkg);
      setFormData({
        name: pkg.name || '',
        description: pkg.description || '',
        coins: pkg.coins || '',
        price: pkg.price || '',
        currency: pkg.currency || '',
        discount_percent: pkg.discount_percent || 0,
        display_order: pkg.display_order || 0,
        is_active: pkg.is_active !== false,
        is_featured: pkg.is_featured || false,
      });
    } else {
      setEditingPackage(null);
      setFormData({
        name: '',
        description: '',
        coins: '',
        price: '',
        currency: currencyRates.length > 0 ? currencyRates[0].currency : '',
        discount_percent: 0,
        display_order: 0,
        is_active: true,
        is_featured: false,
      });
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingPackage(null);
    setFormData({
      name: '',
      description: '',
      coins: '',
      price: '',
      currency: '',
      discount_percent: 0,
      display_order: 0,
      is_active: true,
      is_featured: false,
    });
  };

  const handleSave = async () => {
    if (!formData.name || !formData.coins || !formData.price || !formData.currency) {
      setError('Please fill in all required fields');
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const data = {
        ...formData,
        coins: parseInt(formData.coins),
        price: parseFloat(formData.price),
        discount_percent: parseFloat(formData.discount_percent) || 0,
        display_order: parseInt(formData.display_order) || 0,
      };

      if (editingPackage) {
        await adminService.updatePackage(editingPackage.id, data);
      } else {
        await adminService.createPackage(data);
      }
      handleCloseDialog();
      loadData();
    } catch (err) {
      setError(err.response?.data?.error || err.response?.data?.message || 'Failed to save package');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (pkg) => {
    try {
      await adminService.updatePackage(pkg.id, { is_active: !pkg.is_active });
      loadData();
    } catch (err) {
      setError(err.response?.data?.error || err.response?.data?.message || 'Failed to update package');
    }
  };

  const handleDelete = async (pkg) => {
    if (!window.confirm(`Are you sure you want to permanently delete "${pkg.name}"?\n\nThis action cannot be undone. If this package has been used in purchases, you'll need to deactivate it instead.`)) {
      return;
    }

    try {
      await adminService.deletePackage(pkg.id);
      loadData();
    } catch (err) {
      setError(err.response?.data?.error || err.response?.data?.message || 'Failed to delete package');
    }
  };

  const calculatePriceFromCoins = (coinsValue, currencyValue) => {
    const coins = coinsValue || formData.coins;
    const currency = currencyValue || formData.currency;
    if (!coins || !currency) return null;
    const coinsNum = parseFloat(coins);
    if (isNaN(coinsNum) || coinsNum <= 0) return null;
    const rate = currencyRates.find(r => r.currency === currency);
    if (!rate || !rate.coins_per_unit) return null;
    // Price = coins / coins_per_unit
    // e.g., if coins_per_unit = 1 (1 coin = $1), then 10 coins = $10
    // e.g., if coins_per_unit = 10 (10 coins = $1), then 10 coins = $1
    const coinsPerUnit = parseFloat(rate.coins_per_unit);
    return (coinsNum / coinsPerUnit).toFixed(2);
  };

  const calculateDiscountedPrice = () => {
    if (!formData.price || !formData.discount_percent) return '';
    const price = parseFloat(formData.price);
    const discount = parseFloat(formData.discount_percent) || 0;
    return (price * (1 - discount / 100)).toFixed(2);
  };

  const handleCoinsChange = (value) => {
    const newCoins = value;
    // Auto-calculate price if currency is selected
    if (formData.currency && newCoins) {
      const calculatedPrice = calculatePriceFromCoins(newCoins, formData.currency);
      if (calculatedPrice) {
        setFormData(prev => ({ ...prev, coins: newCoins, price: calculatedPrice }));
        return;
      }
    }
    // If no currency or calculation failed, just update coins
    setFormData(prev => ({ ...prev, coins: newCoins }));
  };

  const handleCurrencyChange = (value) => {
    // Auto-calculate price if coins are entered
    if (formData.coins && value) {
      const calculatedPrice = calculatePriceFromCoins(formData.coins, value);
      if (calculatedPrice) {
        setFormData(prev => ({ ...prev, currency: value, price: calculatedPrice }));
        return;
      }
    }
    // If no coins or calculation failed, just update currency
    setFormData(prev => ({ ...prev, currency: value }));
  };

  const getCurrencySymbol = (currency) => {
    const rate = currencyRates.find(r => r.currency === currency);
    return rate?.symbol || currency;
  };

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4" sx={{ fontWeight: 700 }}>
          Coin Packages Management
        </Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => handleOpenDialog()}
        >
          Create Package
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Card>
        <CardContent>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
              <CircularProgress />
            </Box>
          ) : (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 600 }}>Name</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Coins</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Price</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Currency</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Discount</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Final Price</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Order</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Featured</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {packages.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={10} align="center">
                        <Typography variant="body2" color="text.secondary">
                          No packages found. Create your first package!
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    packages.map((pkg) => {
                      // Ensure price values are numbers
                      const price = parseFloat(pkg.price) || 0;
                      const discountPercent = parseFloat(pkg.discount_percent) || 0;
                      const discountedPrice = pkg.discounted_price 
                        ? parseFloat(pkg.discounted_price) 
                        : (price * (1 - discountPercent / 100));
                      return (
                        <TableRow key={pkg.id} hover>
                          <TableCell>
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                              {pkg.name}
                            </Typography>
                            {pkg.description && (
                              <Typography variant="caption" color="text.secondary">
                                {pkg.description}
                              </Typography>
                            )}
                          </TableCell>
                          <TableCell>{pkg.coins}</TableCell>
                          <TableCell>
                            {getCurrencySymbol(pkg.currency)}{price.toFixed(2)}
                          </TableCell>
                          <TableCell>{pkg.currency}</TableCell>
                          <TableCell>
                            {discountPercent > 0 ? (
                              <Chip label={`${discountPercent}% OFF`} color="success" size="small" />
                            ) : (
                              <Typography variant="body2" color="text.secondary">-</Typography>
                            )}
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                              {getCurrencySymbol(pkg.currency)}{discountedPrice.toFixed(2)}
                            </Typography>
                          </TableCell>
                          <TableCell>{pkg.display_order}</TableCell>
                          <TableCell>
                            <Chip
                              label={pkg.is_active ? 'Active' : 'Inactive'}
                              color={pkg.is_active ? 'success' : 'default'}
                              size="small"
                            />
                          </TableCell>
                          <TableCell>
                            {pkg.is_featured ? (
                              <Star color="warning" />
                            ) : (
                              <StarBorder color="disabled" />
                            )}
                          </TableCell>
                          <TableCell>
                            <Stack direction="row" spacing={1}>
                              <IconButton size="small" onClick={() => handleOpenDialog(pkg)} title="Edit">
                                <Edit fontSize="small" />
                              </IconButton>
                              <IconButton 
                                size="small" 
                                onClick={() => handleToggleActive(pkg)}
                                color={pkg.is_active ? 'success' : 'default'}
                                title={pkg.is_active ? 'Deactivate' : 'Activate'}
                              >
                                {pkg.is_active ? <CheckCircle fontSize="small" /> : <Cancel fontSize="small" />}
                              </IconButton>
                              <IconButton size="small" onClick={() => handleDelete(pkg)} color="error" title="Delete permanently">
                                <Delete fontSize="small" />
                              </IconButton>
                            </Stack>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingPackage ? 'Edit Package' : 'Create New Package'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Package Name *"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Description"
                multiline
                rows={2}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="Coins *"
                type="number"
                value={formData.coins}
                onChange={(e) => handleCoinsChange(e.target.value)}
                inputProps={{ min: 1 }}
                helperText={formData.currency && formData.coins ? `Auto-calculated: ${getCurrencySymbol(formData.currency)}${calculatePriceFromCoins(formData.coins, formData.currency) || '0.00'}` : 'Enter coins to auto-calculate price'}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="Price *"
                type="number"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                inputProps={{ min: 0, step: 0.01 }}
                helperText={formData.currency && formData.coins ? `Rate: ${currencyRates.find(r => r.currency === formData.currency)?.coins_per_unit || 'N/A'} coins = ${getCurrencySymbol(formData.currency)}1.00` : ''}
              />
            </Grid>
            <Grid item xs={6}>
              <FormControl fullWidth>
                <InputLabel>Currency *</InputLabel>
                <Select
                  value={formData.currency}
                  label="Currency *"
                  onChange={(e) => handleCurrencyChange(e.target.value)}
                >
                  {currencyRates.map((rate) => (
                    <MenuItem key={rate.currency} value={rate.currency}>
                      {rate.currency} - {rate.display_name} ({rate.symbol}) - {rate.coins_per_unit} coins/{rate.symbol}1
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="Discount %"
                type="number"
                value={formData.discount_percent}
                onChange={(e) => setFormData({ ...formData, discount_percent: e.target.value })}
                inputProps={{ min: 0, max: 100, step: 0.01 }}
                helperText={
                  formData.price && formData.discount_percent
                    ? `Final Price: ${getCurrencySymbol(formData.currency)}${calculateDiscountedPrice()}`
                    : ''
                }
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="Display Order"
                type="number"
                value={formData.display_order}
                onChange={(e) => setFormData({ ...formData, display_order: e.target.value })}
                inputProps={{ min: 0 }}
                helperText="Lower numbers appear first"
              />
            </Grid>
            <Grid item xs={6}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.is_featured}
                    onChange={(e) => setFormData({ ...formData, is_featured: e.target.checked })}
                  />
                }
                label="Featured Package"
              />
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.is_active}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  />
                }
                label="Active"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleSave} variant="contained" disabled={saving}>
            {saving ? <CircularProgress size={20} /> : editingPackage ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default AdminPackages;
