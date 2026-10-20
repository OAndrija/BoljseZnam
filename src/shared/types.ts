export interface AppInfo {
    version: string;
}

export interface ElectronAPI {
    // lahko se odstrani, samo za test
    getAppInfo(): Promise<AppInfo>;

    getProblemData(subject: SubjectID, year: number, id: number): Promise<ProblemData>;

}

export type QuestionType = "multiple-choice" | "essay";
export type SubjectID = "KEM" | "test";
export type CategoryID = "test";

export interface MultipleChoiceQuestion {
    type: "multiple-choice";
    prompt: string;
    resources: string[];
    "choices": string[];
    answer: number[];
}

export interface EssayQuestion {
    type: "essay";
    prompt: string;
    resources: string[];
    answer: string;
}

export type QuestionData = MultipleChoiceQuestion | EssayQuestion;

export interface ProblemData {
    subject: SubjectID;
    year: number;
    id: number;
    prompt: string;
    resources: string[];
    categories: CategoryID[];
    questions: QuestionData[];
}