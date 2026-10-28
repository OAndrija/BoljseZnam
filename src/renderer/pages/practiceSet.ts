import type { ProblemSummary, QuestionType } from '../../shared/types';
import type { BreadcrumbItem } from '../components/Breadcrumb';
import type { Catalog } from '../hooks/useCatalog';

/**
 * The set of problems the user is working through, taken from the URL:
 * ?poglavje=<category id> for a chapter, ?npz=<year> for a whole exam,
 * otherwise all problems. ?vrsta=<question type> keeps only problems
 * with that type of question.
 */
export interface PracticeSet {
  problems: ProblemSummary[];
  /** E.g. the chapter name or "NPZ 2023". */
  title: string;
  /** Chapter name when practising one chapter, otherwise null. */
  chapterName: string | null;
  breadcrumb: BreadcrumbItem[];
  /** Where to go when leaving the set. */
  exitPath: string;
}

export function hasQuestionType(
  problem: ProblemSummary,
  type: string | null,
): boolean {
  return !type || problem.questionTypes.includes(type as QuestionType);
}

export function practiceSetFrom(
  searchParams: URLSearchParams,
  catalog: Catalog,
): PracticeSet {
  const type = searchParams.get('vrsta');
  const problems = catalog.problems.filter((problem) =>
    hasQuestionType(problem, type),
  );

  const chapterId = searchParams.get('poglavje');
  if (chapterId) {
    const chapter = catalog.categories.find(({ id }) => id === chapterId);
    const title = chapter?.name ?? chapterId;
    return {
      problems: problems.filter((problem) =>
        problem.categories.includes(chapterId),
      ),
      title,
      chapterName: title,
      breadcrumb: [
        { label: 'Po poglavjih', to: '/poglavja' },
        { label: title },
      ],
      exitPath: '/poglavja',
    };
  }

  const examYear = searchParams.get('npz');
  if (examYear) {
    const title = `NPZ ${examYear}`;
    return {
      problems: problems.filter((problem) => String(problem.year) === examYear),
      title,
      chapterName: null,
      breadcrumb: [{ label: 'Celoten NPZ', to: '/npz' }, { label: title }],
      exitPath: '/npz',
    };
  }

  return {
    problems,
    title: 'Vse naloge',
    chapterName: null,
    breadcrumb: [{ label: 'Domov', to: '/' }, { label: 'Vse naloge' }],
    exitPath: '/',
  };
}
