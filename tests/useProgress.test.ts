import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { levelFor } from '../src/renderer/progress/levels';
import {
  useResults,
  type HistoryEntry,
} from '../src/renderer/progress/ResultsContext';
import {
  useProgress,
  type Progress,
} from '../src/renderer/progress/useProgress';

vi.mock('../src/renderer/progress/ResultsContext', () => ({
  useResults: vi.fn(),
}));

function renderProgress(
  history: HistoryEntry[],
  totalXp = 320,
  weeklyGoal = 30,
): Progress {
  vi.mocked(useResults).mockReturnValue({
    history,
    totalXp,
    weeklyGoal,
    outcomes: new Map(),
    saveHistory: vi.fn(),
    clearHistory: vi.fn(),
  });
  let result: Progress | undefined;
  function Reader() {
    result = useProgress();
    return null;
  }
  renderToStaticMarkup(createElement(Reader));
  return result!;
}

function attempt(day: number, result: HistoryEntry['result']): HistoryEntry {
  return {
    id: `${day}-${result}`,
    date: new Date(2026, 10, day, 12),
    localDay: `2026-11-${String(day).padStart(2, '0')}`,
    kind: 'naloga',
    taskKey: `KEM-2020-${day}`,
    chapter: null,
    result,
  };
}

describe('useProgress', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 10, 4, 12));
  });
  afterEach(() => vi.useRealTimers());

  it('uses persisted XP and weekly goal with graded attempts for activity', () => {
    const progress = renderProgress([
      attempt(4, 'correct'),
      attempt(3, 'wrong'),
      attempt(4, 'solution-viewed'),
    ]);

    expect(progress.xp).toBe(320);
    expect(progress.weeklyGoal).toBe(30);
    expect(progress.weeklyDone).toBe(2);
    expect(progress.streakDays).toBe(2);
    expect(progress.activeDays).toEqual([
      false,
      true,
      true,
      false,
      false,
      false,
      false,
    ]);
  });

  it('calculates the level from the stored XP total', () => {
    const progress = renderProgress([]);
    const expected = levelFor(320);

    expect(progress.level).toEqual(expected.current);
    expect(progress.nextLevel).toEqual(expected.next);
    expect(progress.levelLabel).toBe(
      `Stopnja ${expected.current.number} · ${expected.current.name}`,
    );
    expect(progress.levelProgress).toBe(
      (320 - expected.current.minXp) /
        (expected.next!.minXp - expected.current.minXp),
    );
    expect(progress.xpToNextLevel).toBe(expected.next!.minXp - 320);
  });

  it('reports a full level bar at the highest level', () => {
    const progress = renderProgress([], 1_000_000);
    expect(progress.nextLevel).toBeNull();
    expect(progress.levelProgress).toBe(1);
    expect(progress.xpToNextLevel).toBe(0);
  });
});
