import styles from './ProgressBar.module.css';

export default function ProgressBar({
  value,
  height = 6,
  variant = 'light',
  label,
}: {
  /** Progress, 0–1. */
  value: number;
  height?: number;
  variant?: 'light' | 'dark';
  label?: string;
}) {
  const percent = Math.round(Math.min(Math.max(value, 0), 1) * 100);
  const classes = [styles.track, variant === 'dark' && styles.dark]
    .filter(Boolean)
    .join(' ');

  return (
    <div
      className={classes}
      style={{ height }}
      role="progressbar"
      aria-valuenow={percent}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label}
    >
      <div className={styles.fill} style={{ width: `${percent}%` }} />
    </div>
  );
}
