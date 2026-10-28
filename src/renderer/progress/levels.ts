export interface Level {
  number: number;
  name: string;
  /** XP needed to reach this level. */
  minXp: number;
}

export const levels: Level[] = [
  { number: 1, name: 'Začetnik', minXp: 0 },
  { number: 2, name: 'Raziskovalec', minXp: 50 },
  { number: 3, name: 'Asistent', minXp: 150 },
  { number: 4, name: 'Laborant', minXp: 300 },
  { number: 5, name: 'Kemik', minXp: 500 },
  { number: 6, name: 'Profesor', minXp: 800 },
];

export function levelFor(xp: number): { current: Level; next: Level | null } {
  const index = levels.findLastIndex((level) => xp >= level.minXp);
  return { current: levels[index], next: levels[index + 1] ?? null };
}
