import type { Result } from '../questions/grading';

/**
 * Outcome of one problem:
 * - correct: every question right
 * - wrong: at least one question wrong
 * - ungraded: essay answers the user hasn't self-graded yet
 * - skipped: moved on without checking
 */
export type ProblemOutcome = 'correct' | 'wrong' | 'ungraded' | 'skipped';

// TODO: XP is only shown for now; it's saved once progress is persisted (phase 5)
export const XP_CORRECT = 10;
export const XP_ATTEMPT = 2;

export function outcomeXp(outcome: ProblemOutcome): number {
  if (outcome === 'correct') return XP_CORRECT;
  if (outcome === 'skipped') return 0;
  return XP_ATTEMPT;
}

export function problemOutcome(
  results: Result[],
  selfGrades: (boolean | null)[],
): ProblemOutcome {
  const graded = results.map((result, i) =>
    result === 'self-check' ? selfGrades[i] : result === 'correct',
  );
  if (graded.some((value) => value === false)) return 'wrong';
  if (graded.some((value) => value === null)) return 'ungraded';
  return 'correct';
}
