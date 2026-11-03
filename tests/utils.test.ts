import { describe, expect, it } from 'vitest';
import { capitalize } from '../src/renderer/utils/capitalize';
import {
  atoms,
  chapters,
  correctAnswers,
  correctInRow,
  exams,
  plural,
  tasks,
} from '../src/renderer/utils/plural';
import {
  isCorrectName,
  normalizeName,
} from '../src/renderer/nameCompound/answer';

describe('Slovenian plural', () => {
  it.each([
    [0, '0 nalog'],
    [1, '1 naloga'],
    [2, '2 nalogi'],
    [3, '3 naloge'],
    [4, '4 naloge'],
    [5, '5 nalog'],
    [11, '11 nalog'],
    [12, '12 nalog'],
    [21, '21 nalog'],
    [100, '100 nalog'],
    [101, '101 naloga'],
    [102, '102 nalogi'],
    [103, '103 naloge'],
    [111, '111 nalog'],
  ])('%d → %s', (count, expected) => {
    expect(tasks(count)).toBe(expected);
  });

  it('formats the "in a row" label', () => {
    expect(correctInRow(3)).toBe('3 pravilne zapored');
  });

  it('works with custom forms', () => {
    expect(plural(2, ['a', 'b', 'c', 'd'])).toBe('2 b');
  });
});

describe('capitalize', () => {
  it('uppercases the first letter', () => {
    expect(capitalize('kemija')).toBe('Kemija');
  });

  it('handles Slovenian letters', () => {
    expect(capitalize('čaj')).toBe('Čaj');
  });

  it('handles an empty string', () => {
    expect(capitalize('')).toBe('');
  });
});

describe('compound name comparison', () => {
  it('ignores case and surrounding spaces', () => {
    expect(isCorrectName('  Propan-1-ol ', 'propan-1-ol')).toBe(true);
  });

  it('ignores spaces around dashes', () => {
    expect(normalizeName('2 - metil - butan')).toBe('2-metil-butan');
  });

  it('treats typographic dashes as hyphens', () => {
    expect(isCorrectName('2–metilpropan', '2-metilpropan')).toBe(true);
  });

  it('collapses repeated spaces', () => {
    expect(normalizeName('butanojska   kislina')).toBe('butanojska kislina');
  });

  it('rejects different names', () => {
    expect(isCorrectName('butan', 'pentan')).toBe(false);
  });

  describe('plural helper functions', () => {
  it('formats chapters', () => {
    expect(chapters(1)).toBe('1 poglavje');
    expect(chapters(2)).toBe('2 poglavji');
    expect(chapters(3)).toBe('3 poglavja');
    expect(chapters(5)).toBe('5 poglavij');
  });

  it('formats exams', () => {
    expect(exams(1)).toBe('1 preizkus');
    expect(exams(2)).toBe('2 preizkusa');
    expect(exams(3)).toBe('3 preizkusi');
    expect(exams(5)).toBe('5 preizkusov');
  });

  it('formats atoms', () => {
    expect(atoms(1)).toBe('1 atom');
    expect(atoms(2)).toBe('2 atoma');
    expect(atoms(3)).toBe('3 atomi');
    expect(atoms(5)).toBe('5 atomov');
  });

  it('formats correct answers', () => {
    expect(correctAnswers(1)).toBe('1 pravilna');
    expect(correctAnswers(2)).toBe('2 pravilni');
    expect(correctAnswers(3)).toBe('3 pravilne');
    expect(correctAnswers(5)).toBe('5 pravilnih');
  });
});
});