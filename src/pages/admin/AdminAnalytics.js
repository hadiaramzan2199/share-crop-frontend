import { useCallback, useEffect, useMemo, useState } from 'react';
import { Box, Card, CardContent, Typography, Stack, Button, TableContainer, Paper, Table, TableHead, TableRow, TableCell, TableBody, TextField, Skeleton } from '@mui/material';
import dayjs from 'dayjs';
import { adminService } from '../../services/admin';
import { useLocation } from 'react-router-dom';

const Header = ({ title, onExportCSV, onExportJSON }) => (
  <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems={{ xs: 'flex-start', sm: 'center' }} justifyContent="space-between">
    <Typography variant="h6" sx={{ fontWeight: 700, color: 'text.primary' }}>{title}</Typography>
    <Stack direction="row" spacing={1}>
      <Button variant="outlined" size="small" onClick={onExportCSV}>Export CSV</Button>
      <Button variant="outlined" size="small" onClick={onExportJSON}>Export JSON</Button>
    </Stack>
  </Stack>
);

const useSort = (initialKey, initialDir = 'asc') => {
  const [sortKey, setSortKey] = useState(initialKey);
  const [sortDir, setSortDir] = useState(initialDir);
  const toggleSort = (key) => {
    if (sortKey === key) setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('asc'); }
  };
  const sortFn = useCallback((a, b) => {
    const va = a?.[sortKey]; const vb = b?.[sortKey];
    if (va == null && vb == null) return 0;
    if (va == null) return sortDir === 'asc' ? 1 : -1;
    if (vb == null) return sortDir === 'asc' ? -1 : 1;
    if (typeof va === 'number' && typeof vb === 'number') return sortDir === 'asc' ? va - vb : vb - va;
    const sa = String(va).toLowerCase(); const sb = String(vb).toLowerCase();
    return sortDir === 'asc' ? sa.localeCompare(sb) : sb.localeCompare(sa);
  }, [sortKey, sortDir]);
  return { sortKey, sortDir, toggleSort, sortFn };
};

const exportCSV = (rows, columns, filename) => {
  const header = columns.join(',');
  const body = rows.map(r => columns.map(c => JSON.stringify(r[c] ?? '')).join(',')).join('\n');
  const blob = new Blob([`${header}\n${body}`], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = filename; a.click(); URL.revokeObjectURL(url);
};

const exportJSON = (rows, filename) => {
  const blob = new Blob([JSON.stringify(rows, null, 2)], { type: 'application/json;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = filename; a.click(); URL.revokeObjectURL(url);
};

const AdminAnalytics = () => {
  const location = useLocation();
  const [from, setFrom] = useState(dayjs().subtract(30, 'day').format('YYYY-MM-DD'));
  const [to, setTo] = useState(dayjs().format('YYYY-MM-DD'));
  const [loadingProfit, setLoadingProfit] = useState(true);
  const [loadingFarmers, setLoadingFarmers] = useState(true);
  const [loadingReviews, setLoadingReviews] = useState(true);
  const [profitRows, setProfitRows] = useState([]);
  const [farmerRows, setFarmerRows] = useState([]);
  const [reviewRows, setReviewRows] = useState([]);
  const [profitQuery, setProfitQuery] = useState('');
  const [farmerQuery, setFarmerQuery] = useState('');
  const [reviewQuery, setReviewQuery] = useState('');
  const [authError, setAuthError] = useState(false);

  const profitSort = useSort('category');
  const farmerSort = useSort('farmer_name');
  const reviewSort = useSort('item');

  useEffect(() => {
    let mounted = true;
    const params = { from, to };
    const loadProfit = async () => {
      try {
        setLoadingProfit(true);
        const r = await adminService.getProfitByCategory(params);
        const rows = Array.isArray(r.data) ? r.data : (Array.isArray(r.data?.rows) ? r.data.rows : []);
        if (mounted) setProfitRows(rows);
      } catch (e) {
        if (e?.response?.status === 401 && mounted) setAuthError(true);
      } finally { if (mounted) setLoadingProfit(false); }
    };
    const loadFarmers = async () => {
      try {
        setLoadingFarmers(true);
        const r = await adminService.getFarmerPerformance(params);
        const rows = Array.isArray(r.data) ? r.data : (Array.isArray(r.data?.rows) ? r.data.rows : []);
        if (mounted) setFarmerRows(rows);
      } catch (e) {
        if (e?.response?.status === 401 && mounted) setAuthError(true);
      } finally { if (mounted) setLoadingFarmers(false); }
    };
    const loadReviews = async () => {
      try {
        setLoadingReviews(true);
        const r = await adminService.getReviewsSummary(params);
        const rows = Array.isArray(r.data) ? r.data : (Array.isArray(r.data?.rows) ? r.data.rows : []);
        if (mounted) setReviewRows(rows);
      } catch (e) {
        if (e?.response?.status === 401 && mounted) setAuthError(true);
      } finally { if (mounted) setLoadingReviews(false); }
    };
    loadProfit(); loadFarmers(); loadReviews();
    return () => { mounted = false; };
  }, [from, to]);

  const filteredProfit = useMemo(() => {
    const q = profitQuery.trim().toLowerCase();
    const rows = q ? profitRows.filter(r => String(r.category).toLowerCase().includes(q)) : profitRows;
    return [...rows].sort(profitSort.sortFn);
  }, [profitRows, profitQuery, profitSort.sortFn]);

  const filteredFarmers = useMemo(() => {
    const q = farmerQuery.trim().toLowerCase();
    const rows = q ? farmerRows.filter(r => String(r.farmer_name || r.name).toLowerCase().includes(q)) : farmerRows;
    return [...rows].sort(farmerSort.sortFn);
  }, [farmerRows, farmerQuery, farmerSort.sortFn]);

  const filteredReviews = useMemo(() => {
    const q = reviewQuery.trim().toLowerCase();
    const rows = q ? reviewRows.filter(r => String(r.item || r.product_name).toLowerCase().includes(q)) : reviewRows;
    return [...rows].sort(reviewSort.sortFn);
  }, [reviewRows, reviewQuery, reviewSort.sortFn]);

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
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems={{ xs: 'flex-start', sm: 'center' }}>
            <TextField label="From" type="date" value={from} onChange={(e) => setFrom(e.target.value)} size="small" InputLabelProps={{ shrink: true }} />
            <TextField label="To" type="date" value={to} onChange={(e) => setTo(e.target.value)} size="small" InputLabelProps={{ shrink: true }} />
          </Stack>
        </CardContent>
      </Card>

      <Card sx={{ borderRadius: 3, boxShadow: '0 2px 12px rgba(0,0,0,0.08)' }}>
        <CardContent>
          <Header
            title="Profit by Category"
            onExportCSV={() => exportCSV(filteredProfit, ['category','orders','revenue','profit'], 'profit_by_category.csv')}
            onExportJSON={() => exportJSON(filteredProfit, 'profit_by_category.json')}
          />
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mt: 2 }}>
            <TextField label="Search" value={profitQuery} onChange={(e) => setProfitQuery(e.target.value)} size="small" />
          </Stack>
          <TableContainer component={Paper} sx={{ mt: 2 }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell onClick={() => profitSort.toggleSort('category')} sx={{ fontWeight: 600, cursor: 'pointer' }}>Category</TableCell>
                  <TableCell onClick={() => profitSort.toggleSort('orders')} sx={{ fontWeight: 600, cursor: 'pointer' }}>Orders</TableCell>
                  <TableCell onClick={() => profitSort.toggleSort('revenue')} sx={{ fontWeight: 600, cursor: 'pointer' }}>Revenue</TableCell>
                  <TableCell onClick={() => profitSort.toggleSort('profit')} sx={{ fontWeight: 600, cursor: 'pointer' }}>Profit</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loadingProfit ? (
                  [...Array(5)].map((_, i) => (
                    <TableRow key={i}>
                      <TableCell><Skeleton width={160} /></TableCell>
                      <TableCell><Skeleton width={80} /></TableCell>
                      <TableCell><Skeleton width={120} /></TableCell>
                      <TableCell><Skeleton width={120} /></TableCell>
                    </TableRow>
                  ))
                ) : filteredProfit.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4}><Typography variant="body2" color="text.secondary">No data</Typography></TableCell>
                  </TableRow>
                ) : (
                  filteredProfit.map((r, idx) => (
                    <TableRow key={idx} hover>
                      <TableCell>{r.category}</TableCell>
                      <TableCell>{r.orders}</TableCell>
                      <TableCell>{r.revenue}</TableCell>
                      <TableCell>{r.profit}</TableCell>
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
          <Header
            title="Farmer Performance"
            onExportCSV={() => exportCSV(filteredFarmers, ['farmer_name','orders','revenue','rating','score'], 'farmer_performance.csv')}
            onExportJSON={() => exportJSON(filteredFarmers, 'farmer_performance.json')}
          />
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mt: 2 }}>
            <TextField label="Search" value={farmerQuery} onChange={(e) => setFarmerQuery(e.target.value)} size="small" />
          </Stack>
          <TableContainer component={Paper} sx={{ mt: 2 }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell onClick={() => farmerSort.toggleSort('farmer_name')} sx={{ fontWeight: 600, cursor: 'pointer' }}>Farmer</TableCell>
                  <TableCell onClick={() => farmerSort.toggleSort('orders')} sx={{ fontWeight: 600, cursor: 'pointer' }}>Orders</TableCell>
                  <TableCell onClick={() => farmerSort.toggleSort('revenue')} sx={{ fontWeight: 600, cursor: 'pointer' }}>Revenue</TableCell>
                  <TableCell onClick={() => farmerSort.toggleSort('rating')} sx={{ fontWeight: 600, cursor: 'pointer' }}>Rating</TableCell>
                  <TableCell onClick={() => farmerSort.toggleSort('score')} sx={{ fontWeight: 600, cursor: 'pointer' }}>Score</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loadingFarmers ? (
                  [...Array(5)].map((_, i) => (
                    <TableRow key={i}>
                      <TableCell><Skeleton width={160} /></TableCell>
                      <TableCell><Skeleton width={80} /></TableCell>
                      <TableCell><Skeleton width={120} /></TableCell>
                      <TableCell><Skeleton width={80} /></TableCell>
                      <TableCell><Skeleton width={80} /></TableCell>
                    </TableRow>
                  ))
                ) : filteredFarmers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5}><Typography variant="body2" color="text.secondary">No data</Typography></TableCell>
                  </TableRow>
                ) : (
                  filteredFarmers.map((r, idx) => (
                    <TableRow key={idx} hover>
                      <TableCell>{r.farmer_name || r.name}</TableCell>
                      <TableCell>{r.orders}</TableCell>
                      <TableCell>{r.revenue}</TableCell>
                      <TableCell>{r.rating}</TableCell>
                      <TableCell>{r.score}</TableCell>
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
          <Header
            title="Reviews Summary"
            onExportCSV={() => exportCSV(filteredReviews, ['item','reviews_count','avg_rating','positive_pct','negative_pct'], 'reviews_summary.csv')}
            onExportJSON={() => exportJSON(filteredReviews, 'reviews_summary.json')}
          />
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mt: 2 }}>
            <TextField label="Search" value={reviewQuery} onChange={(e) => setReviewQuery(e.target.value)} size="small" />
          </Stack>
          <TableContainer component={Paper} sx={{ mt: 2 }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell onClick={() => reviewSort.toggleSort('item')} sx={{ fontWeight: 600, cursor: 'pointer' }}>Item</TableCell>
                  <TableCell onClick={() => reviewSort.toggleSort('reviews_count')} sx={{ fontWeight: 600, cursor: 'pointer' }}>Reviews</TableCell>
                  <TableCell onClick={() => reviewSort.toggleSort('avg_rating')} sx={{ fontWeight: 600, cursor: 'pointer' }}>Avg Rating</TableCell>
                  <TableCell onClick={() => reviewSort.toggleSort('positive_pct')} sx={{ fontWeight: 600, cursor: 'pointer' }}>Positive %</TableCell>
                  <TableCell onClick={() => reviewSort.toggleSort('negative_pct')} sx={{ fontWeight: 600, cursor: 'pointer' }}>Negative %</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loadingReviews ? (
                  [...Array(5)].map((_, i) => (
                    <TableRow key={i}>
                      <TableCell><Skeleton width={160} /></TableCell>
                      <TableCell><Skeleton width={80} /></TableCell>
                      <TableCell><Skeleton width={80} /></TableCell>
                      <TableCell><Skeleton width={80} /></TableCell>
                      <TableCell><Skeleton width={80} /></TableCell>
                    </TableRow>
                  ))
                ) : filteredReviews.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5}><Typography variant="body2" color="text.secondary">No data</Typography></TableCell>
                  </TableRow>
                ) : (
                  filteredReviews.map((r, idx) => (
                    <TableRow key={idx} hover>
                      <TableCell>{r.item || r.product_name}</TableCell>
                      <TableCell>{r.reviews_count}</TableCell>
                      <TableCell>{r.avg_rating}</TableCell>
                      <TableCell>{r.positive_pct}</TableCell>
                      <TableCell>{r.negative_pct}</TableCell>
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

export default AdminAnalytics;
