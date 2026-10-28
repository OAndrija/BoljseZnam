import type { LucideIcon } from 'lucide-react';
import {
  Atom,
  Award,
  Flame,
  FlaskConical,
  Footprints,
  GraduationCap,
  Scale,
  Target,
} from 'lucide-react';
import type { HistoryEntry } from './ResultsContext';
import type { Progress } from './useProgress';

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: LucideIcon;
  /** Current value towards `target`. */
  progress: number;
  target: number;
}

/** Longest run of correct answers in a row (history is newest first). */
function longestCorrectRun(history: readonly HistoryEntry[]): number {
  let best = 0;
  let run = 0;
  for (const entry of [...history].reverse()) {
    if (entry.kind === 'npz') continue;
    run = entry.result === 'correct' ? run + 1 : 0;
    best = Math.max(best, run);
  }
  return best;
}

export function achievements(
  history: readonly HistoryEntry[],
  progress: Progress,
): Achievement[] {
  const solved = history.filter((entry) => entry.kind !== 'npz');
  const correct = (predicate: (entry: HistoryEntry) => boolean) =>
    solved.filter((entry) => entry.result === 'correct' && predicate(entry))
      .length;

  return [
    {
      id: 'prvi-korak',
      name: 'Prvi korak',
      description: 'Reši svojo prvo nalogo.',
      icon: Footprints,
      progress: solved.length,
      target: 1,
    },
    {
      id: 'mojster-kislin',
      name: 'Mojster kislin',
      description: 'Pravilno reši 25 nalog iz kislin, baz in soli.',
      icon: FlaskConical,
      progress: correct((entry) => entry.chapter === 'Kisline, baze in soli'),
      target: 25,
    },
    {
      id: 'vztrajnez',
      name: 'Vztrajnež',
      description: 'Vadi 7 dni zapored.',
      icon: Flame,
      progress: progress.streakDays,
      target: 7,
    },
    {
      id: 'poimenovalec',
      name: 'Poimenovalec',
      description: 'Pravilno poimenuj 10 organskih spojin.',
      icon: Atom,
      progress: correct((entry) => entry.kind === 'spojina'),
      target: 10,
    },
    {
      id: 'ravnovesje',
      name: 'Ravnovesje',
      description: 'Pravilno uredi 10 kemijskih enačb.',
      icon: Scale,
      progress: correct((entry) => entry.kind === 'reakcija'),
      target: 10,
    },
    {
      id: 'maratonec',
      name: 'Maratonec',
      description: 'Reši celoten NPZ od začetka do konca.',
      icon: Award,
      progress: history.filter((entry) => entry.kind === 'npz').length,
      target: 1,
    },
    {
      id: 'brez-napake',
      name: 'Brez napake',
      description: 'Reši 10 nalog zapored brez napake.',
      icon: Target,
      progress: longestCorrectRun(history),
      target: 10,
    },
    {
      id: 'kemik',
      name: 'Kemik',
      description: 'Dosezi stopnjo 5.',
      icon: GraduationCap,
      progress: progress.level.number,
      target: 5,
    },
  ];
}
