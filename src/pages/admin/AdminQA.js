import { useEffect, useMemo, useState } from 'react';
import { 
  Box, 
  Card, 
  CardContent, 
  Typography, 
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
  Skeleton, 
  Stack, 
  Select, 
  MenuItem, 
  FormControl, 
  InputLabel, 
  TextField,
  InputAdornment,
  IconButton,
  Tooltip,
  Divider,
  Alert,
  useMediaQuery,
  useTheme,
  TableSortLabel,
  Grid,
  Menu,
  Tabs,
  Tab,
} from '@mui/material';
import { 
  Search, 
  FilterList, 
  Visibility, 
  Close, 
  Refresh,
  ArrowUpward,
  ArrowDownward,
  ReportProblem,
  Person,
  Category,
  CalendarToday,
  Description,
  MoreVert,
  CheckCircle,
  HourglassEmpty,
  Done,
  Chat,
  AccountBalanceWallet,
  AttachFile,
  VerifiedUser,
} from '@mui/icons-material';
import { adminService } from '../../services/admin';
import { complaintService } from '../../services/complaints';
import { useLocation, useNavigate } from 'react-router-dom';
import supabase from '../../services/supabase';
import { v4 as uuidv4 } from 'uuid';

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
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const location = useLocation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [complaints, setComplaints] = useState([]);
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [userTypeFilter, setUserTypeFilter] = useState('all'); // 'all', 'farmer', 'buyer'
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState('updated_at');
  const [sortOrder, setSortOrder] = useState('desc');
  const [detailId, setDetailId] = useState(null);
  const [detailItem, setDetailItem] = useState(null);
  const [updateId, setUpdateId] = useState(null);
  const [updateTargetStatus, setUpdateTargetStatus] = useState('');
  const [remarksDraft, setRemarksDraft] = useState('');
  const [remarksSavingId, setRemarksSavingId] = useState(null);
  const [authError, setAuthError] = useState(false);
  const [highlightedId, setHighlightedId] = useState(null);
  const [menuAnchor, setMenuAnchor] = useState(null);
  const [selectedItemForMenu, setSelectedItemForMenu] = useState(null);
  const [refundCoinsInput, setRefundCoinsInput] = useState('');
  const [refundLoading, setRefundLoading] = useState(false);
  const [refundError, setRefundError] = useState('');
  const [adminExtraProofFiles, setAdminExtraProofFiles] = useState([]);
  const [adminAddProofsLoading, setAdminAddProofsLoading] = useState(false);

  // When detail dialog opens, fetch full complaint (with proofs)
  useEffect(() => {
    if (!detailId) return;
    let cancelled = false;
    complaintService.getComplaint(detailId)
      .then((res) => {
        if (!cancelled && res.data) setDetailItem(res.data);
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [detailId]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const id = params.get('id');
    if (id) {
      setHighlightedId(id);
      const timer = setTimeout(() => {
        setHighlightedId(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [location.search]);

  useEffect(() => {
    if (!loading && highlightedId) {
      const el = document.getElementById(`row-${highlightedId}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, [loading, highlightedId]);

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

  // Get unique categories
  const categories = useMemo(() => {
    const cats = new Set();
    complaints.forEach(c => {
      if (c.category) cats.add(c.category);
    });
    return Array.from(cats).sort();
  }, [complaints]);

  // Filter and sort complaints
  const filteredAndSorted = useMemo(() => {
    let result = [...complaints];

    // Status filter
    if (statusFilter !== 'all') {
      result = result.filter(c => String(c.status).toLowerCase() === statusFilter);
    }

    // Category filter
    if (categoryFilter !== 'all') {
      result = result.filter(c => c.category === categoryFilter);
    }

    // User type filter
    if (userTypeFilter !== 'all') {
      result = result.filter(c => {
        const userType = String(c.created_by_type || '').toLowerCase();
        return userType === userTypeFilter.toLowerCase();
      });
    }

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(c => 
        (c.description || '').toLowerCase().includes(query) ||
        (c.category || '').toLowerCase().includes(query) ||
        (c.created_by_name || '').toLowerCase().includes(query) ||
        (c.created_by_email || '').toLowerCase().includes(query) ||
        (c.target_type || '').toLowerCase().includes(query) ||
        (c.admin_remarks || '').toLowerCase().includes(query)
      );
    }

    // Sorting
    result.sort((a, b) => {
      let aVal = a[sortField];
      let bVal = b[sortField];

      if (sortField === 'updated_at' || sortField === 'created_at') {
        aVal = new Date(aVal || 0).getTime();
        bVal = new Date(bVal || 0).getTime();
      } else {
        aVal = String(aVal || '').toLowerCase();
        bVal = String(bVal || '').toLowerCase();
      }

      if (sortOrder === 'asc') {
        return aVal > bVal ? 1 : aVal < bVal ? -1 : 0;
      } else {
        return aVal < bVal ? 1 : aVal > bVal ? -1 : 0;
      }
    });

    return result;
  }, [complaints, statusFilter, categoryFilter, userTypeFilter, searchQuery, sortField, sortOrder]);

  const handleSort = (field) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  const openDetail = (item) => { 
    setDetailId(item.id); 
    setDetailItem(item); 
    setRemarksDraft(item.admin_remarks || ''); 
  };
  const closeDetail = () => { 
    setDetailId(null); 
    setDetailItem(null); 
    setRemarksDraft('');
    setRefundCoinsInput('');
    setRefundError('');
    setAdminExtraProofFiles([]);
  };

  const startStatusUpdate = (item, nextStatus) => { 
    setUpdateId(item.id); 
    setUpdateTargetStatus(nextStatus); 
  };
  const cancelStatusUpdate = () => { 
    setUpdateId(null); 
    setUpdateTargetStatus(''); 
  };
  const confirmStatusUpdate = async () => {
    const id = updateId; 
    const target = updateTargetStatus;
    cancelStatusUpdate();
    const optimistic = complaints.map(c => c.id === id ? { ...c, status: target } : c);
    setComplaints(optimistic);
    try {
      await adminService.updateComplaintStatus(id, target);
    } catch (e) {
      const rollback = complaints;
      setComplaints(rollback);
    }
  };

  const saveRemarks = async (id) => {
    if (!remarksDraft.trim()) return;
    setRemarksSavingId(id);
    try {
      await complaintService.addRemark(id, remarksDraft.trim());
      const res = await complaintService.getComplaint(id);
      setDetailItem(res.data);
      setComplaints(prev => prev.map(c => c.id === id ? { ...c, admin_remarks: remarksDraft } : c));
      setRemarksDraft('');
    } catch (e) {
      console.error(e);
    } finally {
      setRemarksSavingId(null);
    }
  };

  const handleAdminAddProofs = async () => {
    if (!detailItem?.id || adminExtraProofFiles.length === 0 || !supabase) return;
    const current = (detailItem.proofs || []).length;
    if (current >= 5) return;
    const toAdd = adminExtraProofFiles.slice(0, 5 - current);
    setAdminAddProofsLoading(true);
    try {
      const bucket = 'user-documents';
      const folder = `complaint-proofs/${detailItem.id}`;
      const proofsToAdd = [];
      for (const file of toAdd) {
        const ext = file.name.split('.').pop() || 'bin';
        const fileName = `${uuidv4()}-${file.name}`;
        const filePath = `${folder}/${fileName}`;
        const { error: uploadError } = await supabase.storage.from(bucket).upload(filePath, file);
        if (uploadError) continue;
        const { data: { publicUrl } } = supabase.storage.from(bucket).getPublicUrl(filePath);
        proofsToAdd.push({ file_name: file.name, file_url: publicUrl, file_type: ext });
      }
      if (proofsToAdd.length > 0) {
        await complaintService.addProofs(detailItem.id, proofsToAdd);
        const res = await complaintService.getComplaint(detailItem.id);
        setDetailItem(res.data);
        setAdminExtraProofFiles([]);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setAdminAddProofsLoading(false);
    }
  };

  const handleRefund = async () => {
    const num = parseInt(refundCoinsInput, 10);
    if (!detailItem?.id || !Number.isInteger(num) || num <= 0) {
      setRefundError('Enter a valid positive number of coins.');
      return;
    }
    setRefundError('');
    setRefundLoading(true);
    try {
      await adminService.refundComplaint(detailItem.id, num);
      setComplaints(prev => prev.map(c => c.id === detailItem.id ? { ...c, refund_coins: num, refunded_at: new Date().toISOString(), status: 'resolved' } : c));
      setDetailItem(prev => prev ? { ...prev, refund_coins: num, refunded_at: new Date().toISOString(), status: 'resolved' } : null);
      setRefundCoinsInput('');
    } catch (e) {
      setRefundError(e?.response?.data?.error || 'Refund failed');
    } finally {
      setRefundLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateString;
    }
  };

  return (
    <Box sx={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 3, mt: { xs: 1.5, sm: 2 }, p: { xs: 2, sm: 3 } }}>
      {authError && !(process.env.REACT_APP_AUTH_DISABLED === 'true' || location.pathname.startsWith('/admin')) && (
        <Alert severity="error" sx={{ borderRadius: 2 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>Unauthorized / Session expired</Typography>
          <Typography variant="body2">Please log in as an admin to access this page.</Typography>
        </Alert>
      )}

      {/* Header Card */}
      <Card sx={{ borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.08)', border: '1px solid', borderColor: 'divider' }}>
        <CardContent sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3, flexWrap: 'wrap', gap: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box sx={{
                bgcolor: 'rgba(76, 175, 80, 0.1)',
                borderRadius: 2,
                p: 1.5,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <ReportProblem sx={{ fontSize: 32, color: '#4CAF50' }} />
              </Box>
              <Typography variant="h5" sx={{ fontWeight: 700, color: 'text.primary' }}>
                Complaints Management
              </Typography>
            </Box>
            <Chip 
              label={`${filteredAndSorted.length} of ${complaints.length}`} 
              size="small" 
              sx={{ 
                bgcolor: 'rgba(76, 175, 80, 0.1)', 
                color: '#2E7D32', 
                fontWeight: 600,
                fontSize: '0.875rem',
                px: 1
              }} 
            />
          </Box>

          {/* User Type Tabs */}
          <Box sx={{ mb: 3, borderBottom: 1, borderColor: 'divider' }}>
            <Tabs 
              value={userTypeFilter} 
              onChange={(e, newValue) => setUserTypeFilter(newValue)}
              sx={{
                '& .MuiTab-root': {
                  textTransform: 'none',
                  fontWeight: 600,
                  fontSize: '0.875rem',
                  minHeight: 48,
                  '&.Mui-selected': {
                    color: '#2E7D32',
                  }
                },
                '& .MuiTabs-indicator': {
                  backgroundColor: '#4CAF50',
                  height: 3,
                }
              }}
            >
              <Tab 
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      All Complaints
                    </Typography>
                    <Chip 
                      label={complaints.length} 
                      size="small" 
                      sx={{ 
                        height: 20, 
                        fontSize: '0.7rem',
                        bgcolor: userTypeFilter === 'all' ? 'rgba(76, 175, 80, 0.2)' : 'rgba(0, 0, 0, 0.08)',
                        color: userTypeFilter === 'all' ? '#2E7D32' : 'text.secondary'
                      }} 
                    />
                  </Box>
                } 
                value="all" 
              />
              <Tab 
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      Farmers
                    </Typography>
                    <Chip 
                      label={complaints.filter(c => String(c.created_by_type || '').toLowerCase() === 'farmer').length} 
                      size="small" 
                      sx={{ 
                        height: 20, 
                        fontSize: '0.7rem',
                        bgcolor: userTypeFilter === 'farmer' ? 'rgba(76, 175, 80, 0.2)' : 'rgba(0, 0, 0, 0.08)',
                        color: userTypeFilter === 'farmer' ? '#2E7D32' : 'text.secondary'
                      }} 
                    />
                  </Box>
                } 
                value="farmer" 
              />
              <Tab 
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      Buyers
                    </Typography>
                    <Chip 
                      label={complaints.filter(c => String(c.created_by_type || '').toLowerCase() === 'buyer').length} 
                      size="small" 
                      sx={{ 
                        height: 20, 
                        fontSize: '0.7rem',
                        bgcolor: userTypeFilter === 'buyer' ? 'rgba(76, 175, 80, 0.2)' : 'rgba(0, 0, 0, 0.08)',
                        color: userTypeFilter === 'buyer' ? '#2E7D32' : 'text.secondary'
                      }} 
                    />
                  </Box>
                } 
                value="buyer" 
              />
            </Tabs>
          </Box>

          {/* Filters and Search */}
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                size="small"
                placeholder="Search complaints..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search sx={{ color: 'text.secondary' }} />
                    </InputAdornment>
                  ),
                  endAdornment: searchQuery && (
                    <InputAdornment position="end">
                      <IconButton size="small" onClick={() => setSearchQuery('')}>
                        <Close fontSize="small" />
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                  }
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth size="small">
              <InputLabel sx={{ fontSize: '0.8125rem' }}>Status</InputLabel>
                <Select 
                  value={statusFilter} 
                  label="Status" 
                  onChange={(e) => setStatusFilter(e.target.value)}
                  sx={{ 
                    borderRadius: 2,
                    fontSize: '0.8125rem',
                    '& .MuiSelect-select': {
                      fontSize: '0.8125rem'
                    }
                  }}
                >
                  <MenuItem value="all" sx={{ fontSize: '0.8125rem' }}>All Status</MenuItem>
                <MenuItem value="open" sx={{ fontSize: '0.8125rem' }}>Open</MenuItem>
                <MenuItem value="in_review" sx={{ fontSize: '0.8125rem' }}>In Review</MenuItem>
                <MenuItem value="resolved" sx={{ fontSize: '0.8125rem' }}>Resolved</MenuItem>
              </Select>
            </FormControl>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel sx={{ fontSize: '0.8125rem' }}>Category</InputLabel>
                <Select 
                  value={categoryFilter} 
                  label="Category" 
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  sx={{ 
                    borderRadius: 2,
                    fontSize: '0.8125rem',
                    '& .MuiSelect-select': {
                      fontSize: '0.8125rem'
                    }
                  }}
                >
                  <MenuItem value="all" sx={{ fontSize: '0.8125rem' }}>All Categories</MenuItem>
                  {categories.map(cat => (
                    <MenuItem key={cat} value={cat} sx={{ fontSize: '0.8125rem' }}>{cat}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Complaints Table */}
      <Card sx={{ borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.08)', border: '1px solid', borderColor: 'divider' }}>
        <CardContent sx={{ p: 0 }}>
          <TableContainer 
            component={Paper} 
            variant="outlined"
            sx={{ 
              borderRadius: 3,
              overflow: 'hidden',
              border: 'none'
            }}
          >
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: 'rgba(76, 175, 80, 0.05)' }}>
                  <TableCell sx={{ fontWeight: 700, color: 'text.primary', py: 1.5, fontSize: '0.875rem' }}>
                    <TableSortLabel
                      active={sortField === 'created_by_name'}
                      direction={sortField === 'created_by_name' ? sortOrder : 'asc'}
                      onClick={() => handleSort('created_by_name')}
                      sx={{ fontSize: '0.875rem' }}
                    >
                      User
                    </TableSortLabel>
                  </TableCell>
                  <TableCell sx={{ fontWeight: 700, color: 'text.primary', py: 1.5, fontSize: '0.875rem', width: '100px' }}>
                    <TableSortLabel
                      active={sortField === 'category'}
                      direction={sortField === 'category' ? sortOrder : 'asc'}
                      onClick={() => handleSort('category')}
                      sx={{ fontSize: '0.875rem' }}
                    >
                      Category
                    </TableSortLabel>
                  </TableCell>
                  <TableCell sx={{ fontWeight: 700, color: 'text.primary', py: 1.5, fontSize: '0.875rem', width: '100px' }}>
                    <TableSortLabel
                      active={sortField === 'target_type'}
                      direction={sortField === 'target_type' ? sortOrder : 'asc'}
                      onClick={() => handleSort('target_type')}
                      sx={{ fontSize: '0.875rem' }}
                    >
                      Target Type
                    </TableSortLabel>
                  </TableCell>
                  <TableCell sx={{ fontWeight: 700, color: 'text.primary', py: 1.5, fontSize: '0.875rem', maxWidth: '200px', width: '200px' }}>Description</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: 'text.primary', py: 1.5, fontSize: '0.875rem', width: '100px' }}>
                    <TableSortLabel
                      active={sortField === 'status'}
                      direction={sortField === 'status' ? sortOrder : 'asc'}
                      onClick={() => handleSort('status')}
                      sx={{ fontSize: '0.875rem' }}
                    >
                      Status
                    </TableSortLabel>
                  </TableCell>
                  <TableCell sx={{ fontWeight: 700, color: 'text.primary', py: 1.5, fontSize: '0.875rem', width: '120px' }}>
                    <TableSortLabel
                      active={sortField === 'updated_at'}
                      direction={sortField === 'updated_at' ? sortOrder : 'asc'}
                      onClick={() => handleSort('updated_at')}
                      sx={{ fontSize: '0.875rem' }}
                    >
                      Updated
                    </TableSortLabel>
                  </TableCell>
                  <TableCell sx={{ fontWeight: 700, color: 'text.primary', py: 1.5, fontSize: '0.875rem', width: '120px', minWidth: '120px' }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  [...Array(5)].map((_, i) => (
                    <TableRow key={i}>
                      <TableCell><Skeleton width={120} height={24} /></TableCell>
                      <TableCell><Skeleton width={100} height={24} /></TableCell>
                      <TableCell><Skeleton width={80} height={24} /></TableCell>
                      <TableCell><Skeleton width={200} height={24} /></TableCell>
                      <TableCell><Skeleton width={80} height={24} /></TableCell>
                      <TableCell><Skeleton width={120} height={24} /></TableCell>
                      <TableCell><Skeleton width={150} height={24} /></TableCell>
                    </TableRow>
                  ))
                ) : filteredAndSorted.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center" sx={{ py: 6 }}>
                      <ReportProblem sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                      <Typography variant="h6" color="text.secondary" gutterBottom>
                        No complaints found
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {searchQuery || statusFilter !== 'all' || categoryFilter !== 'all'
                          ? 'Try adjusting your filters or search query.'
                          : 'No complaints have been submitted yet.'}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredAndSorted.map(item => {
                    const nextStatuses = allowedTransitions[String(item.status || '').toLowerCase()] || [];
                    return (
                      <TableRow 
                        key={item.id} 
                        id={`row-${item.id}`}
                        hover
                        sx={{ 
                          backgroundColor: highlightedId === String(item.id) ? 'rgba(255, 235, 59, 0.35)' : 'inherit',
                          transition: 'background-color 0.3s ease',
                          '&:hover': {
                            bgcolor: 'rgba(76, 175, 80, 0.02)',
                          }
                        }}
                      >
                        <TableCell>
                          <Box>
                            <Typography variant="body2" sx={{ fontWeight: 500, fontSize: '0.8125rem' }}>
                              {item.created_by_name || 'Unknown'}
                            </Typography>
                            <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                              {item.created_by_email || ''}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell sx={{ width: '100px' }}>
                          {item.category ? (
                            <Chip 
                              label={item.category} 
                              size="small" 
                              variant="outlined"
                              sx={{
                                borderColor: '#4CAF50',
                                color: '#2E7D32',
                                fontSize: '0.75rem',
                                height: 24,
                              }}
                            />
                          ) : (
                            <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8125rem' }}>—</Typography>
                          )}
                        </TableCell>
                        <TableCell sx={{ width: '100px' }}>
                          <Chip
                            label={item.target_type || 'N/A'}
                            size="small"
                            variant="outlined"
                            sx={{
                              borderColor: '#2196F3',
                              color: '#1565C0',
                              fontSize: '0.75rem',
                              height: 24,
                            }}
                          />
                        </TableCell>
                        <TableCell sx={{ maxWidth: '200px', width: '200px' }}>
                          <Typography
                            variant="body2"
                            sx={{
                              maxWidth: '200px',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                              fontSize: '0.8125rem',
                            }}
                            title={item.description || 'No description'}
                          >
                            {item.description || 'No description'}
                          </Typography>
                        </TableCell>
                        <TableCell sx={{ width: '100px' }}>
                          <StatusChip status={item.status} />
                        </TableCell>
                        <TableCell sx={{ width: '120px' }}>
                          <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8125rem' }}>
                            {formatDate(item.updated_at || item.created_at)}
                          </Typography>
                        </TableCell>
                        <TableCell sx={{ width: '120px', minWidth: '120px' }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, flexWrap: 'nowrap', justifyContent: 'flex-start' }}>
                            <Tooltip title="View Details">
                              <IconButton
                                size="small"
                                onClick={() => openDetail(item)}
                                sx={{
                                  color: '#4CAF50',
                                  border: '1px solid',
                                  borderColor: '#4CAF50',
                                  borderRadius: 1.5,
                                  width: 32,
                                  height: 32,
                                  '&:hover': {
                                    bgcolor: 'rgba(76, 175, 80, 0.1)',
                                    borderColor: '#2E7D32',
                                  }
                                }}
                              >
                                <Visibility fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            
                            {nextStatuses.length > 0 && (
                              <>
                                {nextStatuses.length === 1 ? (
                                  <Tooltip title={`Mark as ${nextStatuses[0].replace('_', ' ')}`}>
                                    <Button 
                                      variant="contained" 
                                      size="small" 
                                      onClick={() => startStatusUpdate(item, nextStatuses[0])}
                                      startIcon={
                                        nextStatuses[0] === 'in_review' ? <HourglassEmpty fontSize="small" /> :
                                        nextStatuses[0] === 'resolved' ? <Done fontSize="small" /> :
                                        <CheckCircle fontSize="small" />
                                      }
                                      sx={{
                                        borderRadius: 1.5,
                                        px: 1.25,
                                        py: 0.5,
                                        minWidth: 'auto',
                                        fontSize: '0.75rem',
                                        fontWeight: 500,
                                        textTransform: 'none',
                                        whiteSpace: 'nowrap',
                                        background: nextStatuses[0] === 'in_review' 
                                          ? 'linear-gradient(135deg, #FB8C00 0%, #F57C00 100%)'
                                          : nextStatuses[0] === 'resolved'
                                          ? 'linear-gradient(135deg, #4CAF50 0%, #2E7D32 100%)'
                                          : 'linear-gradient(135deg, #4CAF50 0%, #2E7D32 100%)',
                                        boxShadow: '0 2px 6px rgba(0, 0, 0, 0.12)',
                                        '&:hover': {
                                          background: nextStatuses[0] === 'in_review'
                                            ? 'linear-gradient(135deg, #F57C00 0%, #FB8C00 100%)'
                                            : nextStatuses[0] === 'resolved'
                                            ? 'linear-gradient(135deg, #2E7D32 0%, #4CAF50 100%)'
                                            : 'linear-gradient(135deg, #2E7D32 0%, #4CAF50 100%)',
                                          boxShadow: '0 3px 10px rgba(0, 0, 0, 0.18)',
                                        },
                                        transition: 'all 0.2s ease',
                                        '& .MuiButton-startIcon': {
                                          marginRight: 0.5,
                                          marginLeft: 0,
                                        }
                                      }}
                                    >
                                      {nextStatuses[0] === 'in_review' ? 'In Review' :
                                       nextStatuses[0] === 'resolved' ? 'Resolved' :
                                       nextStatuses[0].replace('_', ' ')}
                                    </Button>
                                  </Tooltip>
                                ) : (
                                  <>
                                    <Tooltip title="Change Status">
                                      <IconButton
                                        size="small"
                                        onClick={(e) => {
                                          setMenuAnchor(e.currentTarget);
                                          setSelectedItemForMenu(item);
                                        }}
                                        sx={{
                                          color: '#4CAF50',
                                          border: '1px solid',
                                          borderColor: '#4CAF50',
                                          borderRadius: 1.5,
                                          width: 32,
                                          height: 32,
                                          '&:hover': {
                                            bgcolor: 'rgba(76, 175, 80, 0.1)',
                                            borderColor: '#2E7D32',
                                          }
                                        }}
                                      >
                                        <MoreVert fontSize="small" />
                                      </IconButton>
                                    </Tooltip>
                                    <Menu
                                      anchorEl={menuAnchor}
                                      open={Boolean(menuAnchor && selectedItemForMenu?.id === item.id)}
                                      onClose={() => {
                                        setMenuAnchor(null);
                                        setSelectedItemForMenu(null);
                                      }}
                                      PaperProps={{
                                        sx: {
                                          borderRadius: 2,
                                          mt: 0.5,
                                          minWidth: 220,
                                          boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
                                        }
                                      }}
                                    >
                            {nextStatuses.map(ns => (
                                        <MenuItem
                                          key={ns}
                                          onClick={() => {
                                            startStatusUpdate(item, ns);
                                            setMenuAnchor(null);
                                            setSelectedItemForMenu(null);
                                          }}
                                          sx={{
                                            borderRadius: 1.5,
                                            mx: 1,
                                            my: 0.5,
                                            py: 1.5,
                                            px: 2,
                                            '&:hover': {
                                              bgcolor: ns === 'resolved' 
                                                ? 'rgba(76, 175, 80, 0.1)' 
                                                : ns === 'in_review'
                                                ? 'rgba(251, 140, 0, 0.1)'
                                                : 'rgba(76, 175, 80, 0.1)',
                                            }
                                          }}
                                        >
                                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
                                            {ns === 'in_review' ? (
                                              <HourglassEmpty sx={{ color: '#FB8C00', fontSize: 20 }} />
                                            ) : ns === 'resolved' ? (
                                              <Done sx={{ color: '#2E7D32', fontSize: 20 }} />
                                            ) : (
                                              <CheckCircle sx={{ color: '#4CAF50', fontSize: 20 }} />
                                            )}
                                            <Typography 
                                              variant="body2" 
                                              sx={{ 
                                                fontWeight: 500,
                                                textTransform: 'none',
                                                fontSize: '0.875rem'
                                              }}
                                            >
                                              Mark as {ns.replace('_', ' ')}
                                            </Typography>
                                          </Box>
                                        </MenuItem>
                                      ))}
                                    </Menu>
                                  </>
                                )}
                              </>
                            )}
                          </Box>
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

      {/* Details Dialog */}
      <Dialog 
        open={Boolean(detailId)} 
        onClose={closeDetail} 
        fullWidth 
        maxWidth="md"
        fullScreen={isMobile}
        PaperProps={{
          sx: {
            borderRadius: isMobile ? 0 : 3,
          }
        }}
      >
        <DialogTitle sx={{
          background: 'linear-gradient(135deg, #4CAF50 0%, #2E7D32 100%)',
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          py: 2.5
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <ReportProblem sx={{ color: 'white' }} />
            <Typography variant="h6" sx={{ fontWeight: 700, color: 'white' }}>Complaint Details</Typography>
          </Box>
          <IconButton onClick={closeDetail} sx={{ color: 'white' }}>
            <Close />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ pt: 4, mt: 2 }}>
          {detailItem ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              {/* User Info */}
              <Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <Person sx={{ color: 'text.secondary', fontSize: 20 }} />
                  <Typography variant="subtitle2" color="text.secondary">Submitted By</Typography>
                </Box>
                <Typography variant="body1" sx={{ fontWeight: 600 }}>
                  {detailItem.created_by_name || 'Unknown User'}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {detailItem.created_by_email || 'N/A'}
                </Typography>
                {detailItem.created_by_type && (
                  <Chip 
                    label={detailItem.created_by_type} 
                    size="small" 
                    sx={{ mt: 0.5 }}
                  />
                )}
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<Chat />}
                  onClick={() => {
                    closeDetail();
                    navigate('/admin/messages', { state: { openWithUserId: detailItem.created_by } });
                  }}
                  sx={{ mt: 1.5, borderRadius: 2, borderColor: '#2196F3', color: '#1976D2' }}
                >
                  Chat with this user
                </Button>
              </Box>

              <Divider />

              {/* Category & Target */}
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                      <Category sx={{ color: 'text.secondary', fontSize: 20 }} />
                      <Typography variant="subtitle2" color="text.secondary">Category</Typography>
                    </Box>
                    <Typography variant="body1">
                      {detailItem.category || 'Not specified'}
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                      <ReportProblem sx={{ color: 'text.secondary', fontSize: 20 }} />
                      <Typography variant="subtitle2" color="text.secondary">Target Type</Typography>
                    </Box>
                    <Chip
                      label={detailItem.target_type || 'N/A'}
                      size="small"
                      variant="outlined"
                    />
                  </Box>
                </Grid>
              </Grid>

              <Divider />

              {/* Description */}
              <Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <Description sx={{ color: 'text.secondary', fontSize: 20 }} />
                  <Typography variant="subtitle2" color="text.secondary">Description</Typography>
                </Box>
                <Paper sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 2 }}>
                  <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', lineHeight: 1.7 }}>
                    {detailItem.description || 'No description provided'}
                  </Typography>
                </Paper>
              </Box>

              {detailItem.proofs && detailItem.proofs.length > 0 && (
                <>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>Attached proof ({detailItem.proofs.length})</Typography>
                  <Stack direction="row" flexWrap="wrap" gap={1} sx={{ mb: 1 }}>
                    {detailItem.proofs.map((p) => {
                      const isImg = /\.(jpe?g|png|gif|webp)$/i.test(String(p.file_name)) || /^(jpe?g|png|gif|webp)$/i.test(String(p.file_type));
                      return (
                        <Box key={p.id || p.file_url}>
                          {isImg ? (
                            <a href={p.file_url} target="_blank" rel="noopener noreferrer">
                              <Box component="img" src={p.file_url} alt={p.file_name} sx={{ maxWidth: 100, maxHeight: 100, objectFit: 'cover', borderRadius: 1, border: '1px solid', borderColor: 'divider' }} />
                            </a>
                          ) : (
                            <Button size="small" href={p.file_url} target="_blank" rel="noopener noreferrer" sx={{ textTransform: 'none' }}>
                              {p.file_name || 'Document'}
                            </Button>
                          )}
                        </Box>
                      );
                    })}
                  </Stack>
                  <Divider />
                </>
              )}

              <Divider />

              {/* Status & Dates */}
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Box>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>Status</Typography>
                <StatusChip status={detailItem.status} />
                  </Box>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                      <CalendarToday sx={{ color: 'text.secondary', fontSize: 16 }} />
                      <Typography variant="subtitle2" color="text.secondary">Created</Typography>
                    </Box>
                    <Typography variant="body2">
                      {formatDate(detailItem.created_at)}
                    </Typography>
                    {detailItem.updated_at !== detailItem.created_at && (
                      <>
                        <Typography variant="subtitle2" color="text.secondary" sx={{ mt: 1, mb: 0.5 }}>Updated</Typography>
                        <Typography variant="body2">
                          {formatDate(detailItem.updated_at)}
                        </Typography>
                      </>
                    )}
                  </Box>
                </Grid>
              </Grid>

              <Divider />

              {/* Conversation (remarks thread) */}
              <Box>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom sx={{ fontWeight: 600 }}>
                  Conversation
                </Typography>
                {(detailItem.remarks && detailItem.remarks.length > 0) || detailItem.admin_remarks ? (
                  <Stack spacing={1} sx={{ mb: 2 }}>
                    {detailItem.admin_remarks && (!detailItem.remarks || detailItem.remarks.length === 0) && (
                      <Paper variant="outlined" sx={{ p: 1.5, borderRadius: 2, bgcolor: 'rgba(76, 175, 80, 0.06)' }}>
                        <Stack direction="row" alignItems="center" spacing={0.5} sx={{ mb: 0.5 }}>
                          <VerifiedUser sx={{ fontSize: 16, color: '#0d9488' }} />
                          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>Share-Crop (legacy)</Typography>
                        </Stack>
                        <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', mt: 0.5 }}>{detailItem.admin_remarks}</Typography>
                      </Paper>
                    )}
                    {(detailItem.remarks || []).map((r) => (
                      <Paper key={r.id} variant="outlined" sx={{ p: 1.5, borderRadius: 2, bgcolor: r.author_type === 'admin' ? 'rgba(76, 175, 80, 0.06)' : 'grey.50' }}>
                        <Stack direction="row" alignItems="center" spacing={0.5} sx={{ flexWrap: 'wrap' }}>
                          {r.author_type === 'admin' && <VerifiedUser sx={{ fontSize: 16, color: '#0d9488' }} />}
                          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                            {r.author_type === 'admin' ? 'Share-Crop' : (r.author_name || 'User')}
                          </Typography>
                        </Stack>
                        <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', mt: 0.5 }}>{r.message}</Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>{formatDate(r.created_at)}</Typography>
                      </Paper>
                    ))}
                  </Stack>
                ) : null}
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>Add a message (user will see this)</Typography>
                <TextField
                  fullWidth
                  value={remarksDraft}
                  onChange={(e) => setRemarksDraft(e.target.value)}
                  multiline
                  minRows={3}
                  placeholder="Ask for more details or reply to the user..."
                  variant="outlined"
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                />
                <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
                  <Button 
                    variant="contained" 
                    onClick={() => saveRemarks(detailItem.id)} 
                    disabled={remarksSavingId === detailItem.id || !remarksDraft.trim()}
                    sx={{ borderRadius: 2, background: 'linear-gradient(135deg, #4CAF50 0%, #2E7D32 100%)', '&:hover': { background: 'linear-gradient(135deg, #2E7D32 0%, #4CAF50 100%)' } }}
                  >
                    {remarksSavingId === detailItem.id ? 'Sending...' : 'Send message'}
                  </Button>
                  <Button variant="outlined" onClick={closeDetail} sx={{ borderRadius: 2 }}>Close</Button>
                </Stack>
              </Box>

              {/* Add more documents (max 5) */}
              {detailItem.proofs && detailItem.proofs.length < 5 && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom sx={{ fontWeight: 600 }}>Add documents ({detailItem.proofs.length} / 5)</Typography>
                  <Stack direction="row" alignItems="center" flexWrap="wrap" gap={1}>
                    <Button variant="outlined" size="small" component="label" startIcon={<AttachFile />} disabled={adminAddProofsLoading} sx={{ borderRadius: 2 }}>
                      Choose files
                      <input type="file" hidden multiple accept="image/*,.pdf,.doc,.docx,.txt" onChange={(e) => setAdminExtraProofFiles(e.target.files ? Array.from(e.target.files) : [])} />
                    </Button>
                    {adminExtraProofFiles.length > 0 && (
                      <>
                        <Typography variant="caption" color="text.secondary">{adminExtraProofFiles.length} file(s) selected</Typography>
                        <Button size="small" variant="contained" disabled={adminAddProofsLoading || detailItem.proofs.length + adminExtraProofFiles.length > 5} onClick={handleAdminAddProofs} sx={{ borderRadius: 2 }}>
                          {adminAddProofsLoading ? 'Uploading...' : 'Upload'}
                        </Button>
                      </>
                    )}
                  </Stack>
                </Box>
              )}

              {/* Refund (credit coins to victim) */}
              <Divider />
              <Box>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom sx={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <AccountBalanceWallet fontSize="small" /> Refund to customer (coins)
                </Typography>
                {detailItem.refunded_at ? (
                  <Alert severity="success" sx={{ borderRadius: 2 }}>
                    {detailItem.refund_coins} coins credited on {formatDate(detailItem.refunded_at)}.
                  </Alert>
                ) : (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap', mt: 1 }}>
                    <TextField
                      size="small"
                      type="number"
                      label="Coins to credit"
                      value={refundCoinsInput}
                      onChange={(e) => { setRefundCoinsInput(e.target.value); setRefundError(''); }}
                      inputProps={{ min: 1, step: 1 }}
                      sx={{ width: 140, '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                    />
                    <Button
                      variant="contained"
                      size="small"
                      disabled={refundLoading || !refundCoinsInput}
                      onClick={handleRefund}
                      sx={{
                        borderRadius: 2,
                        background: 'linear-gradient(135deg, #4CAF50 0%, #2E7D32 100%)',
                        '&:hover': { background: 'linear-gradient(135deg, #2E7D32 0%, #4CAF50 100%)' },
                      }}
                    >
                      {refundLoading ? 'Crediting...' : 'Credit to user account'}
                    </Button>
                    {refundError && (
                      <Typography variant="body2" color="error">{refundError}</Typography>
                    )}
                  </Box>
                )}
              </Box>
            </Box>
          ) : null}
        </DialogContent>
      </Dialog>

      {/* Status Update Confirmation Dialog */}
      <Dialog 
        open={Boolean(updateId)} 
        onClose={cancelStatusUpdate}
        PaperProps={{
          sx: {
            borderRadius: 3,
          }
        }}
      >
        <DialogTitle sx={{ fontWeight: 700 }}>Confirm Status Change</DialogTitle>
        <DialogContent>
          <Typography variant="body2">
            Are you sure you want to mark this complaint as <strong>{updateTargetStatus.replace('_', ' ')}</strong>?
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={cancelStatusUpdate} variant="outlined" sx={{ borderRadius: 2 }}>
            Cancel
          </Button>
          <Button 
            onClick={confirmStatusUpdate} 
            variant="contained"
            sx={{
              borderRadius: 2,
              background: 'linear-gradient(135deg, #4CAF50 0%, #2E7D32 100%)',
              '&:hover': {
                background: 'linear-gradient(135deg, #2E7D32 0%, #4CAF50 100%)',
              }
            }}
          >
            Confirm
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AdminQA;
