import type { NumericQuestion } from '../../shared/types';
import { type Result, unitOptions } from './grading';
import fields from './fields.module.css';
import styles from './Numeric.module.css';

export default function Numeric({
  question,
  value,
  unit,
  result,
  onChange,
}: {
  question: NumericQuestion;
  value: string;
  unit: string;
  /** Set once the answer has been checked. */
  result?: Result;
  onChange: (value: string, unit: string) => void;
}) {
  const units = unitOptions(question);
  const checked = result !== undefined;
  const resultClass =
    result === 'correct'
      ? fields.correctField
      : result === 'wrong'
        ? fields.wrongField
        : '';

  return (
    <>
      <div className={styles.answer}>
        {question.label && (
          <span className={styles.label}>{question.label} =</span>
        )}
        <input
          className={`${fields.field} ${styles.value} ${resultClass}`}
          inputMode="decimal"
          aria-label="Rezultat"
          value={value}
          disabled={checked}
          onChange={(event) => onChange(event.target.value, unit)}
        />
        {units.length > 1 ? (
          <select
            className={`${fields.field} ${styles.unit}`}
            aria-label="Enota"
            value={unit}
            disabled={checked}
            onChange={(event) => onChange(value, event.target.value)}
          >
            {units.map((option) => (
              <option key={option}>{option}</option>
            ))}
          </select>
        ) : (
          units[0] && <span className={styles.staticUnit}>{units[0]}</span>
        )}
      </div>
      {question.hint && <p className={styles.hint}>Namig: {question.hint}</p>}
    </>
  );
}
