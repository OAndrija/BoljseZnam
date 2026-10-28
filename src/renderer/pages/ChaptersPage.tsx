import { useState } from 'react';
import { Link } from 'react-router';
import { FlaskConical } from 'lucide-react';
import type { QuestionType } from '../../shared/types';
import Card from '../components/Card';
import FilterChips, { type FilterOption } from '../components/FilterChips';
import ProgressBar from '../components/ProgressBar';
import { problemKey, useCatalog } from '../hooks/useCatalog';
import { useResults } from '../progress/ResultsContext';
import { questionTypeLabels } from '../questions/grading';
import { tasks } from '../utils/plural';
import { hasQuestionType } from './practiceSet';
import list from './listPages.module.css';
import styles from './ChaptersPage.module.css';

const typeFilters: FilterOption<QuestionType | null>[] = [
  { value: null, label: 'Vse' },
  ...(['multiple-choice', 'numeric', 'essay'] as const).map((type) => ({
    value: type,
    label: questionTypeLabels[type],
  })),
];

export default function ChaptersPage() {
  const catalog = useCatalog();
  const { outcomes } = useResults();
  const [query, setQuery] = useState('');
  const [type, setType] = useState<QuestionType | null>(null);

  const normalizedQuery = query.trim().toLocaleLowerCase('sl');
  const chapters = (catalog?.categories ?? [])
    .filter((chapter) =>
      chapter.name.toLocaleLowerCase('sl').includes(normalizedQuery),
    )
    .map((chapter) => {
      const problems = (catalog?.problems ?? []).filter(
        (problem) =>
          problem.categories.includes(chapter.id) &&
          hasQuestionType(problem, type),
      );
      const correct = problems.filter(
        (problem) => outcomes.get(problemKey(problem)) === 'correct',
      ).length;
      return { ...chapter, total: problems.length, correct };
    })
    .filter((chapter) => chapter.total > 0);

  const startPath = (chapterId: string) => {
    const params = new URLSearchParams({ poglavje: chapterId });
    if (type) params.set('vrsta', type);
    return `/naloga?${params}`;
  };

  return (
    <div className={list.page}>
      <header className={list.header}>
        <div>
          <h1 className={list.title}>Naloge po poglavjih</h1>
          <p className={list.subtitle}>
            Izberi poglavje – naloge so zbrane iz vseh preteklih NPZ-jev.
          </p>
        </div>
        <input
          className={styles.search}
          type="search"
          placeholder="Išči poglavje …"
          aria-label="Išči poglavje"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
      </header>

      <FilterChips
        label="Vrsta naloge"
        options={typeFilters}
        value={type}
        onChange={setType}
      />

      {catalog && chapters.length === 0 && (
        <p className={list.empty}>Ni poglavij, ki bi ustrezala iskanju.</p>
      )}

      <div className={styles.grid}>
        {chapters.map((chapter) => (
          <Link
            key={chapter.id}
            to={startPath(chapter.id)}
            className={styles.link}
          >
            <Card interactive className={styles.chapter}>
              <div className={styles.chapterIcon}>
                <FlaskConical size={22} />
              </div>
              <h2 className={styles.chapterName}>{chapter.name}</h2>
              <div className={styles.chapterFooter}>
                <div className={styles.chapterStats}>
                  <span>{tasks(chapter.total)}</span>
                  <span>
                    {chapter.correct} / {chapter.total} pravilno
                  </span>
                </div>
                <ProgressBar
                  value={chapter.correct / chapter.total}
                  label={`${chapter.name}: rešeno pravilno`}
                />
                <span className={styles.start}>Začni →</span>
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
