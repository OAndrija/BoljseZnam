import {
  type Compound,
  generateCompound,
  getCompoundName,
} from '../data/elements';
import { classify } from './classify';
import { toRationalFormula } from './formula';
import { toStructure } from './structure';

/** Everything the "Poimenuj organsko spojino" page shows for one compound. */
export interface CompoundTask {
  compound: Compound;
  /** Official IUPAC name, shown as the solution. */
  name: string;
  /**
   * Structural formula drawn on a grid: one character per cell.
   * – | single bonds, = ‖ double bonds, ≡ triple bond, space empty.
   */
  structure: string[];
  rationalFormula: string;
  group: string;
  hint: string;
  explanation: string;
}

// a few attempts are enough; the generator may only know a handful of compounds
const MAX_ATTEMPTS = 5;

function buildTask(compound: Compound): CompoundTask {
  const name = String(getCompoundName(compound));
  return {
    compound,
    name,
    structure: toStructure(compound),
    rationalFormula: toRationalFormula(compound),
    ...classify(compound, name),
  };
}

/**
 * Generates a new compound and derives everything shown on the page from it.
 * Tries not to repeat the previous compound.
 */
export function createTask(previous?: CompoundTask): CompoundTask {
  let task = buildTask(generateCompound());
  for (
    let attempt = 1;
    attempt < MAX_ATTEMPTS && task.name === previous?.name;
    attempt++
  ) {
    task = buildTask(generateCompound());
  }
  return task;
}
