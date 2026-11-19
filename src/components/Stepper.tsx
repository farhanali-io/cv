import { Check } from 'lucide-react';
import type { StepId } from '../types';

interface StepperProps {
  currentStep: StepId;
  maxReachedStep: StepId;
  onSelectStep: (step: StepId) => void;
}

const STEPS: Array<{ id: StepId; label: string }> = [
  { id: 1, label: 'Upload' },
  { id: 2, label: 'Score' },
  { id: 3, label: 'Template' },
  { id: 4, label: 'Refine' },
  { id: 5, label: 'Final' },
];

export function Stepper({
  currentStep,
  maxReachedStep,
  onSelectStep,
}: StepperProps) {
  return (
    <div className="no-print mx-auto w-full max-w-3xl px-4 pt-6 pb-2 sm:pt-8">
      <div className="flex items-start justify-between">
        {STEPS.map((step, index) => {
          const isActive = currentStep === step.id;
          const isCompleted = step.id < currentStep;
          const isReachable = step.id <= maxReachedStep || step.id === 3;

          return (
            <div
              key={step.id}
              className={`flex items-center ${
                index < STEPS.length - 1 ? 'flex-1' : ''
              }`}
            >
              <button
                type="button"
                disabled={!isReachable}
                onClick={() => isReachable && onSelectStep(step.id)}
                className={`group flex flex-col items-center gap-2 focus-visible:outline-none ${
                  isReachable ? 'cursor-pointer' : 'cursor-not-allowed opacity-70'
                }`}
              >
                <span
                  className={`flex h-11 w-11 items-center justify-center rounded-full font-display text-sm font-bold transition-all duration-200 tabular-nums ${
                    isActive
                      ? 'bg-[#7C3AED] text-white shadow-md shadow-violet-600/30 ring-4 ring-violet-100'
                      : isCompleted
                      ? 'bg-emerald-500 text-white shadow-sm shadow-emerald-500/20 group-hover:bg-emerald-600'
                      : isReachable
                      ? 'border-2 border-slate-300 bg-white text-slate-700 group-hover:border-violet-400 group-hover:text-[#7C3AED]'
                      : 'border border-slate-200 bg-white text-slate-400'
                  }`}
                >
                  {isCompleted ? <Check className="h-5 w-5 stroke-[2.5]" /> : step.id}
                </span>
                <span
                  className={`whitespace-nowrap text-xs sm:text-sm font-medium transition-colors ${
                    isActive
                      ? 'font-semibold text-[#7C3AED]'
                      : isCompleted
                      ? 'text-slate-700'
                      : 'text-slate-400'
                  }`}
                >
                  {step.label}
                </span>
              </button>

              {index < STEPS.length - 1 && (
                <div className="mx-2 sm:mx-4 mb-6 h-[2px] flex-1 bg-slate-200 overflow-hidden rounded-full">
                  <div
                    className={`h-full transition-all duration-300 ${
                      step.id < currentStep ? 'w-full bg-emerald-400' : 'w-0'
                    }`}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
