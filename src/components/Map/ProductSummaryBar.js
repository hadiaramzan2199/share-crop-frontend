import React from 'react';
import { getProductIcon } from '../../utils/productIcons';

const ProductSummaryBar = ({ mapRef, farms, onProductClick }) => {
  const [visibleProducts, setVisibleProducts] = React.useState([]);
  const [currentIndex, setCurrentIndex] = React.useState(0);
  const itemsPerPage = 4;

  React.useEffect(() => {
    if (!mapRef?.current || !farms?.length) {
      setVisibleProducts([]);
      return;
    }

    const updateVisibleProducts = () => {
      const map = mapRef.current.getMap();
      const bounds = map.getBounds();
      
      const visible = farms.filter(farm => {
        if (!farm.coordinates) return false;
        
        let lng, lat;
        if (Array.isArray(farm.coordinates)) {
          // Array format: [longitude, latitude]
          [lng, lat] = farm.coordinates;
        } else if (farm.coordinates.lng !== undefined && farm.coordinates.lat !== undefined) {
          // Object format: { lng: ..., lat: ... }
          lng = farm.coordinates.lng;
          lat = farm.coordinates.lat;
        } else if (farm.coordinates.longitude !== undefined && farm.coordinates.latitude !== undefined) {
          // Object format: { longitude: ..., latitude: ... }
          lng = farm.coordinates.longitude;
          lat = farm.coordinates.latitude;
        } else {
          return false; // Unknown format
        }
        
        return bounds.contains([lng, lat]);
      });
      
      setVisibleProducts(visible);
      setCurrentIndex(0); // Reset to first page when products change
    };

    const map = mapRef.current.getMap();
    map.on('moveend', updateVisibleProducts);
    map.on('zoomend', updateVisibleProducts);
    
    // Initial update
    updateVisibleProducts();

    return () => {
      map.off('moveend', updateVisibleProducts);
      map.off('zoomend', updateVisibleProducts);
    };
  }, [mapRef, farms]);

  const getProgressColor = (available, total) => {
    const percentage = (available / total) * 100;
    if (percentage > 70) return '#10b981'; // Green
    if (percentage > 30) return '#f59e0b'; // Yellow
    return '#ef4444'; // Red
  };

  const totalPages = Math.ceil(visibleProducts.length / itemsPerPage);
  const currentProducts = visibleProducts.slice(
    currentIndex * itemsPerPage,
    (currentIndex + 1) * itemsPerPage
  );

  const goToPrevious = () => {
    setCurrentIndex(prev => prev > 0 ? prev - 1 : totalPages - 1);
  };

  const goToNext = () => {
    setCurrentIndex(prev => prev < totalPages - 1 ? prev + 1 : 0);
  };

  if (visibleProducts.length === 0) {
    return null;
  }

  return (
    <div style={{
      position: 'absolute',
      bottom: '10px',
      left: '50%',
      transform: 'translateX(-50%)',
      display: 'flex',
      alignItems: 'center',
      gap: '6px',
      padding: '4px 8px',
      borderRadius: '6px',
      background: 'rgba(0, 0, 0, 0.1)',
      backdropFilter: 'blur(4px)',
      border: '1px solid rgba(255, 255, 255, 0.1)',
      zIndex: 1000,
      maxWidth: '500px'
    }}>
      {/* Left Arrow */}
      {totalPages > 1 && (
        <button
          onClick={goToPrevious}
          style={{
            background: 'rgba(255, 255, 255, 0.1)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            borderRadius: '4px',
            color: '#fff',
            cursor: 'pointer',
            padding: '4px 6px',
            fontSize: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            minWidth: '24px',
            height: '24px'
          }}
        >
          ‹
        </button>
      )}

      {/* Products */}
      <div style={{
        display: 'flex',
        gap: '4px'
      }}>
        {currentProducts.map((product) => {
          const icon = getProductIcon(product.subcategory || product.category);
          const progressPercentage = (product.available_area / product.total_area) * 100;
          const progressColor = getProgressColor(product.available_area, product.total_area);
          
          return (
            <div
              key={product.id}
              onClick={(e) => {
                e.preventDefault();
                onProductClick && onProductClick(e, product);
              }}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                padding: '4px',
                borderRadius: '4px',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                cursor: 'pointer',
                minWidth: '70px',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.target.style.background = 'rgba(255, 255, 255, 0.1)';
                e.target.style.border = '1px solid rgba(255, 255, 255, 0.3)';
              }}
              onMouseLeave={(e) => {
                e.target.style.background = 'rgba(255, 255, 255, 0.05)';
                e.target.style.border = '1px solid rgba(255, 255, 255, 0.1)';
              }}
            >
              {/* Icon */}
               <div style={{
                 width: '16px',
                 height: '16px',
                 marginBottom: '2px',
                 display: 'flex',
                 alignItems: 'center',
                 justifyContent: 'center'
               }}>
                 <img 
                   src={icon} 
                   alt={product.category}
                   style={{
                     width: '100%',
                     height: '100%',
                     objectFit: 'contain'
                   }}
                 />
               </div>
              
              {/* Area Info */}
              <div style={{
                fontSize: '8px',
                fontWeight: '600',
                color: '#fff',
                textAlign: 'center',
                marginBottom: '2px',
                lineHeight: '1'
              }}>
                {product.available_area}m²
              </div>
              
              {/* Progress Bar */}
              <div style={{
                width: '50px',
                height: '2px',
                backgroundColor: 'rgba(255, 255, 255, 0.2)',
                borderRadius: '1px',
                overflow: 'hidden'
              }}>
                <div style={{
                  width: `${progressPercentage}%`,
                  height: '100%',
                  backgroundColor: progressColor,
                  transition: 'width 0.3s ease'
                }} />
              </div>
            </div>
          );
        })}
      </div>

      {/* Right Arrow */}
      {totalPages > 1 && (
        <button
          onClick={goToNext}
          style={{
            background: 'rgba(255, 255, 255, 0.1)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            borderRadius: '4px',
            color: '#fff',
            cursor: 'pointer',
            padding: '4px 6px',
            fontSize: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            minWidth: '24px',
            height: '24px'
          }}
        >
          ›
        </button>
      )}

      {/* Page Indicator */}
      {totalPages > 1 && (
        <div style={{
          fontSize: '8px',
          color: 'rgba(255, 255, 255, 0.7)',
          marginLeft: '4px'
        }}>
          {currentIndex + 1}/{totalPages}
        </div>
      )}
    </div>
  );
};

export default ProductSummaryBar;