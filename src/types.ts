export type StepId = 1 | 2 | 3 | 4 | 5;

export type TemplateId = 'split-teal' | 'classic-ats';

export type PageCount = 1 | 2;

export type SectionType =
  | 'Summary'
  | 'Skills'
  | 'Experience'
  | 'Projects'
  | 'Education'
  | 'Certifications'
  | 'Languages';

export interface HeaderData {
  name: string;
  title: string;
  email: string;
  phone: string;
  address: string;
  linkedin: string;
  github: string;
  portfolio: string;
}

export interface ResumeSection {
  id: string;
  type: SectionType | string;
  title: string;
  content: string;
}

export interface SuggestionItem {
  id: string;
  type: 'ATS' | 'Matching';
  text: string;
}

export interface Scores {
  overall: number;
  ats: number;
  matching: number;
}

export interface AnalysisResult extends Scores {
  missingKeywords: string[];
  suggestions: SuggestionItem[];
}

export interface RefinePassLog {
  attempt: number;
  before: Scores;
  after: Scores;
  summary: string;
}

export interface SavedResumeRecord {
  id: string;
  savedAt: string;
  jobTitle: string;
  company: string;
  score: number;
  template: TemplateId;
  pageCount: PageCount;
  header: HeaderData;
  sections: ResumeSection[];
  resumeText: string;
  jobDescription: string;
}

export interface AppState {
  step: StepId;
  maxReachedStep: StepId;
  resumeText: string;
  fileName: string;
  jobTitle: string;
  company: string;
  jobDescription: string;
  analysis: AnalysisResult | null;
  appliedKeywords: string[];
  appliedSuggestionIds: string[];
  template: TemplateId;
  pageCount: PageCount;
  header: HeaderData;
  sections: ResumeSection[];
  refinedScores: Scores | null;
  refineLogs: RefinePassLog[];
}
