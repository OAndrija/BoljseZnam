import type { Compound } from '../data/elements';
import { plural } from '../utils/plural';
import {
  CARBON,
  HYDROGEN,
  OXYGEN,
  atomicNumber,
  mainChain,
  neighborList,
} from './graph';

type GroupKey =
  | 'kisline'
  | 'aldehidi'
  | 'ketoni'
  | 'alkoholi'
  | 'alkini'
  | 'alkeni'
  | 'alkani';

/** Ordered by IUPAC priority – the first one found names the compound. */
const GROUPS: Record<
  GroupKey,
  { label: string; hint: string; explanation: (name: string) => string }
> = {
  kisline: {
    label: 'Karboksilne kisline',
    hint: 'Skupina –COOH je karboksilna skupina – ime se konča s -ojska kislina.',
    explanation: (name) =>
      `Spojina ima karboksilno skupino –COOH, zato je karboksilna kislina: ${name}.`,
  },
  aldehidi: {
    label: 'Aldehidi',
    hint: 'Skupina –CHO na koncu verige pomeni aldehid – končnica -al.',
    explanation: (name) =>
      `Spojina ima skupino –CHO na koncu verige, zato je aldehid: ${name}.`,
  },
  ketoni: {
    label: 'Ketoni',
    hint: 'Skupina C=O sredi verige pomeni keton – končnica -on.',
    explanation: (name) =>
      `Spojina ima karbonilno skupino C=O sredi verige, zato je keton: ${name}.`,
  },
  alkoholi: {
    label: 'Alkoholi',
    hint: 'Skupina –OH pomeni alkohol – končnica -ol.',
    explanation: (name) =>
      `Spojina ima hidroksilno skupino –OH, zato je alkohol: ${name}.`,
  },
  alkini: {
    label: 'Alkini',
    hint: 'Trojna vez med ogljikovima atomoma – končnica -in.',
    explanation: (name) =>
      `Spojina ima trojno vez med ogljikovima atomoma, zato je alkin: ${name}.`,
  },
  alkeni: {
    label: 'Alkeni',
    hint: 'Dvojna vez med ogljikovima atomoma – končnica -en.',
    explanation: (name) =>
      `Spojina ima dvojno vez med ogljikovima atomoma, zato je alken: ${name}.`,
  },
  alkani: {
    label: 'Alkani',
    hint: 'Same enojne vezi med ogljikovimi atomi – končnica -an.',
    explanation: (name) =>
      `Med ogljikovimi atomi so same enojne vezi, zato je alkan: ${name}.`,
  },
};

const carbonAtoms = (count: number) =>
  plural(count, [
    'ogljikov atom',
    'ogljikova atoma',
    'ogljikovi atomi',
    'ogljikovih atomov',
  ]);

function groupOf(compound: Compound): GroupKey {
  const neighbors = neighborList(compound);
  const is = (atom: number, z: number) => atomicNumber(compound, atom) === z;
  const hydrogens = (atom: number) =>
    neighbors[atom].filter((n) => is(n.atom, HYDROGEN)).length;
  const carbons = compound.atoms
    .map((_, atom) => atom)
    .filter((atom) => is(atom, CARBON));

  const found = new Set<GroupKey>();
  for (const carbon of carbons) {
    const bonds = neighbors[carbon];
    const carbonyl = bonds.some(
      (n) => n.type === 'double' && is(n.atom, OXYGEN),
    );
    const hydroxyl = bonds.some(
      (n) => n.type === 'single' && is(n.atom, OXYGEN) && hydrogens(n.atom) > 0,
    );
    if (carbonyl && hydroxyl) found.add('kisline');
    else if (carbonyl) found.add(hydrogens(carbon) > 0 ? 'aldehidi' : 'ketoni');
    else if (hydroxyl) found.add('alkoholi');

    for (const n of bonds) {
      if (!is(n.atom, CARBON)) continue;
      if (n.type === 'triple') found.add('alkini');
      if (n.type === 'double') found.add('alkeni');
    }
  }
  return (
    (Object.keys(GROUPS) as GroupKey[]).find((key) => found.has(key)) ??
    'alkani'
  );
}

/** Group of the compound with a hint and an explanation for the page. */
export function classify(
  compound: Compound,
  name: string,
): { group: string; hint: string; explanation: string } {
  const group = GROUPS[groupOf(compound)];
  const length = mainChain(compound).length;
  return {
    group: group.label,
    hint: `${carbonAtoms(length)} v najdaljši verigi. ${group.hint}`,
    explanation: group.explanation(name),
  };
}
