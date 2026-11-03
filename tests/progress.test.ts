import { describe, expect, it } from 'vitest';
import { levelFor, levels } from '../src/renderer/progress/levels';
import {
  outcomeXp,
  problemOutcome,
  XP_ATTEMPT,
  XP_CORRECT,
} from '../src/renderer/progress/results';
import { achievements } from '../src/renderer/progress/achievements';
import type { HistoryEntry } from '../src/renderer/progress/ResultsContext';
import type { Progress } from '../src/renderer/progress/useProgress';

describe('levels', () => {
  it('starts at level 1', () => {
    const { current, next } = levelFor(0);
    expect(current.number).toBe(1);
    expect(next?.number).toBe(2);
  });

  it('switches level exactly at the XP threshold', () => {
    expect(levelFor(49).current.number).toBe(1);
    expect(levelFor(50).current.number).toBe(2);
  });

  it('has no next level at the top', () => {
    const last = levels[levels.length - 1];
    expect(levelFor(last.minXp).next).toBeNull();
    expect(levelFor(1_000_000).current.number).toBe(last.number);
  });

  it('has strictly increasing thresholds', () => {
    for (let i = 1; i < levels.length; i++) {
      expect(levels[i].minXp).toBeGreaterThan(levels[i - 1].minXp);
      expect(levels[i].number).toBe(levels[i - 1].number + 1);
    }
  });
});

describe('XP', () => {
  it('rewards correct answers the most and skipping nothing', () => {
    expect(outcomeXp('correct')).toBe(XP_CORRECT);
    expect(outcomeXp('wrong')).toBe(XP_ATTEMPT);
    expect(outcomeXp('ungraded')).toBe(XP_ATTEMPT);
    expect(outcomeXp('skipped')).toBe(0);
    expect(XP_CORRECT).toBeGreaterThan(XP_ATTEMPT);
  });
});

describe('problemOutcome', () => {
  it('is correct when every question is right', () => {
    expect(problemOutcome(['correct', 'correct'], [null, null])).toBe(
      'correct',
    );
  });

  it('is wrong when any question is wrong', () => {
    expect(problemOutcome(['correct', 'wrong'], [null, null])).toBe('wrong');
  });

  it('is ungraded while an essay awaits self-grading', () => {
    expect(problemOutcome(['correct', 'self-check'], [null, null])).toBe(
      'ungraded',
    );
  });

  it('uses the self-grade for essays', () => {
    expect(problemOutcome(['self-check'], [true])).toBe('correct');
    expect(problemOutcome(['self-check'], [false])).toBe('wrong');
  });

  it('prefers wrong over ungraded', () => {
    expect(problemOutcome(['wrong', 'self-check'], [null, null])).toBe(
      'wrong',
    );
  });
});

describe('achievements', () => {
  const progress: Progress = {
    streakDays: 3,
    xp: 0,
    level: levels[0],
    nextLevel: levels[1],
    levelLabel: '',
    levelProgress: 0,
    xpToNextLevel: 0,
    weeklyGoal: 20,
    weeklyDone: 0,
    activeDays: [],
  };

  let counter = 0;
  const entry = (overrides: Partial<HistoryEntry> = {}): HistoryEntry => ({
    id: String(counter++),
    date: new Date(),
    kind: 'naloga',
    title: 't',
    chapter: null,
    typeLabel: 'x',
    result: 'correct',
    ...overrides,
  });

  const find = (history: HistoryEntry[], id: string) =>
    achievements(history, progress).find((a) => a.id === id)!;

  it('has unique ids and positive targets', () => {
    const list = achievements([], progress);
    expect(new Set(list.map((a) => a.id)).size).toBe(list.length);
    expect(list.every((a) => a.target > 0)).toBe(true);
  });

  it('starts with no progress', () => {
    const list = achievements([], progress);
    expect(find([], 'prvi-korak').progress).toBe(0);
    expect(list.filter((a) => a.id !== 'vztrajnez' && a.id !== 'kemik').every(
      (a) => a.progress === 0,
    )).toBe(true);
  });

  it('counts solved problems but not whole exams', () => {
    const history = [entry(), entry({ kind: 'npz', result: 'exam' })];
    expect(find(history, 'prvi-korak').progress).toBe(1);
    expect(find(history, 'maratonec').progress).toBe(1);
  });

  it('counts correct compounds and reactions separately', () => {
    const history = [
      entry({ kind: 'spojina' }),
      entry({ kind: 'spojina', result: 'wrong' }),
      entry({ kind: 'reakcija' }),
    ];
    expect(find(history, 'poimenovalec').progress).toBe(1);
    expect(find(history, 'ravnovesje').progress).toBe(1);
  });

  it('counts correct problems in the acids chapter', () => {
    const history = [
      entry({ chapter: 'Kisline, baze in soli' }),
      entry({ chapter: 'Kemijske reakcije' }),
    ];
    expect(find(history, 'mojster-kislin').progress).toBe(1);
  });

  it('finds the longest run of correct answers (history is newest first)', () => {
    const history = [
      entry({ result: 'correct' }),
      entry({ result: 'correct' }),
      entry({ result: 'wrong' }),
      entry({ result: 'correct' }),
      entry({ result: 'correct' }),
      entry({ result: 'correct' }),
    ];
    expect(find(history, 'brez-napake').progress).toBe(3);
  });

  it('does not break a run with a whole-exam entry', () => {
    const history = [
      entry(),
      entry({ kind: 'npz', result: 'exam' }),
      entry(),
    ];
    expect(find(history, 'brez-napake').progress).toBe(2);
  });

  it('takes streak and level from progress', () => {
    expect(find([], 'vztrajnez').progress).toBe(3);
    expect(find([], 'kemik').progress).toBe(1);
  });
});