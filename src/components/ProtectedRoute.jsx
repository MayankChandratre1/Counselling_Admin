import React from 'react';
import { Navigate } from 'react-router-dom';

/**
 * ProtectedRoute — guards a route by checking:
 *   1. Is the user logged in at all? (adminToken present)
 *   2. Does the user have the required permission page?
 *      Super-admins bypass the page check entirely.
 */
const ProtectedRoute = ({ children, requiredPermission }) => {
  const token = sessionStorage.getItem('adminToken');
  if (!token) {
    // Not logged in at all — send to login
    return <Navigate to="/" replace />;
  }

  const adminInfo = JSON.parse(sessionStorage.getItem('adminInfo') || 'null');

  // Super-admin has unrestricted access
  if (adminInfo?.role === 'super-admin') {
    return children;
  }

  // Check the pages array stored at login
  const pages = JSON.parse(sessionStorage.getItem('adminPages') || '[]');
  if (!requiredPermission || pages.includes(requiredPermission)) {
    return children;
  }

  return <Navigate to="/unauthorized" replace />;
};

export default ProtectedRoute;