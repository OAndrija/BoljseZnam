import { describe, expect, it } from 'vitest';
import {
  hasQuestionType,
  practiceSetFrom,
} from '../src/renderer/pages/practiceSet';
import type { Catalog } from '../src/renderer/hooks/useCatalog';
import { problemKey, problemPath } from '../src/renderer/hooks/useCatalog';
import type { ProblemSummary } from '../src/shared/types';

const problem = (
  year: number,
  id: number,
  categories: string[],
  questionTypes: ProblemSummary['questionTypes'],
): ProblemSummary => ({ subject: 'KEM', year, id, categories, questionTypes });

const catalog: Catalog = {
  categories: [
    { id: 'kisline', name: 'Kisline' },
    { id: 'reakcije', name: 'Reakcije' },
  ],
  problems: [
    problem(2022, 1, ['kisline'], ['multiple-choice']),
    problem(2022, 2, ['reakcije'], ['numeric', 'essay']),
    problem(2023, 1, ['kisline', 'reakcije'], ['essay']),
  ],
};

const params = (query: string) => new URLSearchParams(query);

describe('practiceSetFrom', () => {
  it('returns every problem without filters', () => {
    const set = practiceSetFrom(params(''), catalog);
    expect(set.problems).toHaveLength(3);
    expect(set.title).toBe('Vse naloge');
    expect(set.chapterName).toBeNull();
    expect(set.exitPath).toBe('/');
  });

  it('filters by chapter', () => {
    const set = practiceSetFrom(params('poglavje=kisline'), catalog);
    expect(set.problems.map((p) => p.year)).toEqual([2022, 2023]);
    expect(set.title).toBe('Kisline');
    expect(set.chapterName).toBe('Kisline');
    expect(set.exitPath).toBe('/poglavja');
  });

  it('uses the chapter id as title when the chapter is unknown', () => {
    const set = practiceSetFrom(params('poglavje=neznano'), catalog);
    expect(set.title).toBe('neznano');
    expect(set.problems).toEqual([]);
  });

  it('filters by exam year', () => {
    const set = practiceSetFrom(params('npz=2022'), catalog);
    expect(set.problems.map((p) => p.id)).toEqual([1, 2]);
    expect(set.title).toBe('NPZ 2022');
    expect(set.exitPath).toBe('/npz');
  });

  it('filters by question type', () => {
    const set = practiceSetFrom(params('vrsta=essay'), catalog);
    expect(set.problems).toHaveLength(2);
  });

  it('combines chapter and question type', () => {
    const set = practiceSetFrom(
      params('poglavje=reakcije&vrsta=numeric'),
      catalog,
    );
    expect(set.problems).toHaveLength(1);
    expect(set.problems[0].id).toBe(2);
  });
});

describe('hasQuestionType', () => {
  it('accepts everything when no type is given', () => {
    expect(hasQuestionType(catalog.problems[0], null)).toBe(true);
  });

  it('checks the problem question types', () => {
    expect(hasQuestionType(catalog.problems[0], 'essay')).toBe(false);
    expect(hasQuestionType(catalog.problems[1], 'essay')).toBe(true);
  });
});

describe('problem keys and paths', () => {
  it('builds a stable key and a route', () => {
    const p = { subject: 'KEM', year: 2022, id: 5 };
    expect(problemKey(p)).toBe('KEM-2022-5');
    expect(problemPath(p)).toBe('/naloga/KEM/2022/5');
  });
});