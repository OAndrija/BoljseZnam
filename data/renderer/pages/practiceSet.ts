import type { ProblemSummary } from '../../shared/types';
import type { BreadcrumbItem } from '../components/Breadcrumb';
import type { Catalog } from '../hooks/useCatalog';

/**
 * The set of problems the user is working through, taken from the URL:
 * ?poglavje=<category id> for a chapter, ?npz=<year> for a whole exam,
 * otherwise all problems.
 */
export interface PracticeSet {
  problems: ProblemSummary[];
  breadcrumb: BreadcrumbItem[];
  /** Where to go when leaving or finishing the set. */
  exitPath: string;
}

export function practiceSetFrom(
  searchParams: URLSearchParams,
  catalog: Catalog,
): PracticeSet {
  const chapterId = searchParams.get('poglavje');
  if (chapterId) {
    const chapter = catalog.categories.find(({ id }) => id === chapterId);
    return {
      problems: catalog.problems.filter((problem) =>
        problem.categories.includes(chapterId),
      ),
      breadcrumb: [
        { label: 'Po poglavjih', to: '/poglavja' },
        { label: chapter?.name ?? chapterId },
      ],
      exitPath: '/poglavja',
    };
  }

  const examYear = searchParams.get('npz');
  if (examYear) {
    return {
      problems: catalog.problems.filter(
        (problem) => String(problem.year) === examYear,
      ),
      breadcrumb: [
        { label: 'Celoten NPZ', to: '/npz' },
        { label: `NPZ ${examYear}` },
      ],
      exitPath: '/npz',
    };
  }

  return {
    problems: catalog.problems,
    breadcrumb: [{ label: 'Domov', to: '/' }, { label: 'Vse naloge' }],
    exitPath: '/',
  };
}
