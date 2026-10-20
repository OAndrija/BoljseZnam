import type { QuestionData } from "../../shared/types";

const slovenianAlphabet = "abcčdefghijklmnoprsštuvzž";

export default function Question({ question }: { question: QuestionData }) {
  if (question.type === "multiple-choice") {
    return <>
      <div>Vprašanje: {question.prompt}</div>
      <div>
        {question.choices.map((choice, index) => (
          <div key={index}>{slovenianAlphabet[index]}) {choice}</div>
        ))}
      </div>
      <div>Odgovor: {question.answer.map((a) => slovenianAlphabet[a]).join(", ")}</div>
    </>;
  } else if (question.type === "essay") {
    return <>
      <div>Vprašanje: {question.prompt}</div>
      <div>Odgovor: {question.answer}</div>
    </>;
  }
}