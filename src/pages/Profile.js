import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Card,
  CardContent,
  Avatar,
  Button,
  TextField,
  Grid,
  Box,
  Chip,
  IconButton,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Stack,
  Paper,
} from '@mui/material';
import {
  Edit,
  Save,
  Cancel,
  PhotoCamera,
  Email,
  AccountBalance,
  CalendarToday
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { profileService } from '../services/profile';
import { orderService } from '../services/orders';
import { Alert, Snackbar, InputAdornment, LinearProgress, CircularProgress } from '@mui/material';
import { Lock, CloudUpload, Description, Delete as DeleteIcon, OpenInNew } from '@mui/icons-material';
import supabase from '../services/supabase';
import { userDocumentsService } from '../services/userDocuments';

const Profile = () => {
  const { user, updateUser } = useAuth();
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
  });

  const [documents, setDocuments] = useState([]);
  const [docLoading, setDocLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [passwordDialog, setPasswordDialog] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });

  const [editMode, setEditMode] = useState(false);
  const [editedProfile, setEditedProfile] = useState({ ...profile });
  const [saving, setSaving] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);

  useEffect(() => {
    if (user?.id) {
      loadUserDocuments();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps -- run only when user is set
  }, [user]);

  const loadUserDocuments = async () => {
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

  // Load user profile data
  useEffect(() => {
    if (user) {
      loadProfile();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps -- run only when user is set
  }, [user]);

  const loadProfile = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get user profile
      const profileResponse = await profileService.getProfile();
      const userData = profileResponse.data?.user || user;

      // Get user stats based on role
      let stats = {
        totalRentals: 0,
        activeRentals: 0,
        totalSpent: 0,
      };

      try {
        if (userData.user_type === 'buyer') {
          const ordersResponse = await orderService.getBuyerOrders();
          const orders = ordersResponse.data || [];
          stats.totalRentals = orders.length;
          stats.activeRentals = orders.filter(o => ['pending', 'active', 'confirmed'].includes(o.status)).length;
          stats.totalSpent = orders.reduce((sum, o) => sum + (o.total_price || 0), 0);
        } else if (userData.user_type === 'farmer') {
          const ordersResponse = await orderService.getFarmerOrders(userData.id);
          const orders = ordersResponse.data || [];
          stats.totalRentals = orders.length;
          stats.activeRentals = orders.filter(o => ['pending', 'active', 'confirmed'].includes(o.status)).length;
          stats.totalSpent = orders.reduce((sum, o) => sum + (o.total_price || 0), 0);
        }
      } catch (statsErr) {
        console.warn('Could not load user stats:', statsErr);
      }

      setProfile({
        name: userData.name || '',
        email: userData.email || '',
        phone: '', // Not in current schema
        location: '', // Not in current schema
        joinDate: userData.created_at || '',
        bio: '', // Not in current schema
        avatar: null,
        user_type: userData.user_type || '',
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
      });
    } catch (err) {
      console.error('Error loading profile:', err);
      setError('Failed to load profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = () => {
    setEditedProfile({ ...profile });
    setEditMode(true);
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);

      // Only update name and email (phone, location, bio not in schema yet)
      const updateData = {
        name: editedProfile.name,
        email: editedProfile.email,
      };

      const response = await profileService.updateProfile(updateData);
      const updatedUser = response.data?.user;

      if (updatedUser) {
        // Update AuthContext
        updateUser(updatedUser);

        // Update local profile
        setProfile({
          ...profile,
          name: updatedUser.name,
          email: updatedUser.email,
        });

        setEditMode(false);
        setSuccess('Profile updated successfully!');
      }
    } catch (err) {
      console.error('Error updating profile:', err);
      setError(err.response?.data?.error || 'Failed to update profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setEditedProfile({ ...profile });
    setEditMode(false);
    setError(null);
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

      setPasswordDialog(false);
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
      setSuccess('Password changed successfully!');
    } catch (err) {
      console.error('Error changing password:', err);
      setError(err.response?.data?.error || 'Failed to change password. Please try again.');
    } finally {
      setChangingPassword(false);
    }
  };

  const handleInputChange = (field, value) => {
    setEditedProfile({ ...editedProfile, [field]: value });
  };

  const handleAvatarChange = async (event) => {
    const file = event.target.files[0];
    if (!file || !user) return;

    try {
      setUploading(true);
      setError(null);

      const fileExt = file.name.split('.').pop();
      const filePath = `profile-images/${user.id}-profile.${fileExt}`;

      // 1. Upload to Supabase
      const { error: uploadError } = await supabase.storage
        .from('user-documents')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      // 2. Get Public URL
      const { data: { publicUrl } } = supabase.storage
        .from('user-documents')
        .getPublicUrl(filePath);

      // 3. Save to backend
      await profileService.updateProfileImage(user.id, publicUrl);

      // 4. Update local state
      setProfile(prev => ({ ...prev, profile_image_url: publicUrl }));
      setEditedProfile(prev => ({ ...prev, profile_image_url: publicUrl }));

      // Update user in context
      updateUser({ ...user, profile_image_url: publicUrl });

      setSuccess('Profile picture updated successfully!');
    } catch (err) {
      console.error('Error uploading avatar:', err);
      setError('Failed to upload profile picture. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleDocumentUpload = async (event) => {
    const file = event.target.files[0];
    if (!file || !user) return;

    try {
      setUploading(true);
      setError(null);

      const fileName = file.name;
      const fileExt = fileName.split('.').pop();
      const safeName = fileName.replace(/[^a-z0-9]/gi, '_').toLowerCase();
      const filePath = `documents/${user.id}-${Date.now()}-${safeName}`;

      // 1. Upload to Supabase
      const { error: uploadError } = await supabase.storage
        .from('user-documents')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // 2. Get Public URL
      const { data: { publicUrl } } = supabase.storage
        .from('user-documents')
        .getPublicUrl(filePath);

      // 3. Save to backend database
      await userDocumentsService.addDocument({
        user_id: user.id,
        file_name: fileName,
        file_url: publicUrl,
        file_type: fileExt
      });

      // 4. Refresh documents list
      loadUserDocuments();
      setSuccess('Document uploaded successfully!');
    } catch (err) {
      console.error('Error uploading document:', err);
      setError('Failed to upload document. Please try again.');
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
      console.error('Error deleting document:', err);
      setError('Failed to delete document.');
    } finally {
      setDocLoading(false);
    }
  };

  const profileStats = [
    { label: 'Total Rentals', value: profile.totalRentals, icon: <AccountBalance /> },
    { label: 'Active Rentals', value: profile.activeRentals, icon: <CalendarToday /> },
    { label: 'Total Spent', value: `USD ${profile.totalSpent.toLocaleString()}`, icon: <AccountBalance /> },
  ];

  return (
    <Container maxWidth="md" sx={{ py: 4, px: 3, minHeight: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      {/* Header */}
      <Box sx={{ mb: 3, textAlign: 'center' }}>
        <Typography variant="h4" component="h1" sx={{ fontWeight: 600, mb: 0.5, color: 'text.primary' }}>
          Profile Settings
        </Typography>
        <Typography variant="body2" sx={{ color: 'text.primary', opacity: 0.8 }}>
          Manage your account information and preferences
        </Typography>
      </Box>

      {/* Main Profile Card */}
      <Card sx={{
        width: '100%',
        maxWidth: 800,
        borderRadius: 2,
        mb: 3
      }}>
        {/* Profile Header */}
        <Box sx={{
          background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
          p: 3,
          borderRadius: '8px 8px 0 0',
          position: 'relative',
          overflow: 'hidden'
        }}>
          <Box sx={{
            position: 'absolute',
            top: 0,
            right: 0,
            width: 200,
            height: 200,
            background: 'rgba(255,255,255,0.1)',
            borderRadius: '50%',
            transform: 'translate(50%, -50%)'
          }} />

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, position: 'relative', zIndex: 1 }}>
            <Box sx={{ position: 'relative' }}>
              <Avatar
                src={profile.profile_image_url}
                sx={{
                  width: 80,
                  height: 80,
                  border: '3px solid rgba(255,255,255,0.2)',
                  fontSize: '1.5rem',
                  fontWeight: 600,
                  bgcolor: 'primary.light'
                }}
              >
                {!profile.profile_image_url && profile.name.charAt(0)}
              </Avatar>
              {uploading && (
                <CircularProgress
                  size={86}
                  sx={{
                    position: 'absolute',
                    top: -3,
                    left: -3,
                    zIndex: 1,
                    color: 'white'
                  }}
                />
              )}
              {editMode && (
                <IconButton
                  sx={{
                    position: 'absolute',
                    bottom: -5,
                    right: -5,
                    backgroundColor: 'white',
                    color: 'primary.main',
                    '&:hover': { backgroundColor: 'grey.100' },
                    boxShadow: 2
                  }}
                  component="label"
                >
                  <PhotoCamera fontSize="small" />
                  <input
                    type="file"
                    hidden
                    accept="image/*"
                    onChange={handleAvatarChange}
                  />
                </IconButton>
              )}
            </Box>

            <Box sx={{ flex: 1, color: 'white' }}>
              <Typography variant="h5" sx={{ fontWeight: 600, mb: 0.5 }}>
                {profile.name}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                <Chip
                  label={profile.user_type ? profile.user_type.charAt(0).toUpperCase() + profile.user_type.slice(1) : 'User'}
                  size="small"
                  sx={{
                    backgroundColor: 'rgba(255,255,255,0.2)',
                    color: 'white',
                    fontWeight: 500
                  }}
                />
                {profile.email_verified && (
                  <Chip
                    label="Verified"
                    size="small"
                    sx={{
                      backgroundColor: 'rgba(255,255,255,0.2)',
                      color: 'white',
                      fontWeight: 500
                    }}
                  />
                )}
                {profile.joinDate && (
                  <Typography variant="body2" sx={{ opacity: 1, color: 'white' }}>
                    Member since {new Date(profile.joinDate).toLocaleDateString()}
                  </Typography>
                )}
              </Box>
              <Typography variant="body2" sx={{ opacity: 0.9, color: 'white', mt: 1 }}>
                {profile.coins} Coins
              </Typography>
            </Box>

            <Box sx={{ alignSelf: 'flex-start', display: 'flex', gap: 1 }}>
              {!editMode ? (
                <>
                  <Button
                    startIcon={<Edit />}
                    onClick={handleEdit}
                    variant="contained"
                    sx={{
                      backgroundColor: 'rgba(255,255,255,0.2)',
                      color: 'white',
                      '&:hover': { backgroundColor: 'rgba(255,255,255,0.3)' },
                      backdropFilter: 'blur(10px)',
                      border: '1px solid rgba(255,255,255,0.2)'
                    }}
                  >
                    Edit Profile
                  </Button>
                  <Button
                    startIcon={<Lock />}
                    onClick={() => setPasswordDialog(true)}
                    variant="outlined"
                    sx={{
                      color: 'white',
                      borderColor: 'rgba(255,255,255,0.5)',
                      '&:hover': { borderColor: 'white', backgroundColor: 'rgba(255,255,255,0.1)' }
                    }}
                  >
                    Change Password
                  </Button>
                </>
              ) : (
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button
                    startIcon={<Save />}
                    onClick={handleSave}
                    disabled={saving}
                    variant="contained"
                    sx={{
                      backgroundColor: 'white',
                      color: 'primary.main',
                      '&:hover': { backgroundColor: 'grey.100' }
                    }}
                  >
                    {saving ? 'Saving...' : 'Save'}
                  </Button>
                  <Button
                    startIcon={<Cancel />}
                    onClick={handleCancel}
                    disabled={saving}
                    sx={{
                      color: 'white',
                      borderColor: 'rgba(255,255,255,0.5)',
                      '&:hover': { borderColor: 'white', backgroundColor: 'rgba(255,255,255,0.1)' }
                    }}
                    variant="outlined"
                  >
                    Cancel
                  </Button>
                </Box>
              )}
            </Box>
          </Box>
        </Box>

        <CardContent sx={{ p: 3 }}>
          {/* Stats Section */}
          <Box sx={{ mb: 4 }}>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, fontSize: '1.125rem' }}>
              Account Overview
            </Typography>
            <Grid container spacing={2}>
              {profileStats.map((stat, index) => (
                <Grid item xs={12} sm={4} key={index}>
                  <Paper sx={{
                    p: 2,
                    borderRadius: 2,
                    textAlign: 'center',
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                    }
                  }}>
                    <Stack direction="row" alignItems="center" spacing={2}>
                      <Avatar sx={{
                        backgroundColor: index === 0 ? '#3b82f6' : index === 1 ? '#10b981' : '#f59e0b',
                        width: 48,
                        height: 48
                      }}>
                        {stat.icon}
                      </Avatar>
                      <Box sx={{ textAlign: 'left' }}>
                        <Typography variant="h6" sx={{ fontWeight: 600, fontSize: '1.25rem' }}>
                          {stat.value}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.875rem' }}>
                          {stat.label}
                        </Typography>
                      </Box>
                    </Stack>
                  </Paper>
                </Grid>
              ))}
            </Grid>
          </Box>

          <Divider sx={{ my: 4 }} />

          {/* Profile Information Form */}
          <Box>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, fontSize: '1.125rem' }}>
              Personal Information
            </Typography>

            <Grid container spacing={3}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Full Name"
                  value={editMode ? editedProfile.name : profile.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  disabled={!editMode}
                  variant="outlined"
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2,
                      backgroundColor: editMode ? 'white' : 'grey.50',
                      fontSize: '0.875rem'
                    }
                  }}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Email"
                  value={editMode ? editedProfile.email : profile.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  disabled={!editMode}
                  type="email"
                  variant="outlined"
                  InputProps={{
                    startAdornment: (
                      <Box sx={{ mr: 1, display: 'flex', color: 'text.secondary' }}>
                        <Email />
                      </Box>
                    )
                  }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2,
                      backgroundColor: editMode ? 'white' : 'grey.50',
                      fontSize: '0.875rem'
                    }
                  }}
                />
              </Grid>

              {/* Phone, Location, and Bio fields removed - not in current database schema */}
              {/* These can be added later when the schema is extended */}
            </Grid>
          </Box>


        </CardContent>
      </Card>
    </Container>
  );
};

export default Profile;