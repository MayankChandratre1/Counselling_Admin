/**
 * Global analytics year filter: scope metrics to users whose premium
 * plan purchase falls in the selected calendar year (premiumPlan.purchasedDate).
 */

export const ANALYTICS_PURCHASE_YEAR_KEY = 'counselling_admin_analytics_purchase_year';

export function readStoredPurchaseYear() {
  try {
    const v = localStorage.getItem(ANALYTICS_PURCHASE_YEAR_KEY);
    if (v === null || v === '' || v === 'ALL') return 'ALL';
    const n = parseInt(v, 10);
    if (Number.isFinite(n)) return String(n);
  } catch {
    /* ignore */
  }
  return 'ALL';
}

export function writeStoredPurchaseYear(year) {
  try {
    if (year === 'ALL') localStorage.removeItem(ANALYTICS_PURCHASE_YEAR_KEY);
    else localStorage.setItem(ANALYTICS_PURCHASE_YEAR_KEY, String(year));
  } catch {
    /* ignore */
  }
}

/** Milliseconds since epoch for premium purchase, or null if missing/invalid. */
export function getPurchaseDateMillis(user) {
  if (!user) return null;
  const pd = user.premiumPlan?.purchasedDate ?? user.purchasedDate;
  if (pd == null) return null;
  if (typeof pd === 'object' && pd._seconds != null) return pd._seconds * 1000;
  if (typeof pd === 'object' && typeof pd.toDate === 'function') {
    const d = pd.toDate();
    return d instanceof Date && !isNaN(d.getTime()) ? d.getTime() : null;
  }
  const d = new Date(pd);
  return isNaN(d.getTime()) ? null : d.getTime();
}

export function userMatchesPurchaseYear(user, yearFilter) {
  if (yearFilter === 'ALL') return true;
  const y = typeof yearFilter === 'string' ? parseInt(yearFilter, 10) : yearFilter;
  if (!Number.isFinite(y)) return true;
  const ms = getPurchaseDateMillis(user);
  if (ms == null) return false;
  return new Date(ms).getFullYear() === y;
}

export function filterUsersByPurchaseYear(users, yearFilter) {
  if (!Array.isArray(users) || yearFilter === 'ALL') return users || [];
  return users.filter((u) => userMatchesPurchaseYear(u, yearFilter));
}

function filterPlanUserMap(map, yearFilter) {
  if (yearFilter === 'ALL') return map || {};
  const out = {};
  for (const [plan, users] of Object.entries(map || {})) {
    const filtered = filterUsersByPurchaseYear(users, yearFilter);
    if (filtered.length) out[plan] = filtered;
  }
  return out;
}

/**
 * Returns a shallow-ish copy of analytics payload with enrolled users and list
 * distributions restricted to the purchase year. Other top-level fields are
 * preserved; metrics that depend on cohort are updated.
 */
export function applyPurchaseYearToAnalyticsData(data, yearFilter) {
  if (!data || yearFilter === 'ALL') return data;

  const enrolledUsers = filterUsersByPurchaseYear(
    data.metrics?.enrolled?.users || [],
    yearFilter
  );

  const premiumPlanDistribution = enrolledUsers.reduce((acc, u) => {
    const plan = u.planTitle || u.premiumPlan?.planTitle || 'Unknown';
    acc[plan] = (acc[plan] || 0) + 1;
    return acc;
  }, {});

  const todayUsers = filterUsersByPurchaseYear(
    data.metrics?.todayEnrolled?.users || [],
    yearFilter
  );
  const paymentUsers = filterUsersByPurchaseYear(
    data.metrics?.paymentPending?.users || [],
    yearFilter
  );

  const ld = data.listData || {};
  const userListDistributionWithLists = filterPlanUserMap(
    ld.userListDistributionWithLists,
    yearFilter
  );
  const userListDistributionWithoutLists = filterPlanUserMap(
    ld.userListDistributionWithoutLists,
    yearFilter
  );
  const userListDistributionWithCreatedLists = filterPlanUserMap(
    ld.userListDistributionWithCreatedLists,
    yearFilter
  );
  const userListDistributionWithoutCreatedLists = filterPlanUserMap(
    ld.userListDistributionWithoutCreatedLists,
    yearFilter
  );

  const usersWithLists = Object.values(userListDistributionWithLists).reduce(
    (s, arr) => s + arr.length,
    0
  );

  return {
    ...data,
    metrics: {
      ...data.metrics,
      enrolled: {
        total: enrolledUsers.length,
        users: enrolledUsers,
      },
      todayEnrolled: {
        total: todayUsers.length,
        users: todayUsers,
      },
      paymentPending: {
        total: paymentUsers.length,
        users: paymentUsers,
      },
    },
    premiumPlanDistribution,
    usersWithLists,
    usersWithoutLists: Math.max(0, (data.totalUsers || 0) - usersWithLists),
    listData: {
      ...ld,
      userListDistributionWithLists,
      userListDistributionWithoutLists,
      userListDistributionWithCreatedLists,
      userListDistributionWithoutCreatedLists,
    },
  };
}

/** Years shown in the selector: current year ± range, descending. */
export function buildPurchaseYearOptions({ currentYear = new Date().getFullYear(), pastSpan = 6, futureSpan = 1 } = {}) {
  const years = [];
  for (let y = currentYear + futureSpan; y >= currentYear - pastSpan; y--) {
    years.push(y);
  }
  return years;
}
