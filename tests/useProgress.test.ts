import { describe, expect, it } from 'vitest';
import { levelFor } from '../src/renderer/progress/levels';
import { useProgress } from '../src/renderer/progress/useProgress';

describe('useProgress', () => {
  it('returns the placeholder progress values', () => {
    const progress = useProgress();

    expect(progress.streakDays).toBe(5);
    expect(progress.xp).toBe(320);
    expect(progress.weeklyGoal).toBe(20);
    expect(progress.weeklyDone).toBe(16);
    expect(progress.activeDays).toEqual([
      true, true, true, true, true, false, false,
    ]);
  });

  it('calculates the current and next level from XP', () => {
    const progress = useProgress();
    const expected = levelFor(320);

    expect(progress.level).toEqual(expected.current);
    expect(progress.nextLevel).toEqual(expected.next);
  });

  it('creates the correct level label', () => {
    const progress = useProgress();

    expect(progress.levelLabel).toBe(
      `Stopnja ${progress.level.number} · ${progress.level.name}`,
    );
  });

  it('calculates progress towards the next level', () => {
    const progress = useProgress();

    if (progress.nextLevel) {
      expect(progress.levelProgress).toBe(
        320 / progress.nextLevel.minXp,
      );

      expect(progress.xpToNextLevel).toBe(
        progress.nextLevel.minXp - 320,
      );
    }
  });

  it('returns a valid progress fraction', () => {
    const progress = useProgress();

    expect(progress.levelProgress).toBeGreaterThanOrEqual(0);
    expect(progress.levelProgress).toBeLessThanOrEqual(1);
  });
});