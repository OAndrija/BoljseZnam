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
  type Answer,
  emptyAnswer,
  grade,
  isAnswered,
  questionTypeLabels,
  type Result,
} from '../questions/grading';
import QuestionBlock from '../questions/QuestionBlock';
import fields from '../questions/fields.module.css';
import { type PracticeSet, practiceSetFrom } from './practiceSet';
import styles from './ProblemPage.module.css';

/** /naloga without a problem: start at the first problem of the set. */
export function StartPractice() {
  const [searchParams] = useSearchParams();
  const catalog = useCatalog();
  if (!catalog) return null;

  const first = practiceSetFrom(searchParams, catalog).problems[0];
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
      key={problemKey(ref)}
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

  const [answers, setAnswers] = useState<Answer[]>(() =>
    questions.map(emptyAnswer),
  );
  const [results, setResults] = useState<Result[] | null>(null);
  const [selfGrades, setSelfGrades] = useState<(boolean | null)[]>(() =>
    questions.map(() => null),
  );
  const [scratch, setScratch] = useState('');

  const position = practiceSet.problems.findIndex(
    (item) => problemKey(item) === problemKey(problem),
  );
  const total = practiceSet.problems.length;
  const next = practiceSet.problems[position + 1];
  const typeLabels = [...new Set(questions.map(({ type }) => type))].map(
    (type) => questionTypeLabels[type],
  );

  const goNext = () => {
    // TODO: show the "Konec sklopa" result screen at the end (phase 4)
    navigate(next ? `${problemPath(next)}?${search}` : practiceSet.exitPath);
  };

  const check = () => {
    setResults(questions.map((question, i) => grade(question, answers[i])));
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
          onAnswer={(answer) => setAnswers(setAt(answers, index, answer))}
          onSelfGrade={(correct) =>
            setSelfGrades(setAt(selfGrades, index, correct))
          }
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
            onChange={(event) => setScratch(event.target.value)}
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
