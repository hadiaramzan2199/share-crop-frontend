import React, { useState, useEffect, useCallback } from 'react';
import {
  Container,
  Typography,
  Button,
  Box,
  Card,
  CardContent,
  CardActions,
  Grid,
  CircularProgress,
  Alert,
  Tabs,
  Tab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Stack,
  Chip,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TableContainer,
} from '@mui/material';
import {
  Landscape,
  LocationOn,
  CalendarToday,
  Add,
  List as ListIcon,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import fieldsService from '../services/fields';
import rentedFieldsService from '../services/rentedFields';

const TAB_BROWSE = 0;
const TAB_MY_RENTALS = 1;

function RentAField() {
  const { user } = useAuth();
  const [tab, setTab] = useState(TAB_BROWSE);
  const [availableFields, setAvailableFields] = useState([]);
  const [myRentals, setMyRentals] = useState([]);
  const [loadingBrowse, setLoadingBrowse] = useState(false);
  const [loadingRentals, setLoadingRentals] = useState(false);
  const [error, setError] = useState('');
  const [rentDialogOpen, setRentDialogOpen] = useState(false);
  const [selectedField, setSelectedField] = useState(null);
  const [rentForm, setRentForm] = useState({
    start_date: '',
    end_date: '',
    area_m2: '',
    price: '',
  });
  const [submitting, setSubmitting] = useState(false);

  const loadAvailable = useCallback(async () => {
    if (!user?.id) return;
    setLoadingBrowse(true);
    setError('');
    try {
      const res = await fieldsService.getAvailableToRent();
      const list = Array.isArray(res.data) ? res.data : res.data?.data ?? [];
      setAvailableFields(list);
    } catch (e) {
      const msg = e.response?.data?.message || e.response?.data?.error || e.message || 'Failed to load fields';
      setError(msg);
      setAvailableFields([]);
    } finally {
      setLoadingBrowse(false);
    }
  }, [user?.id]);

  const loadMyRentals = useCallback(async () => {
    if (!user?.id) return;
    setLoadingRentals(true);
    try {
      const res = await rentedFieldsService.getMyRentals();
      const list = Array.isArray(res.data) ? res.data : [];
      setMyRentals(list);
    } catch (e) {
      setMyRentals([]);
    } finally {
      setLoadingRentals(false);
    }
  }, [user?.id]);

  useEffect(() => {
    if (tab === TAB_BROWSE) loadAvailable();
    else loadMyRentals();
  }, [tab, loadAvailable, loadMyRentals]);

  const openRentDialog = (field) => {
    setSelectedField(field);
    const pricePerM2 = typeof field.price_per_m2 === 'string' ? parseFloat(field.price_per_m2) : (field.price_per_m2 ?? 0);
    const price = typeof field.price === 'string' ? parseFloat(field.price) : (field.price ?? 0);
    setRentForm({
      start_date: new Date().toISOString().slice(0, 10),
      end_date: '',
      area_m2: field.available_area ?? field.total_area ?? field.area_m2 ?? '',
      price: price || (pricePerM2 ? `${pricePerM2}` : ''),
    });
    setRentDialogOpen(true);
  };

  const closeRentDialog = () => {
    setRentDialogOpen(false);
    setSelectedField(null);
  };

  const handleRentSubmit = async () => {
    if (!selectedField?.id) return;
    const start = rentForm.start_date?.trim();
    const end = rentForm.end_date?.trim();
    const priceVal = rentForm.price === '' ? null : parseFloat(rentForm.price);
    if (!start) {
      setError('Start date is required');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      const areaRented = rentForm.area_m2 !== '' && !isNaN(parseFloat(rentForm.area_m2)) ? parseFloat(rentForm.area_m2) : null;
      await rentedFieldsService.create({
        field_id: selectedField.id,
        start_date: start,
        end_date: end || null,
        price: priceVal,
        ...(areaRented != null && { area_rented: areaRented }),
      });
      closeRentDialog();
      setTab(TAB_MY_RENTALS);
      loadMyRentals();
    } catch (e) {
      const msg = e.response?.data?.message || e.response?.data?.error || e.message || 'Failed to rent field';
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (d) => {
    if (!d) return '—';
    const x = new Date(d);
    return isNaN(x.getTime()) ? d : x.toLocaleDateString();
  };

  return (
    <Container maxWidth="lg" sx={{ py: 3 }}>
      <Typography variant="h5" fontWeight={700} color="text.primary" gutterBottom>
        Rent a field
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Browse fields from other farmers and rent them for your use. Only available for farmers.
      </Typography>

      {error && (
        <Alert severity="error" onClose={() => setError('')} sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 2 }}>
        <Tab icon={<Landscape />} iconPosition="start" label="Find a field to rent" />
        <Tab icon={<ListIcon />} iconPosition="start" label="My rented fields" />
      </Tabs>

      {tab === TAB_BROWSE && (
        <>
          {loadingBrowse ? (
            <Box display="flex" justifyContent="center" py={4}>
              <CircularProgress />
            </Box>
          ) : availableFields.length === 0 ? (
            <Paper sx={{ p: 4, textAlign: 'center' }}>
              <Typography color="text.secondary">
                No fields available to rent right now. Fields from other farmers will appear here when they list them.
              </Typography>
            </Paper>
          ) : (
            <Grid container spacing={2}>
              {availableFields.map((field) => {
                const name = field.name || 'Unnamed field';
                const location = field.location || '—';
                const category = field.category || field.subcategory || '—';
                const pricePerM2 = field.price_per_m2 ?? field.price ?? '—';
                const area = field.available_area ?? field.total_area ?? field.area_m2 ?? '—';
                return (
                  <Grid item xs={12} sm={6} md={4} key={field.id}>
                    <Card variant="outlined" sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                      <CardContent sx={{ flexGrow: 1 }}>
                        <Typography variant="h6" gutterBottom noWrap>
                          {name}
                        </Typography>
                        <Stack spacing={0.5} sx={{ mt: 1 }}>
                          <Typography variant="body2" color="text.secondary" display="flex" alignItems="center" gap={0.5}>
                            <LocationOn fontSize="small" /> {location}
                          </Typography>
                          <Typography variant="body2" color="text.secondary" display="flex" alignItems="center" gap={0.5}>
                            <CalendarToday fontSize="small" /> {category}
                          </Typography>
                          <Box sx={{ mt: 1 }}>
                            <Chip size="small" label={`${area} m²`} sx={{ mr: 0.5 }} />
                            <Chip size="small" label={typeof pricePerM2 === 'number' ? `$${pricePerM2}/m²` : pricePerM2} />
                          </Box>
                          {field.farmer_name && (
                            <Typography variant="caption" color="text.secondary">
                              Owner: {field.farmer_name}
                            </Typography>
                          )}
                        </Stack>
                      </CardContent>
                      <CardActions>
                        <Button
                          size="small"
                          variant="contained"
                          startIcon={<Add />}
                          onClick={() => openRentDialog(field)}
                          sx={{ bgcolor: 'success.main', '&:hover': { bgcolor: 'success.dark' } }}
                        >
                          Rent this field
                        </Button>
                      </CardActions>
                    </Card>
                  </Grid>
                );
              })}
            </Grid>
          )}
        </>
      )}

      {tab === TAB_MY_RENTALS && (
        <>
          {loadingRentals ? (
            <Box display="flex" justifyContent="center" py={4}>
              <CircularProgress />
            </Box>
          ) : myRentals.length === 0 ? (
            <Paper sx={{ p: 4, textAlign: 'center' }}>
              <Typography color="text.secondary">
                You haven&apos;t rented any fields yet. Use &quot;Find a field to rent&quot; to get started.
              </Typography>
            </Paper>
          ) : (
            <TableContainer component={Paper} variant="outlined">
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell><strong>Field</strong></TableCell>
                    <TableCell><strong>Location</strong></TableCell>
                    <TableCell><strong>Category</strong></TableCell>
                    <TableCell><strong>Start</strong></TableCell>
                    <TableCell><strong>End</strong></TableCell>
                    <TableCell><strong>Status</strong></TableCell>
                    <TableCell align="right"><strong>Price</strong></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {myRentals.map((r) => {
                    const status = (r.status || 'active').toLowerCase();
                    const isEnded = status === 'ended' || status === 'cancelled';
                    return (
                      <TableRow key={r.id}>
                        <TableCell>{r.field_name || r.field_id}</TableCell>
                        <TableCell>{r.field_location || '—'}</TableCell>
                        <TableCell>{r.category || r.subcategory || '—'}</TableCell>
                        <TableCell>{formatDate(r.start_date)}</TableCell>
                        <TableCell>{formatDate(r.end_date)}</TableCell>
                        <TableCell>
                          <Chip
                            size="small"
                            label={status === 'cancelled' ? 'Cancelled' : isEnded ? 'Ended' : 'Active'}
                            color={isEnded ? 'default' : 'success'}
                            variant={isEnded ? 'outlined' : 'filled'}
                          />
                        </TableCell>
                        <TableCell align="right">{r.price != null ? `$${Number(r.price).toFixed(2)}` : '—'}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </>
      )}

      <Dialog open={rentDialogOpen} onClose={closeRentDialog} maxWidth="sm" fullWidth>
        <DialogTitle>Rent this field</DialogTitle>
        <DialogContent>
          {selectedField && (
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              {selectedField.name} • {selectedField.location || '—'}
            </Typography>
          )}
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label="Start date"
              type="date"
              value={rentForm.start_date}
              onChange={(e) => setRentForm((f) => ({ ...f, start_date: e.target.value }))}
              InputLabelProps={{ shrink: true }}
              fullWidth
            />
            <TextField
              label="End date (optional)"
              type="date"
              value={rentForm.end_date}
              onChange={(e) => setRentForm((f) => ({ ...f, end_date: e.target.value }))}
              InputLabelProps={{ shrink: true }}
              fullWidth
            />
            <TextField
              label="Area (m²) - for reference"
              type="number"
              value={rentForm.area_m2}
              onChange={(e) => setRentForm((f) => ({ ...f, area_m2: e.target.value }))}
              inputProps={{ min: 0, step: 1 }}
              fullWidth
            />
            <TextField
              label="Total price ($)"
              type="number"
              value={rentForm.price}
              onChange={(e) => setRentForm((f) => ({ ...f, price: e.target.value }))}
              inputProps={{ min: 0, step: 0.01 }}
              fullWidth
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeRentDialog}>Cancel</Button>
          <Button variant="contained" onClick={handleRentSubmit} disabled={submitting}>
            {submitting ? 'Renting…' : 'Confirm rent'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}

export default RentAField;
