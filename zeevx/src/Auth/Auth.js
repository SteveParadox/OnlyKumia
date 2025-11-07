import React, { createContext, useContext, useEffect, useState } from 'react';
import { FirebaseAuth } from './Firebase.js';

// Create the context
const AuthContext = createContext(null);

// Custom hook for easy access
export const useAuth = () => {
  return useContext(AuthContext);
};

// Provider component
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Track authentication state
  useEffect(() => {
    const unsubscribe = FirebaseAuth.onAuthStateChanged((authUser) => {
      setUser(authUser || null);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  // Sign out user
  const logout = async () => {
    try {
      await FirebaseAuth.signOut();
      setUser(null);
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  // Provide both shapes: { user, setUser } and { auth, setAuth }
  // Some components expect `auth`/`setAuth`, others expect `user`/`setUser`.
  const value = {
    // canonical names
    user,
    setUser,
    // backward-compatible aliases used in other components
    auth: user,
    setAuth: setUser,
    loading,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
