import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Box,
  TextField,
  Button,
  Typography,
  Alert,
  InputAdornment,
  IconButton,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import { Visibility, VisibilityOff, PersonAdd, PhotoCamera, CloudUpload, Description, Delete } from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import {
  Avatar,
  Paper,
  Stack,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Tooltip
} from '@mui/material';
import supabase from '../services/supabase';
import { v4 as uuidv4 } from 'uuid';

const Signup = () => {
  const navigate = useNavigate();
  const { signup } = useAuth();
  const videoRef = useRef(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [userType, setUserType] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [profileImage, setProfileImage] = useState(null);
  const [profileImagePreview, setProfileImagePreview] = useState(null);
  const [verificationDocs, setVerificationDocs] = useState([]);
  const [uploadingFiles, setUploadingFiles] = useState(false);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.play().catch(err => {
        console.log('Video autoplay prevented:', err);
      });
    }
  }, []);

  const handleProfileImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setProfileImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfileImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDocsChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 0) {
      setVerificationDocs(prev => [...prev, ...files]);
    }
  };

  const removeDoc = (index) => {
    setVerificationDocs(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!userType) {
      setError('Please select whether you are a Farmer or Buyer');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    setLoading(true);

    try {
      let profile_image_url = null;
      let uploadedDocuments = [];

      // 1. Upload Profile Image if selected
      if (profileImage) {
        setUploadingFiles(true);
        const fileExt = profileImage.name.split('.').pop();
        const fileName = `${uuidv4()}.${fileExt}`;
        const filePath = `profile-images/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('user-documents')
          .upload(filePath, profileImage);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('user-documents')
          .getPublicUrl(filePath);

        profile_image_url = publicUrl;
      }

      // 2. Upload Verification Documents if selected
      if (verificationDocs.length > 0) {
        setUploadingFiles(true);
        for (const file of verificationDocs) {
          const fileExt = file.name.split('.').pop();
          const fileName = `${uuidv4()}-${file.name}`;
          const filePath = `documents/${fileName}`;

          const { error: uploadError } = await supabase.storage
            .from('user-documents')
            .upload(filePath, file);

          if (uploadError) throw uploadError;

          const { data: { publicUrl } } = supabase.storage
            .from('user-documents')
            .getPublicUrl(filePath);

          uploadedDocuments.push({
            file_name: file.name,
            file_url: publicUrl,
            file_type: file.type || 'other'
          });
        }
      }

      await signup(name, email, password, userType, profile_image_url, uploadedDocuments);

      // Redirect based on user type
      if (userType === 'farmer') {
        navigate('/farmer', { replace: true });
      } else {
        navigate('/buyer', { replace: true });
      }
    } catch (err) {
      setError(
        err.response?.data?.error ||
        err.message ||
        'Signup failed. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        background: '#f5f7fa',
      }}
    >
      {/* Left Side - Fixed Video */}
      <Box
        sx={{
          flex: { xs: 0, md: '0 0 50%' },
          display: { xs: 'none', md: 'block' },
          width: '50%',
          height: '100vh',
          position: 'fixed',
          top: 0,
          left: 0,
          overflow: 'hidden',
          zIndex: 0,
        }}
      >
        <Box
          component="video"
          ref={videoRef}
          autoPlay
          loop
          muted
          playsInline
          sx={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            objectPosition: 'center',
            display: 'block',
          }}
        >
          <source src="/assets/signup.mp4" type="video/mp4" />
        </Box>
        {/* ShareCrop Logo Overlay */}
        <Box
          sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            zIndex: 10,
            textAlign: 'center',
          }}
        >
          <Typography
            variant="h2"
            sx={{
              fontWeight: 800,
              fontSize: { md: '3rem', lg: '4.5rem' },
              background: 'linear-gradient(135deg, #2E7D32 0%, #4CAF50 50%, #66BB6A 100%)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              letterSpacing: '-0.02em',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 1.5,
              lineHeight: 1.2,
              textShadow: `
                -2px -2px 0 rgba(255, 255, 255, 0.8),
                2px -2px 0 rgba(255, 255, 255, 0.8),
                -2px 2px 0 rgba(255, 255, 255, 0.8),
                2px 2px 0 rgba(255, 255, 255, 0.8),
                0 0 8px rgba(255, 255, 255, 0.6),
                0 0 12px rgba(76, 175, 80, 0.5)
              `,
            }}
          >
            <span style={{
              fontSize: '1.2em',
            }}>🌱</span>
            ShareCrop
          </Typography>
          <Typography
            variant="body1"
            sx={{
              mt: 2,
              color: '#ffffff',
              fontSize: { md: '1rem', lg: '1.2rem' },
              fontWeight: 600,
              letterSpacing: '0.5px',
              textShadow: `
                0 0 6px rgba(255, 255, 255, 0.7),
                0 0 10px rgba(76, 175, 80, 0.5),
                2px 2px 4px rgba(0, 0, 0, 0.3)
              `,
            }}
          >
            Connect Farmers & Buyers
          </Typography>
        </Box>
      </Box>

      {/* Right Side - Scrollable Signup Form */}
      <Box
        sx={{
          flex: { xs: 1, md: '0 0 50%' },
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: { xs: 3, md: '0 60px 0 40px' },
          background: '#f5f7fa',
          minHeight: '100vh',
          marginLeft: { xs: 0, md: '50%' },
          overflowY: 'auto',
          position: 'relative',
          zIndex: 1,
        }}
      >
        <Box
          sx={{
            width: '100%',
            maxWidth: 450,
            background: '#ffffff',
            borderRadius: 3,
            padding: { xs: 4, sm: 5, md: 5 },
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
            borderTop: '4px solid #4CAF50',
          }}
        >
          {/* Header */}
          <Box sx={{ textAlign: 'center', mb: 4 }}>
            <Box
              sx={{
                bgcolor: '#4CAF50',
                borderRadius: 2,
                width: 48,
                height: 48,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                mb: 2,
              }}
            >
              <PersonAdd sx={{ fontSize: 24, color: '#ffffff' }} />
            </Box>
            <Typography
              variant="h4"
              sx={{
                fontWeight: 700,
                color: '#212121',
                mb: 1,
                fontSize: '1.75rem',
              }}
            >
              Create Account
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.875rem' }}>
              Join ShareCrop and start your journey
            </Typography>
          </Box>

          {/* Error Alert */}
          {error && (
            <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
              {error}
            </Alert>
          )}

          {/* Signup Form */}
          <Box component="form" onSubmit={handleSubmit}>
            <TextField
              fullWidth
              label="Full Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              margin="normal"
              autoComplete="name"
              sx={{
                mb: 2.5,
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                  bgcolor: '#f5f7fa',
                  '&:hover': {
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#4CAF50',
                    },
                  },
                  '&.Mui-focused': {
                    bgcolor: '#ffffff',
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#4CAF50',
                      borderWidth: 2,
                    },
                  },
                },
              }}
            />

            <TextField
              fullWidth
              label="Email Address"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              margin="normal"
              autoComplete="email"
              sx={{
                mb: 2.5,
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                  bgcolor: '#f5f7fa',
                  '&:hover': {
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#4CAF50',
                    },
                  },
                  '&.Mui-focused': {
                    bgcolor: '#ffffff',
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#4CAF50',
                      borderWidth: 2,
                    },
                  },
                },
              }}
            />

            <FormControl
              fullWidth
              margin="normal"
              sx={{
                mb: 2.5,
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                  bgcolor: '#f5f7fa',
                  '&:hover': {
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#4CAF50',
                    },
                  },
                  '&.Mui-focused': {
                    bgcolor: '#ffffff',
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#4CAF50',
                      borderWidth: 2,
                    },
                  },
                },
              }}
            >
              <InputLabel>I am a</InputLabel>
              <Select
                value={userType}
                label="I am a"
                onChange={(e) => setUserType(e.target.value)}
                required
              >
                <MenuItem value="buyer">Buyer</MenuItem>
                <MenuItem value="farmer">Farmer</MenuItem>
              </Select>
            </FormControl>

            {/* Profile Image Upload */}
            <Box sx={{ mb: 3, textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2, fontWeight: 500 }}>
                Profile Picture (Optional)
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1.5 }}>
                <Avatar
                  src={profileImagePreview}
                  sx={{ width: 80, height: 80, mb: 1, border: '2px solid #4CAF50' }}
                >
                  {!profileImagePreview && <PhotoCamera />}
                </Avatar>
                <Button
                  variant="outlined"
                  size="small"
                  component="label"
                  startIcon={<CloudUpload />}
                  sx={{ textTransform: 'none', borderRadius: 2 }}
                >
                  Select Image
                  <input type="file" hidden accept="image/*" onChange={handleProfileImageChange} />
                </Button>
                <Typography variant="caption" color="text.secondary">
                  You can also update this later in your profile.
                </Typography>
              </Box>
            </Box>

            {/* Farmer Documents Upload */}
            {userType === 'farmer' && (
              <Box sx={{ mb: 3 }}>
                <Divider sx={{ mb: 3 }} />
                <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 700, color: '#2E7D32' }}>
                  Verification Documents (Recommended)
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  For account approval, you must upload documents (ID, certifications, etc.). You can also upload these later from your profile.
                </Typography>

                <Button
                  variant="outlined"
                  fullWidth
                  component="label"
                  startIcon={<CloudUpload />}
                  sx={{ borderStyle: 'dashed', borderRadius: 2, py: 1.5, textTransform: 'none' }}
                >
                  Upload Documents
                  <input type="file" hidden multiple onChange={handleDocsChange} />
                </Button>

                {verificationDocs.length > 0 && (
                  <List sx={{ mt: 1 }}>
                    {verificationDocs.map((file, index) => (
                      <Paper key={index} variant="outlined" sx={{ mb: 1, borderRadius: 2 }}>
                        <ListItem
                          secondaryAction={
                            <IconButton edge="end" size="small" onClick={() => removeDoc(index)} color="error">
                              <Delete fontSize="small" />
                            </IconButton>
                          }
                        >
                          <ListItemIcon sx={{ minWidth: 40 }}>
                            <Description color="primary" fontSize="small" />
                          </ListItemIcon>
                          <ListItemText
                            primary={file.name}
                            primaryTypographyProps={{ fontSize: '0.8rem', noWrap: true }}
                          />
                        </ListItem>
                      </Paper>
                    ))}
                  </List>
                )}
                <Divider sx={{ mt: 3 }} />
              </Box>
            )}

            <TextField
              fullWidth
              label="Password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              margin="normal"
              autoComplete="new-password"
              helperText="Must be at least 6 characters"
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowPassword(!showPassword)}
                      edge="end"
                      sx={{
                        color: 'text.secondary',
                        '&:hover': {
                          color: '#4CAF50',
                        },
                      }}
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
              sx={{
                mb: 2.5,
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                  bgcolor: '#f5f7fa',
                  '&:hover': {
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#4CAF50',
                    },
                  },
                  '&.Mui-focused': {
                    bgcolor: '#ffffff',
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#4CAF50',
                      borderWidth: 2,
                    },
                  },
                },
              }}
            />

            <TextField
              fullWidth
              label="Confirm Password"
              type={showConfirmPassword ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              margin="normal"
              autoComplete="new-password"
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      edge="end"
                      sx={{
                        color: 'text.secondary',
                        '&:hover': {
                          color: '#4CAF50',
                        },
                      }}
                    >
                      {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
              sx={{
                mb: 3,
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                  bgcolor: '#f5f7fa',
                  '&:hover': {
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#4CAF50',
                    },
                  },
                  '&.Mui-focused': {
                    bgcolor: '#ffffff',
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#4CAF50',
                      borderWidth: 2,
                    },
                  },
                },
              }}
            />

            <Button
              type="submit"
              fullWidth
              variant="contained"
              size="large"
              disabled={loading}
              sx={{
                py: 1.5,
                mb: 3,
                borderRadius: 2,
                fontSize: '0.9375rem',
                fontWeight: 600,
                textTransform: 'none',
                bgcolor: '#4CAF50',
                boxShadow: 'none',
                '&:hover': {
                  bgcolor: '#2E7D32',
                  boxShadow: 'none',
                },
                '&:disabled': {
                  bgcolor: '#4CAF50',
                  opacity: 0.7,
                },
              }}
              endIcon={!loading && <PersonAdd />}
            >
              {loading ? (
                <Stack direction="row" spacing={1} alignItems="center">
                  <CircularProgress size={20} color="inherit" />
                  <span>{uploadingFiles ? 'Uploading files...' : 'Creating Account...'}</span>
                </Stack>
              ) : 'Create Account'}
            </Button>

            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.875rem' }}>
                Already have an account?{' '}
                <Link
                  to="/login"
                  style={{
                    color: '#4CAF50',
                    textDecoration: 'none',
                    fontWeight: 600,
                  }}
                >
                  Sign In
                </Link>
              </Typography>
            </Box>
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default Signup;

