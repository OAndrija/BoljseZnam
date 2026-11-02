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

// a chain bond gets at most this many cells, i.e. "C–––––C"
const MAX_GAP = 6;

/**
 * Draws the compound on a character grid (see CompoundTask.structure).
 *
 * The longest carbon chain goes horizontally through the middle row. Every
 * other atom is attached above, below or – at the chain ends – beside its
 * atom and continues in the same direction, e.g. –O–H. Atoms are two cells
 * apart with the bond in between, and two atoms never touch.
 *
 * A branch tries every free direction and keeps the one where all of its
 * atoms fit, first next to its atom, then further out with a longer bond.
 * A branch going up or down still puts its hydrogens beside it, where the
 * neighbouring chain atoms want theirs; then the chain bonds that make room
 * get as little longer as needed (usually "C–––C") and a long bond is drawn
 * as the same character in several cells. Where a branch splits again
 * (e.g. 1-metiletil), its parts go to both sides and the bond to the split
 * atom is longer, so the hydrogens of those parts fit between it and the atom
 * before it.
 *
 * Kept simple on purpose: rings and two-letter symbols (Cl, Br) are not drawn
 * correctly.
 */
export function toStructure(compound: Compound): string[] {
  const neighbors = neighborList(compound);
  const chain = mainChain(compound, neighbors);
  // cells from one chain atom to the next
  let gaps = chain.slice(1).map(() => 2);
  let drawing = layout(compound, neighbors, chain, gaps);

  const draw = (tried: number[]) => layout(compound, neighbors, chain, tried);
  const longer = (changes: [index: number, step: number][]) =>
    gaps.map((gap, i) =>
      changes.reduce((sum, [j, step]) => (j === i ? sum + step : sum), gap),
    );

  while (drawing.missing > 0) {
    // shortest changes first: one bond a cell longer, two cells longer, then
    // two bonds at once or one by more – sometimes a small step doesn't help
    const indices = gaps.map((_, i) => i);
    const candidates = [
      ...indices.map((i) => longer([[i, 1]])),
      ...indices.map((i) => longer([[i, 2]])),
      ...indices.flatMap((i) =>
        indices.slice(i + 1).map((j) =>
          longer([
            [i, 2],
            [j, 2],
          ]),
        ),
      ),
      ...indices.map((i) => longer([[i, 4]])),
    ].filter((tried) => tried.every((gap) => gap <= MAX_GAP));

    let best: { gaps: number[]; drawing: typeof drawing } | null = null;
    for (const tried of candidates) {
      const result = draw(tried);
      if (result.missing < (best?.drawing.missing ?? drawing.missing)) {
        best = { gaps: tried, drawing: result };
      }
    }
    if (!best) break;
    ({ gaps, drawing } = best);
  }

  // undo the lengthening that later changes made unnecessary
  if (drawing.missing === 0) {
    gaps.forEach((_, i) => {
      while (gaps[i] > 2) {
        const tried = longer([[i, -1]]);
        const result = draw(tried);
        if (result.missing > 0) break;
        gaps = tried;
        drawing = result;
      }
    });
  }
  if (drawing.missing > 0) {
    console.warn(`toStructure: no room for ${drawing.missing} atoms`);
  }
  return toLines(drawing.cells);
}

const key = (row: number, column: number) => `${row},${column}`;

/**
 * One attempt at the drawing with the given chain bond lengths. `missing` is
 * the number of atoms that found no room.
 */
function layout(
  compound: Compound,
  neighbors: Neighbor[][],
  chain: number[],
  gaps: number[],
) {
  let grid = new Map<string, string>();
  let placed = new Set<number>();

  const isHeavy = (atom: number) => atomicNumber(compound, atom) !== HYDROGEN;

  /** Number of atoms hanging on `atom`, not counting the side towards `from`. */
  const branchSize = (atom: number, from: number): number =>
    1 +
    neighbors[atom]
      .filter((n) => n.atom !== from && !placed.has(n.atom))
      .reduce((sum, n) => sum + branchSize(n.atom, atom), 0);

  const heavyChildren = (atom: number, from: number) =>
    neighbors[atom].filter((n) => n.atom !== from && isHeavy(n.atom));

  /** Heavy atoms first, bigger branches first – they get the best spots. */
  const byPriority = (from: number) => (a: Neighbor, b: Neighbor) =>
    Number(isHeavy(b.atom)) - Number(isHeavy(a.atom)) ||
    branchSize(b.atom, from) - branchSize(a.atom, from);

  /** Draws `atom` and its branch; returns the number of atoms left out. */
  const attach = (
    from: number,
    [row, column]: [number, number],
    { atom, type }: Neighbor,
    directions: Direction[],
    // directions drawn with a bond twice as long
    long: Direction[] = [],
  ): number => {
    const parts = heavyChildren(atom, from).length;
    let best: {
      grid: typeof grid;
      placed: typeof placed;
      missing: number;
    } | null = null;

    // a split atom keeps its parts' hydrogens clear of the atom before it
    const short: [Direction, number][] = directions.map((direction) => [
      direction,
      parts >= 2 || long.includes(direction) ? 4 : 2,
    ]);
    // a heavy atom can also move further out, above the neighbours' branches
    const further: [Direction, number][] = isHeavy(atom)
      ? short.filter(([, length]) => length === 2).map(([d]) => [d, 4])
      : [];

    for (const [direction, length] of [...short, ...further]) {
      const [dRow, dColumn] = direction;
      const bonds = Array.from({ length: length - 1 }, (_, step) =>
        key(row + (step + 1) * dRow, column + (step + 1) * dColumn),
      );
      const position: [number, number] = [
        row + length * dRow,
        column + length * dColumn,
      ];
      const [r, c] = position;
      // the cell towards `from` holds the new bond, the others must stay empty
      const around = [UP, DOWN, LEFT, RIGHT]
        .filter(([aRow, aColumn]) => aRow !== -dRow || aColumn !== -dColumn)
        .map(([aRow, aColumn]) => key(r + aRow, c + aColumn));
      if ([...bonds, key(r, c), ...around].some((cell) => grid.has(cell))) {
        continue;
      }

      const saved = { grid: new Map(grid), placed: new Set(placed) };
      const bondSymbol = (dRow === 0 ? HORIZONTAL : VERTICAL)[type];
      bonds.forEach((bond) => grid.set(bond, bondSymbol));
      grid.set(key(r, c), symbol(compound, atom));
      placed.add(atom);

      // a split puts its heavy parts to both sides, a plain branch goes on;
      // a third part goes on further, past the hydrogens of the other two
      const next =
        parts >= 2
          ? [...perpendicular(direction), direction]
          : [direction, ...perpendicular(direction)];
      const missing = neighbors[atom]
        .filter((n) => n.atom !== from && !placed.has(n.atom))
        .sort(byPriority(atom))
        .reduce(
          (sum, n) =>
            sum +
            attach(atom, position, n, next, parts >= 3 ? [direction] : []),
          0,
        );
      if (missing === 0) return 0;

      if (!best || missing < best.missing) best = { grid, placed, missing };
      ({ grid, placed } = saved);
    }

    if (!best) return branchSize(atom, from);
    ({ grid, placed } = best);
    return best.missing;
  };

  const columns: number[] = [];
  chain.forEach((atom, i) => {
    const column = i === 0 ? 0 : columns[i - 1] + gaps[i - 1];
    columns.push(column);
    grid.set(key(0, column), symbol(compound, atom));
    placed.add(atom);
    if (i > 0) {
      const { type } = neighbors[atom].find((n) => n.atom === chain[i - 1])!;
      for (let bond = columns[i - 1] + 1; bond < column; bond++) {
        grid.set(key(0, bond), HORIZONTAL[type]);
      }
    }
  });

  const directionsAt = (i: number): Direction[] => [
    ...(i === chain.length - 1 ? [RIGHT] : []),
    ...(i === 0 ? [LEFT] : []),
    UP,
    DOWN,
  ];

  // heavy atoms on the whole chain first, so hydrogens never take their place
  let missing = 0;
  for (const heavy of [true, false]) {
    chain.forEach((atom, i) => {
      neighbors[atom]
        .filter((n) => !placed.has(n.atom) && isHeavy(n.atom) === heavy)
        .sort(byPriority(atom))
        .forEach((n) => {
          missing += attach(atom, [0, columns[i]], n, directionsAt(i));
        });
    });
  }

  return { cells: grid, missing };
}

function toLines(grid: Map<string, string>): string[] {
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
