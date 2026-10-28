import type { ReactNode } from 'react';
import { toneClass, type Tone } from '../styles/tones';
import styles from './Badge.module.css';

/** Figma "Oznaka": small pill label, e.g. "+100 XP" or a question type. */
export default function Badge({
  tone = 'primary',
  icon,
  children,
}: {
  tone?: Tone;
  icon?: ReactNode;
  children: ReactNode;
}) {
  return (
    <span className={`${styles.badge} ${toneClass(tone)}`}>
      {icon}
      {children}
    </span>
  );
}
