const NOTE_PREFIX = 'note-';

export function encodeNoteKey(adminEmail) {
  return `${NOTE_PREFIX}${String(adminEmail)
    .replace(/@/g, '__AT__')
    .replace(/\./g, '__DOT__')}`;
}

export function decodeNoteKey(noteKey) {
  if (!noteKey?.startsWith(NOTE_PREFIX)) return noteKey || '';
  return noteKey
    .slice(NOTE_PREFIX.length)
    .replace(/__DOT__/g, '.')
    .replace(/__AT__/g, '@');
}

function isNoteEntry(value) {
  return value && typeof value === 'object' && typeof value.note === 'string';
}

export function normalizeNotesObject(rawNotes = {}) {
  const normalized = {};

  for (const [key, value] of Object.entries(rawNotes)) {
    if (!key.startsWith(NOTE_PREFIX)) continue;

    if (isNoteEntry(value)) {
      const email = decodeNoteKey(key);
      normalized[encodeNoteKey(email)] = {
        note: value.note,
        createdAt: value.createdAt
      };
      continue;
    }

    if (value && typeof value === 'object') {
      for (const [suffix, nested] of Object.entries(value)) {
        if (!isNoteEntry(nested)) continue;
        const partial = key.slice(NOTE_PREFIX.length);
        const email = partial.includes('__AT__') || partial.includes('__DOT__')
          ? decodeNoteKey(key)
          : `${partial}.${suffix}`;
        normalized[encodeNoteKey(email)] = {
          note: nested.note,
          createdAt: nested.createdAt
        };
      }
    }
  }

  return normalized;
}

/** Flat list for UI tables/modals */
export function notesToArray(rawNotes = {}) {
  return Object.entries(normalizeNotesObject(rawNotes))
    .map(([key, value]) => ({
      adminEmail: decodeNoteKey(key),
      note: value.note,
      createdAt: value.createdAt
    }))
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

/** MongoDB splits keys at dots — legacy docs used `note-user@gmail` + `{ com: {...} }`. */
export function legacyBrokenNoteKey(adminEmail) {
  const lastDot = String(adminEmail).lastIndexOf('.');
  if (lastDot === -1) return null;
  return `${NOTE_PREFIX}${adminEmail.slice(0, lastDot)}`;
}

export function getNoteForAdmin(notesMap, adminEmail) {
  const normalized = normalizeNotesObject(notesMap);
  return normalized[encodeNoteKey(adminEmail)]?.note || '';
}
