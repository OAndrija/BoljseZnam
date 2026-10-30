import { type Bond, type Compound, elements } from '../data/elements';

export const HYDROGEN = 1;
export const CARBON = 6;
export const OXYGEN = 8;

export type BondType = Bond['type'];

export interface Neighbor {
  atom: number;
  type: BondType;
}

export function atomicNumber(compound: Compound, atom: number): number {
  return Number(compound.atoms[atom]);
}

export function symbol(compound: Compound, atom: number): string {
  return elements[atomicNumber(compound, atom) - 1]?.symbol ?? '?';
}

/** For every atom (by index) the atoms bonded to it. */
export function neighborList(compound: Compound): Neighbor[][] {
  const list: Neighbor[][] = compound.atoms.map(() => []);
  for (const bond of compound.bonds) {
    list[bond.src].push({ atom: bond.dst, type: bond.type });
    list[bond.dst].push({ atom: bond.src, type: bond.type });
  }
  return list;
}

/** Farthest carbon from `start` and the path to it, moving only over carbons. */
function farthestCarbon(
  compound: Compound,
  neighbors: Neighbor[][],
  start: number,
): number[] {
  const previous = new Map<number, number>([[start, -1]]);
  const queue = [start];
  let last = start;
  while (queue.length > 0) {
    last = queue.shift()!;
    for (const { atom } of neighbors[last]) {
      if (previous.has(atom) || atomicNumber(compound, atom) !== CARBON) {
        continue;
      }
      previous.set(atom, last);
      queue.push(atom);
    }
  }
  const path: number[] = [];
  for (let atom = last; atom !== -1; atom = previous.get(atom)!) {
    path.push(atom);
  }
  return path;
}

/**
 * Longest chain of carbon atoms (indices in order). Assumes the carbons form
 * a tree – rings are not supported. Without carbons, the first atom alone.
 */
export function mainChain(
  compound: Compound,
  neighbors = neighborList(compound),
): number[] {
  const firstCarbon = compound.atoms.findIndex((z) => Number(z) === CARBON);
  if (firstCarbon === -1) return compound.atoms.length > 0 ? [0] : [];
  const end = farthestCarbon(compound, neighbors, firstCarbon)[0];
  const chain = farthestCarbon(compound, neighbors, end);

  // a functional group at one end goes on the right, as it is usually written
  const hasGroup = (atom: number) =>
    neighbors[atom].some(
      (n) =>
        !chain.includes(n.atom) && atomicNumber(compound, n.atom) !== HYDROGEN,
    );
  if (
    chain.length > 1 &&
    hasGroup(chain[0]) &&
    !hasGroup(chain[chain.length - 1])
  ) {
    chain.reverse();
  }
  return chain;
}
