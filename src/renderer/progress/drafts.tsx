import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import type { Equation } from '../data/equations';
import { equations } from '../data/equations';
import type { CompoundTask } from '../nameCompound/task';
import { createTask } from '../nameCompound/task';
import type { Answer, Result } from '../questions/grading';
import type { ProblemOutcome } from './results';

export interface ProblemWork {
  attemptId: string;
  answers: Answer[];
  results: Result[] | null;
  selfGrades: (boolean | null)[];
  scratch: string;
}

export interface PracticeDraft {
  kind: 'naloga';
  currentTaskKey: string;
  completed: boolean;
  outcomes: Record<string, ProblemOutcome>;
  problems: Record<string, ProblemWork>;
}

export interface NamingDraft {
  kind: 'poimenovanje';
  task: CompoundTask;
  attemptId: string;
  answer: string;
  outcome: 'correct' | 'wrong' | 'revealed' | null;
  showHint: boolean;
}

export interface EquationDraft {
  kind: 'reakcija';
  order: number[];
  position: number;
  equation: Equation;
  attemptId: string;
  values: string[];
  outcome: 'correct' | 'wrong' | 'revealed' | null;
}

export type Draft = PracticeDraft | NamingDraft | EquationDraft;

export function practiceDraftKey(search: string): string {
  return `naloga:${search}`;
}

export function createPracticeDraft(currentTaskKey: string): PracticeDraft {
  return {
    kind: 'naloga',
    currentTaskKey,
    completed: false,
    outcomes: {},
    problems: {},
  };
}

export function createNamingDraft(previous?: CompoundTask): NamingDraft {
  return {
    kind: 'poimenovanje',
    task: createTask(previous),
    attemptId: crypto.randomUUID(),
    answer: '',
    outcome: null,
    showHint: false,
  };
}

function shuffledOrder(): number[] {
  const order = equations.map((_, i) => i);
  for (let i = order.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [order[i], order[j]] = [order[j], order[i]];
  }
  return order;
}

export function currentEquation(draft: EquationDraft): Equation {
  return draft.equation;
}

export function createEquationDraft(): EquationDraft {
  const order = shuffledOrder();
  const equation = equations[order[0]];
  return {
    kind: 'reakcija',
    order,
    position: 0,
    equation,
    attemptId: crypto.randomUUID(),
    values: Array(equation.reactants.length + equation.products.length).fill(
      '',
    ),
    outcome: null,
  };
}

export function nextEquationDraft(previous: EquationDraft): EquationDraft {
  let order = previous.order;
  let position = previous.position + 1;
  if (position >= order.length) {
    order = shuffledOrder();
    if (order.length > 1 && order[0] === previous.order[previous.position]) {
      order = [...order.slice(1), order[0]];
    }
    position = 0;
  }
  const equation = equations[order[position]];
  return {
    kind: 'reakcija',
    order,
    position,
    equation,
    attemptId: crypto.randomUUID(),
    values: Array(equation.reactants.length + equation.products.length).fill(
      '',
    ),
    outcome: null,
  };
}

interface DraftStore {
  drafts: ReadonlyMap<string, Draft>;
  save: <T extends Draft>(
    key: string,
    update: T | ((previous: T) => T),
  ) => void;
  clear: (key: string) => void;
}

const DraftsContext = createContext<DraftStore | null>(null);

export function DraftsProvider({ children }: { children: ReactNode }) {
  const [drafts, setDrafts] = useState<Map<string, Draft>>(() => new Map());
  const current = useRef(drafts);
  const pending = useRef<Promise<unknown>>(Promise.resolve());
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    window.api
      .loadProgress()
      .then(({ drafts: saved }) => {
        if (!active) return;
        const loaded = new Map<string, Draft>();
        for (const row of saved) {
          if (row.stateVersion !== 1)
            throw new Error(`Unsupported draft version: ${row.draftKey}`);
          const draft = JSON.parse(row.stateJson) as Draft;
          if (draft.kind !== row.kind)
            throw new Error(`Invalid draft: ${row.draftKey}`);
          loaded.set(row.draftKey, draft);
        }
        current.current = loaded;
        setDrafts(loaded);
        setReady(true);
      })
      .catch((cause: unknown) =>
        setError(`Nalaganje osnutkov ni uspelo: ${String(cause)}`),
      );
    return () => {
      active = false;
    };
  }, []);

  const persist = useCallback((operation: () => Promise<unknown>) => {
    pending.current = pending.current
      .then(operation)
      .catch((cause: unknown) => {
        setError(`Shranjevanje osnutkov ni uspelo: ${String(cause)}`);
      });
  }, []);

  const save = useCallback(
    <T extends Draft>(key: string, update: T | ((previous: T) => T)) => {
      const value =
        typeof update === 'function'
          ? (update as (draft: T) => T)(current.current.get(key) as T)
          : update;
      const next = new Map(current.current);
      next.set(key, value);
      current.current = next;
      setDrafts(next);
      const stateJson = JSON.stringify(value);
      persist(() =>
        window.api.saveDraft({
          draftKey: key,
          kind: value.kind,
          stateVersion: 1,
          stateJson,
          updatedAtMs: Date.now(),
        }),
      );
    },
    [persist],
  );
  const clear = useCallback(
    (key: string) => {
      const next = new Map(current.current);
      next.delete(key);
      current.current = next;
      setDrafts(next);
      persist(() => window.api.deleteDraft(key));
    },
    [persist],
  );
  const store = useMemo(() => ({ drafts, save, clear }), [drafts, save, clear]);
  if (error) return <p role="alert">{error}</p>;
  if (!ready) return <p>Nalaganje osnutkov…</p>;
  return (
    <DraftsContext.Provider value={store}>{children}</DraftsContext.Provider>
  );
}

export function useDrafts(): DraftStore {
  const store = useContext(DraftsContext);
  if (!store) throw new Error('useDrafts must be used inside DraftsProvider');
  return store;
}

/** The first draft is created once, then retained while pages unmount and remount. */
export function useDraft<T extends Draft>(key: string, create: () => T) {
  const { drafts, save, clear } = useDrafts();
  const initialByKey = useRef(new Map<string, T>());
  const stored = drafts.get(key) as T | undefined;
  if (!stored && !initialByKey.current.has(key)) {
    initialByKey.current.set(key, create());
  }
  const initial = initialByKey.current.get(key);
  const draft = stored ?? initial!;
  useEffect(() => {
    if (!stored) save(key, initial!);
  }, [stored, key, initial, save]);
  const update = useCallback(
    (value: T | ((previous: T) => T)) => save(key, value),
    [key, save],
  );
  const remove = useCallback(() => clear(key), [key, clear]);
  return [draft, update, remove] as const;
}
