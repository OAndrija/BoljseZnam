import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { openUserDatabase } from '../src/main/userData.ts';
import { activityProgress } from '../src/renderer/progress/activity.ts';

test('history, XP, drafts, and streak days survive a database reopen', () => {
  const directory = mkdtempSync(path.join(tmpdir(), 'boljseznam-test-'));
  const filename = path.join(directory, 'progress.sqlite');
  try {
    let database = openUserDatabase(filename);
    assert.deepEqual(database.load(), {
      totalXp: 0,
      weeklyGoal: 20,
      history: [],
      drafts: [],
    });
    const first = {
      id: 'attempt-1',
      completedAtMs: 1_000,
      localDay: '2026-11-03',
      kind: 'naloga',
      taskKey: 'KEM-2020-1',
      outcome: 'solution-viewed',
      problemJson: null,
    };
    assert.equal(database.saveHistory(first), 0);
    assert.equal(database.saveHistory({ ...first, outcome: 'wrong' }), 2);
    assert.equal(database.saveHistory({ ...first, outcome: 'correct' }), 10);
    assert.equal(database.saveHistory({ ...first, outcome: 'correct' }), 10);
    assert.equal(
      database.saveHistory({ ...first, id: 'attempt-2', outcome: 'correct' }),
      20,
    );
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
    assert.equal(loaded.totalXp, 20);
    assert.equal(loaded.history.length, 2);
    assert.equal(loaded.history[0].localDay, '2026-11-03');
    assert.deepEqual(JSON.parse(loaded.drafts[0].stateJson).answers, ['H2O']);
    assert.equal(
      database.saveHistory({
        ...first,
        id: 'equation-1',
        kind: 'reakcija',
        taskKey: null,
        problemJson: '{"reactants":[],"products":[]}',
        outcome: 'wrong',
      }),
      20,
    );
    database.clearHistory();
    assert.equal(database.load().totalXp, 0);
    assert.equal(database.load().history.length, 0);
    assert.equal(database.load().drafts.length, 1);
    database.deleteDraft('naloga:KEM-2020-1');
    assert.equal(database.load().drafts.length, 0);
    database.close();
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});

test('streaks use the saved local day and ignore viewed solutions', () => {
  const now = new Date(2026, 10, 3, 12);
  const history = [
    { date: new Date(0), localDay: '2026-11-02', result: 'correct' },
    { date: new Date(0), localDay: '2026-11-01', result: 'wrong' },
    { date: now, localDay: '2026-11-03', result: 'solution-viewed' },
  ];
  const progress = activityProgress(history, now);
  assert.equal(progress.streakDays, 2);
  assert.equal(progress.weeklyDone, 1);
  assert.deepEqual(progress.activeDays.slice(0, 2), [true, false]);
});
