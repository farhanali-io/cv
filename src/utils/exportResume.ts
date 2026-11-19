import type { HeaderData, ResumeSection, TemplateId } from '../types';

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function safeSlug(name: string): string {
  return (
    name
      .trim()
      .replace(/[^a-zA-Z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '') || 'Resume'
  );
}

export function exportPDF() {
  window.print();
}

export function exportTXT(header: HeaderData, sections: ResumeSection[]) {
  const contactParts = [
    header.address,
    header.phone,
    header.email,
    header.linkedin,
    header.github,
    header.portfolio,
  ].filter((v) => v && v.trim());

  const lines: string[] = [
    (header.name || 'Resume').toUpperCase(),
    header.title || '',
    contactParts.join(' • '),
    '',
  ].filter((l, idx) => idx === 3 || l.trim().length > 0);

  for (const sec of sections) {
    lines.push('========================================');
    lines.push(sec.title.toUpperCase());
    lines.push('========================================');
    lines.push(sec.content.trim());
    lines.push('');
  }

  const blob = new Blob([lines.join('\n')], {
    type: 'text/plain;charset=utf-8',
  });
  triggerDownload(blob, `${safeSlug(header.name)}_ATS_Resume.txt`);
}

function formatSectionLinesHtml(
  content: string,
  isSplitTeal: boolean,
  sectionType: string
): string {
  const lines = content
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  const isSkills = sectionType.toLowerCase().includes('skill');

  return lines
    .map((line) => {
      if (line.startsWith('- ') || line.startsWith('• ')) {
        return `<li style="margin: 3px 0; font-size: 10pt; color: #1e293b;">${escapeHtml(
          line.replace(/^[-•]\s*/, '')
        )}</li>`;
      }
      if (isSkills && !isSplitTeal) {
        return `<p style="margin: 4px 0; padding-bottom: 4px; border-bottom: 1px solid #e2e8f0; font-size: 10pt; color: #334155;">${escapeHtml(
          line
        )}</p>`;
      }
      if (line.includes('|')) {
        const parts = line.split('|').map((p) => escapeHtml(p.trim()));
        return `<p style="margin: 7px 0 2px 0; font-weight: 700; font-size: 10.5pt; color: #0f172a;">${parts.join(
          ' &nbsp;|&nbsp; '
        )}</p>`;
      }
      return `<p style="margin: 4px 0; font-size: 10pt; color: #1e293b;">${escapeHtml(
        line
      )}</p>`;
    })
    .join('');
}

export function exportDOCX(
  header: HeaderData,
  sections: ResumeSection[],
  template: TemplateId
) {
  const isSplitTeal = template === 'split-teal';
  const accentColor = isSplitTeal ? '#1F6E6E' : '#222222';

  const contactItems = [
    header.address,
    header.phone,
    header.email,
    header.linkedin,
    header.github,
    header.portfolio,
  ]
    .filter((v) => v && v.trim())
    .map((v) => escapeHtml(v.trim()));

  let bodyHtml = '';

  if (isSplitTeal) {
    const sidebarTypes = new Set(['skills', 'education', 'languages']);
    const leftSections = sections.filter(
      (s) => !sidebarTypes.has(s.type.toLowerCase())
    );
    const rightSections = sections.filter((s) =>
      sidebarTypes.has(s.type.toLowerCase())
    );

    const renderBlock = (sec: ResumeSection) => {
      const isSummary = sec.type.toLowerCase() === 'summary';
      const headingText =
        isSummary && header.title ? header.title : sec.title.toUpperCase();
      const headingStyle = isSummary
        ? `font-size: 11.5pt; font-weight: 700; color: #0f172a; margin: 0 0 6px 0;`
        : `font-size: 10.5pt; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: #1F6E6E; border-bottom: 1px solid #cbd5e1; padding-bottom: 3px; margin: 14px 0 6px 0;`;

      return `
        <div>
          <h2 style="${headingStyle}">${escapeHtml(headingText)}</h2>
          <div>${formatSectionLinesHtml(sec.content, true, sec.type)}</div>
        </div>
      `;
    };

    bodyHtml = `
      <div style="text-align: center; border-bottom: 1.5px solid #334155; padding-bottom: 10px; margin-bottom: 14px;">
        <h1 style="font-size: 20pt; font-weight: 700; letter-spacing: 0.04em; text-transform: uppercase; color: #1F6E6E; margin: 0;">
          ${escapeHtml(header.name || 'Candidate Name')}
        </h1>
        ${
          contactItems.length > 0
            ? `<p style="font-size: 9.5pt; color: #334155; margin: 5px 0 0 0;">${contactItems.join(
                ' &nbsp;•&nbsp; '
              )}</p>`
            : ''
        }
      </div>
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="width: 67%; vertical-align: top; padding-right: 18px;">
            ${leftSections.map(renderBlock).join('')}
          </td>
          <td style="width: 33%; vertical-align: top; padding-left: 8px;">
            ${rightSections.map(renderBlock).join('')}
          </td>
        </tr>
      </table>
    `;
  } else {
    const sectionsHtml = sections
      .map(
        (sec) => `
        <div style="margin-top: 13px;">
          <h2 style="font-size: 11pt; font-weight: 700; text-transform: uppercase; letter-spacing: 0.04em; color: #222222; border-bottom: 1.5px solid #222222; padding-bottom: 2px; margin-bottom: 6px;">
            ${escapeHtml(sec.title)}
          </h2>
          <div>${formatSectionLinesHtml(sec.content, false, sec.type)}</div>
        </div>
      `
      )
      .join('');

    bodyHtml = `
      <div style="text-align: center; margin-bottom: 14px;">
        <h1 style="font-size: 20pt; font-weight: 700; text-transform: uppercase; letter-spacing: 0.04em; margin: 0; color: ${accentColor};">
          ${escapeHtml(header.name || 'Candidate Name')}
        </h1>
        ${
          header.title
            ? `<p style="font-size: 10.5pt; font-weight: 600; color: #475569; margin: 3px 0 0 0;">${escapeHtml(
                header.title
              )}</p>`
            : ''
        }
        ${
          contactItems.length > 0
            ? `<p style="font-size: 9pt; color: #475569; margin: 5px 0 0 0;">${contactItems.join(
                ' &nbsp;|&nbsp; '
              )}</p>`
            : ''
        }
      </div>
      ${sectionsHtml}
    `;
  }

  const docHtml = `
    <html xmlns:o="urn:schemas-microsoft-com:office:office"
          xmlns:w="urn:schemas-microsoft-com:office:word"
          xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <meta charset="utf-8" />
        <title>${escapeHtml(header.name || 'Resume')}</title>
        <style>
          body { font-family: Georgia, 'Times New Roman', serif; line-height: 1.42; color: #1e293b; margin: 24px; }
          ul { margin: 4px 0 8px 18px; padding: 0; }
        </style>
      </head>
      <body>
        ${bodyHtml}
      </body>
    </html>
  `;

  const blob = new Blob(['\ufeff', docHtml], {
    type: 'application/msword',
  });
  triggerDownload(blob, `${safeSlug(header.name)}_ATS_Resume.doc`);
}
