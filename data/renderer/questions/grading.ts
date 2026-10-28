import type { QuestionData, QuestionType } from '../../shared/types';

// NPZ papers label choices A, B, C, D (without Č)
const alphabet = 'abcdefghijklmnopqrstuvwxyz';

/** Letter for the n-th choice or sub-question (a, b, c, d, …). */
export function letter(index: number): string {
  return alphabet[index] ?? String(index + 1);
}

export const questionTypeLabels: Record<QuestionType, string> = {
  'multiple-choice': 'Obkroževanje',
  numeric: 'Računanje',
  essay: 'Opisni odgovor',
};

export type Answer =
  | { type: 'multiple-choice'; selected: number[] }
  | { type: 'numeric'; value: string; unit: string }
  | { type: 'essay'; text: string };

/**
 * correct / wrong are graded automatically; essays can't be, so the user
 * compares with the sample answer and grades themselves ("self-check").
 */
export type Result = 'correct' | 'wrong' | 'self-check';

export function unitOptions(question: QuestionData): string[] {
  if (question.type !== 'numeric') return [];
  return question.units ?? (question.unit ? [question.unit] : []);
}

export function emptyAnswer(question: QuestionData): Answer {
  switch (question.type) {
    case 'multiple-choice':
      return { type: 'multiple-choice', selected: [] };
    case 'numeric':
      return {
        type: 'numeric',
        value: '',
        unit: unitOptions(question)[0] ?? '',
      };
    case 'essay':
      return { type: 'essay', text: '' };
  }
}

export function isAnswered(answer: Answer): boolean {
  switch (answer.type) {
    case 'multiple-choice':
      return answer.selected.length > 0;
    case 'numeric':
      return parseDecimal(answer.value) !== null;
    case 'essay':
      return answer.text.trim() !== '';
  }
}

/** Parses "0,4" or "0.4"; returns null for anything that isn't a number. */
export function parseDecimal(value: string): number | null {
  const normalized = value.trim().replace(/\s/g, '').replace(',', '.');
  if (!/^[-+]?(\d+\.?\d*|\.\d+)$/.test(normalized)) return null;
  return Number(normalized);
}

/** Formats a number the Slovenian way, with a decimal comma. */
export function formatDecimal(value: number): string {
  return String(value).replace('.', ',');
}

export function grade(question: QuestionData, answer: Answer): Result {
  if (
    question.type === 'multiple-choice' &&
    answer.type === 'multiple-choice'
  ) {
    const correct = [...question.answer].sort();
    const selected = [...answer.selected].sort();
    return correct.length === selected.length &&
      correct.every((value, index) => value === selected[index])
      ? 'correct'
      : 'wrong';
  }

  if (question.type === 'numeric' && answer.type === 'numeric') {
    const value = parseDecimal(answer.value);
    const tolerance = question.tolerance ?? 1e-9;
    const unitMatches = !question.unit || answer.unit === question.unit;
    return value !== null &&
      unitMatches &&
      Math.abs(value - question.answer) <= tolerance
      ? 'correct'
      : 'wrong';
  }

  return 'self-check';
}
