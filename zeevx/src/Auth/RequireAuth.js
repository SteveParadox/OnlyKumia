import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from './Auth';

const RequireAuth = () => {
const { user, loading } = useAuth();
const location = useLocation();

  if (loading) return <div className="loading-screen">Checking access...</div>;

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <Outlet />;
};

export default RequireAuth;
