import * as pdfjsLib from 'pdfjs-dist';
import mammoth from 'mammoth';
import type { HeaderData, ResumeSection } from '../types';

// Configure PDF.js worker via Vite-compatible URL resolution
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url
).toString();

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5MB

export async function parseResumeFile(file: File): Promise<string> {
  if (file.size > MAX_FILE_SIZE_BYTES) {
    throw new Error('File exceeds the 5MB limit. Please upload a smaller file.');
  }

  const nameLower = file.name.toLowerCase();

  if (nameLower.endsWith('.pdf') || file.type === 'application/pdf') {
    const arrayBuffer = await file.arrayBuffer();
    const loadingTask = pdfjsLib.getDocument({ data: new Uint8Array(arrayBuffer) });
    const pdf = await loadingTask.promise;
    const pageTexts: string[] = [];

    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const content = await page.getTextContent();
      const strings = content.items
        .map((item) => ('str' in item && typeof item.str === 'string' ? item.str : ''))
        .filter(Boolean);
      pageTexts.push(strings.join(' '));
    }

    const extracted = pageTexts.join('\n\n').replace(/[ \t]{2,}/g, ' ').trim();
    if (!extracted) {
      throw new Error(
        'Could not extract selectable text from this PDF. If it is a scanned image PDF, please paste your resume text instead.'
      );
    }
    return extracted;
  }

  if (
    nameLower.endsWith('.docx') ||
    file.type ===
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ) {
    const arrayBuffer = await file.arrayBuffer();
    const result = await mammoth.extractRawText({ arrayBuffer });
    const extracted = (result.value || '').trim();
    if (!extracted) {
      throw new Error('No readable text found inside the DOCX file.');
    }
    return extracted;
  }

  if (nameLower.endsWith('.txt') || file.type.startsWith('text/')) {
    const text = (await file.text()).trim();
    if (!text) {
      throw new Error('The uploaded text file is empty.');
    }
    return text;
  }

  throw new Error(
    'Unsupported file format. Please upload a PDF, DOCX, or TXT file.'
  );
}

/**
 * Computes a deterministic, real-time local keyword scan between resume and JD
 * for Step 1 readiness preview before invoking the Gemini AI analysis.
 */
export function computeLocalKeywordScan(
  resumeText: string,
  jobDescription: string
): {
  matchedCount: number;
  totalKeywords: number;
  overlapPercent: number;
  missingPreview: string[];
} {
  const stopWords = new Set([
    'about', 'above', 'after', 'again', 'against', 'all', 'also', 'and', 'any',
    'are', 'because', 'been', 'before', 'being', 'between', 'both', 'build',
    'building', 'business', 'can', 'company', 'could', 'cross', 'data', 'days',
    'deliver', 'design', 'develop', 'each', 'ensure', 'experience', 'for',
    'from', 'good', 'have', 'help', 'high', 'including', 'into', 'job',
    'knowledge', 'lead', 'looking', 'make', 'more', 'most', 'must', 'need',
    'new', 'not', 'our', 'out', 'over', 'own', 'part', 'people', 'plus',
    'product', 'products', 'role', 'should', 'skills', 'strong', 'such',
    'support', 'team', 'teams', 'that', 'the', 'their', 'them', 'then',
    'there', 'these', 'they', 'this', 'those', 'through', 'time', 'tools',
    'understanding', 'use', 'using', 'very', 'well', 'what', 'when', 'where',
    'which', 'while', 'who', 'will', 'with', 'work', 'working', 'would',
    'year', 'years', 'you', 'your',
  ]);

  const cleanTokens = (text: string) =>
    text
      .toLowerCase()
      .replace(/[^a-z0-9+#.\s-]/g, ' ')
      .split(/\s+/)
      .filter((t) => t.length >= 3 && !stopWords.has(t));

  const jdTokens = cleanTokens(jobDescription);
  const freq = new Map<string, number>();
  for (const tok of jdTokens) {
    freq.set(tok, (freq.get(tok) ?? 0) + 1);
  }

  const topKeywords = Array.from(freq.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 16)
    .map(([word]) => word);

  if (topKeywords.length === 0) {
    return {
      matchedCount: 0,
      totalKeywords: 0,
      overlapPercent: 0,
      missingPreview: [],
    };
  }

  const resumeLower = resumeText.toLowerCase();
  const matched: string[] = [];
  const missing: string[] = [];

  for (const kw of topKeywords) {
    if (resumeLower.includes(kw)) {
      matched.push(kw);
    } else {
      missing.push(kw);
    }
  }

  return {
    matchedCount: matched.length,
    totalKeywords: topKeywords.length,
    overlapPercent: Math.round((matched.length / topKeywords.length) * 100),
    missingPreview: missing.slice(0, 6),
  };
}

/**
 * Lightweight parser to populate an initial structured preview from raw resume text
 * for Step 3 template selection prior to Step 4 AI refinement.
 */
export function parseRawResumeToDraft(
  resumeText: string,
  jobTitle: string
): { header: HeaderData; sections: ResumeSection[] } {
  const lines = resumeText
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  const emailMatch = resumeText.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i);
  const phoneMatch = resumeText.match(
    /(?:\+?\d{1,3}[\s.-]?)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}/
  );
  const linkedinMatch = resumeText.match(/linkedin\.com\/in\/[^\s|,;]+/i);
  const githubMatch = resumeText.match(/github\.com\/[^\s|,;]+/i);

  const firstLine = lines[0] || 'Candidate Name';
  const name =
    firstLine.length <= 48 && !firstLine.includes('@')
      ? firstLine
      : 'Candidate Name';

  const header: HeaderData = {
    name,
    title: jobTitle || 'Professional',
    email: emailMatch ? emailMatch[0] : '',
    phone: phoneMatch ? phoneMatch[0] : '',
    address: '',
    linkedin: linkedinMatch ? `https://${linkedinMatch[0]}` : '',
    github: githubMatch ? `https://${githubMatch[0]}` : '',
    portfolio: '',
  };

  const sectionMatchers: Array<{ key: string; regex: RegExp }> = [
    { key: 'Summary', regex: /^(summary|profile|objective|about me)$/i },
    { key: 'Skills', regex: /^(skills|technical skills|core competencies)$/i },
    {
      key: 'Experience',
      regex: /^(experience|work experience|professional experience|employment)$/i,
    },
    { key: 'Projects', regex: /^(projects|key projects)$/i },
    { key: 'Education', regex: /^(education|academic background)$/i },
    { key: 'Certifications', regex: /^(certifications|licenses|certificates)$/i },
    { key: 'Languages', regex: /^(languages)$/i },
  ];

  const sections: ResumeSection[] = [];
  let currentType = 'Summary';
  let currentTitle = 'Summary';
  let buffer: string[] = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    const cleanHeading = line.replace(/[:\-_]+$/, '').trim();
    const matched = sectionMatchers.find((m) => m.regex.test(cleanHeading));

    if (matched) {
      if (buffer.length > 0) {
        sections.push({
          id: `draft-${sections.length}-${Date.now()}`,
          type: currentType,
          title: currentTitle,
          content: buffer.join('\n'),
        });
      }
      currentType = matched.key;
      currentTitle = matched.key;
      buffer = [];
    } else {
      buffer.push(line);
    }
  }

  if (buffer.length > 0) {
    sections.push({
      id: `draft-${sections.length}-${Date.now()}`,
      type: currentType,
      title: currentTitle,
      content: buffer.join('\n'),
    });
  }

  if (sections.length === 0 && resumeText.trim()) {
    sections.push({
      id: `draft-0-${Date.now()}`,
      type: 'Summary',
      title: 'Professional Overview',
      content: resumeText.trim(),
    });
  }

  return { header, sections };
}

export const SAMPLE_RESUME_TEXT = `Jordan Davis
Senior Product Manager
jordan.davis@email.com | (415) 555-0192 | San Francisco, CA | linkedin.com/in/jordandavis

SUMMARY
Product Manager with 6+ years of experience leading B2B SaaS growth, cross-functional engineering squads, and data-driven product launches. Delivered measurable adoption and retention gains across analytics and workflow platforms.

SKILLS
Product Strategy, Product Roadmap, Agile/Scrum, SQL, A/B Testing, User Research, Jira, Figma, Amplitude, Stakeholder Alignment

EXPERIENCE
Senior Product Manager | CloudFlow Systems | 2022 - Present | San Francisco, CA
- Owned the end-to-end roadmap for the enterprise analytics suite serving 120K+ monthly active users.
- Partnered with engineering and design to launch self-serve onboarding, reducing time-to-value by 34%.
- Conducted 50+ customer discovery interviews and prioritized high-impact features that increased NRR by 11%.

Product Manager | MetricPulse | 2019 - 2022 | Austin, TX
- Led two cross-functional squads of 12 engineers and designers to rebuild reporting dashboards.
- Defined KPIs, ran SQL funnel analyses, and launched automated alerts that improved weekly engagement by 24%.

PROJECTS
Self-Serve Analytics Onboarding Redesign | Amplitude, SQL, Figma
- Redesigned multi-step product activation flow, lifting day-7 retention from 41% to 59%.

EDUCATION
B.S. in Business Administration & Information Systems | University of Texas at Austin | Austin, TX | 2018

CERTIFICATIONS
Certified Scrum Product Owner (CSPO)`;

export const SAMPLE_JOB_TITLE = 'Senior Product Manager, AI Platform';
export const SAMPLE_COMPANY = 'Vanguard Cloud';
export const SAMPLE_JOB_DESCRIPTION = `We are seeking a Senior Product Manager to drive strategy and execution for our enterprise AI workflow platform.

Responsibilities:
- Define the product vision, multi-quarter roadmap, and go-to-market strategy in close partnership with engineering, design, and data science.
- Lead stakeholder management across executive leadership, customer success, and enterprise sales.
- Analyze product telemetry using SQL, Python, and experimentation frameworks to optimize activation and retention.
- Architect scalable integrations across GCP and modern cloud data warehouses.
- Conduct continuous user research, competitive benchmarking, and prioritization of high-ROI platform capabilities.

Qualifications:
- 5+ years of product management experience in B2B SaaS, developer tools, or cloud infrastructure.
- Proficiency with SQL, A/B testing, roadmap planning, and stakeholder management; familiarity with Python and GCP is strongly preferred.
- Proven track record of shipping measurable business outcomes and leading cross-functional agile teams.`;
