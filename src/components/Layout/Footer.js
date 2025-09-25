import React from 'react';
import { Box, Container, Grid, Typography, Link, IconButton } from '@mui/material';
import { Facebook, Twitter, Instagram, LinkedIn } from '@mui/icons-material';

const Footer = () => {
  return (
    <Box
      component="footer"
      sx={{
        backgroundColor: 'grey.900',
        color: 'white',
        py: 8,
        mt: 8,
      }}
    >
      <Container maxWidth="lg">
        <Grid container spacing={4}>
          <Grid item xs={12} md={4}>
            <Typography variant="h4" gutterBottom sx={{ fontWeight: 700 }}>
              🌱 ShareCrop
            </Typography>
            <Typography variant="body2" sx={{ mb: 2, opacity: 0.8 }}>
              Connecting farmers and buyers in a sustainable agricultural marketplace. 
              Fresh produce directly from farm to table.
            </Typography>
            <Box>
              <IconButton sx={{ color: 'white' }}>
                <Facebook />
              </IconButton>
              <IconButton sx={{ color: 'white' }}>
                <Twitter />
              </IconButton>
              <IconButton sx={{ color: 'white' }}>
                <Instagram />
              </IconButton>
              <IconButton sx={{ color: 'white' }}>
                <LinkedIn />
              </IconButton>
            </Box>
          </Grid>

          <Grid item xs={6} md={2}>
            <Typography variant="h6" gutterBottom>
              For Farmers
            </Typography>
            <Link href="#" color="inherit" display="block" sx={{ mb: 1, opacity: 0.8 }}>
              Sell Products
            </Link>
            <Link href="#" color="inherit" display="block" sx={{ mb: 1, opacity: 0.8 }}>
              Manage Farm
            </Link>
            <Link href="#" color="inherit" display="block" sx={{ mb: 1, opacity: 0.8 }}>
              Pricing
            </Link>
          </Grid>

          <Grid item xs={6} md={2}>
            <Typography variant="h6" gutterBottom>
              For Buyers
            </Typography>
            <Link href="#" color="inherit" display="block" sx={{ mb: 1, opacity: 0.8 }}>
              Browse Products
            </Link>
            <Link href="#" color="inherit" display="block" sx={{ mb: 1, opacity: 0.8 }}>
              How it Works
            </Link>
            <Link href="#" color="inherit" display="block" sx={{ mb: 1, opacity: 0.8 }}>
              FAQ
            </Link>
          </Grid>

          <Grid item xs={6} md={2}>
            <Typography variant="h6" gutterBottom>
              Company
            </Typography>
            <Link href="#" color="inherit" display="block" sx={{ mb: 1, opacity: 0.8 }}>
              About Us
            </Link>
            <Link href="#" color="inherit" display="block" sx={{ mb: 1, opacity: 0.8 }}>
              Contact
            </Link>
            <Link href="#" color="inherit" display="block" sx={{ mb: 1, opacity: 0.8 }}>
              Careers
            </Link>
          </Grid>

          <Grid item xs={6} md={2}>
            <Typography variant="h6" gutterBottom>
              Legal
            </Typography>
            <Link href="#" color="inherit" display="block" sx={{ mb: 1, opacity: 0.8 }}>
              Privacy Policy
            </Link>
            <Link href="#" color="inherit" display="block" sx={{ mb: 1, opacity: 0.8 }}>
              Terms of Service
            </Link>
            <Link href="#" color="inherit" display="block" sx={{ mb: 1, opacity: 0.8 }}>
              Cookie Policy
            </Link>
          </Grid>
        </Grid>

        <Box
          sx={{
            borderTop: '1px solid',
            borderColor: 'grey.700',
            mt: 4,
            pt: 4,
            textAlign: 'center',
          }}
        >
          <Typography variant="body2" sx={{ opacity: 0.6 }}>
            © 2024 ShareCrop. All rights reserved. Building a sustainable future together.
          </Typography>
        </Box>
      </Container>
    </Box>
  );
};

export default Footer;