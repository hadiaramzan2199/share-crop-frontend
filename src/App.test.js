jest.mock('axios', () => {
  const mockAxiosInstance = {
    create: jest.fn(() => mockAxiosInstance),
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
    patch: jest.fn(),
    interceptors: {
      request: { use: jest.fn(), eject: jest.fn() },
      response: { use: jest.fn(), eject: jest.fn() },
    },
  };

  return { __esModule: true, default: mockAxiosInstance };
});

jest.mock('react-map-gl', () => {
  const React = require('react');

  const Map = ({ children }) => React.createElement('div', null, children);
  const Marker = ({ children }) => React.createElement('div', null, children);
  const NavigationControl = () => null;

  return { __esModule: true, default: Map, Marker, NavigationControl };
});

import { render, screen } from '@testing-library/react';
import App from './App';

test('renders home page heading', () => {
  render(<App />);
  expect(screen.getByText(/welcome to sharecrop/i)).toBeInTheDocument();
});
