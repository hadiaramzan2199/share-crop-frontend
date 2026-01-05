import React, { useState } from 'react';
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
} from '@mui/material';
import { ReportProblem, Send, Close } from '@mui/icons-material';
import { complaintService } from '../../services/complaints';

const ComplaintForm = ({ open, onClose, targetType, targetId, targetName, userId, onSuccess }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

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
        category: category || null,
        description: description.trim(),
      };

      const response = await complaintService.createComplaint(complaintData);
      
      setSuccess(true);
      setDescription('');
      setCategory('');
      
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
          <Typography variant={isMobile ? "h6" : "h5"} sx={{ fontWeight: 700 }}>
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
        pb: 2
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

