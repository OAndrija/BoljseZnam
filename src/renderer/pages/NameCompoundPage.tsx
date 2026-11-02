import { type CSSProperties, useState } from 'react';
import { useNavigate } from 'react-router';
import { Flame } from 'lucide-react';
import Badge from '../components/Badge';
import Button from '../components/Button';
import Card from '../components/Card';
import FeedbackBanner from '../components/FeedbackBanner';
import ProgressBar from '../components/ProgressBar';
import { isCorrectName } from '../nameCompound/answer';
import { type CompoundTask as Task, createTask } from '../nameCompound/task';
import { XP_CORRECT } from '../progress/results';
import { useResults } from '../progress/ResultsContext';
import { toneClass } from '../styles/tones';
import fields from '../questions/fields.module.css';
import { capitalize } from '../utils/capitalize';
import { correctInRow } from '../utils/plural';
import drill from './drillPages.module.css';
import styles from './NameCompoundPage.module.css';
import { headline } from './ResultPage';
import resultStyles from './ResultPage.module.css';

type Outcome = 'correct' | 'wrong' | 'revealed';

const ROUND_SIZE = 10;

const BONDS = '–|=‖≡⦀';
// lines of a horizontal bond longer than one cell
const LONG_BOND_LINES: Record<string, number> = { '–': 1, '=': 2, '≡': 3 };

function StructuralFormula({ rows }: { rows: string[] }) {
  return (
    <div className={styles.structureFrame} aria-hidden>
      <div
        className={styles.structure}
        style={{ '--columns': rows[0]?.length ?? 1 } as CSSProperties}
      >
        {rows.map((row, r) => (
          <div key={r} className={styles.structureRow}>
            {/* a run of the same horizontal bond is one long bond */}
            {(row.match(/([–=≡])\1+|./gu) ?? []).map((cells, c) =>
              cells.length > 1 ? (
                <span
                  key={c}
                  className={`${styles.atom} ${styles.bond} ${styles.longBond}`}
                  style={{ '--cells': cells.length } as CSSProperties}
                >
                  {Array.from({ length: LONG_BOND_LINES[cells[0]] }, (_, i) => (
                    <span key={i} />
                  ))}
                </span>
              ) : (
                <span
                  key={c}
                  className={`${styles.atom} ${BONDS.includes(cells) ? styles.bond : ''}`}
                >
                  {cells.trim()}
                </span>
              ),
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

/** "07 Poimenuj organsko spojino": rounds of ROUND_SIZE compounds. */
export default function NameCompoundPage() {
  const [task, setTask] = useState(() => createTask());
  // the same compound can come again later, so the name is not a stable key
  const [shown, setShown] = useState(0);
  const [streak, setStreak] = useState(0);
  // outcome of every compound in this round, null when skipped
  const [round, setRound] = useState<(Outcome | null)[]>([]);

  const next = () => {
    setTask(createTask(task));
    setShown(shown + 1);
  };

  if (round.length === ROUND_SIZE) {
    return (
      <RoundSummary
        outcomes={round}
        onRestart={() => {
          setRound([]);
          next();
        }}
      />
    );
  }

  return (
    <CompoundTask
      // fresh answer and feedback for every compound
      key={shown}
      compound={task}
      position={round.length + 1}
      streak={streak}
      onResult={(correct) => setStreak(correct ? streak + 1 : 0)}
      onNext={(outcome) => {
        setRound([...round, outcome]);
        if (round.length + 1 < ROUND_SIZE) next();
      }}
    />
  );
}

/** "Konec runde": summary after the last compound of a round. */
function RoundSummary({
  outcomes,
  onRestart,
}: {
  outcomes: (Outcome | null)[];
  onRestart: () => void;
}) {
  const navigate = useNavigate();
  const correct = outcomes.filter((outcome) => outcome === 'correct').length;
  const unanswered = outcomes.filter(
    (outcome) => outcome === null || outcome === 'revealed',
  ).length;
  const share = correct / outcomes.length;
  const { title, icon, tone } = headline(share);

  return (
    <div className={resultStyles.wrapper}>
      <Card className={resultStyles.result}>
        <div className={`${resultStyles.icon} ${toneClass(tone)}`}>{icon}</div>
        <h1 className={resultStyles.title}>{title}</h1>
        <p className={resultStyles.subtitle}>
          Poimenuj organsko spojino · {outcomes.length} spojin
        </p>

        <div className={resultStyles.stats}>
          <div className={resultStyles.stat}>
            <span className={resultStyles.statValue}>
              {correct} / {outcomes.length}
            </span>
            <span className={resultStyles.statLabel}>pravilnih</span>
          </div>
          <div className={resultStyles.stat}>
            <span className={resultStyles.statValue}>
              +{correct * XP_CORRECT} XP
            </span>
            <span className={resultStyles.statLabel}>zbranih točk</span>
          </div>
          <div className={resultStyles.stat}>
            <span className={resultStyles.statValue}>{unanswered}</span>
            <span className={resultStyles.statLabel}>brez odgovora</span>
          </div>
        </div>

        <div className={resultStyles.score}>
          <div className={resultStyles.scoreHeader}>
            <span>Uspešnost</span>
            <span>{Math.round(share * 100)} %</span>
          </div>
          <ProgressBar value={share} height={10} label="Uspešnost" />
        </div>

        <div className={resultStyles.actions}>
          <Button variant="secondary" onClick={() => navigate('/')}>
            Nazaj domov
          </Button>
          <Button onClick={onRestart}>Nova runda</Button>
        </div>
      </Card>
    </div>
  );
}

function CompoundTask({
  compound,
  position,
  streak,
  onResult,
  onNext,
}: {
  compound: Task;
  /** 1-based place in the round */
  position: number;
  streak: number;
  onResult: (correct: boolean) => void;
  onNext: (outcome: Outcome | null) => void;
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
    finish(isCorrectName(compound.name, answer) ? 'correct' : 'wrong');
  };

  return (
    <div className={drill.page}>
      <header className={drill.header}>
        <div>
          <h1 className={drill.title}>Poimenuj organsko spojino</h1>
          <p className={drill.subtitle}>
            Zapiši ime spojine po pravilih IUPAC. Spojina {position} od{' '}
            {ROUND_SIZE}.
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
        <Button
          variant={outcome ? 'primary' : 'ghost'}
          onClick={() => onNext(outcome)}
        >
          {!outcome
            ? 'Preskoči'
            : position === ROUND_SIZE
              ? 'Zaključi rundo →'
              : 'Naslednja spojina →'}
        </Button>
      </div>
    </div>
  );
}
