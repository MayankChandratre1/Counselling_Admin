/**
 * Check if the currently logged-in admin has a given permission page.
 * Pages are stored in sessionStorage under adminInfo.permissions.pages.
 * Super-admins and security-admins always have access.
 */
import { hasSecurityPrivileges } from './securityRole';

/** Fine-grained Users / Premium Users / User-lists capabilities (stored in pages[]). */
export const USER_CAPABILITY_KEYS = [
  'users-write',
  'user-lists-write',
  'view-steps',
  'view-payment',
];

export const USER_CAPABILITIES = [
  {
    key: 'users-write',
    label: 'Write access on Users / Premium Users',
    description: 'Allow edit and delete on Users and Premium Users. Uncheck for read-only.',
  },
  {
    key: 'view-steps',
    label: 'View steps info',
    description: 'Show counselling form / CAP steps progress on user details',
  },
  {
    key: 'view-payment',
    label: 'View payment info',
    description: 'Show premium plan payment details, orders, and payment history',
  },
  {
    key: 'user-lists-write',
    label: 'Write access on User Lists',
    description: 'Allow editing, deleting, and assigning lists. Uncheck for read-only overview.',
  },
];

const getAdminInfo = () => {
  try {
    return JSON.parse(sessionStorage.getItem('adminInfo') || 'null');
  } catch {
    return null;
  }
};

const getPages = (adminInfo = getAdminInfo()) =>
  adminInfo?.permissions?.pages || adminInfo?.pages || [];

export const isElevatedAdmin = (adminInfo = getAdminInfo()) => {
  if (!adminInfo) return false;
  return adminInfo.role === 'super-admin' || adminInfo.role === 'security-admin';
};

/** True once any new capability key is present (explicit mode). */
export const hasUserCapabilityFlags = (pages = getPages()) =>
  USER_CAPABILITY_KEYS.some((k) => pages.includes(k));

export const hasUsersPageAccess = (adminInfo = getAdminInfo()) => {
  if (!adminInfo) return false;
  if (isElevatedAdmin(adminInfo)) return true;
  const pages = getPages(adminInfo);
  return pages.includes('users') || pages.includes('user-lists') || pages.includes('premium-users');
};

/**
 * Can edit/delete users (Users + Premium Users).
 * Legacy admins without new flags keep full write access.
 */
export const canWriteUsers = (adminInfo = getAdminInfo()) => {
  if (!adminInfo) return false;
  if (isElevatedAdmin(adminInfo)) return true;
  const pages = getPages(adminInfo);
  if (pages.includes('users-write') || pages.includes('edit-users')) return true;
  if (!hasUserCapabilityFlags(pages) && pages.includes('users')) return true;
  return false;
};

/**
 * Can edit/delete/assign on user lists overview.
 * Legacy admins without new flags keep full write access.
 */
export const canWriteUserLists = (adminInfo = getAdminInfo()) => {
  if (!adminInfo) return false;
  if (isElevatedAdmin(adminInfo)) return true;
  const pages = getPages(adminInfo);
  if (pages.includes('user-lists-write')) return true;
  if (!hasUserCapabilityFlags(pages) && (pages.includes('users') || pages.includes('user-lists'))) {
    return true;
  }
  return false;
};

/** Can see steps / form progress on user details. */
export const canViewSteps = (adminInfo = getAdminInfo()) => {
  if (!adminInfo) return false;
  if (isElevatedAdmin(adminInfo)) return true;
  const pages = getPages(adminInfo);
  if (pages.includes('view-steps')) return true;
  if (!hasUserCapabilityFlags(pages) && hasUsersPageAccess(adminInfo)) return true;
  return false;
};

/** Can see payment / premium plan money fields / payment history. */
export const canViewPayment = (adminInfo = getAdminInfo()) => {
  if (!adminInfo) return false;
  if (isElevatedAdmin(adminInfo)) return true;
  const pages = getPages(adminInfo);
  if (pages.includes('view-payment')) return true;
  if (!hasUserCapabilityFlags(pages) && hasUsersPageAccess(adminInfo)) return true;
  return false;
};

/**
 * When opening the permissions editor for a legacy admin who has Users access
 * but no capability flags yet, treat all capabilities as enabled in the UI
 * so saving doesn't accidentally lock them out.
 */
export const expandLegacyUserCapabilities = (pages = []) => {
  const next = [...pages];
  const hasUsers = next.includes('users') || next.includes('user-lists');
  if (!hasUsers) return next;

  if (next.includes('edit-users') && !next.includes('users-write')) {
    next.push('users-write');
  }

  if (!hasUserCapabilityFlags(next)) {
    for (const key of USER_CAPABILITY_KEYS) {
      if (!next.includes(key)) next.push(key);
    }
  }
  return next;
};

export const checkPermission = (requiredPermission) => {
  const adminInfo = getAdminInfo();
  if (!adminInfo) return false;

  if (requiredPermission === 'admin-settings' || requiredPermission === 'security-operations') {
    return hasSecurityPrivileges(adminInfo);
  }

  // Privileged admins bypass all permission checks
  if (isElevatedAdmin(adminInfo)) return true;

  // Capability helpers (also callable via checkPermission for convenience)
  if (requiredPermission === 'users-write') return canWriteUsers(adminInfo);
  if (requiredPermission === 'user-lists-write') return canWriteUserLists(adminInfo);
  if (requiredPermission === 'view-steps') return canViewSteps(adminInfo);
  if (requiredPermission === 'view-payment') return canViewPayment(adminInfo);
  if (requiredPermission === 'edit-users') return canWriteUsers(adminInfo);

  const pages = getPages(adminInfo);
  return pages.includes(requiredPermission);
};
