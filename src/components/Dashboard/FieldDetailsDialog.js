import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
} from '@mui/material';

const FieldDetailsDialog = ({ field, open, onClose, onDelete }) => {
  if (!field) {
    return null;
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Field Details</DialogTitle>
      <DialogContent>
        <Typography variant="h6" gutterBottom>
          {field.name}
        </Typography>
        <Typography variant="body1" color="textSecondary" paragraph>
          Area: {field.area} acres
        </Typography>
        <Typography variant="body1" color="textSecondary" paragraph>
          Crop Type: {field.cropType}
        </Typography>
        <Typography variant="body1" color="textSecondary" paragraph>
          Location: {field.location.latitude}, {field.location.longitude}
        </Typography>
        {/* Add more field details as needed */}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="primary">
          Close
        </Button>
        <Button onClick={() => onDelete(field.id)} color="error">
          Delete
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default FieldDetailsDialog;