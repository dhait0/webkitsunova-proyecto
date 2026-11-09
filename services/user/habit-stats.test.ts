import { describe, expect, it } from 'vitest';
import {
  addDays,
  clampTarget,
  computeHabitStats,
  isDateKey,
  lastDays,
  todayKey,
  weekStart,
} from './habit-stats';

// 2026-11-11 is a Wednesday.
const TODAY = '2026-11-11';
const back = (n: number) => addDays(TODAY, -n);

describe('date helpers', () => {
  it('validates real calendar days only', () => {
    expect(isDateKey('2026-11-11')).toBe(true);
    expect(isDateKey('2026-02-30')).toBe(false);
    expect(isDateKey('2026-1-1')).toBe(false);
    expect(isDateKey(20261111)).toBe(false);
  });

  it('adds days across month and year boundaries', () => {
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01');
    expect(addDays('2026-03-01', -1)).toBe('2026-02-28');
  });

  it('finds the Monday of a week', () => {
    expect(weekStart('2026-11-11')).toBe('2026-11-09');
    expect(weekStart('2026-11-09')).toBe('2026-11-09');
    expect(weekStart('2026-11-15')).toBe('2026-11-09');
  });

  it('lists the last days oldest first', () => {
    expect(lastDays(TODAY, 3)).toEqual(['2026-11-09', '2026-11-10', '2026-11-11']);
  });

  it('computes the calendar day in the given zone, not the server one', () => {
    const instant = new Date('2026-11-12T03:30:00Z'); // 22:30 on the 11th in Bogotá
    expect(todayKey('America/Bogota', instant)).toBe('2026-11-11');
    expect(todayKey('Europe/Madrid', instant)).toBe('2026-11-12');
  });

  it('falls back to the default zone when the zone is invalid or missing', () => {
    const instant = new Date('2026-11-12T03:30:00Z');
    expect(todayKey('No/Existe', instant)).toBe('2026-11-11');
    expect(todayKey(null, instant)).toBe('2026-11-11');
  });

  it('keeps the weekly goal between 1 and 7', () => {
    expect(clampTarget(0)).toBe(1);
    expect(clampTarget(12)).toBe(7);
    expect(clampTarget(3.4)).toBe(3);
    expect(clampTarget(Number.NaN)).toBe(7);
  });
});

describe('computeHabitStats — daily goal', () => {
  it('returns zeros and no invented figures without logs', () => {
    const stats = computeHabitStats([], 7, TODAY);
    expect(stats).toMatchObject({
      loggedToday: false,
      last7: 0,
      progress7: 0,
      consistency4w: 0,
      streak: 0,
      bestStreak: 0,
      total: 0,
      lastLoggedOn: null,
    });
    expect(stats.recent).toHaveLength(7);
    expect(stats.history).toHaveLength(28);
  });

  it('counts a run ending today', () => {
    const stats = computeHabitStats([TODAY, back(1), back(2)], 7, TODAY);
    expect(stats.streak).toBe(3);
    expect(stats.loggedToday).toBe(true);
    expect(stats.last7).toBe(3);
    expect(stats.progress7).toBe(43);
  });

  it('keeps the run alive when only today is missing', () => {
    expect(computeHabitStats([back(1), back(2)], 7, TODAY).streak).toBe(2);
  });

  it('breaks the run after a fully missed day', () => {
    const stats = computeHabitStats([back(2), back(3)], 7, TODAY);
    expect(stats.streak).toBe(0);
    expect(stats.bestStreak).toBe(2);
  });

  it('keeps the best run separate from the current one', () => {
    const stats = computeHabitStats([TODAY, back(5), back(6), back(7), back(8)], 7, TODAY);
    expect(stats.streak).toBe(1);
    expect(stats.bestStreak).toBe(4);
  });

  it('never counts the same day twice or future days', () => {
    const stats = computeHabitStats([TODAY, TODAY, addDays(TODAY, 1)], 7, TODAY);
    expect(stats.total).toBe(1);
    expect(stats.streak).toBe(1);
  });

  it('measures four-week consistency against the goal', () => {
    const all28 = lastDays(TODAY, 28);
    expect(computeHabitStats(all28, 7, TODAY).consistency4w).toBe(100);
    expect(computeHabitStats(all28.slice(0, 14), 7, TODAY).consistency4w).toBe(50);
  });

  it('reports the latest logged day', () => {
    expect(computeHabitStats([back(9), back(3)], 7, TODAY).lastLoggedOn).toBe(back(3));
  });
});

describe('computeHabitStats — weekly goal', () => {
  it('caps progress at 100 when the goal is exceeded', () => {
    const stats = computeHabitStats([TODAY, back(1), back(2), back(3)], 3, TODAY);
    expect(stats.progress7).toBe(100);
  });

  it('counts consecutive weeks that met the goal', () => {
    // Goal 2/week. Previous two weeks met it; this week has one log so far.
    const days = [
      addDays('2026-11-09', -7), addDays('2026-11-09', -6),
      addDays('2026-11-09', -14), addDays('2026-11-09', -13),
      TODAY,
    ];
    const stats = computeHabitStats(days, 2, TODAY);
    expect(stats.streakUnit).toBe('weeks');
    expect(stats.streak).toBe(2);
    expect(stats.bestStreak).toBe(2);
  });

  it('adds the current week once it meets the goal', () => {
    const days = [addDays('2026-11-09', -7), addDays('2026-11-09', -6), '2026-11-09', TODAY];
    expect(computeHabitStats(days, 2, TODAY).streak).toBe(2);
  });

  it('breaks the run when a whole week misses the goal', () => {
    const days = [addDays('2026-11-09', -14), addDays('2026-11-09', -13), '2026-11-09', TODAY];
    const stats = computeHabitStats(days, 2, TODAY);
    expect(stats.streak).toBe(1);
    expect(stats.bestStreak).toBe(1);
  });
});
