/**
 * Check if the currently logged-in admin has a given permission page.
 * Pages are stored in sessionStorage under adminInfo.permissions.pages.
 * Super-admins always have access.
 */
export const checkPermission = (requiredPermission) => {
    const adminInfo = JSON.parse(sessionStorage.getItem('adminInfo') || 'null');
    if (!adminInfo) return false;

    // Super-admins bypass all permission checks
    if (adminInfo.role === 'super-admin') return true;

    const pages = adminInfo?.permissions?.pages || [];
    return pages.includes(requiredPermission);
};