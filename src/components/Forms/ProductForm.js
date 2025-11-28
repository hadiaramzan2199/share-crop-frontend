import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Grid,
  MenuItem,
  Box,
  Typography,
  FormControl,
  InputLabel,
  Select,
} from '@mui/material';
import { AddPhotoAlternate, Save } from '@mui/icons-material';

const ProductForm = ({ open, onClose, onSubmit, fields, categories = [], product }) => {
  const [formData, setFormData] = useState({
    field_id: '',
    category_id: '',
    name: '',
    description: '',
    quantity_available: '',
    price_per_unit: '',
    retail_price: '',
    suggested_price: '',
    production_rate_per_area: '',
    virtual_rent_cost: '',
    app_fees: '',
    area_virtual_rent_price: '',
  });

  useEffect(() => {
    if (product) {
      setFormData({
        field_id: product.field_id || '',
        category_id: product.category_id || '',
        name: product.name || '',
        description: product.description || '',
        quantity_available: product.quantity_available || '',
        price_per_unit: product.price_per_unit || '',
        retail_price: product.retail_price || '',
        suggested_price: product.suggested_price || '',
        production_rate_per_area: product.production_rate_per_area || '',
        virtual_rent_cost: product.virtual_rent_cost || '',
        app_fees: product.app_fees || '',
        area_virtual_rent_price: product.area_virtual_rent_price || '',
      });
    } else {
      setFormData({
        field_id: '',
        category_id: '',
        name: '',
        description: '',
        quantity_available: '',
        price_per_unit: '',
        retail_price: '',
        suggested_price: '',
        production_rate_per_area: '',
        virtual_rent_cost: '',
        app_fees: '',
        area_virtual_rent_price: '',
      });
    }
  }, [product, open]);

  const handleInputChange = (field) => (event) => {
    setFormData(prev => ({
      ...prev,
      [field]: event.target.value,
    }));
  };

  const handleSubmit = () => {
    onSubmit(formData);
    onClose();
  };

  const isFormValid = formData.field_id && formData.name && formData.quantity_available && formData.price_per_unit;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        {product ? 'Edit Product' : 'Add New Product'}
      </DialogTitle>
      <DialogContent>
        <Grid container spacing={2} sx={{ mt: 1 }}>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth required>
              <InputLabel>Field</InputLabel>
              <Select
                value={formData.field_id}
                onChange={handleInputChange('field_id')}
                label="Field"
              >
                {fields.map((field) => (
                  <MenuItem key={field.id} value={field.id}>
                    {field.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
              <InputLabel>Category</InputLabel>
              <Select
                value={formData.category_id}
                onChange={handleInputChange('category_id')}
                label="Category"
              >
                {categories.map((category) => (
                  <MenuItem key={category.id} value={category.id}>
                    {category.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12}>
            <TextField
              fullWidth
              required
              label="Product Name"
              value={formData.name}
              onChange={handleInputChange('name')}
            />
          </Grid>

          <Grid item xs={12}>
            <TextField
              fullWidth
              multiline
              rows={3}
              label="Description"
              value={formData.description}
              onChange={handleInputChange('description')}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              required
              type="number"
              label="Quantity Available (m²)"
              value={formData.quantity_available}
              onChange={handleInputChange('quantity_available')}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              required
              type="number"
              label="Price per m² ($)"
              value={formData.price_per_unit}
              onChange={handleInputChange('price_per_unit')}
            />
          </Grid>

          <Grid item xs={12} sm={4}>
            <TextField
              fullWidth
              type="number"
              label="Retail Price ($)"
              value={formData.retail_price}
              onChange={handleInputChange('retail_price')}
            />
          </Grid>

          <Grid item xs={12} sm={4}>
            <TextField
              fullWidth
              type="number"
              label="Suggested Price ($)"
              value={formData.suggested_price}
              onChange={handleInputChange('suggested_price')}
            />
          </Grid>

          <Grid item xs={12} sm={4}>
            <TextField
              fullWidth
              type="number"
              label="Production Rate"
              value={formData.production_rate_per_area}
              onChange={handleInputChange('production_rate_per_area')}
            />
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={!isFormValid}
          startIcon={<Save />}
          className="farmville-button"
        >
          {product ? 'Update Product' : 'Create Product'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ProductForm;