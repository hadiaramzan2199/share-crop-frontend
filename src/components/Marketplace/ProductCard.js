import React, { useState } from 'react';
import {
  Card,
  CardContent,
  CardMedia,
  Typography,
  Button,
  Chip,
  Box,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Slider,
  Grid, // Add this import
} from '@mui/material';
import {
  ShoppingCart,
  LocationOn,
  Favorite,
  FavoriteBorder,
  Visibility,
} from '@mui/icons-material';

const ProductCard = ({ product, onRent }) => {
  const [isLiked, setIsLiked] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [rentDialogOpen, setRentDialogOpen] = useState(false);
  const [rentArea, setRentArea] = useState(10);
  const [totalCost, setTotalCost] = useState(product.price_per_unit * 10);

  const handleRentAreaChange = (event, newValue) => {
    setRentArea(newValue);
    setTotalCost(product.price_per_unit * newValue);
  };

  const handleRent = () => {
    onRent({
      field_id: product.id,
      area_rented: rentArea,
      total_cost: totalCost,
    });
    setRentDialogOpen(false);
  };

  const maxRentable = Math.min(product.quantity_available, 100); // Limit to 100m² max

  return (
    <>
      <Card className="farmville-card" sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        <Box sx={{ position: 'relative' }}>
          <CardMedia
            component="img"
            height="160"
            image={product.image_url || '/api/placeholder/200/160'}
            alt={product.name}
            sx={{ objectFit: 'cover' }}
          />
          <Chip
            label={`$${product.price_per_unit}/m²`}
            color="primary"
            size="small"
            sx={{
              position: 'absolute',
              top: 8,
              left: 8,
              fontWeight: 'bold',
            }}
          />
          <IconButton
            sx={{
              position: 'absolute',
              top: 8,
              right: 8,
              backgroundColor: 'rgba(255,255,255,0.9)',
            }}
            onClick={() => setIsLiked(!isLiked)}
          >
            {isLiked ? <Favorite color="error" /> : <FavoriteBorder />}
          </IconButton>
        </Box>

        <CardContent sx={{ flexGrow: 1 }}>
          <Typography variant="h6" component="h3" gutterBottom>
            {product.name}
          </Typography>
          
          <Typography variant="body2" color="text.secondary" paragraph sx={{ mb: 2 }}>
            {product.description || 'Fresh organic produce from local farms'}
          </Typography>

          <Box sx={{ mb: 2 }}>
            <Chip
              icon={<LocationOn />}
              label={product.field_name || 'Local Farm'}
              size="small"
              variant="outlined"
              sx={{ mb: 1 }}
            />
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="body2">
                Available: {product.quantity_available}m²
              </Typography>
              <Typography variant="body2" color="success.main">
                ★ 4.8
              </Typography>
            </Box>
          </Box>
        </CardContent>

        <Box sx={{ p: 2, pt: 0 }}>
          <Button
            fullWidth
            variant="contained"
            startIcon={<ShoppingCart />}
            onClick={() => setRentDialogOpen(true)}
            className="farmville-button"
            sx={{ mb: 1 }}
          >
            Rent Now
          </Button>
          <Button
            fullWidth
            variant="outlined"
            startIcon={<Visibility />}
            onClick={() => setViewDialogOpen(true)}
          >
            View Details
          </Button>
        </Box>
      </Card>

      {/* Rent Dialog */}
      <Dialog open={rentDialogOpen} onClose={() => setRentDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          <ShoppingCart sx={{ mr: 1, verticalAlign: 'bottom' }} />
          Rent {product.name}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mb: 3 }}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              How much area do you want to rent?
            </Typography>
            <Slider
              value={rentArea}
              onChange={handleRentAreaChange}
              min={1}
              max={maxRentable}
              valueLabelDisplay="auto"
              valueLabelFormat={(value) => `${value}m²`}
              sx={{ mt: 2 }}
            />
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
              <Typography variant="body2">1m²</Typography>
              <Typography variant="body2">{maxRentable}m²</Typography>
            </Box>
          </Box>

          <Box sx={{ 
            backgroundColor: 'success.light', 
            p: 2, 
            borderRadius: 2,
            textAlign: 'center'
          }}>
            <Typography variant="h6" color="success.dark">
              Total Cost: ${totalCost.toFixed(2)}
            </Typography>
            <Typography variant="body2">
              {rentArea}m² × ${product.price_per_unit}/m²
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRentDialogOpen(false)}>Cancel</Button>
          <Button 
            variant="contained" 
            onClick={handleRent}
            className="farmville-button"
          >
            Confirm Rent
          </Button>
        </DialogActions>
      </Dialog>

      {/* View Details Dialog */}
      <Dialog open={viewDialogOpen} onClose={() => setViewDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>{product.name} Details</DialogTitle>
        <DialogContent>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <img
                src={product.image_url || '/api/placeholder/400/300'}
                alt={product.name}
                style={{ width: '100%', borderRadius: '12px' }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="h6" gutterBottom>Description</Typography>
              <Typography variant="body2" paragraph>
                {product.description || 'No description available.'}
              </Typography>
              
              <Typography variant="h6" gutterBottom>Pricing</Typography>
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2">
                  Price: ${product.price_per_unit}/m²
                </Typography>
                <Typography variant="body2">
                  Retail: ${product.retail_price}
                </Typography>
                <Typography variant="body2">
                  Suggested: ${product.suggested_price}
                </Typography>
              </Box>

              <Typography variant="h6" gutterBottom>Farm Info</Typography>
              <Typography variant="body2">
                Farm: {product.field_name}
              </Typography>
              <Typography variant="body2">
                Farmer: {product.farmer_name}
              </Typography>
            </Grid>
          </Grid>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ProductCard;