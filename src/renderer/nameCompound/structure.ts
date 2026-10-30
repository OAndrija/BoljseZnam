import type { Compound } from '../data/elements';
import {
  type BondType,
  HYDROGEN,
  type Neighbor,
  atomicNumber,
  mainChain,
  neighborList,
  symbol,
} from './graph';

type Direction = [row: number, column: number];

const UP: Direction = [-1, 0];
const DOWN: Direction = [1, 0];
const LEFT: Direction = [0, -1];
const RIGHT: Direction = [0, 1];

const HORIZONTAL: Record<BondType, string> = {
  single: '–',
  double: '=',
  triple: '≡',
};
const VERTICAL: Record<BondType, string> = {
  single: '|',
  double: '‖',
  triple: '⦀',
};

function perpendicular([row]: Direction): Direction[] {
  return row === 0 ? [UP, DOWN] : [LEFT, RIGHT];
}

/**
 * Draws the compound on a character grid (see CompoundTask.structure).
 *
 * The longest carbon chain goes horizontally through the middle row. Every
 * other atom is attached above, below or – at the chain ends – beside its
 * atom and continues in the same direction, e.g. –O–H. Atoms are two cells
 * apart with the bond in between.
 *
 * Kept simple on purpose: rings, crowded branches and two-letter symbols
 * (Cl, Br) are not drawn correctly.
 */
export function toStructure(compound: Compound): string[] {
  const neighbors = neighborList(compound);
  const chain = mainChain(compound, neighbors);
  const grid = new Map<string, string>();
  const placed = new Set<number>();

  const key = (row: number, column: number) => `${row},${column}`;
  const isHeavy = (atom: number) => atomicNumber(compound, atom) !== HYDROGEN;

  /** Number of atoms hanging on `atom`, not counting the side towards `from`. */
  const branchSize = (atom: number, from: number): number =>
    1 +
    neighbors[atom]
      .filter((n) => n.atom !== from && !placed.has(n.atom))
      .reduce((sum, n) => sum + branchSize(n.atom, atom), 0);

  /** Heavy atoms first, bigger branches first – they get the best spots. */
  const byPriority = (from: number) => (a: Neighbor, b: Neighbor) =>
    Number(isHeavy(b.atom)) - Number(isHeavy(a.atom)) ||
    branchSize(b.atom, from) - branchSize(a.atom, from);

  const attach = (
    from: number,
    [row, column]: [number, number],
    { atom, type }: Neighbor,
    directions: Direction[],
  ) => {
    for (const direction of directions) {
      const [dRow, dColumn] = direction;
      const bond = key(row + dRow, column + dColumn);
      const position: [number, number] = [row + 2 * dRow, column + 2 * dColumn];
      if (grid.has(bond) || grid.has(key(...position))) continue;

      grid.set(bond, (dRow === 0 ? HORIZONTAL : VERTICAL)[type]);
      grid.set(key(...position), symbol(compound, atom));
      placed.add(atom);

      const next = [direction, ...perpendicular(direction)];
      neighbors[atom]
        .filter((n) => n.atom !== from && !placed.has(n.atom))
        .sort(byPriority(atom))
        .forEach((n) => attach(atom, position, n, next));
      return;
    }
    console.warn(
      `toStructure: no room for ${symbol(compound, atom)} (atom ${atom})`,
    );
  };

  chain.forEach((atom, i) => {
    grid.set(key(0, 2 * i), symbol(compound, atom));
    placed.add(atom);
    if (i > 0) {
      const { type } = neighbors[atom].find((n) => n.atom === chain[i - 1])!;
      grid.set(key(0, 2 * i - 1), HORIZONTAL[type]);
    }
  });

  const directionsAt = (i: number): Direction[] => [
    ...(i === chain.length - 1 ? [RIGHT] : []),
    ...(i === 0 ? [LEFT] : []),
    UP,
    DOWN,
  ];

  // heavy atoms on the whole chain first, so hydrogens never take their place
  for (const heavy of [true, false]) {
    chain.forEach((atom, i) => {
      neighbors[atom]
        .filter((n) => !placed.has(n.atom) && isHeavy(n.atom) === heavy)
        .sort(byPriority(atom))
        .forEach((n) => attach(atom, [0, 2 * i], n, directionsAt(i)));
    });
  }

  const cells = [...grid.keys()].map((k) => k.split(',').map(Number));
  if (cells.length === 0) return [];
  const rows = cells.map(([row]) => row);
  const columns = cells.map(([, column]) => column);
  const [top, bottom] = [Math.min(...rows), Math.max(...rows)];
  const [left, right] = [Math.min(...columns), Math.max(...columns)];

  const lines: string[] = [];
  for (let row = top; row <= bottom; row++) {
    let line = '';
    for (let column = left; column <= right; column++) {
      line += grid.get(key(row, column)) ?? ' ';
    }
    lines.push(line);
  }
  return lines;
}
