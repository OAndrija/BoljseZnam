import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { PartyPopper, Sparkles, ThumbsUp } from 'lucide-react';
import Button from '../components/Button';
import Card from '../components/Card';
import ProgressBar from '../components/ProgressBar';
import { problemKey, useCatalog } from '../hooks/useCatalog';
import { clearLastPosition } from '../progress/lastPosition';
import { outcomeXp } from '../progress/results';
import { useResults } from '../progress/ResultsContext';
import { toneClass } from '../styles/tones';
import { tasks } from '../utils/plural';
import { practiceSetFrom } from './practiceSet';
import styles from './ResultPage.module.css';

function headline(share: number) {
  if (share >= 0.8) {
    return {
      title: 'Odlično opravljeno!',
      icon: <PartyPopper size={36} />,
      tone: 'success' as const,
    };
  }
  if (share >= 0.5) {
    return {
      title: 'Dobro opravljeno!',
      icon: <ThumbsUp size={36} />,
      tone: 'primary' as const,
    };
  }
  return {
    title: 'Vaja dela mojstra!',
    icon: <Sparkles size={36} />,
    tone: 'streak' as const,
  };
}

/** "Konec sklopa": summary after the last problem of a set. */
export default function ResultPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const catalog = useCatalog();
  const { outcomes, saveHistory } = useResults();
  const [entryId] = useState(() => crypto.randomUUID());

  // the set is finished, so there's nothing to continue on the home screen
  useEffect(clearLastPosition, []);

  // a finished whole exam gets its own row in "Zgodovina"
  const examYear = searchParams.get('npz');
  useEffect(() => {
    if (!catalog || !examYear) return;
    const problems = practiceSetFrom(searchParams, catalog).problems;
    const correct = problems.filter(
      (problem) => outcomes.get(problemKey(problem)) === 'correct',
    ).length;
    saveHistory({
      id: entryId,
      date: new Date(),
      kind: 'npz',
      title: `NPZ ${examYear} (celoten)`,
      chapter: null,
      typeLabel: 'Celoten NPZ',
      result: 'exam',
      detail: `${correct}/${problems.length} pravilnih`,
    });
    // only once, when the result screen opens
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [catalog]);

  if (!catalog) return null;

  const practiceSet = practiceSetFrom(searchParams, catalog);
  const setOutcomes = practiceSet.problems.map((problem) =>
    outcomes.get(problemKey(problem)),
  );
  const total = practiceSet.problems.length;
  const correct = setOutcomes.filter((outcome) => outcome === 'correct').length;
  const skipped = setOutcomes.filter(
    (outcome) => !outcome || outcome === 'skipped',
  ).length;
  const xp = setOutcomes.reduce(
    (sum, outcome) => sum + (outcome ? outcomeXp(outcome) : 0),
    0,
  );
  const share = total > 0 ? correct / total : 0;
  const { title, icon, tone } = headline(share);

  return (
    <div className={styles.wrapper}>
      <Card className={styles.result}>
        <div className={`${styles.icon} ${toneClass(tone)}`}>{icon}</div>
        <h1 className={styles.title}>{title}</h1>
        <p className={styles.subtitle}>
          {practiceSet.title} · {tasks(total)}
        </p>

        <div className={styles.stats}>
          <div className={styles.stat}>
            <span className={styles.statValue}>
              {correct} / {total}
            </span>
            <span className={styles.statLabel}>pravilnih</span>
          </div>
          <div className={styles.stat}>
            <span className={styles.statValue}>+{xp} XP</span>
            <span className={styles.statLabel}>zbranih točk</span>
          </div>
          <div className={styles.stat}>
            <span className={styles.statValue}>{skipped}</span>
            <span className={styles.statLabel}>preskočenih</span>
          </div>
        </div>

        <div className={styles.score}>
          <div className={styles.scoreHeader}>
            <span>Uspešnost</span>
            <span>{Math.round(share * 100)} %</span>
          </div>
          <ProgressBar value={share} height={10} label="Uspešnost" />
        </div>

        <div className={styles.actions}>
          <Button
            variant="secondary"
            onClick={() => navigate(`/naloga?${searchParams}`)}
          >
            Ponovi sklop
          </Button>
          <Button onClick={() => navigate(practiceSet.exitPath)}>
            {practiceSet.exitPath === '/' ? 'Nazaj domov' : 'Izberi nov sklop'}
          </Button>
        </div>
      </Card>
    </div>
  );
}
