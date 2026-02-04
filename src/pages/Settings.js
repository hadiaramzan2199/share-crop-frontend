import React, { useState } from 'react';
import {
  Box,
  Typography,
  Grid,
  Switch,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemSecondaryAction,
  TextField,
  Select,
  MenuItem,
  FormControl,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Avatar,
  Stack,
  Paper,
  Tooltip,
} from '@mui/material';
import {
  Notifications,
  Palette,
  LocationOn,
  Delete,
  CloudSync,
  VpnKey,
  Email,
  Sms,
  DarkMode,
  LightMode,
  Save,
  Person,
  Shield,
  Tune,
  ShoppingCart,
  TrendingUp,
} from '@mui/icons-material';
import { authService } from '../services/auth';

const Settings = () => {
  // Mock user data since we're using authService
  const user = { name: 'John Doe', email: 'john@example.com' };
  const [settings, setSettings] = useState({
    notifications: {
      email: true,
      sms: false,
      push: true,
      marketing: false,
      orderUpdates: true,
      priceAlerts: true,
    },
    privacy: {
      profileVisibility: 'public',
      showLocation: true,
      showContactInfo: false,
      dataSharing: false,
    },
    preferences: {
      language: 'en',
      theme: 'light',
      currency: 'PKR',
      timezone: 'Asia/Karachi',
      measurementUnit: 'metric',
    },
    security: {
      twoFactorAuth: false,
      loginAlerts: true,
      sessionTimeout: 30,
    }
  });

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [changePasswordOpen, setChangePasswordOpen] = useState(false);
  const [exportDataOpen, setExportDataOpen] = useState(false);
  const [success, setSuccess] = useState('');
  const [editingField, setEditingField] = useState(null);
  const [tempValue, setTempValue] = useState('');

  const languages = [
    { code: 'en', name: 'English', flag: '🇺🇸' },
    { code: 'ur', name: 'اردو', flag: '🇵🇰' },
    { code: 'es', name: 'Español', flag: '🇪🇸' },
    { code: 'fr', name: 'Français', flag: '🇫🇷' },
    { code: 'ar', name: 'العربية', flag: '🇸🇦' },
  ];

  const themes = [
    { value: 'light', name: 'Light', icon: <LightMode /> },
    { value: 'dark', name: 'Dark', icon: <DarkMode /> },
    { value: 'auto', name: 'Auto', icon: <Palette /> },
  ];

  const handleSettingChange = (category, setting, value) => {
    setSettings(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [setting]: value
      }
    }));

    setSuccess(`${setting} updated successfully`);
    setTimeout(() => setSuccess(''), 3000);
  };

  const handleSave = () => {
    // Simulate API call
    setSuccess('Settings saved successfully!');
    setTimeout(() => setSuccess(''), 3000);
  };

  const handleEdit = (field, currentValue) => {
    setEditingField(field);
    setTempValue(currentValue);
  };

  const handleSaveField = (category, field) => {
    handleSettingChange(category, field, tempValue);
    setEditingField(null);
    setTempValue('');
  };

  const handleCancelEdit = () => {
    setEditingField(null);
    setTempValue('');
  };

  const handleDeleteAccount = () => {
    // Simulate account deletion
    setDeleteDialogOpen(false);
  };

  const handleExportData = () => {
    // Simulate data export
    const data = {
      user: user,
      settings: settings,
      exportDate: new Date().toISOString()
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${user?.name || 'user'}_data_export.json`;
    a.click();

    setExportDataOpen(false);
    setSuccess('Data exported successfully!');
    setTimeout(() => setSuccess(''), 3000);
  };

  return (
    <Box sx={{
      minHeight: '100vh',
      backgroundColor: '#f8fafc',
      p: 2
    }}>
      {/* Header Section */}
      <Box sx={{
        maxWidth: '1400px',
        mx: 'auto',
        mb: 4
      }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2.5 }}>
          <Box>
            <Typography
              variant="h5"
              sx={{
                fontWeight: 700,
                color: '#1e293b',
                mb: 0.5,
                fontSize: '1.75rem'
              }}
            >
              Settings & Preferences
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.9rem' }}>
              Customize your experience and manage your account settings
            </Typography>
          </Box>
          <Tooltip title="Save all changes">
            <Button
              variant="contained"
              startIcon={<Save />}
              onClick={handleSave}
              sx={{
                backgroundColor: '#4caf50',
                '&:hover': { backgroundColor: '#a1eda4' },
                borderRadius: 2,
                px: 2.5,
                py: 1
              }}
            >
              Save Changes
            </Button>
          </Tooltip>
        </Stack>

        {/* Success Alert */}
        {success && (
          <Alert
            severity="success"
            sx={{
              mb: 3,
              borderRadius: 2,
              border: '1px solid #e2e8f0',
              backgroundColor: 'white'
            }}
          >
            {success}
          </Alert>
        )}

        {/* Main Content */}
        <Grid container spacing={3} sx={{ alignItems: 'stretch' }}>
          {/* First Row - Notifications and Privacy */}
          {/* Notification Settings */}
          <Grid item xs={12} lg={6} sx={{ display: 'flex' }}>
            <Paper
              elevation={0}
              sx={{
                p: 3,
                border: '1px solid #e2e8f0',
                borderRadius: 2,
                backgroundColor: 'white',
                transition: 'all 0.2s ease-in-out',
                width: '100%',
                display: 'flex',
                flexDirection: 'column',
                '&:hover': {
                  transform: 'translateY(-1px)',
                  boxShadow: '0 6px 20px rgba(0,0,0,0.08)'
                }
              }}
            >
              <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 3 }}>
                <Avatar
                  sx={{
                    backgroundColor: '#dbeafe',
                    color: '#1d4ed8',
                    width: 40,
                    height: 40
                  }}
                >
                  <Notifications sx={{ fontSize: 20 }} />
                </Avatar>
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 600, color: '#1e293b' }}>
                    Notifications
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Manage your notification preferences
                  </Typography>
                </Box>
              </Stack>

              <List sx={{ p: 0 }}>
                <ListItem sx={{ px: 0, py: 1.5, pr: 8 }}>
                  <ListItemIcon>
                    <Email color="primary" />
                  </ListItemIcon>
                  <ListItemText
                    primary="Email Notifications"
                    secondary="Receive updates via email"
                  />
                  <ListItemSecondaryAction>
                    <Switch
                      checked={settings.notifications.email}
                      onChange={(e) => handleSettingChange('notifications', 'email', e.target.checked)}
                      color="primary"
                    />
                  </ListItemSecondaryAction>
                </ListItem>

                <ListItem sx={{ px: 0, py: 1.5, pr: 8 }}>
                  <ListItemIcon>
                    <Sms color="primary" />
                  </ListItemIcon>
                  <ListItemText
                    primary="SMS Notifications"
                    secondary="Receive updates via SMS"
                  />
                  <ListItemSecondaryAction>
                    <Switch
                      checked={settings.notifications.sms}
                      onChange={(e) => handleSettingChange('notifications', 'sms', e.target.checked)}
                      color="primary"
                    />
                  </ListItemSecondaryAction>
                </ListItem>

                <ListItem sx={{ px: 0, py: 1.5, pr: 8 }}>
                  <ListItemIcon>
                    <ShoppingCart color="primary" />
                  </ListItemIcon>
                  <ListItemText
                    primary="Order Updates"
                    secondary="Get notified about order status changes"
                  />
                  <ListItemSecondaryAction>
                    <Switch
                      checked={settings.notifications.orderUpdates}
                      onChange={(e) => handleSettingChange('notifications', 'orderUpdates', e.target.checked)}
                      color="primary"
                    />
                  </ListItemSecondaryAction>
                </ListItem>

                <ListItem sx={{ px: 0, py: 1.5, pr: 8 }}>
                  <ListItemIcon>
                    <TrendingUp color="primary" />
                  </ListItemIcon>
                  <ListItemText
                    primary="Price Alerts"
                    secondary="Notify when prices change significantly"
                  />
                  <ListItemSecondaryAction>
                    <Switch
                      checked={settings.notifications.priceAlerts}
                      onChange={(e) => handleSettingChange('notifications', 'priceAlerts', e.target.checked)}
                      color="primary"
                    />
                  </ListItemSecondaryAction>
                </ListItem>
              </List>
            </Paper>
          </Grid>

          {/* Privacy Settings */}
          <Grid item xs={12} lg={6} sx={{ display: 'flex' }}>
            <Paper
              elevation={0}
              sx={{
                p: 3,
                border: '1px solid #e2e8f0',
                borderRadius: 2,
                backgroundColor: 'white',
                transition: 'all 0.2s ease-in-out',
                width: '100%',
                display: 'flex',
                flexDirection: 'column',
                '&:hover': {
                  transform: 'translateY(-1px)',
                  boxShadow: '0 6px 20px rgba(0,0,0,0.08)'
                }
              }}
            >
              <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 3 }}>
                <Avatar
                  sx={{
                    backgroundColor: '#fef3c7',
                    color: '#d97706',
                    width: 40,
                    height: 40
                  }}
                >
                  <Shield sx={{ fontSize: 20 }} />
                </Avatar>
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 600, color: '#1e293b' }}>
                    Privacy & Security
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Control your privacy and security settings
                  </Typography>
                </Box>
              </Stack>

              <List sx={{ p: 0 }}>
                <ListItem sx={{ px: 0, py: 1.5, pr: 12 }}>
                  <ListItemIcon>
                    <Person color="primary" />
                  </ListItemIcon>
                  <ListItemText
                    primary="Profile Visibility"
                    secondary="Control who can see your profile"
                  />

                </ListItem>

                <ListItem sx={{ px: 0, py: 1.5, pr: 8 }}>
                  <ListItemIcon>
                    <LocationOn color="primary" />
                  </ListItemIcon>
                  <ListItemText
                    primary="Show Location"
                    secondary="Display your location to others"
                  />
                  <ListItemSecondaryAction>
                    <Switch
                      checked={settings.privacy.showLocation}
                      onChange={(e) => handleSettingChange('privacy', 'showLocation', e.target.checked)}
                      color="primary"
                    />
                  </ListItemSecondaryAction>
                </ListItem>

                <ListItem sx={{ px: 0, py: 1.5, pr: 8 }}>
                  <ListItemIcon>
                    <VpnKey color="primary" />
                  </ListItemIcon>
                  <ListItemText
                    primary="Two-Factor Authentication"
                    secondary="Add extra security to your account"
                  />
                  <ListItemSecondaryAction>
                    <Switch
                      checked={settings.security.twoFactorAuth}
                      onChange={(e) => handleSettingChange('security', 'twoFactorAuth', e.target.checked)}
                      color="primary"
                    />
                  </ListItemSecondaryAction>
                </ListItem>

                <ListItem sx={{ px: 0, py: 1.5, pr: 8 }}>
                  <ListItemIcon>
                    <CloudSync color="primary" />
                  </ListItemIcon>
                  <ListItemText
                    primary="Data Sharing"
                    secondary="Allow data sharing for analytics"
                  />
                  <ListItemSecondaryAction>
                    <Switch
                      checked={settings.privacy.dataSharing}
                      onChange={(e) => handleSettingChange('privacy', 'dataSharing', e.target.checked)}
                      color="primary"
                    />
                  </ListItemSecondaryAction>
                </ListItem>
              </List>
            </Paper>
          </Grid>

          {/* Second Row - Preferences and Account Management */}
          {/* Preferences */}
          <Grid item xs={12} lg={6} sx={{ display: 'flex' }}>
            <Paper
              elevation={0}
              sx={{
                p: 3,
                border: '1px solid #e2e8f0',
                borderRadius: 2,
                backgroundColor: 'white',
                transition: 'all 0.2s ease-in-out',
                width: '100%',
                display: 'flex',
                flexDirection: 'column',
                '&:hover': {
                  transform: 'translateY(-1px)',
                  boxShadow: '0 6px 20px rgba(0,0,0,0.08)'
                }
              }}
            >
              <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 3 }}>
                <Avatar
                  sx={{
                    backgroundColor: '#e0e7ff',
                    color: '#6366f1',
                    width: 40,
                    height: 40
                  }}
                >
                  <Tune sx={{ fontSize: 20 }} />
                </Avatar>
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 600, color: '#1e293b' }}>
                    Preferences
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Customize your app experience
                  </Typography>
                </Box>
              </Stack>

              <Stack spacing={3}>
                <Box>
                  <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
                    Language
                  </Typography>
                  <FormControl fullWidth size="small">
                    <Select
                      value={settings.preferences.language}
                      onChange={(e) => handleSettingChange('preferences', 'language', e.target.value)}
                    >
                      {languages.map((lang) => (
                        <MenuItem key={lang.code} value={lang.code}>
                          <Stack direction="row" alignItems="center" spacing={1}>
                            <span>{lang.flag}</span>
                            <span>{lang.name}</span>
                          </Stack>
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Box>

                <Box>
                  <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
                    Theme
                  </Typography>
                  <FormControl fullWidth size="small">
                    <Select
                      value={settings.preferences.theme}
                      onChange={(e) => handleSettingChange('preferences', 'theme', e.target.value)}
                    >
                      {themes.map((theme) => (
                        <MenuItem key={theme.value} value={theme.value}>
                          <Stack direction="row" alignItems="center" spacing={1}>
                            {theme.icon}
                            <span>{theme.name}</span>
                          </Stack>
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Box>

                <Box>
                  <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
                    Currency
                  </Typography>
                  <FormControl fullWidth size="small">
                    <Select
                      value={settings.preferences.currency}
                      onChange={(e) => handleSettingChange('preferences', 'currency', e.target.value)}
                    >
                      <MenuItem value="PKR">PKR - Pakistani Rupee</MenuItem>
                      <MenuItem value="USD">USD - US Dollar</MenuItem>
                      <MenuItem value="EUR">EUR - Euro</MenuItem>
                      <MenuItem value="GBP">GBP - British Pound</MenuItem>
                    </Select>
                  </FormControl>
                </Box>

                <Box>
                  <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
                    Timezone
                  </Typography>
                  <FormControl fullWidth size="small">
                    <Select
                      value={settings.preferences.timezone}
                      onChange={(e) => handleSettingChange('preferences', 'timezone', e.target.value)}
                    >
                      <MenuItem value="Asia/Karachi">Asia/Karachi (PKT)</MenuItem>
                      <MenuItem value="America/New_York">America/New_York (EST)</MenuItem>
                      <MenuItem value="Europe/London">Europe/London (GMT)</MenuItem>
                      <MenuItem value="Asia/Dubai">Asia/Dubai (GST)</MenuItem>
                    </Select>
                  </FormControl>
                </Box>
              </Stack>
            </Paper>
          </Grid>


        </Grid>
      </Box>

      {/* Dialogs */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Delete Account</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete your account? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleDeleteAccount} color="error" variant="contained">
            Delete Account
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={changePasswordOpen} onClose={() => setChangePasswordOpen(false)}>
        <DialogTitle>Change Password</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label="Current Password"
              type="password"
              fullWidth
              size="small"
            />
            <TextField
              label="New Password"
              type="password"
              fullWidth
              size="small"
            />
            <TextField
              label="Confirm New Password"
              type="password"
              fullWidth
              size="small"
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setChangePasswordOpen(false)}>Cancel</Button>
          <Button variant="contained" color="primary">
            Update Password
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={exportDataOpen} onClose={() => setExportDataOpen(false)}>
        <DialogTitle>Export Data</DialogTitle>
        <DialogContent>
          <Typography>
            This will download all your account data in JSON format. The file will include your profile information, settings, and activity history.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setExportDataOpen(false)}>Cancel</Button>
          <Button onClick={handleExportData} variant="contained" color="primary">
            Download Data
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Settings;