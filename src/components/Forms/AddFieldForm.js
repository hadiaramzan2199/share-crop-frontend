import React, { useState } from 'react';
import api from '../../services/api'; // Changed to default import
import { useAuth } from '../../contexts/AuthContext';

const AddFieldForm = ({ onFieldAdded, onClose, farms }) => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    crop: '',
    price: '',
    area: '',
    location: '',
    description: '',
    harvestDate: '',
    farmId: '',
    shippingScope: 'Global'
  });

  const [loading, setLoading] = useState(false);

  // Mapping from crop selections to proper subcategories for icon display
  // const cropToSubcategoryMapping = {
  //   'Wheat': 'Corn', // Use corn icon as fallback
  //   'Corn': 'Corn',
  //   'Rice': 'Corn', // Use corn icon as fallback
  //   'Soybeans': 'Corn', // Use corn icon as fallback
  //   'Tomatoes': 'Tomato',
  //   'Potatoes': 'Potatoes',
  //   'Carrots': 'Carrot',
  //   'Lettuce': 'Salad Greens',
  //   'Onions': 'Onions',
  //   'Peppers': 'Capsicum',
  //   'Apples': 'Green Apple',
  //   'Oranges': 'Tangerine'
  // };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    if (!user || !user.id) {
      alert('User not authenticated. Please log in.');
      setLoading(false);
      return;
    }

    try {
      const fieldData = {
        name: formData.name,
        crop: formData.crop,
        price: parseFloat(formData.price),
        area: parseFloat(formData.area),
        location: formData.location,
        description: formData.description,
        harvest_date: formData.harvestDate, // Backend expects snake_case
        farm_id: formData.farmId, // Pass selected farm ID
        owner_id: user.id,
        // Default values for now, can be made dynamic later
        latitude: 40.7128 + (Math.random() - 0.5) * 0.1, 
        longitude: -74.0060 + (Math.random() - 0.5) * 0.1,
        image: `/icons/products/${formData.crop.toLowerCase()}.png`,
        category: 'farmer_created',
        shipping_scope: formData.shippingScope
      };

      const response = await api.post('/api/fields', fieldData);
      const newField = response.data;
      
      if (onFieldAdded) {
        onFieldAdded(newField);
      }
      
      setFormData({
        name: '',
        crop: '',
        price: '',
        area: '',
        location: '',
        description: '',
        harvestDate: '',
        farmId: '',
        shippingScope: 'Global'
      });

      alert('Field added successfully!');
      if (onClose) onClose();
    } catch (error) {
      console.error('Error adding field:', error);
      alert('Error adding field. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const cropOptions = [
    'Wheat', 'Corn', 'Rice', 'Soybeans', 'Tomatoes', 'Potatoes', 
    'Carrots', 'Lettuce', 'Onions', 'Peppers', 'Apples', 'Oranges'
  ];

  return (
    <div className="add-field-form">
      <div className="form-header">
        <h3>Add New Field</h3>
        {onClose && (
          <button type="button" className="close-btn" onClick={onClose}>
            ×
          </button>
        )}
      </div>

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="name">Field Name *</label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
            placeholder="e.g., North Field, Sunny Acres"
          />
        </div>

        <div className="form-group">
          <label htmlFor="crop">Crop Type *</label>
          <select
            id="crop"
            name="crop"
            value={formData.crop}
            onChange={handleChange}
            required
          >
            <option value="">Select a crop</option>
            {cropOptions.map(crop => (
              <option key={crop} value={crop}>{crop}</option>
            ))}
          </select>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="price">Price per Unit ($) *</label>
            <input
              type="number"
              id="price"
              name="price"
              value={formData.price}
              onChange={handleChange}
              required
              min="0"
              step="0.01"
              placeholder="0.00"
            />
          </div>

          <div className="form-group">
            <label htmlFor="area">Area (acres) *</label>
            <input
              type="number"
              id="area"
              name="area"
              value={formData.area}
              onChange={handleChange}
              required
              min="0"
              step="0.1"
              placeholder="0.0"
            />
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="location">Location</label>
          <input
            type="text"
            id="location"
            name="location"
            value={formData.location}
            onChange={handleChange}
            placeholder="e.g., Iowa, USA"
          />
        </div>

        <div className="form-group">
          <label htmlFor="shippingScope">Shipping Scope *</label>
          <select
            id="shippingScope"
            name="shippingScope"
            value={formData.shippingScope}
            onChange={handleChange}
            required
          >
            <option value="Global">Global</option>
            <option value="Country">Country</option>
            <option value="City">City</option>
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="harvestDate">Expected Harvest Date</label>
          <input
            type="date"
            id="harvestDate"
            name="harvestDate"
            value={formData.harvestDate}
            onChange={handleChange}
          />
        </div>

        <div className="form-group">
          <label htmlFor="farmId">Select Farm *</label>
          <select
            id="farmId"
            name="farmId"
            value={formData.farmId}
            onChange={handleChange}
            required
          >
            <option value="">Select a farm</option>
            {farms.map(farm => (
              <option key={farm.id} value={farm.id}>{farm.name}</option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="description">Description</label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows="3"
            placeholder="Additional details about the field..."
          />
        </div>

        <div className="form-actions">
          <button type="submit" disabled={loading} className="submit-btn">
            {loading ? 'Adding Field...' : 'Add Field'}
          </button>
          {onClose && (
            <button type="button" onClick={onClose} className="cancel-btn">
              Cancel
            </button>
          )}
        </div>
      </form>

      <style jsx>{`
        .add-field-form {
          background: white;
          border-radius: 12px;
          padding: 24px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
          max-width: 600px;
          margin: 0 auto;
        }

        .form-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 24px;
          padding-bottom: 16px;
          border-bottom: 1px solid #e5e7eb;
        }

        .form-header h3 {
          margin: 0;
          color: #1f2937;
          font-size: 1.5rem;
          font-weight: 600;
        }

        .close-btn {
          background: none;
          border: none;
          font-size: 24px;
          color: #6b7280;
          cursor: pointer;
          padding: 4px;
          border-radius: 4px;
          transition: all 0.2s;
        }

        .close-btn:hover {
          background: #f3f4f6;
          color: #374151;
        }

        .form-group {
          margin-bottom: 20px;
        }

        .form-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
        }

        label {
          display: block;
          margin-bottom: 6px;
          font-weight: 500;
          color: #374151;
          font-size: 14px;
        }

        input, select, textarea {
          width: 100%;
          padding: 12px;
          border: 1px solid #d1d5db;
          border-radius: 8px;
          font-size: 14px;
          transition: all 0.2s;
          box-sizing: border-box;
        }

        input:focus, select:focus, textarea:focus {
          outline: none;
          border-color: #3b82f6;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }

        textarea {
          resize: vertical;
          min-height: 80px;
        }

        .form-actions {
          display: flex;
          gap: 12px;
          margin-top: 32px;
          padding-top: 20px;
          border-top: 1px solid #e5e7eb;
        }

        .submit-btn {
          flex: 1;
          background: #10b981;
          color: white;
          border: none;
          padding: 12px 24px;
          border-radius: 8px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
        }

        .submit-btn:hover:not(:disabled) {
          background: #059669;
          transform: translateY(-1px);
        }

        .submit-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          transform: none;
        }

        .cancel-btn {
          background: #f3f4f6;
          color: #374151;
          border: 1px solid #d1d5db;
          padding: 12px 24px;
          border-radius: 8px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
        }

        .cancel-btn:hover {
          background: #e5e7eb;
          border-color: #9ca3af;
        }

        @media (max-width: 640px) {
          .form-row {
            grid-template-columns: 1fr;
          }
          
          .form-actions {
            flex-direction: column;
          }
        }
      `}</style>
    </div>
  );
};

export default AddFieldForm;
