import React from 'react';
import {
  Container,
  Typography,
  Button,
  Box,
  Grid,
  Card,
  CardContent,
  CardActions,
  Stack,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useEffect } from 'react';

const Home = () => {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();

  // Redirect authenticated users to their dashboard
  useEffect(() => {
    if (isAuthenticated && user) {
      const userType = user.user_type?.toLowerCase();
      if (userType === 'admin') {
        navigate('/admin', { replace: true });
      } else if (userType === 'farmer') {
        navigate('/farmer', { replace: true });
      } else if (userType === 'buyer') {
        navigate('/buyer', { replace: true });
      }
    }
  }, [isAuthenticated, user, navigate]);

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box textAlign="center" mb={6}>
        <Typography variant="h2" component="h1" gutterBottom>
          Welcome to ShareCrop
        </Typography>
        <Typography variant="h5" color="text.secondary" paragraph>
          Connecting farmers and buyers for sustainable agriculture
        </Typography>
        {!isAuthenticated && (
          <Stack direction="row" spacing={2} justifyContent="center" sx={{ mt: 3 }}>
            <Button
              variant="contained"
              size="large"
              onClick={() => navigate('/login')}
              sx={{
                borderRadius: 2,
                px: 4,
                background: 'linear-gradient(135deg, #4CAF50 0%, #2E7D32 100%)',
              }}
            >
              Sign In
            </Button>
            <Button
              variant="outlined"
              size="large"
              onClick={() => navigate('/signup')}
              sx={{
                borderRadius: 2,
                px: 4,
                borderColor: '#4CAF50',
                color: '#2E7D32',
                '&:hover': {
                  borderColor: '#2E7D32',
                  bgcolor: 'rgba(76, 175, 80, 0.08)',
                },
              }}
            >
              Sign Up
            </Button>
          </Stack>
        )}
      </Box>

      <Grid container spacing={4} justifyContent="center">
        <Grid item xs={12} md={6}>
          <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <CardContent sx={{ flexGrow: 1 }}>
              <Typography variant="h4" component="h2" gutterBottom>
                For Farmers
              </Typography>
              <Typography variant="body1" paragraph>
                List your crops, manage your fields, and connect with buyers directly.
                Get fair prices for your produce and grow your farming business.
              </Typography>
            </CardContent>
            <CardActions>
              <Button
                size="large"
                variant="contained"
                color="primary"
                fullWidth
                onClick={() => navigate('/farmer')}
              >
                View Farmer Dashboard
              </Button>
            </CardActions>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <CardContent sx={{ flexGrow: 1 }}>
              <Typography variant="h4" component="h2" gutterBottom>
                For Buyers
              </Typography>
              <Typography variant="body1" paragraph>
                Browse fresh produce directly from farmers. Find quality crops
                and build lasting relationships with local producers.
              </Typography>
            </CardContent>
            <CardActions>
              <Button
                size="large"
                variant="contained"
                color="secondary"
                fullWidth
                onClick={() => navigate('/buyer')}
              >
                View Buyer Dashboard
              </Button>
            </CardActions>
          </Card>
        </Grid>
      </Grid>

    </Container>
  );
};

export default Home;