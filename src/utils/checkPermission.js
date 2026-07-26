/**
 * Check if the currently logged-in admin has a given permission page.
 * Pages are stored in sessionStorage under adminInfo.permissions.pages.
 * Super-admins and security-admins always have access.
 *
 * Users capabilities are ALLOW-ONLY (no legacy “has users ⇒ full access” fallback).
 * Unchecked caps must deny. Legacy admins without caps are upgraded at login
 * (see auth.service) so they keep access until a security admin reconfigures them.
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
  'users-export',
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
  {
    key: 'users-export',
    label: 'Export CSV',
    description: 'Allow exporting users / list colleges as CSV',
  },
];

const getAdminInfo = () => {
  try {
    return JSON.parse(sessionStorage.getItem('adminInfo') || 'null');
  } catch {
    return null;
  }
};

const getPages = (adminInfo = getAdminInfo()) => {
  const raw = adminInfo?.permissions?.pages ?? adminInfo?.pages ?? [];
  return Array.isArray(raw) ? raw : [];
};

export const isElevatedAdmin = (adminInfo = getAdminInfo()) => {
  if (!adminInfo) return false;
  return adminInfo.role === 'super-admin' || adminInfo.role === 'security-admin';
};

export const isUsersCapsExplicit = (pages = getPages()) =>
  pages.includes(USERS_CAPS_CONFIGURED) ||
  USER_CAPABILITY_KEYS.some((k) => pages.includes(k));

export const hasUsersPageAccess = (adminInfo = getAdminInfo()) => {
  if (!adminInfo) return false;
  if (isElevatedAdmin(adminInfo)) return true;
  const pages = getPages(adminInfo);
  return pages.includes('users') || pages.includes('user-lists') || pages.includes('premium-users');
};

/** Edit / delete users — requires users-write (or legacy edit-users). */
export const canWriteUsers = (adminInfo = getAdminInfo()) => {
  if (!adminInfo) return false;
  if (isElevatedAdmin(adminInfo)) return true;
  const pages = getPages(adminInfo);
  return pages.includes('users-write') || pages.includes('edit-users');
};

/** Edit / delete / assign user lists — requires user-lists-write. */
export const canWriteUserLists = (adminInfo = getAdminInfo()) => {
  if (!adminInfo) return false;
  if (isElevatedAdmin(adminInfo)) return true;
  return getPages(adminInfo).includes('user-lists-write');
};

/** Steps on user details — requires view-steps. */
export const canViewSteps = (adminInfo = getAdminInfo()) => {
  if (!adminInfo) return false;
  if (isElevatedAdmin(adminInfo)) return true;
  return getPages(adminInfo).includes('view-steps');
};

/** Payment info — requires view-payment. */
export const canViewPayment = (adminInfo = getAdminInfo()) => {
  if (!adminInfo) return false;
  if (isElevatedAdmin(adminInfo)) return true;
  return getPages(adminInfo).includes('view-payment');
};

/** Export users / list CSV — requires users-export. */
export const canExportUsers = (adminInfo = getAdminInfo()) => {
  if (!adminInfo) return false;
  if (isElevatedAdmin(adminInfo)) return true;
  return getPages(adminInfo).includes('users-export');
};

/**
 * When opening the permissions editor for a legacy admin who has Users access
 * but no capability flags yet, treat all capabilities as enabled in the UI.
 */
export const expandLegacyUserCapabilities = (pages = []) => {
  const next = [...pages];
  const hasUsers = next.includes('users') || next.includes('user-lists');
  if (!hasUsers) return next;

  if (next.includes('edit-users') && !next.includes('users-write')) {
    next.push('users-write');
  }

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
  if (requiredPermission === 'users-export') return canExportUsers(adminInfo);
  if (requiredPermission === 'edit-users') return canWriteUsers(adminInfo);

  return getPages(adminInfo).includes(requiredPermission);
};
