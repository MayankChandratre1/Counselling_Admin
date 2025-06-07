export const checkPermission = (requiredPermission) => {
    const adminInfo = JSON.parse(sessionStorage.getItem('adminInfo'));
    const permissions = adminInfo?.permissions;
    
    if (!permissions) return false;
    
    return permissions.pages.includes(requiredPermission);
}