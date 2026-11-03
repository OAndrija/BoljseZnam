import { describe, expect, it } from 'vitest';
import {
  emptyAnswer,
  formatDecimal,
  grade,
  isAnswered,
  letter,
  parseDecimal,
  unitOptions,
} from '../src/renderer/questions/grading';
import type {
  EssayQuestion,
  MultipleChoiceQuestion,
  NumericQuestion,
} from '../src/shared/types';

const mc = (answer: number[]): MultipleChoiceQuestion => ({
  type: 'multiple-choice',
  prompt: 'q',
  resources: [],
  choices: ['a', 'b', 'c', 'd'],
  answer,
});

const numeric = (overrides: Partial<NumericQuestion> = {}): NumericQuestion => ({
  type: 'numeric',
  prompt: 'q',
  resources: [],
  answer: 10,
  unit: 'g',
  ...overrides,
});

const essay: EssayQuestion = {
  type: 'essay',
  prompt: 'q',
  resources: [],
  answer: 'sample',
};

describe('letter', () => {
  it('labels choices a, b, c…', () => {
    expect(letter(0)).toBe('a');
    expect(letter(3)).toBe('d');
  });

  it('falls back to a number past the alphabet', () => {
    expect(letter(30)).toBe('31');
  });
});

describe('parseDecimal', () => {
  it.each([
    ['0,4', 0.4],
    ['0.4', 0.4],
    ['  12 ', 12],
    ['1 000,5', 1000.5],
    ['-3', -3],
    ['+3', 3],
    ['.5', 0.5],
    ['5.', 5],
  ])('parses %j as %d', (input, expected) => {
    expect(parseDecimal(input)).toBe(expected);
  });

  it.each(['', '   ', 'abc', '1.2.3', '1e3', '--1', '1,2,3', '0x10'])(
    'rejects %j',
    (input) => {
      expect(parseDecimal(input)).toBeNull();
    },
  );
});

describe('formatDecimal', () => {
  it('uses a decimal comma', () => {
    expect(formatDecimal(0.4)).toBe('0,4');
    expect(formatDecimal(12)).toBe('12');
  });
});

describe('grade – multiple choice', () => {
  it('accepts the exact set of correct answers', () => {
    expect(grade(mc([1]), { type: 'multiple-choice', selected: [1] })).toBe(
      'correct',
    );
  });

  it('ignores the order of selected answers', () => {
    expect(
      grade(mc([0, 2]), { type: 'multiple-choice', selected: [2, 0] }),
    ).toBe('correct');
  });

  it('rejects a partial selection', () => {
    expect(
      grade(mc([0, 2]), { type: 'multiple-choice', selected: [0] }),
    ).toBe('wrong');
  });

  it('rejects an extra selection', () => {
    expect(
      grade(mc([1]), { type: 'multiple-choice', selected: [1, 2] }),
    ).toBe('wrong');
  });

  it('rejects an empty selection', () => {
    expect(grade(mc([1]), { type: 'multiple-choice', selected: [] })).toBe(
      'wrong',
    );
  });

  it('does not mutate the question or the answer', () => {
    const question = mc([2, 0]);
    const answer = { type: 'multiple-choice' as const, selected: [2, 0] };
    grade(question, answer);
    expect(question.answer).toEqual([2, 0]);
    expect(answer.selected).toEqual([2, 0]);
  });
});

describe('grade – numeric', () => {
  const answer = (value: string, unit = 'g') =>
    ({ type: 'numeric', value, unit }) as const;

  it('accepts the correct value and unit', () => {
    expect(grade(numeric(), answer('10'))).toBe('correct');
  });

  it('accepts a decimal comma', () => {
    expect(grade(numeric({ answer: 0.4 }), answer('0,4'))).toBe('correct');
  });

  it('rejects a wrong value', () => {
    expect(grade(numeric(), answer('11'))).toBe('wrong');
  });

  it('rejects the wrong unit', () => {
    expect(grade(numeric(), answer('10', 'kg'))).toBe('wrong');
  });

  it('does not require a unit when the question has none', () => {
    expect(grade(numeric({ unit: undefined }), answer('10', ''))).toBe(
      'correct',
    );
  });

  it('respects the tolerance, including its boundary', () => {
    const question = numeric({ tolerance: 0.5 });
    expect(grade(question, answer('10,5'))).toBe('correct');
    expect(grade(question, answer('9.5'))).toBe('correct');
    expect(grade(question, answer('10,6'))).toBe('wrong');
  });

  it('absorbs floating point noise with the default tolerance', () => {
    expect(grade(numeric({ answer: 0.3 }), answer('0.30000000000000004'))).toBe(
      'correct',
    );
  });

  it('rejects input that is not a number', () => {
    expect(grade(numeric(), answer('abc'))).toBe('wrong');
    expect(grade(numeric(), answer(''))).toBe('wrong');
  });
});

describe('grade – essay and mismatches', () => {
  it('leaves essays for self-checking', () => {
    expect(grade(essay, { type: 'essay', text: 'anything' })).toBe(
      'self-check',
    );
  });

  it('does not auto-grade when the answer type does not match', () => {
    expect(grade(mc([1]), { type: 'essay', text: 'x' })).toBe('self-check');
  });
});

describe('answers', () => {
  it('creates an empty answer per question type', () => {
    expect(emptyAnswer(mc([0]))).toEqual({
      type: 'multiple-choice',
      selected: [],
    });
    expect(emptyAnswer(essay)).toEqual({ type: 'essay', text: '' });
  });

  it('preselects the first unit', () => {
    expect(emptyAnswer(numeric({ units: ['mg', 'g'] }))).toEqual({
      type: 'numeric',
      value: '',
      unit: 'mg',
    });
  });

  it('lists unit options, defaulting to the single unit', () => {
    expect(unitOptions(numeric())).toEqual(['g']);
    expect(unitOptions(numeric({ units: ['g', 'kg'] }))).toEqual(['g', 'kg']);
    expect(unitOptions(numeric({ unit: undefined }))).toEqual([]);
    expect(unitOptions(essay)).toEqual([]);
  });

  it('knows when an answer is filled in', () => {
    expect(isAnswered({ type: 'multiple-choice', selected: [] })).toBe(false);
    expect(isAnswered({ type: 'multiple-choice', selected: [0] })).toBe(true);
    expect(isAnswered({ type: 'numeric', value: '', unit: 'g' })).toBe(false);
    expect(isAnswered({ type: 'numeric', value: 'x', unit: 'g' })).toBe(false);
    expect(isAnswered({ type: 'numeric', value: '3,5', unit: 'g' })).toBe(true);
    expect(isAnswered({ type: 'essay', text: '   ' })).toBe(false);
    expect(isAnswered({ type: 'essay', text: 'hi' })).toBe(true);
  });
});