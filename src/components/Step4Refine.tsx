import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Loader2,
  RefreshCw,
  TrendingUp,
  AlertCircle,
  Sparkles,
} from 'lucide-react';
import type { RefinePassLog, Scores } from '../types';
import { ScoreRing } from './ScoreRing';

interface Step4RefineProps {
  initialScores: Scores | null;
  refinedScores: Scores | null;
  refineLogs: RefinePassLog[];
  isRefining: boolean;
  currentAttempt: number;
  refineError: string | null;
  onStartRefine: () => void;
  onBack: () => void;
  onFinalize: () => void;
}

export function Step4Refine({
  initialScores,
  refinedScores,
  refineLogs,
  isRefining,
  currentAttempt,
  refineError,
  onStartRefine,
  onBack,
  onFinalize,
}: Step4RefineProps) {
  const before = initialScores ?? { overall: 0, ats: 0, matching: 0 };
  const after = refinedScores ?? before;
  const reachedTarget = after.overall >= 85;
  const completedAllPasses = refineLogs.length >= 3;

  const deltaOverall = after.overall - before.overall;
  const deltaAts = after.ats - before.ats;
  const deltaMatching = after.matching - before.matching;

  const renderDelta = (delta: number) => {
    if (delta === 0) return null;
    const positive = delta > 0;
    return (
      <span
        className={`mt-1 inline-flex items-center gap-0.5 rounded-lg px-2 py-0.5 font-mono text-xs font-semibold tabular-nums ${
          positive
            ? 'bg-emerald-50 text-emerald-700'
            : 'bg-amber-50 text-amber-700'
        }`}
      >
        <TrendingUp className="h-3 w-3" />
        <span>
          {positive ? '+' : ''}
          {delta}
        </span>
      </span>
    );
  };

  return (
    <div className="mx-auto max-w-5xl px-4 pb-16 pt-4 sm:px-6">
      <div className="mb-8 text-center">
        <p className="text-xs font-semibold uppercase tracking-wider text-[#7C3AED]">
          Iterative AI Optimization
        </p>
        <h1 className="mt-1 font-display text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
          Automated Resume Refinement Loop
        </h1>
        <p className="mx-auto mt-1.5 max-w-xl text-sm text-slate-600">
          ResumeAI rebuilds your real experience in your chosen template and
          automatically refines up to 3 passes until your score reaches 85+.
        </p>
      </div>

      {/* Live Status Banner */}
      <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-[0_8px_30px_rgb(15,23,42,0.05)] sm:p-8">
        {isRefining ? (
          <div className="flex flex-col items-center py-6 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-violet-100 text-[#7C3AED]">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
            <h2 className="mt-4 font-display text-xl font-bold text-slate-900">
              AI Refining... Attempt {currentAttempt}/3
            </h2>
            <p className="mt-1.5 max-w-md text-sm text-slate-500">
              Structuring sections, integrating verified keywords, and
              strengthening impact statements without inventing experience.
            </p>

            {/* Attempt Progress Dots */}
            <div className="mt-6 flex items-center gap-3">
              {[1, 2, 3].map((stepNum) => {
                const done = refineLogs.some((l) => l.attempt === stepNum);
                const active = currentAttempt === stepNum;
                return (
                  <div
                    key={stepNum}
                    className={`flex items-center gap-2 rounded-xl border px-3.5 py-2 text-xs font-semibold transition-all ${
                      done
                        ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                        : active
                        ? 'border-violet-300 bg-violet-50 text-[#7C3AED]'
                        : 'border-slate-200 bg-slate-50 text-slate-400'
                    }`}
                  >
                    <span>Attempt {stepNum}/3</span>
                  </div>
                );
              })}
            </div>
          </div>
        ) : refineError ? (
          <div className="flex flex-col items-center py-6 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-red-100 text-red-600">
              <AlertCircle className="h-7 w-7" />
            </div>
            <h2 className="mt-4 font-display text-lg font-bold text-slate-900">
              Refinement Encountered an Issue
            </h2>
            <p className="mt-1 max-w-md text-sm text-red-600">{refineError}</p>
            <button
              type="button"
              onClick={onStartRefine}
              className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[#7C3AED] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#6D28D9]"
            >
              <RefreshCw className="h-4 w-4" />
              <span>Retry Refinement</span>
            </button>
          </div>
        ) : (
          <div>
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-5">
              <div className="flex items-center gap-3">
                <span
                  className={`flex h-11 w-11 items-center justify-center rounded-2xl ${
                    reachedTarget
                      ? 'bg-emerald-100 text-emerald-600'
                      : 'bg-violet-100 text-[#7C3AED]'
                  }`}
                >
                  {reachedTarget ? (
                    <CheckCircle2 className="h-6 w-6" />
                  ) : (
                    <Sparkles className="h-6 w-6" />
                  )}
                </span>
                <div>
                  <h2 className="font-display text-lg font-bold text-slate-900">
                    {reachedTarget
                      ? 'Target Score Reached (85+)'
                      : completedAllPasses
                      ? 'Completed 3 Refinement Passes'
                      : 'Refinement Ready'}
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-500">
                    {refineLogs.length > 0
                      ? `Completed ${refineLogs.length} pass${
                          refineLogs.length > 1 ? 'es' : ''
                        }. Before vs. After comparison below.`
                      : 'Run AI refinement to rebuild your resume in the selected template.'}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={onStartRefine}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs sm:text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50"
              >
                <RefreshCw className="h-4 w-4" />
                <span>Re-run Refine Loop</span>
              </button>
            </div>

            {/* Before vs After Comparison */}
            <div className="mt-7 grid grid-cols-1 gap-8 md:grid-cols-2">
              {/* Before */}
              <div className="rounded-2xl border border-slate-200/80 bg-slate-50/70 p-5">
                <p className="mb-4 text-center text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Before Refinement
                </p>
                <div className="flex items-center justify-around gap-3">
                  <ScoreRing
                    score={before.overall}
                    label="Overall"
                    size={96}
                    strokeWidth={8}
                  />
                  <ScoreRing
                    score={before.ats}
                    label="ATS"
                    size={96}
                    strokeWidth={8}
                  />
                  <ScoreRing
                    score={before.matching}
                    label="Matching"
                    size={96}
                    strokeWidth={8}
                  />
                </div>
              </div>

              {/* After */}
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50/30 p-5">
                <p className="mb-4 text-center text-xs font-semibold uppercase tracking-wider text-emerald-700">
                  After AI Refinement
                </p>
                <div className="flex items-center justify-around gap-3">
                  <div className="flex flex-col items-center">
                    <ScoreRing
                      score={after.overall}
                      label="Overall"
                      size={96}
                      strokeWidth={8}
                    />
                    {renderDelta(deltaOverall)}
                  </div>
                  <div className="flex flex-col items-center">
                    <ScoreRing
                      score={after.ats}
                      label="ATS"
                      size={96}
                      strokeWidth={8}
                    />
                    {renderDelta(deltaAts)}
                  </div>
                  <div className="flex flex-col items-center">
                    <ScoreRing
                      score={after.matching}
                      label="Matching"
                      size={96}
                      strokeWidth={8}
                    />
                    {renderDelta(deltaMatching)}
                  </div>
                </div>
              </div>
            </div>

            {/* Pass Logs */}
            {refineLogs.length > 0 && (
              <div className="mt-7 space-y-2.5">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Refinement Pass History
                </h3>
                {refineLogs.map((log) => (
                  <div
                    key={log.attempt}
                    className="flex flex-col gap-1.5 rounded-2xl border border-slate-200/80 bg-slate-50/50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <span className="rounded-lg bg-violet-100 px-2.5 py-1 font-mono text-xs font-semibold text-[#7C3AED] tabular-nums">
                        Pass {log.attempt}/3
                      </span>
                      <p className="text-sm text-slate-700">{log.summary}</p>
                    </div>
                    <span className="font-mono text-xs font-semibold text-slate-600 tabular-nums whitespace-nowrap">
                      {log.before.overall} &rarr; {log.after.overall} / 100
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer Actions */}
      <div className="mt-8 flex flex-wrap items-center justify-between gap-4">
        <button
          type="button"
          onClick={onBack}
          disabled={isRefining}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-50"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Templates</span>
        </button>

        {!isRefining && (
          <button
            type="button"
            onClick={onFinalize}
            className={`inline-flex items-center gap-2.5 rounded-2xl px-7 py-3.5 font-display text-sm sm:text-base font-bold text-white shadow-lg transition-all ${
              reachedTarget
                ? 'bg-[#10B981] shadow-emerald-600/25 hover:bg-emerald-600'
                : 'bg-[#7C3AED] shadow-violet-600/25 hover:bg-[#6D28D9]'
            }`}
          >
            <CheckCircle2 className="h-5 w-5" />
            <span>
              {reachedTarget ? 'Ready to Finalize' : 'Open Final Editor'}
            </span>
            <ArrowRight className="h-4.5 w-4.5" />
          </button>
        )}
      </div>
    </div>
  );
}
