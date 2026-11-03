import type { HistoryEntry } from './ResultsContext';

/** Calendar day in the device's local time zone. */
export function localDay(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function isGraded(entry: HistoryEntry): boolean {
  return entry.result === 'correct' || entry.result === 'wrong';
}

export function activityProgress(
  history: readonly HistoryEntry[],
  now = new Date(),
) {
  const graded = history.filter(isGraded);
  const active = new Set(graded.map(({ date }) => localDay(date)));
  const monday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7));
  const nextMonday = new Date(monday);
  nextMonday.setDate(nextMonday.getDate() + 7);

  const activeDays = Array.from({ length: 7 }, (_, index) => {
    const day = new Date(monday);
    day.setDate(day.getDate() + index);
    return active.has(localDay(day));
  });
  const weeklyDone = graded.filter(
    ({ date }) => date >= monday && date < nextMonday,
  ).length;

  const cursor = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  if (!active.has(localDay(cursor))) cursor.setDate(cursor.getDate() - 1);
  let streakDays = 0;
  while (active.has(localDay(cursor))) {
    streakDays++;
    cursor.setDate(cursor.getDate() - 1);
  }
  return { activeDays, weeklyDone, streakDays };
}

/** Consecutive correct naming attempts; other exercise modes do not interrupt it. */
export function namingCorrectRun(history: readonly HistoryEntry[]): number {
  let count = 0;
  for (const entry of history) {
    if (entry.kind !== 'poimenovanje') continue;
    if (entry.result !== 'correct') break;
    count++;
  }
  return count;
}
