import React from 'react';
import { Alert, Box, Button, Typography } from '@mui/material';
import { Refresh, ReportProblem } from '@mui/icons-material';

const ErrorMessage = ({ message, onRetry, severity = 'error' }) => {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '200px',
        gap: 2,
        p: 3,
      }}
    >
      <ReportProblem sx={{ fontSize: 48, color: 'error.main' }} />
      
      <Alert severity={severity} sx={{ width: '100%', maxWidth: 400 }}>
        <Typography variant="body1" gutterBottom>
          {message || 'Something went wrong. Please try again.'}
        </Typography>
      </Alert>

      {onRetry && (
        <Button
          variant="contained"
          startIcon={<Refresh />}
          onClick={onRetry}
          className="farmville-button"
        >
          Try Again
        </Button>
      )}
    </Box>
  );
};

export default ErrorMessage;