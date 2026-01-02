import { useEffect, useState } from 'react';
import { Box, Card, CardContent, Typography, Stack, TextField, Select, MenuItem, FormControl, InputLabel, TableContainer, Paper, Table, TableHead, TableRow, TableCell, TableBody, Skeleton, Chip } from '@mui/material';
import dayjs from 'dayjs';
import { adminService } from '../../services/admin';
import { useLocation } from 'react-router-dom';
import supabase from '../../services/supabase';
import { orderService } from '../../services/orders';

const StatusChip = ({ status }) => {
  const s = String(status || '').toLowerCase();
  const map = {
    pending: { bg: 'rgba(255,152,0,0.1)', border: 'rgba(255,152,0,0.2)', color: '#FB8C00' },
    completed: { bg: 'rgba(76,175,80,0.1)', border: 'rgba(76,175,80,0.2)', color: '#2E7D32' },
    failed: { bg: 'rgba(244,67,54,0.1)', border: 'rgba(244,67,54,0.2)', color: '#D32F2F' },
    refunded: { bg: 'rgba(33,150,243,0.1)', border: 'rgba(33,150,243,0.2)', color: '#1565C0' },
  };
  const c = map[s] || map.pending;
  return <Chip label={status} size="small" sx={{ bgcolor: c.bg, border: `1px solid ${c.border}`, color: c.color, textTransform: 'capitalize', fontWeight: 600 }} />;
};

const AdminPayments = () => {
  const location = useLocation();
  const [from, setFrom] = useState(dayjs().subtract(30, 'day').format('YYYY-MM-DD'));
  const [to, setTo] = useState(dayjs().format('YYYY-MM-DD'));
  const [user, setUser] = useState('');
  const [status, setStatus] = useState('all');
  const [method, setMethod] = useState('all');
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState([]);
  const [authError, setAuthError] = useState(false);

  useEffect(() => {
    let mounted = true;
    const params = { from, to, user: user || undefined, status: status === 'all' ? undefined : status, method: method === 'all' ? undefined : method };
    const load = async () => {
      try {
        setLoading(true);
        const toExclusive = params.to ? dayjs(params.to).add(1, 'day').format('YYYY-MM-DD') : null;

        const normalize = (p) => ({
          id: p?.id ?? p?.payment_id ?? p?.txn_id ?? p?.transaction_id ?? p?.reference ?? p?.ref_id ?? `payment-${p?.created_at ?? Date.now()}`,
          payer_id: p?.payer_id ?? p?.buyer_id ?? p?.payer ?? p?.from_user_id ?? p?.user_id,
          payer_name: p?.payer_name ?? p?.buyer_name ?? p?.payer,
          payee_id: p?.payee_id ?? p?.farmer_id ?? p?.payee ?? p?.to_user_id,
          payee_name: p?.payee_name ?? p?.farmer_name ?? p?.payee,
          amount: Number(p?.amount ?? p?.total ?? p?.total_amount ?? p?.total_cost ?? p?.total_price ?? p?.price ?? p?.value ?? 0),
          currency: p?.currency ?? p?.currency_code ?? 'USD',
          method: p?.method ?? p?.payment_method ?? 'card',
          status: p?.status ?? p?.payment_status ?? 'completed',
          created_at: p?.created_at ?? p?.paid_at ?? p?.timestamp ?? p?.date ?? new Date().toISOString(),
        });

        let nextRows = [];

        try {
          const r = await adminService.getPayments(params);
          const apiRows = Array.isArray(r.data) ? r.data : (Array.isArray(r.data?.items) ? r.data.items : []);
          nextRows = apiRows.map(normalize);
        } catch (apiErr) {
          const is401 = apiErr?.response?.status === 401;
          if (is401 && mounted) setAuthError(true);
        }

        if (nextRows.length === 0 && supabase) {
          try {
            const query = supabase
              .from('payments')
              .select('*')
              .order('created_at', { ascending: false });
            if (params.from) query.gte('created_at', params.from);
            if (toExclusive) query.lte('created_at', toExclusive);
            if (params.user) query.or(`payer_id.eq.${params.user},payee_id.eq.${params.user}`);
            if (params.status) query.eq('status', params.status);
            if (params.method) query.eq('method', params.method);
            const { data, error } = await query;
            if (!error && Array.isArray(data)) nextRows = data.map(normalize);
          } catch (_) {}
        }

        if (nextRows.length === 0 && supabase) {
          try {
            const query = supabase
              .from('orders')
              .select('*')
              .order('created_at', { ascending: false });
            if (params.from) query.gte('created_at', params.from);
            if (toExclusive) query.lte('created_at', toExclusive);
            if (params.user) query.or(`buyer_id.eq.${params.user},farmer_id.eq.${params.user}`);
            const { data, error } = await query;
            if (!error && Array.isArray(data)) nextRows = data.map(normalize);
          } catch (_) {}
        }

        if (nextRows.length === 0) {
          try {
            const r = await orderService.getAllOrders({ from: params.from, to: params.to });
            const apiRows = Array.isArray(r.data) ? r.data : (Array.isArray(r.data?.items) ? r.data.items : (Array.isArray(r.data?.orders) ? r.data.orders : []));
            nextRows = apiRows.map(normalize);
          } catch (_) {}
        }

        if (mounted) setRows(nextRows);
      } catch (e) {
        const is401 = e?.response?.status === 401;
        if (is401 && mounted) setAuthError(true);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => { mounted = false; };
  }, [from, to, user, status, method]);

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
            <FormControl size="small" sx={{ minWidth: 140 }}>
              <InputLabel>Status</InputLabel>
              <Select value={status} label="Status" onChange={(e) => setStatus(e.target.value)}>
                <MenuItem value="all">All</MenuItem>
                <MenuItem value="pending">Pending</MenuItem>
                <MenuItem value="completed">Completed</MenuItem>
                <MenuItem value="failed">Failed</MenuItem>
                <MenuItem value="refunded">Refunded</MenuItem>
              </Select>
            </FormControl>
            <FormControl size="small" sx={{ minWidth: 140 }}>
              <InputLabel>Method</InputLabel>
              <Select value={method} label="Method" onChange={(e) => setMethod(e.target.value)}>
                <MenuItem value="all">All</MenuItem>
                <MenuItem value="card">Card</MenuItem>
                <MenuItem value="bank_transfer">Bank Transfer</MenuItem>
                <MenuItem value="cash">Cash</MenuItem>
              </Select>
            </FormControl>
          </Stack>
        </CardContent>
      </Card>

      <Card sx={{ borderRadius: 3, boxShadow: '0 2px 12px rgba(0,0,0,0.08)' }}>
        <CardContent>
          <Typography variant="h6" sx={{ fontWeight: 700, color: 'text.primary' }}>Payments</Typography>
          <TableContainer component={Paper} sx={{ mt: 2 }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600 }}>ID</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Payer</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Payee</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Amount</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Currency</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Method</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Date</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  [...Array(5)].map((_, i) => (
                    <TableRow key={i}><TableCell><Skeleton width={120} /></TableCell><TableCell><Skeleton width={160} /></TableCell><TableCell><Skeleton width={160} /></TableCell><TableCell><Skeleton width={100} /></TableCell><TableCell><Skeleton width={60} /></TableCell><TableCell><Skeleton width={120} /></TableCell><TableCell><Skeleton width={80} /></TableCell><TableCell><Skeleton width={140} /></TableCell></TableRow>
                  ))
                ) : rows.length === 0 ? (
                  <TableRow><TableCell colSpan={8}><Typography variant="body2" color="text.secondary">No payments</Typography></TableCell></TableRow>
                ) : (
                  rows.map(p => (
                    <TableRow key={p.id} hover>
                      <TableCell>{p.id}</TableCell>
                      <TableCell>{p.payer_name || p.payer_id}</TableCell>
                      <TableCell>{p.payee_name || p.payee_id}</TableCell>
                      <TableCell>{p.amount}</TableCell>
                      <TableCell>{p.currency}</TableCell>
                      <TableCell>{p.method}</TableCell>
                      <TableCell><StatusChip status={p.status} /></TableCell>
                      <TableCell>{new Date(p.created_at).toLocaleString()}</TableCell>
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

export default AdminPayments;
