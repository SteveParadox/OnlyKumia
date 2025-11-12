import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from './Auth';
import Loading from '../Utils/Loading'; // adjust path if needed

const RequireAuth = () => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return <Loading />;

  if (!user)
    return <Navigate to="/login" state={{ from: location }} replace />;

  return <Outlet />;
};

export default RequireAuth;
