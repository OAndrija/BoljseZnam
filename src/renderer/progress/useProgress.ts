import { type Level, levelFor } from './levels';
import { activityProgress } from './activity';
import { useResults } from './ResultsContext';

export interface Progress {
  streakDays: number;
  xp: number;
  level: Level;
  nextLevel: Level | null;
  levelLabel: string;
  /** Share of XP towards the next level, 0–1. */
  levelProgress: number;
  xpToNextLevel: number;
  weeklyGoal: number;
  weeklyDone: number;
  /** Monday to Sunday: was something solved that day. */
  activeDays: boolean[];
}

export function useProgress(): Progress {
  const { history, totalXp, weeklyGoal } = useResults();
  const activity = activityProgress(history);
  const { current, next } = levelFor(totalXp);
  return {
    ...activity,
    xp: totalXp,
    weeklyGoal,
    level: current,
    nextLevel: next,
    levelLabel: `Stopnja ${current.number} · ${current.name}`,
    levelProgress: next
      ? (totalXp - current.minXp) / (next.minXp - current.minXp)
      : 1,
    xpToNextLevel: next ? next.minXp - totalXp : 0,
  };
}
