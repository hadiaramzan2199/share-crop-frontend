import { styled } from '@mui/material/styles';

export const FarmvilleCard = styled('div')(({ theme }) => ({
  background: 'linear-gradient(145deg, #ffffff, #e8f5e8)',
  borderRadius: '20px',
  boxShadow: '5px 5px 15px rgba(0,0,0,0.1)',
  border: '2px solid #4caf50',
  padding: theme.spacing(3),
  transition: 'all 0.3s ease',
  '&:hover': {
    transform: 'translateY(-2px)',
    boxShadow: '8px 8px 20px rgba(0,0,0,0.15)',
  },
}));

export const FarmvilleButton = styled('button')(({ theme }) => ({
  background: 'linear-gradient(45deg, #4caf50, #66bb6a)',
  border: 'none',
  borderRadius: '25px',
  color: 'white',
  padding: '12px 24px',
  fontWeight: 'bold',
  textTransform: 'none',
  boxShadow: '0 4px 8px rgba(76, 175, 80, 0.3)',
  transition: 'all 0.3s ease',
  cursor: 'pointer',
  '&:hover': {
    transform: 'translateY(-2px)',
    boxShadow: '0 6px 12px rgba(76, 175, 80, 0.4)',
  },
  '&:disabled': {
    background: 'linear-gradient(45deg, #9e9e9e, #bdbdbd)',
    cursor: 'not-allowed',
  },
}));

export const GrowingAnimation = styled('div')({
  animation: 'grow 2s ease-in-out',
  '@keyframes grow': {
    '0%': { transform: 'scale(0.8)' },
    '50%': { transform: 'scale(1.1)' },
    '100%': { transform: 'scale(1)' },
  },
});

export const PulseAnimation = styled('div')({
  animation: 'pulse 2s infinite',
  '@keyframes pulse': {
    '0%': { transform: 'scale(1)' },
    '50%': { transform: 'scale(1.05)' },
    '100%': { transform: 'scale(1)' },
  },
});

// Additional Farmville-themed styles
export const styles = {
  container: {
    background: 'linear-gradient(135deg, #f1f8e9 0%, #e8f5e8 100%)',
    minHeight: '100vh',
  },
  header: {
    background: 'linear-gradient(45deg, #4caf50, #66bb6a)',
    color: 'white',
    padding: '20px 0',
    textAlign: 'center',
  },
  card: {
    background: 'linear-gradient(145deg, #ffffff, #e8f5e8)',
    borderRadius: '16px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
    border: '1px solid #c8e6c9',
  },
  button: {
    background: 'linear-gradient(45deg, #4caf50, #66bb6a)',
    border: 'none',
    borderRadius: '25px',
    color: 'white',
    padding: '12px 24px',
    fontWeight: 'bold',
    boxShadow: '0 4px 8px rgba(76, 175, 80, 0.3)',
    transition: 'all 0.3s ease',
    '&:hover': {
      transform: 'translateY(-2px)',
      boxShadow: '0 6px 12px rgba(76, 175, 80, 0.4)',
    },
  },
};