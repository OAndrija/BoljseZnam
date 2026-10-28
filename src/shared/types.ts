export interface AppInfo {
    version: string;
}

export interface ElectronAPI {
    // lahko se odstrani, samo za test
    getAppInfo(): Promise<AppInfo>;

    getProblemData(subject: SubjectID, year: number, id: number): Promise<ProblemData>;

    // povzetki vseh nalog v mapi data/problems
    listProblems(): Promise<ProblemSummary[]>;

    // poglavja iz data/categories.json
    listCategories(): Promise<Category[]>;
}

export type QuestionType = "multiple-choice" | "numeric" | "essay";
export type SubjectID = "KEM" | "test";
// poglavja so definirana v data/categories.json
export type CategoryID = string;

interface BaseQuestion {
    prompt: string;
    resources: string[];
    // pomoč, prikazana pod vprašanjem
    hint?: string;
    // razlaga, prikazana po preverjanju
    explanation?: string;
}

export interface MultipleChoiceQuestion extends BaseQuestion {
    type: "multiple-choice";
    choices: string[];
    answer: number[];
}

export interface NumericQuestion extends BaseQuestion {
    type: "numeric";
    // oznaka pred poljem, npr. "m(NaCl)"
    label?: string;
    answer: number;
    unit?: string;
    // enote, ki jih lahko uporabnik izbere; privzeto samo `unit`
    units?: string[];
    // dovoljeno absolutno odstopanje od pravilnega rezultata
    tolerance?: number;
}

export interface EssayQuestion extends BaseQuestion {
    type: "essay";
    answer: string;
}

export type QuestionData = MultipleChoiceQuestion | NumericQuestion | EssayQuestion;

export interface ProblemData {
    subject: SubjectID;
    year: number;
    id: number;
    prompt: string;
    resources: string[];
    categories: CategoryID[];
    questions: QuestionData[];
}

export interface ProblemSummary {
    subject: SubjectID;
    year: number;
    id: number;
    categories: CategoryID[];
    questionTypes: QuestionType[];
}

export interface Category {
    id: CategoryID;
    name: string;
}
