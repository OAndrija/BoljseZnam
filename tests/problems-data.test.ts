import { existsSync, readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import type { Category, ProblemData } from '../src/shared/types';

const DATA = path.resolve(__dirname, '..', 'data');
const PROBLEMS = path.join(DATA, 'problems');
const RESOURCES = path.join(DATA, 'resources');

// <subject>-<year>-<number>.json with a two-digit number (e.g. KEM-2022-05.json);
// the main process pads the number when it opens a problem.
const FILENAME = /^([A-Za-z]+)-(\d+)-(\d{2})\.json$/;
const QUESTION_TYPES = ['multiple-choice', 'numeric', 'essay'];

const readJson = <T>(file: string): T =>
  JSON.parse(readFileSync(file, 'utf-8')) as T;

const categories = readJson<Category[]>(path.join(DATA, 'categories.json'));
const files = readdirSync(PROBLEMS).filter((name) => name.endsWith('.json'));

describe('data/categories.json', () => {
  it('has unique ids and non-empty names', () => {
    const ids = categories.map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(categories.every((c) => c.id && c.name)).toBe(true);
  });
});

describe('data/problems', () => {
  it('contains at least one problem', () => {
    expect(files.length).toBeGreaterThan(0);
  });

  it.each(files)('%s follows the naming pattern', (file) => {
    expect(file).toMatch(FILENAME);
  });

  describe.each(files)('%s', (file) => {
    const problem = readJson<ProblemData>(path.join(PROBLEMS, file));
    const [, subject, year, id] = FILENAME.exec(file) ?? [];

    it('matches its file name', () => {
      expect(problem.subject).toBe(subject);
      expect(problem.year).toBe(Number(year));
      expect(problem.id).toBe(Number(id));
    });

    it('only uses known chapters', () => {
      const known = new Set(categories.map((c) => c.id));
      for (const category of problem.categories) {
        expect(known.has(category), `unknown chapter "${category}"`).toBe(true);
      }
    });

    it('has at least one question', () => {
      expect(problem.questions.length).toBeGreaterThan(0);
    });

    it('only references resources that exist', () => {
      const referenced = [
        ...(problem.resources ?? []),
        ...problem.questions.flatMap((q) => q.resources ?? []),
      ];
      for (const resource of referenced) {
        expect(
          existsSync(path.join(RESOURCES, resource)),
          `missing resource "${resource}"`,
        ).toBe(true);
      }
    });

    it.each(problem.questions.map((q, i) => [i, q] as const))(
      'question %d is well formed',
      (_index, question) => {
        expect(QUESTION_TYPES).toContain(question.type);
        // The task text is either written in `prompt` or shown as an image
        // (NPZ tasks imported by npzparse are rendered to SVG).
        const hasPrompt = question.prompt.trim() !== '';
        const hasResource = (question.resources ?? []).length > 0;
        expect(
          hasPrompt || hasResource,
          'question needs a prompt or a resource',
        ).toBe(true);

        if (question.type === 'multiple-choice') {
          expect(question.choices.length).toBeGreaterThanOrEqual(2);
          expect(question.answer.length).toBeGreaterThan(0);
          for (const index of question.answer) {
            expect(Number.isInteger(index)).toBe(true);
            expect(index).toBeGreaterThanOrEqual(0);
            expect(index).toBeLessThan(question.choices.length);
          }
          expect(new Set(question.answer).size).toBe(question.answer.length);
        }

        if (question.type === 'numeric') {
          expect(typeof question.answer).toBe('number');
          expect(Number.isFinite(question.answer)).toBe(true);
          if (question.unit && question.units) {
            expect(question.units).toContain(question.unit);
          }
          if (question.tolerance !== undefined) {
            expect(question.tolerance).toBeGreaterThanOrEqual(0);
          }
        }

        if (question.type === 'essay') {
          expect(question.answer.trim()).not.toBe('');
        }
      },
    );
  });

  it('has no duplicate problems', () => {
    const keys = files.map((f) => f.replace(/\.json$/, '').toLowerCase());
    expect(new Set(keys).size).toBe(keys.length);
  });
});