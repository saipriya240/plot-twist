import moment from 'moment';

export const todayISO = () => moment().format('YYYY-MM-DD');

export const fmtDate = (value, fallback = '—') => (value ? moment(value).format('DD MMM YYYY') : fallback);

export const fmtShort = (value, fallback = '—') => (value ? moment(value).format('DD MMM') : fallback);

export const fmtLong = (value, fallback = '—') => (value ? moment(value).format('D MMMM YYYY') : fallback);

export const monthName = (month, year) =>
  moment(`${year}-${String(month).padStart(2, '0')}-01`).format('MMMM');

export const monthLabel = (month, year) => moment(`${year}-${String(month).padStart(2, '0')}-01`).format('MMMM YYYY');

export const daysDocumented = (dates) => new Set((dates || []).filter(Boolean)).size;

export const wordsOf = (text, fallbackSeconds) => {
  const words = String(text || '').trim().split(/\s+/).filter(Boolean).length;
  if (!words) return fallbackSeconds;
  return Math.max(1, Math.round(words / 160));
};