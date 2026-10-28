import { useState } from 'react';
import { Flame } from 'lucide-react';
import Badge from '../components/Badge';
import Button from '../components/Button';
import Card from '../components/Card';
import FeedbackBanner from '../components/FeedbackBanner';
import { type Compound, compounds, isCorrectName } from '../data/compounds';
import { useShuffledDeck } from '../hooks/useShuffledDeck';
import { XP_CORRECT } from '../progress/results';
import { useResults } from '../progress/ResultsContext';
import fields from '../questions/fields.module.css';
import { capitalize } from '../utils/capitalize';
import { correctInRow } from '../utils/plural';
import drill from './drillPages.module.css';
import styles from './NameCompoundPage.module.css';

type Outcome = 'correct' | 'wrong' | 'revealed';

const BONDS = '–|=‖≡';

function StructuralFormula({ rows }: { rows: string[] }) {
  return (
    <div className={styles.structure} aria-hidden>
      {rows.map((row, r) => (
        <div key={r} className={styles.structureRow}>
          {[...row].map((char, c) => (
            <span
              key={c}
              className={`${styles.atom} ${BONDS.includes(char) ? styles.bond : ''}`}
            >
              {char.trim()}
            </span>
          ))}
        </div>
      ))}
    </div>
  );
}

/** "07 Poimenuj organsko spojino" */
export default function NameCompoundPage() {
  const { current, next } = useShuffledDeck(compounds);
  const [streak, setStreak] = useState(0);

  return (
    <CompoundTask
      // fresh answer and feedback for every compound
      key={current.name}
      compound={current}
      streak={streak}
      onResult={(correct) => setStreak(correct ? streak + 1 : 0)}
      onNext={next}
    />
  );
}

function CompoundTask({
  compound,
  streak,
  onResult,
  onNext,
}: {
  compound: Compound;
  streak: number;
  onResult: (correct: boolean) => void;
  onNext: () => void;
}) {
  const { saveHistory } = useResults();
  const [answer, setAnswer] = useState('');
  const [outcome, setOutcome] = useState<Outcome | null>(null);
  const [showHint, setShowHint] = useState(false);

  const finish = (result: Outcome) => {
    setOutcome(result);
    if (result !== 'revealed') onResult(result === 'correct');
    saveHistory({
      id: crypto.randomUUID(),
      date: new Date(),
      kind: 'spojina',
      title: capitalize(compound.name),
      chapter: 'Organske spojine',
      typeLabel: 'Poimenovanje',
      result: result === 'revealed' ? 'solution-viewed' : result,
    });
  };

  const check = () => {
    finish(isCorrectName(compound, answer) ? 'correct' : 'wrong');
  };

  return (
    <div className={drill.page}>
      <header className={drill.header}>
        <div>
          <h1 className={drill.title}>Poimenuj organsko spojino</h1>
          <p className={drill.subtitle}>
            Zapiši ime spojine po pravilih IUPAC.
          </p>
        </div>
        <Button
          variant="secondary"
          disabled={showHint || outcome !== null}
          onClick={() => setShowHint(true)}
        >
          Pokaži namig
        </Button>
      </header>

      <Card className={drill.task}>
        <div className={drill.badges}>
          <Badge>{compound.group}</Badge>
          <Badge tone="neutral">Težavnost: {compound.difficulty}</Badge>
        </div>
        <StructuralFormula rows={compound.structure} />
        <p className={`${drill.muted} ${styles.formula}`}>
          Racionalna formula: {compound.rationalFormula}
        </p>
        {showHint && <p className={drill.hint}>Namig: {compound.hint}</p>}
      </Card>

      <Card className={styles.answer}>
        <label className={styles.label} htmlFor="compound-name">
          Ime spojine
        </label>
        <form
          className={styles.answerRow}
          onSubmit={(event) => {
            event.preventDefault();
            if (answer.trim() && !outcome) check();
          }}
        >
          <input
            id="compound-name"
            className={`${fields.field} ${styles.input} ${
              outcome === 'correct'
                ? fields.correctField
                : outcome === 'wrong'
                  ? fields.wrongField
                  : ''
            }`}
            autoComplete="off"
            spellCheck={false}
            value={answer}
            disabled={outcome !== null}
            onChange={(event) => setAnswer(event.target.value)}
          />
          {!outcome && (
            <Button type="submit" disabled={!answer.trim()}>
              Preveri
            </Button>
          )}
        </form>
      </Card>

      {outcome === 'correct' && (
        <FeedbackBanner
          kind="success"
          title="Pravilno! Odlično."
          rewards={
            <>
              <Badge tone="success">+{XP_CORRECT} XP</Badge>
              {streak >= 2 && (
                <Badge tone="streak" icon={<Flame size={12} />}>
                  {correctInRow(streak)}
                </Badge>
              )}
            </>
          }
        >
          {compound.explanation}
        </FeedbackBanner>
      )}
      {outcome === 'wrong' && (
        <FeedbackBanner kind="error" title="Ni čisto prav – a zdaj veš, zakaj.">
          Pravilno ime je {compound.name}. {compound.explanation}
        </FeedbackBanner>
      )}
      {outcome === 'revealed' && (
        <FeedbackBanner kind="neutral" title={`Rešitev: ${compound.name}`}>
          {compound.explanation}
        </FeedbackBanner>
      )}

      <div className={drill.actions}>
        {!outcome && (
          <Button variant="secondary" onClick={() => finish('revealed')}>
            Pokaži rešitev
          </Button>
        )}
        <div className={drill.spacer} />
        <Button variant={outcome ? 'primary' : 'ghost'} onClick={onNext}>
          {outcome ? 'Naslednja spojina →' : 'Preskoči'}
        </Button>
      </div>
    </div>
  );
}
