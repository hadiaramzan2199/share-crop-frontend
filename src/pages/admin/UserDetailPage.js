import { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import PersonIcon from '@mui/icons-material/Person';
import EmailIcon from '@mui/icons-material/Email';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import VisibilityIcon from '@mui/icons-material/Visibility';
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
import './UserDetailPage.css';

const UserDetailPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [tabValue, setTabValue] = useState(0);
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState(null);
    const [orders, setOrders] = useState([]);
    const [complaintsAgainst, setComplaintsAgainst] = useState([]);
    const [complaintsMade, setComplaintsMade] = useState([]);
    const [documents, setDocuments] = useState(null);
    const [error, setError] = useState(null);

    useEffect(() => {
        const loadData = async () => {
            setLoading(true);
            setError(null);
            try {
                const userResp = await adminService.getUserByIdWithStats(id);
                setUser(userResp.data);

                // Load specific data based on role
                if (userResp.data.user_type === 'farmer') {
                    const [ordersResp, complaintsAgainstResp, complaintsMadeResp, docsResp] = await Promise.all([
                        orderService.getFarmerOrders(id),
                        complaintService.getComplaints({ complained_against_user_id: id }),
                        complaintService.getComplaints({ user_id: id }),
                        adminService.getFarmerDocuments(id)
                    ]);
                    setOrders(Array.isArray(ordersResp.data) ? ordersResp.data : []);
                    setComplaintsAgainst(Array.isArray(complaintsAgainstResp.data) ? complaintsAgainstResp.data : []);
                    setComplaintsMade(Array.isArray(complaintsMadeResp.data) ? complaintsMadeResp.data : []);
                    setDocuments(docsResp.data?.documents || null);
                } else {
                    const [ordersResp, complaintsAgainstResp, complaintsMadeResp] = await Promise.all([
                        orderService.getBuyerOrdersWithFields(id),
                        complaintService.getComplaints({ complained_against_user_id: id }),
                        complaintService.getComplaints({ user_id: id })
                    ]);
                    setOrders(Array.isArray(ordersResp.data) ? ordersResp.data : []);
                    setComplaintsAgainst(Array.isArray(complaintsAgainstResp.data) ? complaintsAgainstResp.data : []);
                    setComplaintsMade(Array.isArray(complaintsMadeResp.data) ? complaintsMadeResp.data : []);
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

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
        } catch {
            return dateString;
        }
    };

    if (loading) return <div className="user-detail-container"><div className="header-text"><h1>Loading...</h1></div></div>;
    if (error) return <div className="user-detail-container"><div className="error-alert">{error}</div></div>;

    const tabs = [
        "Overview",
        `Orders (${orders.length})`,
        "Financials",
        ...(user.user_type === 'farmer' ? ["Documents"] : []),
        `Account Reports (${complaintsAgainst.length})`,
        `Reports Filed (${complaintsMade.length})`
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
                                <PersonIcon style={{ fontSize: 60 }} />
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
                                                        <td><button className="text-button" style={{ color: '#3b82f6', border: 'none', background: 'none', cursor: 'pointer', fontWeight: 600 }}>Details</button></td>
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

                        {user.user_type === 'farmer' && tabValue === 3 && (
                            <div className="documents-tab">
                                <h3 className="section-title" style={{ marginTop: 0, marginBottom: '24px', fontWeight: 700 }}>Verification Materials</h3>
                                {documents ? (
                                    <div className="doc-viewer" style={{ background: '#0f172a', padding: '24px', borderRadius: '16px', color: '#94a3b8', fontFamily: 'monospace', overflowX: 'auto' }}>
                                        <pre>{JSON.stringify(documents, null, 2)}</pre>
                                    </div>
                                ) : (
                                    <div className="empty-state">
                                        <DescriptionIcon className="empty-icon" />
                                        <p>No documentation found for verification.</p>
                                    </div>
                                )}
                            </div>
                        )}

                        {((user.user_type === 'farmer' ? tabValue === 4 : tabValue === 3)) && (
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

                        {((user.user_type === 'farmer' ? tabValue === 5 : tabValue === 4)) && (
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
        </div>
    );
};

export default UserDetailPage;
