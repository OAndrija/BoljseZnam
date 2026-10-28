import type { MultipleChoiceQuestion } from '../../shared/types';
import AnswerOption, {
  type AnswerOptionState,
} from '../components/AnswerOption';
import { letter } from './grading';
import styles from './MultipleChoice.module.css';

export default function MultipleChoice({
  question,
  selected,
  checked,
  onChange,
}: {
  question: MultipleChoiceQuestion;
  selected: number[];
  checked: boolean;
  onChange: (selected: number[]) => void;
}) {
  // more than one correct answer -> options toggle instead of replacing
  const multiSelect = question.answer.length > 1;

  const select = (index: number) => {
    if (!multiSelect) {
      onChange([index]);
    } else if (selected.includes(index)) {
      onChange(selected.filter((value) => value !== index));
    } else {
      onChange([...selected, index]);
    }
  };

  const stateOf = (index: number): AnswerOptionState => {
    const isSelected = selected.includes(index);
    if (!checked) return isSelected ? 'selected' : 'default';
    if (question.answer.includes(index)) return 'correct';
    return isSelected ? 'wrong' : 'default';
  };

  return (
    <div className={styles.options}>
      {question.choices.map((choice, index) => (
        <AnswerOption
          key={index}
          letter={letter(index)}
          state={stateOf(index)}
          disabled={checked}
          onClick={() => select(index)}
        >
          {choice}
        </AnswerOption>
      ))}
    </div>
  );
}
