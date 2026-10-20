import type { ProblemData } from "../../shared/types";
import Question from "./Question";

export default function Problem({ problem }: { problem: ProblemData }) {
  return <>
    <div>Naloga: {problem.prompt}</div>
    {problem.questions.map((question, index) => (
        <Question key={index} question={question}></Question>
    ))}
  </>;
}