import { useEffect, useState } from 'react';
import { Box, Card, CardContent, Typography, Stack, TextField, Select, MenuItem, FormControl, InputLabel, TableContainer, Paper, Table, TableHead, TableRow, TableCell, TableBody, Skeleton, Chip } from '@mui/material';
import dayjs from 'dayjs';
import { adminService } from '../../services/admin';
import { useLocation } from 'react-router-dom';

const StatusChip = ({ status }) => {
  const s = String(status || '').toLowerCase();
  const map = {
    pending: { bg: 'rgba(255,152,0,0.1)', border: 'rgba(255,152,0,0.2)', color: '#FB8C00' },
    completed: { bg: 'rgba(76,175,80,0.1)', border: 'rgba(76,175,80,0.2)', color: '#2E7D32' },
    failed: { bg: 'rgba(244,67,54,0.1)', border: 'rgba(244,67,54,0.2)', color: '#D32F2F' },
  };
  const c = map[s] || map.pending;
  return <Chip label={status} size="small" sx={{ bgcolor: c.bg, border: `1px solid ${c.border}`, color: c.color, textTransform: 'capitalize', fontWeight: 600 }} />;
};

const TypeChip = ({ type }) => {
  const s = String(type || '').toLowerCase();
  const map = {
    credit: { bg: 'rgba(33,150,243,0.1)', border: 'rgba(33,150,243,0.2)', color: '#1565C0' },
    debit: { bg: 'rgba(244,67,54,0.1)', border: 'rgba(244,67,54,0.2)', color: '#D32F2F' },
  };
  const c = map[s] || map.credit;
  return <Chip label={type} size="small" sx={{ bgcolor: c.bg, border: `1px solid ${c.border}`, color: c.color, textTransform: 'capitalize', fontWeight: 600 }} />;
};

const AdminCoins = () => {
  const location = useLocation();
  const [from, setFrom] = useState(dayjs().subtract(30, 'day').format('YYYY-MM-DD'));
  const [to, setTo] = useState(dayjs().format('YYYY-MM-DD'));
  const [user, setUser] = useState('');
  const [purchaseStatus, setPurchaseStatus] = useState('all');
  const [transactionType, setTransactionType] = useState('all');
  const [loadingPurchases, setLoadingPurchases] = useState(true);
  const [loadingTransactions, setLoadingTransactions] = useState(true);
  const [purchases, setPurchases] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [authError, setAuthError] = useState(false);

  useEffect(() => {
    let mounted = true;
    const params = { from, to, user: user || undefined, status: purchaseStatus === 'all' ? undefined : purchaseStatus };
    const loadPurchases = async () => {
      try {
        setLoadingPurchases(true);
        const r = await adminService.getCoinPurchases(params);
        const rows = Array.isArray(r.data) ? r.data : (Array.isArray(r.data?.items) ? r.data.items : []);
        if (mounted) setPurchases(rows);
      } catch (e) {
        if (e?.response?.status === 401 && mounted) setAuthError(true);
      } finally {
        if (mounted) setLoadingPurchases(false);
      }
    };
    loadPurchases();
    return () => { mounted = false; };
  }, [from, to, user, purchaseStatus]);

  useEffect(() => {
    let mounted = true;
    const params = { from, to, user: user || undefined, type: transactionType === 'all' ? undefined : transactionType };
    const loadTransactions = async () => {
      try {
        setLoadingTransactions(true);
        const r = await adminService.getCoinTransactions(params);
        const rows = Array.isArray(r.data) ? r.data : (Array.isArray(r.data?.items) ? r.data.items : []);
        if (mounted) setTransactions(rows);
      } catch (e) {
        if (e?.response?.status === 401 && mounted) setAuthError(true);
      } finally {
        if (mounted) setLoadingTransactions(false);
      }
    };
    loadTransactions();
    return () => { mounted = false; };
  }, [from, to, user, transactionType]);

  return (
    <Box sx={{ width: '100%', display: 'grid', gap: { xs: 2, sm: 3 }, mt: { xs: 1.5, sm: 2 } }}>
      {authError && !(process.env.REACT_APP_AUTH_DISABLED === 'true' || location.pathname.startsWith('/admin')) && (
        <Card sx={{ borderRadius: 3, boxShadow: '0 2px 12px rgba(0,0,0,0.08)', border: '1px solid', borderColor: 'error.light' }}>
          <CardContent>
            <Typography variant="subtitle1" color="error.main" sx={{ fontWeight: 700 }}>Unauthorized / Session expired</Typography>
            <Typography variant="body2" color="text.secondary">Please log in as an admin to access this page.</Typography>
          </CardContent>
        </Card>
      )}
      <Card sx={{ borderRadius: 3, boxShadow: '0 2px 12px rgba(0,0,0,0.08)' }}>
        <CardContent>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>Filters</Typography>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mt: 2 }}>
            <TextField label="From" type="date" value={from} onChange={(e) => setFrom(e.target.value)} size="small" InputLabelProps={{ shrink: true }} />
            <TextField label="To" type="date" value={to} onChange={(e) => setTo(e.target.value)} size="small" InputLabelProps={{ shrink: true }} />
            <TextField label="User ID" value={user} onChange={(e) => setUser(e.target.value)} size="small" />
          </Stack>
        </CardContent>
      </Card>

      <Card sx={{ borderRadius: 3, boxShadow: '0 2px 12px rgba(0,0,0,0.08)' }}>
        <CardContent>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems={{ xs: 'flex-start', sm: 'center' }} justifyContent="space-between">
            <Typography variant="h6" sx={{ fontWeight: 700, color: 'text.primary' }}>Coin Purchases</Typography>
            <FormControl size="small" sx={{ minWidth: 160 }}>
              <InputLabel>Status</InputLabel>
              <Select value={purchaseStatus} label="Status" onChange={(e) => setPurchaseStatus(e.target.value)}>
                <MenuItem value="all">All</MenuItem>
                <MenuItem value="pending">Pending</MenuItem>
                <MenuItem value="completed">Completed</MenuItem>
                <MenuItem value="failed">Failed</MenuItem>
              </Select>
            </FormControl>
          </Stack>
          <TableContainer component={Paper} sx={{ mt: 2 }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600 }}>Farmer</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Coins</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Amount</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Currency</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Payment Ref</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Date</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loadingPurchases ? (
                  [...Array(5)].map((_, i) => (
                    <TableRow key={i}><TableCell><Skeleton width={160} /></TableCell><TableCell><Skeleton width={80} /></TableCell><TableCell><Skeleton width={120} /></TableCell><TableCell><Skeleton width={80} /></TableCell><TableCell><Skeleton width={80} /></TableCell><TableCell><Skeleton width={140} /></TableCell><TableCell><Skeleton width={140} /></TableCell></TableRow>
                  ))
                ) : purchases.length === 0 ? (
                  <TableRow><TableCell colSpan={7}><Typography variant="body2" color="text.secondary">No purchases</Typography></TableCell></TableRow>
                ) : (
                  purchases.map(p => (
                    <TableRow key={p.id} hover>
                      <TableCell>{p.farmer_name || p.farmer_id}</TableCell>
                      <TableCell>{p.coins_purchased}</TableCell>
                      <TableCell>{p.amount}</TableCell>
                      <TableCell>{p.currency}</TableCell>
                      <TableCell><StatusChip status={p.status} /></TableCell>
                      <TableCell>{p.payment_ref}</TableCell>
                      <TableCell>{new Date(p.created_at).toLocaleString()}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      <Card sx={{ borderRadius: 3, boxShadow: '0 2px 12px rgba(0,0,0,0.08)' }}>
        <CardContent>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems={{ xs: 'flex-start', sm: 'center' }} justifyContent="space-between">
            <Typography variant="h6" sx={{ fontWeight: 700, color: 'text.primary' }}>Coin Usage</Typography>
            <FormControl size="small" sx={{ minWidth: 160 }}>
              <InputLabel>Type</InputLabel>
              <Select value={transactionType} label="Type" onChange={(e) => setTransactionType(e.target.value)}>
                <MenuItem value="all">All</MenuItem>
                <MenuItem value="credit">Credit</MenuItem>
                <MenuItem value="debit">Debit</MenuItem>
              </Select>
            </FormControl>
          </Stack>
          <TableContainer component={Paper} sx={{ mt: 2 }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600 }}>User</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Type</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Amount</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Reason</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Balance After</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Ref</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Date</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loadingTransactions ? (
                  [...Array(5)].map((_, i) => (
                    <TableRow key={i}><TableCell><Skeleton width={160} /></TableCell><TableCell><Skeleton width={80} /></TableCell><TableCell><Skeleton width={80} /></TableCell><TableCell><Skeleton width={200} /></TableCell><TableCell><Skeleton width={80} /></TableCell><TableCell><Skeleton width={140} /></TableCell><TableCell><Skeleton width={140} /></TableCell></TableRow>
                  ))
                ) : transactions.length === 0 ? (
                  <TableRow><TableCell colSpan={7}><Typography variant="body2" color="text.secondary">No transactions</Typography></TableCell></TableRow>
                ) : (
                  transactions.map(t => (
                    <TableRow key={t.id} hover>
                      <TableCell>{t.user_name || t.user_id}</TableCell>
                      <TableCell><TypeChip type={t.type} /></TableCell>
                      <TableCell>{t.amount}</TableCell>
                      <TableCell>{t.reason}</TableCell>
                      <TableCell>{t.balance_after}</TableCell>
                      <TableCell>{t.ref_type}#{t.ref_id}</TableCell>
                      <TableCell>{new Date(t.created_at).toLocaleString()}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>
    </Box>
  );
};

export default AdminCoins;
