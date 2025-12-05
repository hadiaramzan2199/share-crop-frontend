import React, { useState, useCallback } from 'react';
import Map from 'react-map-gl';
import { Marker, Popup, NavigationControl, FullscreenControl } from 'react-map-gl';
import { Card, CardContent, Typography, Button, Chip } from '@mui/material';
import { LocationOn, ShoppingCart } from '@mui/icons-material';
import MapMarker from './MapMarker';
import 'mapbox-gl/dist/mapbox-gl.css';

const FarmMap = ({ fields, products, onFieldCreate, onProductSelect, userType }) => {
  const [viewState, setViewState] = useState({
    longitude: 10, // Center on Central Europe
    latitude: 54, // Center on Central Europe
    zoom: 4, // Slightly closer zoom to focus on Europe
  });
  const [selectedField, setSelectedField] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);

  const handleMarkerClick = useCallback((event, field) => {
    event.originalEvent.stopPropagation();
    setSelectedField(field);
    setSelectedProduct(null);
  }, []);

  const handleProductClick = useCallback((product) => {
    setSelectedProduct(product);
    if (onProductSelect) {
      onProductSelect(product);
    }
  }, [onProductSelect]);

  const MAPBOX_TOKEN = process.env.REACT_APP_MAPBOX_ACCESS_TOKEN;
  return (
    <div style={{ height: '100vh', width: '100%', position: 'relative' }}>
      {!MAPBOX_TOKEN ? (
        <div style={{
          height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <div style={{
            background: 'rgba(0,0,0,0.6)', color: '#fff', padding: 12,
            borderRadius: 8, textAlign: 'center'
          }}>
            Map requires <code>REACT_APP_MAPBOX_ACCESS_TOKEN</code> in <code>.env</code>. Restart dev server after adding.
          </div>
        </div>
      ) : (
      <Map
        {...viewState}
        onMove={evt => setViewState(evt.viewState)}
        mapboxAccessToken={MAPBOX_TOKEN}
        attributionControl={false}
        style={{ width: '100%', height: '100%' }}
        mapStyle="mapbox://styles/superfroggy/cmfwppeyl00dl01r0287fe98o"
      >
        <NavigationControl position="top-left" />
        <FullscreenControl position="top-left" />

        {fields.map((field) => (
          <Marker
            key={field.id}
            longitude={field.geometry.coordinates[0][0][0]}
            latitude={field.geometry.coordinates[0][0][1]}
            anchor="center"
          >
            <MapMarker 
              field={field} 
              onClick={(e) => handleMarkerClick(e, field)}
            />
          </Marker>
        ))}

        {selectedField && (
          <Popup
            longitude={selectedField.geometry.coordinates[0][0][0]}
            latitude={selectedField.geometry.coordinates[0][0][1]}
            anchor="top"
            onClose={() => setSelectedField(null)}
            closeButton={false}
          >
            <Card sx={{ maxWidth: 300 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  {selectedField.name}
                </Typography>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  {selectedField.description}
                </Typography>
                <Chip 
                  label={`${selectedField.area_m2} m²`} 
                  size="small" 
                  sx={{ mb: 1 }}
                />
                
                {selectedField.products && selectedField.products.length > 0 && (
                  <div>
                    <Typography variant="subtitle2" gutterBottom>
                      Available Products:
                    </Typography>
                    {selectedField.products.map((product) => (
                      <Button
                        key={product.id}
                        startIcon={<ShoppingCart />}
                        variant="outlined"
                        size="small"
                        sx={{ mb: 0.5, mr: 0.5 }}
                        onClick={() => handleProductClick(product)}
                      >
                        {product.name} (${product.price_per_unit})
                      </Button>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </Popup>
        )}
      </Map>
      )}

      {userType === 'farmer' && (
        <Button
          variant="contained"
          color="primary"
          startIcon={<LocationOn />}
          sx={{
            position: 'absolute',
            top: 20,
            right: 20,
            zIndex: 1000,
          }}
          onClick={onFieldCreate}
        >
          Add New Field
        </Button>
      )}
    </div>
  );
};

export default FarmMap;
