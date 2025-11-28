import React from 'react';
import { Box, CircularProgress, Typography } from '@mui/material';

const Loader = ({ message = "Loading..." }) => {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '200px',
        gap: 2,
      }}
    >
      <CircularProgress 
        size={60} 
        thickness={4}
        sx={{
          color: 'primary.main',
          animationDuration: '1.5s',
        }}
      />
      <Typography variant="body1" color="text.secondary">
        {message}
      </Typography>
    </Box>
  );
};

export default Loader;