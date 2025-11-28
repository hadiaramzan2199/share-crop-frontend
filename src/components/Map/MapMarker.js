import React from 'react';
import { styled } from '@mui/material/styles';

const Marker = styled('div')(({ theme }) => ({
  width: 30,
  height: 30,
  backgroundColor: theme.palette.primary.main,
  border: `3px solid ${theme.palette.primary.dark}`,
  borderRadius: '50%',
  cursor: 'pointer',
  boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: 'white',
  fontWeight: 'bold',
  fontSize: 12,
  transition: 'all 0.3s ease',
  '&:hover': {
    transform: 'scale(1.2)',
    backgroundColor: theme.palette.primary.dark,
  },
  '&.pulsing': {
    animation: 'pulse 2s infinite',
  },
  '@keyframes pulse': {
    '0%': {
      transform: 'scale(1)',
      boxShadow: '0 0 0 0 rgba(76, 175, 80, 0.7)',
    },
    '70%': {
      transform: 'scale(1.1)',
      boxShadow: '0 0 0 10px rgba(76, 175, 80, 0)',
    },
    '100%': {
      transform: 'scale(1)',
      boxShadow: '0 0 0 0 rgba(76, 175, 80, 0)',
    },
  },
}));

const MapMarker = ({ field, onClick }) => {
  return (
    <Marker 
      className={field.recentlyAdded ? 'pulsing' : ''}
      onClick={onClick}
      title={field.name}
    >
      🌱
    </Marker>
  );
};

export default MapMarker;