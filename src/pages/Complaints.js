import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  CircularProgress,
  Stack,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import { ReportProblem, Add, Visibility, Refresh, Close } from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { complaintService } from '../services/complaints';
import ComplaintForm from '../components/Forms/ComplaintForm';

const Complaints = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { user } = useAuth();
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [complaintFormOpen, setComplaintFormOpen] = useState(false);
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    if (user?.id) {
      loadComplaints();
    }
  }, [user, statusFilter, loadComplaints]);

  const loadComplaints = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const params = statusFilter !== 'all' ? { status: statusFilter } : {};
      const response = await complaintService.getComplaints({ ...params, user_id: user.id });
      setComplaints(response.data || []);
    } catch (err) {
      console.error('Error loading complaints:', err);
      setError('Failed to load complaints. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [statusFilter, user?.id]);

  const handleComplaintSuccess = () => {
    loadComplaints();
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'open':
        return 'error';
      case 'in_review':
        return 'warning';
      case 'resolved':
        return 'success';
      default:
        return 'default';
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateString;
    }
  };

  const handleViewComplaint = (complaint) => {
    setSelectedComplaint(complaint);
    setViewDialogOpen(true);
  };

  if (!user) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="warning">Please log in to view your complaints.</Alert>
      </Box>
    );
  }

  return (
    <Box sx={{
      p: isMobile ? 2 : 3,
      maxWidth: '1200px',
      mx: 'auto',
      minHeight: '100vh',
      bgcolor: '#F0F2F5'
    }}>
      {/* Header Section */}
      <Box sx={{
        mb: 3,
        display: 'flex',
        flexDirection: isMobile ? 'column' : 'row',
        justifyContent: 'space-between',
        alignItems: isMobile ? 'flex-start' : 'center',
        gap: 2
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Box sx={{
            bgcolor: 'rgba(76, 175, 80, 0.1)',
            borderRadius: 2,
            p: 1.5,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <ReportProblem sx={{ fontSize: isMobile ? 32 : 40, color: '#4CAF50' }} />
          </Box>
          <Typography
            variant={isMobile ? "h5" : "h4"}
            sx={{
              fontWeight: 700,
              color: 'text.primary',
              background: 'linear-gradient(135deg, #2E7D32 0%, #4CAF50 100%)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            My Complaints
          </Typography>
        </Box>
        <Stack
          direction={isMobile ? 'column' : 'row'}
          spacing={isMobile ? 1.5 : 2}
          sx={{ width: isMobile ? '100%' : 'auto' }}
        >
          <FormControl
            size="small"
            sx={{
              minWidth: isMobile ? '100%' : 150,
              '& .MuiOutlinedInput-root': {
                borderRadius: 2,
              }
            }}
          >
            <InputLabel>Status</InputLabel>
            <Select
              value={statusFilter}
              label="Status"
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <MenuItem value="all">All</MenuItem>
              <MenuItem value="open">Open</MenuItem>
              <MenuItem value="in_review">In Review</MenuItem>
              <MenuItem value="resolved">Resolved</MenuItem>
            </Select>
          </FormControl>
          <Button
            variant="outlined"
            startIcon={<Refresh />}
            onClick={loadComplaints}
            disabled={loading}
            sx={{
              borderRadius: 2,
              width: isMobile ? '100%' : 'auto',
            }}
          >
            Refresh
          </Button>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => setComplaintFormOpen(true)}
            sx={{
              borderRadius: 2,
              width: isMobile ? '100%' : 'auto',
              background: 'linear-gradient(135deg, #4CAF50 0%, #2E7D32 100%)',
              boxShadow: '0 4px 12px rgba(76, 175, 80, 0.3)',
              '&:hover': {
                background: 'linear-gradient(135deg, #2E7D32 0%, #4CAF50 100%)',
                boxShadow: '0 6px 16px rgba(76, 175, 80, 0.4)',
              },
            }}
          >
            New Complaint
          </Button>
        </Stack>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      <Card sx={{
        borderRadius: 3,
        boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
        border: '1px solid',
        borderColor: 'divider'
      }}>
        <CardContent sx={{ p: isMobile ? 2 : 3 }}>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
              <CircularProgress sx={{ color: '#4CAF50' }} />
            </Box>
          ) : complaints.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 6 }}>
              <Box sx={{
                bgcolor: 'rgba(76, 175, 80, 0.1)',
                borderRadius: '50%',
                width: 80,
                height: 80,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mx: 'auto',
                mb: 2
              }}>
                <ReportProblem sx={{ fontSize: 48, color: '#4CAF50' }} />
              </Box>
              <Typography variant="h6" color="text.primary" gutterBottom sx={{ fontWeight: 600 }}>
                No complaints found
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                {statusFilter !== 'all'
                  ? `No ${statusFilter} complaints.`
                  : "You haven't submitted any complaints yet."}
              </Typography>
              <Button
                variant="contained"
                startIcon={<Add />}
                onClick={() => setComplaintFormOpen(true)}
                sx={{
                  borderRadius: 2,
                  background: 'linear-gradient(135deg, #4CAF50 0%, #2E7D32 100%)',
                  boxShadow: '0 4px 12px rgba(76, 175, 80, 0.3)',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #2E7D32 0%, #4CAF50 100%)',
                    boxShadow: '0 6px 16px rgba(76, 175, 80, 0.4)',
                  },
                }}
              >
                Submit Your First Complaint
              </Button>
            </Box>
          ) : isMobile ? (
            // Mobile Card View
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {complaints.map((complaint) => (
                <Card
                  key={complaint.id}
                  sx={{
                    borderRadius: 2,
                    border: '1px solid',
                    borderColor: 'divider',
                    '&:hover': {
                      boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                    }
                  }}
                >
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 0.5 }}>
                          {complaint.category || 'No Category'}
                        </Typography>
                        <Chip
                          label={complaint.target_type}
                          size="small"
                          variant="outlined"
                          sx={{ mb: 1 }}
                        />
                      </Box>
                      <Chip
                        label={complaint.status}
                        color={getStatusColor(complaint.status)}
                        size="small"
                      />
                    </Box>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{
                        mb: 2,
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                      }}
                    >
                      {complaint.description || 'No description'}
                    </Typography>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="caption" color="text.secondary">
                        {formatDate(complaint.created_at)}
                      </Typography>
                      <Button
                        size="small"
                        startIcon={<Visibility />}
                        onClick={() => handleViewComplaint(complaint)}
                        sx={{ color: '#4CAF50' }}
                      >
                        View
                      </Button>
                    </Box>
                  </CardContent>
                </Card>
              ))}
            </Box>
          ) : (
            // Desktop Table View
            <TableContainer
              component={Paper}
              variant="outlined"
              sx={{
                borderRadius: 2,
                overflow: 'hidden'
              }}
            >
              <Table>
                <TableHead>
                  <TableRow sx={{ bgcolor: 'rgba(76, 175, 80, 0.05)' }}>
                    <TableCell sx={{ fontWeight: 700, color: 'text.primary' }}>Category</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: 'text.primary' }}>Target Type</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: 'text.primary' }}>Description</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: 'text.primary' }}>Status</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: 'text.primary' }}>Created</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: 'text.primary' }}>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {complaints.map((complaint) => (
                    <TableRow
                      key={complaint.id}
                      hover
                      sx={{
                        '&:hover': {
                          bgcolor: 'rgba(76, 175, 80, 0.02)',
                        }
                      }}
                    >
                      <TableCell>
                        {complaint.category || (
                          <Typography variant="body2" color="text.secondary">
                            N/A
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={complaint.target_type}
                          size="small"
                          variant="outlined"
                          sx={{
                            borderColor: '#4CAF50',
                            color: '#2E7D32',
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        <Typography
                          variant="body2"
                          sx={{
                            maxWidth: 300,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {complaint.description || 'No description'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={complaint.status}
                          color={getStatusColor(complaint.status)}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>{formatDate(complaint.created_at)}</TableCell>
                      <TableCell>
                        <IconButton
                          size="small"
                          onClick={() => handleViewComplaint(complaint)}
                          sx={{
                            color: '#4CAF50',
                            '&:hover': {
                              bgcolor: 'rgba(76, 175, 80, 0.1)',
                            }
                          }}
                        >
                          <Visibility />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>

      {/* Complaint Form Dialog */}
      <ComplaintForm
        open={complaintFormOpen}
        onClose={() => setComplaintFormOpen(false)}
        userId={user.id}
        onSuccess={handleComplaintSuccess}
      />

      {/* View Complaint Dialog */}
      <Dialog
        open={viewDialogOpen}
        onClose={() => setViewDialogOpen(false)}
        maxWidth="md"
        fullWidth
        fullScreen={isMobile}
        PaperProps={{
          sx: {
            borderRadius: isMobile ? 0 : 3,
          }
        }}
      >
        <DialogTitle sx={{
          background: 'linear-gradient(135deg, #4CAF50 0%, #2E7D32 100%)',
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <ReportProblem />
            <Typography variant="h6" sx={{ fontWeight: 700 }}>Complaint Details</Typography>
          </Box>
          <IconButton
            onClick={() => setViewDialogOpen(false)}
            sx={{ color: 'white' }}
          >
            <Close />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          {selectedComplaint && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Status
                </Typography>
                <Box sx={{ mt: 0.5 }}>
                  <Chip
                    label={selectedComplaint.status}
                    color={getStatusColor(selectedComplaint.status)}
                    size="small"
                  />
                </Box>
              </Box>

              <Box>
                <Typography variant="caption" color="text.secondary">
                  Category
                </Typography>
                <Typography variant="body1">
                  {selectedComplaint.category || 'Not specified'}
                </Typography>
              </Box>

              <Box>
                <Typography variant="caption" color="text.secondary">
                  Target Type
                </Typography>
                <Typography variant="body1">{selectedComplaint.target_type}</Typography>
              </Box>

              <Box>
                <Typography variant="caption" color="text.secondary">
                  Description
                </Typography>
                <Paper sx={{ p: 2, mt: 0.5, bgcolor: 'grey.50' }}>
                  <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                    {selectedComplaint.description || 'No description provided'}
                  </Typography>
                </Paper>
              </Box>

              {selectedComplaint.admin_remarks && (
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Admin Response
                  </Typography>
                  <Alert severity="info" sx={{ mt: 0.5 }}>
                    {selectedComplaint.admin_remarks}
                  </Alert>
                </Box>
              )}

              <Box>
                <Typography variant="caption" color="text.secondary">
                  Created
                </Typography>
                <Typography variant="body2">{formatDate(selectedComplaint.created_at)}</Typography>
              </Box>

              {selectedComplaint.updated_at !== selectedComplaint.created_at && (
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Last Updated
                  </Typography>
                  <Typography variant="body2">{formatDate(selectedComplaint.updated_at)}</Typography>
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setViewDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Complaints;

