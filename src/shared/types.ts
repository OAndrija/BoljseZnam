export interface AppInfo {
  version: string;
}

export type StoredKind = 'naloga' | 'poimenovanje' | 'reakcija';
export type StoredOutcome = 'correct' | 'wrong' | 'solution-viewed';

export interface StoredHistory {
  id: string;
  completedAtMs: number;
  localDay: string;
  kind: StoredKind;
  taskKey: string | null;
  outcome: StoredOutcome;
  problemJson: string | null;
}

export interface StoredDraft {
  draftKey: string;
  kind: StoredKind;
  stateVersion: number;
  stateJson: string;
  updatedAtMs: number;
}

export interface StoredProgress {
  totalXp: number;
  weeklyGoal: number;
  history: StoredHistory[];
  drafts: StoredDraft[];
}

export interface ElectronAPI {
  // lahko se odstrani, samo za test
  getAppInfo(): Promise<AppInfo>;

  getProblemData(
    subject: SubjectID,
    year: number,
    id: number,
  ): Promise<ProblemData>;

  // povzetki vseh nalog v mapi data/problems
  listProblems(): Promise<ProblemSummary[]>;

  // poglavja iz data/categories.json
  listCategories(): Promise<Category[]>;

  loadProgress(): Promise<StoredProgress>;
  saveHistory(entry: StoredHistory): Promise<number>;
  clearHistory(): Promise<void>;
  saveDraft(draft: StoredDraft): Promise<void>;
  deleteDraft(key: string): Promise<void>;
}

export type QuestionType = 'multiple-choice' | 'numeric' | 'essay';
export type SubjectID = 'KEM' | 'test';
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
  type: 'multiple-choice';
  choices: string[];
  answer: number[];
}

export interface NumericQuestion extends BaseQuestion {
  type: 'numeric';
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
  type: 'essay';
  answer: string;
}

export type QuestionData =
  | MultipleChoiceQuestion
  | NumericQuestion
  | EssayQuestion;

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
