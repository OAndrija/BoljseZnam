import { describe, expect, it } from 'vitest';
import {
  countAtoms,
  equations,
  formatEquation,
  isReducible,
  type Species,
} from '../src/renderer/data/equations';

const SUBSCRIPTS = '₀₁₂₃₄₅₆₇₈₉';

/** "Fe₂O₃" → { Fe: 2, O: 3 } */
function parseFormula(formula: string): Record<string, number> {
  const atoms: Record<string, number> = {};
  for (const [, element, digits] of formula.matchAll(
    /([A-Z][a-z]?)([₀-₉]*)/g,
  )) {
    const count = digits
      ? Number([...digits].map((d) => SUBSCRIPTS.indexOf(d)).join(''))
      : 1;
    atoms[element] = (atoms[element] ?? 0) + count;
  }
  return atoms;
}

describe.each(equations.map((equation) => [formatEquation(equation), equation]))(
  'equation %s',
  (_label, equation) => {
    it('has one coefficient per species', () => {
      expect(equation.solution).toHaveLength(
        equation.reactants.length + equation.products.length,
      );
    });

    it('is balanced by its stored solution', () => {
      for (const { element, left, right } of countAtoms(
        equation,
        equation.solution,
      )) {
        expect(left, `atoms of ${element}`).toBe(right);
      }
    });

    it('uses the smallest whole-number coefficients', () => {
      expect(equation.solution.every((c) => Number.isInteger(c) && c > 0)).toBe(
        true,
      );
      expect(isReducible(equation.solution)).toBe(false);
    });

    it('has atom counts that match each formula', () => {
      const species: Species[] = [...equation.reactants, ...equation.products];
      for (const item of species) {
        expect(item.atoms, item.formula).toEqual(parseFormula(item.formula));
      }
    });
  },
);

describe('equations list', () => {
  it('contains every difficulty', () => {
    const difficulties = new Set(equations.map((e) => e.difficulty));
    expect(difficulties).toEqual(new Set(['lahka', 'srednja', 'težka']));
  });
});

describe('countAtoms', () => {
  const water = equations[0];

  it('detects an unbalanced guess', () => {
    const unbalanced = countAtoms(water, [1, 1, 1]);
    expect(unbalanced.some(({ left, right }) => left !== right)).toBe(true);
  });

  it('keeps elements in order of first appearance', () => {
    expect(countAtoms(water, water.solution).map((a) => a.element)).toEqual([
      'H',
      'O',
    ]);
  });
});

describe('isReducible', () => {
  it('flags coefficients with a common factor', () => {
    expect(isReducible([4, 2, 4])).toBe(true);
    expect(isReducible([2, 1, 2])).toBe(false);
  });
});

describe('formatEquation', () => {
  it('omits coefficient 1', () => {
    expect(formatEquation(equations[0])).toBe('2 H₂ + O₂ → 2 H₂O');
  });

  it('formats a custom guess', () => {
    expect(formatEquation(equations[0], [1, 1, 1])).toBe('H₂ + O₂ → H₂O');
  });
});