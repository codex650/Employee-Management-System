import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const PublicRoute = ({ children }) => {
  const { user, loading, isAuthenticated } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (isAuthenticated) {
    if (user?.role === 'manager') {
      return <Navigate to="/admin-dashboard" replace />;
    } else {
      return <Navigate to="/employee-dashboard" replace />;
    }
  }

  return children;
};

export default PublicRoute;
