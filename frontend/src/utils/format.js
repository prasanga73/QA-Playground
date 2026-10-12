// SQLite's datetime('now') stores UTC as "YYYY-MM-DD HH:MM:SS" with no zone marker,
// which browsers would otherwise parse as local time.
const SQLITE_UTC_PATTERN = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/;

export const parseServerDate = (value) => {
  if (!value) return null;
  const normalized = SQLITE_UTC_PATTERN.test(value) ? `${value.replace(' ', 'T')}Z` : value;
  const date = new Date(normalized);
  return Number.isNaN(date.getTime()) ? null : date;
};

export const formatDateTime = (value) => {
  const date = parseServerDate(value);
  if (!date) return value || '—';
  return date.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const formatDate = (value) => {
  const date = parseServerDate(value);
  if (!date) return value || '—';
  return date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
};
