import { describe, expect, it } from 'vitest';
import { capitalize } from '../src/renderer/utils/capitalize';
import { correctInRow, plural, tasks } from '../src/renderer/utils/plural';
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
});