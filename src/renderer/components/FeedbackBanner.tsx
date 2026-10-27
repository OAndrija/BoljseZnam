import type { ReactNode } from 'react';
import { toneClass } from '../styles/tones';
import styles from './FeedbackBanner.module.css';

const toneByKind = {
  success: 'success',
  error: 'error',
  neutral: 'primary',
} as const;

/** "Povratna informacija" shown after checking an answer. */
export default function FeedbackBanner({
  kind,
  title,
  rewards,
  children,
}: {
  kind: keyof typeof toneByKind;
  title: string;
  /** Badges on the right, e.g. "+10 XP". */
  rewards?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <div
      className={`${styles.banner} ${toneClass(toneByKind[kind])}`}
      role="status"
    >
      <div className={styles.header}>
        <p className={styles.title}>{title}</p>
        {rewards && <div className={styles.rewards}>{rewards}</div>}
      </div>
      {children && <div className={styles.body}>{children}</div>}
    </div>
  );
}
