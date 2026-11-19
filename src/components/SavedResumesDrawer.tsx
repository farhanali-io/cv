import { X, Trash2, ArrowUpRight, BookmarkCheck, FileText } from 'lucide-react';
import type { SavedResumeRecord } from '../types';

interface SavedResumesDrawerProps {
  isOpen: boolean;
  records: SavedResumeRecord[];
  onClose: () => void;
  onLoadRecord: (record: SavedResumeRecord) => void;
  onDeleteRecord: (id: string) => void;
}

export function SavedResumesDrawer({
  isOpen,
  records,
  onClose,
  onLoadRecord,
  onDeleteRecord,
}: SavedResumesDrawerProps) {
  if (!isOpen) return null;

  return (
    <div className="no-print fixed inset-0 z-50 flex justify-end bg-slate-900/35 backdrop-blur-xs">
      <div className="flex h-full w-full max-w-md flex-col bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <div className="flex items-center gap-2.5">
            <BookmarkCheck className="h-5 w-5 text-[#7C3AED]" />
            <h2 className="font-display text-lg font-bold text-slate-900">
              Saved Resumes
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close saved resumes"
            className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {records.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                <FileText className="h-7 w-7" />
              </div>
              <h3 className="mt-4 font-display text-base font-bold text-slate-900">
                No saved snapshots yet
              </h3>
              <p className="mt-1 max-w-xs text-xs leading-relaxed text-slate-500">
                Your active draft is automatically saved in your browser. Use the
                Save button in Step 5 to store snapshots for different job
                applications.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {records.map((rec) => (
                <div
                  key={rec.id}
                  className="rounded-2xl border border-slate-200 bg-slate-50/50 p-4 transition-colors hover:border-violet-200 hover:bg-white"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="font-display text-sm font-bold text-slate-900">
                        {rec.jobTitle || 'Targeted Resume'}
                      </h3>
                      <p className="mt-0.5 text-xs text-slate-500">
                        {rec.company ? `${rec.company} · ` : ''}
                        {rec.header.name || 'Candidate'}
                      </p>
                    </div>
                    <span className="rounded-lg bg-emerald-50 px-2.5 py-1 font-mono text-xs font-bold text-emerald-700 tabular-nums">
                      {rec.score}/100
                    </span>
                  </div>

                  <div className="mt-3 flex items-center justify-between border-t border-slate-200/70 pt-3">
                    <span className="text-[11px] text-slate-400">
                      {new Date(rec.savedAt).toLocaleDateString()} ·{' '}
                      {rec.template === 'classic-ats'
                        ? 'Classic ATS'
                        : 'Two-Column Teal'}
                    </span>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => onDeleteRecord(rec.id)}
                        aria-label="Delete saved resume"
                        className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          onLoadRecord(rec);
                          onClose();
                        }}
                        className="inline-flex items-center gap-1 rounded-xl bg-[#7C3AED] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#6D28D9]"
                      >
                        <span>Load</span>
                        <ArrowUpRight className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
