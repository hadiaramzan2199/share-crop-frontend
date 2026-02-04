import React, { useState, useEffect } from 'react';
import { getProductIcon } from '../utils/productIcons';

const IconTest = () => {
  const [loadStatus, setLoadStatus] = useState({});
  
  const testCategories = [
    'Green Apple',
    'Strawberry', 
    'Peach',
    'Fruits',
    'Vegetables',
    null,
    undefined,
    '',
    'NonExistentCategory'
  ];

  useEffect(() => {
    testCategories.forEach(category => {
      const iconPath = getProductIcon(category);
    });
  }, []);

  const handleImageLoad = (category, iconPath) => {
    setLoadStatus(prev => ({ ...prev, [category]: 'loaded' }));
  };

  const handleImageError = (category, iconPath, error) => {
    console.error(`❌ Icon failed to load for category "${category}":`, iconPath, error);
    setLoadStatus(prev => ({ ...prev, [category]: 'error' }));
  };

  return (
    <div style={{ 
      position: 'fixed', 
      top: '10px', 
      left: '10px', 
      background: 'rgba(255, 255, 255, 0.95)', 
      padding: '20px', 
      border: '3px solid #ff6b6b',
      borderRadius: '12px',
      zIndex: 9999,
      maxWidth: '400px',
      fontSize: '13px',
      boxShadow: '0 4px 20px rgba(0,0,0,0.3)'
    }}>
      <h3 style={{ 
        margin: '0 0 15px 0', 
        fontSize: '16px', 
        color: '#ff6b6b',
        textAlign: 'center',
        fontWeight: 'bold'
      }}>🔍 ICON DEBUG PANEL</h3>
      
      <div style={{ marginBottom: '15px', padding: '10px', background: '#f0f8ff', borderRadius: '6px' }}>
        <strong>Total Categories Tested:</strong> {testCategories.length}<br/>
        <strong>Loaded:</strong> {Object.values(loadStatus).filter(s => s === 'loaded').length}<br/>
        <strong>Failed:</strong> {Object.values(loadStatus).filter(s => s === 'error').length}
      </div>
      
      {testCategories.map((category, index) => {
        const iconPath = getProductIcon(category);
        const status = loadStatus[category] || 'loading';
        
        return (
          <div key={index} style={{ 
            marginBottom: '12px', 
            padding: '8px', 
            border: '2px solid #ddd',
            borderRadius: '6px',
            backgroundColor: status === 'loaded' ? '#e8f5e8' : status === 'error' ? '#ffe8e8' : '#fff8e1'
          }}>
            <div><strong>Category:</strong> "{category || 'null/undefined'}"</div>
            <div><strong>Path:</strong> {iconPath}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '5px' }}>
              <strong>Status:</strong> 
              <span style={{ 
                color: status === 'loaded' ? 'green' : status === 'error' ? 'red' : 'orange',
                fontWeight: 'bold'
              }}>{status}</span>
              <img 
                src={iconPath}
                alt={`Test ${category}`}
                onLoad={() => handleImageLoad(category, iconPath)}
                onError={(e) => handleImageError(category, iconPath, e)}
                style={{ 
                  width: '30px', 
                  height: '30px', 
                  border: '2px solid #333',
                  borderRadius: '50%',
                  backgroundColor: 'white'
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default IconTest;