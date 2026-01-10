import { useEffect, useMemo, useState } from 'react';
import { Box, Grid, Card, CardContent, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Chip, Button, Dialog, DialogTitle, DialogContent, DialogActions, Skeleton, Snackbar, Alert, Divider, IconButton, Avatar, Stack, TextField, InputAdornment, Select, MenuItem, FormControl, InputLabel, Tabs, Tab } from '@mui/material';
import { adminService } from '../../services/admin';
import { complaintService } from '../../services/complaints';
import { useLocation, useNavigate } from 'react-router-dom';
import CloseIcon from '@mui/icons-material/Close';
import PersonIcon from '@mui/icons-material/Person';
import EmailIcon from '@mui/icons-material/Email';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import VisibilityIcon from '@mui/icons-material/Visibility';
import SearchIcon from '@mui/icons-material/Search';
import FilterListIcon from '@mui/icons-material/FilterList';
import PeopleIcon from '@mui/icons-material/People';
import AgricultureIcon from '@mui/icons-material/Agriculture';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import StarIcon from '@mui/icons-material/Star';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import ShoppingBagIcon from '@mui/icons-material/ShoppingBag';
import LocalOfferIcon from '@mui/icons-material/LocalOffer';
import ReportProblemIcon from '@mui/icons-material/ReportProblem';

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

// UserDetailsModal has been replaced by UserDetailPage route
const STUB_MODE = true; // Placeholder to maintain file structure if needed

const AdminUsers = () => {
  const location = useLocation();
  const navigate = useNavigate();
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
  const [highlightedId, setHighlightedId] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [tabValue, setTabValue] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [pendingSearch, setPendingSearch] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');
  const [userComplaints, setUserComplaints] = useState({ made: {}, against: {} }); // { made: { userId: { count, complaints } }, against: { userId: { count, complaints } } }
  const [loadingComplaints, setLoadingComplaints] = useState(false);

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
    if ((!loadingUsers || !loadingPending) && highlightedId) {
      const el = document.getElementById(`row-${highlightedId}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, [loadingUsers, loadingPending, highlightedId]);

  useEffect(() => {
    let mounted = true;
    const loadUsers = async () => {
      try {
        setLoadingUsers(true);
        const resp = await adminService.getAllUsers(true);
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
    const loadComplaints = async () => {
      try {
        setLoadingComplaints(true);
        const resp = await complaintService.getComplaints({});
        if (!mounted) return;
        const complaints = Array.isArray(resp.data) ? resp.data : [];

        // Group complaints by creator and by target
        const madeByUser = {};
        const againstUser = {};

        complaints.forEach(complaint => {
          // Complaints created BY this user
          if (complaint.created_by) {
            const uid = complaint.created_by;
            if (!madeByUser[uid]) madeByUser[uid] = { count: 0, complaints: [] };
            madeByUser[uid].count++;
            madeByUser[uid].complaints.push(complaint);
          }

          // Complaints filed AGAINST this user
          if (complaint.complained_against_user_id) {
            const targetUid = complaint.complained_against_user_id;
            if (!againstUser[targetUid]) againstUser[targetUid] = { count: 0, complaints: [] };
            againstUser[targetUid].count++;
            againstUser[targetUid].complaints.push(complaint);
          }
        });

        setUserComplaints({ made: madeByUser, against: againstUser });
      } catch (e) {
        console.error('Error loading complaints:', e);
      } finally {
        if (mounted) setLoadingComplaints(false);
      }
    };

    loadUsers();
    loadPending();
    loadComplaints();
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

  // Get current users based on active tab
  const currentUsers = useMemo(() => {
    return tabValue === 0 ? farmers : buyers;
  }, [tabValue, farmers, buyers]);

  // Filter current users
  const filteredUsers = useMemo(() => {
    let filtered = currentUsers;

    // Search filter
    if (searchQuery) {
      const searchLower = searchQuery.toLowerCase();
      filtered = filtered.filter(u =>
        (u.name || '').toLowerCase().includes(searchLower) ||
        (u.email || '').toLowerCase().includes(searchLower)
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(u => {
        const status = u.approval_status || (u.is_active ? 'approved' : 'pending');
        return status.toLowerCase() === statusFilter.toLowerCase();
      });
    }

    return filtered;
  }, [currentUsers, searchQuery, statusFilter]);

  // Stats calculations
  const stats = useMemo(() => {
    const allUsers = users.filter(u => u.user_type?.toLowerCase() !== 'admin');
    const approved = allUsers.filter(u => (u.approval_status || (u.is_active ? 'approved' : 'pending')).toLowerCase() === 'approved').length;
    const pending = allUsers.filter(u => (u.approval_status || (u.is_active ? 'approved' : 'pending')).toLowerCase() === 'pending').length;
    const rejected = allUsers.filter(u => (u.approval_status || (u.is_active ? 'approved' : 'pending')).toLowerCase() === 'rejected').length;

    return {
      total: allUsers.length,
      farmers: farmers.length,
      buyers: buyers.length,
      approved,
      pending,
      rejected
    };
  }, [users, farmers, buyers]);

  // Filter pending farmers
  const filteredPendingFarmers = useMemo(() => {
    let filtered = pendingFarmers;

    // Search filter
    if (pendingSearch) {
      const searchLower = pendingSearch.toLowerCase();
      filtered = filtered.filter(f =>
        (f.name || '').toLowerCase().includes(searchLower) ||
        (f.email || '').toLowerCase().includes(searchLower)
      );
    }

    return filtered;
  }, [pendingFarmers, pendingSearch]);

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
      // Add timeout to prevent hanging
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Request timeout')), 10000)
      );
      const resp = await Promise.race([
        adminService.getFarmerDocuments(id),
        timeoutPromise
      ]);
      setDocsContent(resp.data?.documents || null);
    } catch (err) {
      console.error('Error loading documents:', err);
      setDocsContent(null);
      setFeedback(err.response?.data?.error || err.message || 'Failed to load documents');
    } finally {
      setDocsLoading(false);
    }
  };

  return (
    <Box sx={{ width: '100%', maxWidth: '100%', display: 'flex', flexDirection: 'column', gap: 3, mt: { xs: 1.5, sm: 2 }, px: { xs: 0, sm: 0 } }}>
      {authError && !(process.env.REACT_APP_AUTH_DISABLED === 'true' || location.pathname.startsWith('/admin')) && (
        <Card sx={{ borderRadius: 3, boxShadow: '0 2px 12px rgba(0,0,0,0.08)', border: '1px solid', borderColor: 'error.light' }}>
          <CardContent>
            <Typography variant="subtitle1" color="error.main" sx={{ fontWeight: 700 }}>Unauthorized / Session expired</Typography>
            <Typography variant="body2" color="text.secondary">Please log in as an admin to access this page.</Typography>
          </CardContent>
        </Card>
      )}

      {/* Stats Cards */}
      <Box sx={{
        display: 'grid',
        gridTemplateColumns: {
          xs: 'repeat(2, 1fr)',
          sm: 'repeat(3, 1fr)',
          md: 'repeat(5, 1fr)'
        },
        gap: 2,
        mb: 1
      }}>
        <Card sx={{
          borderRadius: 2,
          boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
          bgcolor: 'background.paper',
          border: '1px solid',
          borderColor: 'divider',
          transition: 'all 0.2s',
          width: '100%',
          minWidth: 0,
          boxSizing: 'border-box',
          '&:hover': {
            transform: 'translateY(-2px)',
            boxShadow: '0 4px 12px rgba(0,0,0,0.12)'
          }
        }}>
          <CardContent sx={{ p: 2.5, '&:last-child': { pb: 2.5 } }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
              <Box sx={{
                p: 1,
                borderRadius: 1.5,
                bgcolor: 'rgba(102, 126, 234, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                <PeopleIcon sx={{ fontSize: 24, color: '#667eea' }} />
              </Box>
              <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                Total Users
              </Typography>
            </Box>
            <Typography variant="h4" sx={{ fontWeight: 700, color: 'text.primary', lineHeight: 1.2 }}>
              {stats.total}
            </Typography>
          </CardContent>
        </Card>
        <Card sx={{
          borderRadius: 2,
          boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
          bgcolor: 'background.paper',
          border: '1px solid',
          borderColor: 'divider',
          transition: 'all 0.2s',
          width: '100%',
          minWidth: 0,
          boxSizing: 'border-box',
          '&:hover': {
            transform: 'translateY(-2px)',
            boxShadow: '0 4px 12px rgba(0,0,0,0.12)'
          }
        }}>
          <CardContent sx={{ p: 2.5, '&:last-child': { pb: 2.5 } }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
              <Box sx={{
                p: 1,
                borderRadius: 1.5,
                bgcolor: 'rgba(76,175,80,0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                <AgricultureIcon sx={{ fontSize: 24, color: '#4CAF50' }} />
              </Box>
              <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                Farmers
              </Typography>
            </Box>
            <Typography variant="h4" sx={{ fontWeight: 700, color: 'text.primary', lineHeight: 1.2 }}>
              {stats.farmers}
            </Typography>
          </CardContent>
        </Card>
        <Card sx={{
          borderRadius: 2,
          boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
          bgcolor: 'background.paper',
          border: '1px solid',
          borderColor: 'divider',
          transition: 'all 0.2s',
          width: '100%',
          minWidth: 0,
          boxSizing: 'border-box',
          '&:hover': {
            transform: 'translateY(-2px)',
            boxShadow: '0 4px 12px rgba(0,0,0,0.12)'
          }
        }}>
          <CardContent sx={{ p: 2.5, '&:last-child': { pb: 2.5 } }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
              <Box sx={{
                p: 1,
                borderRadius: 1.5,
                bgcolor: 'rgba(33,150,243,0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                <ShoppingCartIcon sx={{ fontSize: 24, color: '#2196F3' }} />
              </Box>
              <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                Buyers
              </Typography>
            </Box>
            <Typography variant="h4" sx={{ fontWeight: 700, color: 'text.primary', lineHeight: 1.2 }}>
              {stats.buyers}
            </Typography>
          </CardContent>
        </Card>
        <Card sx={{
          borderRadius: 2,
          boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
          bgcolor: 'background.paper',
          border: '1px solid',
          borderColor: 'divider',
          transition: 'all 0.2s',
          width: '100%',
          minWidth: 0,
          boxSizing: 'border-box',
          '&:hover': {
            transform: 'translateY(-2px)',
            boxShadow: '0 4px 12px rgba(0,0,0,0.12)'
          }
        }}>
          <CardContent sx={{ p: 2.5, '&:last-child': { pb: 2.5 } }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
              <Box sx={{
                p: 1,
                borderRadius: 1.5,
                bgcolor: 'rgba(76,175,80,0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                <CheckCircleIcon sx={{ fontSize: 24, color: '#4CAF50' }} />
              </Box>
              <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                Approved
              </Typography>
            </Box>
            <Typography variant="h4" sx={{ fontWeight: 700, color: 'text.primary', lineHeight: 1.2 }}>
              {stats.approved}
            </Typography>
          </CardContent>
        </Card>
        <Card sx={{
          borderRadius: 2,
          boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
          bgcolor: 'background.paper',
          border: '1px solid',
          borderColor: 'divider',
          transition: 'all 0.2s',
          width: '100%',
          minWidth: 0,
          boxSizing: 'border-box',
          '&:hover': {
            transform: 'translateY(-2px)',
            boxShadow: '0 4px 12px rgba(0,0,0,0.12)'
          }
        }}>
          <CardContent sx={{ p: 2.5, '&:last-child': { pb: 2.5 } }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
              <Box sx={{
                p: 1,
                borderRadius: 1.5,
                bgcolor: 'rgba(255,152,0,0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                <CancelIcon sx={{ fontSize: 24, color: '#FF9800' }} />
              </Box>
              <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                Pending
              </Typography>
            </Box>
            <Typography variant="h4" sx={{ fontWeight: 700, color: 'text.primary', lineHeight: 1.2 }}>
              {stats.pending}
            </Typography>
          </CardContent>
        </Card>
      </Box>

      {/* Main Content Card */}
      <Card sx={{
        borderRadius: 3,
        boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
        width: '100%',
        border: '1px solid',
        borderColor: 'divider',
      }}>
        <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
          {/* Tabs */}
          <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
            <Tabs
              value={tabValue}
              onChange={(e, newValue) => {
                setTabValue(newValue);
                setSearchQuery('');
                setStatusFilter('all');
              }}
              sx={{
                '& .MuiTab-root': {
                  textTransform: 'none',
                  fontWeight: 600,
                  fontSize: '1rem',
                  minHeight: 48,
                  color: 'text.secondary',
                  '&.Mui-selected': {
                    color: '#4CAF50',
                  },
                },
                '& .MuiTabs-indicator': {
                  backgroundColor: '#4CAF50',
                  height: 3,
                },
              }}
            >
              <Tab
                icon={<AgricultureIcon />}
                iconPosition="start"
                label={
                  <Box sx={{ display: { xs: 'none', sm: 'inline' } }}>
                    Farmers ({farmers.length})
                  </Box>
                }
                sx={{ minWidth: { xs: 80, sm: 160 } }}
              />
              <Tab
                icon={<ShoppingCartIcon />}
                iconPosition="start"
                label={
                  <Box sx={{ display: { xs: 'none', sm: 'inline' } }}>
                    Buyers ({buyers.length})
                  </Box>
                }
                sx={{ minWidth: { xs: 80, sm: 160 } }}
              />
            </Tabs>
          </Box>

          {/* Search and Filter Bar */}
          <Box sx={{
            display: 'flex',
            gap: 2,
            mb: 3,
            flexDirection: { xs: 'column', sm: 'row' },
            alignItems: { xs: 'stretch', sm: 'center' }
          }}>
            <TextField
              placeholder={`Search ${tabValue === 0 ? 'farmers' : 'buyers'}...`}
              size="small"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ color: 'text.secondary' }} />
                  </InputAdornment>
                ),
              }}
              sx={{
                flex: 1,
                '& .MuiOutlinedInput-root': {
                  '&:hover fieldset': {
                    borderColor: '#4CAF50',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: '#4CAF50',
                  },
                }
              }}
            />
            <FormControl size="small" sx={{ minWidth: { xs: '100%', sm: 150 } }}>
              <InputLabel>Status</InputLabel>
              <Select
                value={statusFilter}
                label="Status"
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <MenuItem value="all">All Status</MenuItem>
                <MenuItem value="approved">Approved</MenuItem>
                <MenuItem value="pending">Pending</MenuItem>
                <MenuItem value="rejected">Rejected</MenuItem>
              </Select>
            </FormControl>
            <FormControl size="small" sx={{ minWidth: { xs: '100%', sm: 150 } }}>
              <InputLabel>Sort By</InputLabel>
              <Select
                value={sortBy}
                label="Sort By"
                onChange={(e) => setSortBy(e.target.value)}
              >
                <MenuItem value="name">Name</MenuItem>
                <MenuItem value="created_at">Registration Date</MenuItem>
                <MenuItem value="coins">Coins</MenuItem>
                {tabValue === 0 && (
                  <>
                    <MenuItem value="fields_count">Fields Count</MenuItem>
                    <MenuItem value="orders_received">Orders Received</MenuItem>
                    <MenuItem value="total_revenue">Total Revenue</MenuItem>
                    <MenuItem value="avg_rating">Average Rating</MenuItem>
                  </>
                )}
                {tabValue === 1 && (
                  <>
                    <MenuItem value="orders_placed">Orders Placed</MenuItem>
                    <MenuItem value="total_spent">Total Spent</MenuItem>
                  </>
                )}
              </Select>
            </FormControl>
            <FormControl size="small" sx={{ minWidth: { xs: '100%', sm: 120 } }}>
              <InputLabel>Order</InputLabel>
              <Select
                value={sortOrder}
                label="Order"
                onChange={(e) => setSortOrder(e.target.value)}
              >
                <MenuItem value="asc">Ascending</MenuItem>
                <MenuItem value="desc">Descending</MenuItem>
              </Select>
            </FormControl>
            <Chip
              label={`${filteredUsers.length} of ${currentUsers.length} shown`}
              size="small"
              sx={{
                bgcolor: tabValue === 0 ? 'rgba(76,175,80,0.1)' : 'rgba(33,150,243,0.1)',
                color: tabValue === 0 ? '#2E7D32' : '#1565C0',
                fontWeight: 600,
                height: 40,
                alignSelf: { xs: 'flex-start', sm: 'center' }
              }}
            />
          </Box>

          {/* Table */}
          <TableContainer
            component={Paper}
            sx={{
              borderRadius: 2,
              overflow: 'auto',
              border: '1px solid',
              borderColor: 'divider',
              maxHeight: { xs: '60vh', md: '70vh' }
            }}
          >
            <Table stickyHeader>
              <TableHead>
                <TableRow sx={{ bgcolor: 'grey.50' }}>
                  <TableCell sx={{ fontWeight: 700, color: 'text.primary', py: 2, minWidth: 150 }}>Name</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: 'text.primary', py: 2, minWidth: 200 }}>Email</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: 'text.primary', py: 2, minWidth: 120, display: { xs: 'none', sm: 'table-cell' } }}>Coins</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: 'text.primary', py: 2, minWidth: 120 }}>Status</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: 'text.primary', py: 2, minWidth: 150 }}>Reports Against User</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: 'text.primary', py: 2, minWidth: 150 }}>Reports Made by User</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: 'text.primary', py: 2, minWidth: 120 }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loadingUsers ? (
                  [...Array(8)].map((_, i) => (
                    <TableRow key={i}>
                      <TableCell><Skeleton width={120} height={32} /></TableCell>
                      <TableCell><Skeleton width={180} height={32} /></TableCell>
                      <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}><Skeleton width={80} height={32} /></TableCell>
                      <TableCell><Skeleton width={80} height={32} /></TableCell>
                      <TableCell><Skeleton width={80} height={32} /></TableCell>
                      <TableCell><Skeleton width={100} height={32} /></TableCell>
                    </TableRow>
                  ))
                ) : filteredUsers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center" sx={{ py: 6 }}>
                      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
                        <PeopleIcon sx={{ fontSize: 48, color: 'text.secondary', opacity: 0.5 }} />
                        <Typography variant="body1" sx={{ color: 'text.secondary', fontWeight: 500 }}>
                          {currentUsers.length === 0 ? `No ${tabValue === 0 ? 'farmers' : 'buyers'} found` : 'No users match your search/filter'}
                        </Typography>
                        {(searchQuery || statusFilter !== 'all') && (
                          <Button
                            size="small"
                            onClick={() => {
                              setSearchQuery('');
                              setStatusFilter('all');
                            }}
                            sx={{ mt: 1 }}
                          >
                            Clear Filters
                          </Button>
                        )}
                      </Box>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredUsers.map(u => (
                    <TableRow
                      key={u.id}
                      id={`row-${u.id}`}
                      sx={{
                        backgroundColor: highlightedId === String(u.id) ? 'rgba(255, 235, 59, 0.35)' : 'inherit',
                        transition: 'all 0.2s ease',
                        '&:hover': {
                          backgroundColor: tabValue === 0 ? 'rgba(76,175,80,0.04)' : 'rgba(33,150,243,0.04)',
                        }
                      }}
                    >
                      <TableCell sx={{ py: 2, fontWeight: 500 }}>{u.name || 'N/A'}</TableCell>
                      <TableCell sx={{ py: 2 }}>{u.email || 'N/A'}</TableCell>
                      <TableCell sx={{ py: 2, display: { xs: 'none', sm: 'table-cell' } }}>
                        <Chip
                          label={u.coins?.toLocaleString() || '0'}
                          size="small"
                          sx={{
                            bgcolor: 'rgba(33,150,243,0.1)',
                            color: '#1565C0',
                            fontWeight: 600
                          }}
                        />
                      </TableCell>
                      <TableCell sx={{ py: 2 }}>
                        <StatusChip status={u.approval_status || (u.is_active ? 'approved' : 'pending')} />
                      </TableCell>
                      <TableCell sx={{ py: 2 }}>
                        {userComplaints.against[u.id]?.count > 0 ? (
                          <Chip
                            icon={<ReportProblemIcon sx={{ fontSize: 16 }} />}
                            label={userComplaints.against[u.id].count}
                            size="small"
                            sx={{
                              bgcolor: 'rgba(244, 67, 54, 0.1)',
                              color: '#D32F2F',
                              border: '1px solid rgba(244, 67, 54, 0.2)',
                              fontWeight: 600,
                              '& .MuiChip-icon': {
                                color: '#D32F2F'
                              }
                            }}
                          />
                        ) : (
                          <Typography variant="body2" sx={{ color: 'text.secondary' }}>0</Typography>
                        )}
                      </TableCell>
                      <TableCell sx={{ py: 2 }}>
                        {userComplaints.made[u.id]?.count > 0 ? (
                          <Chip
                            label={userComplaints.made[u.id].count}
                            size="small"
                            sx={{
                              bgcolor: 'rgba(102, 126, 234, 0.1)',
                              color: '#5a67d8',
                              border: '1px solid rgba(102, 126, 234, 0.2)',
                              fontWeight: 600
                            }}
                          />
                        ) : (
                          <Typography variant="body2" sx={{ color: 'text.secondary' }}>0</Typography>
                        )}
                      </TableCell>
                      <TableCell sx={{ py: 2 }}>
                        <Button
                          variant="outlined"
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/admin/users/${u.id}`);
                          }}
                          sx={{
                            textTransform: 'none',
                            fontWeight: 500,
                            minWidth: 100
                          }}
                        >
                          View Details
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      <Card sx={{
        borderRadius: 3,
        boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
        border: '1px solid',
        borderColor: 'divider',
        mt: 3
      }}>
        <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
          <Box sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            mb: 3,
            flexWrap: 'wrap',
            gap: 2
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box sx={{
                p: 1,
                borderRadius: 1.5,
                bgcolor: 'rgba(255,152,0,0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <CancelIcon sx={{ fontSize: 24, color: '#FF9800' }} />
              </Box>
              <Box>
                <Typography variant="h5" sx={{ fontWeight: 700, color: 'text.primary', mb: 0.5 }}>
                  Pending Farmer Approvals
                </Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  Review and approve farmer registration requests
                </Typography>
              </Box>
            </Box>
            <Chip
              label={`${filteredPendingFarmers.length} of ${pendingFarmers.length}`}
              size="small"
              sx={{
                bgcolor: 'rgba(255,152,0,0.1)',
                color: '#FF9800',
                fontWeight: 600,
                height: 32
              }}
            />
          </Box>

          {/* Search Bar */}
          <Box sx={{
            display: 'flex',
            gap: 2,
            mb: 3,
            flexDirection: { xs: 'column', sm: 'row' },
            alignItems: { xs: 'stretch', sm: 'center' }
          }}>
            <TextField
              placeholder="Search pending farmers..."
              size="small"
              value={pendingSearch}
              onChange={(e) => setPendingSearch(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ color: 'text.secondary' }} />
                  </InputAdornment>
                ),
              }}
              sx={{
                flex: 1,
                '& .MuiOutlinedInput-root': {
                  '&:hover fieldset': {
                    borderColor: '#FF9800',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: '#FF9800',
                  },
                }
              }}
            />
            {pendingSearch && (
              <Button
                size="small"
                onClick={() => setPendingSearch('')}
                sx={{ minWidth: 100 }}
              >
                Clear
              </Button>
            )}
          </Box>

          {/* Table */}
          <TableContainer
            component={Paper}
            sx={{
              borderRadius: 2,
              overflow: 'auto',
              border: '1px solid',
              borderColor: 'divider',
              maxHeight: { xs: '50vh', md: '60vh' }
            }}
          >
            <Table stickyHeader>
              <TableHead>
                <TableRow sx={{ bgcolor: 'grey.50' }}>
                  <TableCell sx={{ fontWeight: 700, color: 'text.primary', py: 2, minWidth: 150 }}>Name</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: 'text.primary', py: 2, minWidth: 200 }}>Email</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: 'text.primary', py: 2, minWidth: 120 }}>Status</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: 'text.primary', py: 2, minWidth: 200 }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loadingPending ? (
                  [...Array(5)].map((_, i) => (
                    <TableRow key={i}>
                      <TableCell><Skeleton width={120} height={32} /></TableCell>
                      <TableCell><Skeleton width={180} height={32} /></TableCell>
                      <TableCell><Skeleton width={80} height={32} /></TableCell>
                      <TableCell><Skeleton width={200} height={32} /></TableCell>
                    </TableRow>
                  ))
                ) : filteredPendingFarmers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} align="center" sx={{ py: 6 }}>
                      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
                        <AgricultureIcon sx={{ fontSize: 48, color: 'text.secondary', opacity: 0.5 }} />
                        <Typography variant="body1" sx={{ color: 'text.secondary', fontWeight: 500 }}>
                          {pendingFarmers.length === 0 ? 'No pending approvals' : 'No farmers match your search'}
                        </Typography>
                        {pendingSearch && (
                          <Button
                            size="small"
                            onClick={() => setPendingSearch('')}
                            sx={{ mt: 1 }}
                          >
                            Clear Search
                          </Button>
                        )}
                      </Box>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredPendingFarmers.map(f => {
                    return (
                      <TableRow
                        key={f.id}
                        id={`row-${f.id}`}
                        sx={{
                          backgroundColor: highlightedId === String(f.id) ? 'rgba(255, 235, 59, 0.35)' : 'inherit',
                          transition: 'all 0.2s ease',
                          '&:hover': {
                            backgroundColor: 'rgba(255,152,0,0.04)',
                          }
                        }}
                      >
                        <TableCell sx={{ py: 2, fontWeight: 500 }}>{f.name || 'N/A'}</TableCell>
                        <TableCell sx={{ py: 2 }}>{f.email || 'N/A'}</TableCell>
                        <TableCell sx={{ py: 2 }}>
                          <StatusChip status={f.approval_status} />
                        </TableCell>
                        <TableCell sx={{ py: 2 }}>
                          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                            <Button
                              variant="contained"
                              color="success"
                              size="small"
                              onClick={(e) => {
                                e.stopPropagation();
                                setApproveId(f.id);
                              }}
                              sx={{
                                minWidth: 90,
                                textTransform: 'none',
                                fontWeight: 600
                              }}
                            >
                              Approve
                            </Button>
                            <Button
                              variant="outlined"
                              color="error"
                              size="small"
                              onClick={(e) => {
                                e.stopPropagation();
                                setRejectId(f.id);
                              }}
                              sx={{
                                minWidth: 90,
                                textTransform: 'none',
                                fontWeight: 600
                              }}
                            >
                              Reject
                            </Button>
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

      {/* Modal removed - navigating to UserDetailPage instead */}

      <Dialog
        open={Boolean(docsUserId)}
        onClose={() => setDocsUserId(null)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
          }
        }}
      >
        <DialogTitle sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          pb: 1
        }}>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            Farmer Documents
          </Typography>
          <IconButton
            onClick={() => setDocsUserId(null)}
            size="small"
            sx={{
              '&:hover': { bgcolor: 'grey.100' }
            }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          {docsLoading ? (
            <Box sx={{ display: 'grid', gap: 2, py: 2 }}>
              <Skeleton width="100%" height={40} />
              <Skeleton width="100%" height={40} />
              <Skeleton width="80%" height={40} />
            </Box>
          ) : docsContent ? (
            <Paper
              sx={{
                p: 2,
                bgcolor: 'grey.50',
                borderRadius: 2,
                maxHeight: 400,
                overflow: 'auto'
              }}
            >
              <Box
                component="pre"
                sx={{
                  whiteSpace: 'pre-wrap',
                  fontFamily: 'monospace',
                  fontSize: 13,
                  margin: 0,
                  color: 'text.primary'
                }}
              >
                {JSON.stringify(docsContent, null, 2)}
              </Box>
            </Paper>
          ) : (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography variant="body1" sx={{ color: 'text.secondary' }}>
                No documents available
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDocsUserId(null)} variant="contained" color="primary">
            Close
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={Boolean(feedback)}
        autoHideDuration={3000}
        onClose={(event, reason) => {
          if (reason === 'clickaway') {
            return;
          }
          setFeedback('');
        }}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        sx={{
          '& .MuiSnackbarContent-root': {
            borderRadius: 2,
          }
        }}
      >
        <Alert
          onClose={() => setFeedback('')}
          severity="success"
          sx={{ width: '100%' }}
        >
          {feedback}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default AdminUsers;
