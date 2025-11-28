import React from 'react';
import {
  Paper,
  Typography,
  TextField,
  MenuItem,
  Slider,
  Button,
  Box,
  Divider,
} from '@mui/material';
import {
  FilterList,
  Clear,
} from '@mui/icons-material';

const FilterBar = ({ filters, onFiltersChange, categories = [] }) => {
  const handleFilterChange = (field) => (event) => {
    onFiltersChange(prev => ({
      ...prev,
      [field]: event.target.value,
    }));
  };

  const handlePriceChange = (field) => (event, newValue) => {
    onFiltersChange(prev => ({
      ...prev,
      [field]: newValue,
    }));
  };

  const handleClearFilters = () => {
    onFiltersChange({
      category: '',
      minPrice: '',
      maxPrice: '',
      search: '',
    });
  };

  const priceMarks = [
    { value: 0, label: '$0' },
    { value: 10, label: '$10' },
    { value: 20, label: '$20' },
    { value: 30, label: '$30' },
  ];

  return (
    <Paper className="farmville-card" sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <FilterList sx={{ mr: 1 }} />
        <Typography variant="h6">Filters</Typography>
        <Button
          size="small"
          startIcon={<Clear />}
          onClick={handleClearFilters}
          sx={{ ml: 'auto' }}
        >
          Clear
        </Button>
      </Box>

      <TextField
        fullWidth
        label="Search Products"
        value={filters.search}
        onChange={handleFilterChange('search')}
        sx={{ mb: 3 }}
        placeholder="Search by name or description..."
      />

      <Typography variant="subtitle2" gutterBottom>
        Category
      </Typography>
      <TextField
        fullWidth
        select
        value={filters.category}
        onChange={handleFilterChange('category')}
        sx={{ mb: 3 }}
      >
        <MenuItem value="">All Categories</MenuItem>
        {categories.map((category) => (
          <MenuItem key={category.id} value={category.id}>
            {category.name}
          </MenuItem>
        ))}
      </TextField>

      <Divider sx={{ my: 2 }} />

      <Typography variant="subtitle2" gutterBottom>
        Price Range ($/m²)
      </Typography>
      <Slider
        value={[filters.minPrice || 0, filters.maxPrice || 30]}
        onChange={(event, newValue) => {
          onFiltersChange(prev => ({
            ...prev,
            minPrice: newValue[0],
            maxPrice: newValue[1],
          }));
        }}
        valueLabelDisplay="auto"
        valueLabelFormat={(value) => `$${value}`}
        min={0}
        max={30}
        sx={{ mb: 2 }}
      />
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="body2">${filters.minPrice || 0}</Typography>
        <Typography variant="body2">${filters.maxPrice || 30}</Typography>
      </Box>

      <Divider sx={{ my: 2 }} />

      <Typography variant="subtitle2" gutterBottom>
        Farm Size
      </Typography>
      <TextField
        fullWidth
        select
        value={filters.farmSize}
        onChange={handleFilterChange('farmSize')}
        sx={{ mb: 2 }}
      >
        <MenuItem value="">Any Size</MenuItem>
        <MenuItem value="small">Small (0-1000m²)</MenuItem>
        <MenuItem value="medium">Medium (1000-5000m²)</MenuItem>
        <MenuItem value="large">Large (5000+m²)</MenuItem>
      </TextField>

      <Typography variant="subtitle2" gutterBottom>
        Shipping Method
      </Typography>
      <TextField
        fullWidth
        select
        value={filters.shipping}
        onChange={handleFilterChange('shipping')}
      >
        <MenuItem value="">Any Method</MenuItem>
        <MenuItem value="shipping">Shipping Only</MenuItem>
        <MenuItem value="pickup">Pickup Only</MenuItem>
        <MenuItem value="both">Both Available</MenuItem>
      </TextField>
    </Paper>
  );
};

export default FilterBar;