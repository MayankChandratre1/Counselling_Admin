/**
 * Check if the currently logged-in admin has a given permission page.
 * Pages are stored in sessionStorage under adminInfo.permissions.pages.
 * Super-admins and security-admins always have access.
 */
import { hasSecurityPrivileges } from './securityRole';

export const checkPermission = (requiredPermission) => {
    const adminInfo = JSON.parse(sessionStorage.getItem('adminInfo') || 'null');
    if (!adminInfo) return false;

    if (requiredPermission === 'admin-settings' || requiredPermission === 'security-operations') {
        return hasSecurityPrivileges(adminInfo);
    }

    // Privileged admins bypass all permission checks
    if (adminInfo.role === 'super-admin' || adminInfo.role === 'security-admin') return true;

    const pages = adminInfo?.permissions?.pages || [];
    return pages.includes(requiredPermission);
};