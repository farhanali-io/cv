import { useState } from 'react';
import {
  ArrowUp,
  ArrowDown,
  Trash2,
  Plus,
  Pencil,
  Check,
  Sparkles,
  Printer,
  FileDown,
  FileText,
  BookmarkPlus,
  Loader2,
  X,
  Eye,
  EyeOff,
  AlertCircle,
} from 'lucide-react';
import type {
  HeaderData,
  PageCount,
  ResumeSection,
  SectionType,
  TemplateId,
} from '../types';
import { ResumePreview } from './ResumePreview';
import { exportPDF } from '../utils/exportResume';

interface Step5FinalEditorProps {
  header: HeaderData;
  sections: ResumeSection[];
  template: TemplateId;
  pageCount: PageCount;
  jobTitle: string;
  company: string;
  jobDescription: string;
  onChangeHeader: (header: HeaderData) => void;
  onChangeSections: (sections: ResumeSection[]) => void;
  onChangeTemplate: (template: TemplateId) => void;
  onChangePageCount: (pages: PageCount) => void;
  onSaveSnapshot: () => void;
}

const STANDARD_SECTIONS: SectionType[] = [
  'Summary',
  'Skills',
  'Experience',
  'Projects',
  'Education',
  'Certifications',
  'Languages',
];

export function Step5FinalEditor({
  header,
  sections,
  template,
  pageCount,
  jobTitle,
  company,
  jobDescription,
  onChangeHeader,
  onChangeSections,
  onChangeTemplate,
  onChangePageCount,
  onSaveSnapshot,
}: Step5FinalEditorProps) {
  const [editingSectionId, setEditingSectionId] = useState<string | null>(null);
  const [rewritingSectionId, setRewritingSectionId] = useState<string | null>(
    null
  );
  const [aiSuggestions, setAiSuggestions] = useState<Record<string, string>>(
    {}
  );
  const [rewriteErrors, setRewriteErrors] = useState<Record<string, string>>(
    {}
  );
  const [showMobilePreview, setShowMobilePreview] = useState(false);
  const [savedNotice, setSavedNotice] = useState(false);

  const updateHeaderField = (field: keyof HeaderData, value: string) => {
    onChangeHeader({ ...header, [field]: value });
  };

  const updateSectionContent = (id: string, content: string) => {
    onChangeSections(
      sections.map((s) => (s.id === id ? { ...s, content } : s))
    );
  };

  const updateSectionTitle = (id: string, title: string) => {
    onChangeSections(sections.map((s) => (s.id === id ? { ...s, title } : s)));
  };

  const moveSection = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= sections.length) return;
    const copy = [...sections];
    const [moved] = copy.splice(index, 1);
    copy.splice(target, 0, moved);
    onChangeSections(copy);
  };

  const removeSection = (id: string) => {
    onChangeSections(sections.filter((s) => s.id !== id));
    if (editingSectionId === id) setEditingSectionId(null);
  };

  const addSection = (type: SectionType) => {
    const newSec: ResumeSection = {
      id: `sec-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      type,
      title: type,
      content:
        type === 'Experience' || type === 'Projects'
          ? 'Role or Project Title | Organization | 2024 - Present | City\n- Quantified achievement or outcome'
          : type === 'Skills'
          ? 'Core Skills: Add your relevant tools and competencies here'
          : `Add your ${type.toLowerCase()} details here...`,
    };
    onChangeSections([...sections, newSec]);
    setEditingSectionId(newSec.id);
  };

  const handleAiRewrite = async (section: ResumeSection) => {
    setRewritingSectionId(section.id);
    setRewriteErrors((prev) => {
      const next = { ...prev };
      delete next[section.id];
      return next;
    });

    try {
      const res = await fetch('/api/rewrite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sectionTitle: section.title,
          sectionContent: section.content,
          jobTitle,
          company,
          jobDescription,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to rewrite section.');
      }
      setAiSuggestions((prev) => ({
        ...prev,
        [section.id]: data.improvedText,
      }));
    } catch (err) {
      setRewriteErrors((prev) => ({
        ...prev,
        [section.id]:
          err instanceof Error ? err.message : 'Unable to rewrite section.',
      }));
    } finally {
      setRewritingSectionId(null);
    }
  };

  const handleReplaceWithAi = (id: string) => {
    const improved = aiSuggestions[id];
    if (!improved) return;
    updateSectionContent(id, improved);
    setAiSuggestions((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  };

  const handleDismissAi = (id: string) => {
    setAiSuggestions((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  };

  const handleSave = () => {
    onSaveSnapshot();
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 2500);
  };

  return (
    <div className="mx-auto max-w-6xl px-4 pb-16 pt-4 sm:px-6">
      {/* Top Export & Controls Bar */}
      <div className="no-print mb-6 flex flex-col gap-4 rounded-3xl border border-slate-100 bg-white p-5 shadow-[0_8px_30px_rgb(15,23,42,0.05)] lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-[#7C3AED]">
            Final Editor &amp; Export
          </p>
          <h1 className="font-display text-xl font-extrabold text-slate-900 sm:text-2xl">
            Fine-tune &amp; Download Resume
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Quick Template & Page selector */}
          <select
            aria-label="Template style"
            value={template}
            onChange={(e) => onChangeTemplate(e.target.value as TemplateId)}
            className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700 focus:border-[#7C3AED] focus:outline-none"
          >
            <option value="split-teal">Two-Column Teal</option>
            <option value="classic-ats">Classic ATS</option>
          </select>

          <button
            type="button"
            onClick={() => onChangePageCount(pageCount === 1 ? 2 : 1)}
            className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 whitespace-nowrap"
          >
            {pageCount === 1 ? '1 Page' : '2 Pages'}
          </button>

          <button
            type="button"
            onClick={handleSave}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-50 whitespace-nowrap"
          >
            {savedNotice ? (
              <>
                <Check className="h-3.5 w-3.5 text-emerald-600" />
                <span className="text-emerald-700">Saved</span>
              </>
            ) : (
              <>
                <BookmarkPlus className="h-3.5 w-3.5 text-[#7C3AED]" />
                <span>Save</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={() => exportPDF(header, sections, template)}
            className="inline-flex items-center gap-1.5 rounded-xl bg-[#7C3AED] px-4 py-2 text-xs font-bold text-white shadow-md shadow-violet-600/20 transition-all hover:bg-[#6D28D9] whitespace-nowrap"
          >
            <Printer className="h-3.5 w-3.5" />
            <span>Download PDF</span>
          </button>

          <button
            type="button"
            onClick={() => setShowMobilePreview((v) => !v)}
            className="inline-flex lg:hidden items-center gap-1.5 rounded-xl border border-violet-200 bg-violet-50 px-3.5 py-2 text-xs font-semibold text-[#7C3AED]"
          >
            {showMobilePreview ? (
              <>
                <EyeOff className="h-3.5 w-3.5" />
                <span>Hide Preview</span>
              </>
            ) : (
              <>
                <Eye className="h-3.5 w-3.5" />
                <span>Preview</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Split Workspace: Left Editor (hidden on print) + Right Live A4 Preview (printed) */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 lg:items-start">
        {/* Left: Editable Sections */}
        <div className="no-print space-y-5 lg:col-span-6">
          {/* Header Section Card */}
          <section className="rounded-3xl border border-slate-100 bg-white p-6 shadow-[0_8px_30px_rgb(15,23,42,0.04)]">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-display text-base font-bold text-slate-900">
                Header &amp; Contact Information
              </h2>
              <span className="text-xs font-medium text-slate-400">
                Live synced
              </span>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {(
                [
                  ['name', 'Full Name', 'e.g. Jordan Davis'],
                  ['title', 'Target Title', 'e.g. Senior Product Manager'],
                  ['email', 'Email', 'jordan@email.com'],
                  ['phone', 'Phone', '(415) 555-0192'],
                  ['address', 'Address / Location', 'San Francisco, CA'],
                  ['linkedin', 'LinkedIn', 'linkedin.com/in/username'],
                  ['github', 'GitHub', 'github.com/username'],
                  ['portfolio', 'Portfolio', 'yourwebsite.com'],
                ] as Array<[keyof HeaderData, string, string]>
              ).map(([field, label, placeholder]) => (
                <div key={field}>
                  <label className="mb-1 block text-[11px] font-semibold text-slate-600">
                    {label}
                  </label>
                  <input
                    type="text"
                    value={header[field] || ''}
                    onChange={(e) => updateHeaderField(field, e.target.value)}
                    placeholder={placeholder}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/70 px-3 py-2 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#7C3AED] focus:bg-white focus:outline-none"
                  />
                </div>
              ))}
            </div>
          </section>

          {/* Dynamic Resume Sections */}
          {sections.map((section, idx) => {
            const isEditing = editingSectionId === section.id;
            const isRewriting = rewritingSectionId === section.id;
            const aiSuggestion = aiSuggestions[section.id];
            const rewriteErr = rewriteErrors[section.id];

            return (
              <section
                key={section.id}
                className="rounded-3xl border border-slate-100 bg-white p-5 sm:p-6 shadow-[0_8px_30px_rgb(15,23,42,0.04)]"
              >
                {/* Section Header Toolbar */}
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                  {isEditing ? (
                    <input
                      type="text"
                      value={section.title}
                      onChange={(e) =>
                        updateSectionTitle(section.id, e.target.value)
                      }
                      className="rounded-lg border border-violet-300 bg-violet-50/50 px-2.5 py-1 font-display text-sm font-bold text-slate-900 focus:outline-none"
                    />
                  ) : (
                    <h3 className="font-display text-base font-bold text-slate-900">
                      {section.title}
                    </h3>
                  )}

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      disabled={idx === 0}
                      onClick={() => moveSection(idx, -1)}
                      aria-label="Move section up"
                      className="rounded-lg p-1.5 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 disabled:opacity-30"
                    >
                      <ArrowUp className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      disabled={idx === sections.length - 1}
                      onClick={() => moveSection(idx, 1)}
                      aria-label="Move section down"
                      className="rounded-lg p-1.5 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 disabled:opacity-30"
                    >
                      <ArrowDown className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setEditingSectionId(isEditing ? null : section.id)
                      }
                      className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-colors ${
                        isEditing
                          ? 'bg-emerald-600 text-white'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      {isEditing ? (
                        <>
                          <Check className="h-3.5 w-3.5" />
                          <span>Done</span>
                        </>
                      ) : (
                        <>
                          <Pencil className="h-3.5 w-3.5" />
                          <span>Edit</span>
                        </>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => removeSection(section.id)}
                      aria-label="Remove section"
                      className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {/* Content Display or Inline Textarea */}
                {isEditing ? (
                  <textarea
                    value={section.content}
                    onChange={(e) =>
                      updateSectionContent(section.id, e.target.value)
                    }
                    rows={Math.max(5, section.content.split('\n').length + 1)}
                    className="w-full resize-y rounded-2xl border border-violet-300 bg-white p-3.5 text-xs sm:text-sm leading-relaxed text-slate-800 focus:outline-none focus:ring-3 focus:ring-violet-500/15"
                  />
                ) : (
                  <div
                    role="button"
                    tabIndex={0}
                    onClick={() => setEditingSectionId(section.id)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        setEditingSectionId(section.id);
                      }
                    }}
                    className="cursor-pointer rounded-2xl border border-slate-200/70 bg-slate-50/50 p-3.5 text-xs sm:text-sm leading-relaxed text-slate-700 whitespace-pre-wrap transition-colors hover:border-violet-300 hover:bg-white"
                  >
                    {section.content || (
                      <span className="italic text-slate-400">
                        Click to add content...
                      </span>
                    )}
                  </div>
                )}

                {/* AI Suggest Bar inside each section */}
                <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-3">
                  <span className="text-[11px] font-medium text-slate-400">
                    Click text above to edit inline
                  </span>

                  <button
                    type="button"
                    disabled={isRewriting}
                    onClick={() => handleAiRewrite(section)}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-violet-200 bg-violet-50 px-3 py-1.5 text-xs font-semibold text-[#7C3AED] transition-colors hover:bg-violet-100 disabled:opacity-60"
                  >
                    {isRewriting ? (
                      <>
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        <span>Rewriting...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-3.5 w-3.5" />
                        <span>AI Rewrite</span>
                      </>
                    )}
                  </button>
                </div>

                {rewriteErr && (
                  <div className="mt-3 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
                    <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                    <span>{rewriteErr}</span>
                  </div>
                )}

                {aiSuggestion && (
                  <div className="mt-3 rounded-2xl border-2 border-emerald-300 bg-emerald-50/80 p-4 shadow-[0_12px_30px_rgba(16,185,129,0.18)] ring-1 ring-emerald-200 animate-in fade-in slide-in-from-top-2">
                    <div className="mb-2 flex items-center justify-between gap-2">
                      <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-800">
                        <Sparkles className="h-3.5 w-3.5 text-[#10B981]" />
                        <span>✨ AI Improved Version — Click text to use it</span>
                      </span>
                      <button
                        type="button"
                        onClick={() => handleDismissAi(section.id)}
                        className="rounded-lg p-1.5 text-slate-500 hover:bg-white hover:text-red-600 border border-transparent hover:border-red-200"
                        aria-label="Dismiss AI suggestion"
                        title="Dismiss — keep old text"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                    {/* Clickable AI text — click = replace */}
                    <div
                      role="button"
                      tabIndex={0}
                      title="Click to replace old text with this AI version"
                      onClick={() => handleReplaceWithAi(section.id)}
                      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleReplaceWithAi(section.id); }}
                      className="cursor-pointer rounded-xl bg-white p-3.5 text-xs sm:text-sm leading-relaxed text-slate-800 whitespace-pre-wrap border border-emerald-200 hover:border-emerald-400 hover:bg-emerald-50/50 hover:shadow-sm transition-all"
                    >
                      {aiSuggestion}
                    </div>
                    <p className="mt-1.5 text-[11px] text-emerald-700/80">Tip: Text pe click karo to ye purane text se replace ho jayega.</p>
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleReplaceWithAi(section.id)}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-[#10B981] px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-emerald-600"
                      >
                        <Check className="h-3.5 w-3.5" />
                        <span>✅ Use This — Replace</span>
                      </button>
                      <button
                        type="button"
                        disabled={isRewriting}
                        onClick={() => handleAiRewrite(section)}
                        className="inline-flex items-center gap-1.5 rounded-xl border border-violet-300 bg-white px-4 py-2 text-xs font-bold text-[#7C3AED] hover:bg-violet-50 disabled:opacity-60"
                      >
                        {isRewriting ? <><Loader2 className="h-3.5 w-3.5 animate-spin" /><span>Rewriting...</span></> : <><Sparkles className="h-3.5 w-3.5" /><span>🔄 Rewrite Again</span></>}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDismissAi(section.id)}
                        className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 hover:text-red-600"
                      >
                        <X className="h-3.5 w-3.5" />
                        <span>Dismiss</span>
                      </button>
                    </div>
                  </div>
                )}
              </section>
            );
          })}

          {/* Add Section Bar */}
          <section className="rounded-3xl border border-dashed border-slate-300 bg-white/70 p-5">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
              Add Resume Section
            </p>
            <div className="flex flex-wrap gap-2">
              {STANDARD_SECTIONS.map((secType) => (
                <button
                  key={secType}
                  type="button"
                  onClick={() => addSection(secType)}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition-colors hover:border-[#7C3AED] hover:text-[#7C3AED]"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>{secType}</span>
                </button>
              ))}
            </div>
          </section>
        </div>

        {/* Right: Sticky Live A4 Resume Preview (Printable Target) */}
        <div
          id="printable-resume-wrapper"
          className={`lg:col-span-6 lg:sticky lg:top-20 ${
            showMobilePreview ? 'block' : 'hidden lg:block'
          }`}
        >
          <div className="no-print mb-2.5 flex items-center justify-between text-xs font-medium text-slate-500">
            <span>Live A4 Print Preview</span>
            <span>Ready for PDF / ATS</span>
          </div>
          <ResumePreview
            id="printable-resume"
            header={header}
            sections={sections}
            template={template}
            pageCount={pageCount}
          />
        </div>
      </div>
    </div>
  );
}
