import { Sparkles, BookmarkCheck, ChevronDown } from 'lucide-react';
import type { StepId } from '../types';

interface HeaderProps {
  currentStep: StepId;
  maxReachedStep: StepId;
  savedCount: number;
  onNavigateStep: (step: StepId) => void;
  onOpenSaved: () => void;
  onOpenHelp: () => void;
}

export function Header({
  currentStep,
  maxReachedStep,
  savedCount,
  onNavigateStep,
  onOpenSaved,
  onOpenHelp,
}: HeaderProps) {
  const navItems: Array<{
    label: string;
    active: boolean;
    onClick: () => void;
  }> = [
    {
      label: 'Dashboard',
      active: currentStep === 1,
      onClick: () => onNavigateStep(1),
    },
    {
      label: 'Resumes',
      active: currentStep === 2 || currentStep === 4 || currentStep === 5,
      onClick: () =>
        onNavigateStep(maxReachedStep >= 2 ? maxReachedStep : 1),
    },
    {
      label: 'Templates',
      active: currentStep === 3,
      onClick: () => onNavigateStep(3),
    },
    {
      label: 'Help',
      active: false,
      onClick: onOpenHelp,
    },
  ];

  return (
    <header className="no-print sticky top-0 z-40 border-b border-slate-200/80 bg-white/95 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-8 px-4 py-3.5 sm:px-6">
        {/* Zone 1: Brand mark + single-line wordmark */}
        <button
          type="button"
          onClick={() => onNavigateStep(1)}
          className="flex shrink-0 items-center gap-2.5 whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7C3AED] rounded-xl"
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-[#7C3AED] to-[#5B21B6] text-white shadow-sm shadow-violet-600/20">
            <Sparkles className="h-4.5 w-4.5" />
          </span>
          <span className="font-display text-xl font-bold tracking-tight text-slate-900">
            ResumeAI
          </span>
        </button>

        {/* Zone 2: Clean single-line navigation */}
        <nav className="hidden md:flex items-center gap-7 text-sm font-medium">
          {navItems.map((item) => (
            <button
              key={item.label}
              type="button"
              onClick={item.onClick}
              className={`relative whitespace-nowrap shrink-0 py-1.5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7C3AED] rounded ${
                item.active
                  ? 'text-[#7C3AED] font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {item.label}
              {item.active && (
                <span className="absolute inset-x-0 -bottom-[15px] h-0.5 rounded-full bg-[#7C3AED]" />
              )}
            </button>
          ))}
        </nav>

        {/* Zone 3: Primary Saved Resumes action + Avatar */}
        <div className="flex shrink-0 items-center gap-3">
          <button
            type="button"
            onClick={onOpenSaved}
            className="inline-flex items-center gap-2 whitespace-nowrap shrink-0 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-xs transition-all hover:border-slate-300 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7C3AED]"
          >
            <BookmarkCheck className="h-4 w-4 text-[#7C3AED]" />
            <span>Saved Resumes</span>
            {savedCount > 0 && (
              <span className="font-mono text-xs font-semibold text-[#7C3AED] tabular-nums">
                ({savedCount})
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={onOpenSaved}
            aria-label="Open saved resumes workspace"
            className="hidden sm:inline-flex items-center gap-1 rounded-full p-0.5 transition-colors hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7C3AED]"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#10B981] font-display text-xs font-bold text-white shadow-xs">
              JD
            </span>
            <ChevronDown className="h-3.5 w-3.5 text-slate-500 mr-1" />
          </button>
        </div>
      </div>
    </header>
  );
}
