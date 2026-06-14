/**
 * Shared date parsing and display helpers for Counselling_Admin.
 * Display format: localised en-IN, e.g. "14 Jun 2026, 10:30 am"
 */

export function parseDate(value) {
  if (value == null || value === '') return null;
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value;
  if (typeof value === 'object') {
    if (value._seconds != null) return new Date(value._seconds * 1000);
    if (typeof value.toDate === 'function') {
      const d = value.toDate();
      return d instanceof Date && !Number.isNaN(d.getTime()) ? d : null;
    }
  }
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

export function getDateMillis(value) {
  const d = parseDate(value);
  return d ? d.getTime() : 0;
}

/** Localised: "14 Jun 2026, 10:30 am" */
export function formatDisplayDate(value, { withTime = true } = {}) {
  const d = parseDate(value);
  if (!d) return 'N/A';
  return d.toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    ...(withTime ? { hour: '2-digit', minute: '2-digit' } : {}),
  });
}

/** DD/MM/YYYY with optional time: "14/06/2026, 10:30 am" */
export function formatSlashDate(value, { withTime = true } = {}) {
  const d = parseDate(value);
  if (!d) return 'N/A';
  const pad = (n) => String(n).padStart(2, '0');
  const datePart = `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
  if (!withTime) return datePart;
  const timePart = d.toLocaleString('en-IN', { hour: '2-digit', minute: '2-digit' });
  return `${datePart}, ${timePart}`;
}
