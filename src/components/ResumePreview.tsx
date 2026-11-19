import { MapPin, Mail, Phone, Globe, Linkedin, Github } from 'lucide-react';
import type { HeaderData, PageCount, ResumeSection, TemplateId } from '../types';

interface ResumePreviewProps {
  header: HeaderData;
  sections: ResumeSection[];
  template: TemplateId;
  pageCount: PageCount;
  id?: string;
}

interface ParsedBlock {
  kind: 'role' | 'bullet' | 'paragraph';
  parts?: string[];
  text?: string;
}

function parseLinesToBlocks(content: string): ParsedBlock[] {
  const lines = content
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  return lines.map((line) => {
    if (line.startsWith('- ') || line.startsWith('• ')) {
      return {
        kind: 'bullet',
        text: line.replace(/^[-•]\s*/, ''),
      };
    }
    if (line.includes('|')) {
      return {
        kind: 'role',
        parts: line.split('|').map((p) => p.trim()),
      };
    }
    return {
      kind: 'paragraph',
      text: line,
    };
  });
}

function renderSplitTealLeftSection(
  section: ResumeSection,
  headerTitle: string,
  compact: boolean
) {
  const typeLower = section.type.toLowerCase();
  const isSummary = typeLower === 'summary';
  const isExperience = typeLower.includes('experience');
  const isProjects = typeLower.includes('project');
  const blocks = parseLinesToBlocks(section.content);

  return (
    <section key={section.id} className="break-inside-avoid">
      {isSummary ? (
        <div className={compact ? 'mb-3' : 'mb-4'}>
          {headerTitle && (
            <h3
              className={`font-bold text-slate-900 ${
                compact ? 'text-[13.5px] mb-1.5' : 'text-[14.5px] mb-2'
              }`}
            >
              {headerTitle}
            </h3>
          )}
          <div className="space-y-1.5">
            {blocks.map((b, i) => (
              <p
                key={i}
                className={`${
                  compact ? 'text-[11px] leading-[1.45]' : 'text-[11.5px] leading-[1.55]'
                } text-slate-800`}
              >
                {b.text}
              </p>
            ))}
          </div>
        </div>
      ) : (
        <div className={compact ? 'mb-3.5' : 'mb-4.5'}>
          <h3
            className={`border-b border-slate-300 pb-0.5 font-semibold uppercase tracking-wide text-[#1F6E6E] ${
              compact ? 'text-[11px] mb-2' : 'text-[12px] mb-2.5'
            }`}
          >
            {section.type.toLowerCase() === 'experience'
              ? 'WORK EXPERIENCE'
              : section.title.toUpperCase()}
          </h3>

          <div className={compact ? 'space-y-1' : 'space-y-1.5'}>
            {blocks.map((block, i) => {
              if (block.kind === 'role' && block.parts) {
                const [first = '', second = '', third = '', fourth = ''] =
                  block.parts;

                if (isExperience) {
                  // Row 1: Role (left) | Location (right)
                  // Row 2: Company (left) | Dates (right)
                  const role = first;
                  const company = second;
                  const dates = third;
                  const location = fourth;
                  return (
                    <div key={i} className={i > 0 ? 'pt-2' : ''}>
                      <div className="flex items-baseline justify-between gap-2">
                        <span
                          className={`font-bold text-slate-900 ${
                            compact ? 'text-[11.5px]' : 'text-[12px]'
                          }`}
                        >
                          {role}
                          {company && !location && !dates ? '' : ''}
                        </span>
                        {location && (
                          <span
                            className={`font-semibold text-slate-900 ${
                              compact ? 'text-[10.5px]' : 'text-[11px]'
                            }`}
                          >
                            {location}
                          </span>
                        )}
                      </div>
                      {(company || dates) && (
                        <div className="flex items-baseline justify-between gap-2">
                          <span
                            className={`font-bold text-slate-900 ${
                              compact ? 'text-[11px]' : 'text-[11.5px]'
                            }`}
                          >
                            {company}
                          </span>
                          {dates && (
                            <span
                              className={`font-bold text-slate-900 ${
                                compact ? 'text-[10.5px]' : 'text-[11px]'
                              }`}
                            >
                              {dates}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  );
                }

                if (isProjects) {
                  return (
                    <div key={i} className={i > 0 ? 'pt-2' : ''}>
                      <p
                        className={`font-bold text-slate-900 ${
                          compact ? 'text-[11.5px]' : 'text-[12px]'
                        }`}
                      >
                        {first}
                      </p>
                      {second && (
                        <p className="text-[10.5px] text-slate-600">{second}</p>
                      )}
                    </div>
                  );
                }

                return (
                  <p
                    key={i}
                    className={`font-bold text-slate-900 ${
                      compact ? 'text-[11px]' : 'text-[11.5px]'
                    } ${i > 0 ? 'pt-1.5' : ''}`}
                  >
                    {block.parts.join(' · ')}
                  </p>
                );
              }

              if (block.kind === 'bullet') {
                return (
                  <div
                    key={i}
                    className={`flex items-start gap-2 pl-1.5 text-slate-800 ${
                      compact
                        ? 'text-[10.5px] leading-[1.42]'
                        : 'text-[11px] leading-[1.5]'
                    }`}
                  >
                    <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-slate-800" />
                    <span>{block.text}</span>
                  </div>
                );
              }

              return (
                <p
                  key={i}
                  className={`text-slate-800 ${
                    compact
                      ? 'text-[10.5px] leading-[1.42]'
                      : 'text-[11px] leading-[1.5]'
                  }`}
                >
                  {block.text}
                </p>
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
}

function renderSplitTealSidebarSection(
  section: ResumeSection,
  compact: boolean
) {
  const typeLower = section.type.toLowerCase();
  const isSkills = typeLower.includes('skill');
  const isEducation = typeLower.includes('education');

  // For Skills in Split-Teal sidebar, render crisp individual bullet items
  if (isSkills) {
    const rawItems = section.content
      .split(/\r?\n|,/)
      .map((item) => item.replace(/^[-•]\s*/, '').trim())
      .filter(Boolean);

    return (
      <section key={section.id} className="break-inside-avoid">
        <h3
          className={`border-b border-slate-300 pb-0.5 font-semibold uppercase tracking-wide text-[#1F6E6E] ${
            compact ? 'text-[11px] mb-2' : 'text-[12px] mb-2.5'
          }`}
        >
          {section.title.toUpperCase()}
        </h3>
        <ul className={compact ? 'space-y-1' : 'space-y-1.5'}>
          {rawItems.map((skill, idx) => (
            <li
              key={idx}
              className={`flex items-start gap-2 text-slate-800 ${
                compact ? 'text-[10.5px] leading-snug' : 'text-[11px] leading-snug'
              }`}
            >
              <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-slate-800" />
              <span>{skill}</span>
            </li>
          ))}
        </ul>
      </section>
    );
  }

  const blocks = parseLinesToBlocks(section.content);

  return (
    <section key={section.id} className="break-inside-avoid">
      <h3
        className={`border-b border-slate-300 pb-0.5 font-semibold uppercase tracking-wide text-[#1F6E6E] ${
          compact ? 'text-[11px] mb-2' : 'text-[12px] mb-2.5'
        }`}
      >
        {section.title.toUpperCase()}
      </h3>

      <div className={compact ? 'space-y-2' : 'space-y-2.5'}>
        {blocks.map((block, i) => {
          if (block.kind === 'role' && block.parts && isEducation) {
            const [degree = '', school = '', location = '', date = ''] =
              block.parts;
            return (
              <div key={i} className="space-y-0.5">
                <p
                  className={`font-bold text-slate-900 ${
                    compact ? 'text-[11.5px] leading-tight' : 'text-[12px] leading-tight'
                  }`}
                >
                  {degree}
                </p>
                {school && (
                  <p className="text-[10.5px] text-slate-800">{school}</p>
                )}
                {location && (
                  <p className="text-[10.5px] text-slate-700">{location}</p>
                )}
                {date && <p className="text-[10.5px] text-slate-600">{date}</p>}
              </div>
            );
          }

          if (block.kind === 'bullet') {
            return (
              <div
                key={i}
                className="flex items-start gap-2 text-[10.5px] leading-snug text-slate-800"
              >
                <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-slate-800" />
                <span>{block.text}</span>
              </div>
            );
          }

          return (
            <p
              key={i}
              className="text-[10.5px] leading-snug text-slate-800"
            >
              {block.text || block.parts?.join(' · ')}
            </p>
          );
        })}
      </div>
    </section>
  );
}

function renderClassicAtsSection(section: ResumeSection, compact: boolean) {
  const typeLower = section.type.toLowerCase();
  const isExperience = typeLower.includes('experience');
  const isProjects = typeLower.includes('project');
  const isEducation = typeLower.includes('education');
  const isSkills = typeLower.includes('skill');
  const blocks = parseLinesToBlocks(section.content);

  return (
    <section key={section.id} className="break-inside-avoid">
      <h3
        className={`border-b-[1.5px] border-slate-800 pb-0.5 font-bold uppercase tracking-wide text-slate-900 ${
          compact ? 'text-[11.5px] mb-1.5' : 'text-[12.5px] mb-2'
        }`}
      >
        {section.title.toUpperCase()}
      </h3>

      {isSkills ? (
        <div className="divide-y divide-slate-100">
          {blocks.map((b, i) => (
            <p
              key={i}
              className={`py-1 text-slate-700 ${
                compact ? 'text-[10.5px]' : 'text-[11px]'
              }`}
            >
              {b.text || b.parts?.join(', ')}
            </p>
          ))}
        </div>
      ) : (
        <div className={compact ? 'space-y-1' : 'space-y-1.5'}>
          {blocks.map((block, i) => {
            if (block.kind === 'role' && block.parts) {
              const [first = '', second = '', third = '', fourth = ''] =
                block.parts;

              if (isExperience) {
                const dateAndLoc = [third, fourth].filter(Boolean).join(', ');
                return (
                  <div key={i} className={i > 0 ? 'pt-2' : ''}>
                    <p
                      className={`font-bold text-slate-900 ${
                        compact ? 'text-[11.5px]' : 'text-[12px]'
                      }`}
                    >
                      {first}
                    </p>
                    {(second || dateAndLoc) && (
                      <div className="flex flex-wrap items-baseline justify-between gap-2">
                        <span
                          className={`font-bold text-slate-800 ${
                            compact ? 'text-[10.5px]' : 'text-[11px]'
                          }`}
                        >
                          {second}
                        </span>
                        {dateAndLoc && (
                          <span
                            className={`font-bold text-slate-800 ${
                              compact ? 'text-[10.5px]' : 'text-[11px]'
                            }`}
                          >
                            {dateAndLoc}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                );
              }

              if (isProjects) {
                return (
                  <div key={i} className={i > 0 ? 'pt-2' : ''}>
                    <p
                      className={`font-bold text-slate-900 ${
                        compact ? 'text-[11.5px]' : 'text-[12px]'
                      }`}
                    >
                      {first}
                    </p>
                    {second && (
                      <p
                        className={`text-slate-600 ${
                          compact ? 'text-[10px]' : 'text-[10.5px]'
                        }`}
                      >
                        {second}
                      </p>
                    )}
                  </div>
                );
              }

              if (isEducation) {
                const details = [second, third, fourth]
                  .filter(Boolean)
                  .join('  •  ');
                return (
                  <div key={i} className={i > 0 ? 'pt-1.5' : ''}>
                    <p
                      className={`font-bold text-slate-900 ${
                        compact ? 'text-[11.5px]' : 'text-[12px]'
                      }`}
                    >
                      {first}
                    </p>
                    {details && (
                      <p
                        className={`text-slate-700 ${
                          compact ? 'text-[10.5px]' : 'text-[11px]'
                        }`}
                      >
                        {details}
                      </p>
                    )}
                  </div>
                );
              }

              return (
                <p
                  key={i}
                  className={`font-bold text-slate-900 ${
                    compact ? 'text-[11px]' : 'text-[11.5px]'
                  } ${i > 0 ? 'pt-1.5' : ''}`}
                >
                  {block.parts.join('  •  ')}
                </p>
              );
            }

            if (block.kind === 'bullet') {
              return (
                <div
                  key={i}
                  className={`flex items-start gap-2 text-slate-700 ${
                    compact
                      ? 'text-[10.5px] leading-[1.42]'
                      : 'text-[11px] leading-[1.5]'
                  }`}
                >
                  <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-slate-700" />
                  <span>{block.text}</span>
                </div>
              );
            }

            return (
              <p
                key={i}
                className={`text-slate-700 ${
                  compact
                    ? 'text-[10.5px] leading-[1.44]'
                    : 'text-[11px] leading-[1.52]'
                }`}
              >
                {block.text}
              </p>
            );
          })}
        </div>
      )}
    </section>
  );
}

export function ResumePreview({
  header,
  sections,
  template,
  pageCount,
  id,
}: ResumePreviewProps) {
  const compact = pageCount === 1;
  const isSplitTeal = template === 'split-teal';

  if (isSplitTeal) {
    const contactLine = [
      header.address,
      header.phone,
      header.email,
      header.linkedin,
      header.github,
      header.portfolio,
    ]
      .map((v) => v?.trim())
      .filter(Boolean);

    const sidebarTypes = new Set(['skills', 'education', 'languages']);
    const leftSections = sections.filter(
      (s) => !sidebarTypes.has(s.type.toLowerCase())
    );
    const rightSections = sections.filter((s) =>
      sidebarTypes.has(s.type.toLowerCase())
    );

    return (
      <div
        id={id}
        className={`w-full rounded-2xl border border-slate-200/90 bg-white text-slate-900 shadow-[0_4px_24px_rgb(15,23,42,0.06)] ${
          compact ? 'p-6 sm:p-8' : 'p-8 sm:p-10'
        }`}
        style={{
          fontFamily: "'Lora', Georgia, serif",
          minHeight: compact ? '700px' : '860px',
        }}
      >
        {/* Top Centered Teal Header */}
        <header className="border-b-[1.5px] border-slate-700 pb-3.5 text-center">
          <h2 className="text-2xl font-bold uppercase tracking-wider text-[#1F6E6E]">
            {header.name || 'Candidate Name'}
          </h2>
          {contactLine.length > 0 && (
            <p className="mt-1.5 text-[10.5px] text-slate-800">
              {contactLine.join('  •  ')}
            </p>
          )}
        </header>

        {/* Two-Column Split Body (67% Main / 33% Sidebar) */}
        <div
          className={`mt-5 grid grid-cols-1 gap-6 sm:grid-cols-12 ${
            compact ? 'sm:gap-6' : 'sm:gap-7'
          }`}
        >
          <div className="sm:col-span-8">
            {leftSections.map((sec) =>
              renderSplitTealLeftSection(sec, header.title, compact)
            )}
          </div>

          <div
            className={`sm:col-span-4 ${compact ? 'space-y-4' : 'space-y-5'}`}
          >
            {rightSections.map((sec) =>
              renderSplitTealSidebarSection(sec, compact)
            )}
          </div>
        </div>

        {pageCount === 2 && (
          <div className="no-print mt-8 flex items-center gap-3 font-sans text-[11px] text-slate-400">
            <div className="h-px flex-1 border-t border-dashed border-slate-300" />
            <span>2-Page Layout Flow</span>
            <div className="h-px flex-1 border-t border-dashed border-slate-300" />
          </div>
        )}
      </div>
    );
  }

  // Template 2: Classic ATS Single-Column (Farhan_Ali__1__99626fb1.pdf)
  const contactBadges = [
    { icon: MapPin, value: header.address },
    { icon: Mail, value: header.email },
    { icon: Phone, value: header.phone },
    { icon: Globe, value: header.portfolio },
    { icon: Linkedin, value: header.linkedin },
    { icon: Github, value: header.github },
  ].filter((item) => item.value && item.value.trim());

  return (
    <div
      id={id}
      className={`w-full rounded-2xl border border-slate-200/90 bg-white text-slate-900 shadow-[0_4px_24px_rgb(15,23,42,0.06)] ${
        compact ? 'p-6 sm:p-8' : 'p-8 sm:p-10'
      }`}
      style={{
        fontFamily: "'Lora', Georgia, serif",
        minHeight: compact ? '700px' : '860px',
      }}
    >
      {/* Centered Charcoal Serif Header with Icon Contact Strip */}
      <header className="mb-5 text-center">
        <h2 className="text-2xl font-bold uppercase tracking-wide text-[#222222]">
          {header.name || 'Candidate Name'}
        </h2>
        {header.title && (
          <p className="mt-0.5 text-[11.5px] font-semibold text-slate-600">
            {header.title}
          </p>
        )}
        {contactBadges.length > 0 && (
          <div className="mt-2 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-[10px] text-slate-600">
            {contactBadges.map((item, idx) => {
              const Icon = item.icon;
              return (
                <span key={idx} className="inline-flex items-center gap-1">
                  <Icon className="h-3 w-3 text-slate-500" />
                  <span>{item.value}</span>
                </span>
              );
            })}
          </div>
        )}
      </header>

      {/* Single-Column Stacked Sections */}
      <div className={compact ? 'space-y-3.5' : 'space-y-4.5'}>
        {sections.map((sec) => renderClassicAtsSection(sec, compact))}
      </div>

      {pageCount === 2 && (
        <div className="no-print mt-8 flex items-center gap-3 font-sans text-[11px] text-slate-400">
          <div className="h-px flex-1 border-t border-dashed border-slate-300" />
          <span>2-Page Layout Flow</span>
          <div className="h-px flex-1 border-t border-dashed border-slate-300" />
        </div>
      )}
    </div>
  );
}
