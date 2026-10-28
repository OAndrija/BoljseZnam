import { Check, X } from 'lucide-react';
import type { QuestionData } from '../../shared/types';
import Badge from '../components/Badge';
import Button from '../components/Button';
import FeedbackBanner from '../components/FeedbackBanner';
import { type Answer, formatDecimal, letter, type Result } from './grading';
import styles from './QuestionFeedback.module.css';

// TODO: real XP is awarded once progress is saved (phase 5)
const XP_CORRECT = 10;
const XP_ATTEMPT = 2;

function letters(indexes: number[]): string {
  return [...indexes]
    .sort((a, b) => a - b)
    .map((index) => letter(index).toUpperCase())
    .join(', ');
}

function wrongAnswerText(question: QuestionData, answer: Answer): string {
  if (
    question.type === 'multiple-choice' &&
    answer.type === 'multiple-choice'
  ) {
    return `Izbral si ${letters(answer.selected)}. Pravilen odgovor je ${letters(question.answer)}.`;
  }
  if (question.type === 'numeric' && answer.type === 'numeric') {
    const unit = question.unit ? ` ${question.unit}` : '';
    return `Pravilen rezultat je ${formatDecimal(question.answer)}${unit}.`;
  }
  return '';
}

export default function QuestionFeedback({
  question,
  answer,
  result,
  selfGrade,
  onSelfGrade,
}: {
  question: QuestionData;
  answer: Answer;
  result: Result;
  /** Only for self-check questions: null until the user grades themselves. */
  selfGrade: boolean | null;
  onSelfGrade: (correct: boolean) => void;
}) {
  if (result === 'correct') {
    return (
      <FeedbackBanner
        kind="success"
        title="Pravilno! Odlično."
        rewards={<Badge tone="success">+{XP_CORRECT} XP</Badge>}
      >
        {question.explanation}
      </FeedbackBanner>
    );
  }

  if (result === 'wrong') {
    return (
      <FeedbackBanner
        kind="error"
        title="Ni čisto prav – a zdaj veš, zakaj."
        rewards={<Badge tone="error">+{XP_ATTEMPT} XP za poskus</Badge>}
      >
        {wrongAnswerText(question, answer)} {question.explanation}
      </FeedbackBanner>
    );
  }

  return (
    <div className={styles.selfCheck}>
      <FeedbackBanner kind="neutral" title="Primer odgovora iz rešitev">
        {question.type === 'essay' && question.answer} {question.explanation}
      </FeedbackBanner>
      <p className={styles.note}>
        Tega odgovora ni mogoče samodejno preveriti – primerjaj ga s svojim.
      </p>
      <div className={styles.grading}>
        <Button
          variant={selfGrade === false ? 'danger' : 'secondary'}
          aria-pressed={selfGrade === false}
          onClick={() => onSelfGrade(false)}
        >
          <X size={18} /> Moj odgovor ni pravilen
        </Button>
        <Button
          variant={selfGrade === true ? 'success' : 'secondary'}
          aria-pressed={selfGrade === true}
          onClick={() => onSelfGrade(true)}
        >
          <Check size={18} /> Moj odgovor je pravilen
        </Button>
      </div>
    </div>
  );
}
