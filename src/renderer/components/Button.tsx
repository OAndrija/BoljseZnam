import type { ButtonHTMLAttributes } from 'react';
import styles from './Button.module.css';

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  /** Figma "Gumb": Primarni, Sekundarni, Tihi, Potrdi odgovor, Zavrni odgovor */
  variant?: 'primary' | 'secondary' | 'ghost' | 'success' | 'danger';
  fullWidth?: boolean;
};

export default function Button({
  variant = 'primary',
  fullWidth = false,
  className,
  ...props
}: ButtonProps) {
  const classes = [
    styles.button,
    styles[variant],
    fullWidth && styles.fullWidth,
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return <button type="button" className={classes} {...props} />;
}
