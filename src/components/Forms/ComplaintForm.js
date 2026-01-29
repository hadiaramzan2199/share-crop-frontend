import React, { useState, useEffect, useCallback } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box,
  Typography,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Alert,
  CircularProgress,
  IconButton,
  useMediaQuery,
  useTheme,
  Autocomplete,
  InputAdornment,
} from '@mui/material';
import { ReportProblem, Send, Close, Search, Person } from '@mui/icons-material';
import { complaintService } from '../../services/complaints';
import { userService } from '../../services/users';

const ComplaintForm = ({ open, onClose, targetType, targetId, targetName, userId, onSuccess }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [complainedAgainstUser, setComplainedAgainstUser] = useState(null);
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [userSearchResults, setUserSearchResults] = useState([]);
  const [searchingUsers, setSearchingUsers] = useState(false);
  const [onlyCurrentUserFound, setOnlyCurrentUserFound] = useState(false);

  const categories = [
    'Service',
    'Quality',
    'Delivery',
    'Payment',
    'Refund',
    'Field',
    'Order',
    'User',
  ];

  // Search for users by name
  const searchUsers = useCallback(async (query) => {
    if (!query || query.trim().length < 2) {
      setUserSearchResults([]);
      return;
    }

    setSearchingUsers(true);
    try {
      const response = await userService.getUserNames(query.trim());
      console.log('User search response:', response);
      console.log('Response type:', typeof response);
      console.log('Response.data:', response?.data);
      
      // Axios returns { data: [...] }, so response.data should be the array
      let users = [];
      if (response && response.data) {
        if (Array.isArray(response.data)) {
          users = response.data;
        } else if (Array.isArray(response.data.data)) {
          users = response.data.data;
        }
      } else if (Array.isArray(response)) {
        users = response;
      }
      
      console.log('Parsed users:', users);
      console.log('Users count:', users.length);
      
      // Filter out current user (only if userId is provided)
      const filteredUsers = userId 
        ? users.filter(u => u && u.id && String(u.id) !== String(userId))
        : users.filter(u => u && u.id);
      
      // Check if the only result was the current user
      const wasOnlyCurrentUser = userId && users.length === 1 && filteredUsers.length === 0;
      setOnlyCurrentUserFound(wasOnlyCurrentUser);
      
      console.log('Filtered users:', filteredUsers);
      console.log('Filtered count:', filteredUsers.length);
      console.log('Current userId:', userId);
      console.log('Only current user found:', wasOnlyCurrentUser);
      
      setUserSearchResults(filteredUsers);
    } catch (err) {
      console.error('Error searching users:', err);
      console.error('Error details:', err.response?.data || err.message);
      setUserSearchResults([]);
    } finally {
      setSearchingUsers(false);
    }
  }, [userId]);

  // Debounced user search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (userSearchQuery) {
        searchUsers(userSearchQuery);
      } else {
        setUserSearchResults([]);
        setOnlyCurrentUserFound(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [userSearchQuery, searchUsers]);

  const handleSubmit = async () => {
    // Validation
    if (!description.trim()) {
      setError('Please provide a description of your complaint');
      return;
    }

    if (description.trim().length < 10) {
      setError('Description must be at least 10 characters long');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const complaintData = {
        created_by: userId,
        target_type: targetType || 'service',
        // Only include target_id if it's provided (for field/order/user complaints)
        // For general complaints (service, quality, refund, etc.), don't send target_id
        ...(targetId && targetId.trim() !== '' ? { target_id: targetId } : {}),
        // Include complained_against_user_id if a user is selected
        ...(complainedAgainstUser?.id ? { complained_against_user_id: complainedAgainstUser.id } : {}),
        category: category || null,
        description: description.trim(),
      };

      const response = await complaintService.createComplaint(complaintData);
      
      setSuccess(true);
      setDescription('');
      setCategory('');
      setComplainedAgainstUser(null);
      setUserSearchQuery('');
      setUserSearchResults([]);
      
      // Call success callback if provided
      if (onSuccess) {
        onSuccess(response.data);
      }

      // Close dialog after 1.5 seconds
      setTimeout(() => {
        handleClose();
      }, 1500);
    } catch (err) {
      setError(
        err.response?.data?.error || 
        err.response?.data?.details || 
        'Failed to submit complaint. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setError('');
      setSuccess(false);
      setDescription('');
      setCategory('');
      setComplainedAgainstUser(null);
      setUserSearchQuery('');
      setUserSearchResults([]);
      onClose();
    }
  };

  return (
    <Dialog 
      open={open} 
      onClose={handleClose} 
      maxWidth="sm" 
      fullWidth
      fullScreen={isMobile}
      PaperProps={{
        sx: {
          borderRadius: isMobile ? 0 : 4,
          boxShadow: isMobile ? 'none' : '0 12px 48px rgba(0,0,0,0.15)',
          margin: isMobile ? 0 : '16px',
          maxHeight: isMobile ? '100vh' : '90vh',
        }
      }}
    >
      <DialogTitle sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        gap: 1,
        background: 'linear-gradient(135deg, #4CAF50 0%, #2E7D32 100%)',
        color: 'white',
        py: isMobile ? 2 : 2.5,
        px: isMobile ? 2 : 3,
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box sx={{ 
            bgcolor: 'rgba(255,255,255,0.2)', 
            borderRadius: '50%', 
            p: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <ReportProblem sx={{ fontSize: isMobile ? 24 : 28 }} />
          </Box>
          <Typography variant={isMobile ? "h6" : "h5"} sx={{ fontWeight: 700, color: 'white' }}>
            Submit a Complaint
          </Typography>
        </Box>
        <IconButton
          onClick={handleClose}
          disabled={loading}
          sx={{
            color: 'white',
            '&:hover': { bgcolor: 'rgba(255,255,255,0.1)' }
          }}
        >
          <Close />
        </IconButton>
      </DialogTitle>
      
      <DialogContent sx={{ 
        pt: isMobile ? 2 : 3,
        px: isMobile ? 2 : 3,
        pb: 2,
        mt: 2
      }}>
        {targetName && (
          <Alert 
            severity="info" 
            sx={{ 
              mb: 2,
              borderRadius: 2,
              bgcolor: 'rgba(33, 150, 243, 0.08)',
              '& .MuiAlert-icon': {
                color: '#1976d2'
              }
            }}
          >
            <Typography variant="body2">
              Complaining about: <strong>{targetName}</strong>
            </Typography>
          </Alert>
        )}

        {error && (
          <Alert 
            severity="error" 
            sx={{ 
              mb: 2,
              borderRadius: 2,
              '& .MuiAlert-action': {
                alignItems: 'flex-start',
                pt: 1
              }
            }} 
            onClose={() => setError('')}
          >
            {error}
          </Alert>
        )}

        {success && (
          <Alert 
            severity="success" 
            sx={{ 
              mb: 2,
              borderRadius: 2,
              bgcolor: 'rgba(76, 175, 80, 0.08)',
              '& .MuiAlert-icon': {
                color: '#2E7D32'
              }
            }}
          >
            Complaint submitted successfully! Our team will review it shortly.
          </Alert>
        )}

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
          {/* User Search - Complain Against User */}
          <Box>
            <Typography variant="body2" sx={{ mb: 1, fontWeight: 500, color: 'text.primary' }}>
              Complain Against User (Optional)
            </Typography>
            <Autocomplete
              options={userSearchResults}
              getOptionLabel={(option) => {
                if (!option || typeof option !== 'object') return '';
                if (option.user_type === 'admin') {
                  return 'Share-Crop Administration';
                }
                return `${option.name || 'Unknown'} (${option.user_type || 'user'})`;
              }}
              isOptionEqualToValue={(option, value) => {
                if (!option || !value) return false;
                return option.id === value.id;
              }}
              value={complainedAgainstUser}
              onChange={(event, newValue) => {
                setComplainedAgainstUser(newValue);
              }}
              onInputChange={(event, newInputValue) => {
                setUserSearchQuery(newInputValue);
              }}
              loading={searchingUsers}
              disabled={loading}
              filterOptions={(x) => x} // Disable default filtering, we do it server-side
              noOptionsText={
                userSearchQuery.length < 2 
                  ? "Type at least 2 characters to search" 
                  : searchingUsers 
                    ? "Searching..." 
                    : onlyCurrentUserFound
                      ? "You cannot complain against yourself"
                      : "No users found"
              }
              renderInput={(params) => {
                const { InputProps, ...restParams } = params;
                return (
                  <TextField
                    {...restParams}
                    placeholder="Search user by name..."
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2,
                        '& fieldset': {
                          borderColor: 'rgba(0, 0, 0, 0.23)',
                        },
                        '&:hover fieldset': {
                          borderColor: '#4CAF50',
                        },
                        '&.Mui-focused fieldset': {
                          borderColor: '#2E7D32',
                          borderWidth: 2,
                        },
                      },
                      '& .MuiInputLabel-root.Mui-focused': {
                        color: '#2E7D32',
                      },
                    }}
                    InputProps={{
                      ...InputProps,
                      startAdornment: (
                        <>
                          <InputAdornment position="start">
                            <Search sx={{ color: 'text.secondary' }} />
                          </InputAdornment>
                          {InputProps.startAdornment}
                        </>
                      ),
                    }}
                  />
                );
              }}
              renderOption={(props, option) => {
                const isAdmin = option.user_type === 'admin';
                const primaryLabel = isAdmin ? 'Share-Crop Administration' : (option.name || 'Unknown');
                const secondaryLabel = isAdmin ? null : (option.user_type || 'user');
                return (
                  <Box component="li" {...props} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Person sx={{ fontSize: 20, color: 'text.secondary' }} />
                    <Box>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {primaryLabel}
                      </Typography>
                      {secondaryLabel && (
                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                          {secondaryLabel}
                        </Typography>
                      )}
                    </Box>
                  </Box>
                );
              }}
              sx={{ width: '100%' }}
            />
            {complainedAgainstUser && (
              <Box sx={{ mt: 1, p: 1.5, bgcolor: 'rgba(33, 150, 243, 0.08)', borderRadius: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                <Person sx={{ fontSize: 18, color: '#1976d2' }} />
                <Typography variant="body2" sx={{ flex: 1 }}>
                  Complaining against: <strong>{complainedAgainstUser.user_type === 'admin' ? 'Share-Crop Administration' : (complainedAgainstUser.name || 'Unknown')}</strong>
                  {complainedAgainstUser.user_type !== 'admin' && ` (${complainedAgainstUser.user_type || 'user'})`}
                </Typography>
                <IconButton
                  size="small"
                  onClick={() => {
                    setComplainedAgainstUser(null);
                    setUserSearchQuery('');
                  }}
                  sx={{ color: 'text.secondary' }}
                >
                  <Close fontSize="small" />
                </IconButton>
              </Box>
            )}
          </Box>

          <FormControl fullWidth>
            <InputLabel 
              sx={{
                '&.Mui-focused': {
                  color: '#2E7D32'
                }
              }}
            >
              Category (Optional)
            </InputLabel>
            <Select
              value={category}
              label="Category (Optional)"
              onChange={(e) => setCategory(e.target.value)}
              disabled={loading}
              sx={{
                borderRadius: 2,
                '& .MuiOutlinedInput-notchedOutline': {
                  borderColor: 'rgba(0, 0, 0, 0.23)',
                },
                '&:hover .MuiOutlinedInput-notchedOutline': {
                  borderColor: '#4CAF50',
                },
                '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                  borderColor: '#2E7D32',
                  borderWidth: 2,
                },
              }}
            >
              <MenuItem value="">
                <em style={{ color: '#999' }}>Select a category</em>
              </MenuItem>
              {categories.map((cat) => (
                <MenuItem key={cat} value={cat}>
                  {cat}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <TextField
            label="Complaint Description"
            placeholder="Please describe your complaint in detail. Include relevant information such as dates, order numbers, or specific issues encountered..."
            multiline
            rows={isMobile ? 5 : 6}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            disabled={loading}
            required
            fullWidth
            helperText={`${description.length} characters (minimum 10 required)`}
            error={description.length > 0 && description.length < 10}
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: 2,
                '& fieldset': {
                  borderColor: 'rgba(0, 0, 0, 0.23)',
                },
                '&:hover fieldset': {
                  borderColor: '#4CAF50',
                },
                '&.Mui-focused fieldset': {
                  borderColor: '#2E7D32',
                  borderWidth: 2,
                },
                '&.Mui-error fieldset': {
                  borderColor: '#d32f2f',
                },
              },
              '& .MuiInputLabel-root.Mui-focused': {
                color: '#2E7D32',
              },
            }}
          />

          <Typography 
            variant="body2" 
            sx={{ 
              color: 'text.secondary',
              fontSize: '0.875rem',
              lineHeight: 1.6,
              mt: -1
            }}
          >
            💡 Please provide as much detail as possible to help us resolve your issue quickly.
          </Typography>
        </Box>
      </DialogContent>
      
      <DialogActions sx={{ 
        px: isMobile ? 2 : 3, 
        pb: isMobile ? 2 : 2.5,
        pt: 2,
        gap: 1.5,
        flexDirection: isMobile ? 'column-reverse' : 'row',
        '& > *': {
          width: isMobile ? '100%' : 'auto',
          m: 0
        }
      }}>
        <Button 
          onClick={handleClose} 
          variant="outlined" 
          disabled={loading}
          sx={{ 
            minWidth: isMobile ? '100%' : 120,
            borderRadius: 2,
            py: 1.5,
            borderColor: 'rgba(0, 0, 0, 0.23)',
            color: 'text.primary',
            '&:hover': {
              borderColor: '#4CAF50',
              bgcolor: 'rgba(76, 175, 80, 0.04)',
            }
          }}
        >
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={loading || !description.trim() || description.trim().length < 10}
          startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <Send />}
          sx={{ 
            minWidth: isMobile ? '100%' : 160,
            borderRadius: 2,
            py: 1.5,
            background: 'linear-gradient(135deg, #4CAF50 0%, #2E7D32 100%)',
            boxShadow: '0 4px 12px rgba(76, 175, 80, 0.3)',
            '&:hover': {
              background: 'linear-gradient(135deg, #2E7D32 0%, #4CAF50 100%)',
              boxShadow: '0 6px 16px rgba(76, 175, 80, 0.4)',
            },
            '&:disabled': {
              background: 'rgba(0, 0, 0, 0.12)',
              color: 'rgba(0, 0, 0, 0.26)',
            }
          }}
        >
          {loading ? 'Submitting...' : 'Submit Complaint'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ComplaintForm;

