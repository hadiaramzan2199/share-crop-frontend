import { useEffect, useMemo, useState } from 'react';
import { Box, Card, CardContent, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Chip, Button, Dialog, DialogTitle, DialogContent, DialogActions, Skeleton, Stack, Select, MenuItem, FormControl, InputLabel, TextField } from '@mui/material';
import { adminService } from '../../services/admin';
import { useLocation } from 'react-router-dom';

const StatusChip = ({ status }) => {
  const s = String(status || '').toLowerCase();
  const map = {
    open: { bg: 'rgba(244,67,54,0.1)', border: 'rgba(244,67,54,0.2)', color: '#D32F2F' },
    in_review: { bg: 'rgba(255,152,0,0.1)', border: 'rgba(255,152,0,0.2)', color: '#FB8C00' },
    resolved: { bg: 'rgba(76,175,80,0.1)', border: 'rgba(76,175,80,0.2)', color: '#2E7D32' },
  };
  const c = map[s] || map.open;
  return <Chip label={status} size="small" sx={{ bgcolor: c.bg, border: `1px solid ${c.border}`, color: c.color, textTransform: 'capitalize', fontWeight: 600 }} />;
};

const allowedTransitions = {
  open: ['in_review'],
  in_review: ['resolved', 'open'],
  resolved: [],
};

const AdminQA = () => {
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [complaints, setComplaints] = useState([]);
  const [statusFilter, setStatusFilter] = useState('all');
  const [detailId, setDetailId] = useState(null);
  const [detailItem, setDetailItem] = useState(null);
  const [updateId, setUpdateId] = useState(null);
  const [updateTargetStatus, setUpdateTargetStatus] = useState('');
  const [remarksDraft, setRemarksDraft] = useState('');
  const [remarksSavingId, setRemarksSavingId] = useState(null);
  const [authError, setAuthError] = useState(false);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        setLoading(true);
        const resp = await adminService.getComplaints({ status: statusFilter === 'all' ? undefined : statusFilter });
        if (!mounted) return;
        const list = Array.isArray(resp.data) ? resp.data : (Array.isArray(resp.data?.items) ? resp.data.items : []);
        setComplaints(list);
      } catch (e) {
        if (e?.response?.status === 401 && mounted) setAuthError(true);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => { mounted = false; };
  }, [statusFilter]);

  const filtered = useMemo(() => {
    if (statusFilter === 'all') return complaints;
    return complaints.filter(c => String(c.status).toLowerCase() === statusFilter);
  }, [complaints, statusFilter]);

  const openDetail = (item) => { setDetailId(item.id); setDetailItem(item); setRemarksDraft(item.admin_remarks || ''); };
  const closeDetail = () => { setDetailId(null); setDetailItem(null); };

  const startStatusUpdate = (item, nextStatus) => { setUpdateId(item.id); setUpdateTargetStatus(nextStatus); };
  const cancelStatusUpdate = () => { setUpdateId(null); setUpdateTargetStatus(''); };
  const confirmStatusUpdate = async () => {
    const id = updateId; const target = updateTargetStatus;
    cancelStatusUpdate();
    const optimistic = complaints.map(c => c.id === id ? { ...c, status: target } : c);
    setComplaints(optimistic);
    try {
      await adminService.updateComplaintStatus(id, target);
    } catch (e) {
      const rollback = complaints; // revert to previous state
      setComplaints(rollback);
    }
  };

  const saveRemarks = async (id) => {
    setRemarksSavingId(id);
    const optimistic = complaints.map(c => c.id === id ? { ...c, admin_remarks: remarksDraft } : c);
    setComplaints(optimistic);
    try {
      await adminService.updateComplaintRemarks(id, remarksDraft);
    } catch (e) {
      // rollback on error
      const original = complaints.find(c => c.id === id)?.admin_remarks || '';
      const rollback = complaints.map(c => c.id === id ? { ...c, admin_remarks: original } : c);
      setComplaints(rollback);
    } finally {
      setRemarksSavingId(null);
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
      <Card sx={{ borderRadius: 3, boxShadow: '0 2px 12px rgba(0,0,0,0.08)' }}>
        <CardContent>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems={{ xs: 'flex-start', sm: 'center' }} justifyContent="space-between">
            <Typography variant="h6" sx={{ fontWeight: 700, color: 'text.primary' }}>Complaints</Typography>
            <FormControl size="small" sx={{ minWidth: 180 }}>
              <InputLabel>Status</InputLabel>
              <Select value={statusFilter} label="Status" onChange={(e) => setStatusFilter(e.target.value)}>
                <MenuItem value="all">All</MenuItem>
                <MenuItem value="open">Open</MenuItem>
                <MenuItem value="in_review">In Review</MenuItem>
                <MenuItem value="resolved">Resolved</MenuItem>
              </Select>
            </FormControl>
          </Stack>

          <TableContainer component={Paper} sx={{ mt: 2 }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600, color: '#374151' }}>Category</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: '#374151' }}>Admin Remarks</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: '#374151' }}>Status</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: '#374151' }}>Updated</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: '#374151' }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  [...Array(5)].map((_, i) => (
                    <TableRow key={i}>
                      <TableCell><Skeleton width={160} /></TableCell>
                      <TableCell><Skeleton width={120} /></TableCell>
                      <TableCell><Skeleton width={80} /></TableCell>
                      <TableCell><Skeleton width={120} /></TableCell>
                      <TableCell><Skeleton width={160} /></TableCell>
                    </TableRow>
                  ))
                ) : filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5}>
                      <Typography variant="body2" color="text.secondary">No complaints found</Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map(item => {
                    const nextStatuses = allowedTransitions[String(item.status || '').toLowerCase()] || [];
                    return (
                      <TableRow key={item.id} hover>
                        <TableCell>{item.category || '—'}</TableCell>
                        <TableCell>{item.admin_remarks || '—'}</TableCell>
                        <TableCell><StatusChip status={item.status} /></TableCell>
                        <TableCell>{new Date(item.updated_at || item.created_at).toLocaleString()}</TableCell>
                        <TableCell>
                          <Stack direction="row" spacing={1}>
                            <Button variant="outlined" size="small" onClick={() => openDetail(item)}>Details</Button>
                            {nextStatuses.map(ns => (
                              <Button key={ns} variant="contained" size="small" onClick={() => startStatusUpdate(item, ns)}>
                                Mark {ns.replace('_', ' ')}
                              </Button>
                            ))}
                          </Stack>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      <Dialog open={Boolean(detailId)} onClose={closeDetail} fullWidth maxWidth="md">
        <DialogTitle>Complaint Details</DialogTitle>
        <DialogContent>
          {detailItem ? (
            <Box sx={{ display: 'grid', gap: 2 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>{detailItem.title || detailItem.subject}</Typography>
              <Typography variant="body2" color="text.secondary">{detailItem.description || detailItem.details || 'No description'}</Typography>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems={{ xs: 'stretch', sm: 'center' }}>
                <StatusChip status={detailItem.status} />
                <Typography variant="caption" color="text.secondary">Updated: {new Date(detailItem.updated_at || detailItem.created_at).toLocaleString()}</Typography>
              </Stack>
              <Box sx={{ display: 'grid', gap: 1 }}>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>Admin Remarks</Typography>
                <TextField
                  value={remarksDraft}
                  onChange={(e) => setRemarksDraft(e.target.value)}
                  multiline
                  minRows={3}
                  placeholder="Add remarks"
                  size="small"
                />
                <Stack direction="row" spacing={1}>
                  <Button variant="contained" size="small" onClick={() => saveRemarks(detailItem.id)} disabled={remarksSavingId === detailItem.id}>Save Remarks</Button>
                  <Button variant="outlined" size="small" onClick={closeDetail}>Close</Button>
                </Stack>
              </Box>
            </Box>
          ) : null}
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(updateId)} onClose={cancelStatusUpdate}>
        <DialogTitle>Confirm Status Change</DialogTitle>
        <DialogContent>
          <Typography variant="body2">Are you sure you want to mark this complaint as {updateTargetStatus.replace('_', ' ')}?</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={cancelStatusUpdate} variant="outlined">Cancel</Button>
          <Button onClick={confirmStatusUpdate} variant="contained">Confirm</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AdminQA;
