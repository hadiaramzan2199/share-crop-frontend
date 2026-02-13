import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Avatar,
  Button,
  TextField,
  Grid,
  Chip,
  IconButton,
  Divider,
  Stack,
  Paper,
  Tabs,
  Tab,
  CircularProgress,
  useTheme,
  alpha,
  Tooltip,
  InputAdornment,
  LinearProgress,
  Snackbar,
  Alert
} from '@mui/material';
import {
  Edit,
  Save,
  Cancel,
  PhotoCamera,
  Email,
  AccountBalance,
  CalendarToday,
  Lock,
  CloudUpload,
  Description,
  Delete as DeleteIcon,
  VerifiedUser,
  Security,
  Dashboard,
  Person,
  FolderOpen,
  Phone,
  LocationOn
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { profileService } from '../services/profile';
import { orderService } from '../services/orders';
import { userDocumentsService } from '../services/userDocuments';
import supabase from '../services/supabase';

// Helper component for statistics cards
const StatCard = ({ label, value, icon, color }) => (
  <Paper
    elevation={0}
    sx={{
      p: 2.5,
      borderRadius: 3,
      display: 'flex',
      alignItems: 'center',
      gap: 2,
      background: '#ffffff',
      border: '1px solid',
      borderColor: 'divider',
      transition: 'all 0.3s ease',
      height: 100, // Fixed height
      width: '100%',
      position: 'relative',
      overflow: 'hidden',
      '&:hover': {
        borderColor: color,
        transform: 'translateY(-2px)',
        boxShadow: `0 4px 12px ${alpha(color, 0.15)}`
      }
    }}
  >
    <Box
      sx={{
        width: 48,
        height: 48,
        borderRadius: 2,
        bgcolor: alpha(color, 0.1),
        color: color,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0
      }}
    >
      {React.cloneElement(icon, { fontSize: 'medium' })}
    </Box>
    <Box sx={{ minWidth: 0, flex: 1 }}>
      <Typography variant="h5" fontWeight="700" color="text.primary" sx={{ lineHeight: 1.2, mb: 0.5, fontSize: { xs: '1.25rem', md: '1.5rem' } }} noWrap>
        {typeof value === 'number' ? value.toLocaleString() : value}
      </Typography>
      <Typography variant="body2" color="text.secondary" fontWeight="500" noWrap>
        {label}
      </Typography>
    </Box>
  </Paper>
);

const Profile = () => {
  const theme = useTheme();
  const { user, updateUser } = useAuth();
  const [activeTab, setActiveTab] = useState(0);

  // Profile State
  const [profile, setProfile] = useState({
    name: '',
    email: '',
    phone: '',
    location: '',
    joinDate: '',
    bio: '',
    avatar: null,
    user_type: '',
    coins: 0,
    email_verified: false,
    totalSpent: 0,
    profile_image_url: null,
    activeRentals: 0,
    totalRentals: 0
  });

  const [editedProfile, setEditedProfile] = useState({ ...profile });

  // Loading & statuses
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Password State
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [changingPassword, setChangingPassword] = useState(false);

  // Documents State
  const [documents, setDocuments] = useState([]);
  const [docLoading, setDocLoading] = useState(false);

  // Edit Mode Toggle
  const [editMode, setEditMode] = useState(false);

  useEffect(() => {
    if (user) {
      loadProfile();
      loadUserDocuments();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const loadUserDocuments = async () => {
    if (!user?.id) return;
    try {
      setDocLoading(true);
      const response = await userDocumentsService.getUserDocuments(user.id);
      setDocuments(response.data || []);
    } catch (err) {
      console.error('Error loading documents:', err);
    } finally {
      setDocLoading(false);
    }
  };

  const loadProfile = async () => {
    try {
      setLoading(true);
      setError(null);

      const profileResponse = await profileService.getProfile();
      const userData = profileResponse.data?.user || user;

      // Calculate stats
      let stats = {
        totalRentals: 0,
        activeRentals: 0,
        totalSpent: 0,
      };

      try {
        let orders = [];
        if (userData.user_type === 'buyer') {
          const ordersResponse = await orderService.getBuyerOrders();
          orders = ordersResponse.data || [];
        } else if (userData.user_type === 'farmer') {
          const ordersResponse = await orderService.getFarmerOrders(userData.id);
          orders = ordersResponse.data || [];
        }

        if (orders.length > 0) {
          stats.totalRentals = orders.length;
          stats.activeRentals = orders.filter(o => ['pending', 'active', 'confirmed'].includes(o.status)).length;
          stats.totalSpent = orders.reduce((sum, o) => {
            const price = parseFloat(o.total_price);
            return sum + (isNaN(price) ? 0 : price);
          }, 0);
        }
      } catch (statsErr) {
        console.warn('Could not load user stats:', statsErr);
      }

      setProfile({
        name: userData.name || '',
        email: userData.email || '',
        phone: '',
        location: '',
        joinDate: userData.created_at || '',
        bio: '',
        avatar: null,
        user_type: userData.user_type || 'User',
        coins: userData.coins || 0,
        email_verified: userData.email_verified || false,
        profile_image_url: userData.profile_image_url || null,
        ...stats,
      });

      setEditedProfile({
        name: userData.name || '',
        email: userData.email || '',
        phone: '',
        location: '',
        bio: '',
        profile_image_url: userData.profile_image_url || null
      });

    } catch (err) {
      console.error('Error loading profile:', err);
      setError('Failed to load profile details.');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    try {
      setSaving(true);
      setError(null);

      const updateData = {
        name: editedProfile.name,
        email: editedProfile.email,
      };

      const response = await profileService.updateProfile(updateData);
      const updatedUser = response.data?.user;

      if (updatedUser) {
        updateUser(updatedUser);
        setProfile(prev => ({
          ...prev,
          name: updatedUser.name,
          email: updatedUser.email
        }));
        setEditMode(false);
        setSuccess('Profile updated successfully!');
      }
    } catch (err) {
      console.error('Error updating profile:', err);
      setError(err.response?.data?.error || 'Failed to update profile.');
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setError('New passwords do not match');
      return;
    }
    if (passwordData.newPassword.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    try {
      setChangingPassword(true);
      setError(null);
      await profileService.changePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      });
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setSuccess('Password changed successfully!');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to change password.');
    } finally {
      setChangingPassword(false);
    }
  };

  const handleAvatarChange = async (event) => {
    const file = event.target.files[0];
    if (!file || !user) return;

    try {
      setUploading(true);
      const fileExt = file.name.split('.').pop();
      const filePath = `profile-images/${user.id}-profile.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('user-documents')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('user-documents')
        .getPublicUrl(filePath);

      const cacheBustedUrl = `${publicUrl}?v=${Date.now()}`;

      await profileService.updateProfileImage(user.id, cacheBustedUrl);

      setProfile(prev => ({ ...prev, profile_image_url: cacheBustedUrl }));
      setEditedProfile(prev => ({ ...prev, profile_image_url: cacheBustedUrl }));
      updateUser({ ...user, profile_image_url: cacheBustedUrl });

      setSuccess('Profile picture updated!');
    } catch (err) {
      console.error(err);
      setError('Failed to update profile picture.');
    } finally {
      setUploading(false);
    }
  };

  const handleDocumentUpload = async (event) => {
    const file = event.target.files[0];
    if (!file || !user) return;

    try {
      setUploading(true);
      const fileName = file.name;
      const fileExt = fileName.split('.').pop();
      const safeName = fileName.replace(/[^a-z0-9]/gi, '_').toLowerCase();
      const filePath = `documents/${user.id}-${Date.now()}-${safeName}`;

      const { error: uploadError } = await supabase.storage
        .from('user-documents')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('user-documents')
        .getPublicUrl(filePath);

      await userDocumentsService.addDocument({
        user_id: user.id,
        file_name: fileName,
        file_url: publicUrl,
        file_type: fileExt
      });

      loadUserDocuments();
      setSuccess('Document uploaded successfully!');
    } catch (err) {
      setError('Failed to upload document.');
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteDocument = async (docId) => {
    try {
      setDocLoading(true);
      await userDocumentsService.deleteDocument(docId);
      setDocuments(prev => prev.filter(d => d.id !== docId));
      setSuccess('Document removed.');
    } catch (err) {
      setError('Failed to delete document.');
    } finally {
      setDocLoading(false);
    }
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', width: '100%' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ width: '100%', minHeight: '100vh', bgcolor: '#f8fafc', pb: 8 }}>
      {/* Notifications */}
      <Snackbar open={!!error} autoHideDuration={6000} onClose={() => setError(null)}>
        <Alert severity="error" onClose={() => setError(null)} sx={{ width: '100%' }}>{error}</Alert>
      </Snackbar>
      <Snackbar open={!!success} autoHideDuration={6000} onClose={() => setSuccess(null)}>
        <Alert severity="success" onClose={() => setSuccess(null)} sx={{ width: '100%' }}>{success}</Alert>
      </Snackbar>



      {/* Main Container - Flex Layout to prevent wrapping */}
      <Box sx={{ px: { xs: 2, md: 6 }, mt: 4, maxWidth: 1600, mx: 'auto' }}>
        <Box sx={{
          display: { xs: 'block', md: 'flex' },
          gap: 4,
          alignItems: 'flex-start'
        }}>

          {/* Left Column: Fixed Profile Sidebar */}
          <Box sx={{
            width: { xs: '100%', md: 320, lg: 360 },
            flexShrink: 0,
            mb: { xs: 4, md: 0 },
            position: { md: 'sticky' },
            top: { md: 24 },
            zIndex: 10
          }}>
            <Card sx={{
              borderRadius: 4,
              boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
              overflow: 'visible'
            }}>
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', p: 4 }}>
                <Box sx={{ position: 'relative', mb: 2 }}>
                  <Avatar
                    src={profile.profile_image_url}
                    sx={{
                      width: 120,
                      height: 120,
                      border: `4px solid ${theme.palette.primary.light}`,
                      fontSize: '3rem',
                      bgcolor: theme.palette.primary.main
                    }}
                  >
                    {!profile.profile_image_url && profile.name.charAt(0)}
                  </Avatar>

                  {uploading && (
                    <CircularProgress
                      size={128}
                      sx={{
                        position: 'absolute',
                        top: -4,
                        left: -4,
                        color: theme.palette.primary.main,
                        zIndex: 1
                      }}
                    />
                  )}

                  <Tooltip title="Upload Profile Picture" placement="right">
                    <IconButton
                      component="label"
                      size="small"
                      sx={{
                        position: 'absolute',
                        bottom: 0,
                        right: 0,
                        backgroundColor: 'white',
                        border: '1px solid #e0e0e0',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                        '&:hover': { backgroundColor: '#f5f5f5' }
                      }}
                    >
                      <PhotoCamera fontSize="small" color="primary" />
                      <input hidden accept="image/*" type="file" onChange={handleAvatarChange} />
                    </IconButton>
                  </Tooltip>
                </Box>

                <Typography variant="h6" fontWeight="700" color="text.primary" align="center" gutterBottom>
                  {profile.name}
                </Typography>

                <Typography variant="body2" color="text.secondary" align="center" sx={{ mb: 2 }}>
                  {profile.email}
                </Typography>

                <Stack direction="row" spacing={1} sx={{ mb: 3 }}>
                  <Chip
                    size="small"
                    label={profile.user_type.toUpperCase()}
                    color="primary"
                    variant="outlined"
                    sx={{ fontWeight: 600, borderRadius: 1 }}
                  />
                  {profile.email_verified && (
                    <Chip
                      size="small"
                      label="VERIFIED"
                      color="success"
                      variant="outlined"
                      sx={{ fontWeight: 600, borderRadius: 1 }}
                    />
                  )}
                </Stack>

                <Divider sx={{ width: '100%', mb: 3 }} />

                <Box sx={{ width: '100%' }}>
                  <Stack spacing={2}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="body2" color="text.secondary">Joined</Typography>
                      <Typography variant="body2" fontWeight="600">
                        {profile.joinDate ? new Date(profile.joinDate).toLocaleDateString() : '-'}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="body2" color="text.secondary">Balance</Typography>
                      <Typography variant="body2" fontWeight="600" color="primary.main">
                        {profile.coins} Coins
                      </Typography>
                    </Box>
                  </Stack>
                </Box>
              </Box>
            </Card>
          </Box>

          {/* Right Column: Tabs and Content aligned to Top */}
          <Box sx={{ flex: 1, minWidth: 0 }}>

            {/* Tabs aligned with top of Sidebar */}
            <Box sx={{ mb: 3, borderBottom: 1, borderColor: 'divider' }}>
              <Tabs
                value={activeTab}
                onChange={handleTabChange}
                variant="scrollable"
                scrollButtons="auto"
                sx={{
                  '& .MuiTab-root': {
                    textTransform: 'none',
                    fontWeight: 600,
                    fontSize: '1rem',
                    minHeight: 48,
                    mr: 2
                  },
                  '& .Mui-selected': {
                    color: theme.palette.primary.main,
                  },
                  '& .MuiTabs-indicator': {
                    height: 3,
                    borderRadius: '3px 3px 0 0',
                    backgroundColor: theme.palette.primary.main
                  }
                }}
              >
                <Tab icon={<Dashboard fontSize="small" />} iconPosition="start" label="Overview" />
                <Tab icon={<FolderOpen fontSize="small" />} iconPosition="start" label="Documents" />
                <Tab icon={<Security fontSize="small" />} iconPosition="start" label="Security" />
              </Tabs>
            </Box>

            {/* Content Area */}
            <Box sx={{ minHeight: 400 }}>

              {/* Overview Tab */}
              {activeTab === 0 && (
                <>
                  <Box sx={{ width: '100%', maxWidth: '100%' }}>
                    {/* Stats Cards Row */}
                    <Grid container spacing={3} sx={{ mb: { xs: 5, md: 7 }, width: '100%' }}>
                      <Grid item xs={12} sm={6} lg={4}>
                        <StatCard
                          label="Total Rentals"
                          value={profile.totalRentals}
                          icon={<Dashboard />}
                          color={theme.palette.primary.main}
                        />
                      </Grid>
                      <Grid item xs={12} sm={6} lg={4}>
                        <StatCard
                          label="Active Rentals"
                          value={profile.activeRentals}
                          icon={<CalendarToday />}
                          color={theme.palette.secondary.main}
                        />
                      </Grid>
                      <Grid item xs={12} sm={6} lg={4}>
                        <StatCard
                          label="Total Spent"
                          value={`$${profile.totalSpent.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                          icon={<AccountBalance />}
                          color="#8bc34a"
                        />
                      </Grid>
                    </Grid>
                  </Box>

                  {/* Personal Info Form */}
                  <Card sx={{ borderRadius: 3, boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
                    <CardContent sx={{ p: 3 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                        <Typography variant="h6" fontWeight="700">Personal Information</Typography>
                        {!editMode ? (
                          <Button
                            startIcon={<Edit />}
                            variant="outlined"
                            onClick={() => setEditMode(true)}
                            size="small"
                          >
                            Edit
                          </Button>
                        ) : (
                          <Stack direction="row" spacing={1}>
                            <Button
                              variant="text"
                              color="inherit"
                              onClick={() => {
                                setEditMode(false);
                                setEditedProfile({ ...profile });
                              }}
                            >
                              Cancel
                            </Button>
                            <Button
                              variant="contained"
                              onClick={handleSaveProfile}
                              disabled={saving}
                            >
                              Save
                            </Button>
                          </Stack>
                        )}
                      </Box>

                      <Grid container spacing={3}>
                        <Grid item xs={12} sm={6}>
                          <TextField
                            fullWidth
                            label="Full Name"
                            value={editMode ? editedProfile.name : profile.name}
                            onChange={(e) => setEditedProfile({ ...editedProfile, name: e.target.value })}
                            disabled={!editMode}
                            variant="outlined"
                            size="medium"
                          />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <TextField
                            fullWidth
                            label="Email Address"
                            value={editMode ? editedProfile.email : profile.email}
                            onChange={(e) => setEditedProfile({ ...editedProfile, email: e.target.value })}
                            disabled={!editMode}
                            variant="outlined"
                            size="medium"
                          />
                        </Grid>

                      </Grid>
                    </CardContent>
                  </Card>
                </>
              )}

              {/* Documents Tab */}
              {activeTab === 1 && (
                <Card sx={{ borderRadius: 3, boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
                  <CardContent sx={{ p: 4 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                      <Box>
                        <Typography variant="h6" fontWeight="700">My Documents</Typography>
                        <Typography variant="body2" color="text.secondary">Manage your licenses, permits, and ID documents</Typography>
                      </Box>
                      <Button
                        component="label"
                        variant="contained"
                        startIcon={<CloudUpload />}
                        disabled={uploading}
                      >
                        Upload
                        <input type="file" hidden onChange={handleDocumentUpload} />
                      </Button>
                    </Box>

                    {uploading && <LinearProgress sx={{ mb: 3, borderRadius: 1 }} />}

                    {documents.length === 0 ? (
                      <Box sx={{ py: 8, textAlign: 'center', bgcolor: alpha(theme.palette.primary.main, 0.05), borderRadius: 2 }}>
                        <Description sx={{ fontSize: 48, color: 'text.secondary', mb: 1.5, opacity: 0.5 }} />
                        <Typography color="text.secondary">No documents uploaded yet.</Typography>
                      </Box>
                    ) : (
                      <Stack spacing={2}>
                        {documents.map((doc) => (
                          <Paper
                            key={doc.id}
                            variant="outlined"
                            sx={{
                              p: 2,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              borderRadius: 2,
                              transition: 'background-color 0.2s',
                              '&:hover': { bgcolor: 'grey.50' }
                            }}
                          >
                            <Box sx={{ display: 'flex', alignItems: 'center', overflow: 'hidden' }}>
                              <Avatar sx={{ bgcolor: 'primary.light', mr: 2 }}>
                                <Description sx={{ color: 'white' }} />
                              </Avatar>
                              <Box sx={{ minWidth: 0 }}>
                                <Typography variant="subtitle2" noWrap sx={{ fontWeight: 600 }}>
                                  {doc.file_name}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  {new Date(doc.created_at).toLocaleDateString()}
                                </Typography>
                              </Box>
                            </Box>
                            <Stack direction="row" spacing={1}>
                              <IconButton
                                size="small"
                                color="primary"
                                component="a"
                                href={doc.file_url}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                <FolderOpen fontSize="small" />
                              </IconButton>
                              <IconButton
                                size="small"
                                color="error"
                                onClick={() => handleDeleteDocument(doc.id)}
                                disabled={docLoading}
                              >
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </Stack>
                          </Paper>
                        ))}
                      </Stack>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Security Tab */}
              {activeTab === 2 && (
                <Card sx={{ borderRadius: 3, boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
                  <CardContent sx={{ p: 4 }}>
                    <Typography variant="h6" fontWeight="700" gutterBottom>Change Password</Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
                      Ensure your account is secure by using a strong password.
                    </Typography>

                    <Grid container spacing={3} maxWidth="md">
                      <Grid item xs={12}>
                        <TextField
                          fullWidth
                          label="Current Password"
                          type="password"
                          value={passwordData.currentPassword}
                          onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                          variant="outlined"
                        />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          fullWidth
                          label="New Password"
                          type="password"
                          value={passwordData.newPassword}
                          onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                          variant="outlined"
                          helperText="Minimum 6 characters"
                        />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          fullWidth
                          label="Confirm New Password"
                          type="password"
                          value={passwordData.confirmPassword}
                          onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                          variant="outlined"
                          error={passwordData.confirmPassword !== '' && passwordData.newPassword !== passwordData.confirmPassword}
                          helperText={passwordData.confirmPassword !== '' && passwordData.newPassword !== passwordData.confirmPassword ? "Passwords don't match" : ""}
                        />
                      </Grid>
                      <Grid item xs={12}>
                        <Button
                          variant="contained"
                          onClick={handleChangePassword}
                          disabled={changingPassword || !passwordData.currentPassword || !passwordData.newPassword}
                          size="large"
                          sx={{ mt: 1 }}
                        >
                          {changingPassword ? 'Updating...' : 'Update Password'}
                        </Button>
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              )}

            </Box>
          </Box>
        </Box>
      </Box>
    </Box >
  );
};

export default Profile;