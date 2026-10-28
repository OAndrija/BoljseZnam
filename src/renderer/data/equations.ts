export interface Species {
  formula: string;
  /** Atoms in one formula unit, e.g. { H: 2, O: 1 } for H₂O. */
  atoms: Record<string, number>;
}

export interface Equation {
  reactants: Species[];
  products: Species[];
  /** Smallest whole-number coefficients, reactants then products. */
  solution: number[];
  difficulty: 'lahka' | 'srednja' | 'težka';
}

const s = (formula: string, atoms: Record<string, number>): Species => ({
  formula,
  atoms,
});

export const equations: Equation[] = [
  {
    reactants: [s('H₂', { H: 2 }), s('O₂', { O: 2 })],
    products: [s('H₂O', { H: 2, O: 1 })],
    solution: [2, 1, 2],
    difficulty: 'lahka',
  },
  {
    reactants: [s('N₂', { N: 2 }), s('H₂', { H: 2 })],
    products: [s('NH₃', { N: 1, H: 3 })],
    solution: [1, 3, 2],
    difficulty: 'lahka',
  },
  {
    reactants: [s('Na', { Na: 1 }), s('Cl₂', { Cl: 2 })],
    products: [s('NaCl', { Na: 1, Cl: 1 })],
    solution: [2, 1, 2],
    difficulty: 'lahka',
  },
  {
    reactants: [s('Mg', { Mg: 1 }), s('O₂', { O: 2 })],
    products: [s('MgO', { Mg: 1, O: 1 })],
    solution: [2, 1, 2],
    difficulty: 'lahka',
  },
  {
    reactants: [s('Zn', { Zn: 1 }), s('HCl', { H: 1, Cl: 1 })],
    products: [s('ZnCl₂', { Zn: 1, Cl: 2 }), s('H₂', { H: 2 })],
    solution: [1, 2, 1, 1],
    difficulty: 'lahka',
  },
  {
    reactants: [s('CH₄', { C: 1, H: 4 }), s('O₂', { O: 2 })],
    products: [s('CO₂', { C: 1, O: 2 }), s('H₂O', { H: 2, O: 1 })],
    solution: [1, 2, 1, 2],
    difficulty: 'srednja',
  },
  {
    reactants: [s('Fe', { Fe: 1 }), s('O₂', { O: 2 })],
    products: [s('Fe₂O₃', { Fe: 2, O: 3 })],
    solution: [4, 3, 2],
    difficulty: 'srednja',
  },
  {
    reactants: [s('Al', { Al: 1 }), s('HCl', { H: 1, Cl: 1 })],
    products: [s('AlCl₃', { Al: 1, Cl: 3 }), s('H₂', { H: 2 })],
    solution: [2, 6, 2, 3],
    difficulty: 'srednja',
  },
  {
    reactants: [s('C₃H₈', { C: 3, H: 8 }), s('O₂', { O: 2 })],
    products: [s('CO₂', { C: 1, O: 2 }), s('H₂O', { H: 2, O: 1 })],
    solution: [1, 5, 3, 4],
    difficulty: 'težka',
  },
];

export interface AtomCount {
  element: string;
  left: number;
  right: number;
}

/** Atom counts per element on both sides, in order of first appearance. */
export function countAtoms(
  equation: Equation,
  coefficients: number[],
): AtomCount[] {
  const counts = new Map<string, AtomCount>();
  const add = (
    species: Species,
    coefficient: number,
    side: 'left' | 'right',
  ) => {
    for (const [element, count] of Object.entries(species.atoms)) {
      const entry = counts.get(element) ?? { element, left: 0, right: 0 };
      entry[side] += count * coefficient;
      counts.set(element, entry);
    }
  };
  equation.reactants.forEach((species, i) =>
    add(species, coefficients[i], 'left'),
  );
  equation.products.forEach((species, i) =>
    add(species, coefficients[equation.reactants.length + i], 'right'),
  );
  return [...counts.values()];
}

function gcd(a: number, b: number): number {
  return b === 0 ? a : gcd(b, a % b);
}

/** Balanced but not reduced, e.g. 4 H₂ + 2 O₂ → 4 H₂O. */
export function isReducible(coefficients: number[]): boolean {
  return coefficients.reduce(gcd) > 1;
}

/** "2 H₂ + O₂ → 2 H₂O" */
export function formatEquation(
  equation: Equation,
  coefficients: number[] = equation.solution,
): string {
  const side = (species: Species[], offset: number) =>
    species
      .map((item, i) => {
        const coefficient = coefficients[offset + i];
        return coefficient === 1
          ? item.formula
          : `${coefficient} ${item.formula}`;
      })
      .join(' + ');
  return `${side(equation.reactants, 0)} → ${side(equation.products, equation.reactants.length)}`;
}
