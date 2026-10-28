import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useMemo,
  useState,
} from 'react';
import type { ProblemOutcome } from './results';

interface ResultsStore {
  /** Latest outcome per problem key (see problemKey). */
  outcomes: ReadonlyMap<string, ProblemOutcome>;
  record: (problemKey: string, outcome: ProblemOutcome) => void;
}

const ResultsContext = createContext<ResultsStore | null>(null);

/**
 * Keeps problem outcomes in memory for this run of the app.
 * TODO: back this with SQLite so it survives restarts (phase 5)
 */
export function ResultsProvider({ children }: { children: ReactNode }) {
  const [outcomes, setOutcomes] = useState<Map<string, ProblemOutcome>>(
    () => new Map(),
  );

  const record = useCallback((problemKey: string, outcome: ProblemOutcome) => {
    setOutcomes((previous) => new Map(previous).set(problemKey, outcome));
  }, []);

  const store = useMemo(() => ({ outcomes, record }), [outcomes, record]);

  return (
    <ResultsContext.Provider value={store}>{children}</ResultsContext.Provider>
  );
}

export function useResults(): ResultsStore {
  const store = useContext(ResultsContext);
  if (!store) throw new Error('useResults must be used inside ResultsProvider');
  return store;
}
