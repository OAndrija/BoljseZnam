import type { HTMLAttributes } from 'react';
import styles from './Card.module.css';

type CardProps = HTMLAttributes<HTMLDivElement> & {
  interactive?: boolean;
};

/** White surface with border, used for tasks, cards and panels. */
export default function Card({
  interactive = false,
  className,
  ...props
}: CardProps) {
  const classes = [styles.card, interactive && styles.interactive, className]
    .filter(Boolean)
    .join(' ');

  return <div className={classes} {...props} />;
}
