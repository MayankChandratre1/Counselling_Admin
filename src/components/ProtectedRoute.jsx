import React from 'react';
import { Navigate } from 'react-router-dom';
import { hasSecurityPrivileges } from '../utils/securityRole';

/**
 * ProtectedRoute — guards a route by checking:
 *   1. Is the user logged in at all? (adminToken present)
 *   2. Does the user have the required permission page?
 *      Super-admins and security-admins bypass the page check entirely.
 */
const ProtectedRoute = ({ children, requiredPermission }) => {
  const token = sessionStorage.getItem('adminToken');
  if (!token) {
    // Not logged in at all — send to login
    return <Navigate to="/" replace />;
  }

  const adminInfo = JSON.parse(sessionStorage.getItem('adminInfo') || 'null');

  const securityOnlyPermissions = ['admin-settings', 'security-operations'];

  // Security-sensitive sections require security privileges.
  if (securityOnlyPermissions.includes(requiredPermission)) {
    return hasSecurityPrivileges(adminInfo)
      ? children
      : <Navigate to="/unauthorized" replace />;
  }

  // Privileged admins have unrestricted access for non-security pages
  if (adminInfo?.role === 'super-admin' || adminInfo?.role === 'security-admin') {
    return children;
  }

  // Check the pages array from adminInfo.permissions
  const pages = adminInfo?.permissions?.pages || [];
  if (!requiredPermission || pages.includes(requiredPermission)) {
    return children;
  }

  return <Navigate to="/unauthorized" replace />;
};

export default ProtectedRoute;