const IST_OFFSET_MS = 5.5 * 60 * 60 * 1_000;
const DAY_MS = 24 * 60 * 60 * 1_000;

export function newsletterWeekKey(now = new Date()) {
  const ist = new Date(now.getTime() + IST_OFFSET_MS);
  const day = ist.getUTCDay();
  const daysSinceMonday = (day + 6) % 7;
  const monday = new Date(ist.getTime() - daysSinceMonday * DAY_MS);
  return monday.toISOString().slice(0, 10);
}

export function previousSevenDays(now = new Date()) {
  return {
    from: new Date(now.getTime() - 7 * DAY_MS),
    to: now,
  };
}
