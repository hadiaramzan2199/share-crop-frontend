import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box,
  Typography,
  Slider,
  Chip,
} from '@mui/material';
import { ShoppingCart, CheckCircle } from '@mui/icons-material';

const OrderForm = ({ open, onClose, product, onSubmit }) => {
  const [area, setArea] = useState(10);
  const [notes, setNotes] = useState('');

  if (!product) return null;

  const maxArea = Math.min(product.quantity_available, 100);
  const totalCost = area * product.price_per_unit;

  const handleSubmit = () => {
    onSubmit({
      field_id: product.id,
      area_rented: area,
      total_cost: totalCost,
      notes: notes.trim() || undefined,
    });
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <ShoppingCart sx={{ mr: 1, verticalAlign: 'bottom' }} />
        Rent {product.name}
      </DialogTitle>
      <DialogContent>
        <Box sx={{ mb: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="body1">Price: ${product.price_per_unit}/m²</Typography>
            <Chip 
              label={`Available: ${product.quantity_available}m²`} 
              color="primary" 
              variant="outlined" 
            />
          </Box>

          <Typography variant="body2" color="text.secondary" gutterBottom>
            Select the area you want to rent (in square meters):
          </Typography>
          
          <Slider
            value={area}
            onChange={(e, newValue) => setArea(newValue)}
            min={1}
            max={maxArea}
            valueLabelDisplay="auto"
            valueLabelFormat={(value) => `${value}m²`}
            sx={{ mt: 2, mb: 1 }}
          />
          
          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Typography variant="body2">1m²</Typography>
            <Typography variant="body2">{maxArea}m²</Typography>
          </Box>
        </Box>

        <TextField
          fullWidth
          label="Additional Notes (Optional)"
          multiline
          rows={3}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          sx={{ mb: 3 }}
          placeholder="Any special instructions for the farmer..."
        />

        <Box sx={{ 
          backgroundColor: 'success.light', 
          p: 2, 
          borderRadius: 2,
          textAlign: 'center'
        }}>
          <Typography variant="h6" color="success.dark">
            Total: ${totalCost.toFixed(2)}
          </Typography>
          <Typography variant="body2">
            {area}m² × ${product.price_per_unit}/m²
          </Typography>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button 
          variant="contained" 
          onClick={handleSubmit}
          startIcon={<CheckCircle />}
          className="farmville-button"
        >
          Confirm Rental
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default OrderForm;