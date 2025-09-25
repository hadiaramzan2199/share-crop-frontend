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
  Paper
} from '@mui/material';
import {
  Edit,
  Save,
  Cancel,
  PhotoCamera,
  Email,
  Phone,
  LocationOn,
  Person,
  Security,
  Notifications,
  AccountBalance,
  CalendarToday
} from '@mui/icons-material';
import { authService } from '../services/auth';
import { USER_ROLES } from '../utils/roles';
import { useRole } from '../contexts/RoleContext';

const Profile = () => {
  const { userRole } = useRole();
  // Mock user data since we're using authService
  const [profile, setProfile] = useState({
    name: 'John Doe',
    email: 'john.doe@example.com',
    phone: '+92 300 1234567',
    location: 'Lahore, Punjab, Pakistan',
    joinDate: '2023-06-15',
    bio: 'Agricultural enthusiast and sustainable farming advocate.',
    avatar: null,
    totalRentals: 12,
    activeRentals: 3,
    totalSpent: 45000,
    preferredCrops: ['Wheat', 'Rice', 'Corn'],
    verificationStatus: 'Verified'
  });
  
  const [editMode, setEditMode] = useState(false);
  const [editedProfile, setEditedProfile] = useState({ ...profile });
  const [avatarDialog, setAvatarDialog] = useState(false);

  const handleEdit = () => {
    setEditedProfile({ ...profile });
    setEditMode(true);
  };

  const handleSave = () => {
    setProfile({ ...editedProfile });
    setEditMode(false);
    // Here you would save to backend
    console.log('Profile updated:', editedProfile);
  };

  const handleCancel = () => {
    setEditedProfile({ ...profile });
    setEditMode(false);
  };

  const handleInputChange = (field, value) => {
    setEditedProfile({ ...editedProfile, [field]: value });
  };

  const handleAvatarChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setEditedProfile({ ...editedProfile, avatar: e.target.result });
      };
      reader.readAsDataURL(file);
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
                src={editedProfile.avatar || profile.avatar}
                sx={{ 
                  width: 80, 
                  height: 80, 
                  border: '3px solid rgba(255,255,255,0.2)',
                  fontSize: '1.5rem',
                  fontWeight: 600
                }}
              >
                {profile.name.charAt(0)}
              </Avatar>
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
                  label={userRole}
                  size="small"
                  sx={{ 
                    backgroundColor: 'rgba(255,255,255,0.2)',
                    color: 'white',
                    fontWeight: 500
                  }}
                />
                <Typography variant="body2" sx={{ opacity: 1, color: 'white' }}>
                Member since {new Date(profile.joinDate).toLocaleDateString()}
              </Typography>
              </Box>
              <Typography variant="body1" sx={{ opacity: 1, color: 'white', maxWidth: 400 }}>
              {profile.bio}
            </Typography>
            </Box>
            
            <Box sx={{ alignSelf: 'flex-start' }}>
              {!editMode ? (
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
              ) : (
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button 
                    startIcon={<Save />} 
                    onClick={handleSave} 
                    variant="contained"
                    sx={{
                      backgroundColor: 'white',
                      color: 'primary.main',
                      '&:hover': { backgroundColor: 'grey.100' }
                    }}
                  >
                    Save
                  </Button>
                  <Button 
                    startIcon={<Cancel />} 
                    onClick={handleCancel}
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
              
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Phone Number"
                  value={editMode ? editedProfile.phone : profile.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  disabled={!editMode}
                  variant="outlined"
                  InputProps={{
                    startAdornment: (
                      <Box sx={{ mr: 1, display: 'flex', color: 'text.secondary' }}>
                        <Phone />
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
              
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Location"
                  value={editMode ? editedProfile.location : profile.location}
                  onChange={(e) => handleInputChange('location', e.target.value)}
                  disabled={!editMode}
                  variant="outlined"
                  InputProps={{
                    startAdornment: (
                      <Box sx={{ mr: 1, display: 'flex', color: 'text.secondary' }}>
                        <LocationOn />
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
              
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={4}
                  label="Bio"
                  value={editMode ? editedProfile.bio : profile.bio}
                  onChange={(e) => handleInputChange('bio', e.target.value)}
                  disabled={!editMode}
                  placeholder="Tell us about yourself..."
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
            </Grid>
          </Box>
        </CardContent>
      </Card>
     </Container>
   );
 };

export default Profile;