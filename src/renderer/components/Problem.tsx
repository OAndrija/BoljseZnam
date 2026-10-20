import type { ProblemData } from "../../shared/types";
import Question from "./Question";

export default function Problem({ problem }: { problem: ProblemData }) {
  return <>
    {problem.questions.map((question, index) => (
        <Question key={index} question={question}></Question>
    ))}
  </>;
}