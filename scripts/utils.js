export function formatNumber(num) {
  if (num === null || num === undefined) return '0';
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return num.toLocaleString();
}

export function formatPercentage(value, total) {
  if (total === 0) return '0';
  return ((value / total) * 100).toFixed(1);
}

export function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

export function truncate(str, maxLength) {
  if (!str || str.length <= maxLength) return str || '';
  return str.slice(0, maxLength - 3) + '...';
}

export function pluralize(count, singular, plural) {
  return count === 1 ? singular : plural || `${singular}s`;
}

export function safeDivide(a, b) {
  if (!b || b === 0) return 0;
  return a / b;
}

export function daysBetween(date1, date2) {
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  return Math.floor(Math.abs(d2 - d1) / (1000 * 60 * 60 * 24));
}

export function escapeXml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export function calculateMergeRate(merged, total) {
  if (!total || total === 0) return 0;
  return Math.round((merged / total) * 100);
}

export function calculateAverage(values) {
  if (!values || values.length === 0) return 0;
  const sum = values.reduce((a, b) => a + b, 0);
  return sum / values.length;
}

export function groupBy(arr, keyFn) {
  const map = new Map();
  for (const item of arr) {
    const key = keyFn(item);
    if (!map.has(key)) map.set(key, []);
    map.get(key).push(item);
  }
  return map;
}

export function sortBy(arr, keyFn, order = 'desc') {
  return [...arr].sort((a, b) => {
    const ka = keyFn(a);
    const kb = keyFn(b);
    if (ka < kb) return order === 'desc' ? 1 : -1;
    if (ka > kb) return order === 'desc' ? -1 : 1;
    return 0;
  });
}
