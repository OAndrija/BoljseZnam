import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import type { StoredHistory } from '../src/shared/types';
import { openUserDatabase } from '../src/main/userData';
import { activityProgress } from '../src/renderer/progress/activity';
import type { HistoryEntry } from '../src/renderer/progress/ResultsContext';

describe('SQLite user data', () => {
  it('persists attempts, XP and drafts across a reopen', () => {
    const directory = mkdtempSync(path.join(tmpdir(), 'boljseznam-test-'));
    const filename = path.join(directory, 'progress.sqlite');
    let database = openUserDatabase(filename);
    try {
      expect(database.load()).toEqual({
        totalXp: 0,
        weeklyGoal: 20,
        history: [],
        drafts: [],
      });
      const first: StoredHistory = {
        id: 'attempt-1',
        completedAtMs: 1_000,
        localDay: '2026-11-03',
        kind: 'naloga',
        taskKey: 'KEM-2020-1',
        outcome: 'solution-viewed',
        problemJson: null,
      };
      expect(database.saveHistory(first)).toBe(0);
      expect(database.saveHistory({ ...first, outcome: 'wrong' })).toBe(2);
      expect(database.saveHistory({ ...first, outcome: 'correct' })).toBe(10);
      expect(database.saveHistory({ ...first, outcome: 'correct' })).toBe(10);
      expect(
        database.saveHistory({ ...first, id: 'attempt-2', outcome: 'correct' }),
      ).toBe(20);
      database.saveDraft({
        draftKey: 'naloga:KEM-2020-1',
        kind: 'naloga',
        stateVersion: 1,
        stateJson: JSON.stringify({ kind: 'naloga', answers: ['H2O'] }),
        updatedAtMs: 2_000,
      });
      database.close();

      database = openUserDatabase(filename);
      const loaded = database.load();
      expect(loaded.totalXp).toBe(20);
      expect(loaded.history).toHaveLength(2);
      expect(loaded.history[0].localDay).toBe('2026-11-03');
      expect(JSON.parse(loaded.drafts[0].stateJson).answers).toEqual(['H2O']);

      expect(
        database.saveHistory({
          ...first,
          id: 'equation-1',
          kind: 'reakcija',
          taskKey: null,
          problemJson: '{"reactants":[],"products":[]}',
          outcome: 'wrong',
        }),
      ).toBe(20);
      expect(() =>
        database.saveHistory({
          ...first,
          id: 'skip',
          outcome: 'skipped',
        } as unknown as StoredHistory),
      ).toThrow();
      expect(database.load().history).toHaveLength(3);

      database.clearHistory();
      expect(database.load().totalXp).toBe(0);
      expect(database.load().history).toEqual([]);
      expect(database.load().drafts).toHaveLength(1);
      database.deleteDraft('naloga:KEM-2020-1');
      expect(database.load().drafts).toEqual([]);
    } finally {
      database.close();
      rmSync(directory, { recursive: true, force: true });
    }
  });
});

describe('activity from saved history', () => {
  it('uses the saved local day and ignores viewed solutions', () => {
    const now = new Date(2026, 10, 3, 12);
    const entry = (
      localDay: string,
      result: HistoryEntry['result'],
    ): HistoryEntry => ({
      id: `${localDay}-${result}`,
      date: new Date(0),
      localDay,
      kind: 'naloga',
      taskKey: 'KEM-2020-1',
      chapter: null,
      result,
    });
    const history = [
      entry('2026-11-02', 'correct'),
      entry('2026-11-01', 'wrong'),
      entry('2026-11-03', 'solution-viewed'),
    ];
    const progress = activityProgress(history, now);
    expect(progress.streakDays).toBe(2);
    expect(progress.weeklyDone).toBe(1);
    expect(progress.activeDays.slice(0, 2)).toEqual([true, false]);
  });
});
