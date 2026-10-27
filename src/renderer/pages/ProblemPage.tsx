import { useEffect, useState } from 'react';
import type { ProblemData } from '../../shared/types';
import Problem from '../components/Problem';

// Temporary: shows the test problem until the task flow is built (phase 3)
export default function ProblemPage() {
  const [problem, setProblem] = useState<ProblemData | null>(null);

  useEffect(() => {
    window.api.getProblemData('test', 1990, 2).then(setProblem);
  }, []);

  return problem && <Problem problem={problem} />;
}
