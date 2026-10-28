import type { QuestionData } from '../../shared/types';
import Card from '../components/Card';
import Essay from './Essay';
import { type Answer, letter, type Result, unitOptions } from './grading';
import MultipleChoice from './MultipleChoice';
import Numeric from './Numeric';
import QuestionFeedback from './QuestionFeedback';
import Resources from './Resources';
import styles from './QuestionBlock.module.css';

function instruction(question: QuestionData): string {
  switch (question.type) {
    case 'multiple-choice':
      return question.answer.length > 1
        ? 'Obkroži črke pred vsemi pravilnimi odgovori.'
        : 'Obkroži črko pred pravilnim odgovorom.';
    case 'numeric':
      return unitOptions(question).length > 1
        ? 'Vpiši rezultat in izberi enoto. Decimalna števila zapiši z vejico.'
        : 'Vpiši rezultat. Decimalna števila zapiši z vejico.';
    case 'essay':
      return 'Odgovor zapiši v nekaj povedih.';
  }
}

/** One question of a problem: the task card plus feedback once checked. */
export default function QuestionBlock({
  question,
  index,
  answer,
  result,
  selfGrade,
  onAnswer,
  onSelfGrade,
}: {
  question: QuestionData;
  /** Position within the problem; null when the problem has one question. */
  index: number | null;
  answer: Answer;
  /** Set once the problem has been checked. */
  result?: Result;
  selfGrade: boolean | null;
  onAnswer: (answer: Answer) => void;
  onSelfGrade: (correct: boolean) => void;
}) {
  const checked = result !== undefined;

  return (
    <>
      <Card className={styles.question}>
        <h2 className={styles.prompt}>
          {index !== null && (
            <span className={styles.letter}>{letter(index)})</span>
          )}
          {question.prompt}
        </h2>
        <Resources files={question.resources ?? []} />
        <p className={styles.instruction}>{instruction(question)}</p>

        {question.type === 'multiple-choice' &&
          answer.type === 'multiple-choice' && (
            <MultipleChoice
              question={question}
              selected={answer.selected}
              checked={checked}
              onChange={(selected) => onAnswer({ ...answer, selected })}
            />
          )}
        {question.type === 'numeric' && answer.type === 'numeric' && (
          <Numeric
            question={question}
            value={answer.value}
            unit={answer.unit}
            result={result}
            onChange={(value, unit) => onAnswer({ ...answer, value, unit })}
          />
        )}
        {question.type === 'essay' && answer.type === 'essay' && (
          <Essay
            text={answer.text}
            checked={checked}
            onChange={(text) => onAnswer({ ...answer, text })}
          />
        )}
      </Card>

      {result && (
        <QuestionFeedback
          question={question}
          answer={answer}
          result={result}
          selfGrade={selfGrade}
          onSelfGrade={onSelfGrade}
        />
      )}
    </>
  );
}
