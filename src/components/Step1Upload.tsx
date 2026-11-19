import { useRef, useState } from 'react';
import {
  FileText,
  Briefcase,
  Upload,
  Trash2,
  Info,
  Rocket,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Sparkles,
  FileCheck2,
} from 'lucide-react';
import type { AnalysisResult } from '../types';
import {
  computeLocalKeywordScan,
  parseResumeFile,
  SAMPLE_COMPANY,
  SAMPLE_JOB_DESCRIPTION,
  SAMPLE_JOB_TITLE,
  SAMPLE_RESUME_TEXT,
} from '../utils/fileParser';
import { ScoreRing } from './ScoreRing';

interface Step1UploadProps {
  resumeText: string;
  fileName: string;
  jobTitle: string;
  company: string;
  jobDescription: string;
  analysis: AnalysisResult | null;
  isAnalyzing: boolean;
  analyzeError: string | null;
  onChangeResumeText: (text: string) => void;
  onChangeFileName: (name: string) => void;
  onChangeJobTitle: (title: string) => void;
  onChangeCompany: (company: string) => void;
  onChangeJobDescription: (jd: string) => void;
  onLoadSample: (sample: {
    resumeText: string;
    jobTitle: string;
    company: string;
    jobDescription: string;
  }) => void;
  onAnalyze: () => void;
}

export function Step1Upload({
  resumeText,
  fileName,
  jobTitle,
  company,
  jobDescription,
  analysis,
  isAnalyzing,
  analyzeError,
  onChangeResumeText,
  onChangeFileName,
  onChangeJobTitle,
  onChangeCompany,
  onChangeJobDescription,
  onLoadSample,
  onAnalyze,
}: Step1UploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isParsingFile, setIsParsingFile] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);

  const hasResume = resumeText.trim().length >= 30;
  const hasJobTitle = jobTitle.trim().length >= 2;
  const jdLen = jobDescription.trim().length;
  const hasJd = jdLen >= 50;
  const isReady = hasResume && hasJobTitle && hasJd;

  const missingItems: string[] = [];
  if (!hasResume) missingItems.push('resume text (min 30 chars)');
  if (!hasJobTitle) missingItems.push('job title');
  if (!hasJd) missingItems.push(`job description (${50 - jdLen} more chars)`);

  const localScan = computeLocalKeywordScan(resumeText, jobDescription);

  const handleFiles = async (file: File | undefined) => {
    if (!file) return;
    setFileError(null);
    setIsParsingFile(true);
    try {
      const text = await parseResumeFile(file);
      onChangeResumeText(text);
      onChangeFileName(file.name);
    } catch (err) {
      setFileError(
        err instanceof Error ? err.message : 'Unable to parse the selected file.'
      );
    } finally {
      setIsParsingFile(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <div className="mx-auto max-w-6xl px-4 pb-16 pt-4 sm:px-6">
      {/* Hero Header */}
      <div className="mx-auto mb-8 max-w-2xl text-center">
        <h1 className="font-display text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl [text-wrap:balance]">
          Make your resume ATS-proof
        </h1>
        <p className="mt-2.5 text-sm sm:text-base text-slate-600 leading-relaxed">
          Upload your resume and a target job description. Get an ATS score,
          keyword gaps, and tailored refinements in seconds.
        </p>
      </div>

      {/* Two-Column Upload & Job Description Cards */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 lg:items-stretch">
        {/* Left Card: Your Resume */}
        <section className="flex flex-col rounded-3xl border border-slate-100 bg-white p-6 shadow-[0_8px_30px_rgb(15,23,42,0.05)] sm:p-7">
          <div className="mb-5 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-violet-100 text-[#7C3AED]">
                <FileText className="h-5 w-5" />
              </span>
              <h2 className="font-display text-xl font-bold text-slate-900">
                Your Resume
              </h2>
            </div>

            <button
              type="button"
              onClick={() =>
                onLoadSample({
                  resumeText: SAMPLE_RESUME_TEXT,
                  jobTitle: SAMPLE_JOB_TITLE,
                  company: SAMPLE_COMPANY,
                  jobDescription: SAMPLE_JOB_DESCRIPTION,
                })
              }
              className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-xl border border-violet-200 bg-violet-50/70 px-3 py-1.5 text-xs font-semibold text-[#7C3AED] transition-colors hover:bg-violet-100"
            >
              <Sparkles className="h-3.5 w-3.5" />
              <span>Load Sample</span>
            </button>
          </div>

          {/* Drag & Drop Zone */}
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setIsDragging(false);
              handleFiles(e.dataTransfer.files?.[0]);
            }}
            className={`rounded-2xl border-2 border-dashed p-5 text-center transition-colors ${
              isDragging
                ? 'border-[#7C3AED] bg-violet-50/70'
                : 'border-violet-300/80 bg-violet-50/20 hover:border-violet-400'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.docx,.txt,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain"
              className="hidden"
              onChange={(e) => handleFiles(e.target.files?.[0])}
            />

            <div className="mx-auto mb-2.5 flex h-11 w-11 items-center justify-center rounded-full bg-violet-100 text-[#7C3AED]">
              {isParsingFile ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Upload className="h-5 w-5" />
              )}
            </div>

            <p className="text-sm font-semibold text-slate-900">
              {isParsingFile
                ? 'Extracting text from your document...'
                : 'Drag & drop your resume here'}
            </p>
            <p className="mt-0.5 text-xs text-slate-500">
              Supports PDF, DOCX, TXT — max 5MB
            </p>

            <button
              type="button"
              disabled={isParsingFile}
              onClick={() => fileInputRef.current?.click()}
              className="mt-4 w-full rounded-xl border border-slate-200 bg-white py-2.5 px-4 text-sm font-semibold text-slate-800 shadow-xs transition-colors hover:bg-slate-50 disabled:opacity-60"
            >
              Browse files
            </button>
          </div>

          {fileName && !fileError && (
            <div className="mt-3 flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50/70 px-3.5 py-2 text-xs text-emerald-800">
              <div className="flex items-center gap-2 truncate">
                <FileCheck2 className="h-4 w-4 shrink-0 text-emerald-600" />
                <span className="truncate font-medium">
                  Parsed: {fileName}
                </span>
              </div>
              <span className="font-mono text-[11px] tabular-nums text-emerald-700">
                {resumeText.length} chars
              </span>
            </div>
          )}

          {fileError && (
            <div className="mt-3 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-xs text-red-700">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{fileError}</span>
            </div>
          )}

          {/* Paste Resume Textarea */}
          <div className="mt-4 flex flex-1 flex-col">
            <div className="mb-1.5 flex items-center justify-between">
              <label
                htmlFor="resume-paste"
                className="text-xs font-semibold text-slate-700"
              >
                Or paste your resume text
              </label>
              <div className="flex items-center gap-3">
                <span className="font-mono text-xs text-slate-500 tabular-nums">
                  {resumeText.length.toLocaleString()} chars
                </span>
                {resumeText.length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      onChangeResumeText('');
                      onChangeFileName('');
                      setFileError(null);
                    }}
                    className="inline-flex items-center gap-1 text-xs font-medium text-slate-500 transition-colors hover:text-red-600"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    <span>Clear</span>
                  </button>
                )}
              </div>
            </div>

            <textarea
              id="resume-paste"
              value={resumeText}
              onChange={(e) => onChangeResumeText(e.target.value)}
              placeholder="Paste your full resume content here (contact info, summary, experience, skills, education)..."
              rows={6}
              className="w-full flex-1 resize-y rounded-2xl border border-slate-200 bg-slate-50/70 p-3.5 text-sm text-slate-800 placeholder:text-slate-400 focus:border-[#7C3AED] focus:bg-white focus:outline-none focus:ring-3 focus:ring-violet-500/15"
            />
          </div>

          <p className="mt-3 flex items-center gap-1.5 text-xs text-slate-500">
            <Info className="h-3.5 w-3.5 shrink-0 text-slate-400" />
            <span>
              Files are parsed locally in your browser and autosaved to your
              device.
            </span>
          </p>
        </section>

        {/* Right Card: Targeted Job */}
        <section className="flex flex-col rounded-3xl border border-slate-100 bg-white p-6 shadow-[0_8px_30px_rgb(15,23,42,0.05)] sm:p-7">
          <div className="mb-5 flex items-center gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-100 text-[#10B981]">
              <Briefcase className="h-5 w-5" />
            </span>
            <h2 className="font-display text-xl font-bold text-slate-900">
              Targeted Job
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label
                htmlFor="job-title"
                className="mb-1.5 block text-xs font-semibold text-slate-700"
              >
                Job Title <span className="text-red-500">*</span>
              </label>
              <input
                id="job-title"
                type="text"
                value={jobTitle}
                onChange={(e) => onChangeJobTitle(e.target.value)}
                placeholder="e.g. Product Manager"
                className="w-full rounded-xl border border-slate-200 bg-slate-50/70 px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#7C3AED] focus:bg-white focus:outline-none focus:ring-3 focus:ring-violet-500/15"
              />
            </div>

            <div>
              <label
                htmlFor="company-name"
                className="mb-1.5 block text-xs font-semibold text-slate-700"
              >
                Company <span className="text-slate-400 font-normal">(optional)</span>
              </label>
              <input
                id="company-name"
                type="text"
                value={company}
                onChange={(e) => onChangeCompany(e.target.value)}
                placeholder="e.g. Stripe"
                className="w-full rounded-xl border border-slate-200 bg-slate-50/70 px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#7C3AED] focus:bg-white focus:outline-none focus:ring-3 focus:ring-violet-500/15"
              />
            </div>
          </div>

          <div className="mt-4 flex flex-1 flex-col">
            <div className="mb-1.5 flex items-center justify-between">
              <label
                htmlFor="job-description"
                className="text-xs font-semibold text-slate-700"
              >
                Job Description <span className="text-red-500">*</span>
              </label>
              <span
                className={`font-mono text-xs tabular-nums ${
                  hasJd ? 'text-emerald-600 font-medium' : 'text-slate-500'
                }`}
              >
                {jdLen} / 50 min chars
              </span>
            </div>

            <textarea
              id="job-description"
              value={jobDescription}
              onChange={(e) => onChangeJobDescription(e.target.value)}
              placeholder="Paste the job description here to match against your resume. Include responsibilities, required skills, tools, and qualifications..."
              rows={9}
              className="w-full flex-1 resize-y rounded-2xl border border-slate-200 bg-slate-50/70 p-3.5 text-sm text-slate-800 placeholder:text-slate-400 focus:border-[#7C3AED] focus:bg-white focus:outline-none focus:ring-3 focus:ring-violet-500/15"
            />
          </div>

          {/* Validation Status Bar */}
          <div className="mt-4">
            {isReady ? (
              <div className="flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800">
                <CheckCircle2 className="h-4.5 w-4.5 shrink-0 text-[#10B981]" />
                <span>Ready to analyze — all required inputs provided.</span>
              </div>
            ) : (
              <div className="flex items-start gap-2 rounded-2xl border border-amber-200 bg-amber-50/80 px-4 py-3 text-xs sm:text-sm text-amber-800">
                <AlertCircle className="mt-0.5 h-4.5 w-4.5 shrink-0 text-amber-600" />
                <span>
                  <strong className="font-semibold">Almost ready:</strong> Add{' '}
                  {missingItems.join(', ')}.
                </span>
              </div>
            )}
          </div>
        </section>
      </div>

      {/* Bottom Live Score Preview Card + Primary Analyze CTA */}
      <div className="mt-6">
        <div className="rounded-3xl border border-slate-100 bg-white p-6 pb-10 shadow-[0_8px_30px_rgb(15,23,42,0.05)] sm:p-8 sm:pb-12">
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 lg:items-center">
            {/* Left: Score Rings */}
            <div className="lg:col-span-7">
              <h3 className="font-display text-lg font-bold text-slate-900">
                {analysis ? 'Latest AI Score Snapshot' : 'Live Keyword Scan Preview'}
              </h3>
              <p className="mt-0.5 text-xs sm:text-sm text-slate-500">
                {analysis
                  ? 'Scores from your most recent AI evaluation. Re-analyze after editing.'
                  : 'Real-time local keyword check. Click Analyze Resume for full Gemini AI scoring.'}
              </p>

              <div className="mt-6 flex flex-wrap items-center justify-around gap-6 sm:justify-start sm:gap-10">
                {analysis ? (
                  <>
                    <ScoreRing
                      score={analysis.overall}
                      label="Overall"
                      size={108}
                      forceColor="violet"
                    />
                    <ScoreRing
                      score={analysis.ats}
                      label="ATS"
                      size={108}
                      forceColor="blue"
                    />
                    <ScoreRing
                      score={analysis.matching}
                      label="Job Matching"
                      size={108}
                      forceColor="emerald"
                    />
                  </>
                ) : (
                  <>
                    <ScoreRing
                      score={isReady ? localScan.overlapPercent : 0}
                      label="Keyword Overlap"
                      size={108}
                      forceColor="violet"
                    />
                    <ScoreRing
                      score={hasResume ? Math.min(100, Math.round((resumeText.length / 1800) * 100)) : 0}
                      label="Content Depth"
                      size={108}
                      forceColor="blue"
                    />
                    <ScoreRing
                      score={hasJd ? Math.min(100, Math.round((jdLen / 600) * 100)) : 0}
                      label="JD Detail"
                      size={108}
                      forceColor="emerald"
                    />
                  </>
                )}
              </div>
            </div>

            {/* Right: Missing Keywords Preview */}
            <div className="lg:col-span-5 lg:border-l lg:border-slate-100 lg:pl-8">
              <h4 className="font-display text-base font-bold text-slate-900">
                Missing Keywords
              </h4>
              <p className="mt-0.5 text-xs sm:text-sm text-slate-500">
                {analysis
                  ? 'Top terms detected by AI missing from your resume:'
                  : 'High-frequency terms in the job description not yet found in your resume:'}
              </p>

              <div className="mt-4 flex flex-wrap gap-2">
                {(analysis
                  ? analysis.missingKeywords.slice(0, 8)
                  : localScan.missingPreview
                ).length > 0 ? (
                  (analysis
                    ? analysis.missingKeywords.slice(0, 8)
                    : localScan.missingPreview
                  ).map((kw, idx) => (
                    <span
                      key={`${kw}-${idx}`}
                      className={`rounded-lg border px-2.5 py-1 text-xs font-medium ${
                        idx % 3 === 0
                          ? 'border-emerald-300 bg-emerald-50/60 text-emerald-800'
                          : idx % 3 === 1
                          ? 'border-slate-200 bg-slate-50 text-slate-700'
                          : 'border-violet-300 bg-violet-50/60 text-[#7C3AED]'
                      }`}
                    >
                      {kw}
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-slate-400">
                    {isReady
                      ? 'Strong keyword coverage detected locally. Run full AI analysis for deeper evaluation.'
                      : 'Paste both your resume and a job description to preview missing keywords.'}
                  </span>
                )}
              </div>
            </div>
          </div>

          {analyzeError && (
            <div className="mt-6 flex items-start gap-2.5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              <AlertCircle className="mt-0.5 h-4.5 w-4.5 shrink-0" />
              <span>{analyzeError}</span>
            </div>
          )}
        </div>

        {/* Overlapping Centered Primary CTA */}
        <div className="-mt-7 flex flex-col items-center px-4">
          <button
            type="button"
            disabled={!isReady || isAnalyzing}
            onClick={onAnalyze}
            className="inline-flex w-full max-w-md items-center justify-center gap-2.5 rounded-2xl bg-[#7C3AED] px-8 py-4 font-display text-base font-bold text-white shadow-xl shadow-violet-600/30 transition-all hover:bg-[#6D28D9] hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:shadow-none disabled:translate-y-0 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-violet-400/50"
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                <span>Analyzing Resume...</span>
              </>
            ) : (
              <>
                <Rocket className="h-5 w-5" />
                <span>Analyze Resume</span>
              </>
            )}
          </button>

          <p className="mt-3 text-center text-xs text-slate-500">
            Tip: Keep your resume to 1-2 pages and use standard section headings
            for best ATS results.
          </p>
        </div>
      </div>
    </div>
  );
}
