import type { Compound } from '../data/elements';
import {
  type BondType,
  HYDROGEN,
  type Neighbor,
  OXYGEN,
  atomicNumber,
  mainChain,
  neighborList,
  symbol,
} from './graph';

const BONDS: Record<BondType, string> = {
  single: '–',
  double: '=',
  triple: '≡',
};

const SUBSCRIPTS = '₀₁₂₃₄₅₆₇₈₉';

function subscript(count: number): string {
  if (count <= 1) return '';
  return [...String(count)].map((digit) => SUBSCRIPTS[Number(digit)]).join('');
}

/**
 * Condensed formula along the longest carbon chain, e.g. CH₃–CH₂–OH,
 * CH₂=CH₂, CH₃–CH(CH₃)–CH₃ or CH₃–COOH. Same limits as toStructure: no rings.
 */
export function toRationalFormula(compound: Compound): string {
  const neighbors = neighborList(compound);
  const chain = mainChain(compound, neighbors);
  const isHydrogen = (atom: number) =>
    atomicNumber(compound, atom) === HYDROGEN;
  const hydrogens = (atom: number) =>
    neighbors[atom].filter((n) => isHydrogen(n.atom)).length;
  const isHydroxyl = ({ atom, type }: Neighbor) =>
    type === 'single' &&
    atomicNumber(compound, atom) === OXYGEN &&
    hydrogens(atom) === 1 &&
    neighbors[atom].length === 2;
  const isCarbonyl = ({ atom, type }: Neighbor) =>
    type === 'double' && atomicNumber(compound, atom) === OXYGEN;

  /** Atom with its hydrogens, then everything else hanging on it: CH₂CH₃, OH. */
  const branch = (atom: number, from: number): string =>
    symbol(compound, atom) +
    (hydrogens(atom) > 0 ? 'H' + subscript(hydrogens(atom)) : '') +
    neighbors[atom]
      .filter((n) => n.atom !== from && !isHydrogen(n.atom))
      .map((n) => BONDS[n.type].replace('–', '') + branch(n.atom, atom))
      .join('');

  const groups = chain.map((atom, i) => {
    const first = i === 0;
    const last = i === chain.length - 1;
    const h = hydrogens(atom);
    let others = neighbors[atom].filter(
      (n) => !chain.includes(n.atom) && !isHydrogen(n.atom),
    );

    const carbonyl = others.find(isCarbonyl);
    const hydroxyl = others.find(isHydroxyl);
    if (carbonyl) others = others.filter((n) => n !== carbonyl);

    let label: string;
    if (carbonyl && hydroxyl && (first || last)) {
      others = others.filter((n) => n !== hydroxyl);
      // methanoic acid is HCOOH; HOOC– when the acid group starts the chain
      label = h > 0 ? 'HCOOH' : first && !last ? 'HOOC' : 'COOH';
    } else {
      const hPart = h > 0 ? 'H' + subscript(h) : '';
      label = symbol(compound, atom) + hPart + (carbonyl ? 'O' : '');
    }

    // a single group at a chain end is written after a bond: CH₃–OH, HO–CH₂–
    if (others.length === 1 && (last || first)) {
      const [group] = others;
      const text = branch(group.atom, atom);
      if (last) return label + BONDS[group.type] + text;
      return (isHydroxyl(group) ? 'HO' : text) + BONDS[group.type] + label;
    }
    return label + others.map((n) => `(${branch(n.atom, atom)})`).join('');
  });

  return groups
    .map((group, i) => {
      if (i === 0) return group;
      const { type } = neighbors[chain[i]].find(
        (n) => n.atom === chain[i - 1],
      )!;
      return BONDS[type] + group;
    })
    .join('');
}
