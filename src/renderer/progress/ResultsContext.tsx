import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useMemo,
  useReducer,
} from 'react';
import type { Compound } from '../data/elements';
import type { Equation } from '../data/equations';
import type { ProblemOutcome } from './results';
import { XP_ATTEMPT, XP_CORRECT } from './results';

export type HistoryKind = 'naloga' | 'poimenovanje' | 'reakcija';
export type HistoryResult = 'correct' | 'wrong' | 'solution-viewed';

interface HistoryBase {
  id: string;
  date: Date;
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
}

type Action = { type: 'save'; entry: HistoryEntry } | { type: 'clear' };

function reducer(state: State, action: Action): State {
  if (action.type === 'clear') return { history: [], totalXp: 0 };
  const previous = state.history.find(({ id }) => id === action.entry.id);
  const history = [
    action.entry,
    ...state.history.filter(({ id }) => id !== action.entry.id),
  ];
  return {
    history,
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
  /** Adds an attempt or updates the same attempt after essay self-grading. */
  saveHistory: (entry: HistoryEntry) => void;
  clearHistory: () => void;
}

const ResultsContext = createContext<ResultsStore | null>(null);

/** In-memory implementation; the database will back the same operations later. */
export function ResultsProvider({ children }: { children: ReactNode }) {
  const [{ history, totalXp }, dispatch] = useReducer(reducer, {
    history: [],
    totalXp: 0,
  });

  const saveHistory = useCallback((entry: HistoryEntry) => {
    dispatch({ type: 'save', entry });
  }, []);
  const clearHistory = useCallback(() => dispatch({ type: 'clear' }), []);

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
    () => ({ outcomes, history, totalXp, saveHistory, clearHistory }),
    [outcomes, history, totalXp, saveHistory, clearHistory],
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
