export const hasSecurityPrivileges = (adminInfo) => {
  if (!adminInfo) return false;

  if (adminInfo.role === 'security-admin') return true;
  if (adminInfo.role === 'super-admin' && Boolean(adminInfo.isSecurityMod)) return true;

  return false;
};
