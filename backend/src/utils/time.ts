/** Current month bucket as 'YYYY-MM' (UTC) — the key for monthly leaderboard points. */
export function currentMonthKey(date = new Date()): string {
  return date.toISOString().slice(0, 7);
}
