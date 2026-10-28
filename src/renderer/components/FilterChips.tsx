import styles from './FilterChips.module.css';

export interface FilterOption<T> {
  value: T;
  label: string;
}

/** Row of toggle chips, e.g. "Vrsta naloge: Vse · Obkroževanje · …" */
export default function FilterChips<T>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: FilterOption<T>[];
  value: T;
  onChange: (value: T) => void;
}) {
  return (
    <div className={styles.filter} role="group" aria-label={label}>
      <span className={styles.label}>{label}:</span>
      {options.map((option) => (
        <button
          key={option.label}
          type="button"
          className={`${styles.chip} ${option.value === value ? styles.active : ''}`}
          aria-pressed={option.value === value}
          onClick={() => onChange(option.value)}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
