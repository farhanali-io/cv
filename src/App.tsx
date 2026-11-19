import { useEffect, useRef, useState } from 'react';
import { Header } from './components/Header';
import { Stepper } from './components/Stepper';
import { Step1Upload } from './components/Step1Upload';
import { Step2Score } from './components/Step2Score';
import { Step3Template } from './components/Step3Template';
import { Step4Refine } from './components/Step4Refine';
import { Step5FinalEditor } from './components/Step5FinalEditor';
import { SavedResumesDrawer } from './components/SavedResumesDrawer';
import { HelpModal } from './components/HelpModal';
import { parseRawResumeToDraft, SAMPLE_RESUME_TEXT } from './utils/fileParser';
import type {
  AppState,
  HeaderData,
  PageCount,
  RefinePassLog,
  ResumeSection,
  SavedResumeRecord,
  Scores,
  StepId,
  TemplateId,
} from './types';

const STORAGE_KEY = 'resumeai_state_v1';
const SAVED_KEY = 'resumeai_saved_v1';

const EMPTY_HEADER: HeaderData = {
  name: '',
  title: '',
  email: '',
  phone: '',
  address: '',
  linkedin: '',
  github: '',
  portfolio: '',
};

const INITIAL_STATE: AppState = {
  step: 1,
  maxReachedStep: 1,
  resumeText: '',
  fileName: '',
  jobTitle: '',
  company: '',
  jobDescription: '',
  analysis: null,
  appliedKeywords: [],
  appliedSuggestionIds: [],
  template: 'split-teal',
  pageCount: 1,
  header: EMPTY_HEADER,
  sections: [],
  refinedScores: null,
  refineLogs: [],
};

function normalizeTemplateId(value: unknown): TemplateId {
  if (value === 'classic-ats' || value === 'classic') return 'classic-ats';
  return 'split-teal';
}

function loadInitialState(): AppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return INITIAL_STATE;
    const parsed = JSON.parse(raw) as Partial<AppState>;
    return {
      ...INITIAL_STATE,
      ...parsed,
      template: normalizeTemplateId(parsed.template),
      header: { ...EMPTY_HEADER, ...(parsed.header || {}) },
      sections: Array.isArray(parsed.sections) ? parsed.sections : [],
      appliedKeywords: Array.isArray(parsed.appliedKeywords)
        ? parsed.appliedKeywords
        : [],
      appliedSuggestionIds: Array.isArray(parsed.appliedSuggestionIds)
        ? parsed.appliedSuggestionIds
        : [],
      refineLogs: Array.isArray(parsed.refineLogs) ? parsed.refineLogs : [],
    };
  } catch {
    return INITIAL_STATE;
  }
}

function loadSavedRecords(): SavedResumeRecord[] {
  try {
    const raw = localStorage.getItem(SAVED_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.map((rec) => ({
      ...rec,
      template: normalizeTemplateId(rec?.template),
    }));
  } catch {
    return [];
  }
}

export default function App() {
  const [state, setState] = useState<AppState>(loadInitialState);
  const [savedRecords, setSavedRecords] =
    useState<SavedResumeRecord[]>(loadSavedRecords);

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analyzeError, setAnalyzeError] = useState<string | null>(null);

  const [isRefining, setIsRefining] = useState(false);
  const [currentAttempt, setCurrentAttempt] = useState(1);
  const [refineError, setRefineError] = useState<string | null>(null);

  const [isSavedDrawerOpen, setIsSavedDrawerOpen] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);

  const refineAbortRef = useRef(false);

  // Autosave state to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // Ignore quota errors cleanly
    }
  }, [state]);

  useEffect(() => {
    try {
      localStorage.setItem(SAVED_KEY, JSON.stringify(savedRecords));
    } catch {
      // Ignore quota errors cleanly
    }
  }, [savedRecords]);

  const goToStep = (step: StepId) => {
    setState((prev) => ({
      ...prev,
      step,
      maxReachedStep: step > prev.maxReachedStep ? step : prev.maxReachedStep,
    }));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleAnalyze = async () => {
    setAnalyzeError(null);
    setIsAnalyzing(true);
    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resumeText: state.resumeText,
          jobTitle: state.jobTitle,
          company: state.company,
          jobDescription: state.jobDescription,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to analyze resume.');
      }

      const draft = parseRawResumeToDraft(state.resumeText, state.jobTitle);

      setState((prev) => ({
        ...prev,
        analysis: data,
        appliedKeywords: [],
        appliedSuggestionIds: [],
        header: prev.sections.length > 0 ? prev.header : draft.header,
        sections: prev.sections.length > 0 ? prev.sections : draft.sections,
        step: 2,
        maxReachedStep: prev.maxReachedStep < 2 ? 2 : prev.maxReachedStep,
      }));
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      setAnalyzeError(
        err instanceof Error ? err.message : 'Unable to analyze resume.'
      );
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleAddKeyword = (keyword: string) => {
    setState((prev) => {
      const alreadyAdded = prev.appliedKeywords.includes(keyword);
      const nextApplied = alreadyAdded
        ? prev.appliedKeywords.filter((k) => k !== keyword)
        : [...prev.appliedKeywords, keyword];

      let nextResumeText = prev.resumeText;
      if (
        !alreadyAdded &&
        !prev.resumeText.toLowerCase().includes(keyword.toLowerCase())
      ) {
        nextResumeText = `${prev.resumeText.trim()}\nAdded Keyword Focus: ${keyword}`;
      }

      return {
        ...prev,
        appliedKeywords: nextApplied,
        resumeText: nextResumeText,
      };
    });
  };

  const handleApplySuggestion = (suggestionId: string) => {
    setState((prev) => {
      const exists = prev.appliedSuggestionIds.includes(suggestionId);
      return {
        ...prev,
        appliedSuggestionIds: exists
          ? prev.appliedSuggestionIds.filter((id) => id !== suggestionId)
          : [...prev.appliedSuggestionIds, suggestionId],
      };
    });
  };

  const runRefineLoop = async () => {
    refineAbortRef.current = false;
    setRefineError(null);
    setIsRefining(true);
    setCurrentAttempt(1);

    const initialScores: Scores = state.analysis
      ? {
          overall: state.analysis.overall,
          ats: state.analysis.ats,
          matching: state.analysis.matching,
        }
      : { overall: 65, ats: 65, matching: 65 };

    const appliedSuggestionTexts = (state.analysis?.suggestions || [])
      .filter((s) => state.appliedSuggestionIds.includes(s.id))
      .map((s) => s.text);

    let prevSections: ResumeSection[] | null = null;
    let prevHeader: HeaderData = state.header;
    let prevScores: Scores = initialScores;
    const logs: RefinePassLog[] = [];

    try {
      for (let attempt = 1; attempt <= 3; attempt++) {
        if (refineAbortRef.current) break;
        setCurrentAttempt(attempt);

        const res: Response = await fetch('/api/refine', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            resumeText: state.resumeText,
            jobTitle: state.jobTitle,
            company: state.company,
            jobDescription: state.jobDescription,
            template: state.template,
            pageCount: state.pageCount,
            appliedKeywords: state.appliedKeywords,
            appliedSuggestions: appliedSuggestionTexts,
            attempt,
            previousSections: prevSections,
            previousScores: attempt > 1 ? prevScores : undefined,
          }),
        });

        const data = (await res.json()) as {
          error?: string;
          header: HeaderData;
          sections: ResumeSection[];
          newScores: Scores;
          improvementSummary: string;
        };
        if (!res.ok) {
          throw new Error(
            data.error || `Refinement failed on attempt ${attempt}.`
          );
        }

        const newScores: Scores = data.newScores;
        prevHeader = data.header;
        prevSections = data.sections;

        logs.push({
          attempt,
          before: prevScores,
          after: newScores,
          summary: data.improvementSummary,
        });

        prevScores = newScores;

        setState((prev) => ({
          ...prev,
          header: prevHeader,
          sections: prevSections || prev.sections,
          refinedScores: newScores,
          refineLogs: [...logs],
        }));

        if (newScores.overall >= 85) {
          break;
        }
      }
    } catch (err) {
      setRefineError(
        err instanceof Error ? err.message : 'Unable to refine resume.'
      );
    } finally {
      setIsRefining(false);
    }
  };

  const handleContinueFromTemplate = () => {
    if (!state.analysis && state.resumeText.trim().length < 30) {
      goToStep(1);
      return;
    }
    if (!state.analysis) {
      goToStep(1);
      return;
    }
    setState((prev) => ({
      ...prev,
      step: 4,
      maxReachedStep: prev.maxReachedStep < 4 ? 4 : prev.maxReachedStep,
    }));
    window.scrollTo({ top: 0, behavior: 'smooth' });
    void runRefineLoop();
  };

  const handleSaveSnapshot = () => {
    const score =
      state.refinedScores?.overall ?? state.analysis?.overall ?? 85;
    const record: SavedResumeRecord = {
      id: `snap-${Date.now()}`,
      savedAt: new Date().toISOString(),
      jobTitle: state.jobTitle || 'Untitled Role',
      company: state.company || '',
      score,
      template: state.template,
      pageCount: state.pageCount,
      header: state.header,
      sections: state.sections,
      resumeText: state.resumeText,
      jobDescription: state.jobDescription,
    };
    setSavedRecords((prev) => [record, ...prev]);
  };

  const handleLoadRecord = (record: SavedResumeRecord) => {
    setState((prev) => ({
      ...prev,
      step: 5,
      maxReachedStep: 5,
      jobTitle: record.jobTitle,
      company: record.company,
      template: record.template,
      pageCount: record.pageCount,
      header: record.header,
      sections: record.sections,
      resumeText: record.resumeText,
      jobDescription: record.jobDescription,
    }));
  };

  const handleDeleteRecord = (id: string) => {
    setSavedRecords((prev) => prev.filter((r) => r.id !== id));
  };

  // Ensure Step 3 template preview always displays parsed draft if sections aren't refined yet
  const previewDraft =
    state.sections.length > 0
      ? { header: state.header, sections: state.sections }
      : state.resumeText.trim()
      ? parseRawResumeToDraft(state.resumeText, state.jobTitle)
      : parseRawResumeToDraft(
          SAMPLE_RESUME_TEXT,
          state.jobTitle || 'Senior Product Manager'
        );

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900">
      <Header
        currentStep={state.step}
        maxReachedStep={state.maxReachedStep}
        savedCount={savedRecords.length}
        onNavigateStep={(s) => goToStep(s)}
        onOpenSaved={() => setIsSavedDrawerOpen(true)}
        onOpenHelp={() => setIsHelpOpen(true)}
      />

      <Stepper
        currentStep={state.step}
        maxReachedStep={state.maxReachedStep}
        onSelectStep={(s) => goToStep(s)}
      />

      <main className="pt-2">
        {state.step === 1 && (
          <Step1Upload
            resumeText={state.resumeText}
            fileName={state.fileName}
            jobTitle={state.jobTitle}
            company={state.company}
            jobDescription={state.jobDescription}
            analysis={state.analysis}
            isAnalyzing={isAnalyzing}
            analyzeError={analyzeError}
            onChangeResumeText={(text) =>
              setState((prev) => ({ ...prev, resumeText: text }))
            }
            onChangeFileName={(name) =>
              setState((prev) => ({ ...prev, fileName: name }))
            }
            onChangeJobTitle={(title) =>
              setState((prev) => ({ ...prev, jobTitle: title }))
            }
            onChangeCompany={(company) =>
              setState((prev) => ({ ...prev, company }))
            }
            onChangeJobDescription={(jd) =>
              setState((prev) => ({ ...prev, jobDescription: jd }))
            }
            onLoadSample={(sample) => {
              setAnalyzeError(null);
              setState((prev) => ({
                ...prev,
                resumeText: sample.resumeText,
                fileName: 'Sample_PM_Resume.txt',
                jobTitle: sample.jobTitle,
                company: sample.company,
                jobDescription: sample.jobDescription,
              }));
            }}
            onAnalyze={handleAnalyze}
          />
        )}

        {state.step === 2 && state.analysis && (
          <Step2Score
            analysis={state.analysis}
            jobTitle={state.jobTitle}
            company={state.company}
            appliedKeywords={state.appliedKeywords}
            appliedSuggestionIds={state.appliedSuggestionIds}
            onAddKeyword={handleAddKeyword}
            onApplySuggestion={handleApplySuggestion}
            onBack={() => goToStep(1)}
            onNext={() => goToStep(3)}
          />
        )}

        {state.step === 3 && (
          <Step3Template
            template={state.template}
            pageCount={state.pageCount}
            header={previewDraft.header}
            sections={previewDraft.sections}
            hasAnalyzed={Boolean(state.analysis)}
            onSelectTemplate={(template: TemplateId) =>
              setState((prev) => ({ ...prev, template }))
            }
            onSelectPageCount={(pageCount: PageCount) =>
              setState((prev) => ({ ...prev, pageCount }))
            }
            onBack={() => goToStep(state.analysis ? 2 : 1)}
            onContinueToRefine={handleContinueFromTemplate}
          />
        )}

        {state.step === 4 && (
          <Step4Refine
            initialScores={
              state.analysis
                ? {
                    overall: state.analysis.overall,
                    ats: state.analysis.ats,
                    matching: state.analysis.matching,
                  }
                : null
            }
            refinedScores={state.refinedScores}
            refineLogs={state.refineLogs}
            isRefining={isRefining}
            currentAttempt={currentAttempt}
            refineError={refineError}
            onStartRefine={runRefineLoop}
            onBack={() => goToStep(3)}
            onFinalize={() => goToStep(5)}
          />
        )}

        {state.step === 5 && (
          <Step5FinalEditor
            header={
              state.sections.length > 0 ? state.header : previewDraft.header
            }
            sections={
              state.sections.length > 0 ? state.sections : previewDraft.sections
            }
            template={state.template}
            pageCount={state.pageCount}
            jobTitle={state.jobTitle}
            company={state.company}
            jobDescription={state.jobDescription}
            onChangeHeader={(header) =>
              setState((prev) => ({ ...prev, header }))
            }
            onChangeSections={(sections) =>
              setState((prev) => ({ ...prev, sections }))
            }
            onChangeTemplate={(template) =>
              setState((prev) => ({ ...prev, template }))
            }
            onChangePageCount={(pageCount) =>
              setState((prev) => ({ ...prev, pageCount }))
            }
            onSaveSnapshot={handleSaveSnapshot}
          />
        )}
      </main>

      <SavedResumesDrawer
        isOpen={isSavedDrawerOpen}
        records={savedRecords}
        onClose={() => setIsSavedDrawerOpen(false)}
        onLoadRecord={handleLoadRecord}
        onDeleteRecord={handleDeleteRecord}
      />

      <HelpModal isOpen={isHelpOpen} onClose={() => setIsHelpOpen(false)} />
    </div>
  );
}
