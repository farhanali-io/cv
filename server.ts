import 'dotenv/config';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = 3000;
const MODEL_NAME = 'gemini-4-hydrogen';

const SYSTEM_INSTRUCTION =
  "You are ATS Resume Expert. Never invent fake jobs. Only rewrite user's real experience. Return ONLY valid JSON.";

function getAiClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    throw new Error(
      'GEMINI_API_KEY is not configured. Please add a valid Gemini API key in Settings > Secrets.'
    );
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

function parseJsonSafe<T>(raw: string | undefined, fallbackError: string): T {
  if (!raw) {
    throw new Error(fallbackError);
  }
  const cleaned = raw
    .trim()
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();
  return JSON.parse(cleaned) as T;
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '5mb' }));

  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok' });
  });

  app.post('/api/analyze', async (req, res) => {
    try {
      const { resumeText, jobTitle, company, jobDescription } = req.body ?? {};
      if (!resumeText || !jobTitle || !jobDescription) {
        res.status(400).json({
          error: 'resumeText, jobTitle, and jobDescription are required.',
        });
        return;
      }

      const ai = getAiClient();
      const prompt = `Analyze the following resume against the target job description.
Target Job Title: ${jobTitle}
${company ? `Target Company: ${company}` : ''}

Target Job Description:
${jobDescription}

Candidate Resume:
${resumeText}

Evaluate strictly and accurately:
1. overall (0-100): holistic readiness for this role
2. ats (0-100): formatting clarity, standard headings, parseability, contact completeness, quantified impact
3. matching (0-100): alignment of skills, tools, responsibilities, and domain terminology with the job description
4. missingKeywords: 6 to 12 high-value keywords/skills present in the Job Description that are missing or underrepresented in the resume
5. suggestions: 6 to 8 specific, actionable improvements split across "ATS" (formatting, sections, parsing, action verbs) and "Matching" (skills, metrics, domain alignment). Never suggest inventing fake jobs or false credentials.`;

      const response = await ai.models.generateContent({
        model: MODEL_NAME,
        contents: prompt,
        config: {
          systemInstruction: SYSTEM_INSTRUCTION,
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              overall: { type: Type.INTEGER },
              ats: { type: Type.INTEGER },
              matching: { type: Type.INTEGER },
              missingKeywords: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
              },
              suggestions: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    type: { type: Type.STRING },
                    text: { type: Type.STRING },
                  },
                  required: ['type', 'text'],
                },
              },
            },
            required: [
              'overall',
              'ats',
              'matching',
              'missingKeywords',
              'suggestions',
            ],
          },
        },
      });

      const parsed = parseJsonSafe<{
        overall: number;
        ats: number;
        matching: number;
        missingKeywords: string[];
        suggestions: Array<{ type: string; text: string }>;
      }>(response.text, 'Empty response from Gemini during analysis.');

      const normalized = {
        overall: Math.max(0, Math.min(100, Math.round(parsed.overall ?? 0))),
        ats: Math.max(0, Math.min(100, Math.round(parsed.ats ?? 0))),
        matching: Math.max(0, Math.min(100, Math.round(parsed.matching ?? 0))),
        missingKeywords: Array.isArray(parsed.missingKeywords)
          ? parsed.missingKeywords.slice(0, 15)
          : [],
        suggestions: Array.isArray(parsed.suggestions)
          ? parsed.suggestions.map((s, idx) => ({
              id: `sug-${idx}-${Date.now()}`,
              type: s.type === 'ATS' ? ('ATS' as const) : ('Matching' as const),
              text: s.text,
            }))
          : [],
      };

      res.json(normalized);
    } catch (error) {
      console.error('Analyze error:', error);
      const message =
        error instanceof Error ? error.message : 'Failed to analyze resume.';
      res.status(500).json({ error: message });
    }
  });

  app.post('/api/refine', async (req, res) => {
    try {
      const {
        resumeText,
        jobTitle,
        company,
        jobDescription,
        template,
        pageCount,
        appliedKeywords = [],
        appliedSuggestions = [],
        attempt = 1,
        previousSections,
        previousScores,
      } = req.body ?? {};

      if (!resumeText || !jobTitle || !jobDescription) {
        res.status(400).json({
          error: 'resumeText, jobTitle, and jobDescription are required.',
        });
        return;
      }

      const ai = getAiClient();

      const sourceMaterial = previousSections
        ? `Previous refined sections JSON:\n${JSON.stringify(previousSections, null, 2)}`
        : `Original Resume Text:\n${resumeText}`;

      const templateGuide =
        template === 'classic-ats'
          ? 'Classic ATS Single-Column (centered uppercase serif header with icon contact strip, full-width dark horizontal rules under SUMMARY, EXPERIENCE, PROJECTS, EDUCATION, SKILLS)'
          : 'Two-Column Teal (centered uppercase teal header with bullet-separated contact strip and full-width rule, left 67% column for Target Title + Summary, WORK EXPERIENCE, PROJECTS, and right 33% sidebar for SKILLS and EDUCATION)';

      const prompt = `Rebuild and optimize the candidate's resume for the target role (Attempt ${attempt}/3).
Target Job Title: ${jobTitle}
${company ? `Target Company: ${company}` : ''}
Selected Template Style: ${templateGuide}
Target Length: ${pageCount === 2 ? '2 Pages (detailed bullet points)' : '1 Page (concise, high-impact)'}

Keywords the candidate confirmed to highlight (if truthful to their background): ${
        appliedKeywords.length > 0 ? appliedKeywords.join(', ') : 'None specified'
      }
Applied improvement suggestions: ${
        appliedSuggestions.length > 0
          ? appliedSuggestions.join(' | ')
          : 'General ATS optimization'
      }
${
  previousScores
    ? `Previous attempt scores: Overall=${previousScores.overall}, ATS=${previousScores.ats}, Matching=${previousScores.matching}. Improve weak areas so the resume achieves >= 85 overall while staying 100% truthful to the candidate's real experience.`
    : ''
}

Target Job Description:
${jobDescription}

${sourceMaterial}

Rules:
- NEVER invent fake jobs, degrees, employers, certifications, or fabricated metrics. Only strengthen phrasing, structure, action verbs, ATS keyword alignment, and clarity of the candidate's real background.
- Extract or preserve the candidate's Header fields (name, title, email, phone, address, linkedin, github, portfolio). Use empty string "" for missing optional contact fields.
- Return structured sections from: Summary, Skills, Experience, Projects, Education, Certifications, Languages (include only sections that have real content from the resume; always include Summary, Experience, Projects, Education, Skills when present).
- For Experience content, format each role cleanly as:
  Role Title | Company | Dates | Location
  - Achievement bullet starting with strong action verb
- For Projects content, format each project cleanly as:
  Project Title | Tech Stack or Tools
  - Impact or implementation detail
- For Education content, format each degree cleanly as:
  Degree Name | Institution | Location | Date
- For Skills content:
  ${
    template === 'classic-ats'
      ? 'Group cleanly into 3-4 concise lines or comma-separated skill groups.'
      : 'List core skills one per line prefixed with "- " (bullet list) for crisp sidebar display.'
  }
- Score the newly rebuilt resume honestly in newScores (overall, ats, matching from 0-100).`;

      const response = await ai.models.generateContent({
        model: MODEL_NAME,
        contents: prompt,
        config: {
          systemInstruction: SYSTEM_INSTRUCTION,
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              header: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  title: { type: Type.STRING },
                  email: { type: Type.STRING },
                  phone: { type: Type.STRING },
                  address: { type: Type.STRING },
                  linkedin: { type: Type.STRING },
                  github: { type: Type.STRING },
                  portfolio: { type: Type.STRING },
                },
                required: [
                  'name',
                  'title',
                  'email',
                  'phone',
                  'address',
                  'linkedin',
                  'github',
                  'portfolio',
                ],
              },
              sections: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    type: { type: Type.STRING },
                    title: { type: Type.STRING },
                    content: { type: Type.STRING },
                  },
                  required: ['type', 'title', 'content'],
                },
              },
              newScores: {
                type: Type.OBJECT,
                properties: {
                  overall: { type: Type.INTEGER },
                  ats: { type: Type.INTEGER },
                  matching: { type: Type.INTEGER },
                },
                required: ['overall', 'ats', 'matching'],
              },
              improvementSummary: { type: Type.STRING },
            },
            required: ['header', 'sections', 'newScores', 'improvementSummary'],
          },
        },
      });

      const parsed = parseJsonSafe<{
        header: {
          name: string;
          title: string;
          email: string;
          phone: string;
          address: string;
          linkedin: string;
          github: string;
          portfolio: string;
        };
        sections: Array<{ type: string; title: string; content: string }>;
        newScores: { overall: number; ats: number; matching: number };
        improvementSummary: string;
      }>(response.text, 'Empty response from Gemini during refinement.');

      const normalized = {
        header: parsed.header,
        sections: (parsed.sections || []).map((sec, idx) => ({
          id: `sec-${idx}-${Date.now()}`,
          type: sec.type || 'Summary',
          title: sec.title || sec.type || 'Section',
          content: sec.content || '',
        })),
        newScores: {
          overall: Math.max(
            0,
            Math.min(100, Math.round(parsed.newScores?.overall ?? 0))
          ),
          ats: Math.max(
            0,
            Math.min(100, Math.round(parsed.newScores?.ats ?? 0))
          ),
          matching: Math.max(
            0,
            Math.min(100, Math.round(parsed.newScores?.matching ?? 0))
          ),
        },
        improvementSummary:
          parsed.improvementSummary ||
          'Optimized resume phrasing, ATS structure, and keyword alignment.',
      };

      res.json(normalized);
    } catch (error) {
      console.error('Refine error:', error);
      const message =
        error instanceof Error ? error.message : 'Failed to refine resume.';
      res.status(500).json({ error: message });
    }
  });

  app.post('/api/rewrite', async (req, res) => {
    try {
      const {
        sectionTitle,
        sectionContent,
        jobTitle,
        company,
        jobDescription,
      } = req.body ?? {};

      if (!sectionTitle || !sectionContent) {
        res
          .status(400)
          .json({ error: 'sectionTitle and sectionContent are required.' });
        return;
      }

      const ai = getAiClient();
      const prompt = `Rewrite and improve the following resume section to maximize ATS readability and alignment with the target role. Never invent fake jobs, companies, degrees, or fabricated accomplishments. Keep formatting clean (use "- " for bullets, and "Role | Company | Dates | Location" for role headings if applicable).

Target Job Title: ${jobTitle || 'Target Role'}
${company ? `Target Company: ${company}` : ''}
Job Description Excerpt:
${(jobDescription || '').slice(0, 1500)}

Section Title: ${sectionTitle}
Current Section Content:
${sectionContent}`;

      const response = await ai.models.generateContent({
        model: MODEL_NAME,
        contents: prompt,
        config: {
          systemInstruction: SYSTEM_INSTRUCTION,
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              improvedText: { type: Type.STRING },
            },
            required: ['improvedText'],
          },
        },
      });

      const parsed = parseJsonSafe<{ improvedText: string }>(
        response.text,
        'Empty response from Gemini during section rewrite.'
      );

      res.json({ improvedText: parsed.improvedText });
    } catch (error) {
      console.error('Rewrite error:', error);
      const message =
        error instanceof Error ? error.message : 'Failed to rewrite section.';
      res.status(500).json({ error: message });
    }
  });

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`ResumeAI server running on http://localhost:${PORT}`);
  });
}

startServer();
