/** Lowercase, no spaces around dashes, single spaces – for comparing names. */
export function normalizeName(name: string): string {
  return name
    .trim()
    .toLocaleLowerCase('sl')
    .replace(/[‐‑‒–—]/g, '-')
    .replace(/\s*-\s*/g, '-')
    .replace(/\s+/g, ' ');
}

export function isCorrectName(name: string, answer: string): boolean {
  return normalizeName(name) === normalizeName(answer);
}
