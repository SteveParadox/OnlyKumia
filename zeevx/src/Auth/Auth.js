import React, { createContext, useContext, useState } from 'react';

// Create the context
const AuthContext = createContext(null);

// Custom hook
export const useAuth = () => useContext(AuthContext);

// Public-mode AuthProvider for testing
export const AuthProvider = ({ children }) => {
  // Fake user for testing, avoids auto-redirects
  const [user, setUser] = useState({ name: 'guest', role: 'fan' });
  const [loading, setLoading] = useState(false); // skip loading

  const logout = () => setUser(null); // simple logout for testing

  const value = {
    user,
    setUser,
    auth: user,
    setAuth: setUser,
    loading,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
