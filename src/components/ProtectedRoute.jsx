import React from 'react';
import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ children, requiredPermission }) => {
  const adminInfo = JSON.parse(sessionStorage.getItem('adminInfo'));
  const permissions = adminInfo?.permissions;
  
  const hasPermission = () => {
    if (!permissions) return false;
    return permissions.pages.includes(requiredPermission);
  };

  if (!hasPermission()) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
};

export default ProtectedRoute;