import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
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
  const save = useCallback(
    <T extends Draft>(key: string, update: T | ((previous: T) => T)) => {
      setDrafts((previous) => {
        const next = new Map(previous);
        const value =
          typeof update === 'function'
            ? (update as (draft: T) => T)(previous.get(key) as T)
            : update;
        next.set(key, value);
        return next;
      });
    },
    [],
  );
  const clear = useCallback((key: string) => {
    setDrafts((previous) => {
      const next = new Map(previous);
      next.delete(key);
      return next;
    });
  }, []);
  const store = useMemo(() => ({ drafts, save, clear }), [drafts, save, clear]);
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
  const [initial] = useState(create);
  const draft = (drafts.get(key) as T | undefined) ?? initial;
  useEffect(() => {
    if (!drafts.has(key)) save(key, initial);
  }, [drafts, key, initial, save]);
  const update = useCallback(
    (value: T | ((previous: T) => T)) => save(key, value),
    [key, save],
  );
  const remove = useCallback(() => clear(key), [key, clear]);
  return [draft, update, remove] as const;
}
