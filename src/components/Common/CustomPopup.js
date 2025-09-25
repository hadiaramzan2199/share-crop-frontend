import React from 'react';
import { Popup } from 'react-map-gl';

const CustomPopup = ({ latitude, longitude, onClose, children }) => {
  return (
    <Popup
      latitude={latitude}
      longitude={longitude}
      onClose={onClose}
      closeButton={true}
      closeOnClick={false}
      anchor="top"
    >
      {children}
    </Popup>
  );
};

export default CustomPopup;