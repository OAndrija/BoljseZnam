import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useMemo,
  useReducer,
  useEffect,
  useRef,
  useState,
} from 'react';
import type {
  Category,
  ProblemSummary,
  StoredHistory,
} from '../../shared/types';
import type { Compound } from '../data/elements';
import type { Equation } from '../data/equations';
import { localDay } from './activity';
import type { ProblemOutcome } from './results';
import { XP_ATTEMPT, XP_CORRECT } from './results';

export type HistoryKind = 'naloga' | 'poimenovanje' | 'reakcija';
export type HistoryResult = 'correct' | 'wrong' | 'solution-viewed';

interface HistoryBase {
  id: string;
  date: Date;
  localDay?: string;
  chapter: string | null;
  result: HistoryResult;
}

/** One checked task. NPZ subquestions have one all-or-nothing outcome. */
export type HistoryEntry =
  | (HistoryBase & { kind: 'naloga'; taskKey: string })
  | (HistoryBase & { kind: 'poimenovanje'; problemData: Compound })
  | (HistoryBase & { kind: 'reakcija'; problemData: Equation });

export function historyTitle(entry: HistoryEntry): string {
  if (entry.kind === 'poimenovanje') return 'Poimenovanje';
  if (entry.kind === 'reakcija') return 'Urejanje reakcije';
  const match = /^(?:[^-]+)-(\d+)-(\d+)$/.exec(entry.taskKey);
  return match ? `NPZ ${match[1]} · naloga ${Number(match[2])}` : entry.taskKey;
}

function awardedXp(entry: HistoryEntry): number {
  if (entry.result === 'correct') return XP_CORRECT;
  if (entry.result === 'wrong' && entry.kind === 'naloga') return XP_ATTEMPT;
  return 0;
}

interface State {
  history: HistoryEntry[];
  totalXp: number;
  weeklyGoal: number;
}

type Action =
  | {
      type: 'load';
      history: HistoryEntry[];
      totalXp: number;
      weeklyGoal: number;
    }
  | { type: 'save'; entry: HistoryEntry }
  | { type: 'clear' };

function reducer(state: State, action: Action): State {
  if (action.type === 'load') return action;
  if (action.type === 'clear') return { ...state, history: [], totalXp: 0 };
  const previous = state.history.find(({ id }) => id === action.entry.id);
  const history = [
    action.entry,
    ...state.history.filter(({ id }) => id !== action.entry.id),
  ];
  return {
    history,
    weeklyGoal: state.weeklyGoal,
    totalXp:
      state.totalXp +
      awardedXp(action.entry) -
      (previous ? awardedXp(previous) : 0),
  };
}

interface ResultsStore {
  /** Latest graded outcome per NPZ problem, across all attempts. */
  outcomes: ReadonlyMap<string, ProblemOutcome>;
  /** Newest first. */
  history: readonly HistoryEntry[];
  totalXp: number;
  weeklyGoal: number;
  /** Adds an attempt or updates the same attempt after essay self-grading. */
  saveHistory: (entry: HistoryEntry) => void;
  clearHistory: () => void;
}

const ResultsContext = createContext<ResultsStore | null>(null);

function toStored(entry: HistoryEntry): StoredHistory {
  return {
    id: entry.id,
    completedAtMs: entry.date.getTime(),
    localDay: localDay(entry.date),
    kind: entry.kind,
    taskKey: entry.kind === 'naloga' ? entry.taskKey : null,
    outcome: entry.result,
    problemJson:
      entry.kind === 'naloga' ? null : JSON.stringify(entry.problemData),
  };
}

function fromStored(
  row: StoredHistory,
  chapters: ReadonlyMap<string, string>,
): HistoryEntry {
  const base = {
    id: row.id,
    date: new Date(row.completedAtMs),
    localDay: row.localDay,
    result: row.outcome,
  };
  if (row.kind === 'naloga') {
    const taskKey = row.taskKey!;
    return {
      ...base,
      kind: 'naloga',
      taskKey,
      chapter: chapters.get(taskKey) ?? null,
    };
  }
  if (row.kind === 'poimenovanje') {
    return {
      ...base,
      kind: 'poimenovanje',
      chapter: 'Organske spojine',
      problemData: JSON.parse(row.problemJson!) as Compound,
    };
  }
  return {
    ...base,
    kind: 'reakcija',
    chapter: 'Kemijske reakcije',
    problemData: JSON.parse(row.problemJson!) as Equation,
  };
}

function chapterMap(problems: ProblemSummary[], categories: Category[]) {
  const names = new Map(categories.map(({ id, name }) => [id, name]));
  return new Map(
    problems.map((problem) => [
      `${problem.subject}-${problem.year}-${problem.id}`,
      problem.categories.map((id) => names.get(id)).find(Boolean) ?? '',
    ]),
  );
}

export function ResultsProvider({ children }: { children: ReactNode }) {
  const [{ history, totalXp, weeklyGoal }, dispatch] = useReducer(reducer, {
    history: [],
    totalXp: 0,
    weeklyGoal: 20,
  });
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const pending = useRef<Promise<unknown>>(Promise.resolve());

  useEffect(() => {
    let active = true;
    Promise.all([
      window.api.loadProgress(),
      window.api.listProblems(),
      window.api.listCategories(),
    ])
      .then(([saved, problems, categories]) => {
        if (!active) return;
        const chapters = chapterMap(problems, categories);
        dispatch({
          type: 'load',
          history: saved.history.map((row) => fromStored(row, chapters)),
          totalXp: saved.totalXp,
          weeklyGoal: saved.weeklyGoal,
        });
        setReady(true);
      })
      .catch((cause: unknown) => setError(String(cause)));
    return () => {
      active = false;
    };
  }, []);

  const persist = useCallback((operation: () => Promise<unknown>) => {
    pending.current = pending.current
      .then(operation)
      .catch((cause: unknown) => {
        setError(`Shranjevanje ni uspelo: ${String(cause)}`);
      });
  }, []);

  const saveHistory = useCallback(
    (entry: HistoryEntry) => {
      dispatch({ type: 'save', entry });
      persist(() => window.api.saveHistory(toStored(entry)));
    },
    [persist],
  );
  const clearHistory = useCallback(() => {
    dispatch({ type: 'clear' });
    persist(() => window.api.clearHistory());
  }, [persist]);

  const outcomes = useMemo(() => {
    const latest = new Map<string, ProblemOutcome>();
    for (const entry of history) {
      if (entry.kind !== 'naloga' || latest.has(entry.taskKey)) continue;
      latest.set(
        entry.taskKey,
        entry.result === 'solution-viewed' ? 'ungraded' : entry.result,
      );
    }
    return latest;
  }, [history]);

  const store = useMemo(
    () => ({
      outcomes,
      history,
      totalXp,
      weeklyGoal,
      saveHistory,
      clearHistory,
    }),
    [outcomes, history, totalXp, weeklyGoal, saveHistory, clearHistory],
  );

  if (error) return <p role="alert">{error}</p>;
  if (!ready) return <p>Nalaganje napredka…</p>;

  return (
    <ResultsContext.Provider value={store}>{children}</ResultsContext.Provider>
  );
}

export function useResults(): ResultsStore {
  const store = useContext(ResultsContext);
  if (!store) throw new Error('useResults must be used inside ResultsProvider');
  return store;
}
