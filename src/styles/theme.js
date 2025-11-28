import { createTheme } from '@mui/material/styles';

const farmvilleTheme = createTheme({
  palette: {
    primary: {
      main: '#4caf50', // Green
      light: '#80e27e',
      dark: '#087f23',
    },
    secondary: {
      main: '#ff9800', // Orange
      light: '#ffc947',
      dark: '#c66900',
    },
    background: {
      default: '#f1f8e9', // Light green
      paper: '#ffffff',
    },
    success: {
      main: '#66bb6a',
    },
    warning: {
      main: '#ffa726',
    },
  },
  typography: {
    fontFamily: '"Inter", "Poppins", "SF Pro Display", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "Roboto", "Oxygen", "Ubuntu", "Cantarell", "Helvetica Neue", sans-serif',
    h1: {
      fontFamily: '"Poppins", "Inter", sans-serif',
      fontWeight: 700,
      color: '#1a202c',
      fontSize: '3rem',
      letterSpacing: '-0.025em',
      lineHeight: 1.2,
    },
    h2: {
      fontFamily: '"Poppins", "Inter", sans-serif',
      fontWeight: 600,
      color: '#2d3748',
      fontSize: '2.25rem',
      letterSpacing: '-0.02em',
      lineHeight: 1.3,
    },
    h3: {
      fontFamily: '"Poppins", "Inter", sans-serif',
      fontWeight: 600,
      color: '#2d3748',
      fontSize: '1.875rem',
      letterSpacing: '-0.015em',
      lineHeight: 1.4,
    },
    h4: {
      fontFamily: '"Inter", sans-serif',
      fontWeight: 600,
      color: '#4a5568',
      fontSize: '1.5rem',
      letterSpacing: '-0.01em',
      lineHeight: 1.4,
    },
    h5: {
      fontFamily: '"Inter", sans-serif',
      fontWeight: 600,
      color: '#4a5568',
      fontSize: '1.25rem',
      letterSpacing: '-0.005em',
      lineHeight: 1.5,
    },
    h6: {
      fontFamily: '"Inter", sans-serif',
      fontWeight: 600,
      color: '#718096',
      fontSize: '1.125rem',
      letterSpacing: '0em',
      lineHeight: 1.5,
    },
    body1: {
      fontFamily: '"Inter", sans-serif',
      fontSize: '1rem',
      lineHeight: 1.7,
      letterSpacing: '0.005em',
      color: '#4a5568',
      fontWeight: 400,
    },
    body2: {
      fontFamily: '"Inter", sans-serif',
      fontSize: '0.875rem',
      lineHeight: 1.6,
      letterSpacing: '0.01em',
      color: '#718096',
      fontWeight: 400,
    },
    subtitle1: {
      fontFamily: '"Inter", sans-serif',
      fontSize: '1.125rem',
      lineHeight: 1.6,
      letterSpacing: '0.005em',
      color: '#4a5568',
      fontWeight: 500,
    },
    subtitle2: {
      fontFamily: '"Inter", sans-serif',
      fontSize: '1rem',
      lineHeight: 1.5,
      letterSpacing: '0.01em',
      color: '#718096',
      fontWeight: 500,
    },
    button: {
      fontFamily: '"Inter", sans-serif',
      fontWeight: 600,
      letterSpacing: '0.025em',
      textTransform: 'none',
      fontSize: '0.875rem',
    },
    caption: {
      fontFamily: '"Inter", sans-serif',
      fontSize: '0.75rem',
      lineHeight: 1.4,
      letterSpacing: '0.02em',
      color: '#a0aec0',
      fontWeight: 400,
    },
    overline: {
      fontFamily: '"Inter", sans-serif',
      fontSize: '0.75rem',
      lineHeight: 1.4,
      letterSpacing: '0.1em',
      color: '#a0aec0',
      fontWeight: 600,
      textTransform: 'uppercase',
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 20,
          textTransform: 'none',
          fontWeight: 'bold',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
        },
      },
    },
  },
});

export default farmvilleTheme;