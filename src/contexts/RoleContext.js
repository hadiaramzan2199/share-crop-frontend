import React, { createContext, useContext, useState } from 'react';

const RoleContext = createContext(null);

export const RoleProvider = ({ children }) => {
  const [role, setRole] = useState('guest'); // Default role

  // You would typically fetch the user's role from your backend here
  // For now, it's a placeholder.

  return (
    <RoleContext.Provider value={{ role, setRole }}>
      {children}
    </RoleContext.Provider>
  );
};

export const useRole = () => useContext(RoleContext);