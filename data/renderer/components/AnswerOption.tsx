import type { ReactNode } from 'react';
import { Check, X } from 'lucide-react';
import styles from './AnswerOption.module.css';

/** Figma "Možnost odgovora": Privzeto, Izbrano, Pravilno, Napačno */
export type AnswerOptionState = 'default' | 'selected' | 'correct' | 'wrong';

export default function AnswerOption({
  letter,
  state = 'default',
  disabled = false,
  onClick,
  children,
}: {
  letter: string;
  state?: AnswerOptionState;
  disabled?: boolean;
  onClick?: () => void;
  children: ReactNode;
}) {
  const classes = [styles.option, state !== 'default' && styles[state]]
    .filter(Boolean)
    .join(' ');

  return (
    <button
      type="button"
      className={classes}
      disabled={disabled}
      aria-pressed={state === 'selected'}
      onClick={onClick}
    >
      <span className={styles.letter}>{letter.toUpperCase()}</span>
      <span className={styles.text}>{children}</span>
      {state === 'correct' && <Check className={styles.statusIcon} size={20} />}
      {state === 'wrong' && <X className={styles.statusIcon} size={20} />}
    </button>
  );
}
