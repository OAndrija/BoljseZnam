import { Fragment, useState } from 'react';
import Badge from '../components/Badge';
import Button from '../components/Button';
import Card from '../components/Card';
import FeedbackBanner from '../components/FeedbackBanner';
import { elementBySymbol } from '../data/elements';
import {
  type AtomCount,
  countAtoms,
  type Equation,
  equations,
  formatEquation,
  isReducible,
} from '../data/equations';
import { useShuffledDeck } from '../hooks/useShuffledDeck';
import { XP_CORRECT } from '../progress/results';
import { useResults } from '../progress/ResultsContext';
import { capitalize } from '../utils/capitalize';
import { atoms } from '../utils/plural';
import drill from './drillPages.module.css';
import styles from './BalanceEquationPage.module.css';

type Outcome = 'correct' | 'wrong' | 'revealed';

function elementName(symbol: string): string {
  return elementBySymbol.get(symbol)?.name ?? symbol;
}

/** Empty field means coefficient 1, as on paper. */
function parseCoefficient(value: string): number | null {
  if (value.trim() === '') return 1;
  const number = Number(value);
  return Number.isInteger(number) && number >= 1 && number <= 99
    ? number
    : null;
}

/** "je 1 atom", "sta 2 atoma", "so 3 atomi", "je 5 atomov" */
function isAtoms(count: number): string {
  const lastTwo = count % 100;
  const verb =
    lastTwo === 2 ? 'sta' : lastTwo === 3 || lastTwo === 4 ? 'so' : 'je';
  return `${verb} ${atoms(count)}`;
}

/** Feedback title and text for a wrong answer. */
function wrongFeedback(counts: AtomCount[]) {
  const unbalanced = counts.filter(({ left, right }) => left !== right);
  if (unbalanced.length === 0) {
    // balanced, so the coefficients can only be too big
    return {
      title: 'Skoraj! Enačba je uravnotežena.',
      text: 'Koeficienti pa niso najmanjši možni – deli jih s skupnim deliteljem.',
    };
  }
  const first = unbalanced[0];
  const name = elementName(first.element);
  return {
    title:
      unbalanced.length === 1
        ? `Skoraj! Manjka samo še ${name}.`
        : 'Enačba še ni uravnotežena.',
    text: `${capitalize(name)}: na levi strani ${isAtoms(first.left)}, na desni pa ${first.right}.`,
  };
}

/** "08 Uredi kemijsko enačbo" */
export default function BalanceEquationPage() {
  const { current, next } = useShuffledDeck(equations);
  return (
    <EquationTask
      key={formatEquation(current)}
      equation={current}
      onNext={next}
    />
  );
}

function EquationTask({
  equation,
  onNext,
}: {
  equation: Equation;
  onNext: () => void;
}) {
  const { saveHistory } = useResults();
  const speciesCount = equation.reactants.length + equation.products.length;
  const [values, setValues] = useState<string[]>(() =>
    Array(speciesCount).fill(''),
  );
  const [outcome, setOutcome] = useState<Outcome | null>(null);

  const parsed = values.map(parseCoefficient);
  const valid = parsed.every((value) => value !== null);
  const coefficients = parsed.map((value) => value ?? 1);
  const counts = countAtoms(equation, coefficients);
  const balanced = counts.every(({ left, right }) => left === right);
  const reducible = isReducible(coefficients);

  const finish = (result: Outcome) => {
    setOutcome(result);
    if (result === 'revealed') {
      setValues(equation.solution.map((c) => (c === 1 ? '' : String(c))));
    }
    saveHistory({
      id: crypto.randomUUID(),
      date: new Date(),
      kind: 'reakcija',
      title: formatEquation(equation),
      chapter: 'Kemijske reakcije',
      typeLabel: 'Urejanje enačbe',
      result: result === 'revealed' ? 'solution-viewed' : result,
    });
  };

  const fieldClass =
    outcome === 'correct'
      ? styles.correctField
      : outcome === 'wrong'
        ? styles.wrongField
        : '';

  const coefficientInput = (index: number) => (
    <input
      className={`${styles.coefficient} ${fieldClass}`}
      inputMode="numeric"
      maxLength={2}
      aria-label={`Koeficient ${index + 1}`}
      value={values[index]}
      disabled={outcome !== null}
      onChange={(event) =>
        setValues(
          values.map((value, i) =>
            i === index ? event.target.value.replace(/\D/g, '') : value,
          ),
        )
      }
    />
  );

  const matched = counts
    .filter(({ left, right }) => left === right)
    .map(({ element }) => elementName(element));

  return (
    <div className={drill.page}>
      <header className={drill.header}>
        <div>
          <h1 className={drill.title}>Uredi kemijsko enačbo</h1>
          <p className={drill.subtitle}>
            V prazna polja vpiši koeficiente. Koeficienta 1 ni treba pisati.
          </p>
        </div>
        <Button variant="secondary" onClick={onNext}>
          Nova enačba
        </Button>
      </header>

      <Card className={drill.task}>
        <div className={drill.badges}>
          <Badge tone="neutral">Težavnost: {equation.difficulty}</Badge>
        </div>
        <div className={styles.equation}>
          {equation.reactants.map((species, i) => (
            <Fragment key={`r${i}`}>
              {i > 0 && <span className={styles.operator}>+</span>}
              {coefficientInput(i)}
              <span>{species.formula}</span>
            </Fragment>
          ))}
          <span className={styles.operator}>→</span>
          {equation.products.map((species, i) => (
            <Fragment key={`p${i}`}>
              {i > 0 && <span className={styles.operator}>+</span>}
              {coefficientInput(equation.reactants.length + i)}
              <span>{species.formula}</span>
            </Fragment>
          ))}
        </div>
      </Card>

      <Card className={styles.atoms}>
        <table className={styles.atomTable}>
          <thead>
            <tr>
              <th>Element</th>
              <th>Leva stran</th>
              <th>Desna stran</th>
              <th>Stanje</th>
            </tr>
          </thead>
          <tbody>
            {counts.map(({ element, left, right }) => (
              <tr key={element}>
                <td>
                  {element} – {elementName(element)}
                </td>
                <td>{left}</td>
                <td>{right}</td>
                <td>
                  {left === right ? (
                    <Badge tone="success">Ujema se</Badge>
                  ) : (
                    <Badge tone="error">Se ne ujema</Badge>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      {outcome === 'correct' && (
        <FeedbackBanner
          kind="success"
          title="Pravilno! Enačba je uravnotežena."
          rewards={<Badge tone="success">+{XP_CORRECT} XP</Badge>}
        >
          {formatEquation(equation)}
        </FeedbackBanner>
      )}
      {outcome === 'wrong' && (
        <FeedbackBanner
          kind="error"
          title={wrongFeedback(counts).title}
          rewards={
            matched.length > 0 &&
            matched.length < counts.length && (
              <Badge tone="success">
                {matched.length === 1
                  ? `${capitalize(matched[0])} je že pravilen`
                  : `${capitalize(matched.join(', '))} so že pravilni`}
              </Badge>
            )
          }
        >
          {wrongFeedback(counts).text} Pravilno: {formatEquation(equation)}
        </FeedbackBanner>
      )}
      {outcome === 'revealed' && (
        <FeedbackBanner kind="neutral" title="Rešitev">
          {formatEquation(equation)}
        </FeedbackBanner>
      )}

      <div className={drill.actions}>
        {!outcome && (
          <Button variant="secondary" onClick={() => finish('revealed')}>
            Pokaži rešitev
          </Button>
        )}
        <div className={drill.spacer} />
        {outcome ? (
          <Button onClick={onNext}>Naslednja enačba →</Button>
        ) : (
          <Button
            disabled={!valid}
            onClick={() => finish(balanced && !reducible ? 'correct' : 'wrong')}
          >
            Preveri
          </Button>
        )}
      </div>
    </div>
  );
}
