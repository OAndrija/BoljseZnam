import streakIcon from '../assets/icons/streak.svg';
import xpIcon from '../assets/icons/xp.svg';
import ProgressBar from './ProgressBar';
import styles from './ProgressProfile.module.css';

export interface ProgressProfileProps {
  streakDays: number;
  xp: number;
  levelLabel: string;
  /** Progress towards the next level, 0–1. */
  levelProgress: number;
  xpToNextLevel: number;
  nextLevel: number;
}

export default function ProgressProfile({
  streakDays,
  xp,
  levelLabel,
  levelProgress,
  xpToNextLevel,
  nextLevel,
}: ProgressProfileProps) {
  return (
    <div className={styles.profile}>
      <div className={styles.row}>
        <img src={streakIcon} width={18} height={18} alt="" />
        <span className={styles.streak}>{streakDays}</span>
        <span className={styles.muted}>dni zapored</span>
        <span className={styles.xp}>
          <img src={xpIcon} width={14} height={14} alt="" />
          {xp} XP
        </span>
      </div>
      <p className={styles.level}>{levelLabel}</p>
      <ProgressBar
        value={levelProgress}
        variant="dark"
        label="Napredek do naslednje stopnje"
      />
      <p className={styles.next}>
        še {xpToNextLevel} XP do stopnje {nextLevel}
      </p>
    </div>
  );
}
