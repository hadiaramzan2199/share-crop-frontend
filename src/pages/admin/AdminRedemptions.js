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
} from '@mui/material';
import {
  CheckCircle,
  Cancel,
  HourglassEmpty,
  AccountBalance,
  CreditCard,
} from '@mui/icons-material';
import api from '../../services/api';

const AdminRedemptions = () => {
  const [redemptions, setRedemptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedRedemption, setSelectedRedemption] = useState(null);
  const [actionDialogOpen, setActionDialogOpen] = useState(false);
  const [action, setAction] = useState('');
  const [adminNotes, setAdminNotes] = useState('');
  const [processing, setProcessing] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');

  const loadRedemptions = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = statusFilter !== 'all' ? `?status=${statusFilter}` : '';
      const response = await api.get(`/api/admin/redemptions${params}`);
      setRedemptions(response.data || []);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load redemptions');
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    loadRedemptions();
  }, [loadRedemptions]);

  const handleAction = (redemption, actionType) => {
    setSelectedRedemption(redemption);
    setAction(actionType);
    setAdminNotes('');
    setActionDialogOpen(true);
  };

  const confirmAction = async () => {
    if (!selectedRedemption) return;

    setProcessing(true);
    setError(null);
    try {
      await api.patch(`/api/admin/redemptions/${selectedRedemption.id}`, {
        action,
        admin_notes: adminNotes || null
      });
      setActionDialogOpen(false);
      setSelectedRedemption(null);
      loadRedemptions();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to process redemption');
    } finally {
      setProcessing(false);
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
      <Container maxWidth="xl">
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">
          Redemption Management
        </Typography>
        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel>Filter Status</InputLabel>
          <Select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            label="Filter Status"
          >
            <MenuItem value="all">All</MenuItem>
            <MenuItem value="pending">Pending</MenuItem>
            <MenuItem value="under_review">Under Review</MenuItem>
            <MenuItem value="approved">Approved</MenuItem>
            <MenuItem value="paid">Paid</MenuItem>
            <MenuItem value="rejected">Rejected</MenuItem>
          </Select>
        </FormControl>
      </Box>

      <Alert severity="info" sx={{ mb: 3 }}>
        <Typography variant="body2" fontWeight={600} gutterBottom>
          Redemption Process Timeline:
        </Typography>
        <Typography variant="body2" component="div">
          <strong>1. Request Created:</strong> User submits redemption → Coins locked<br/>
          <strong>2. Admin Review:</strong> Approve or reject the request<br/>
          <strong>3. Transfer Initiated:</strong> When approved, Stripe transfer is created immediately<br/>
          <strong>4. User Receives Funds:</strong> Money arrives in user's bank account within <strong>1-2 business days</strong> (Stripe processing time)
        </Typography>
      </Alert>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {redemptions.length === 0 ? (
        <Card>
          <CardContent>
            <Box textAlign="center" py={4}>
              <Typography variant="h6" color="text.secondary">
                No redemption requests found
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
                <TableCell>User</TableCell>
                <TableCell>Coins</TableCell>
                <TableCell>Payout Amount</TableCell>
                <TableCell>Payout Method</TableCell>
                <TableCell>Status & Timeline</TableCell>
                <TableCell>Transfer ID</TableCell>
                <TableCell>Admin Notes</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {redemptions.map((redemption) => (
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
                    <Box>
                      <Typography variant="body2" fontWeight={600}>
                        {redemption.user_name || 'N/A'}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {redemption.user_email || ''}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    {redemption.coins_requested?.toLocaleString()}
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" fontWeight={600}>
                      {(() => {
                        const currencySymbols = {
                          'USD': '$', 'EUR': '€', 'GBP': '£', 'PKR': '₨',
                          'JPY': '¥', 'CAD': 'C$', 'AUD': 'A$', 'CHF': 'CHF'
                        };
                        const symbol = currencySymbols[redemption.currency?.toUpperCase()] || redemption.currency?.toUpperCase() || '$';
                        return `${symbol}${((redemption.payout_amount_cents || 0) / 100).toFixed(2)}`;
                      })()}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Fee: ${((redemption.platform_fee_cents || 0) / 100).toFixed(2)}
                    </Typography>
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
                      {redemption.reviewed_at && (
                        <Typography variant="caption" color="text.secondary" display="block">
                          Reviewed: {new Date(redemption.reviewed_at).toLocaleDateString()}
                          {redemption.reviewer_name && ` by ${redemption.reviewer_name}`}
                        </Typography>
                      )}
                      {redemption.status === 'paid' && (
                        <Typography variant="caption" color="success.main" display="block" sx={{ mt: 0.5 }}>
                          Transfer initiated. User will receive funds in 1-2 business days.
                        </Typography>
                      )}
                    </Box>
                  </TableCell>
                  <TableCell>
                    {redemption.stripe_transfer_id ? (
                      <Typography variant="caption" sx={{ fontFamily: 'monospace', fontSize: '0.7rem' }}>
                        {redemption.stripe_transfer_id}
                      </Typography>
                    ) : (
                      <Typography variant="body2" color="text.secondary">-</Typography>
                    )}
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
                  <TableCell>
                    {['pending', 'under_review'].includes(redemption.status) && (
                      <Stack direction="row" spacing={1}>
                        <Button
                          size="small"
                          variant="contained"
                          color="success"
                          onClick={() => handleAction(redemption, 'approve')}
                        >
                          Approve
                        </Button>
                        <Button
                          size="small"
                          variant="outlined"
                          color="error"
                          onClick={() => handleAction(redemption, 'reject')}
                        >
                          Reject
                        </Button>
                      </Stack>
                    )}
                    {redemption.status === 'paid' && (
                      <Typography variant="caption" color="success.main">
                        ✓ Paid
                      </Typography>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Action Dialog */}
      <Dialog open={actionDialogOpen} onClose={() => !processing && setActionDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {action === 'approve' ? 'Approve Redemption' : 'Reject Redemption'}
        </DialogTitle>
        <DialogContent>
          {selectedRedemption && (
            <Box mb={2}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                User: {selectedRedemption.user_name} ({selectedRedemption.user_email})
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Coins: {selectedRedemption.coins_requested?.toLocaleString()}
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Payout Amount: {(() => {
                  const currencySymbols = {
                    'USD': '$', 'EUR': '€', 'GBP': '£', 'PKR': '₨',
                    'JPY': '¥', 'CAD': 'C$', 'AUD': 'A$', 'CHF': 'CHF'
                  };
                  const symbol = currencySymbols[selectedRedemption.currency?.toUpperCase()] || selectedRedemption.currency?.toUpperCase() || '$';
                  return `${symbol}${((selectedRedemption.payout_amount_cents || 0) / 100).toFixed(2)}`;
                })()}
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Request Date: {new Date(selectedRedemption.created_at).toLocaleString()}
              </Typography>
              {action === 'approve' && (
                <Alert severity="info" sx={{ mt: 2 }}>
                  <Typography variant="body2">
                    Approving will immediately create a Stripe transfer. The user will receive funds in their bank account within <strong>1-2 business days</strong>.
                  </Typography>
                </Alert>
              )}
            </Box>
          )}
          <TextField
            fullWidth
            multiline
            rows={3}
            label="Admin Notes (Optional)"
            value={adminNotes}
            onChange={(e) => setAdminNotes(e.target.value)}
            placeholder="Add notes about this decision..."
            sx={{ mt: 2 }}
          />
          {error && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {error}
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setActionDialogOpen(false)} disabled={processing}>
            Cancel
          </Button>
          <Button
            onClick={confirmAction}
            variant="contained"
            color={action === 'approve' ? 'success' : 'error'}
            disabled={processing}
          >
            {processing ? <CircularProgress size={20} /> : action === 'approve' ? 'Approve' : 'Reject'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default AdminRedemptions;
