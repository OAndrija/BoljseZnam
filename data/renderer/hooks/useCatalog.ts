import { useEffect, useState } from 'react';
import type { Category, ProblemSummary } from '../../shared/types';

export interface Catalog {
  problems: ProblemSummary[];
  categories: Category[];
}

// The data folder doesn't change while the app runs, so load it once.
let catalogPromise: Promise<Catalog> | null = null;

function loadCatalog(): Promise<Catalog> {
  catalogPromise ??= Promise.all([
    window.api.listProblems(),
    window.api.listCategories(),
  ]).then(([problems, categories]) => ({ problems, categories }));
  return catalogPromise;
}

/** All problem summaries and chapters; null while loading. */
export function useCatalog(): Catalog | null {
  const [catalog, setCatalog] = useState<Catalog | null>(null);

  useEffect(() => {
    let active = true;
    loadCatalog().then((loaded) => {
      if (active) setCatalog(loaded);
    });
    return () => {
      active = false;
    };
  }, []);

  return catalog;
}

export function problemKey(problem: {
  subject: string;
  year: number;
  id: number;
}): string {
  return `${problem.subject}-${problem.year}-${problem.id}`;
}

export function problemPath(problem: {
  subject: string;
  year: number;
  id: number;
}): string {
  return `/naloga/${problem.subject}/${problem.year}/${problem.id}`;
}
