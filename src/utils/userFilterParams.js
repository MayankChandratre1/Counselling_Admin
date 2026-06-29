export const DEFAULT_USER_FILTERS = {
  isPremium: 'all',
  plan: 'all',
  listAssigned: 'all',
  fromDate: '',
  toDate: '',
};

export function isUserFilterActive(filters = {}) {
  return Object.values(filters).some((value) => value !== 'all' && value !== '');
}

/** Map UI filter state to API query params (omit "all" / empty). */
export function buildUserFilterParams(filters = {}, { premiumOnly = false } = {}) {
  const params = {};

  if (filters.isPremium && filters.isPremium !== 'all') {
    params.isPremium = filters.isPremium;
  }
  if (filters.plan && filters.plan !== 'all') {
    params.plan = filters.plan;
  }
  if (filters.listAssigned && filters.listAssigned !== 'all') {
    params.listAssigned = filters.listAssigned;
  }
  if (filters.fromDate) {
    params.fromDate = filters.fromDate;
  }
  if (filters.toDate) {
    params.toDate = filters.toDate;
  }
  if (filters.batch && filters.batch !== 'all') {
    params.batch = filters.batch;
  }
  if (filters.name?.trim()) {
    params.name = filters.name.trim();
  }
  if (filters.phone?.trim()) {
    params.phone = filters.phone.trim();
  }

  if (premiumOnly) {
    params.isPremium = 'true';
    params.dateFilterBy = 'purchasedDate';
  }

  return params;
}
