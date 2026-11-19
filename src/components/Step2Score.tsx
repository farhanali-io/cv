import {
  ArrowLeft,
  ArrowRight,
  Check,
  Plus,
  ShieldCheck,
  Target,
  Sparkles,
  FileSearch,
} from 'lucide-react';
import type { AnalysisResult } from '../types';
import { ScoreRing } from './ScoreRing';

interface Step2ScoreProps {
  analysis: AnalysisResult;
  jobTitle: string;
  company: string;
  appliedKeywords: string[];
  appliedSuggestionIds: string[];
  onAddKeyword: (keyword: string) => void;
  onApplySuggestion: (suggestionId: string) => void;
  onBack: () => void;
  onNext: () => void;
}

export function Step2Score({
  analysis,
  jobTitle,
  company,
  appliedKeywords,
  appliedSuggestionIds,
  onAddKeyword,
  onApplySuggestion,
  onBack,
  onNext,
}: Step2ScoreProps) {
  const atsSuggestions = analysis.suggestions.filter((s) => s.type === 'ATS');
  const matchingSuggestions = analysis.suggestions.filter(
    (s) => s.type !== 'ATS'
  );

  return (
    <div className="mx-auto max-w-6xl px-4 pb-16 pt-4 sm:px-6">
      <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-[#7C3AED]">
            Diagnostic Report
          </p>
          <h1 className="mt-1 font-display text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
            ATS &amp; Job Match Breakdown
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Evaluated for{' '}
            <span className="font-semibold text-slate-900">{jobTitle}</span>
            {company ? ` at ${company}` : ''}.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Edit Inputs</span>
          </button>
          <button
            type="button"
            onClick={onNext}
            className="inline-flex items-center gap-2 rounded-xl bg-[#7C3AED] px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-violet-600/25 transition-all hover:bg-[#6D28D9]"
          >
            <span>Choose Template</span>
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* 3 Circular Score Rings */}
      <section className="rounded-3xl border border-slate-100 bg-white p-6 shadow-[0_8px_30px_rgb(15,23,42,0.05)] sm:p-8">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-3">
          <div className="flex flex-col items-center border-b border-slate-100 pb-6 sm:border-b-0 sm:border-r sm:pb-0">
            <ScoreRing
              score={analysis.overall}
              label="Overall Score"
              size={134}
              strokeWidth={10}
              forceColor="semantic"
            />
            <p className="mt-2 max-w-[220px] text-center text-xs text-slate-500">
              Combined readiness across parsing, structure, and role alignment.
            </p>
          </div>

          <div className="flex flex-col items-center border-b border-slate-100 pb-6 sm:border-b-0 sm:border-r sm:pb-0">
            <ScoreRing
              score={analysis.ats}
              label="ATS Score"
              size={134}
              strokeWidth={10}
              forceColor="semantic"
            />
            <p className="mt-2 max-w-[220px] text-center text-xs text-slate-500">
              Section headings, readability, measurable impact, and clean text.
            </p>
          </div>

          <div className="flex flex-col items-center">
            <ScoreRing
              score={analysis.matching}
              label="Job Matching Score"
              size={134}
              strokeWidth={10}
              forceColor="semantic"
            />
            <p className="mt-2 max-w-[220px] text-center text-xs text-slate-500">
              Overlap with target responsibilities, tools, and domain skills.
            </p>
          </div>
        </div>
      </section>

      {/* Missing Keywords */}
      <section className="mt-6 rounded-3xl border border-slate-100 bg-white p-6 shadow-[0_8px_30px_rgb(15,23,42,0.05)] sm:p-8">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-100 text-[#7C3AED]">
              <FileSearch className="h-4.5 w-4.5" />
            </span>
            <div>
              <h2 className="font-display text-lg font-bold text-slate-900">
                Missing Keywords
              </h2>
              <p className="text-xs sm:text-sm text-slate-500">
                Present in the job description but missing from your resume.
                Click + Add for skills you genuinely possess.
              </p>
            </div>
          </div>
          <span className="font-mono text-xs font-semibold text-slate-500 tabular-nums">
            {appliedKeywords.length} / {analysis.missingKeywords.length} queued
          </span>
        </div>

        {analysis.missingKeywords.length === 0 ? (
          <p className="mt-4 text-sm text-emerald-700 font-medium">
            Great coverage — no major keyword gaps detected.
          </p>
        ) : (
          <div className="mt-5 flex flex-wrap gap-2.5">
            {analysis.missingKeywords.map((kw) => {
              const isAdded = appliedKeywords.includes(kw);
              return (
                <button
                  key={kw}
                  type="button"
                  onClick={() => onAddKeyword(kw)}
                  className={`inline-flex items-center gap-2 rounded-xl border px-3.5 py-2 text-sm font-medium transition-all ${
                    isAdded
                      ? 'border-emerald-300 bg-emerald-50 text-emerald-800'
                      : 'border-slate-200 bg-slate-50/80 text-slate-800 hover:border-violet-300 hover:bg-violet-50/70'
                  }`}
                >
                  <span>{kw}</span>
                  <span
                    className={`inline-flex items-center gap-1 rounded-lg px-2 py-0.5 text-xs font-semibold ${
                      isAdded
                        ? 'bg-emerald-600 text-white'
                        : 'bg-[#7C3AED]/10 text-[#7C3AED]'
                    }`}
                  >
                    {isAdded ? (
                      <>
                        <Check className="h-3 w-3" />
                        <span>Added</span>
                      </>
                    ) : (
                      <>
                        <Plus className="h-3 w-3" />
                        <span>Add</span>
                      </>
                    )}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </section>

      {/* AI Suggestions in 2 Groups */}
      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Group 1: ATS Suggestions */}
        <section className="rounded-3xl border border-slate-100 bg-white p-6 shadow-[0_8px_30px_rgb(15,23,42,0.05)] sm:p-7">
          <div className="mb-4 flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-violet-100 text-[#7C3AED]">
              <ShieldCheck className="h-5 w-5" />
            </span>
            <div>
              <h2 className="font-display text-lg font-bold text-slate-900">
                ATS Suggestions
              </h2>
              <p className="text-xs text-slate-500">
                Formatting, standard sections, and parser clarity
              </p>
            </div>
          </div>

          <div className="space-y-3">
            {atsSuggestions.length === 0 ? (
              <p className="text-sm text-slate-500">
                No formatting issues detected.
              </p>
            ) : (
              atsSuggestions.map((sug) => {
                const isApplied = appliedSuggestionIds.includes(sug.id);
                return (
                  <div
                    key={sug.id}
                    className={`flex items-start justify-between gap-4 rounded-2xl border p-4 transition-colors ${
                      isApplied
                        ? 'border-emerald-200 bg-emerald-50/50'
                        : 'border-slate-200/80 bg-slate-50/50'
                    }`}
                  >
                    <p className="text-sm leading-relaxed text-slate-700">
                      {sug.text}
                    </p>
                    <button
                      type="button"
                      onClick={() => onApplySuggestion(sug.id)}
                      className={`inline-flex shrink-0 items-center gap-1.5 rounded-xl px-3.5 py-1.5 text-xs font-semibold transition-all whitespace-nowrap ${
                        isApplied
                          ? 'bg-emerald-600 text-white'
                          : 'border border-violet-200 bg-white text-[#7C3AED] hover:bg-violet-50'
                      }`}
                    >
                      {isApplied ? (
                        <>
                          <Check className="h-3.5 w-3.5" />
                          <span>Applied</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="h-3.5 w-3.5" />
                          <span>Apply</span>
                        </>
                      )}
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </section>

        {/* Group 2: Job Matching Suggestions */}
        <section className="rounded-3xl border border-slate-100 bg-white p-6 shadow-[0_8px_30px_rgb(15,23,42,0.05)] sm:p-7">
          <div className="mb-4 flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-100 text-[#10B981]">
              <Target className="h-5 w-5" />
            </span>
            <div>
              <h2 className="font-display text-lg font-bold text-slate-900">
                Job Matching Suggestions
              </h2>
              <p className="text-xs text-slate-500">
                Targeted skills, quantified outcomes, and role alignment
              </p>
            </div>
          </div>

          <div className="space-y-3">
            {matchingSuggestions.length === 0 ? (
              <p className="text-sm text-slate-500">
                Your experience aligns closely with the role.
              </p>
            ) : (
              matchingSuggestions.map((sug) => {
                const isApplied = appliedSuggestionIds.includes(sug.id);
                return (
                  <div
                    key={sug.id}
                    className={`flex items-start justify-between gap-4 rounded-2xl border p-4 transition-colors ${
                      isApplied
                        ? 'border-emerald-200 bg-emerald-50/50'
                        : 'border-slate-200/80 bg-slate-50/50'
                    }`}
                  >
                    <p className="text-sm leading-relaxed text-slate-700">
                      {sug.text}
                    </p>
                    <button
                      type="button"
                      onClick={() => onApplySuggestion(sug.id)}
                      className={`inline-flex shrink-0 items-center gap-1.5 rounded-xl px-3.5 py-1.5 text-xs font-semibold transition-all whitespace-nowrap ${
                        isApplied
                          ? 'bg-emerald-600 text-white'
                          : 'border border-emerald-200 bg-white text-emerald-700 hover:bg-emerald-50'
                      }`}
                    >
                      {isApplied ? (
                        <>
                          <Check className="h-3.5 w-3.5" />
                          <span>Applied</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="h-3.5 w-3.5" />
                          <span>Apply</span>
                        </>
                      )}
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </section>
      </div>

      {/* Bottom Action Bar */}
      <div className="mt-8 flex justify-end">
        <button
          type="button"
          onClick={onNext}
          className="inline-flex items-center gap-2.5 rounded-2xl bg-[#7C3AED] px-7 py-3.5 font-display text-sm sm:text-base font-bold text-white shadow-lg shadow-violet-600/25 transition-all hover:bg-[#6D28D9]"
        >
          <span>Select Resume Template</span>
          <ArrowRight className="h-4.5 w-4.5" />
        </button>
      </div>
    </div>
  );
}
