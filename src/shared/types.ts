export interface AppInfo {
    version: string;
}

export interface ElectronAPI {
    getAppInfo(): Promise<AppInfo>;
}

export type QuestionType = "multiple-choice" | "essay";
export type SubjectID = "KEM" | "test";
export type CategoryID = "test";

export interface MultipleChoiceQuestion {
    type: "multiple-choice";
    prompt: string;
    resources: string[];
    answer: number[];
}

export interface EssayQuestion {
    type: "essay";
    prompt: string;
    resources: string[];
    answer: string;
}

export type Question = MultipleChoiceQuestion | EssayQuestion;

export interface Problem {
    subject: SubjectID;
    year: number;
    id: number
    categories: CategoryID[];
    questions: Question[];
}