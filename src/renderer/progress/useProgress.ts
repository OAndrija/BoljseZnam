export interface Progress {
  streakDays: number;
  xp: number;
  levelLabel: string;
  /** Progress towards the next level, 0–1. */
  levelProgress: number;
  xpToNextLevel: number;
  nextLevel: number;
  weeklyGoal: number;
  weeklyDone: number;
  /** Monday to Sunday: was something solved that day. */
  activeDays: boolean[];
}

// TODO: replace with real progress once user data is persisted (phase 5)
const placeholderProgress: Progress = {
  streakDays: 5,
  xp: 320,
  levelLabel: 'Stopnja 4 · Laborant',
  levelProgress: 0.64,
  xpToNextLevel: 180,
  nextLevel: 5,
  weeklyGoal: 20,
  weeklyDone: 16,
  activeDays: [true, true, true, true, true, false, false],
};

/** Streak, XP and weekly goal. Placeholder data until phase 5. */
export function useProgress(): Progress {
  return placeholderProgress;
}
