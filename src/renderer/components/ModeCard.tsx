import type { ReactNode } from 'react';
import { Link } from 'react-router';
import { toneClass, type Tone } from '../styles/tones';
import Card from './Card';
import styles from './ModeCard.module.css';

export interface ModeCardProps {
  to: string;
  icon: ReactNode;
  tone: Tone;
  title: string;
  description: string;
  meta?: string;
  actionLabel?: string;
}

/** Practice mode card ("Načini vadbe" on the home screen). */
export default function ModeCard({
  to,
  icon,
  tone,
  title,
  description,
  meta,
  actionLabel = 'Začni →',
}: ModeCardProps) {
  return (
    <Link to={to} className={styles.link}>
      <Card interactive className={`${styles.modeCard} ${toneClass(tone)}`}>
        <div className={styles.top}>
          <div className={styles.icon}>{icon}</div>
          {meta && <span className={styles.meta}>{meta}</span>}
        </div>
        <h3 className={styles.title}>{title}</h3>
        <p className={styles.description}>{description}</p>
        <span className={styles.action}>{actionLabel}</span>
      </Card>
    </Link>
  );
}
