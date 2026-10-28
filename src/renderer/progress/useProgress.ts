import { type Level, levelFor } from './levels';

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

// TODO: replace with real progress once user data is persisted
const placeholder = {
  streakDays: 5,
  xp: 320,
  weeklyGoal: 20,
  weeklyDone: 16,
  activeDays: [true, true, true, true, true, false, false],
};

/** Streak, XP and weekly goal. Placeholder data until user data is saved. */
export function useProgress(): Progress {
  const { current, next } = levelFor(placeholder.xp);
  return {
    ...placeholder,
    level: current,
    nextLevel: next,
    levelLabel: `Stopnja ${current.number} · ${current.name}`,
    levelProgress: next ? placeholder.xp / next.minXp : 1,
    xpToNextLevel: next ? next.minXp - placeholder.xp : 0,
  };
}
