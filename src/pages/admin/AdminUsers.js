import { useEffect, useMemo, useState } from 'react';
import { Box, Grid, Card, CardContent, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Chip, Button, Dialog, DialogTitle, DialogContent, DialogActions, Skeleton, Snackbar } from '@mui/material';
import { adminService } from '../../services/admin';
import { useLocation } from 'react-router-dom';

const StatusChip = ({ status }) => {
  const colorMap = {
    approved: { bg: 'rgba(76,175,80,0.1)', border: 'rgba(76,175,80,0.2)', color: '#2E7D32' },
    pending: { bg: 'rgba(255,152,0,0.1)', border: 'rgba(255,152,0,0.2)', color: '#FB8C00' },
    rejected: { bg: 'rgba(244,67,54,0.1)', border: 'rgba(244,67,54,0.2)', color: '#D32F2F' },
  };
  const c = colorMap[String(status || 'pending').toLowerCase()] || colorMap.pending;
  return <Chip label={status} size="small" sx={{ bgcolor: c.bg, border: `1px solid ${c.border}`, color: c.color, textTransform: 'capitalize', fontWeight: 600 }} />;
};

const RoleChip = ({ role }) => {
  const r = String(role || '').toLowerCase();
  const c = r === 'farmer' ? { bg: 'rgba(76,175,80,0.1)', border: 'rgba(76,175,80,0.2)', color: '#2E7D32' } : { bg: 'rgba(33,150,243,0.1)', border: 'rgba(33,150,243,0.2)', color: '#1565C0' };
  return <Chip label={role} size="small" sx={{ bgcolor: c.bg, border: `1px solid ${c.border}`, color: c.color, textTransform: 'capitalize', fontWeight: 600 }} />;
};

const ConfirmDialog = ({ open, title, content, onClose, onConfirm }) => (
  <Dialog open={open} onClose={onClose}>
    <DialogTitle>{title}</DialogTitle>
    <DialogContent>{content}</DialogContent>
    <DialogActions>
      <Button onClick={onClose} variant="outlined">Cancel</Button>
      <Button onClick={onConfirm} variant="contained" color="primary">Confirm</Button>
    </DialogActions>
  </Dialog>
);

const AdminUsers = () => {
  const location = useLocation();
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [users, setUsers] = useState([]);
  const [loadingPending, setLoadingPending] = useState(true);
  const [pendingFarmers, setPendingFarmers] = useState([]);
  const [approveId, setApproveId] = useState(null);
  const [rejectId, setRejectId] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [docsUserId, setDocsUserId] = useState(null);
  const [docsLoading, setDocsLoading] = useState(false);
  const [docsContent, setDocsContent] = useState(null);
  const [authError, setAuthError] = useState(false);
  const [feedback, setFeedback] = useState('');
 

  useEffect(() => {
    let mounted = true;
    const loadUsers = async () => {
      try {
        setLoadingUsers(true);
        const resp = await adminService.getAllUsers();
        if (!mounted) return;
        setUsers(Array.isArray(resp.data) ? resp.data : []);
      } catch (e) {
        if (e?.response?.status === 401 && mounted) setAuthError(true);
      } finally {
        if (mounted) setLoadingUsers(false);
      }
    };
    const loadPending = async () => {
      try {
        setLoadingPending(true);
        const resp = await adminService.getPendingFarmers();
        if (!mounted) return;
        setPendingFarmers(Array.isArray(resp.data) ? resp.data.map(r => ({ ...r, approval_status: 'pending' })) : []);
      } catch (e) {
        if (e?.response?.status === 401 && mounted) setAuthError(true);
      } finally {
        if (mounted) setLoadingPending(false);
      }
    };
    loadUsers();
    loadPending();
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    if (!loadingUsers && !loadingPending && pendingFarmers.length === 0 && users.length > 0) {
      const derived = users.filter(u => String(u.user_type).toLowerCase() === 'farmer')
        .filter(u => String(u.approval_status || (u.is_active ? 'approved' : 'pending')).toLowerCase() === 'pending')
        .slice(0, 3)
        .map(u => ({ id: u.id, name: u.name, email: u.email, approval_status: 'pending' }));
      if (derived.length > 0) setPendingFarmers(derived);
    }
  }, [users, loadingUsers, loadingPending, pendingFarmers.length]);

 

  const farmers = useMemo(() => users.filter(u => String(u.user_type).toLowerCase() === 'farmer'), [users]);
  const buyers = useMemo(() => users.filter(u => String(u.user_type).toLowerCase() === 'buyer'), [users]);

  const handleApprove = async (id) => {
    setApproveId(null);
    const idx = pendingFarmers.findIndex(p => p.id === id);
    if (idx >= 0) {
      const next = [...pendingFarmers];
      next[idx] = { ...next[idx], approval_status: 'approved' };
      setPendingFarmers(next.filter(p => p.approval_status === 'pending'));
      setUsers((prev) => prev.map(u => u.id === id ? { ...u, approval_status: 'approved', is_active: true } : u));
      setFeedback('Farmer approved');
    }
    try {
      await adminService.approveFarmer(id);
    } catch (e) {
      const rollback = pendingFarmers.map(p => p.id === id ? { ...p, approval_status: 'pending' } : p);
      setPendingFarmers(rollback);
      setUsers((prev) => prev.map(u => u.id === id ? { ...u, approval_status: 'pending', is_active: u.is_active } : u));
    }
  };

  const handleReject = async (id) => {
    const reason = rejectReason;
    setRejectId(null);
    setRejectReason('');
    const idx = pendingFarmers.findIndex(p => p.id === id);
    if (idx >= 0) {
      const next = [...pendingFarmers];
      next[idx] = { ...next[idx], approval_status: 'rejected' };
      setPendingFarmers(next.filter(p => p.approval_status === 'pending'));
      setUsers((prev) => prev.map(u => u.id === id ? { ...u, approval_status: 'rejected', is_active: false } : u));
      setFeedback('Farmer rejected');
    }
    try {
      await adminService.rejectFarmer(id, reason);
    } catch (e) {
      const rollback = pendingFarmers.map(p => p.id === id ? { ...p, approval_status: 'pending' } : p);
      setPendingFarmers(rollback);
      setUsers((prev) => prev.map(u => u.id === id ? { ...u, approval_status: 'pending', is_active: u.is_active } : u));
    }
  };

  const openDocs = async (id) => {
    setDocsUserId(id);
    setDocsLoading(true);
    setDocsContent(null);
    try {
      const resp = await adminService.getFarmerDocuments(id);
      setDocsContent(resp.data?.documents || null);
    } finally {
      setDocsLoading(false);
    }
  };

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
      <Grid container spacing={0} alignItems="stretch">
        <Grid item xs={12} md={6} sx={{ pr: { md: 3 } }}>
          <Card sx={{ borderRadius: 3, boxShadow: '0 2px 12px rgba(0,0,0,0.08)', width: '100%', height: '100%' }}>
            <CardContent sx={{ height: '100%' }}>
              <Typography variant="h6" sx={{ fontWeight: 700, color: 'text.primary' }}>Farmers</Typography>
              <TableContainer component={Paper} sx={{ mt: 2 }}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 600, color: '#374151' }}>Name</TableCell>
                      <TableCell sx={{ fontWeight: 600, color: '#374151' }}>Email</TableCell>
                      <TableCell sx={{ fontWeight: 600, color: '#374151' }}>Role</TableCell>
                      <TableCell sx={{ fontWeight: 600, color: '#374151' }}>Status</TableCell>
                      <TableCell sx={{ fontWeight: 600, color: '#374151' }}>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {loadingUsers ? (
                      [...Array(5)].map((_, i) => (
                        <TableRow key={i}>
                          <TableCell><Skeleton width={120} /></TableCell>
                          <TableCell><Skeleton width={180} /></TableCell>
                          <TableCell><Skeleton width={80} /></TableCell>
                          <TableCell><Skeleton width={80} /></TableCell>
                          <TableCell><Skeleton width={120} /></TableCell>
                        </TableRow>
                      ))
                    ) : (
                      farmers.map(u => (
                        <TableRow key={u.id} hover>
                          <TableCell>{u.name}</TableCell>
                          <TableCell>{u.email}</TableCell>
                          <TableCell><RoleChip role={u.user_type} /></TableCell>
                          <TableCell><StatusChip status={u.approval_status || (u.is_active ? 'approved' : 'pending')} /></TableCell>
                          <TableCell>
                            <Button variant="outlined" size="small" onClick={() => openDocs(u.id)}>Documents</Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={6}>
          <Card sx={{ borderRadius: 3, boxShadow: '0 2px 12px rgba(0,0,0,0.08)', width: '100%', height: '100%' }}>
            <CardContent sx={{ height: '100%' }}>
              <Typography variant="h6" sx={{ fontWeight: 700, color: 'text.primary' }}>Buyers</Typography>
              <TableContainer component={Paper} sx={{ mt: 2 }}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 600, color: '#374151' }}>Name</TableCell>
                      <TableCell sx={{ fontWeight: 600, color: '#374151' }}>Email</TableCell>
                      <TableCell sx={{ fontWeight: 600, color: '#374151' }}>Role</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {loadingUsers ? (
                      [...Array(5)].map((_, i) => (
                        <TableRow key={i}>
                          <TableCell><Skeleton width={120} /></TableCell>
                          <TableCell><Skeleton width={180} /></TableCell>
                          <TableCell><Skeleton width={80} /></TableCell>
                        </TableRow>
                      ))
                    ) : (
                      buyers.map(u => (
                        <TableRow key={u.id} hover>
                          <TableCell>{u.name}</TableCell>
                          <TableCell>{u.email}</TableCell>
                          <TableCell><RoleChip role={u.user_type} /></TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Card sx={{ borderRadius: 3, boxShadow: '0 2px 12px rgba(0,0,0,0.08)' }}>
        <CardContent>
          <Typography variant="h6" sx={{ fontWeight: 700, color: 'text.primary' }}>Pending Farmer Approvals</Typography>
          <TableContainer component={Paper} sx={{ mt: 2 }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600, color: '#374151' }}>Name</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: '#374151' }}>Email</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: '#374151' }}>Status</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: '#374151' }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loadingPending ? (
                  [...Array(5)].map((_, i) => (
                    <TableRow key={i}>
                      <TableCell><Skeleton width={120} /></TableCell>
                      <TableCell><Skeleton width={180} /></TableCell>
                      <TableCell><Skeleton width={80} /></TableCell>
                      <TableCell><Skeleton width={160} /></TableCell>
                    </TableRow>
                  ))
                ) : pendingFarmers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4}>
                      <Typography variant="body2" sx={{ color: 'text.secondary' }}>No pending approvals</Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  pendingFarmers.map(f => (
                    <TableRow key={f.id} hover>
                      <TableCell>{f.name}</TableCell>
                      <TableCell>{f.email}</TableCell>
                      <TableCell><StatusChip status={f.approval_status} /></TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <Button variant="contained" color="success" size="small" onClick={() => setApproveId(f.id)}>Approve</Button>
                          <Button variant="outlined" color="error" size="small" onClick={() => setRejectId(f.id)}>Reject</Button>
                          <Button variant="text" size="small" onClick={() => setFeedback('Farmer kept pending')}>Keep Pending</Button>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      <ConfirmDialog
        open={Boolean(approveId)}
        title={'Approve farmer'}
        content={<Typography variant="body2">Confirm approval</Typography>}
        onClose={() => setApproveId(null)}
        onConfirm={() => handleApprove(approveId)}
      />

      <Dialog open={Boolean(rejectId)} onClose={() => setRejectId(null)}>
        <DialogTitle>Reject farmer</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'grid', gap: 2 }}>
            <Typography variant="body2">Enter reason</Typography>
            <Paper sx={{ p: 1 }}>
              <Box component="textarea" value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} style={{ width: '100%', minHeight: 80, border: 'none', outline: 'none', background: 'transparent' }} />
            </Paper>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRejectId(null)} variant="outlined">Cancel</Button>
          <Button onClick={() => handleReject(rejectId)} variant="contained" color="error">Reject</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={Boolean(docsUserId)} onClose={() => setDocsUserId(null)}>
        <DialogTitle>Farmer Documents</DialogTitle>
        <DialogContent>
          {docsLoading ? (
            <Box sx={{ display: 'grid', gap: 1 }}>
              <Skeleton width={240} />
              <Skeleton width={320} />
              <Skeleton width={280} />
            </Box>
          ) : (
            <Box sx={{ whiteSpace: 'pre-wrap', fontFamily: 'monospace', fontSize: 12 }}>{docsContent ? JSON.stringify(docsContent, null, 2) : 'No documents'}</Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDocsUserId(null)} variant="contained">Close</Button>
        </DialogActions>
      </Dialog>
      <Snackbar
        open={Boolean(feedback)}
        autoHideDuration={2000}
        onClose={() => setFeedback('')}
        message={feedback}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      />
    </Box>
  );
};

export default AdminUsers;
