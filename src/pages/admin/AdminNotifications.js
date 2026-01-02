import { useEffect, useState } from 'react';
import { Box, Card, CardContent, Typography, Stack, TextField, TableContainer, Paper, Table, TableHead, TableRow, TableCell, TableBody, Skeleton, Chip, Button, MenuItem } from '@mui/material';
import dayjs from 'dayjs';
import { adminService } from '../../services/admin';
import fieldsService from '../../services/fields';
import supabase from '../../services/supabase';
import { useAuth } from '../../contexts/AuthContext';

const RoleChip = ({ role }) => {
  const r = String(role || '').toLowerCase();
  const c = r === 'farmer' ? { bg: 'rgba(76,175,80,0.1)', border: 'rgba(76,175,80,0.2)', color: '#2E7D32' } : { bg: 'rgba(33,150,243,0.1)', border: 'rgba(33,150,243,0.2)', color: '#1565C0' };
  return <Chip label={role} size="small" sx={{ bgcolor: c.bg, border: `1px solid ${c.border}`, color: c.color, textTransform: 'capitalize', fontWeight: 600 }} />;
};

const StatusChip = ({ status }) => {
  const s = String(status || '').toLowerCase();
  const map = {
    pending: { bg: 'rgba(255,152,0,0.1)', border: 'rgba(255,152,0,0.2)', color: '#FB8C00' },
    approved: { bg: 'rgba(76,175,80,0.1)', border: 'rgba(76,175,80,0.2)', color: '#2E7D32' },
    rejected: { bg: 'rgba(244,67,54,0.1)', border: 'rgba(244,67,54,0.2)', color: '#D32F2F' },
  };
  const c = map[s] || map.pending;
  return <Chip label={status} size="small" sx={{ bgcolor: c.bg, border: `1px solid ${c.border}`, color: c.color, textTransform: 'capitalize', fontWeight: 600 }} />;
};

const AdminNotifications = () => {
  const { user } = useAuth();
  const [from, setFrom] = useState(dayjs().subtract(7, 'day').format('YYYY-MM-DD'));
  const [to, setTo] = useState(dayjs().format('YYYY-MM-DD'));
  const [loadingNew, setLoadingNew] = useState(true);
  const [loadingPending, setLoadingPending] = useState(true);
  const [loadingComplaints, setLoadingComplaints] = useState(true);
  const [newUsers, setNewUsers] = useState([]);
  const [pendingFarmers, setPendingFarmers] = useState([]);
  const [complaints, setComplaints] = useState([]);
  const [createTitle, setCreateTitle] = useState('');
  const [createCreatedBy, setCreateCreatedBy] = useState('');
  const [createCategory, setCreateCategory] = useState('Service');
  const [createMessage, setCreateMessage] = useState('');
  const [createTargetType, setCreateTargetType] = useState('field');
  const [createTargetId, setCreateTargetId] = useState('');
  const [fields, setFields] = useState([]);
  const [loadingFields, setLoadingFields] = useState(false);
  const [creatingComplaint, setCreatingComplaint] = useState(false);
  const [createComplaintError, setCreateComplaintError] = useState(null);

  useEffect(() => {
    let mounted = true;
    const params = { from, to };
    const loadNew = async () => {
      try { setLoadingNew(true); const r = await adminService.getNewUserRegistrations(params); const rows = Array.isArray(r.data) ? r.data : (Array.isArray(r.data?.items) ? r.data.items : []); if (mounted) setNewUsers(rows); } finally { if (mounted) setLoadingNew(false); }
    };
    const loadPending = async () => {
      try { setLoadingPending(true); const r = await adminService.getPendingFarmerApprovals(params); const rows = Array.isArray(r.data) ? r.data : (Array.isArray(r.data?.items) ? r.data.items : []); if (mounted) setPendingFarmers(rows); } finally { if (mounted) setLoadingPending(false); }
    };
    const loadComplaints = async () => {
      try { setLoadingComplaints(true); const r = await adminService.getComplaints({ from, to }); const rows = Array.isArray(r.data) ? r.data : (Array.isArray(r.data?.items) ? r.data.items : []); if (mounted) setComplaints(rows); } finally { if (mounted) setLoadingComplaints(false); }
    };
    loadNew(); loadPending(); loadComplaints();
    return () => { mounted = false; };
  }, [from, to]);

  useEffect(() => {
    setCreateCreatedBy((prev) => prev || user?.id || '');
  }, [user?.id]);

  useEffect(() => {
    let mounted = true;
    const loadFields = async () => {
      try {
        setLoadingFields(true);
        const r = await fieldsService.getAll();
        const rows = Array.isArray(r.data) ? r.data : [];
        if (!mounted) return;
        setFields(rows);
        setCreateTargetId((prev) => prev || rows[0]?.id || '');
      } finally {
        if (mounted) setLoadingFields(false);
      }
    };
    loadFields();
    return () => { mounted = false; };
  }, []);

  const createComplaint = async () => {
    const title = createTitle.trim();
    const message = createMessage.trim();
    const createdBy = createCreatedBy.trim();
    const targetType = createTargetType.trim();
    const targetId = createTargetId.trim();
    if (!createdBy || !targetType || !targetId) return;

    setCreateComplaintError(null);
    setCreatingComplaint(true);
    try {
      if (!supabase) throw new Error('Supabase is not configured');
      const { error } = await supabase.from('complaints').insert([{
        created_by: createdBy,
        target_type: targetType,
        target_id: targetId,
        status: 'open',
        category: createCategory.trim() || null,
        admin_remarks: `${title}${message ? `\n\n${message}` : ''}`.trim() || null,
      }]);
      if (error) throw error;

      setCreateTitle('');
      setCreateCreatedBy(user?.id || '');
      setCreateCategory('Service');
      setCreateMessage('');

      setLoadingComplaints(true);
      const r = await adminService.getComplaints({ from, to });
      const rows = Array.isArray(r.data) ? r.data : (Array.isArray(r.data?.items) ? r.data.items : []);
      setComplaints(rows);
    } catch (e) {
      setCreateComplaintError(e);
    } finally {
      setCreatingComplaint(false);
      setLoadingComplaints(false);
    }
  };

  return (
    <Box sx={{ width: '100%', display: 'grid', gap: { xs: 2, sm: 3 }, mt: { xs: 1.5, sm: 2 } }}>
      <Card sx={{ borderRadius: 3, boxShadow: '0 2px 12px rgba(0,0,0,0.08)' }}>
        <CardContent>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>Filters</Typography>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mt: 2 }}>
            <TextField label="From" type="date" value={from} onChange={(e) => setFrom(e.target.value)} size="small" InputLabelProps={{ shrink: true }} />
            <TextField label="To" type="date" value={to} onChange={(e) => setTo(e.target.value)} size="small" InputLabelProps={{ shrink: true }} />
          </Stack>
        </CardContent>
      </Card>

      <Card sx={{ borderRadius: 3, boxShadow: '0 2px 12px rgba(0,0,0,0.08)' }}>
        <CardContent>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>Create Complaint</Typography>
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} sx={{ mt: 2 }}>
            <TextField label="Title" value={createTitle} onChange={(e) => setCreateTitle(e.target.value)} size="small" fullWidth />
            <TextField label="Created By (User ID)" value={createCreatedBy} onChange={(e) => setCreateCreatedBy(e.target.value)} size="small" fullWidth />
            <TextField label="Category" value={createCategory} onChange={(e) => setCreateCategory(e.target.value)} size="small" fullWidth select>
              <MenuItem value="Service">Service</MenuItem>
              <MenuItem value="Payment">Payment</MenuItem>
              <MenuItem value="Quality">Quality</MenuItem>
              <MenuItem value="Delivery">Delivery</MenuItem>
              <MenuItem value="Refund">Refund</MenuItem>
              <MenuItem value="Account">Account</MenuItem>
              <MenuItem value="Fraud">Fraud</MenuItem>
              <MenuItem value="Safety">Safety</MenuItem>
              <MenuItem value="Listing">Listing</MenuItem>
              <MenuItem value="Pricing">Pricing</MenuItem>
              <MenuItem value="Other">Other</MenuItem>
            </TextField>
          </Stack>
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} sx={{ mt: 2 }}>
            <TextField
              label="Target Type"
              value={createTargetType}
              onChange={(e) => setCreateTargetType(e.target.value)}
              size="small"
              fullWidth
              select
            >
              <MenuItem value="field">field</MenuItem>
            </TextField>
            <TextField
              label="Target Field"
              value={createTargetId}
              onChange={(e) => setCreateTargetId(e.target.value)}
              size="small"
              fullWidth
              select
              disabled={loadingFields || fields.length === 0}
            >
              {fields.map((f) => (
                <MenuItem key={f.id} value={f.id}>{f.name || f.product_name || f.id}</MenuItem>
              ))}
            </TextField>
          </Stack>
          <TextField label="Message" value={createMessage} onChange={(e) => setCreateMessage(e.target.value)} size="small" fullWidth multiline minRows={3} sx={{ mt: 2 }} />
          {createComplaintError ? (
            <Typography variant="body2" color="error.main" sx={{ mt: 1.5 }}>
              {createComplaintError?.response?.data?.message || createComplaintError?.message || 'Failed to create complaint'}
            </Typography>
          ) : null}
          <Stack direction="row" spacing={1} sx={{ mt: 2 }} justifyContent="flex-end">
            <Button
              variant="contained"
              onClick={createComplaint}
              disabled={creatingComplaint || !createCreatedBy.trim() || !createTargetType.trim() || !createTargetId.trim()}
            >
              {creatingComplaint ? 'Creating…' : 'Create Open Complaint'}
            </Button>
          </Stack>
        </CardContent>
      </Card>

      <Card sx={{ borderRadius: 3, boxShadow: '0 2px 12px rgba(0,0,0,0.08)' }}>
        <CardContent>
          <Typography variant="h6" sx={{ fontWeight: 700, color: 'text.primary' }}>New Users</Typography>
          <TableContainer component={Paper} sx={{ mt: 2 }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600 }}>Name</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Email</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Role</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Joined</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loadingNew ? (
                  [...Array(5)].map((_, i) => (
                    <TableRow key={i}><TableCell><Skeleton width={160} /></TableCell><TableCell><Skeleton width={200} /></TableCell><TableCell><Skeleton width={80} /></TableCell><TableCell><Skeleton width={140} /></TableCell></TableRow>
                  ))
                ) : newUsers.length === 0 ? (
                  <TableRow><TableCell colSpan={4}><Typography variant="body2" color="text.secondary">No new users</Typography></TableCell></TableRow>
                ) : (
                  newUsers.map(u => (
                    <TableRow key={u.id} hover>
                      <TableCell>{u.name}</TableCell>
                      <TableCell>{u.email}</TableCell>
                      <TableCell><RoleChip role={u.user_type} /></TableCell>
                      <TableCell>{new Date(u.created_at).toLocaleString()}</TableCell>
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
          <Typography variant="h6" sx={{ fontWeight: 700, color: 'text.primary' }}>Pending Farmer Approvals</Typography>
          <TableContainer component={Paper} sx={{ mt: 2 }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600 }}>Name</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Email</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Requested</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loadingPending ? (
                  [...Array(5)].map((_, i) => (
                    <TableRow key={i}><TableCell><Skeleton width={160} /></TableCell><TableCell><Skeleton width={200} /></TableCell><TableCell><Skeleton width={80} /></TableCell><TableCell><Skeleton width={140} /></TableCell></TableRow>
                  ))
                ) : pendingFarmers.length === 0 ? (
                  <TableRow><TableCell colSpan={4}><Typography variant="body2" color="text.secondary">No pending approvals</Typography></TableCell></TableRow>
                ) : (
                  pendingFarmers.map(u => (
                    <TableRow key={u.id} hover>
                      <TableCell>{u.name}</TableCell>
                      <TableCell>{u.email}</TableCell>
                      <TableCell><StatusChip status={u.approval_status || 'pending'} /></TableCell>
                      <TableCell>{new Date(u.requested_at || u.created_at).toLocaleString()}</TableCell>
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
          <Typography variant="h6" sx={{ fontWeight: 700, color: 'text.primary' }}>Complaints</Typography>
          <TableContainer component={Paper} sx={{ mt: 2 }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600 }}>Title</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>User</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Updated</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loadingComplaints ? (
                  [...Array(5)].map((_, i) => (
                    <TableRow key={i}><TableCell><Skeleton width={160} /></TableCell><TableCell><Skeleton width={120} /></TableCell><TableCell><Skeleton width={80} /></TableCell><TableCell><Skeleton width={140} /></TableCell></TableRow>
                  ))
                ) : complaints.length === 0 ? (
                  <TableRow><TableCell colSpan={4}><Typography variant="body2" color="text.secondary">No complaints</Typography></TableCell></TableRow>
                ) : (
                  complaints.map(c => (
                    <TableRow key={c.id} hover>
                      <TableCell>{c.title || c.subject}</TableCell>
                      <TableCell>{c.user_name || c.created_by}</TableCell>
                      <TableCell><StatusChip status={c.status} /></TableCell>
                      <TableCell>{new Date(c.updated_at || c.created_at).toLocaleString()}</TableCell>
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

export default AdminNotifications;
