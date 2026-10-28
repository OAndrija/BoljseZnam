import { useState } from 'react';
import { useNavigate } from 'react-router';
import Badge from '../components/Badge';
import Button from '../components/Button';
import Card from '../components/Card';
import FilterChips, { type FilterOption } from '../components/FilterChips';
import {
  type HistoryEntry,
  type HistoryKind,
  useResults,
} from '../progress/ResultsContext';
import { correctAnswers, tasks } from '../utils/plural';
import list from './listPages.module.css';
import styles from './HistoryPage.module.css';

const kindFilters: FilterOption<HistoryKind | null>[] = [
  { value: null, label: 'Vse' },
  { value: 'naloga', label: 'Naloge' },
  { value: 'npz', label: 'Celotni NPZ' },
  { value: 'spojina', label: 'Spojine' },
  { value: 'reakcija', label: 'Reakcije' },
];

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

function formatDate(date: Date): string {
  return `${date.getDate()}. ${date.getMonth() + 1}. ${date.getFullYear()}`;
}

function ResultBadge({ entry }: { entry: HistoryEntry }) {
  switch (entry.result) {
    case 'correct':
      return <Badge tone="success">Pravilno</Badge>;
    case 'wrong':
      return <Badge tone="error">Napačno</Badge>;
    case 'solution-viewed':
      return <Badge tone="neutral">Ogledana rešitev</Badge>;
    case 'exam':
      return <Badge>{entry.detail}</Badge>;
  }
}

/** Chapter with the lowest share of correct answers. */
function weakestChapter(entries: readonly HistoryEntry[]) {
  const byChapter = new Map<string, { correct: number; graded: number }>();
  for (const entry of entries) {
    if (!entry.chapter) continue;
    if (entry.result !== 'correct' && entry.result !== 'wrong') continue;
    const stats = byChapter.get(entry.chapter) ?? { correct: 0, graded: 0 };
    stats.graded++;
    if (entry.result === 'correct') stats.correct++;
    byChapter.set(entry.chapter, stats);
  }
  let weakest: { name: string; share: number } | null = null;
  for (const [name, { correct, graded }] of byChapter) {
    const share = correct / graded;
    if (!weakest || share < weakest.share) weakest = { name, share };
  }
  return weakest;
}

/** "09 Zgodovina" */
export default function HistoryPage() {
  const navigate = useNavigate();
  const { history, clearHistory } = useResults();
  const [kind, setKind] = useState<HistoryKind | null>(null);

  // whole exams are summaries of problems that are already listed
  const solved = history.filter((entry) => entry.kind !== 'npz');
  const lastWeek = solved.filter(
    (entry) => Date.now() - entry.date.getTime() < WEEK_MS,
  ).length;
  const correct = solved.filter(({ result }) => result === 'correct').length;
  const graded = solved.filter(
    ({ result }) => result === 'correct' || result === 'wrong',
  ).length;
  const weakest = weakestChapter(solved);
  const visible = kind
    ? history.filter((entry) => entry.kind === kind)
    : history;

  return (
    <div className={list.page}>
      <header className={list.header}>
        <div>
          <h1 className={list.title}>Zgodovina reševanja</h1>
          <p className={list.subtitle}>
            Vse je shranjeno lokalno na tej napravi.
          </p>
        </div>
        <Button
          variant="secondary"
          disabled={history.length === 0}
          onClick={() => {
            if (window.confirm('Res želiš izbrisati vso zgodovino?')) {
              clearHistory();
            }
          }}
        >
          Počisti zgodovino
        </Button>
      </header>

      <div className={styles.stats}>
        <Card className={styles.stat}>
          <span className={styles.statLabel}>Rešenih nalog</span>
          <span className={styles.statValue}>{solved.length}</span>
          <span className={styles.statNote}>v zadnjih 7 dneh: {lastWeek}</span>
        </Card>
        <Card className={styles.stat}>
          <span className={styles.statLabel}>Uspešnost</span>
          <span className={styles.statValue}>
            {graded > 0 ? `${Math.round((correct / graded) * 100)} %` : '–'}
          </span>
          <span className={styles.statNote}>
            {correctAnswers(correct)} od {graded}
          </span>
        </Card>
        <Card className={styles.stat}>
          <span className={styles.statLabel}>Za ponovitev</span>
          <span className={styles.statValue}>{weakest?.name ?? '–'}</span>
          <span className={styles.statNote}>
            {weakest
              ? `najnižja uspešnost: ${Math.round(weakest.share * 100)} %`
              : 'še ni dovolj podatkov'}
          </span>
        </Card>
      </div>

      <FilterChips
        label="Prikaži"
        options={kindFilters}
        value={kind}
        onChange={setKind}
      />

      <Card className={styles.tableCard}>
        {visible.length === 0 ? (
          <div className={styles.empty}>
            <p>Tukaj še ni ničesar – reši prvo nalogo.</p>
            <Button onClick={() => navigate('/poglavja')}>Začni z vajo</Button>
          </div>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Datum</th>
                <th>Naloga</th>
                <th>Poglavje</th>
                <th>Vrsta</th>
                <th>Rezultat</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((entry) => (
                <tr key={entry.id}>
                  <td className={styles.date}>{formatDate(entry.date)}</td>
                  <td>{entry.title}</td>
                  <td>{entry.chapter ?? '—'}</td>
                  <td>{entry.typeLabel}</td>
                  <td>
                    <ResultBadge entry={entry} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
      {visible.length > 0 && (
        <p className={list.muted}>Prikazanih: {tasks(visible.length)}</p>
      )}
    </div>
  );
}
