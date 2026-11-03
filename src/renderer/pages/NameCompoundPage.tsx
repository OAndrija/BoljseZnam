import { type CSSProperties, useEffect } from 'react';
import { Flame } from 'lucide-react';
import Badge from '../components/Badge';
import Button from '../components/Button';
import Card from '../components/Card';
import FeedbackBanner from '../components/FeedbackBanner';
import { isCorrectName } from '../nameCompound/answer';
import {
  createNamingDraft,
  type NamingDraft,
  useDraft,
} from '../progress/drafts';
import { namingCorrectRun } from '../progress/activity';
import { saveLastPosition } from '../progress/lastPosition';
import { XP_CORRECT } from '../progress/results';
import { useResults } from '../progress/ResultsContext';
import fields from '../questions/fields.module.css';
import { correctInRow } from '../utils/plural';
import drill from './drillPages.module.css';
import styles from './NameCompoundPage.module.css';

type Outcome = NonNullable<NamingDraft['outcome']>;

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

/** "07 Poimenuj organsko spojino" */
export default function NameCompoundPage() {
  const [draft, setDraft] = useDraft('poimenovanje', createNamingDraft);
  const { history } = useResults();
  useEffect(() => {
    saveLastPosition({ path: '/spojine', label: 'Poimenovanje spojine' });
  }, []);

  return (
    <CompoundTask
      draft={draft}
      setDraft={setDraft}
      streak={namingCorrectRun(history)}
      onNext={() => setDraft(createNamingDraft(draft.task))}
    />
  );
}

function CompoundTask({
  draft,
  setDraft,
  streak,
  onNext,
}: {
  draft: NamingDraft;
  setDraft: (draft: NamingDraft) => void;
  streak: number;
  onNext: () => void;
}) {
  const { saveHistory } = useResults();
  const { task: compound, answer, outcome, showHint } = draft;

  const finish = (result: Outcome) => {
    setDraft({ ...draft, outcome: result });
    saveHistory({
      id: draft.attemptId,
      date: new Date(),
      kind: 'poimenovanje',
      problemData: compound.compound,
      chapter: 'Organske spojine',
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
            Zapiši ime spojine po pravilih IUPAC.
          </p>
        </div>
        <Button
          variant="secondary"
          disabled={showHint || outcome !== null}
          onClick={() => setDraft({ ...draft, showHint: true })}
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
            onChange={(event) =>
              setDraft({ ...draft, answer: event.target.value })
            }
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
