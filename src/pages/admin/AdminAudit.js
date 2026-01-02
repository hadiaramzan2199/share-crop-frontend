import { useEffect, useState } from 'react';
import { Box, Card, CardContent, Typography, Stack, TextField, Select, MenuItem, FormControl, InputLabel, TableContainer, Paper, Table, TableHead, TableRow, TableCell, TableBody, Skeleton } from '@mui/material';
import dayjs from 'dayjs';
import { adminService } from '../../services/admin';
import { useLocation } from 'react-router-dom';
import supabase from '../../services/supabase';
import { orderService } from '../../services/orders';

const AdminAudit = () => {
  const [from, setFrom] = useState(dayjs().subtract(30, 'day').format('YYYY-MM-DD'));
  const [to, setTo] = useState(dayjs().format('YYYY-MM-DD'));
  const [user, setUser] = useState('');
  const [action, setAction] = useState('');
  const [entityType, setEntityType] = useState('');
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState([]);
  const [authError, setAuthError] = useState(false);
  const location = useLocation();

  useEffect(() => {
    let mounted = true;
    const params = { from, to, user: user || undefined, action: action || undefined, entity_type: entityType || undefined };
    const load = async () => {
      try {
        setLoading(true);
        const toExclusive = params.to ? dayjs(params.to).add(1, 'day').format('YYYY-MM-DD') : null;

        const normalize = (l) => ({
          id: l?.id ?? l?.log_id ?? l?.audit_id ?? `log-${l?.created_at ?? l?.timestamp ?? Date.now()}-${Math.random()}`,
          actor_id: l?.actor_id ?? l?.user_id ?? l?.created_by,
          actor_name: l?.actor_name ?? l?.user_name,
          action: l?.action ?? l?.event ?? l?.type ?? 'updated',
          entity_type: l?.entity_type ?? l?.entity ?? l?.target_type ?? 'unknown',
          entity_id: l?.entity_id ?? l?.target_id ?? l?.id,
          metadata: l?.metadata ?? l?.details ?? l?.meta ?? null,
          created_at: l?.created_at ?? l?.timestamp ?? l?.updated_at ?? new Date().toISOString(),
        });

        let nextRows = [];

        try {
          const r = await adminService.getAuditLogs(params);
          const apiRows = Array.isArray(r.data) ? r.data : (Array.isArray(r.data?.items) ? r.data.items : []);
          nextRows = apiRows.map(normalize);
        } catch (e) {
          if (e?.response?.status === 401 && mounted) setAuthError(true);
        }

        if (nextRows.length === 0 && supabase) {
          try {
            const query = supabase
              .from('audit_logs')
              .select('*')
              .order('created_at', { ascending: false });
            if (params.from) query.gte('created_at', params.from);
            if (toExclusive) query.lte('created_at', toExclusive);
            if (params.user) query.eq('actor_id', params.user);
            if (params.action) query.ilike('action', `%${params.action}%`);
            if (params.entity_type) query.eq('entity_type', params.entity_type);
            const { data, error } = await query;
            if (!error && Array.isArray(data)) nextRows = data.map(normalize);
          } catch (_) {}
        }

        if (nextRows.length === 0 && supabase) {
          try {
            const [complaintsResp, paymentsResp, ordersResp] = await Promise.allSettled([
              supabase
                .from('complaints')
                .select('*')
                .order('updated_at', { ascending: false })
                .limit(200),
              supabase
                .from('payments')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(200),
              supabase
                .from('orders')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(200),
            ]);

            const complaints = complaintsResp.status === 'fulfilled' && Array.isArray(complaintsResp.value?.data) ? complaintsResp.value.data : [];
            const payments = paymentsResp.status === 'fulfilled' && Array.isArray(paymentsResp.value?.data) ? paymentsResp.value.data : [];
            const orders = ordersResp.status === 'fulfilled' && Array.isArray(ordersResp.value?.data) ? ordersResp.value.data : [];

            const derived = [
              ...payments.map((p) => ({
                actor_id: p.payer_id ?? p.user_id ?? p.created_by,
                actor_name: p.payer_name,
                action: 'payment_recorded',
                entity_type: 'payment',
                entity_id: p.id ?? p.payment_id ?? p.reference,
                metadata: { amount: p.amount ?? p.total_amount ?? p.total, status: p.status, method: p.method, currency: p.currency },
                created_at: p.created_at ?? p.paid_at ?? p.timestamp,
              })),
              ...orders.map((o) => ({
                actor_id: o.buyer_id ?? o.user_id ?? o.created_by,
                actor_name: o.buyer_name,
                action: 'order_recorded',
                entity_type: 'order',
                entity_id: o.id ?? o.order_id,
                metadata: { status: o.status, amount: o.amount ?? o.total_amount ?? o.total_cost ?? o.total_price },
                created_at: o.created_at ?? o.date ?? o.timestamp,
              })),
              ...complaints.map((c) => ({
                actor_id: c.created_by,
                action: `complaint_${String(c.status || 'updated').toLowerCase()}`,
                entity_type: 'complaint',
                entity_id: c.id,
                metadata: { status: c.status, category: c.category, target_type: c.target_type, target_id: c.target_id },
                created_at: c.updated_at ?? c.created_at,
              })),
            ]
              .map(normalize)
              .filter((l) => {
                const created = l.created_at ? dayjs(l.created_at) : null;
                if (params.from && created && created.isBefore(dayjs(params.from))) return false;
                if (toExclusive && created && created.isAfter(dayjs(toExclusive))) return false;
                if (params.user && String(l.actor_id || '') !== String(params.user)) return false;
                if (params.action && !String(l.action || '').toLowerCase().includes(String(params.action).toLowerCase())) return false;
                if (params.entity_type && String(l.entity_type || '') !== String(params.entity_type)) return false;
                return true;
              })
              .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

            nextRows = derived;
          } catch (_) {}
        }

        if (nextRows.length === 0) {
          try {
            const r = await orderService.getAllOrders({ from: params.from, to: params.to });
            const apiRows = Array.isArray(r.data) ? r.data : (Array.isArray(r.data?.items) ? r.data.items : (Array.isArray(r.data?.orders) ? r.data.orders : []));
            nextRows = apiRows
              .map((o) => normalize({
                actor_id: o.buyer_id ?? o.user_id,
                actor_name: o.buyer_name,
                action: 'order_recorded',
                entity_type: 'order',
                entity_id: o.id,
                metadata: { status: o.status, amount: o.amount ?? o.total_amount ?? o.total_cost ?? o.total_price },
                created_at: o.created_at ?? o.date ?? o.timestamp,
              }))
              .filter((l) => {
                if (params.entity_type && String(l.entity_type || '') !== String(params.entity_type)) return false;
                if (params.action && !String(l.action || '').toLowerCase().includes(String(params.action).toLowerCase())) return false;
                if (params.user && String(l.actor_id || '') !== String(params.user)) return false;
                return true;
              });
          } catch (_) {}
        }

        if (mounted) setRows(nextRows);
      } catch (e) {
        if (e?.response?.status === 401 && mounted) setAuthError(true);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => { mounted = false; };
  }, [from, to, user, action, entityType]);

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
            <TextField label="Action" value={action} onChange={(e) => setAction(e.target.value)} size="small" />
            <FormControl size="small" sx={{ minWidth: 160 }}>
              <InputLabel>Entity Type</InputLabel>
              <Select value={entityType} label="Entity Type" onChange={(e) => setEntityType(e.target.value)}>
                <MenuItem value="">All</MenuItem>
                <MenuItem value="user">User</MenuItem>
                <MenuItem value="farm">Farm</MenuItem>
                <MenuItem value="field">Field</MenuItem>
                <MenuItem value="order">Order</MenuItem>
                <MenuItem value="payment">Payment</MenuItem>
              </Select>
            </FormControl>
          </Stack>
        </CardContent>
      </Card>

      <Card sx={{ borderRadius: 3, boxShadow: '0 2px 12px rgba(0,0,0,0.08)' }}>
        <CardContent>
          <Typography variant="h6" sx={{ fontWeight: 700, color: 'text.primary' }}>Audit Logs</Typography>
          <TableContainer component={Paper} sx={{ mt: 2 }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600 }}>Actor</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Action</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Entity</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Metadata</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Date</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  [...Array(5)].map((_, i) => (
                    <TableRow key={i}><TableCell><Skeleton width={160} /></TableCell><TableCell><Skeleton width={140} /></TableCell><TableCell><Skeleton width={200} /></TableCell><TableCell><Skeleton width={240} /></TableCell><TableCell><Skeleton width={140} /></TableCell></TableRow>
                  ))
                ) : rows.length === 0 ? (
                  <TableRow><TableCell colSpan={5}><Typography variant="body2" color="text.secondary">No logs</Typography></TableCell></TableRow>
                ) : (
                  rows.map(l => (
                    <TableRow key={l.id} hover>
                      <TableCell>{l.actor_name || l.actor_id}</TableCell>
                      <TableCell>{l.action}</TableCell>
                      <TableCell>{l.entity_type}#{l.entity_id}</TableCell>
                      <TableCell>{l.metadata ? JSON.stringify(l.metadata) : ''}</TableCell>
                      <TableCell>{new Date(l.created_at).toLocaleString()}</TableCell>
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

export default AdminAudit;
