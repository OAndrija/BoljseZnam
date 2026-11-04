import { DatabaseSync } from 'node:sqlite';
import type {
  StoredDraft,
  StoredHistory,
  StoredKind,
  StoredOutcome,
  StoredProgress,
} from '../shared/types';

const kinds = new Set<StoredKind>(['naloga', 'poimenovanje', 'reakcija']);
const outcomes = new Set<StoredOutcome>([
  'correct',
  'wrong',
  'solution-viewed',
]);
const dayPattern = /^\d{4}-\d{2}-\d{2}$/;

function assertHistory(value: StoredHistory): void {
  if (
    !value ||
    typeof value.id !== 'string' ||
    !value.id ||
    !Number.isSafeInteger(value.completedAtMs) ||
    value.completedAtMs < 0 ||
    !dayPattern.test(value.localDay) ||
    !kinds.has(value.kind) ||
    !outcomes.has(value.outcome)
  ) {
    throw new Error('Invalid history entry');
  }
  if (value.kind === 'naloga') {
    if (
      typeof value.taskKey !== 'string' ||
      !value.taskKey ||
      value.problemJson !== null
    ) {
      throw new Error('Invalid NPZ history entry');
    }
  } else if (value.taskKey !== null || typeof value.problemJson !== 'string') {
    throw new Error('Invalid generated problem history entry');
  }
  if (value.problemJson !== null) JSON.parse(value.problemJson);
}

function assertDraft(value: StoredDraft): void {
  if (
    !value ||
    typeof value.draftKey !== 'string' ||
    !value.draftKey ||
    !kinds.has(value.kind) ||
    !Number.isSafeInteger(value.stateVersion) ||
    value.stateVersion < 1 ||
    typeof value.stateJson !== 'string' ||
    !Number.isSafeInteger(value.updatedAtMs) ||
    value.updatedAtMs < 0
  ) {
    throw new Error('Invalid draft');
  }
  JSON.parse(value.stateJson);
}

function xp(entry: Pick<StoredHistory, 'kind' | 'outcome'>): number {
  if (entry.outcome === 'correct') return 10;
  if (entry.kind === 'naloga' && entry.outcome === 'wrong') return 2;
  return 0;
}

export function openUserDatabase(filename: string) {
  const db = new DatabaseSync(filename);
  const version = db.prepare('PRAGMA user_version').get() as {
    user_version: number;
  };
  if (version.user_version > 1)
    throw new Error('This user database needs a newer app version');
  if (version.user_version === 0) {
    db.exec(`
      BEGIN;
      CREATE TABLE user_data (
        id INTEGER PRIMARY KEY CHECK (id = 1),
        total_xp INTEGER NOT NULL DEFAULT 0 CHECK (total_xp >= 0),
        weekly_goal INTEGER NOT NULL DEFAULT 20 CHECK (weekly_goal > 0)
      );
      INSERT INTO user_data (id) VALUES (1);
      CREATE TABLE drafts (
        draft_key TEXT PRIMARY KEY NOT NULL,
        kind TEXT NOT NULL CHECK (kind IN ('naloga','poimenovanje','reakcija')),
        state_version INTEGER NOT NULL DEFAULT 1 CHECK (state_version > 0),
        state_json TEXT NOT NULL CHECK (json_valid(state_json)),
        updated_at_ms INTEGER NOT NULL CHECK (updated_at_ms >= 0)
      );
      CREATE TABLE history (
        id TEXT PRIMARY KEY NOT NULL,
        completed_at_ms INTEGER NOT NULL CHECK (completed_at_ms >= 0),
        local_day TEXT NOT NULL,
        kind TEXT NOT NULL CHECK (kind IN ('naloga','poimenovanje','reakcija')),
        task_key TEXT,
        outcome TEXT NOT NULL CHECK (outcome IN ('correct','wrong','solution-viewed')),
        problem_json TEXT,
        CHECK (
          (kind='naloga' AND task_key IS NOT NULL AND problem_json IS NULL)
          OR
          (kind IN ('poimenovanje','reakcija') AND task_key IS NULL AND problem_json IS NOT NULL)
        ),
        CHECK (problem_json IS NULL OR json_valid(problem_json))
      );
      CREATE INDEX history_by_date ON history (completed_at_ms DESC,id DESC);
      CREATE INDEX history_by_npz_task ON history (task_key,completed_at_ms DESC,id DESC)
        WHERE kind='naloga';
      CREATE INDEX history_active_day ON history (local_day)
        WHERE outcome IN ('correct','wrong');
      PRAGMA user_version=1;
      COMMIT;
    `);
  }

  const load = (): StoredProgress => {
    const user = db
      .prepare('SELECT total_xp, weekly_goal FROM user_data WHERE id=1')
      .get() as {
      total_xp: number;
      weekly_goal: number;
    };
    const history = db
      .prepare(`SELECT id, completed_at_ms, local_day, kind, task_key, outcome,
      problem_json FROM history ORDER BY completed_at_ms DESC, id DESC`)
      .all() as Array<{
      id: string;
      completed_at_ms: number;
      local_day: string;
      kind: StoredKind;
      task_key: string | null;
      outcome: StoredOutcome;
      problem_json: string | null;
    }>;
    const drafts = db
      .prepare(`SELECT draft_key, kind, state_version, state_json,
      updated_at_ms FROM drafts`)
      .all() as Array<{
      draft_key: string;
      kind: StoredKind;
      state_version: number;
      state_json: string;
      updated_at_ms: number;
    }>;
    return {
      totalXp: user.total_xp,
      weeklyGoal: user.weekly_goal,
      history: history.map((row) => ({
        id: row.id,
        completedAtMs: row.completed_at_ms,
        localDay: row.local_day,
        kind: row.kind,
        taskKey: row.task_key,
        outcome: row.outcome,
        problemJson: row.problem_json,
      })),
      drafts: drafts.map((row) => ({
        draftKey: row.draft_key,
        kind: row.kind,
        stateVersion: row.state_version,
        stateJson: row.state_json,
        updatedAtMs: row.updated_at_ms,
      })),
    };
  };

  const saveHistory = (entry: StoredHistory): number => {
    assertHistory(entry);
    db.exec('BEGIN IMMEDIATE');
    try {
      const previous = db
        .prepare('SELECT kind, outcome FROM history WHERE id=?')
        .get(entry.id) as
        | { kind: StoredKind; outcome: StoredOutcome }
        | undefined;
      db.prepare(`INSERT INTO history (id, completed_at_ms, local_day, kind, task_key,
        outcome, problem_json) VALUES (?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET completed_at_ms=excluded.completed_at_ms,
        local_day=excluded.local_day, kind=excluded.kind, task_key=excluded.task_key,
        outcome=excluded.outcome, problem_json=excluded.problem_json`).run(
        entry.id,
        entry.completedAtMs,
        entry.localDay,
        entry.kind,
        entry.taskKey,
        entry.outcome,
        entry.problemJson,
      );
      const delta = xp(entry) - (previous ? xp(previous) : 0);
      db.prepare('UPDATE user_data SET total_xp=total_xp+? WHERE id=1').run(
        delta,
      );
      const total = (
        db.prepare('SELECT total_xp FROM user_data WHERE id=1').get() as {
          total_xp: number;
        }
      ).total_xp;
      db.exec('COMMIT');
      return total;
    } catch (error) {
      db.exec('ROLLBACK');
      throw error;
    }
  };

  const clearHistory = (): void => {
    db.exec('BEGIN IMMEDIATE');
    try {
      db.exec(
        'DELETE FROM history; UPDATE user_data SET total_xp=0 WHERE id=1;',
      );
      db.exec('COMMIT');
    } catch (error) {
      db.exec('ROLLBACK');
      throw error;
    }
  };

  const saveDraft = (draft: StoredDraft): void => {
    assertDraft(draft);
    db.prepare(`INSERT INTO drafts (draft_key, kind, state_version, state_json, updated_at_ms)
      VALUES (?, ?, ?, ?, ?) ON CONFLICT(draft_key) DO UPDATE SET kind=excluded.kind,
      state_version=excluded.state_version, state_json=excluded.state_json,
      updated_at_ms=excluded.updated_at_ms`).run(
      draft.draftKey,
      draft.kind,
      draft.stateVersion,
      draft.stateJson,
      draft.updatedAtMs,
    );
  };

  const deleteDraft = (key: string): void => {
    if (!key) throw new Error('Invalid draft key');
    db.prepare('DELETE FROM drafts WHERE draft_key=?').run(key);
  };

  return {
    load,
    saveHistory,
    clearHistory,
    saveDraft,
    deleteDraft,
    close: () => db.close(),
  };
}
