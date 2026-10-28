import { useNavigate } from 'react-router';
import Badge from '../components/Badge';
import Button from '../components/Button';
import Card from '../components/Card';
import { problemKey, problemPath, useCatalog } from '../hooks/useCatalog';
import type { ProblemOutcome } from '../progress/results';
import { useResults } from '../progress/ResultsContext';
import { tasks } from '../utils/plural';
import list from './listPages.module.css';
import styles from './ExamsPage.module.css';

function examPath(year: number) {
  return `/naloga?npz=${year}`;
}

function ExamStatus({
  outcomes,
  total,
}: {
  outcomes: (ProblemOutcome | undefined)[];
  total: number;
}) {
  const attempted = outcomes.filter(Boolean).length;
  const correct = outcomes.filter((outcome) => outcome === 'correct').length;

  if (attempted === 0) return <Badge tone="neutral">Nerešeno</Badge>;
  if (attempted < total) {
    return (
      <Badge tone="streak">
        V teku · {attempted}/{total}
      </Badge>
    );
  }
  return (
    <Badge tone="success">
      Dokončano · {correct}/{total} pravilnih
    </Badge>
  );
}

export default function ExamsPage() {
  const navigate = useNavigate();
  const catalog = useCatalog();
  const { outcomes } = useResults();

  // newest exam first
  const years = [...new Set(catalog?.problems.map(({ year }) => year))].sort(
    (a, b) => b - a,
  );

  const startRandom = () => {
    const year = years[Math.floor(Math.random() * years.length)];
    navigate(examPath(year));
  };

  return (
    <div className={list.page}>
      <header>
        <h1 className={list.title}>Celoten NPZ</h1>
        <p className={list.subtitle}>
          Reši preizkus od začetka do konca – naloge si sledijo kot na pravem
          NPZ-ju.
        </p>
      </header>

      <Card className={styles.random}>
        <div className={styles.randomText}>
          <h2 className={styles.randomTitle}>Naključni NPZ</h2>
          <p className={list.muted}>
            Aplikacija izbere enega izmed preteklih preizkusov. Med reševanjem
            lahko naloge tudi preskočiš.
          </p>
        </div>
        <Button onClick={startRandom} disabled={years.length === 0}>
          Začni naključni NPZ
        </Button>
      </Card>

      <h2 className={list.sectionTitle}>Ali izberi preizkus</h2>

      {catalog && years.length === 0 && (
        <p className={list.empty}>V zbirki še ni preizkusov.</p>
      )}

      {years.length > 0 && (
        <Card className={styles.list}>
          {years.map((year) => {
            const problems = (catalog?.problems ?? []).filter(
              (problem) => problem.year === year,
            );
            const examOutcomes = problems.map((problem) =>
              outcomes.get(problemKey(problem)),
            );
            const started = examOutcomes.some(Boolean);
            const firstOpen = problems.find((_, i) => !examOutcomes[i]);
            // in progress: continue at the first problem not attempted yet
            const action =
              started && firstOpen
                ? {
                    label: 'Nadaljuj',
                    path: `${problemPath(firstOpen)}?npz=${year}`,
                  }
                : { label: started ? 'Ponovi' : 'Začni', path: examPath(year) };
            return (
              <div key={year} className={styles.row}>
                <div className={styles.rowText}>
                  <span className={styles.rowTitle}>NPZ {year}</span>
                  <span className={list.muted}>{tasks(problems.length)}</span>
                </div>
                <ExamStatus outcomes={examOutcomes} total={problems.length} />
                <Button
                  variant={started ? 'primary' : 'secondary'}
                  onClick={() => navigate(action.path)}
                >
                  {action.label}
                </Button>
              </div>
            );
          })}
        </Card>
      )}
    </div>
  );
}
