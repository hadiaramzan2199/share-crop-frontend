import { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Dialog, DialogTitle, DialogContent, DialogActions, Divider, Grid, Avatar, Stack, IconButton, Button, Box, Typography as MuiTypography, CircularProgress } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CloseIcon from '@mui/icons-material/Close';
import PersonIcon from '@mui/icons-material/Person';
import EmailIcon from '@mui/icons-material/Email';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import AgricultureIcon from '@mui/icons-material/Agriculture';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import StarIcon from '@mui/icons-material/Star';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import ShoppingBagIcon from '@mui/icons-material/ShoppingBag';
import LocalOfferIcon from '@mui/icons-material/LocalOffer';
import ReportProblemIcon from '@mui/icons-material/ReportProblem';
import DescriptionIcon from '@mui/icons-material/Description';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import { adminService } from '../../services/admin';
import { complaintService } from '../../services/complaints';
import { orderService } from '../../services/orders';
import { transactionsService } from '../../services/transactions';
import { userDocumentsService } from '../../services/userDocuments';
import './UserDetailPage.css';

const UserDetailPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const [tabValue, setTabValue] = useState(0);

    // Read tab index from URL on mount
    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const tab = params.get('tab');
        if (tab !== null) {
            setTabValue(parseInt(tab));
        }
    }, [location.search]);
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState(null);
    const [orders, setOrders] = useState([]);
    const [transactions, setTransactions] = useState([]);
    const [complaintsAgainst, setComplaintsAgainst] = useState([]);
    const [complaintsMade, setComplaintsMade] = useState([]);
    const [documents, setDocuments] = useState(null);
    const [userDocs, setUserDocs] = useState([]);
    const [error, setError] = useState(null);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);

    useEffect(() => {
        const loadData = async () => {
            setLoading(true);
            setError(null);
            try {
                const userResp = await adminService.getUserByIdWithStats(id);
                setUser(userResp.data);

                // Load specific data based on role
                if (userResp.data.user_type === 'farmer') {
                    const [ordersResp, complaintsAgainstResp, complaintsMadeResp, docsResp, transResp, userDocsResp] = await Promise.all([
                        orderService.getFarmerOrders(id),
                        complaintService.getComplaints({ complained_against_user_id: id }),
                        complaintService.getComplaints({ user_id: id }),
                        adminService.getFarmerDocuments(id),
                        transactionsService.getUserTransactions(id),
                        userDocumentsService.getUserDocuments(id)
                    ]);
                    setOrders(Array.isArray(ordersResp.data) ? ordersResp.data : []);
                    setComplaintsAgainst(Array.isArray(complaintsAgainstResp.data) ? complaintsAgainstResp.data : []);
                    setComplaintsMade(Array.isArray(complaintsMadeResp.data) ? complaintsMadeResp.data : []);
                    setDocuments(docsResp.data?.documents || null);
                    setTransactions(Array.isArray(transResp.data) ? transResp.data : []);
                    setUserDocs(userDocsResp.data || []);
                } else {
                    const [ordersResp, complaintsAgainstResp, complaintsMadeResp, transResp, userDocsResp] = await Promise.all([
                        orderService.getBuyerOrdersWithFields(id),
                        complaintService.getComplaints({ complained_against_user_id: id }),
                        complaintService.getComplaints({ user_id: id }),
                        transactionsService.getUserTransactions(id),
                        userDocumentsService.getUserDocuments(id)
                    ]);
                    setOrders(Array.isArray(ordersResp.data) ? ordersResp.data : []);
                    setComplaintsAgainst(Array.isArray(complaintsAgainstResp.data) ? complaintsAgainstResp.data : []);
                    setComplaintsMade(Array.isArray(complaintsMadeResp.data) ? complaintsMadeResp.data : []);
                    setTransactions(Array.isArray(transResp.data) ? transResp.data : []);
                    setUserDocs(userDocsResp.data || []);
                }
            } catch (err) {
                console.error('Error loading user details:', err);
                setError('Failed to load user details. Please try again later.');
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, [id]);

    const formatDate = (dateString, includeTime = false) => {
        if (!dateString) return 'N/A';
        try {
            const date = new Date(dateString);
            const options = {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                ...(includeTime && { hour: '2-digit', minute: '2-digit' })
            };
            return date.toLocaleDateString('en-US', options);
        } catch {
            return dateString;
        }
    };

    const handleViewOrder = (order) => {
        setSelectedOrder(order);
        setIsOrderModalOpen(true);
    };

    if (loading) {
        return (
            <Box
                sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minHeight: '80vh',
                    gap: 2
                }}
            >
                <CircularProgress sx={{ color: '#4CAF50' }} size={60} thickness={4} />
                <MuiTypography variant="h6" sx={{ color: 'text.secondary', fontWeight: 500 }}>
                    Loading user profile...
                </MuiTypography>
            </Box>
        );
    }
    if (error) return <div className="user-detail-container"><div className="error-alert">{error}</div></div>;

    const tabs = [
        "Overview",
        `Orders (${orders.length})`,
        `Transactions (${transactions.length})`,
        "Financials",
        `Documents (${userDocs.length})`,
        `Reports Against (${complaintsAgainst.length})`,
        `Reports Made (${complaintsMade.length})`
    ];

    return (
        <div className="user-detail-container">
            {/* Breadcrumbs */}
            <div className="breadcrumb-nav">
                <span className="breadcrumb-item" onClick={() => navigate('/admin')}>Admin</span>
                <span className="breadcrumb-separator"><NavigateNextIcon fontSize="inherit" /></span>
                <span className="breadcrumb-item" onClick={() => navigate('/admin/users')}>Users</span>
                <span className="breadcrumb-separator"><NavigateNextIcon fontSize="inherit" /></span>
                <span className="breadcrumb-active">{user.name}</span>
            </div>

            {/* Header */}
            <div className="user-detail-header">
                <button className="back-button" onClick={() => navigate('/admin/users')}>
                    <ArrowBackIcon />
                </button>
                <div className="header-text">
                    <h1>User Profile</h1>
                    <p>Managing {user.user_type} account for {user.name}</p>
                </div>
            </div>

            <div className="user-detail-content">
                {/* Sidebar Profile */}
                <aside className="profile-sidebar detail-card">
                    <div className={`profile-banner ${user.user_type === 'farmer' ? 'farmer' : 'buyer'}`}></div>
                    <div className="profile-info">
                        <div className="profile-avatar-container">
                            <div className={`profile-avatar ${user.user_type === 'farmer' ? 'farmer' : 'buyer'}`}>
                                {user.profile_image_url ? (
                                    <img src={user.profile_image_url} alt={user.name} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                                ) : (
                                    <PersonIcon style={{ fontSize: 80 }} />
                                )}
                            </div>
                        </div>
                        <h2 className="profile-name">{user.name}</h2>
                        <div className="badge-row">
                            <span className={`type-badge ${user.user_type === 'farmer' ? 'farmer' : 'buyer'}`}>
                                {user.user_type === 'farmer' ? <AgricultureIcon fontSize="inherit" /> : <ShoppingCartIcon fontSize="inherit" />}
                                {user.user_type}
                            </span>
                            <span className={`status-badge ${(user.approval_status || 'pending').toLowerCase()}`}>
                                {user.approval_status || 'Pending'}
                            </span>
                        </div>

                        <div className="info-list">
                            <div className="info-item">
                                <div className="info-icon"><EmailIcon fontSize="small" /></div>
                                <div className="info-item-content">
                                    <label>Email Address</label>
                                    <span>{user.email}</span>
                                </div>
                            </div>
                            <div className="info-item">
                                <div className="info-icon"><CalendarTodayIcon fontSize="small" /></div>
                                <div className="info-item-content">
                                    <label>Member Since</label>
                                    <span>{formatDate(user.created_at)}</span>
                                </div>
                            </div>
                            <div className="info-item">
                                <div className="info-icon"><AccountBalanceWalletIcon fontSize="small" color="primary" /></div>
                                <div className="info-item-content">
                                    <label>Coin Balance</label>
                                    <span className="balance">{user.coins?.toLocaleString() || 0}</span>
                                </div>
                            </div>
                        </div>

                        {user.approval_reason && (
                            <div className="approval-notes">
                                <label>Approval Notes</label>
                                <p>{user.approval_reason}</p>
                            </div>
                        )}
                    </div>
                </aside>

                {/* Main Content Area */}
                <main className="main-info-tabs detail-card">
                    <nav className="tabs-header">
                        {tabs.map((tab, idx) => (
                            <div
                                key={idx}
                                className={`tab-item ${tabValue === idx ? 'active' : ''}`}
                                onClick={() => setTabValue(idx)}
                            >
                                {tab}
                            </div>
                        ))}
                    </nav>

                    <div className="tab-panel">
                        {tabValue === 0 && (
                            <div className="overview-tab">
                                <h3 className="section-title" style={{ marginTop: 0, marginBottom: '24px', fontWeight: 700 }}>Performance Metrics</h3>
                                <div className="stats-grid">
                                    {user.user_type === 'farmer' ? (
                                        <>
                                            <div className="stat-box green">
                                                <LocalOfferIcon className="stat-icon" color="success" />
                                                <span className="stat-value">{user.fields_count || 0}</span>
                                                <span className="stat-label">Total Fields</span>
                                            </div>
                                            <div className="stat-box blue">
                                                <ShoppingBagIcon className="stat-icon" color="primary" />
                                                <span className="stat-value">{user.orders_received || 0}</span>
                                                <span className="stat-label">Orders Received</span>
                                            </div>
                                            <div className="stat-box orange">
                                                <AttachMoneyIcon className="stat-icon" style={{ color: '#F59E0B' }} />
                                                <span className="stat-value">${(user.total_revenue || 0).toLocaleString()}</span>
                                                <span className="stat-label">Revenue</span>
                                            </div>
                                            <div className="stat-box pruple">
                                                <StarIcon className="stat-icon" style={{ color: '#A855F7' }} />
                                                <span className="stat-value">{(user.avg_rating || 0).toFixed(1)}</span>
                                                <span className="stat-label">Avg Rating</span>
                                            </div>
                                        </>
                                    ) : (
                                        <>
                                            <div className="stat-box blue" style={{ flex: 1 }}>
                                                <ShoppingBagIcon className="stat-icon" color="primary" />
                                                <span className="stat-value">{user.orders_placed || 0}</span>
                                                <span className="stat-label">Orders Placed</span>
                                            </div>
                                            <div className="stat-box green" style={{ flex: 1 }}>
                                                <AttachMoneyIcon className="stat-icon" color="success" />
                                                <span className="stat-value">${(user.total_spent || 0).toLocaleString()}</span>
                                                <span className="stat-label">Total Spending</span>
                                            </div>
                                        </>
                                    )}
                                </div>
                                <div className="activity-placeholder" style={{ padding: '24px', border: '1px dashed #e2e8f0', borderRadius: '16px', color: '#64748b', textAlign: 'center' }}>
                                    Activity history will be synced here in upcoming updates.
                                </div>
                            </div>
                        )}

                        {tabValue === 1 && (
                            <div className="orders-tab">
                                <h3 className="section-title" style={{ marginTop: 0, marginBottom: '24px', fontWeight: 700 }}>User Transactions</h3>
                                {orders.length > 0 ? (
                                    <div className="custom-table-container">
                                        <table className="custom-table">
                                            <thead>
                                                <tr>
                                                    <th>Order ID</th>
                                                    <th>Date</th>
                                                    <th>Total Price</th>
                                                    <th>Status</th>
                                                    <th>Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {orders.slice(0, 10).map((order) => (
                                                    <tr key={order.id}>
                                                        <td style={{ fontFamily: 'monospace', color: '#64748b' }}>#{order.id.split('-')[0]}</td>
                                                        <td>{formatDate(order.created_at)}</td>
                                                        <td style={{ fontWeight: 600 }}>${order.total_price?.toLocaleString()}</td>
                                                        <td>
                                                            <span className={`status-badge ${order.status === 'completed' ? 'approved' : 'pending'}`}>
                                                                {order.status}
                                                            </span>
                                                        </td>
                                                        <td>
                                                            <button
                                                                className="text-button"
                                                                style={{ color: '#3b82f6', border: 'none', background: 'none', cursor: 'pointer', fontWeight: 600 }}
                                                                onClick={() => handleViewOrder(order)}
                                                            >
                                                                Details
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                ) : (
                                    <div className="empty-state">
                                        <ShoppingCartIcon className="empty-icon" />
                                        <p>No orders found for this user.</p>
                                    </div>
                                )}
                            </div>
                        )}

                        {tabValue === 2 && (
                            <div className="transactions-tab">
                                <h3 className="section-title" style={{ marginTop: 0, marginBottom: '24px', fontWeight: 700 }}>Coin Activity</h3>
                                {transactions.length > 0 ? (
                                    <div className="custom-table-container">
                                        <table className="custom-table">
                                            <thead>
                                                <tr>
                                                    <th>Type</th>
                                                    <th>Amount</th>
                                                    <th>Reason</th>
                                                    <th>Date</th>
                                                    <th>Balance After</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {transactions.map((t) => (
                                                    <tr key={t.id}>
                                                        <td>
                                                            <span className={`status-badge ${t.type === 'debit' ? 'rejected' : 'approved'}`} style={{ fontSize: '0.7rem' }}>
                                                                {t.type}
                                                            </span>
                                                        </td>
                                                        <td style={{ fontWeight: 700, color: t.type === 'debit' ? '#dc2626' : '#059669' }}>
                                                            {t.type === 'debit' ? '-' : '+'}{Math.abs(t.amount).toLocaleString()}
                                                        </td>
                                                        <td style={{ fontSize: '0.85rem' }}>{t.reason}</td>
                                                        <td style={{ color: '#64748b' }}>{formatDate(t.created_at, true)}</td>
                                                        <td style={{ fontWeight: 600 }}>{t.balance_after?.toLocaleString()}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                ) : (
                                    <div className="empty-state">
                                        <AccountBalanceWalletIcon className="empty-icon" />
                                        <p>No transactions recorded for this account.</p>
                                    </div>
                                )}
                            </div>
                        )}

                        {tabValue === 3 && (
                            <div className="financials-tab">
                                <h3 className="section-title" style={{ marginTop: 0, marginBottom: '24px', fontWeight: 700 }}>Financial Overview</h3>
                                <div className="stats-grid">
                                    <div className="stat-box blue" style={{ textAlign: 'left', background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(37, 99, 235, 0.05) 100%)' }}>
                                        <span className="stat-label">Available Balance</span>
                                        <span className="stat-value" style={{ fontSize: '2.5rem', margin: '8px 0', color: '#2563eb' }}>{user.coins?.toLocaleString() || 0} <span style={{ fontSize: '1rem', fontWeight: 600 }}>Coins</span></span>
                                    </div>
                                    <div className="stat-box orange" style={{ textAlign: 'left' }}>
                                        <span className="stat-label">{user.user_type === 'farmer' ? 'Lifetime Earnings' : 'Lifetime Spending'}</span>
                                        <span className="stat-value" style={{ fontSize: '2rem', margin: '8px 0' }}>${(user.user_type === 'farmer' ? user.total_revenue : user.total_spent)?.toLocaleString() || 0}</span>
                                    </div>
                                </div>
                            </div>
                        )}

                        {tabValue === 4 && (
                            <div className="documents-tab">
                                <h3 className="section-title" style={{ marginTop: 0, marginBottom: '24px', fontWeight: 700 }}>License</h3>
                                {userDocs.length > 0 ? (
                                    <div className="custom-table-container">
                                        <table className="custom-table">
                                            <thead>
                                                <tr>
                                                    <th>File Name</th>
                                                    <th>Type</th>
                                                    <th>Uploaded At</th>
                                                    <th>Action</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {userDocs.map((doc) => (
                                                    <tr key={doc.id}>
                                                        <td style={{ fontWeight: 600 }}>{doc.file_name}</td>
                                                        <td><span className="type-badge farmer">{doc.file_type || 'other'}</span></td>
                                                        <td style={{ color: '#64748b' }}>{formatDate(doc.uploaded_at, true)}</td>
                                                        <td>
                                                            <a
                                                                href={doc.file_url}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="text-button"
                                                                style={{ color: '#3b82f6', textDecoration: 'none', fontWeight: 600 }}
                                                            >
                                                                View
                                                            </a>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                ) : documents ? (
                                    <div className="doc-viewer" style={{ background: '#0f172a', padding: '24px', borderRadius: '16px', color: '#94a3b8', fontFamily: 'monospace', overflowX: 'auto' }}>
                                        <pre>{JSON.stringify(documents, null, 2)}</pre>
                                    </div>
                                ) : (
                                    <div className="empty-state">
                                        <DescriptionIcon className="empty-icon" />
                                        <p>No license documents found for this account.</p>
                                    </div>
                                )}
                            </div>
                        )}

                        {tabValue === 5 && (
                            <div className="complaints-tab">
                                <h3 className="section-title" style={{ marginTop: 0, marginBottom: '24px', fontWeight: 700 }}>Account Reports (Against User)</h3>
                                {complaintsAgainst.length > 0 ? (
                                    <div className="custom-table-container">
                                        <table className="custom-table">
                                            <thead>
                                                <tr>
                                                    <th>Category</th>
                                                    <th>From</th>
                                                    <th>Status</th>
                                                    <th>Date</th>
                                                    <th>Description</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {complaintsAgainst.map((c) => (
                                                    <tr key={c.id}>
                                                        <td><span className="type-badge farmer" style={{ fontSize: '0.7rem' }}>{c.category || 'General'}</span></td>
                                                        <td style={{ fontSize: '0.85rem' }}>{c.created_by_name}</td>
                                                        <td><span className={`status-badge ${c.status.toLowerCase() == 'resolved' ? 'approved' : 'pending'}`}>{c.status}</span></td>
                                                        <td>{formatDate(c.created_at)}</td>
                                                        <td style={{ maxWidth: '250px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.description}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                ) : (
                                    <div className="empty-state">
                                        <CheckCircleIcon className="empty-icon" style={{ color: '#10b981' }} />
                                        <p>No reports filed against this account. Great track record!</p>
                                    </div>
                                )}
                            </div>
                        )}

                        {tabValue === 6 && (
                            <div className="complaints-tab">
                                <h3 className="section-title" style={{ marginTop: 0, marginBottom: '24px', fontWeight: 700 }}>Reports Filed (By User)</h3>
                                {complaintsMade.length > 0 ? (
                                    <div className="custom-table-container">
                                        <table className="custom-table">
                                            <thead>
                                                <tr>
                                                    <th>Category</th>
                                                    <th>Against</th>
                                                    <th>Status</th>
                                                    <th>Date</th>
                                                    <th>Description</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {complaintsMade.map((c) => (
                                                    <tr key={c.id}>
                                                        <td><span className="type-badge buyer" style={{ fontSize: '0.7rem' }}>{c.category || 'General'}</span></td>
                                                        <td style={{ fontSize: '0.85rem' }}>{c.complained_against_user_name || 'N/A'}</td>
                                                        <td><span className={`status-badge ${c.status.toLowerCase() == 'resolved' ? 'approved' : 'pending'}`}>{c.status}</span></td>
                                                        <td>{formatDate(c.created_at)}</td>
                                                        <td style={{ maxWidth: '250px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.description}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                ) : (
                                    <div className="empty-state">
                                        <ReportProblemIcon className="empty-icon" />
                                        <p>This user hasn't filed any reports yet.</p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </main>
            </div>

            {/* Order Details Dialog */}
            <Dialog
                open={isOrderModalOpen}
                onClose={() => setIsOrderModalOpen(false)}
                maxWidth="md"
                fullWidth
                PaperProps={{
                    sx: {
                        borderRadius: 3,
                        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
                    }
                }}
            >
                <DialogTitle sx={{
                    borderBottom: '1px solid #e2e8f0',
                    backgroundColor: '#f8fafc',
                    p: 2
                }}>
                    <Stack direction="row" alignItems="center" justifyContent="space-between">
                        <Stack direction="row" alignItems="center" spacing={2}>
                            <Avatar sx={{ backgroundColor: '#dbeafe', color: '#1d4ed8' }}>
                                <ShoppingBagIcon />
                            </Avatar>
                            <Box>
                                <MuiTypography variant="h6" sx={{ fontWeight: 700, color: '#0f172a' }}>
                                    Order Details
                                </MuiTypography>
                                <MuiTypography variant="caption" sx={{ color: '#64748b', fontWeight: 600 }}>
                                    #{selectedOrder?.id}
                                </MuiTypography>
                            </Box>
                        </Stack>
                        <IconButton onClick={() => setIsOrderModalOpen(false)} size="small">
                            <CloseIcon />
                        </IconButton>
                    </Stack>
                </DialogTitle>
                <DialogContent sx={{ p: 3, mt: 1 }}>
                    {selectedOrder && (
                        <Grid container spacing={3}>
                            {/* Product Info */}
                            <Grid item xs={12} md={6}>
                                <div style={{ padding: '20px', backgroundColor: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                                    <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 2 }}>
                                        <div style={{ color: '#10b981' }}>
                                            <AgricultureIcon fontSize="small" />
                                        </div>
                                        <MuiTypography variant="subtitle2" sx={{ fontWeight: 700, textTransform: 'uppercase', color: '#64748b', letterSpacing: '0.05em' }}>
                                            Field Information
                                        </MuiTypography>
                                    </Stack>
                                    <Divider sx={{ mb: 2, opacity: 0.6 }} />
                                    <Stack spacing={2}>
                                        <Box>
                                            <MuiTypography variant="caption" sx={{ color: '#94a3b8', fontWeight: 600, display: 'block' }}>Field Name</MuiTypography>
                                            <MuiTypography variant="body1" sx={{ fontWeight: 600, color: '#1e293b' }}>{selectedOrder.field_name || 'N/A'}</MuiTypography>
                                        </Box>
                                        <Box>
                                            <MuiTypography variant="caption" sx={{ color: '#94a3b8', fontWeight: 600, display: 'block' }}>Crop Type</MuiTypography>
                                            <MuiTypography variant="body1" sx={{ fontWeight: 600, color: '#1e293b' }}>{selectedOrder.crop_type || 'Mixed'}</MuiTypography>
                                        </Box>
                                        <Box>
                                            <MuiTypography variant="caption" sx={{ color: '#94a3b8', fontWeight: 600, display: 'block' }}>Location</MuiTypography>
                                            <MuiTypography variant="body1" sx={{ fontWeight: 600, color: '#1e293b' }}>{selectedOrder.location || 'N/A'}</MuiTypography>
                                        </Box>
                                    </Stack>
                                </div>
                            </Grid>

                            {/* Transaction Info */}
                            <Grid item xs={12} md={6}>
                                <div style={{ padding: '20px', backgroundColor: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                                    <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 2 }}>
                                        <div style={{ color: '#3b82f6' }}>
                                            <AttachMoneyIcon fontSize="small" />
                                        </div>
                                        <MuiTypography variant="subtitle2" sx={{ fontWeight: 700, textTransform: 'uppercase', color: '#64748b', letterSpacing: '0.05em' }}>
                                            Financial Details
                                        </MuiTypography>
                                    </Stack>
                                    <Divider sx={{ mb: 2, opacity: 0.6 }} />
                                    <Stack spacing={2}>
                                        <Box>
                                            <MuiTypography variant="caption" sx={{ color: '#94a3b8', fontWeight: 600, display: 'block' }}>Status</MuiTypography>
                                            <span className={`status-badge ${selectedOrder.status === 'completed' ? 'approved' : 'pending'}`}>
                                                {selectedOrder.status}
                                            </span>
                                        </Box>
                                        <Box>
                                            <MuiTypography variant="caption" sx={{ color: '#94a3b8', fontWeight: 600, display: 'block' }}>Quantity / Area</MuiTypography>
                                            <MuiTypography variant="body1" sx={{ fontWeight: 600, color: '#1e293b' }}>{selectedOrder.quantity || selectedOrder.area_rented || 0} m²</MuiTypography>
                                        </Box>
                                        <Box>
                                            <MuiTypography variant="caption" sx={{ color: '#94a3b8', fontWeight: 600, display: 'block' }}>Total Amount</MuiTypography>
                                            <MuiTypography variant="h6" sx={{ fontWeight: 800, color: '#059669' }}>${selectedOrder.total_price?.toLocaleString() || 0}</MuiTypography>
                                        </Box>
                                    </Stack>
                                </div>
                            </Grid>

                            {/* Additional Info */}
                            <Grid item xs={12}>
                                <div style={{ padding: '20px', backgroundColor: '#f1f5f9', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                                    <MuiTypography variant="subtitle2" sx={{ fontWeight: 700, color: '#475569', mb: 1.5 }}>Details & Timing</MuiTypography>
                                    <Grid container spacing={2}>
                                        <Grid item xs={6} sm={4}>
                                            <MuiTypography variant="caption" sx={{ color: '#94a3b8', fontWeight: 600 }}>Created On</MuiTypography>
                                            <MuiTypography variant="body2" sx={{ fontWeight: 600 }}>{formatDate(selectedOrder.created_at, true)}</MuiTypography>
                                        </Grid>
                                        <Grid item xs={6} sm={4}>
                                            <MuiTypography variant="caption" sx={{ color: '#94a3b8', fontWeight: 600 }}>Harvest Date</MuiTypography>
                                            <MuiTypography variant="body2" sx={{ fontWeight: 600 }}>{formatDate(selectedOrder.selected_harvest_date) || 'Not selected'}</MuiTypography>
                                        </Grid>
                                        <Grid item xs={6} sm={4}>
                                            <MuiTypography variant="caption" sx={{ color: '#94a3b8', fontWeight: 600 }}>Shipping Mode</MuiTypography>
                                            <MuiTypography variant="body2" sx={{ fontWeight: 600, textTransform: 'capitalize' }}>{selectedOrder.mode_of_shipping || 'Delivery'}</MuiTypography>
                                        </Grid>
                                    </Grid>
                                </div>
                            </Grid>
                        </Grid>
                    )}
                </DialogContent>
                <DialogActions sx={{ p: 2, backgroundColor: '#f8fafc', borderTop: '1px solid #e2e8f0' }}>
                    <Button
                        onClick={() => setIsOrderModalOpen(false)}
                        sx={{ color: '#64748b', fontWeight: 600, textTransform: 'none' }}
                    >
                        Close
                    </Button>

                </DialogActions>
            </Dialog>
        </div>
    );
};

export default UserDetailPage;
