import React, { useState, useEffect } from 'react';

const CustomScaleBar = ({ map }) => {
  const [scaleWidth, setScaleWidth] = useState(100);
  const [scaleText, setScaleText] = useState('100 km');

  useEffect(() => {
    if (!map) return;

    const updateScale = () => {
      const canvas = map.getCanvas();
      const canvasWidth = canvas.width;
      const bounds = map.getBounds();
      
      // Calculate the distance for 100 pixels at the current zoom level
      const y = bounds.getSouth() + (bounds.getNorth() - bounds.getSouth()) / 2;
      const maxWidth = 100; // Maximum width in pixels
      
      // Get distance in meters for maxWidth pixels
      const point1 = map.unproject([0, canvas.height / 2]);
      const point2 = map.unproject([maxWidth, canvas.height / 2]);
      
      // Calculate distance using Haversine formula (approximate)
      const distance = getDistance(point1.lat, point1.lng, point2.lat, point2.lng);
      
      // Round to nice numbers
      let roundedDistance;
      let unit = 'km';
      
      if (distance < 1) {
        roundedDistance = Math.round(distance * 1000);
        unit = 'm';
      } else if (distance < 10) {
        roundedDistance = Math.round(distance * 10) / 10;
      } else if (distance < 100) {
        roundedDistance = Math.round(distance);
      } else if (distance < 1000) {
        roundedDistance = Math.round(distance / 10) * 10;
      } else {
        roundedDistance = Math.round(distance / 100) * 100;
      }
      
      // Calculate the actual width for the rounded distance
      const actualWidth = unit === 'm' 
        ? (roundedDistance / 1000 / distance) * maxWidth
        : (roundedDistance / distance) * maxWidth;
      
      setScaleWidth(Math.max(20, Math.min(maxWidth, actualWidth)));
      setScaleText(`${roundedDistance} ${unit}`);
    };

    // Update scale when map moves or zooms
    map.on('move', updateScale);
    map.on('zoom', updateScale);
    updateScale();

    return () => {
      map.off('move', updateScale);
      map.off('zoom', updateScale);
    };
  }, [map]);

  // Haversine formula to calculate distance between two points
  const getDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Earth's radius in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  return (
    <div
      style={{
        position: 'absolute',
        bottom: '20px',
        right: '10px',
        backgroundColor: 'transparent',
        padding: '4px 8px',
        fontFamily: 'Arial, sans-serif',
        fontSize: '11px',
        fontWeight: 'bold',
        color: '#fff',
        zIndex: 1000,
        textShadow: '1px 1px 2px rgba(0,0,0,0.8)'
      }}
    >
      <div
        style={{
          width: `${scaleWidth}px`,
          height: '3px',
          backgroundColor: '#fff',
          position: 'relative',
          boxShadow: '0 0 3px rgba(0,0,0,0.5)'
        }}
      >
        {/* Scale bar with tick marks */}
        <div
          style={{
            position: 'absolute',
            left: '0',
            top: '-3px',
            width: '2px',
            height: '9px',
            backgroundColor: '#fff',
            boxShadow: '0 0 2px rgba(0,0,0,0.5)'
          }}
        />
        <div
          style={{
            position: 'absolute',
            right: '0',
            top: '-3px',
            width: '2px',
            height: '9px',
            backgroundColor: '#fff',
            boxShadow: '0 0 2px rgba(0,0,0,0.5)'
          }}
        />
      </div>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          marginTop: '3px',
          fontSize: '10px',
          color: '#fff',
          textShadow: '1px 1px 2px rgba(0,0,0,0.8)'
        }}
      >
        <span>0</span>
        <span>{scaleText}</span>
      </div>
    </div>
  );
};

export default CustomScaleBar;