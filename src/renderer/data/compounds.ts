export interface Compound {
  /** Official IUPAC name, shown as the solution. */
  name: string;
  /** Other accepted names. */
  alternativeNames: string[];
  group: string;
  difficulty: 'lahka' | 'srednja' | 'težka';
  /**
   * Structural formula drawn on a grid: one character per cell.
   * – | single bonds, = ‖ double bonds, ≡ triple bond, space empty.
   */
  structure: string[];
  rationalFormula: string;
  hint: string;
  explanation: string;
}

export const compounds: Compound[] = [
  {
    name: 'metan',
    alternativeNames: [],
    group: 'Alkani',
    difficulty: 'lahka',
    structure: ['  H  ', '  |  ', 'H–C–H', '  |  ', '  H  '],
    rationalFormula: 'CH₄',
    hint: 'En ogljikov atom, same enojne vezi.',
    explanation: 'Metan je najpreprostejši alkan z enim ogljikovim atomom.',
  },
  {
    name: 'etan',
    alternativeNames: [],
    group: 'Alkani',
    difficulty: 'lahka',
    structure: ['  H H  ', '  | |  ', 'H–C–C–H', '  | |  ', '  H H  '],
    rationalFormula: 'CH₃–CH₃',
    hint: 'Dva ogljikova atoma, same enojne vezi.',
    explanation: 'Alkan z dvema ogljikovima atomoma je etan.',
  },
  {
    name: 'propan',
    alternativeNames: [],
    group: 'Alkani',
    difficulty: 'lahka',
    structure: [
      '  H H H  ',
      '  | | |  ',
      'H–C–C–C–H',
      '  | | |  ',
      '  H H H  ',
    ],
    rationalFormula: 'CH₃–CH₂–CH₃',
    hint: 'Trije ogljikovi atomi, same enojne vezi.',
    explanation: 'Alkan s tremi ogljikovimi atomi je propan.',
  },
  {
    name: 'butan',
    alternativeNames: ['n-butan'],
    group: 'Alkani',
    difficulty: 'lahka',
    structure: [
      '  H H H H  ',
      '  | | | |  ',
      'H–C–C–C–C–H',
      '  | | | |  ',
      '  H H H H  ',
    ],
    rationalFormula: 'CH₃–CH₂–CH₂–CH₃',
    hint: 'Štirje ogljikovi atomi v ravni verigi.',
    explanation: 'Nerazvejan alkan s štirimi ogljikovimi atomi je butan.',
  },
  {
    name: 'eten',
    alternativeNames: ['etilen'],
    group: 'Alkeni',
    difficulty: 'lahka',
    structure: ['  H H  ', '  | |  ', 'H–C=C–H'],
    rationalFormula: 'CH₂=CH₂',
    hint: 'Dvojna vez med ogljikovima atomoma – končnica -en.',
    explanation: 'Dva ogljikova atoma z dvojno vezjo: eten (tudi etilen).',
  },
  {
    name: 'etin',
    alternativeNames: ['acetilen'],
    group: 'Alkini',
    difficulty: 'srednja',
    structure: ['H–C≡C–H'],
    rationalFormula: 'CH≡CH',
    hint: 'Trojna vez med ogljikovima atomoma – končnica -in.',
    explanation: 'Dva ogljikova atoma s trojno vezjo: etin (tudi acetilen).',
  },
  {
    name: 'metanol',
    alternativeNames: ['metilni alkohol'],
    group: 'Alkoholi',
    difficulty: 'lahka',
    structure: ['  H    ', '  |    ', 'H–C–O–H', '  |    ', '  H    '],
    rationalFormula: 'CH₃–OH',
    hint: 'Skupina –OH pomeni alkohol – končnica -ol.',
    explanation: 'En ogljikov atom in hidroksilna skupina: metanol.',
  },
  {
    name: 'etanol',
    alternativeNames: ['etilni alkohol'],
    group: 'Alkoholi',
    difficulty: 'lahka',
    structure: [
      '  H H    ',
      '  | |    ',
      'H–C–C–O–H',
      '  | |    ',
      '  H H    ',
    ],
    rationalFormula: 'CH₃–CH₂–OH',
    hint: 'Dva ogljikova atoma in skupina –OH.',
    explanation: 'Dva ogljikova atoma in hidroksilna skupina: etanol.',
  },
  {
    name: 'propan-1-ol',
    alternativeNames: ['1-propanol', 'propanol', 'n-propanol'],
    group: 'Alkoholi',
    difficulty: 'lahka',
    structure: [
      '  H H H    ',
      '  | | |    ',
      'H–C–C–C–O–H',
      '  | | |    ',
      '  H H H    ',
    ],
    rationalFormula: 'CH₃–CH₂–CH₂–OH',
    hint: 'Trije ogljikovi atomi, skupina –OH je na koncu verige.',
    explanation:
      'To je propan-1-ol (tudi 1-propanol). Hidroksilna skupina je vezana na prvi ogljikov atom.',
  },
  {
    name: 'etanojska kislina',
    alternativeNames: ['ocetna kislina'],
    group: 'Karboksilne kisline',
    difficulty: 'srednja',
    structure: [
      '  H O    ',
      '  | ‖    ',
      'H–C–C–O–H',
      '  |      ',
      '  H      ',
    ],
    rationalFormula: 'CH₃–COOH',
    hint: 'Skupina –COOH je karboksilna skupina.',
    explanation:
      'Dva ogljikova atoma s karboksilno skupino: etanojska kislina (ocetna kislina).',
  },
];

/** Lowercase, no spaces around dashes, single spaces – for comparing names. */
export function normalizeName(name: string): string {
  return name
    .trim()
    .toLocaleLowerCase('sl')
    .replace(/[‐‑‒–—]/g, '-')
    .replace(/\s*-\s*/g, '-')
    .replace(/\s+/g, ' ');
}

export function isCorrectName(compound: Compound, answer: string): boolean {
  const normalized = normalizeName(answer);
  return [compound.name, ...compound.alternativeNames].some(
    (name) => normalizeName(name) === normalized,
  );
}
