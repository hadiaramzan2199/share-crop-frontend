import React from 'react';
import { Box, Alert, Slide, IconButton } from '@mui/material';
import { Close } from '@mui/icons-material';

const NotificationSystem = ({ notifications, onRemove }) => {
  return (
    <Box
      sx={{
        position: 'fixed',
        bottom: 20,
        right: 20,
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        gap: 1,
        maxWidth: 400,
      }}
    >
      {notifications.map((notification) => (
        <Slide
          key={notification.id}
          direction="left"
          in={true}
          mountOnEnter
          unmountOnExit
        >
          <Alert
            severity={notification.type || 'success'}
            action={
              <IconButton
                aria-label="close"
                color="inherit"
                size="small"
                onClick={() => onRemove(notification.id)}
              >
                <Close fontSize="inherit" />
              </IconButton>
            }
            sx={{
              minWidth: 300,
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
              borderRadius: 2,
              '& .MuiAlert-message': {
                fontSize: '14px',
                fontWeight: 500,
              },
            }}
          >
            {notification.message}
          </Alert>
        </Slide>
      ))}
    </Box>
  );
};

export default NotificationSystem;