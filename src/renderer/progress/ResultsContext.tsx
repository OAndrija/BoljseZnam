import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useMemo,
  useState,
} from 'react';
import type { ProblemOutcome } from './results';

export type HistoryKind = 'naloga' | 'npz' | 'spojina' | 'reakcija';

export type HistoryResult =
  | 'correct'
  | 'wrong'
  /** essay checked, but not self-graded */
  | 'solution-viewed'
  /** whole exam: progress like "18/24" in `detail` */
  | 'exam';

/** One row in "Zgodovina". */
export interface HistoryEntry {
  id: string;
  date: Date;
  kind: HistoryKind;
  /** E.g. "NPZ 2019 · naloga 7" or "Propan-1-ol". */
  title: string;
  /** Chapter name, if any. */
  chapter: string | null;
  /** E.g. "Obkroževanje" or "Poimenovanje". */
  typeLabel: string;
  result: HistoryResult;
  detail?: string;
}

interface ResultsStore {
  /** Latest outcome per problem key (see problemKey). */
  outcomes: ReadonlyMap<string, ProblemOutcome>;
  record: (problemKey: string, outcome: ProblemOutcome) => void;
  /** Newest first. */
  history: readonly HistoryEntry[];
  /** Adds an entry, or replaces the one with the same id. */
  saveHistory: (entry: HistoryEntry) => void;
  clearHistory: () => void;
}

const ResultsContext = createContext<ResultsStore | null>(null);

/**
 * Keeps results and history in memory for this run of the app.
 * TODO: back this with SQLite so it survives restarts
 */
export function ResultsProvider({ children }: { children: ReactNode }) {
  const [outcomes, setOutcomes] = useState<Map<string, ProblemOutcome>>(
    () => new Map(),
  );
  const [history, setHistory] = useState<HistoryEntry[]>([]);

  const record = useCallback((problemKey: string, outcome: ProblemOutcome) => {
    setOutcomes((previous) => new Map(previous).set(problemKey, outcome));
  }, []);

  const saveHistory = useCallback((entry: HistoryEntry) => {
    setHistory((previous) => {
      const index = previous.findIndex(({ id }) => id === entry.id);
      if (index < 0) return [entry, ...previous];
      return previous.map((item, i) => (i === index ? entry : item));
    });
  }, []);

  const clearHistory = useCallback(() => {
    setHistory([]);
    setOutcomes(new Map());
  }, []);

  const store = useMemo(
    () => ({ outcomes, record, history, saveHistory, clearHistory }),
    [outcomes, record, history, saveHistory, clearHistory],
  );

  return (
    <ResultsContext.Provider value={store}>{children}</ResultsContext.Provider>
  );
}

export function useResults(): ResultsStore {
  const store = useContext(ResultsContext);
  if (!store) throw new Error('useResults must be used inside ResultsProvider');
  return store;
}
