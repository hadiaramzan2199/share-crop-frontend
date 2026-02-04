import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  TextField,
  Button,
  Typography,
  IconButton,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Paper,
  InputAdornment,
  FormControlLabel,
  RadioGroup,
  Radio
} from '@mui/material';

import {
  Close,
  LocationOn,
  Add,
  Remove,
  Agriculture,
  Grass,
  Nature,
  LocalFlorist,
  Park,
  Terrain,
  Yard
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import LocationPicker from './LocationPicker';
import { useAuth } from '../../contexts/AuthContext';
import supabase from '../../services/supabase';
import { v4 as uuidv4 } from 'uuid';
import { userDocumentsService } from '../../services/userDocuments';
import { useNavigate } from 'react-router-dom';

// Custom hook for mobile detection
const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    checkIsMobile();
    window.addEventListener('resize', checkIsMobile);

    return () => window.removeEventListener('resize', checkIsMobile);
  }, []);

  return isMobile;
};

// Styled components for SaaS design
const StyledDialog = styled(Dialog)(({ theme, isMobile }) => ({
  '& .MuiDialog-paper': {
    borderRadius: isMobile ? '12px' : '20px',
    boxShadow: '0 20px 60px rgba(0, 0, 0, 0.1)',
    border: '1px solid #e0e7ff',
    maxWidth: isMobile ? '320px' : '800px',
    width: isMobile ? '320px' : '800px',
    margin: isMobile ? '8px' : '32px',
    maxHeight: isMobile ? '85vh' : '90vh',
  },
}));

const StyledDialogTitle = styled(DialogTitle)(({ theme, isMobile }) => ({
  background: 'linear-gradient(135deg, #4caf50 0%, #66bb6a 100%)',
  color: 'white',
  fontWeight: 700,
  fontSize: isMobile ? '1.2rem' : '1.5rem',
  textAlign: 'center',
  padding: isMobile ? '16px' : '24px',
  borderRadius: isMobile ? '12px 12px 0 0' : '20px 20px 0 0',
}));

const StyledDialogContent = styled(DialogContent)(({ theme, isMobile }) => ({
  padding: isMobile ? '16px' : '32px',
  background: 'linear-gradient(135deg, #f8fffe 0%, #f1f8e9 100%)',
  maxHeight: isMobile ? '75vh' : '80vh',
  overflowY: 'auto',
}));

const StyledTextField = styled(TextField)(({ theme, isMobile }) => ({
  width: isMobile ? '240px !important' : '270px !important',
  '& .MuiOutlinedInput-root': {
    borderRadius: isMobile ? '8px' : '12px',
    backgroundColor: '#ffffff',
    border: '2px solid #e8f5e8',
    transition: 'all 0.3s ease',
    fontSize: isMobile ? '14px' : '16px',
    '&:hover': {
      borderColor: '#c8e6c9',
      boxShadow: '0 4px 12px rgba(76, 175, 80, 0.1)',
    },
    '&.Mui-focused': {
      borderColor: '#4caf50',
      boxShadow: '0 4px 20px rgba(76, 175, 80, 0.2)',
    },
  },
  '& .MuiInputLabel-root': {
    color: '#4a5568',
    fontWeight: 500,
    fontSize: isMobile ? '12px' : '14px',
    '&.Mui-focused': {
      color: '#4caf50',
    },
    '&.MuiInputLabel-shrink': {
      backgroundColor: '#ffffff',
      paddingLeft: '4px',
      paddingRight: '4px',
      transform: 'translate(14px, -9px) scale(0.75)',
      '&.Mui-focused': {
        color: '#4caf50',
      },
    },
  },
  '& .MuiOutlinedInput-notchedOutline': {
    border: 'none',
  },
  '& .MuiFormHelperText-root': {
    fontSize: isMobile ? '10px' : '12px',
  },
  '& .MuiTypography-root': {
    fontSize: isMobile ? '12px' : 'inherit',
  },
}));

const StyledFormControl = styled(FormControl)(({ theme, isMobile }) => ({
  width: isMobile ? '240px !important' : '270px !important',
  '& .MuiOutlinedInput-root': {
    borderRadius: isMobile ? '8px' : '12px',
    backgroundColor: '#ffffff',
    border: '2px solid #e8f5e8',
    minWidth: isMobile ? '100px' : '200px',
    transition: 'all 0.3s ease',
    fontSize: isMobile ? '14px' : '16px',
    '&:hover': {
      borderColor: '#c8e6c9',
      boxShadow: '0 4px 12px rgba(76, 175, 80, 0.1)',
    },
    '&.Mui-focused': {
      borderColor: '#4caf50',
      boxShadow: '0 4px 20px rgba(76, 175, 80, 0.2)',
    },
  },
  '& .MuiInputLabel-root': {
    color: '#4a5568',
    fontWeight: 500,
    fontSize: isMobile ? '12px' : '14px',
    '&.Mui-focused': {
      color: '#4caf50',
    },
    '&.MuiInputLabel-shrink': {
      backgroundColor: '#ffffff',
      paddingLeft: '4px',
      paddingRight: '4px',
      transform: 'translate(14px, -9px) scale(0.75)',
      '&.Mui-focused': {
        color: '#4caf50',
      },
    },
  },
  '& .MuiOutlinedInput-notchedOutline': {
    border: 'none',
  },
  '& .MuiSelect-select': {
    paddingRight: '48px !important',
    width: isMobile ? '240px !important' : '270px !important',
    fontSize: isMobile ? '14px' : '16px',
  },
}));

const StyledButton = styled(Button)(({ theme, isMobile }) => ({
  borderRadius: isMobile ? '8px' : '12px',
  padding: isMobile ? '8px 16px' : '12px 24px',
  fontWeight: 600,
  textTransform: 'none',
  fontSize: isMobile ? '14px' : '1rem',
  boxShadow: '0 4px 12px rgba(76, 175, 80, 0.3)',
  transition: 'all 0.3s ease',
  '&:hover': {
    transform: 'translateY(-2px)',
    boxShadow: '0 6px 20px rgba(76, 175, 80, 0.4)',
  },
}));


const CombinedInputContainer = styled(Box)(({ theme, isMobile }) => ({
  display: 'flex',
  alignItems: 'flex-start',
  gap: isMobile ? '8px' : '12px',
  width: '100%',
  '& .MuiTextField-root': {
    flex: 1,
  },
  '& .MuiFormControl-root': {
    minWidth: isMobile ? '50px' : '100px',
    width: isMobile ? '50px' : '120px',
  }
}));

const SectionTitle = styled(Typography)(({ theme }) => ({
  fontWeight: 600,
  color: '#2d3748',
  marginBottom: '16px',
  fontSize: '1.25rem',
  borderBottom: '2px solid #e8f5e8',
  paddingBottom: '8px',
}));

// const StyledRadioGroup = styled(RadioGroup)(({ theme }) => ({
//   '& .MuiFormControlLabel-root': {
//     backgroundColor: '#ffffff',
//     margin: '4px',
//     borderRadius: '12px',
//     border: '2px solid #e8f5e8',
//     padding: '8px 16px',
//     transition: 'all 0.3s ease',
//     '&:hover': {
//       borderColor: '#c8e6c9',
//       boxShadow: '0 4px 12px rgba(76, 175, 80, 0.1)',
//     },
//   },
//   '& .MuiRadio-root.Mui-checked + .MuiFormControlLabel-label': {
//     color: '#4caf50',
//     fontWeight: 600,
//   },
// }));

// const InfoBox = styled(Box)(({ theme }) => ({
//   backgroundColor: '#f8fffe',
//   border: '1px solid #e8f5e8',
//   borderRadius: '12px',
//   padding: '16px',
//   marginBottom: '16px',
//   '& .MuiTypography-root': {
//     color: '#4a5568',
//     fontSize: '0.875rem',
//   },
// }));

const StyledDialogActions = styled(DialogActions)(({ theme, isMobile }) => ({
  padding: isMobile ? '16px 20px' : '24px 32px',
  backgroundColor: '#ffffff',
  borderTop: '1px solid #e8f5e8',
  borderRadius: isMobile ? '0 0 12px 12px' : '0 0 20px 20px',
  gap: isMobile ? '8px' : '12px',
  flexDirection: isMobile ? 'column' : 'row',
  '& .MuiButton-root': {
    width: isMobile ? '100%' : 'auto',
  }
}));

const FormSection = styled(Paper)(({ theme }) => ({
  padding: '24px',
  marginBottom: '24px',
  borderRadius: '16px',
  backgroundColor: '#ffffff',
  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)',
  border: '1px solid #e8f5e8',
}));

// Farm icons mapping
const farmIcons = [
  { value: 'agriculture', label: 'Agriculture', icon: <Agriculture sx={{ color: '#8bc34a' }} /> },
  { value: 'grass', label: 'Grass Field', icon: <Grass sx={{ color: '#4caf50' }} /> },
  { value: 'eco', label: 'Eco Farm', icon: <Nature sx={{ color: '#2e7d32' }} /> },
  { value: 'flower', label: 'Flower Farm', icon: <LocalFlorist sx={{ color: '#e91e63' }} /> },
  { value: 'park', label: 'Park Farm', icon: <Park sx={{ color: '#388e3c' }} /> },
  { value: 'terrain', label: 'Terrain', icon: <Terrain sx={{ color: '#795548' }} /> },
  { value: 'nature', label: 'Nature Farm', icon: <Nature sx={{ color: '#689f38' }} /> },
  { value: 'yard', label: 'Yard', icon: <Yard sx={{ color: '#558b2f' }} /> }
];

const CreateFieldForm = ({ open, onClose, onSubmit, editMode = false, initialData = null, farmsList = [] }) => {
  // Debug logging

  // Mobile detection hook
  const isMobile = useIsMobile();

  const { user } = useAuth();
  const navigate = useNavigate();

  // State for license check and upload
  const [checkingLicense, setCheckingLicense] = useState(true);
  const [hasLicense, setHasLicense] = useState(false);
  const [uploadingLicense, setUploadingLicense] = useState(false);
  const [licenseFile, setLicenseFile] = useState(null);

  useEffect(() => {
    // Only verify if open
    if (open) {
      checkLicenseStatus();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps -- run when user or open changes
  }, [user, open]);

  const checkLicenseStatus = async () => {
    if (!user || !user.id || !open) return;

    // Determine status - aligned with AdminUsers logic
    // We check locally first, then API response data
    const status = user.approval_status || (user.is_active ? 'approved' : 'pending');

    // Only check documents if pending
    if (status === 'pending') {
      try {
        setCheckingLicense(true);
        // We can just rely on user.uploaded_documents if available from the new API
        // But for safety, let's fetch or check existing prop if passed
        if (user.uploaded_documents && user.uploaded_documents.length > 0) {
          setHasLicense(true);
          setCheckingLicense(false);
          return;
        }

        const response = await userDocumentsService.getUserDocuments(user.id);
        const docs = response.data || [];
        setHasLicense(docs.length > 0);
      } catch (error) {
        console.error('Error checking documents:', error);
        setHasLicense(false);
      } finally {
        setCheckingLicense(false);
      }
    } else {
      setCheckingLicense(false);
    }
  };

  const handleLicenseFileChange = (e) => {
    if (e.target.files[0]) {
      setLicenseFile(e.target.files[0]);
    }
  };

  const handleLicenseUpload = async () => {
    if (!licenseFile || !user) return;

    try {
      setUploadingLicense(true);
      const file = licenseFile;
      const fileExt = file.name.split('.').pop();
      const fileName = `${uuidv4()}-${file.name}`;
      const filePath = `documents/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('user-documents')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('user-documents')
        .getPublicUrl(filePath);

      await userDocumentsService.addDocument({
        user_id: user.id,
        file_name: file.name,
        file_url: publicUrl,
        file_type: fileExt
      });

      setHasLicense(true);
      setLicenseFile(null);
      // alert('License uploaded successfully! Please wait for admin approval.');
    } catch (error) {
      console.error('Error uploading license:', error);
      alert('Failed to upload license. Please try again.');
    } finally {
      setUploadingLicense(false);
    }
  };

  const handleErrorDirectToFarms = () => {
    onClose();
    navigate('/farmer/my-farms?action=add-farm');
  };

  // Helper function to get farm icon component
  const getFarmIcon = (farmIconValue) => {
    const iconData = farmIcons.find(icon => icon.value === farmIconValue);
    // Return default agriculture icon if no icon is found or farmIconValue is null/undefined
    return iconData ? iconData.icon : <Agriculture sx={{ color: '#8bc34a' }} />;
  };

  const [formData, setFormData] = useState({
    selectedIcon: '',
    category: '',
    subcategory: '',
    productName: '',
    description: '',
    fieldSize: '',
    fieldSizeUnit: 'm²',
    productionRate: '',
    productionRateUnit: 'Kg',
    sellingAmount: '',
    sellingPrice: '',
    retailPrice: '',
    virtualProductionRate: '',
    virtualCostPerUnit: '',
    appFees: '',
    userAreaVirtualRentPrice: '',
    harvestDates: [{ date: '', label: '' }],
    shippingOption: 'Both',
    deliveryTime: '',
    deliveryCharges: [{ upto: '', amount: '' }],
    hasWebcam: false,
    latitude: '',
    longitude: '',
    shippingScope: 'Global',
    farmId: ''
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  // const [expandedSection, setExpandedSection] = useState('basic');
  const [locationPickerOpen, setLocationPickerOpen] = useState(false);

  const categoryData = {
    'Beverages': ['Beer', 'Coffee', 'Juice', 'Milk', 'Soda', 'Teabags', 'Wine'],
    'Bread & Bakery': ['Bagels', 'Bread', 'Cookies', 'Muffins', 'Pies', 'Tortillas'],
    'Canned Goods': ['Fruit', 'Pasta Sauce', 'Soup', 'Vegetables'],
    'Dairy': ['Butter', 'Cheese', 'Eggs', 'Milk'],
    'Deli': ['Cheeses', 'Salami'],
    'Fish & Seafood': ['Bivalves & Clams', 'Crab', 'Fish', 'Lobster', 'Octopus & Squid', 'Shrimp'],
    'Frozen Foods': ['Fish', 'Ice cream', 'Pizza', 'Potatoes', 'Ready Meals'],
    'Fruits': ['Green Apple', 'Red Apple', 'Peach', 'Strawberry', 'Tangerine', 'Watermelon', 'Avocados', 'Mango', 'Grapes', 'Banana'],
    'Vegetables': ['Corn', 'Eggplant', 'Lemon', 'Tomato', 'Broccoli', 'Capsicum', 'Carrot', 'Onions', 'Potatoes', 'Salad Greens'],
    'Meat': ['Bacon', 'Chicken', 'Pork', 'Beef'],
    'Oil': ['Coconut Oil', 'Olive Oil', 'Peanut Oil', 'Sunflower Oil'],
    'Seeds': ['Hibiscus', 'Rice Seeds', 'Rose'],
    'Snacks': ['Nuts', 'Popcorn', 'Pretzels']
  };

  // Show all available categories
  const availableCategories = Object.keys(categoryData);
  const categories = ['Select Category', ...availableCategories];

  // State for location address display
  const [locationAddress, setLocationAddress] = useState('');

  // Update form data when initialData changes
  useEffect(() => {
    if (initialData && editMode) {
      setFormData(prev => ({
        ...prev,
        ...initialData,
        selectedIcon: initialData.icon ? initialData.icon.split('/').pop() : (initialData.image ? initialData.image.split('/').pop() : ''),
        productName: initialData.name || '',
        category: initialData.category || '',
        description: initialData.description || '',
        sellingPrice: initialData.price || '',
        latitude: initialData.latitude || '',
        longitude: initialData.longitude || '',
        harvestDates: initialData.harvestDates || [{ date: '', label: '' }]
      }));
      // Set location address if coordinates exist
      if (initialData.latitude && initialData.longitude) {
        setLocationAddress(initialData.location || `${initialData.latitude}, ${initialData.longitude}`);
      }
    } else if (!editMode) {
      setFormData({
        selectedIcon: '',
        category: '',
        productName: '',
        description: '',
        fieldSize: '',
        fieldSizeUnit: 'm²',
        productionRate: '',
        productionRateUnit: 'Kg',
        sellingAmount: '',
        sellingPrice: '',
        retailPrice: '',
        virtualProductionRate: '',
        virtualCostPerUnit: '',
        appFees: '',
        userAreaVirtualRentPrice: '',
        harvestDates: [{ date: '', label: '' }],
        shippingOption: 'Both',
        deliveryTime: '',
        deliveryCharges: [{ upto: '', amount: '' }],
        hasWebcam: false,
        latitude: '',
        longitude: '',
        shippingScope: '',
        farmId: ''
      });
      // Reset location address for new forms
      setLocationAddress('');
    }
  }, [initialData, editMode]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    // When category changes, reset subcategory safely
    if (field === 'category') {
      setFormData(prev => ({
        ...prev,
        subcategory: ''  // Reset to empty string, not undefined
      }));
    }

    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  // Handle harvest date changes
  const handleHarvestDateChange = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      harvestDates: (prev.harvestDates || []).map((date, i) =>
        i === index ? { ...date, [field]: value } : date
      )
    }));

    if (errors.harvestDates) {
      setErrors(prev => ({
        ...prev,
        harvestDates: ''
      }));
    }
  };

  // Add new harvest date
  const addHarvestDate = () => {
    setFormData(prev => ({
      ...prev,
      harvestDates: [...(prev.harvestDates || []), { date: '', label: '' }]
    }));
  };

  // Remove harvest date
  const removeHarvestDate = (index) => {
    const currentHarvestDates = formData.harvestDates || [];
    if (currentHarvestDates.length > 1) {
      setFormData(prev => ({
        ...prev,
        harvestDates: (prev.harvestDates || []).filter((_, i) => i !== index)
      }));
    }
  };

  // Map subcategory names to icon filenames
  const subcategoryToIconMap = {
    'Green Apple': 'apple_green.png',
    'Red Apple': 'apple_red.png',
    'Corn': 'corn.png',
    'Eggplant': 'eggplant.png',
    'Lemon': 'lemon.png',
    'Peach': 'peach.png',
    'Strawberry': 'strawberry.png',
    'Tangerine': 'tangerine.png',
    'Tomato': 'tomato.png',
    'Watermelon': 'watermelon.png',
    // Additional subcategories with fallback icons
    'Avocados': 'apple_green.png',
    'Mango': 'peach.png',
    'Grapes': 'strawberry.png',
    'Banana': 'tangerine.png',
    'Broccoli': 'eggplant.png',
    'Capsicum': 'tomato.png',
    'Carrot': 'tangerine.png',
    'Onions': 'eggplant.png',
    'Potatoes': 'corn.png',
    'Salad Greens': 'eggplant.png',
  };

  // Get available icons based on selected subcategory
  const getAvailableIcons = () => {
    // Only show icon if subcategory is selected
    if (!formData.subcategory) {
      return [];
    }

    // Get the icon for the selected subcategory
    const iconName = subcategoryToIconMap[formData.subcategory];

    // If icon exists for this subcategory, return it as an array
    if (iconName) {
      return [iconName];
    }

    // If no icon mapping found, return empty array
    return [];
  };

  const getIconPath = (iconName) => {
    if (!iconName) return '';
    // Determine category folder based on selected category
    // Fruits and Vegetables both use the 'fruits' folder for now
    const category = formData.category?.toLowerCase() === 'fruits' || formData.category?.toLowerCase() === 'vegetables'
      ? 'fruits'
      : 'fruits'; // Default to fruits folder
    return `/icons/products/${category}/${iconName}`;
  };

  const addDeliveryCharge = () => {
    setFormData(prev => ({
      ...prev,
      deliveryCharges: [...(prev.deliveryCharges || []), { upto: '', amount: '' }]
    }));
  };

  const removeDeliveryCharge = (index) => {
    setFormData(prev => ({
      ...prev,
      deliveryCharges: (prev.deliveryCharges || []).filter((_, i) => i !== index)
    }));
  };

  const updateDeliveryCharge = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      deliveryCharges: (prev.deliveryCharges || []).map((charge, i) =>
        i === index ? { ...charge, [field]: value } : charge
      )
    }));
  };

  // Handle location selection from LocationPicker
  const handleLocationSelect = (locationData) => {
    // LocationPicker returns { coordinates: [lng, lat], address: string }
    const [lng, lat] = locationData.coordinates;
    setFormData(prev => ({
      ...prev,
      latitude: lat?.toString() || '',
      longitude: lng?.toString() || ''
    }));
    // Store the address for display in the location field
    setLocationAddress(locationData.address || `${lat}, ${lng}`);
    setLocationPickerOpen(false);
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.productName.trim()) newErrors.productName = 'Product name is required';
    if (!formData.category || formData.category === 'Select Category') newErrors.category = 'Category is required';
    if (!formData.subcategory || formData.subcategory === 'Select Sub Category') newErrors.subcategory = 'Sub category is required';
    if (!formData.description.trim()) newErrors.description = 'Description is required';
    if (!formData.fieldSize) newErrors.fieldSize = 'Field size is required';
    if (!formData.productionRate) newErrors.productionRate = 'Production rate is required';
    if (!formData.sellingAmount) newErrors.sellingAmount = 'Selling amount is required';
    if (!formData.sellingPrice) newErrors.sellingPrice = 'Selling price is required';
    if (!formData.retailPrice) newErrors.retailPrice = 'Retail price is required';

    // Validate harvest dates
    const harvestDatesArray = formData.harvestDates || [];
    const hasValidHarvestDate = harvestDatesArray.some(date => date.date && date.date.trim() !== '');
    if (!hasValidHarvestDate) newErrors.harvestDates = 'At least one harvest date is required';

    if (!formData.latitude) newErrors.latitude = 'Latitude is required';
    if (!formData.longitude) newErrors.longitude = 'Longitude is required';
    if (!formData.farmId) newErrors.farmId = 'Please select a farm for this field';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setIsSubmitting(true);

    // Get actual location using reverse geocoding
    let actualLocation = 'Unknown Location';
    try {
      const { cachedReverseGeocode } = await import('../../utils/geocoding');
      actualLocation = await cachedReverseGeocode(
        parseFloat(formData.latitude),
        parseFloat(formData.longitude)
      );
    } catch (error) {
      console.error('Failed to get location:', error);
      // Fallback to coordinates if reverse geocoding fails
      actualLocation = `${parseFloat(formData.latitude).toFixed(4)}, ${parseFloat(formData.longitude).toFixed(4)}`;
    }

    // Convert deliveryCharges array to a single numeric value for database storage
    const getDeliveryChargeValue = (deliveryCharges) => {
      if (!deliveryCharges || !Array.isArray(deliveryCharges) || deliveryCharges.length === 0) {
        return 0;
      }
      // Use the first delivery charge amount, or 0 if not valid
      const firstCharge = deliveryCharges[0];
      return firstCharge && firstCharge.amount ? parseFloat(firstCharge.amount) || 0 : 0;
    };

    const submitData = {
      productName: formData.productName,
      category: formData.category,
      subcategory: formData.subcategory,
      description: formData.description,
      price: parseFloat(formData.sellingPrice),
      latitude: parseFloat(formData.latitude),
      longitude: parseFloat(formData.longitude),
      image: formData.selectedIcon ? getIconPath(formData.selectedIcon) : '',
      icon: formData.selectedIcon ? getIconPath(formData.selectedIcon) : '',
      fieldSize: formData.fieldSize,
      fieldSizeUnit: formData.fieldSizeUnit,
      productionRate: formData.productionRate,
      productionRateUnit: formData.productionRateUnit,
      sellingAmount: formData.sellingAmount,
      retailPrice: parseFloat(formData.retailPrice),
      virtualProductionRate: formData.virtualProductionRate,
      virtualCostPerUnit: formData.virtualCostPerUnit,
      harvestDates: (formData.harvestDates || []).filter(date => date.date && date.date.trim() !== ''),
      shippingOption: formData.shippingOption,
      deliveryTime: formData.deliveryTime,
      deliveryCharges: getDeliveryChargeValue(formData.deliveryCharges), // Convert to numeric value
      hasWebcam: formData.hasWebcam,
      shippingScope: formData.shippingScope,
      farmId: formData.farmId, // Include the selected farm ID
      // Add these default values for popup compatibility:
      coordinates: [parseFloat(formData.longitude), parseFloat(formData.latitude)],
      farmer_name: 'Your Name', // Or get from user profile
      location: actualLocation,
      available_area: formData.fieldSize || 100,
      total_area: formData.fieldSize || 100,
      weather: 'Sunny', // Default weather
      price_per_m2: formData.fieldSize ? (parseFloat(formData.sellingPrice) / parseFloat(formData.fieldSize)) : 0,
      production_rate: formData.productionRate || 0.50,
      shipping_pickup: formData.shippingOption !== 'Shipping',
      shipping_delivery: formData.shippingOption !== 'Pickup',
      harvest_date: (formData.harvestDates || []).length > 0 && formData.harvestDates[0].date ? formData.harvestDates[0].date : '15 Sep, 2025',
      isOwnField: true // Mark as your own field for edit button
    };

    setTimeout(() => {
      onSubmit(submitData);
      setIsSubmitting(false);
      handleClose();
    }, 1000);
  };


  const handleClose = () => {
    setFormData({
      selectedIcon: '',
      category: '',
      subcategory: '',
      productName: '',
      description: '',
      fieldSize: '',
      fieldSizeUnit: 'm²',
      productionRate: '',
      productionRateUnit: 'Kg',
      sellingAmount: '',
      sellingPrice: '',
      retailPrice: '',
      virtualProductionRate: '',
      virtualCostPerUnit: '',
      appFees: '',
      userAreaVirtualRentPrice: '',
      harvestDates: [{ date: '', label: '' }],
      shippingOption: 'Both',
      deliveryTime: '',
      deliveryTimeUnit: 'Days',
      deliveryCharges: [{ upto: '', amount: '' }],
      hasWebcam: false,
      latitude: '',
      longitude: '',
      shippingScope: 'Global',
      farmId: ''
    });
    setErrors({});
    setIsSubmitting(false);
    onClose();
  };

  return (
    <StyledDialog
      open={open}
      onClose={handleClose}
      maxWidth={isMobile ? false : "md"}
      fullWidth={!isMobile}
      isMobile={isMobile}
    >
      <StyledDialogTitle isMobile={isMobile}>
        {editMode ? 'Edit Field' : 'Create New Field'}
        <IconButton
          onClick={handleClose}
          sx={{
            position: 'absolute',
            right: isMobile ? 8 : 16,
            top: isMobile ? 8 : 16,
            color: 'white',
            '& .MuiSvgIcon-root': {
              fontSize: isMobile ? '18px' : '20px'
            }
          }}
        >
          <Close />
        </IconButton>
      </StyledDialogTitle>

      <StyledDialogContent isMobile={isMobile}>
        {/* Conditional Rendering Logic */}
        {(() => {
          const status = user?.approval_status || (user?.is_active ? 'approved' : 'pending');

          if (checkingLicense) {
            return (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <Typography color="textSecondary">Checking eligibility...</Typography>
              </Box>
            );
          }

          if (status === 'pending' && !hasLicense) {
            return (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <Typography variant="h4" sx={{ mb: 2, fontSize: '3rem' }}>⚠️</Typography>
                <Typography variant="h6" gutterBottom>Action Required</Typography>
                <Typography variant="body1" color="textSecondary" paragraph>
                  Please upload your farming license to be eligible for adding fields.
                </Typography>
                <Box sx={{ my: 3, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <Button
                    variant="outlined"
                    component="label"
                    sx={{ mb: 2 }}
                  >
                    Choose License File
                    <input
                      type="file"
                      hidden
                      onChange={handleLicenseFileChange}
                      accept=".pdf,.jpg,.jpeg,.png"
                    />
                  </Button>
                  {licenseFile && (
                    <Typography variant="body2" color="primary" sx={{ mb: 2 }}>
                      Selected: {licenseFile.name}
                    </Typography>
                  )}
                  <Button
                    variant="contained"
                    color="primary"
                    disabled={!licenseFile || uploadingLicense}
                    onClick={handleLicenseUpload}
                  >
                    {uploadingLicense ? 'Uploading...' : 'Upload License'}
                  </Button>
                </Box>
              </Box>
            );
          }

          if (status === 'pending' && hasLicense) {
            return (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <Typography variant="h4" sx={{ mb: 2, fontSize: '3rem' }}>ℹ️</Typography>
                <Typography variant="h6" gutterBottom>Verification Pending</Typography>
                <Typography variant="body1" color="textSecondary" paragraph>
                  Please wait for the approval from admin.
                </Typography>
                <Typography variant="caption" color="textSecondary">
                  Your license has been uploaded and is under review.
                </Typography>
              </Box>
            );
          }

          if (status === 'approved' && (!farmsList || farmsList.length === 0)) {
            return (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <Typography variant="h4" sx={{ mb: 2, fontSize: '3rem' }}>🏠</Typography>
                <Typography variant="h6" gutterBottom>No Farms Found</Typography>
                <Typography variant="body1" color="textSecondary" paragraph>
                  You need to create a farm before you can add any fields.
                </Typography>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={handleErrorDirectToFarms}
                  sx={{ mt: 2 }}
                >
                  Create My First Farm
                </Button>
              </Box>
            );
          }

          // Render normal form if approved and has farms
          return (
            <Box sx={{ width: '100%' }}>
              {/* Basic Information Section */}
              <FormSection>
                <SectionTitle sx={{ fontSize: isMobile ? '16px' : '1.5rem' }}>Basic Information</SectionTitle>
                <Grid container spacing={3}>
                  {/* Farm Selection Dropdown */}
                  <Grid item xs={12}>
                    <StyledFormControl fullWidth error={!!errors.farmId} sx={{ maxWidth: isMobile ? '240px !important' : '270px' }} isMobile={isMobile}>
                      <InputLabel sx={{ fontWeight: 500 }}>Select Farm</InputLabel>
                      <Select
                        value={formData.farmId ?? ''}
                        onChange={(e) => handleInputChange('farmId', e.target.value)}
                        label="Select Farm"
                        MenuProps={{
                          PaperProps: {
                            style: {
                              borderRadius: '8px',
                              border: '1px solid #e8f5e8',
                              boxShadow: '0 4px 16px rgba(0, 0, 0, 0.1)',
                              marginTop: '2px',
                              maxHeight: '200px',
                              overflowY: 'auto',
                              width: '240px',
                              minWidth: '240px',
                              maxWidth: '240px',
                            },
                            sx: {
                              '&::-webkit-scrollbar': {
                                width: '6px',
                              },
                              '&::-webkit-scrollbar-track': {
                                backgroundColor: '#f1f1f1',
                                borderRadius: '3px',
                              },
                              '&::-webkit-scrollbar-thumb': {
                                backgroundColor: '#c1c1c1',
                                borderRadius: '3px',
                                '&:hover': {
                                  backgroundColor: '#a8a8a8',
                                },
                              },
                              '&::-webkit-scrollbar-thumb:active': {
                                backgroundColor: '#888',
                              },
                            },
                          },
                          anchorOrigin: {
                            vertical: 'bottom',
                            horizontal: 'left',
                          },
                          transformOrigin: {
                            vertical: 'top',
                            horizontal: 'left',
                          },
                        }}
                        renderValue={(selected) => {
                          if (!selected) return '';
                          const selectedFarm = farmsList.find(farm => farm.id === selected);
                          if (!selectedFarm) return '';
                          return (
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              {getFarmIcon(selectedFarm.farmIcon)}
                              <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                {selectedFarm.farmName}
                              </Typography>
                            </Box>
                          );
                        }}
                      >
                        <MenuItem
                          value=""
                          disabled
                          sx={{
                            padding: '8px 12px',
                            borderRadius: '6px',
                            margin: '2px 4px',
                            color: '#9ca3af',
                            fontStyle: 'italic',
                            fontSize: '0.875rem',
                            minHeight: 'auto',
                          }}
                        >
                          Choose a farm for this field
                        </MenuItem>
                        {farmsList.map((farm) => (
                          <MenuItem
                            key={farm.id}
                            value={farm.id}
                            sx={{
                              padding: '8px 12px',
                              borderRadius: '6px',
                              margin: '2px 4px',
                              transition: 'all 0.2s ease',
                              minHeight: 'auto',
                              '&:hover': {
                                backgroundColor: '#f1f8e9',
                                borderRadius: '6px',
                              },
                              '&.Mui-selected': {
                                backgroundColor: '#e8f5e8',
                                '&:hover': {
                                  backgroundColor: '#e1f5e1',
                                },
                              },
                            }}
                          >
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, width: '100%' }}>
                              <Box sx={{ fontSize: '1rem' }}>
                                {getFarmIcon(farm.farmIcon || 'agriculture')}
                              </Box>
                              <Box sx={{ flex: 1 }}>
                                <Typography variant="body2" sx={{ fontWeight: 500, color: '#2d3748', fontSize: '0.875rem', lineHeight: 1.2 }}>
                                  {farm.farmName || 'Unnamed Farm'}
                                </Typography>
                                <Typography variant="caption" sx={{ color: '#718096', fontSize: '0.75rem', lineHeight: 1.1 }}>
                                  {formatLocationDisplay(farm.location || 'Location not set')}
                                </Typography>
                              </Box>
                            </Box>
                          </MenuItem>
                        ))}
                      </Select>
                      {errors.farmId && (
                        <Typography variant="caption" color="error" sx={{ mt: 0.5, display: 'block' }}>
                          {errors.farmId}
                        </Typography>
                      )}
                    </StyledFormControl>
                  </Grid>

                  {/* Category Dropdown */}
                  <Grid item xs={12}>
                    <StyledFormControl fullWidth error={!!errors.category} isMobile={isMobile}>
                      <InputLabel sx={{ fontWeight: 500 }}>Select Category</InputLabel>
                      <Select
                        value={formData.category ?? ''}
                        onChange={(e) => {
                          const selectedCategory = e.target.value;
                          handleInputChange('category', selectedCategory);
                          // Reset subcategory when category changes
                          if (selectedCategory === 'Select Category' || selectedCategory === '') {
                            handleInputChange('subcategory', '');
                          } else {
                            // Use empty string placeholder so the Select value is valid
                            handleInputChange('subcategory', '');
                          }
                        }}
                        label="Select Category"
                        MenuProps={{
                          PaperProps: {
                            style: {
                              borderRadius: '8px',
                              border: '1px solid #e0e0e0',
                              boxShadow: '0 4px 16px rgba(0, 0, 0, 0.1)',
                              marginTop: '2px',
                              maxHeight: '200px',
                              width: '240px',
                              minWidth: '240px',
                              maxWidth: '240px',
                            },
                            sx: {
                              '& .MuiList-root': {
                                padding: '4px',
                              },
                              '&::-webkit-scrollbar': {
                                width: '6px',
                              },
                              '&::-webkit-scrollbar-track': {
                                backgroundColor: '#f5f5f5',
                                borderRadius: '3px',
                              },
                              '&::-webkit-scrollbar-thumb': {
                                backgroundColor: '#c1c1c1',
                                borderRadius: '3px',
                                '&:hover': {
                                  backgroundColor: '#a8a8a8',
                                },
                                '&:active': {
                                  backgroundColor: '#8e8e8e',
                                },
                              },
                            },
                          },
                          anchorOrigin: {
                            vertical: 'bottom',
                            horizontal: 'left',
                          },
                          transformOrigin: {
                            vertical: 'top',
                            horizontal: 'left',
                          },
                        }}
                      >
                        {categories && Array.isArray(categories) && categories
                          .filter(category => category != null) // Filter out null/undefined categories
                          .map((category) => (
                            <MenuItem
                              key={category}
                              value={category}
                              disabled={category === 'Select Category'}
                              sx={{
                                padding: '8px 12px',
                                borderRadius: '6px',
                                margin: '2px 4px',
                                fontSize: '0.875rem',
                                minHeight: 'auto',
                                '&:hover': {
                                  backgroundColor: '#f5f5f5',
                                },
                                '&.Mui-selected': {
                                  backgroundColor: '#e8f5e8',
                                  '&:hover': {
                                    backgroundColor: '#d4edda',
                                  },
                                },
                              }}
                            >
                              {category || 'Unknown Category'}
                            </MenuItem>
                          ))}
                      </Select>
                    </StyledFormControl>
                  </Grid>

                  {/* Sub Category Dropdown */}
                  <Grid item xs={12} md={6}>
                    <StyledFormControl
                      fullWidth
                      error={!!errors.subcategory}
                      disabled={!formData.category || formData.category === 'Select Category'}
                      isMobile={isMobile}
                    >
                      <InputLabel sx={{ fontWeight: 500 }}>Select Sub Category</InputLabel>
                      <Select
                        value={formData.subcategory || ''}  // Ensure value is never undefined
                        onChange={(e) => {
                          const newSubcategory = e.target.value;
                          handleInputChange('subcategory', newSubcategory);
                          // Auto-select the icon for the selected subcategory
                          const iconForSubcategory = subcategoryToIconMap[newSubcategory];
                          if (iconForSubcategory) {
                            handleInputChange('selectedIcon', iconForSubcategory);
                          } else {
                            handleInputChange('selectedIcon', '');
                          }
                        }}
                        label="Select Sub Category"
                        disabled={!formData.category || formData.category === 'Select Category'}
                        MenuProps={{
                          PaperProps: {
                            style: {
                              borderRadius: '8px',
                              border: '1px solid #e0e0e0',
                              boxShadow: '0 4px 16px rgba(0, 0, 0, 0.1)',
                              marginTop: '2px',
                              maxHeight: '200px',
                              width: '240px',
                              minWidth: '240px',
                              maxWidth: '240px',
                            },
                          },
                        }}
                      >
                        <MenuItem value="" disabled>
                          <Typography sx={{ color: '#9e9e9e', fontSize: '0.875rem' }}>
                            Select Sub Category
                          </Typography>
                        </MenuItem>
                        {formData.category &&
                          formData.category !== 'Select Category' &&
                          categoryData[formData.category] &&
                          Array.isArray(categoryData[formData.category]) &&
                          categoryData[formData.category]
                            .filter(subcategory => subcategory != null && subcategory.trim() !== '')
                            .map((subcategory, index) => (
                              <MenuItem
                                key={subcategory || `subcat-${index}`}
                                value={subcategory}
                                sx={{
                                  padding: '8px 12px',
                                  borderRadius: '6px',
                                  margin: '2px 4px',
                                  fontSize: '0.875rem',
                                  minHeight: 'auto',
                                  '&:hover': {
                                    backgroundColor: '#f5f5f5',
                                  },
                                  '&.Mui-selected': {
                                    backgroundColor: '#e8f5e8',
                                    '&:hover': {
                                      backgroundColor: '#d4edda',
                                    },
                                  },
                                }}
                              >
                                {subcategory || 'Unknown Subcategory'}
                              </MenuItem>
                            ))
                        }
                      </Select>
                    </StyledFormControl>
                  </Grid>

                  {/* Product Icon Selector - Compact inline display below subcategory */}
                  {formData.subcategory && getAvailableIcons().length > 0 && (
                    <Grid item xs={12} md={6}>
                      <Box sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1.5,
                        height: '100%',
                        pt: { xs: 0, md: 0 }
                      }}>
                        <Typography variant="body2" sx={{
                          fontWeight: 500,
                          color: 'text.primary',
                          whiteSpace: 'nowrap',
                          fontSize: '0.875rem',
                          minWidth: 'fit-content'
                        }}>
                          Icon:
                        </Typography>
                        <Box sx={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 1,
                          flex: 1
                        }}>
                          {getAvailableIcons().map((iconName) => {
                            const iconPath = getIconPath(iconName);
                            const isSelected = formData.selectedIcon === iconName;
                            return (
                              <Box
                                key={iconName}
                                onClick={() => handleInputChange('selectedIcon', iconName)}
                                sx={{
                                  position: 'relative',
                                  width: { xs: 44, sm: 48, md: 52 },
                                  height: { xs: 44, sm: 48, md: 52 },
                                  border: isSelected ? '2px solid' : '1.5px solid',
                                  borderColor: isSelected ? '#4CAF50' : '#e0e0e0',
                                  borderRadius: 1.25,
                                  p: 0.5,
                                  cursor: 'pointer',
                                  transition: 'all 0.2s ease',
                                  bgcolor: isSelected ? 'rgba(76,175,80,0.08)' : '#fafafa',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  flexShrink: 0,
                                  '&:hover': {
                                    borderColor: '#4CAF50',
                                    bgcolor: 'rgba(76,175,80,0.12)',
                                    transform: 'scale(1.08)',
                                  }
                                }}
                              >
                                <Box
                                  component="img"
                                  src={iconPath}
                                  alt={iconName.replace('.png', '').replace('_', ' ')}
                                  sx={{
                                    width: '100%',
                                    height: '100%',
                                    objectFit: 'contain',
                                    maxWidth: { xs: 32, sm: 36, md: 40 },
                                    maxHeight: { xs: 32, sm: 36, md: 40 },
                                  }}
                                />
                                {isSelected && (
                                  <Box
                                    sx={{
                                      position: 'absolute',
                                      top: -4,
                                      right: -4,
                                      width: 16,
                                      height: 16,
                                      borderRadius: '50%',
                                      bgcolor: '#4CAF50',
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      color: 'white',
                                      fontSize: 9,
                                      fontWeight: 'bold',
                                      border: '2px solid white',
                                      boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                                    }}
                                  >
                                    ✓
                                  </Box>
                                )}
                              </Box>
                            );
                          })}
                        </Box>
                        {errors.selectedIcon && (
                          <Typography variant="caption" color="error" sx={{ mt: 0.5, display: 'block' }}>
                            {errors.selectedIcon}
                          </Typography>
                        )}
                      </Box>
                    </Grid>
                  )}

                  {/* Product Name - Full width below subcategory and icon */}
                  <Grid item xs={12} sx={{ mt: { xs: 1, md: 1 } }}>
                    <StyledTextField
                      fullWidth
                      label="Product Name"
                      placeholder="The Name of The Product"
                      value={formData.productName}
                      onChange={(e) => handleInputChange('productName', e.target.value)}
                      error={!!errors.productName}
                      helperText={errors.productName}
                      isMobile={isMobile}
                    />
                  </Grid>

                  {/* Product Description - Full width, under Product Name */}
                  <Grid item xs={12} sx={{ mt: { xs: 0, md: 0 } }}>
                    <StyledTextField
                      fullWidth
                      label="Description"
                      placeholder="The Description of The Product"
                      value={formData.description}
                      onChange={(e) => handleInputChange('description', e.target.value)}
                      error={!!errors.description}
                      helperText={errors.description}
                      isMobile={isMobile}
                    />
                  </Grid>
                </Grid>
              </FormSection>

              {/* Field Details Section */}
              <FormSection>
                <SectionTitle sx={{ fontSize: isMobile ? '16px' : '1.5rem' }}>Field Details</SectionTitle>
                <Grid container spacing={isMobile ? 2 : 3}>
                  {/* Field Size with Unit */}
                  <Grid item xs={12} md={6}>
                    {isMobile ? (
                      <StyledTextField
                        fullWidth
                        label="Field Size"
                        placeholder={`How big is your field (${formData.fieldSizeUnit})`}
                        value={formData.fieldSize}
                        onChange={(e) => handleInputChange('fieldSize', e.target.value)}
                        error={!!errors.fieldSize}
                        helperText={errors.fieldSize}
                        isMobile={isMobile}
                        InputProps={{
                          endAdornment: (
                            <InputAdornment position="end">
                              <Select
                                value={formData.fieldSizeUnit}
                                onChange={(e) => handleInputChange('fieldSizeUnit', e.target.value)}
                                variant="standard"
                                disableUnderline
                                sx={{
                                  fontSize: '12px',
                                  '& .MuiSelect-select': {
                                    paddingRight: '20px !important',
                                  }
                                }}
                              >
                                <MenuItem value="m²">m²</MenuItem>
                                <MenuItem value="acres">acres</MenuItem>
                                <MenuItem value="hectares">hectares</MenuItem>
                              </Select>
                            </InputAdornment>
                          )
                        }}
                      />
                    ) : (
                      <CombinedInputContainer isMobile={isMobile}>
                        <StyledTextField
                          label="Field Size"
                          placeholder="How big is your field"
                          value={formData.fieldSize}
                          onChange={(e) => handleInputChange('fieldSize', e.target.value)}
                          error={!!errors.fieldSize}
                          helperText={errors.fieldSize}
                          isMobile={isMobile}
                        />
                        <StyledFormControl isMobile={isMobile}>
                          <InputLabel>Unit</InputLabel>
                          <Select
                            value={formData.fieldSizeUnit}
                            onChange={(e) => handleInputChange('fieldSizeUnit', e.target.value)}
                            label="Unit"
                          >
                            <MenuItem value="m²">m²</MenuItem>
                            <MenuItem value="acres">acres</MenuItem>
                            <MenuItem value="hectares">hectares</MenuItem>
                          </Select>
                        </StyledFormControl>
                      </CombinedInputContainer>
                    )}
                  </Grid>

                  {/* Production Rate with Unit */}
                  <Grid item xs={12} md={6}>
                    {isMobile ? (
                      <StyledTextField
                        fullWidth
                        label="Production Rate"
                        placeholder={`Usual production per harvest (${formData.productionRateUnit})`}
                        value={formData.productionRate}
                        onChange={(e) => handleInputChange('productionRate', e.target.value)}
                        error={!!errors.productionRate}
                        helperText={errors.productionRate}
                        isMobile={isMobile}
                        InputProps={{
                          endAdornment: (
                            <InputAdornment position="end">
                              <Select
                                value={formData.productionRateUnit}
                                onChange={(e) => handleInputChange('productionRateUnit', e.target.value)}
                                variant="standard"
                                disableUnderline
                                sx={{
                                  fontSize: '10px',
                                  '& .MuiSelect-select': {
                                    paddingRight: '20px !important',
                                  }
                                }}
                              >
                                <MenuItem value="Kg">Kg</MenuItem>
                                <MenuItem value="tons">tons</MenuItem>
                                <MenuItem value="lbs">lbs</MenuItem>
                              </Select>
                            </InputAdornment>
                          )
                        }}
                      />
                    ) : (
                      <CombinedInputContainer isMobile={isMobile}>
                        <StyledTextField
                          label="Production Rate"
                          placeholder="Usual production per harvest"
                          value={formData.productionRate}
                          onChange={(e) => handleInputChange('productionRate', e.target.value)}
                          error={!!errors.productionRate}
                          helperText={errors.productionRate}
                          isMobile={isMobile}
                        />
                        <StyledFormControl isMobile={isMobile}>
                          <InputLabel>Unit</InputLabel>
                          <Select
                            value={formData.productionRateUnit}
                            onChange={(e) => handleInputChange('productionRateUnit', e.target.value)}
                            label="Unit"
                          >
                            <MenuItem value="Kg">Kg</MenuItem>
                            <MenuItem value="tons">tons</MenuItem>
                            <MenuItem value="lbs">lbs</MenuItem>
                          </Select>
                        </StyledFormControl>
                      </CombinedInputContainer>
                    )}
                  </Grid>

                  {/* Location Selection - Single field */}
                  <Grid item xs={12}>
                    <StyledTextField
                      fullWidth
                      label="Select Location"
                      placeholder="Click the pin icon to select your field location"
                      value={locationAddress}
                      InputProps={{
                        readOnly: true,
                        endAdornment: (
                          <InputAdornment position="end">
                            <IconButton
                              onClick={() => setLocationPickerOpen(true)}
                              sx={{
                                color: '#4CAF50',
                                padding: isMobile ? '6px' : '8px',
                                '& .MuiSvgIcon-root': {
                                  fontSize: isMobile ? '20px' : '20px'
                                },
                                '&:hover': {
                                  backgroundColor: 'rgba(76, 175, 80, 0.1)'
                                }
                              }}
                            >
                              <LocationOn />
                            </IconButton>
                          </InputAdornment>
                        )
                      }}
                      error={!!errors.latitude || !!errors.longitude}
                      helperText={errors.latitude || errors.longitude || "Select your field location using the map"}
                      sx={{
                        '& .MuiInputBase-input': {
                          cursor: 'pointer'
                        }
                      }}
                      onClick={() => setLocationPickerOpen(true)}
                      isMobile={isMobile}
                    />
                  </Grid>

                  {/* Harvest Dates */}
                  <Grid item xs={12}>
                    <Typography variant="body1" sx={{ mb: 2, fontWeight: 500, color: '#2d3748', fontSize: isMobile ? '14px' : '0.875rem' }} >
                      Estimated Harvest Dates
                    </Typography>
                    {(formData.harvestDates || []).map((harvestDate, index) => (
                      <Box key={index} sx={{
                        mb: 2,
                        p: isMobile ? 0 : 2,
                        border: isMobile ? 'none' : '1px solid #e2e8f0',
                        borderRadius: isMobile ? 0 : '8px'
                      }}>
                        {isMobile ? (
                          // Mobile Layout - Clean vertical stack without outer box
                          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                            {/* Date field - full width */}
                            <StyledTextField
                              fullWidth
                              type="date"
                              label="Date"
                              value={harvestDate?.date ?? ''}
                              onChange={(e) => handleHarvestDateChange(index, 'date', e.target.value)}
                              InputLabelProps={{ shrink: true }}
                              isMobile={isMobile}
                            />

                            {/* Label field with icons positioned at bottom right */}
                            <Box sx={{ position: 'relative' }}>
                              <StyledTextField
                                fullWidth
                                label="Label (optional)"
                                placeholder="e.g., First harvest, Main crop"
                                value={harvestDate?.label ?? ''}
                                onChange={(e) => handleHarvestDateChange(index, 'label', e.target.value)}
                                isMobile={isMobile}
                              />

                              {/* Icons positioned at bottom right of label field */}
                              <Box sx={{
                                position: 'absolute',
                                top: 40,
                                right: 8,
                                display: 'flex',
                                gap: 0.5,
                                zIndex: 1
                              }}>
                                {index === (formData.harvestDates || []).length - 1 && (
                                  <IconButton
                                    onClick={addHarvestDate}
                                    size="small"
                                    sx={{
                                      color: '#4caf50',
                                      backgroundColor: '#e8f5e8',
                                      '&:hover': { backgroundColor: '#c8e6c9' },
                                      width: 28,
                                      height: 28,
                                      minWidth: 28
                                    }}
                                  >
                                    <Add sx={{ fontSize: 16 }} />
                                  </IconButton>
                                )}
                                {(formData.harvestDates || []).length > 1 && (
                                  <IconButton
                                    onClick={() => removeHarvestDate(index)}
                                    size="small"
                                    sx={{
                                      color: '#f44336',
                                      backgroundColor: '#ffebee',
                                      '&:hover': { backgroundColor: '#ffcdd2' },
                                      width: 28,
                                      height: 28,
                                      minWidth: 28
                                    }}
                                  >
                                    <Remove sx={{ fontSize: 16 }} />
                                  </IconButton>
                                )}
                              </Box>
                            </Box>
                          </Box>
                        ) : (
                          // Desktop Layout - Horizontal
                          <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-end' }}>
                            <Box sx={{ flex: '1 1 40%' }}>
                              <StyledTextField
                                fullWidth
                                type="date"
                                label="Date"
                                value={harvestDate?.date ?? ''}
                                onChange={(e) => handleHarvestDateChange(index, 'date', e.target.value)}
                                InputLabelProps={{ shrink: true }}
                                isMobile={isMobile}
                              />
                            </Box>
                            <Box sx={{ flex: '1 1 40%' }}>
                              <StyledTextField
                                fullWidth
                                label="Label (optional)"
                                placeholder="e.g., First harvest, Main crop"
                                value={harvestDate?.label ?? ''}
                                onChange={(e) => handleHarvestDateChange(index, 'label', e.target.value)}
                                isMobile={isMobile}
                              />
                            </Box>
                            <Box sx={{ flex: '0 0 auto', display: 'flex', gap: 1 }}>
                              {index === (formData.harvestDates || []).length - 1 && (
                                <IconButton
                                  onClick={addHarvestDate}
                                  sx={{
                                    color: '#4caf50',
                                    backgroundColor: '#e8f5e8',
                                    '&:hover': { backgroundColor: '#c8e6c9' }
                                  }}
                                >
                                  <Add />
                                </IconButton>
                              )}
                              {(formData.harvestDates || []).length > 1 && (
                                <IconButton
                                  onClick={() => removeHarvestDate(index)}
                                  sx={{
                                    color: '#f44336',
                                    backgroundColor: '#ffebee',
                                    '&:hover': { backgroundColor: '#ffcdd2' }
                                  }}
                                >
                                  <Remove />
                                </IconButton>
                              )}
                            </Box>
                          </Box>
                        )}
                      </Box>
                    ))}
                    {errors.harvestDates && (
                      <Typography variant="caption" color="error" sx={{ mt: 1, display: 'block' }}>
                        {errors.harvestDates}
                      </Typography>
                    )}
                  </Grid>

                  {/* Webcam Option */}
                  <Grid item xs={12}>
                    <Typography variant="body1" sx={{ mb: 2, fontWeight: 500, color: '#2d3748', fontSize: isMobile ? '14px' : '0.875rem' }}>
                      Do you have a Webcam on the field?
                    </Typography>
                    <RadioGroup
                      row
                      value={formData.hasWebcam ? 'Yes' : 'No'}
                      onChange={(e) => handleInputChange('hasWebcam', e.target.value === 'Yes')}
                      sx={{
                        gap: isMobile ? 1.5 : 3,
                        justifyContent: 'center',
                        '& .MuiFormControlLabel-root': {
                          margin: 0,
                          padding: isMobile ? '8px 16px' : '12px 24px',
                          paddingLeft: '8px',
                          borderRadius: '12px',
                          border: '2px solid #e2e8f0',
                          backgroundColor: '#f8fafc',
                          transition: 'all 0.2s ease',
                          minWidth: isMobile ? 'auto' : 'unset',
                          flex: isMobile ? '0 0 auto' : 'unset',
                          '&:hover': {
                            backgroundColor: '#e8f5e8',
                            borderColor: '#4caf50'
                          },
                          '& .MuiTypography-root': {
                            fontSize: isMobile ? '14px' : '1rem'
                          }
                        }
                      }}
                    >
                      <FormControlLabel value="Yes" control={<Radio sx={{ color: '#4caf50' }} />} label="Yes" />
                      <FormControlLabel value="No" control={<Radio sx={{ color: '#4caf50' }} />} label="No" />
                    </RadioGroup>
                  </Grid>
                </Grid>
              </FormSection>

              {/* Pricing Information Section */}
              <FormSection>
                <SectionTitle sx={{ fontSize: isMobile ? '16px' : '1.5rem' }}>Pricing Information</SectionTitle>
                <Grid container spacing={3}>
                  {/* Selling Amount */}
                  <Grid item xs={12}>
                    <StyledTextField
                      fullWidth
                      label="Selling Amount"
                      placeholder="How much product to sell by app?"
                      value={formData.sellingAmount}
                      onChange={(e) => handleInputChange('sellingAmount', e.target.value)}
                      error={!!errors.sellingAmount}
                      helperText={errors.sellingAmount}
                      InputProps={{
                        endAdornment: <InputAdornment position="end">Kg</InputAdornment>
                      }}
                      isMobile={isMobile}
                    />
                  </Grid>

                  {/* Selling Price */}
                  <Grid item xs={12}>
                    <StyledTextField
                      fullWidth
                      label="Selling Price"
                      placeholder="How much do you sell your product to the app?"
                      value={formData.sellingPrice}
                      onChange={(e) => handleInputChange('sellingPrice', e.target.value)}
                      error={!!errors.sellingPrice}
                      helperText={errors.sellingPrice || "Suggested product price on the app $/Kg"}
                      InputProps={{
                        endAdornment: <InputAdornment position="end">$/Kg</InputAdornment>
                      }}
                      isMobile={isMobile}
                    />
                  </Grid>

                  {/* Retail Price */}
                  <Grid item xs={12}>
                    <StyledTextField
                      fullWidth
                      label="Retail Price"
                      placeholder="What is the retail price in the supermarket?"
                      value={formData.retailPrice}
                      onChange={(e) => handleInputChange('retailPrice', e.target.value)}
                      error={!!errors.retailPrice}
                      helperText={errors.retailPrice}
                      InputProps={{
                        endAdornment: <InputAdornment position="end">$/Kg</InputAdornment>
                      }}
                      isMobile={isMobile}
                    />
                  </Grid>

                  {/* Virtual Production Rate */}
                  <Grid item xs={12}>
                    <StyledTextField
                      fullWidth
                      label="Virtual Production Rate"
                      placeholder="How much do you want to sell your product to users?"
                      value={formData.virtualProductionRate}
                      onChange={(e) => handleInputChange('virtualProductionRate', e.target.value)}
                      isMobile={isMobile}
                      helperText="This is your virtual production rate per area (Kg/m²)"
                      InputProps={{
                        endAdornment: <InputAdornment position="end">$/Kg</InputAdornment>
                      }}
                    />
                  </Grid>

                  {/* Virtual Cost Per Unit */}
                  <Grid item xs={12}>
                    <Typography variant="body2" sx={{
                      color: '#666',
                      fontStyle: 'italic',
                      mb: 1,
                      pl: 1,
                      display: isMobile ? 'none' : 'block'
                    }}>
                      This is your virtual cost of your land (per unit): $/m²
                    </Typography>
                  </Grid>

                  {/* App Fees */}
                  <Grid item xs={12}>
                    <Typography variant="body2" sx={{
                      color: '#666',
                      fontStyle: 'italic',
                      mb: 1,
                      pl: 1,
                      display: isMobile ? 'none' : 'block'
                    }}>
                      These are the app fees: $
                    </Typography>
                  </Grid>

                  {/* User Area Virtual Rent Price */}
                  <Grid item xs={12}>
                    <Typography variant="body2" sx={{
                      color: '#666',
                      fontStyle: 'italic',
                      mb: 1,
                      pl: 1,
                      display: isMobile ? 'none' : 'block'
                    }}>
                      This is the user area virtual "rent" price per unit: $/m²
                    </Typography>
                  </Grid>
                </Grid>
              </FormSection>

              {/* Shipping & Delivery Section */}
              <FormSection>
                <SectionTitle sx={{ fontSize: isMobile ? '16px' : '1.5rem' }}>Shipping & Delivery</SectionTitle>
                <Grid container spacing={3}>
                  {/* Shipping Options */}
                  <Grid item xs={12}>
                    <Typography variant="body1" sx={{ mb: 2, fontWeight: 500, fontSize: isMobile ? '14px' : '0.875rem' }}>
                      Shipping Options
                    </Typography>
                    <RadioGroup
                      row
                      value={formData.shippingOption}
                      onChange={(e) => handleInputChange('shippingOption', e.target.value)}
                      sx={{
                        display: 'flex',
                        gap: 2,
                        '& .MuiFormControlLabel-root': {
                          flex: 1,
                          margin: 0,
                          padding: 2,
                          border: '1px solid #e0e0e0',
                          borderRadius: 2,
                          '&:hover': {
                            backgroundColor: '#f5f5f5'
                          }
                        }
                      }}
                    >
                      <FormControlLabel
                        value="Shipping"
                        control={<Radio />}
                        label="Shipping"
                        sx={{ textAlign: 'center' }}
                      />
                      <FormControlLabel
                        value="Pickup"
                        control={<Radio />}
                        label="Pickup"
                        sx={{ textAlign: 'center' }}
                      />
                      <FormControlLabel
                        value="Both"
                        control={<Radio />}
                        label="Both"
                        sx={{ textAlign: 'center' }}
                      />
                    </RadioGroup>
                  </Grid>

                  {/* Delivery Date */}
                  <Grid item xs={12} >
                    <Typography variant="body1" sx={{ mb: 2, fontWeight: 500, color: '#2d3748', fontSize: isMobile ? '14px' : '0.875rem' }} >
                      Estimated Delivery Time
                    </Typography>
                    <StyledTextField
                      fullWidth
                      type="date"
                      label="Delivery Time"
                      value={formData.deliveryTime}
                      onChange={(e) => handleInputChange('deliveryTime', e.target.value)}
                      InputLabelProps={{ shrink: true }}
                      helperText="Choose the expected delivery date after harvest"
                      isMobile={isMobile}
                    />
                  </Grid>

                  {/* Delivery Charges */}
                  <Grid item xs={12}>
                    <Typography variant="body1" sx={{ mb: 2, fontWeight: 500, color: '#2d3748' }}>
                      Enter your delivery charges
                    </Typography>
                    {(formData.deliveryCharges || []).map((charge, index) => (
                      <Box key={index} sx={{ display: 'flex', gap: 2, mb: 2, alignItems: 'center' }}>
                        <StyledTextField
                          label="Upto"
                          placeholder="Upto"
                          value={charge?.upto ?? ''}
                          onChange={(e) => updateDeliveryCharge(index, 'upto', e.target.value)}
                          InputProps={{
                            endAdornment: <InputAdornment position="end">Kg</InputAdornment>
                          }}
                          sx={{ flex: 1 }}
                          isMobile={isMobile}
                        />
                        <StyledTextField
                          label="Amount"
                          placeholder="Amount"
                          value={charge?.amount ?? ''}
                          onChange={(e) => updateDeliveryCharge(index, 'amount', e.target.value)}
                          InputProps={{
                            endAdornment: <InputAdornment position="end">$</InputAdornment>
                          }}
                          sx={{ flex: 1 }}
                          isMobile={isMobile}
                        />
                        {(formData.deliveryCharges || []).length > 1 && (
                          <IconButton
                            onClick={() => removeDeliveryCharge(index)}
                            sx={{
                              color: '#f56565',
                              backgroundColor: '#fed7d7',
                              '&:hover': {
                                backgroundColor: '#feb2b2'
                              }
                            }}
                          >
                            <Remove />
                          </IconButton>
                        )}
                      </Box>
                    ))}
                    <StyledButton
                      startIcon={<Add />}
                      onClick={addDeliveryCharge}
                      variant="outlined"
                      sx={{ mt: 1, fontSize: isMobile ? '12px' : '0.875rem' }}
                    >
                      Add More
                    </StyledButton>
                  </Grid>

                  {/* Shipping Scope */}
                  <Grid item xs={12}>
                    <Typography variant="body1" sx={{ mb: 2, fontWeight: 500, color: '#2d3748' }}>
                      Shipping Scope
                    </Typography>
                    <RadioGroup
                      value={formData.shippingScope}
                      onChange={(e) => handleInputChange('shippingScope', e.target.value)}
                      sx={{
                        gap: 2,
                        '& .MuiFormControlLabel-root': {
                          margin: 0,
                          padding: '12px 20px',
                          borderRadius: '12px',
                          border: '2px solid #e2e8f0',
                          backgroundColor: '#f8fafc',
                          transition: 'all 0.2s ease',
                          '&:hover': {
                            backgroundColor: '#e8f5e8',
                            borderColor: '#4caf50'
                          }
                        }
                      }}
                    >
                      <FormControlLabel
                        value="Global"
                        control={<Radio sx={{ color: '#4caf50' }} />}
                        label="Global"
                      />
                      <FormControlLabel
                        value="Country"
                        control={<Radio sx={{ color: '#4caf50' }} />}
                        label="Country"
                      />
                      <FormControlLabel
                        value="City"
                        control={<Radio sx={{ color: '#4caf50' }} />}
                        label="City"
                      />
                    </RadioGroup>
                    <Typography variant="body2" sx={{ mt: 2, color: '#718096', fontStyle: 'italic' }}>
                      After clicking the city radio button, the process begins by selecting the country, followed by the state, and finally the city
                    </Typography>
                  </Grid>
                </Grid>
              </FormSection>
            </Box>
          );
        })()}
      </StyledDialogContent>

      {/* Location Picker Dialog */}
      <LocationPicker
        open={locationPickerOpen}
        onClose={() => setLocationPickerOpen(false)}
        onLocationSelect={handleLocationSelect}
        initialLocation={
          formData.latitude && formData.longitude ? {
            lat: parseFloat(formData.latitude) || 0,
            lng: parseFloat(formData.longitude) || 0
          } : null
        }
      />

      {/* Only show standard actions if we are in the normal form state */}
      {(!checkingLicense &&
        (user?.approval_status || (user?.is_active ? 'approved' : 'pending')) === 'approved' &&
        farmsList && farmsList.length > 0) && (
          <StyledDialogActions isMobile={isMobile}>
            <StyledButton
              onClick={handleClose}
              variant="outlined"
              isMobile={isMobile}
            >
              Cancel
            </StyledButton>
            <StyledButton
              onClick={handleSubmit}
              variant="contained"
              disabled={isSubmitting}
              isMobile={isMobile}
              sx={{
                backgroundColor: '#4caf50',
                '&:hover': {
                  backgroundColor: '#45a049'
                }
              }}
            >
              {isSubmitting ? 'Creating...' : (editMode ? 'Update Field' : 'Create Field')}
            </StyledButton>
          </StyledDialogActions>
        )}
    </StyledDialog>
  );
};

export default CreateFieldForm;

// Function to format location to show only city and country
const formatLocationDisplay = (location) => {
  if (!location) return '';

  const parts = location.split(', ');
  if (parts.length >= 2) {
    // If we have at least 2 parts, take the first (city) and last (country)
    const city = parts[0];
    const country = parts[parts.length - 1];
    return `${city}, ${country}`;
  }

  // If only one part or less, return as is
  return location;
};