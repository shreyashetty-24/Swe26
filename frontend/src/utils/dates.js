// Display helpers. API dates stay ISO (YYYY-MM-DD); only the UI formats them.

/** Format a YYYY-MM-DD project date as month/day/year (e.g. 10/1/2026). */
export function formatDate(isoDate) {
  if (!isoDate) return '';
  const [year, month, day] = isoDate.split('-').map(Number);
  if (!year || !month || !day) return isoDate;
  // Construct as local calendar date so we don't shift a day near midnight UTC.
  return new Date(year, month - 1, day).toLocaleDateString('en-US');
}

/** Format an ISO timestamp (e.g. last activity) in the viewer's local time, month/day/year. */
export function formatDateTime(iso) {
  if (!iso) return '';
  return new Date(iso).toLocaleString('en-US');
}
