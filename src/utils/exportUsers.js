import * as XLSX from 'xlsx';
import { formatDisplayDate } from './formatDate';
import { getPaymentSourceDisplay } from './paymentSource';
import { notesToArray } from './noteKeys';

function getNotesObject(user) {
  if (!user?.notes) return {};
  if (user.notes.notes && typeof user.notes.notes === 'object') return user.notes.notes;
  if (typeof user.notes === 'object') return user.notes;
  return {};
}

export function usersToExportRows(users, { usePurchaseDate = false } = {}) {
  return users.map((user) => {
    const formattedNotes = notesToArray(getNotesObject(user)).map((entry) => ({
      admin: entry.adminEmail,
      note: entry.note,
      date: formatDisplayDate(entry.createdAt)
    }));

    const row = {
      Name: user.name || '',
      Phone: user.phone || '',
      Email: user.email || '',
      CreatedAt: formatDisplayDate(user.createdAt),
      Batch: user.batch || 'Unassigned',
      IsPremium: user.isPremium ? 'Yes' : 'No',
      Plan: user.premiumPlan?.planTitle || '',
      HasLoggedIn: user.hasLoggedIn ? 'Yes' : 'No',
      FormFilled: user.formFilled ? 'Yes' : 'No',
      AssignedLists: user.lists?.map((list) => list.title).join('; ') || '',
      ListsCount: user.lists?.length || 0,
      NotesCount: formattedNotes.length,
      LastNote: formattedNotes[0]?.note || '',
      LastNoteBy: formattedNotes[0]?.admin || '',
      LastNoteDate: formattedNotes[0]?.date || '',
      AllNotes: formattedNotes.map((n) => `${n.note} (by ${n.admin} on ${n.date})`).join('\n')
    };

    if (usePurchaseDate || user.premiumPlan?.purchasedDate) {
      row.PurchaseDate = formatDisplayDate(user.premiumPlan?.purchasedDate);
      row.ExpiryDate = formatDisplayDate(user.premiumPlan?.expiryDate);
      row.PaymentSource = getPaymentSourceDisplay(user.premiumPlan);
      row.PaymentPending = user.premiumPlan?.isPaymentPending ? 'Yes' : 'No';
      row.AmountPaid = user.premiumPlan?.amountPaid ?? '';
      row.AmountRemaining = user.premiumPlan?.amountRemaining ?? '';
    }

    return row;
  });
}

export function buildUsersExportFilename({ filters = {}, batch, isSearchMode, searchParams = {} } = {}) {
  const date = new Date().toISOString().split('T')[0];
  const parts = ['users', date];

  if (isSearchMode) {
    if (searchParams.name?.trim()) parts.push(`name-${searchParams.name.trim().slice(0, 20)}`);
    if (searchParams.phone?.trim()) parts.push(`phone-${searchParams.phone.trim()}`);
  }
  if (filters.isPremium && filters.isPremium !== 'all') parts.push(`premium-${filters.isPremium}`);
  if (filters.plan && filters.plan !== 'all') parts.push(`plan-${filters.plan}`);
  if (filters.listAssigned && filters.listAssigned !== 'all') {
    parts.push(filters.listAssigned === 'true' ? 'with-lists' : 'no-lists');
  }
  if (filters.fromDate) parts.push(`from-${filters.fromDate}`);
  if (filters.toDate) parts.push(`to-${filters.toDate}`);
  if (batch && batch !== 'all') parts.push(`batch-${batch}`);

  const safe = parts
    .join('_')
    .replace(/[^a-zA-Z0-9_-]/g, '-')
    .replace(/-+/g, '-');
  return `${safe}.xlsx`;
}

export function downloadUsersExport(users, options = {}) {
  const rows = usersToExportRows(users, options);
  if (!rows.length) return false;

  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Users');
  XLSX.writeFile(wb, buildUsersExportFilename(options));
  return true;
}
