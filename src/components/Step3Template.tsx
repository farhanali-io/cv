import { ArrowLeft, ArrowRight, Check, Sparkles, FileText } from 'lucide-react';
import type { HeaderData, PageCount, ResumeSection, TemplateId } from '../types';
import { ResumePreview } from './ResumePreview';

interface Step3TemplateProps {
  template: TemplateId;
  pageCount: PageCount;
  header: HeaderData;
  sections: ResumeSection[];
  hasAnalyzed: boolean;
  onSelectTemplate: (template: TemplateId) => void;
  onSelectPageCount: (pages: PageCount) => void;
  onBack: () => void;
  onContinueToRefine: () => void;
}

const TEMPLATES: Array<{
  id: TemplateId;
  name: string;
  description: string;
  details: string;
  recommended?: boolean;
}> = [
  {
    id: 'split-teal',
    name: 'Two-Column Teal',
    description:
      'Centered teal serif header with horizontal rule, main left column (Summary, Work Experience, Projects) and right sidebar (Skills, Education).',
    details: '67% / 33% Executive Split · Serif · Teal Accent',
    recommended: true,
  },
  {
    id: 'classic-ats',
    name: 'Classic ATS Single-Column',
    description:
      'Traditional single-column charcoal serif layout with centered icon contact bar and full-width dark section dividers.',
    details: '100% Single-Column · Ultra-Clean Parser Structure',
  },
];

export function Step3Template({
  template,
  pageCount,
  header,
  sections,
  hasAnalyzed,
  onSelectTemplate,
  onSelectPageCount,
  onBack,
  onContinueToRefine,
}: Step3TemplateProps) {
  return (
    <div className="mx-auto max-w-6xl px-4 pb-16 pt-4 sm:px-6">
      <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-[#7C3AED]">
            Saved Resume Templates
          </p>
          <h1 className="mt-1 font-display text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
            Choose your resume template
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Select between your two saved ATS layouts and target page length.
            Live preview updates instantly.
          </p>
        </div>

        {/* 1 Page / 2 Pages Segmented Toggle */}
        <div className="inline-flex items-center gap-1 self-start rounded-2xl border border-slate-200 bg-white p-1.5 shadow-xs">
          <button
            type="button"
            onClick={() => onSelectPageCount(1)}
            className={`inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs sm:text-sm font-semibold transition-all whitespace-nowrap ${
              pageCount === 1
                ? 'bg-[#7C3AED] text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileText className="h-3.5 w-3.5" />
            <span>1 Page</span>
          </button>
          <button
            type="button"
            onClick={() => onSelectPageCount(2)}
            className={`inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs sm:text-sm font-semibold transition-all whitespace-nowrap ${
              pageCount === 2
                ? 'bg-[#7C3AED] text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileText className="h-3.5 w-3.5" />
            <span>2 Pages</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 lg:items-start">
        {/* Left: 2 Saved Template Cards */}
        <div className="space-y-4 lg:col-span-5">
          {TEMPLATES.map((item) => {
            const isSelected = template === item.id;
            const isSplit = item.id === 'split-teal';
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onSelectTemplate(item.id)}
                className={`w-full rounded-3xl border p-5 text-left transition-all ${
                  isSelected
                    ? 'border-[#7C3AED] bg-white ring-4 ring-violet-500/15 shadow-[0_8px_30px_rgb(124,58,237,0.12)]'
                    : 'border-slate-200/80 bg-white hover:border-slate-300 shadow-xs'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3.5">
                    {/* Mini Structural Wireframe Preview */}
                    <div
                      className={`flex h-16 w-12 shrink-0 flex-col rounded-lg border bg-slate-50 p-1.5 ${
                        isSelected ? 'border-[#7C3AED]' : 'border-slate-200'
                      }`}
                    >
                      <div
                        className={`mx-auto h-1.5 w-8 rounded-full ${
                          isSplit ? 'bg-[#1F6E6E]' : 'bg-slate-800'
                        }`}
                      />
                      <div className="mx-auto mt-1 h-0.5 w-9 bg-slate-300" />
                      {isSplit ? (
                        <div className="mt-1.5 grid flex-1 grid-cols-3 gap-1 border-t border-slate-300 pt-1">
                          <div className="col-span-2 space-y-1">
                            <div className="h-1 w-full bg-[#1F6E6E]/60" />
                            <div className="h-1 w-4/5 bg-slate-300" />
                            <div className="h-1 w-full bg-slate-200" />
                          </div>
                          <div className="col-span-1 space-y-1 border-l border-slate-200 pl-1">
                            <div className="h-1 w-full bg-[#1F6E6E]/60" />
                            <div className="h-1 w-full bg-slate-300" />
                          </div>
                        </div>
                      ) : (
                        <div className="mt-1.5 flex-1 space-y-1.5 pt-0.5">
                          <div className="h-1 w-full border-b border-slate-700" />
                          <div className="h-1 w-5/6 bg-slate-300" />
                          <div className="h-1 w-full border-b border-slate-700" />
                          <div className="h-1 w-4/6 bg-slate-300" />
                        </div>
                      )}
                    </div>

                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-display text-base font-bold text-slate-900">
                          {item.name}
                        </h3>
                        {item.recommended && (
                          <span className="inline-flex items-center gap-1 rounded-lg border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
                            <Sparkles className="h-3 w-3" />
                            <span>AI Recommended</span>
                          </span>
                        )}
                      </div>
                      <p className="mt-1 text-xs leading-relaxed text-slate-600">
                        {item.description}
                      </p>
                      <p className="mt-2 text-[11px] font-medium text-slate-400">
                        {item.details}
                      </p>
                    </div>
                  </div>

                  <span
                    className={`mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border transition-colors ${
                      isSelected
                        ? 'border-[#7C3AED] bg-[#7C3AED] text-white'
                        : 'border-slate-300 bg-white'
                    }`}
                  >
                    {isSelected && <Check className="h-3.5 w-3.5 stroke-[2.5]" />}
                  </span>
                </div>
              </button>
            );
          })}

          <div className="flex items-center justify-between pt-3">
            <button
              type="button"
              onClick={onBack}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back</span>
            </button>

            <button
              type="button"
              onClick={onContinueToRefine}
              className="inline-flex items-center gap-2 rounded-2xl bg-[#7C3AED] px-6 py-3 font-display text-sm font-bold text-white shadow-lg shadow-violet-600/25 transition-all hover:bg-[#6D28D9]"
            >
              <span>
                {hasAnalyzed ? 'Continue to Refine' : 'Upload & Analyze First'}
              </span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Right: Live Preview */}
        <div className="lg:col-span-7">
          <div className="rounded-3xl border border-slate-200/80 bg-slate-100/70 p-4 sm:p-6">
            <div className="mb-3 flex items-center justify-between text-xs font-medium text-slate-500">
              <span>
                Live Preview — {TEMPLATES.find((t) => t.id === template)?.name} (
                {pageCount} {pageCount === 1 ? 'Page' : 'Pages'})
              </span>
              <span>A4 Format</span>
            </div>
            <ResumePreview
              header={header}
              sections={sections}
              template={template}
              pageCount={pageCount}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
