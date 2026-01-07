import React, { useEffect, useRef } from 'react';
import { Box, Alert, Slide, IconButton } from '@mui/material';
import { Close } from '@mui/icons-material';

const NotificationSystem = ({ notifications, onRemove }) => {
  const timeoutRefs = useRef({});

  const handleClose = (id, event) => {
    if (event) {
      event.stopPropagation();
      event.preventDefault();
    }
    // Clear timeout if exists
    if (timeoutRefs.current[id]) {
      clearTimeout(timeoutRefs.current[id]);
      delete timeoutRefs.current[id];
    }
    onRemove(id);
  };

  // Set up auto-close timeouts
  useEffect(() => {
    notifications.forEach((notification) => {
      if (notification.duration && notification.duration > 0 && !timeoutRefs.current[notification.id]) {
        timeoutRefs.current[notification.id] = setTimeout(() => {
          handleClose(notification.id, null);
        }, notification.duration);
      }
    });

    // Cleanup function
    return () => {
      Object.values(timeoutRefs.current).forEach(timeout => {
        if (timeout) clearTimeout(timeout);
      });
    };
  }, [notifications]);

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
            onClose={(event) => {
              event?.stopPropagation();
              event?.preventDefault();
              handleClose(notification.id, event);
            }}
            action={
              <IconButton
                aria-label="close"
                color="inherit"
                size="small"
                onClick={(event) => {
                  event.stopPropagation();
                  event.preventDefault();
                  handleClose(notification.id, event);
                }}
                sx={{
                  '&:hover': {
                    backgroundColor: 'rgba(0, 0, 0, 0.04)',
                  },
                }}
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
              '& .MuiAlert-action': {
                paddingTop: 0,
                marginRight: 0,
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