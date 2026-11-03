import { useEffect, useState } from 'react';
import {
  Navigate,
  useNavigate,
  useParams,
  useSearchParams,
} from 'react-router';
import type { ProblemData, SubjectID } from '../../shared/types';
import Badge from '../components/Badge';
import Breadcrumb from '../components/Breadcrumb';
import Button from '../components/Button';
import Card from '../components/Card';
import ProgressBar from '../components/ProgressBar';
import { problemKey, problemPath, useCatalog } from '../hooks/useCatalog';
import {
  emptyAnswer,
  grade,
  isAnswered,
  questionTypeLabels,
} from '../questions/grading';
import QuestionBlock from '../questions/QuestionBlock';
import {
  createPracticeDraft,
  practiceDraftKey,
  type PracticeDraft,
  type ProblemWork,
  useDraft,
  useDrafts,
} from '../progress/drafts';
import { saveLastPosition } from '../progress/lastPosition';
import {
  type ProblemOutcome,
  outcomeXp,
  problemOutcome,
} from '../progress/results';
import { useResults } from '../progress/ResultsContext';
import fields from '../questions/fields.module.css';
import { type PracticeSet, practiceSetFrom } from './practiceSet';
import styles from './ProblemPage.module.css';

/** /naloga without a problem: start at the first problem of the set. */
export function StartPractice() {
  const [searchParams] = useSearchParams();
  const catalog = useCatalog();
  const { drafts, clear } = useDrafts();
  const draftKey = practiceDraftKey(searchParams.toString());
  const draft = drafts.get(draftKey) as PracticeDraft | undefined;
  useEffect(() => {
    if (draft?.completed) clear(draftKey);
  }, [draft?.completed, draftKey, clear]);
  if (draft?.completed) return null;
  if (!catalog) return null;

  const problems = practiceSetFrom(searchParams, catalog).problems;
  const first =
    problems.find((problem) => problemKey(problem) === draft?.currentTaskKey) ??
    problems[0];
  if (!first) {
    return <p className={styles.message}>V tem sklopu še ni nalog.</p>;
  }
  return <Navigate to={`${problemPath(first)}?${searchParams}`} replace />;
}

export default function ProblemPage() {
  const params = useParams();
  const [searchParams] = useSearchParams();
  const catalog = useCatalog();
  if (!catalog) return null;

  const ref = {
    subject: params.subject as SubjectID,
    year: Number(params.year),
    id: Number(params.id),
  };

  // key: start with fresh answers whenever the problem changes
  return (
    <ProblemLoader
      key={`${searchParams}:${problemKey(ref)}`}
      {...ref}
      practiceSet={practiceSetFrom(searchParams, catalog)}
      search={searchParams.toString()}
    />
  );
}

function ProblemLoader({
  subject,
  year,
  id,
  practiceSet,
  search,
}: {
  subject: SubjectID;
  year: number;
  id: number;
  practiceSet: PracticeSet;
  search: string;
}) {
  const [problem, setProblem] = useState<ProblemData | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    window.api
      .getProblemData(subject, year, id)
      .then(setProblem)
      .catch(() => setError(true));
  }, [subject, year, id]);

  if (error) {
    return <p className={styles.message}>Naloge ni bilo mogoče naložiti.</p>;
  }
  if (!problem) return null;

  return (
    <ProblemView problem={problem} practiceSet={practiceSet} search={search} />
  );
}

function ProblemView({
  problem,
  practiceSet,
  search,
}: {
  problem: ProblemData;
  practiceSet: PracticeSet;
  search: string;
}) {
  const navigate = useNavigate();
  const { questions } = problem;
  const key = problemKey(problem);
  const [draft, setDraft] = useDraft(practiceDraftKey(search), () =>
    createPracticeDraft(key),
  );
  const [work, setWork] = useState<ProblemWork>(
    () =>
      draft.problems[key] ?? {
        attemptId: crypto.randomUUID(),
        answers: questions.map(emptyAnswer),
        results: null,
        selfGrades: questions.map(() => null),
        scratch: '',
      },
  );
  const { answers, results, selfGrades, scratch } = work;
  const currentOutcome = results ? problemOutcome(results, selfGrades) : null;
  const earnedXp = currentOutcome ? outcomeXp(currentOutcome) : 0;

  const updateWork = (updated: ProblemWork) => {
    setWork(updated);
    setDraft((previous) => ({
      ...previous,
      currentTaskKey: key,
      problems: { ...previous.problems, [key]: updated },
    }));
  };

  const position = practiceSet.problems.findIndex(
    (item) => problemKey(item) === problemKey(problem),
  );
  const total = practiceSet.problems.length;
  const next = practiceSet.problems[position + 1];
  const typeLabels = [...new Set(questions.map(({ type }) => type))].map(
    (type) => questionTypeLabels[type],
  );

  const { saveHistory } = useResults();
  const catalog = useCatalog();

  const saveOutcome = (outcome: ProblemOutcome) => {
    setDraft((previous) => ({
      ...previous,
      outcomes: { ...previous.outcomes, [key]: outcome },
    }));
    if (outcome === 'skipped') return;
    saveHistory({
      id: work.attemptId,
      date: new Date(),
      kind: 'naloga',
      taskKey: key,
      // the chapter being practised, else the problem's first chapter
      chapter:
        practiceSet.chapterName ??
        catalog?.categories.find(({ id }) => problem.categories.includes(id))
          ?.name ??
        null,
      result:
        outcome === 'ungraded'
          ? 'solution-viewed'
          : outcome === 'correct'
            ? 'correct'
            : 'wrong',
    });
  };

  useEffect(() => {
    if (position < 0) return;
    if (draft.currentTaskKey !== key) {
      setDraft((previous) => ({ ...previous, currentTaskKey: key }));
    }
    saveLastPosition({
      path: `${problemPath(problem)}?${search}`,
      label: `${practiceSet.title} · naloga ${position + 1} od ${total}`,
    });
  }, [problem, search, practiceSet.title, position, total, key]);

  const goNext = () => {
    if (!results) saveOutcome('skipped');
    setDraft((previous) => ({
      ...previous,
      currentTaskKey: next ? problemKey(next) : key,
      completed: !next,
    }));
    navigate(next ? `${problemPath(next)}?${search}` : `/rezultat?${search}`);
  };

  const check = () => {
    const checked = questions.map((question, i) => grade(question, answers[i]));
    updateWork({ ...work, results: checked });
    saveOutcome(problemOutcome(checked, selfGrades));
  };

  const selfGrade = (index: number, correct: boolean) => {
    const updated = setAt(selfGrades, index, correct);
    updateWork({ ...work, selfGrades: updated });
    if (results) saveOutcome(problemOutcome(results, updated));
  };

  const setAt = <T,>(list: T[], index: number, value: T) =>
    list.map((item, i) => (i === index ? value : item));

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <Breadcrumb items={practiceSet.breadcrumb} />
        <div className={styles.titleRow}>
          <h1 className={styles.title}>
            {position >= 0
              ? `Naloga ${position + 1} od ${total}`
              : `Naloga ${problem.id}`}
          </h1>
          <Badge tone="neutral">
            NPZ {problem.year} · naloga {problem.id}
          </Badge>
          {typeLabels.map((label) => (
            <Badge key={label}>{label}</Badge>
          ))}
        </div>
        {position >= 0 && (
          <ProgressBar
            value={(position + 1) / total}
            label={`Naloga ${position + 1} od ${total}`}
          />
        )}
      </header>

      {problem.prompt && (
        <Card className={styles.sharedPrompt}>
          <p>{problem.prompt}</p>
        </Card>
      )}

      {questions.map((question, index) => (
        <QuestionBlock
          key={index}
          question={question}
          index={questions.length > 1 ? index : null}
          answer={answers[index]}
          result={results?.[index]}
          selfGrade={selfGrades[index]}
          onAnswer={(answer) =>
            updateWork({ ...work, answers: setAt(answers, index, answer) })
          }
          onSelfGrade={(correct) => selfGrade(index, correct)}
        />
      ))}

      {questions.some(({ type }) => type === 'numeric') && (
        <Card className={styles.scratch}>
          <label className={styles.scratchLabel} htmlFor="scratch">
            Prostor za račun (neobvezno)
          </label>
          <textarea
            id="scratch"
            className={fields.textarea}
            value={scratch}
            onChange={(event) =>
              updateWork({ ...work, scratch: event.target.value })
            }
          />
        </Card>
      )}

      <div className={styles.actions}>
        <Button
          variant="secondary"
          onClick={() => navigate(practiceSet.exitPath)}
        >
          Zapusti
        </Button>
        {earnedXp > 0 && (
          <Badge tone={currentOutcome === 'correct' ? 'success' : 'error'}>
            +{earnedXp} XP
          </Badge>
        )}
        <div className={styles.spacer} />
        {results ? (
          <Button onClick={goNext}>
            {next ? 'Naslednja naloga →' : 'Zaključi'}
          </Button>
        ) : (
          <>
            <Button variant="ghost" onClick={goNext}>
              Preskoči
            </Button>
            <Button onClick={check} disabled={!answers.every(isAnswered)}>
              Preveri
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
