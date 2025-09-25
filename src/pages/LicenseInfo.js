import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Chip,
  Avatar,
  Divider,
  Button,
  IconButton,
  Stack,
  Paper,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Alert,
  LinearProgress,
} from '@mui/material';
import {
  LocationOn,
  CalendarToday,
  Agriculture,
  TrendingUp,
  MoreVert,
  Assessment,
  VerifiedUser,
  Warning,
  CheckCircle,
  Cancel,
  Pending,
  Description,
  Business,
  Security,
  Gavel,
  Assignment,
  Download,
  Upload,
  Nature,
} from '@mui/icons-material';

const LicenseInfo = () => {
  const [licenses, setLicenses] = useState([]);
  const [certifications, setCertifications] = useState([]);
  
  // Load license and certification data
  useEffect(() => {
    const loadLicenseData = () => {
      const mockLicenses = [
        {
          id: 1,
          name: 'Organic Farming License',
          type: 'Organic',
          status: 'Active',
          issueDate: '2023-01-15',
          expiryDate: '2025-01-15',
          authority: 'USDA Organic',
          licenseNumber: 'ORG-2023-001',
          daysToExpiry: 365
        },
        {
          id: 2,
          name: 'Pesticide Application License',
          type: 'Pesticide',
          status: 'Active',
          issueDate: '2023-03-20',
          expiryDate: '2024-03-20',
          authority: 'State Agriculture Dept',
          licenseNumber: 'PEST-2023-045',
          daysToExpiry: 45
        },
        {
          id: 3,
          name: 'Water Rights Permit',
          type: 'Water',
          status: 'Pending',
          issueDate: '2023-06-10',
          expiryDate: '2026-06-10',
          authority: 'Water Management Board',
          licenseNumber: 'WTR-2023-078',
          daysToExpiry: 730
        },
        {
          id: 4,
          name: 'Livestock Health Certificate',
          type: 'Livestock',
          status: 'Expired',
          issueDate: '2022-08-15',
          expiryDate: '2023-08-15',
          authority: 'Veterinary Services',
          licenseNumber: 'LIV-2022-156',
          daysToExpiry: -30
        }
      ];

      const mockCertifications = [
        {
          id: 1,
          name: 'Sustainable Agriculture Certification',
          type: 'Sustainability',
          status: 'Active',
          issueDate: '2023-02-10',
          expiryDate: '2025-02-10',
          authority: 'Green Farming Alliance',
          certNumber: 'SUS-2023-012',
          daysToExpiry: 400
        },
        {
          id: 2,
          name: 'Food Safety Certification',
          type: 'Food Safety',
          status: 'Active',
          issueDate: '2023-04-05',
          expiryDate: '2024-04-05',
          authority: 'Food Safety Authority',
          certNumber: 'FS-2023-089',
          daysToExpiry: 90
        }
      ];

      setLicenses(mockLicenses);
      setCertifications(mockCertifications);
    };

    loadLicenseData();
  }, []);

  const getStatusColor = (status) => {
    switch (status) {
      case 'Active': return '#059669';
      case 'Pending': return '#d97706';
      case 'Expired': return '#dc2626';
      default: return '#6b7280';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'Active': return <CheckCircle />;
      case 'Pending': return <Pending />;
      case 'Expired': return <Cancel />;
      default: return <Assignment />;
    }
  };

  const getComplianceScore = () => {
    const totalItems = licenses.length + certifications.length;
    const activeItems = licenses.filter(l => l.status === 'Active').length + 
                       certifications.filter(c => c.status === 'Active').length;
    return totalItems > 0 ? Math.round((activeItems / totalItems) * 100) : 0;
  };

  const getExpiringLicenses = () => {
    return licenses.filter(license => license.daysToExpiry <= 90);
  };

  return (
    <Box sx={{ 
      minHeight: '100vh',
      backgroundColor: '#f8fafc',
      p: 3
    }}>
      {/* Header Section */}
      <Box sx={{ 
        maxWidth: '1400px', 
        mx: 'auto',
        mb: 4
      }}>
        <Box>
          <Typography 
            variant="h4" 
            component="h1" 
            sx={{ 
              fontWeight: 700, 
              color: '#1e293b',
              mb: 1,
              fontSize: { xs: '1.75rem', md: '2.125rem' }
            }}
          >
            License & Certification Info
          </Typography>
          <Typography 
            variant="body1" 
            color="text.secondary"
            sx={{ fontSize: '1rem' }}
          >
            Manage your farming licenses and certifications to ensure compliance
          </Typography>
        </Box>
      </Box>

      <Box sx={{ maxWidth: '1400px', mx: 'auto' }}>
        {/* Summary Cards */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} lg={3}>
            <Paper
              elevation={0}
              sx={{
                p: 2,
                border: '1px solid #e2e8f0',
                borderRadius: 2,
                backgroundColor: 'white',
                transition: 'all 0.2s ease-in-out',
                '&:hover': {
                  transform: 'translateY(-1px)',
                  boxShadow: '0 6px 20px rgba(0,0,0,0.08)'
                }
              }}
            >
              <Stack direction="row" alignItems="center" spacing={1.5}>
                <Avatar
                  sx={{
                    backgroundColor: '#f0f9ff',
                    color: '#0369a1',
                    width: 40,
                    height: 40
                  }}
                >
                  <VerifiedUser sx={{ fontSize: 20 }} />
                </Avatar>
                <Box>
                  <Typography variant="h5" sx={{ fontWeight: 700, color: '#1e293b', fontSize: '1.5rem' }}>
                    {getComplianceScore()}%
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem' }}>
                    Compliance Score
                  </Typography>
                </Box>
              </Stack>
            </Paper>
          </Grid>
          
          <Grid item xs={12} sm={6} lg={3}>
            <Paper
              elevation={0}
              sx={{
                p: 2,
                border: '1px solid #e2e8f0',
                borderRadius: 2,
                backgroundColor: 'white',
                transition: 'all 0.2s ease-in-out',
                '&:hover': {
                  transform: 'translateY(-1px)',
                  boxShadow: '0 6px 20px rgba(0,0,0,0.08)'
                }
              }}
            >
              <Stack direction="row" alignItems="center" spacing={1.5}>
                <Avatar
                  sx={{
                    backgroundColor: '#dbeafe',
                    color: '#2563eb',
                    width: 40,
                    height: 40
                  }}
                >
                  <Assignment sx={{ fontSize: 20 }} />
                </Avatar>
                <Box>
                  <Typography variant="h5" sx={{ fontWeight: 700, color: '#1e293b', fontSize: '1.5rem' }}>
                    {licenses.length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem' }}>
                    Total Licenses
                  </Typography>
                </Box>
              </Stack>
            </Paper>
          </Grid>
          
          <Grid item xs={12} sm={6} lg={3}>
            <Paper
              elevation={0}
              sx={{
                p: 2,
                border: '1px solid #e2e8f0',
                borderRadius: 2,
                backgroundColor: 'white',
                transition: 'all 0.2s ease-in-out',
                '&:hover': {
                  transform: 'translateY(-1px)',
                  boxShadow: '0 6px 20px rgba(0,0,0,0.08)'
                }
              }}
            >
              <Stack direction="row" alignItems="center" spacing={1.5}>
                <Avatar
                  sx={{
                    backgroundColor: '#fef3c7',
                    color: '#d97706',
                    width: 40,
                    height: 40
                  }}
                >
                  <Security sx={{ fontSize: 20 }} />
                </Avatar>
                <Box>
                  <Typography variant="h5" sx={{ fontWeight: 700, color: '#1e293b', fontSize: '1.5rem' }}>
                    {certifications.length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem' }}>
                    Certifications
                  </Typography>
                </Box>
              </Stack>
            </Paper>
          </Grid>
          
          <Grid item xs={12} sm={6} lg={3}>
            <Paper
              elevation={0}
              sx={{
                p: 2,
                border: '1px solid #e2e8f0',
                borderRadius: 2,
                backgroundColor: 'white',
                transition: 'all 0.2s ease-in-out',
                '&:hover': {
                  transform: 'translateY(-1px)',
                  boxShadow: '0 6px 20px rgba(0,0,0,0.08)'
                }
              }}
            >
              <Stack direction="row" alignItems="center" spacing={1.5}>
                <Avatar
                  sx={{
                    backgroundColor: '#dcfce7',
                    color: '#059669',
                    width: 40,
                    height: 40
                  }}
                >
                  <CheckCircle sx={{ fontSize: 20 }} />
                </Avatar>
                <Box>
                  <Typography variant="h5" sx={{ fontWeight: 700, color: '#1e293b', fontSize: '1.5rem' }}>
                    {licenses.filter(l => l.status === 'Active').length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem' }}>
                    Active Licenses
                  </Typography>
                </Box>
              </Stack>
            </Paper>
          </Grid>
        </Grid>

        {/* Expiring Licenses Alert */}
        {getExpiringLicenses().length > 0 && (
          <Alert severity="warning" sx={{ mb: 3 }}>
            <Typography variant="body2">
              You have {getExpiringLicenses().length} license(s) expiring within 90 days. Please renew them to maintain compliance.
            </Typography>
          </Alert>
        )}

        {/* Licenses Section */}
        <Box sx={{ mb: 4 }}>
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            mb: 3 
          }}>
            <Typography 
              variant="h5" 
              sx={{ 
                fontWeight: 600, 
                color: '#1e293b',
                fontSize: '1.25rem'
              }}
            >
              Farming Licenses
            </Typography>
            <Button
              variant="contained"
              startIcon={<Upload />}
              sx={{
                backgroundColor: '#059669',
                '&:hover': {
                  backgroundColor: '#047857'
                }
              }}
            >
              Add License
            </Button>
          </Box>

          <Grid container spacing={3}>
            {licenses.map((license) => (
              <Grid item xs={12} md={6} lg={3} key={license.id}>
                <Paper
                  elevation={0}
                  sx={{
                    p: 3,
                    border: '1px solid #e2e8f0',
                    borderRadius: 2,
                    backgroundColor: 'white',
                    transition: 'all 0.2s ease-in-out',
                    '&:hover': {
                      transform: 'translateY(-1px)',
                      boxShadow: '0 6px 20px rgba(0,0,0,0.08)'
                    }
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Avatar
                        sx={{
                          backgroundColor: license.status === 'Active' ? '#dcfce7' : 
                                          license.status === 'Pending' ? '#fef3c7' : '#fee2e2',
                          color: getStatusColor(license.status),
                          width: 40,
                          height: 40
                        }}
                      >
                        {getStatusIcon(license.status)}
                      </Avatar>
                      <Box>
                        <Typography variant="h6" sx={{ fontWeight: 600, color: '#1e293b', mb: 0.5 }}>
                          {license.name}
                        </Typography>
                        <Chip
                          label={license.status}
                          size="small"
                          sx={{
                            backgroundColor: license.status === 'Active' ? '#dcfce7' : 
                                            license.status === 'Pending' ? '#fef3c7' : '#fee2e2',
                            color: getStatusColor(license.status),
                            fontWeight: 500
                          }}
                        />
                      </Box>
                    </Box>
                    <IconButton size="small">
                      <MoreVert />
                    </IconButton>
                  </Box>

                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="body2" color="text.secondary">
                      License #: {license.licenseNumber}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="body2" color="text.secondary">
                      Authority: {license.authority}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="body2" color="text.secondary">
                      Expires: {license.expiryDate}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="body2" color="text.secondary">
                      Days to Expiry: {license.daysToExpiry}
                    </Typography>
                  </Box>
                </Paper>
              </Grid>
            ))}
          </Grid>
        </Box>

        {/* Certifications Section */}
        <Box sx={{ mb: 4 }}>
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            mb: 3 
          }}>
            <Typography 
              variant="h5" 
              sx={{ 
                fontWeight: 600, 
                color: '#1e293b',
                fontSize: '1.25rem'
              }}
            >
              Certifications
            </Typography>
            <Button
              variant="contained"
              startIcon={<Upload />}
              sx={{
                backgroundColor: '#059669',
                '&:hover': {
                  backgroundColor: '#047857'
                }
              }}
            >
              Add Certification
            </Button>
          </Box>

          <Grid container spacing={3}>
            {certifications.map((cert) => (
              <Grid item xs={12} md={6} lg={3} key={cert.id}>
                <Paper
                  elevation={0}
                  sx={{
                    p: 3,
                    border: '1px solid #e2e8f0',
                    borderRadius: 2,
                    backgroundColor: 'white',
                    transition: 'all 0.2s ease-in-out',
                    '&:hover': {
                      transform: 'translateY(-1px)',
                      boxShadow: '0 6px 20px rgba(0,0,0,0.08)'
                    }
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Avatar
                        sx={{
                          backgroundColor: cert.status === 'Active' ? '#dcfce7' : 
                                          cert.status === 'Pending' ? '#fef3c7' : '#fee2e2',
                          color: getStatusColor(cert.status),
                          width: 40,
                          height: 40
                        }}
                      >
                        {getStatusIcon(cert.status)}
                      </Avatar>
                      <Box>
                        <Typography variant="h6" sx={{ fontWeight: 600, color: '#1e293b', mb: 0.5 }}>
                          {cert.name}
                        </Typography>
                        <Chip
                          label={cert.status}
                          size="small"
                          sx={{
                            backgroundColor: cert.status === 'Active' ? '#dcfce7' : 
                                            cert.status === 'Pending' ? '#fef3c7' : '#fee2e2',
                            color: getStatusColor(cert.status),
                            fontWeight: 500
                          }}
                        />
                      </Box>
                    </Box>
                    <IconButton size="small">
                      <MoreVert />
                    </IconButton>
                  </Box>

                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="body2" color="text.secondary">
                      Cert #: {cert.certNumber}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="body2" color="text.secondary">
                      Authority: {cert.authority}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="body2" color="text.secondary">
                      Expires: {cert.expiryDate}
                    </Typography>
                  </Box>
                </Paper>
              </Grid>
            ))}
          </Grid>
        </Box>

        {/* Upload Section */}
        {(licenses.length === 0 && certifications.length === 0) && (
          <Paper
            elevation={0}
            sx={{
              p: 4,
              border: '2px dashed #d1d5db',
              borderRadius: 2,
              textAlign: 'center',
              backgroundColor: '#f9fafb'
            }}
          >
            <Nature sx={{ fontSize: 48, color: '#9ca3af', mb: 2 }} />
            <Typography variant="h6" sx={{ fontWeight: 600, color: '#374151', mb: 1 }}>
              No licenses or certifications found
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Upload your farming licenses and certifications to maintain compliance.
            </Typography>
            <Button
              variant="contained"
              sx={{ 
                mt: 2,
                backgroundColor: '#059669',
                '&:hover': {
                  backgroundColor: '#047857'
                }
              }}
            >
              Upload Documents
            </Button>
          </Paper>
        )}
      </Box>
    </Box>
  );
};

export default LicenseInfo;