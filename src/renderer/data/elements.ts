// TODO to se po moje ne rabi
export type ElementCategory =
  | 'kovina'
  | 'polkovina'
  | 'nekovina'
  | 'zlahtni-plin';

// TODO to zamenja class Atom
export interface ChemicalElement {
  number: number;
  symbol: string;
  name: string;
  /** Relative atomic mass; for elements without stable isotopes the mass number of the longest-lived isotope. */
  mass: number;
  stable: boolean;
  category: ElementCategory;
  /** 1-based grid position; rows 9 and 10 hold lanthanoids and actinoids. */
  row: number;
  column: number;
}

// [symbol, Slovenian name, relative atomic mass] for Z = 1 … 118
const data: [string, string, number][] = [
  ['H', 'vodik', 1.008],
  ['He', 'helij', 4.0026],
  ['Li', 'litij', 6.94],
  ['Be', 'berilij', 9.0122],
  ['B', 'bor', 10.81],
  ['C', 'ogljik', 12.011],
  ['N', 'dušik', 14.007],
  ['O', 'kisik', 15.999],
  ['F', 'fluor', 18.998],
  ['Ne', 'neon', 20.18],
  ['Na', 'natrij', 22.99],
  ['Mg', 'magnezij', 24.305],
  ['Al', 'aluminij', 26.982],
  ['Si', 'silicij', 28.085],
  ['P', 'fosfor', 30.974],
  ['S', 'žveplo', 32.06],
  ['Cl', 'klor', 35.45],
  ['Ar', 'argon', 39.948],
  ['K', 'kalij', 39.098],
  ['Ca', 'kalcij', 40.078],
  ['Sc', 'skandij', 44.956],
  ['Ti', 'titan', 47.867],
  ['V', 'vanadij', 50.942],
  ['Cr', 'krom', 51.996],
  ['Mn', 'mangan', 54.938],
  ['Fe', 'železo', 55.845],
  ['Co', 'kobalt', 58.933],
  ['Ni', 'nikelj', 58.693],
  ['Cu', 'baker', 63.546],
  ['Zn', 'cink', 65.38],
  ['Ga', 'galij', 69.723],
  ['Ge', 'germanij', 72.63],
  ['As', 'arzen', 74.922],
  ['Se', 'selen', 78.971],
  ['Br', 'brom', 79.904],
  ['Kr', 'kripton', 83.798],
  ['Rb', 'rubidij', 85.468],
  ['Sr', 'stroncij', 87.62],
  ['Y', 'itrij', 88.906],
  ['Zr', 'cirkonij', 91.224],
  ['Nb', 'niobij', 92.906],
  ['Mo', 'molibden', 95.95],
  ['Tc', 'tehnecij', 98],
  ['Ru', 'rutenij', 101.07],
  ['Rh', 'rodij', 102.91],
  ['Pd', 'paladij', 106.42],
  ['Ag', 'srebro', 107.87],
  ['Cd', 'kadmij', 112.41],
  ['In', 'indij', 114.82],
  ['Sn', 'kositer', 118.71],
  ['Sb', 'antimon', 121.76],
  ['Te', 'telur', 127.6],
  ['I', 'jod', 126.9],
  ['Xe', 'ksenon', 131.29],
  ['Cs', 'cezij', 132.91],
  ['Ba', 'barij', 137.33],
  ['La', 'lantan', 138.91],
  ['Ce', 'cerij', 140.12],
  ['Pr', 'prazeodim', 140.91],
  ['Nd', 'neodim', 144.24],
  ['Pm', 'prometij', 145],
  ['Sm', 'samarij', 150.36],
  ['Eu', 'evropij', 151.96],
  ['Gd', 'gadolinij', 157.25],
  ['Tb', 'terbij', 158.93],
  ['Dy', 'disprozij', 162.5],
  ['Ho', 'holmij', 164.93],
  ['Er', 'erbij', 167.26],
  ['Tm', 'tulij', 168.93],
  ['Yb', 'iterbij', 173.05],
  ['Lu', 'lutecij', 174.97],
  ['Hf', 'hafnij', 178.49],
  ['Ta', 'tantal', 180.95],
  ['W', 'volfram', 183.84],
  ['Re', 'renij', 186.21],
  ['Os', 'osmij', 190.23],
  ['Ir', 'iridij', 192.22],
  ['Pt', 'platina', 195.08],
  ['Au', 'zlato', 196.97],
  ['Hg', 'živo srebro', 200.59],
  ['Tl', 'talij', 204.38],
  ['Pb', 'svinec', 207.2],
  ['Bi', 'bizmut', 208.98],
  ['Po', 'polonij', 209],
  ['At', 'astat', 210],
  ['Rn', 'radon', 222],
  ['Fr', 'francij', 223],
  ['Ra', 'radij', 226],
  ['Ac', 'aktinij', 227],
  ['Th', 'torij', 232.04],
  ['Pa', 'protaktinij', 231.04],
  ['U', 'uran', 238.03],
  ['Np', 'neptunij', 237],
  ['Pu', 'plutonij', 244],
  ['Am', 'americij', 243],
  ['Cm', 'kirij', 247],
  ['Bk', 'berkelij', 247],
  ['Cf', 'kalifornij', 251],
  ['Es', 'einsteinij', 252],
  ['Fm', 'fermij', 257],
  ['Md', 'mendelevij', 258],
  ['No', 'nobelij', 259],
  ['Lr', 'lavrencij', 266],
  ['Rf', 'raderfordij', 267],
  ['Db', 'dubnij', 268],
  ['Sg', 'seaborgij', 269],
  ['Bh', 'borij', 270],
  ['Hs', 'hasij', 269],
  ['Mt', 'majtnerij', 278],
  ['Ds', 'darmštatij', 281],
  ['Rg', 'rentgenij', 282],
  ['Cn', 'kopernicij', 285],
  ['Nh', 'nihonij', 286],
  ['Fl', 'flerovij', 289],
  ['Mc', 'moskovij', 290],
  ['Lv', 'livermorij', 293],
  ['Ts', 'tenes', 294],
  ['Og', 'oganeson', 294],
];

const nobleGases = [2, 10, 18, 36, 54, 86, 118];
const nonmetals = [1, 6, 7, 8, 9, 15, 16, 17, 34, 35, 53];
const metalloids = [5, 14, 32, 33, 51, 52, 85];

function category(z: number): ElementCategory {
  if (nobleGases.includes(z)) return 'zlahtni-plin';
  if (nonmetals.includes(z)) return 'nekovina';
  if (metalloids.includes(z)) return 'polkovina';
  return 'kovina';
}

/** No stable isotopes: Tc, Pm and everything from Po on except Th, Pa, U. */
function isStable(z: number): boolean {
  if (z === 43 || z === 61) return false;
  return z < 84 || z === 90 || z === 91 || z === 92;
}

function position(z: number): { row: number; column: number } {
  if (z === 1) return { row: 1, column: 1 };
  if (z === 2) return { row: 1, column: 18 };
  if (z <= 4) return { row: 2, column: z - 2 };
  if (z <= 10) return { row: 2, column: z + 8 };
  if (z <= 12) return { row: 3, column: z - 10 };
  if (z <= 18) return { row: 3, column: z };
  if (z <= 36) return { row: 4, column: z - 18 };
  if (z <= 54) return { row: 5, column: z - 36 };
  if (z <= 56) return { row: 6, column: z - 54 };
  if (z <= 71) return { row: 9, column: z - 54 };
  if (z <= 86) return { row: 6, column: z - 68 };
  if (z <= 88) return { row: 7, column: z - 86 };
  if (z <= 103) return { row: 10, column: z - 86 };
  return { row: 7, column: z - 100 };
}

export const elements: ChemicalElement[] = data.map(
  ([symbol, name, mass], i) => {
    const number = i + 1;
    return {
      number,
      symbol,
      name,
      mass,
      stable: isStable(number),
      category: category(number),
      ...position(number),
    };
  },
);

export const elementBySymbol = new Map(elements.map((e) => [e.symbol, e]));

export const categoryLabels: Record<ElementCategory, string> = {
  kovina: 'kovina',
  polkovina: 'polkovina',
  nekovina: 'nekovina',
  'zlahtni-plin': 'žlahtni plin',
};

/** "1,008", or "[98]" for elements without stable isotopes. */
export function formatMass(element: ChemicalElement): string {
  const value = String(element.mass).replace('.', ',');
  return element.stable ? value : `[${value}]`;
}

// probably move this to a separate file later

export class Bond {
    src: number
    dst: number;
    type: 'single' | 'double' | 'triple';
    constructor(src: number, dst: number, type: 'single' | 'double' | 'triple') {
        this.src = src;
        this.dst = dst;
        this.type = type;
    }
};

export class Compound {
    atoms: Number[]; // atomic numbers
    bonds: Bond[];
    constructor(atoms: Number[], bonds: Bond[]) {
        this.atoms = atoms;
        this.bonds = bonds;
    }
}

export function getCompoundName(compound: Compound): String {
  // placeholder
  return "metan";
}

export function generateCompound(): Compound {
  // placeholder
  return new Compound(
    [6, 1, 1, 1, 1],
    [
      new Bond(0, 1, 'single'),
      new Bond(0, 2, 'single'), 
      new Bond(0, 3, 'single'), 
      new Bond(0, 4, 'single')
    ]
  );
}
