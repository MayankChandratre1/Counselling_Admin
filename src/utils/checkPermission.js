/**
 * Check if the currently logged-in admin has a given permission page.
 * Pages are stored in sessionStorage under adminInfo.permissions.pages.
 * Super-admins and security-admins always have access.
 */
import { hasSecurityPrivileges } from './securityRole';

/** Set on save once Users capabilities have been explicitly configured. */
export const USERS_CAPS_CONFIGURED = 'users-caps-configured';

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

/**
 * Explicit mode: capabilities were configured (marker or any cap key present).
 * In explicit mode, missing a key means DENY — never fall back to full access.
 */
export const isUsersCapsExplicit = (pages = getPages()) =>
  pages.includes(USERS_CAPS_CONFIGURED) ||
  USER_CAPABILITY_KEYS.some((k) => pages.includes(k));

export const hasUsersPageAccess = (adminInfo = getAdminInfo()) => {
  if (!adminInfo) return false;
  if (isElevatedAdmin(adminInfo)) return true;
  const pages = getPages(adminInfo);
  return pages.includes('users') || pages.includes('user-lists') || pages.includes('premium-users');
};

/**
 * Can edit/delete users (Users + Premium Users).
 * Legacy (no marker / no caps): keep write if they have users.
 * Explicit: require users-write or edit-users.
 */
export const canWriteUsers = (adminInfo = getAdminInfo()) => {
  if (!adminInfo) return false;
  if (isElevatedAdmin(adminInfo)) return true;
  const pages = getPages(adminInfo);
  if (!pages.includes('users') && !pages.includes('premium-users')) return false;
  if (isUsersCapsExplicit(pages)) {
    return pages.includes('users-write') || pages.includes('edit-users');
  }
  return pages.includes('users');
};

/**
 * Can edit/delete/assign on user lists.
 */
export const canWriteUserLists = (adminInfo = getAdminInfo()) => {
  if (!adminInfo) return false;
  if (isElevatedAdmin(adminInfo)) return true;
  const pages = getPages(adminInfo);
  if (!pages.includes('users') && !pages.includes('user-lists')) return false;
  if (isUsersCapsExplicit(pages)) {
    return pages.includes('user-lists-write');
  }
  return true;
};

/** Can see steps / form progress on user details. */
export const canViewSteps = (adminInfo = getAdminInfo()) => {
  if (!adminInfo) return false;
  if (isElevatedAdmin(adminInfo)) return true;
  if (!hasUsersPageAccess(adminInfo)) return false;
  const pages = getPages(adminInfo);
  if (isUsersCapsExplicit(pages)) {
    return pages.includes('view-steps');
  }
  return true;
};

/** Can see payment / premium plan money fields / payment history. */
export const canViewPayment = (adminInfo = getAdminInfo()) => {
  if (!adminInfo) return false;
  if (isElevatedAdmin(adminInfo)) return true;
  if (!hasUsersPageAccess(adminInfo)) return false;
  const pages = getPages(adminInfo);
  if (isUsersCapsExplicit(pages)) {
    return pages.includes('view-payment');
  }
  return true;
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

  // Legacy only: no marker and no caps → show all checked in the UI
  if (!isUsersCapsExplicit(next)) {
    for (const key of USER_CAPABILITY_KEYS) {
      if (!next.includes(key)) next.push(key);
    }
  }
  return next;
};

/**
 * Normalize pages before save so unchecked caps actually mean deny.
 * Always stamps users-caps-configured when Users access is granted.
 */
export const finalizeUserCapabilityPages = (pages = []) => {
  let next = [...pages];
  const hasUsers = next.includes('users');

  if (!hasUsers) {
    return next.filter(
      (p) => p !== USERS_CAPS_CONFIGURED && !USER_CAPABILITY_KEYS.includes(p) && p !== 'edit-users'
    );
  }

  if (!next.includes(USERS_CAPS_CONFIGURED)) {
    next.push(USERS_CAPS_CONFIGURED);
  }

  if (next.includes('users-write') && !next.includes('edit-users')) {
    next.push('edit-users');
  }
  if (!next.includes('users-write')) {
    next = next.filter((p) => p !== 'edit-users');
  }

  return next;
};

export const checkPermission = (requiredPermission) => {
  const adminInfo = getAdminInfo();
  if (!adminInfo) return false;

  if (requiredPermission === 'admin-settings' || requiredPermission === 'security-operations') {
    return hasSecurityPrivileges(adminInfo);
  }

  if (isElevatedAdmin(adminInfo)) return true;

  if (requiredPermission === 'users-write') return canWriteUsers(adminInfo);
  if (requiredPermission === 'user-lists-write') return canWriteUserLists(adminInfo);
  if (requiredPermission === 'view-steps') return canViewSteps(adminInfo);
  if (requiredPermission === 'view-payment') return canViewPayment(adminInfo);
  if (requiredPermission === 'edit-users') return canWriteUsers(adminInfo);

  const pages = getPages(adminInfo);
  return pages.includes(requiredPermission);
};
