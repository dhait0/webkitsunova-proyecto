/**
 * Pure calculations over the days a habit was completed. Dates travel as
 * `YYYY-MM-DD` keys in the user's own calendar, so nothing here depends on the
 * server's time zone. Every figure is derived from the logged days; nothing is
 * stored or estimated.
 */

export type DateKey = string;

export const DEFAULT_HABIT_TIMEZONE = 'America/Bogota';

const DAY_MS = 86_400_000;

function toUtc(key: DateKey): number {
  const [y, m, d] = key.split('-').map(Number);
  return Date.UTC(y, m - 1, d);
}

function fromUtc(ms: number): DateKey {
  return new Date(ms).toISOString().slice(0, 10);
}

export function isDateKey(value: unknown): value is DateKey {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  return fromUtc(toUtc(value)) === value;
}

export function addDays(key: DateKey, days: number): DateKey {
  return fromUtc(toUtc(key) + days * DAY_MS);
}

export function daysBetween(from: DateKey, to: DateKey): number {
  return Math.round((toUtc(to) - toUtc(from)) / DAY_MS);
}

/** Monday of the week that contains `key`. */
export function weekStart(key: DateKey): DateKey {
  const weekday = new Date(toUtc(key)).getUTCDay();
  return addDays(key, -((weekday + 6) % 7));
}

/** Today's date in `timeZone` (falls back to the default zone when invalid). */
export function todayKey(timeZone: string | null | undefined, now: Date = new Date()): DateKey {
  const zones = [timeZone, DEFAULT_HABIT_TIMEZONE];
  for (const zone of zones) {
    if (!zone) continue;
    try {
      return new Intl.DateTimeFormat('en-CA', {
        timeZone: zone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      }).format(now);
    } catch {
      // try the next zone
    }
  }
  return fromUtc(now.getTime());
}

/** The `count` days ending at `end`, oldest first. */
export function lastDays(end: DateKey, count: number): DateKey[] {
  return Array.from({ length: count }, (_, i) => addDays(end, i - (count - 1)));
}

export type HabitStats = {
  loggedToday: boolean;
  /** Days completed in the last 7 days, today included. */
  last7: number;
  /** Rolling 7 days against the weekly goal, capped at 100. */
  progress7: number;
  /** Last 28 days against four weeks of the goal, capped at 100. */
  consistency4w: number;
  /** Current run: consecutive days for a daily goal, consecutive weeks otherwise. */
  streak: number;
  bestStreak: number;
  streakUnit: 'days' | 'weeks';
  total: number;
  lastLoggedOn: DateKey | null;
  /** Last 7 days, oldest first. */
  recent: Array<{ date: DateKey; done: boolean }>;
  /** Last 28 days, oldest first. */
  history: Array<{ date: DateKey; done: boolean }>;
};

export function clampTarget(target: number): number {
  if (!Number.isFinite(target)) return 7;
  return Math.min(7, Math.max(1, Math.round(target)));
}

function dayRuns(days: Set<DateKey>, today: DateKey): { current: number; best: number } {
  const sorted = [...days].filter((d) => d <= today).sort();
  let best = 0;
  let run = 0;
  let previous: DateKey | null = null;
  for (const day of sorted) {
    run = previous && daysBetween(previous, day) === 1 ? run + 1 : 1;
    best = Math.max(best, run);
    previous = day;
  }

  // A streak survives until the day ends: yesterday still counts.
  let cursor = days.has(today) ? today : addDays(today, -1);
  let current = 0;
  while (days.has(cursor)) {
    current += 1;
    cursor = addDays(cursor, -1);
  }
  return { current, best };
}

function weekRuns(
  days: Set<DateKey>,
  today: DateKey,
  target: number,
): { current: number; best: number } {
  const perWeek = new Map<DateKey, number>();
  for (const day of days) {
    if (day > today) continue;
    const start = weekStart(day);
    perWeek.set(start, (perWeek.get(start) ?? 0) + 1);
  }
  const meets = (start: DateKey) => (perWeek.get(start) ?? 0) >= target;

  const thisWeek = weekStart(today);
  let best = 0;
  if (perWeek.size > 0) {
    const first = [...perWeek.keys()].sort()[0];
    let run = 0;
    for (let w = first; w <= thisWeek; w = addDays(w, 7)) {
      run = meets(w) ? run + 1 : 0;
      best = Math.max(best, run);
    }
  }

  // The week in progress only adds to the run; it never breaks it.
  let cursor = meets(thisWeek) ? thisWeek : addDays(thisWeek, -7);
  let current = 0;
  while (meets(cursor)) {
    current += 1;
    cursor = addDays(cursor, -7);
  }
  return { current, best };
}

export function computeHabitStats(
  loggedDays: readonly DateKey[],
  targetPerWeek: number,
  today: DateKey,
): HabitStats {
  const target = clampTarget(targetPerWeek);
  const days = new Set(loggedDays.filter((d) => d <= today));

  const recent = lastDays(today, 7).map((date) => ({ date, done: days.has(date) }));
  const history = lastDays(today, 28).map((date) => ({ date, done: days.has(date) }));
  const last7 = recent.filter((d) => d.done).length;
  const last28 = history.filter((d) => d.done).length;

  const daily = target === 7;
  const runs = daily ? dayRuns(days, today) : weekRuns(days, today, target);
  const sorted = [...days].sort();

  return {
    loggedToday: days.has(today),
    last7,
    progress7: Math.min(100, Math.round((last7 / target) * 100)),
    consistency4w: Math.min(100, Math.round((last28 / (target * 4)) * 100)),
    streak: runs.current,
    bestStreak: runs.best,
    streakUnit: daily ? 'days' : 'weeks',
    total: days.size,
    lastLoggedOn: sorted.length > 0 ? sorted[sorted.length - 1] : null,
    recent,
    history,
  };
}
