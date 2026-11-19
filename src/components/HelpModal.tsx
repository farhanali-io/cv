import { X, ShieldCheck, CheckCircle2, FileText, Sparkles } from 'lucide-react';

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function HelpModal({ isOpen, onClose }: HelpModalProps) {
  if (!isOpen) return null;

  return (
    <div className="no-print fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-xs">
      <div className="w-full max-w-lg rounded-3xl bg-white p-6 sm:p-7 shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-100 text-[#7C3AED]">
              <ShieldCheck className="h-5 w-5" />
            </span>
            <h2 className="font-display text-lg font-bold text-slate-900">
              How ResumeAI Works
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close help modal"
            className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-5 space-y-4 text-sm text-slate-600">
          <div className="flex items-start gap-3">
            <FileText className="mt-0.5 h-4.5 w-4.5 shrink-0 text-[#7C3AED]" />
            <div>
              <p className="font-semibold text-slate-900">
                1. Upload &amp; Target
              </p>
              <p className="text-xs leading-relaxed text-slate-500">
                Upload a PDF, DOCX, or TXT file (parsed locally in your browser)
                or paste your resume alongside the job description.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <CheckCircle2 className="mt-0.5 h-4.5 w-4.5 shrink-0 text-[#10B981]" />
            <div>
              <p className="font-semibold text-slate-900">
                2. Honest ATS Diagnostics
              </p>
              <p className="text-xs leading-relaxed text-slate-500">
                Gemini evaluates Overall, ATS, and Job Matching scores, surfaces
                missing keywords, and splits recommendations into ATS and Job
                Matching actions.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Sparkles className="mt-0.5 h-4.5 w-4.5 shrink-0 text-[#7C3AED]" />
            <div>
              <p className="font-semibold text-slate-900">
                3. Auto-Refine Loop &amp; Final Editor
              </p>
              <p className="text-xs leading-relaxed text-slate-500">
                Pick an ATS-friendly template, let AI refine up to 3 passes until
                scoring 85+, edit any section inline with AI Rewrite, and export to
                PDF, DOCX, or TXT.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl bg-[#7C3AED] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#6D28D9]"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
}
