import 'dotenv/config';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = 3000;
const MODEL_NAME = 'gemini-3.8-flash';
const SYSTEM_INSTRUCTION =
  "You are ATS Resume Expert. Never invent fake jobs. Only rewrite user's real experience. Return ONLY valid JSON.";

// ============ FALLBACK CHAIN: GROQ -> OPENROUTER -> GEMINI ============

function parseJsonSafe<T>(raw: string | undefined, fallbackError: string): T {
  if (!raw) throw new Error(fallbackError);
  const cleaned = raw.trim().replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/i, '').trim();
  // Groq/OpenRouter kabhi extra text de dete hain, JSON extract karo
  const first = cleaned.indexOf('{');
  const last = cleaned.lastIndexOf('}');
  if (first !== -1 && last !== -1) return JSON.parse(cleaned.slice(first, last + 1)) as T;
  return JSON.parse(cleaned) as T;
}

// 1. GROQ - Sabse Fast
async function callGroq(prompt: string, system: string): Promise<string> {
  if (!process.env.GROQ_API_KEY) throw new Error('GROQ_API_KEY missing');
  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: { "Authorization": `Bearer ${process.env.GROQ_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "openai/gpt-oss-120b",
      messages: [
        { role: "system", content: system + " Return ONLY valid JSON." },
        { role: "user", content: prompt }
      ],
      temperature: 0.3,
      response_format: { type: "json_object" },
    }),
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`Groq ${res.status}: ${t.slice(0, 200)}`);
  }
  const data: any = await res.json();
  return data.choices[0].message.content;
}

// 2. OPENROUTER
async function callOpenRouter(prompt: string, system: string): Promise<string> {
  if (!process.env.OPENROUTER_API_KEY) throw new Error('OPENROUTER_API_KEY missing');
  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
      "Content-Type": "application/json",
      "HTTP-Referer": "http://localhost:3000",
      "X-Title": "ResumeAI"
    },
    body: JSON.stringify({
      model: "google/gemma-3-27b-it:free",
      messages: [
        { role: "system", content: system + " Return ONLY valid JSON." },
        { role: "user", content: prompt }
      ],
      temperature: 0.3,
      response_format: { type: "json_object" },
    }),
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`OpenRouter ${res.status}: ${t.slice(0, 200)}`);
  }
  const data: any = await res.json();
  return data.choices[0].message.content;
}

// 3. GEMINI - Last Resort (purana SDK wala)
async function callGemini(prompt: string, system: string, schema: any): Promise<string> {
  if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === 'MY_GEMINI_API_KEY') {
    throw new Error('GEMINI_API_KEY missing');
  }
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY, httpOptions: { headers: { 'User-Agent': 'aistudio-build' } } });
  const response = await ai.models.generateContent({
    model: MODEL_NAME,
    contents: prompt,
    config: { systemInstruction: system, responseMimeType: 'application/json', responseSchema: schema },
  });
  if (!response.text) throw new Error('Empty Gemini response');
  return response.text;
}

// Master function - teeno ko try karta hai
async function generateWithFallback(prompt: string, schema: any, label: string): Promise<string> {
  const errors: string[] = [];
  try { console.log(`[${label}] Trying Groq...`); return await callGroq(prompt, SYSTEM_INSTRUCTION); }
  catch (e: any) { console.log(`[${label}] Groq failed:`, e.message); errors.push(e.message); }

  try { console.log(`[${label}] Trying OpenRouter...`); return await callOpenRouter(prompt, SYSTEM_INSTRUCTION); }
  catch (e: any) { console.log(`[${label}] OpenRouter failed:`, e.message); errors.push(e.message); }

  try { console.log(`[${label}] Trying Gemini...`); return await callGemini(prompt, SYSTEM_INSTRUCTION, schema); }
  catch (e: any) { console.log(`[${label}] Gemini failed:`, e.message); errors.push(e.message); }

  throw new Error(`All 3 AI providers failed: ${errors.join(' | ')}`);
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '5mb' }));

  app.get('/api/health', (_req, res) => {
    res.json({
      status: 'ok',
      providers: {
        groq: !!process.env.GROQ_API_KEY,
        openrouter: !!process.env.OPENROUTER_API_KEY,
        gemini: !!process.env.GEMINI_API_KEY
      }
    });
  });

  // ---------- ANALYZE ----------
  app.post('/api/analyze', async (req, res) => {
    try {
      const { resumeText, jobTitle, company, jobDescription } = req.body ?? {};
      if (!resumeText || !jobTitle || !jobDescription) {
        res.status(400).json({ error: 'resumeText, jobTitle, and jobDescription are required.' });
        return;
      }
      const prompt = `Analyze the following resume against the target job description.
Target Job Title: ${jobTitle}
${company ? `Target Company: ${company}` : ''}
Target Job Description:\n${jobDescription}\nCandidate Resume:\n${resumeText}\n
Evaluate strictly:
1. overall (0-100), 2. ats (0-100), 3. matching (0-100)
4. missingKeywords: 6-12 high-value keywords in JD missing in resume
5. suggestions: 6-8 actionable improvements split ATS and Matching. Never suggest inventing fake jobs.`;

      const schema = {
        type: Type.OBJECT,
        properties: {
          overall: { type: Type.INTEGER }, ats: { type: Type.INTEGER }, matching: { type: Type.INTEGER },
          missingKeywords: { type: Type.ARRAY, items: { type: Type.STRING } },
          suggestions: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { type: { type: Type.STRING }, text: { type: Type.STRING } }, required: ['type', 'text'] } },
        },
        required: ['overall', 'ats', 'matching', 'missingKeywords', 'suggestions'],
      };

      const raw = await generateWithFallback(prompt, schema, 'analyze');
      const parsed = parseJsonSafe<any>(raw, 'Empty response during analysis.');
      res.json({
        overall: Math.max(0, Math.min(100, Math.round(parsed.overall ?? 0))),
        ats: Math.max(0, Math.min(100, Math.round(parsed.ats ?? 0))),
        matching: Math.max(0, Math.min(100, Math.round(parsed.matching ?? 0))),
        missingKeywords: Array.isArray(parsed.missingKeywords) ? parsed.missingKeywords.slice(0, 15) : [],
        suggestions: Array.isArray(parsed.suggestions) ? parsed.suggestions.map((s: any, idx: number) => ({ id: `sug-${idx}-${Date.now()}`, type: s.type === 'ATS' ? 'ATS' as const : 'Matching' as const, text: s.text })) : [],
      });
    } catch (error) {
      console.error('Analyze error:', error);
      res.status(500).json({ error: error instanceof Error ? error.message : 'Failed to analyze resume.' });
    }
  });

  // ---------- REFINE ----------
  app.post('/api/refine', async (req, res) => {
    try {
      const { resumeText, jobTitle, company, jobDescription, template, pageCount, appliedKeywords = [], appliedSuggestions = [], attempt = 1, previousSections, previousScores } = req.body ?? {};
      if (!resumeText || !jobTitle || !jobDescription) {
        res.status(400).json({ error: 'resumeText, jobTitle, and jobDescription are required.' });
        return;
      }
      const sourceMaterial = previousSections ? `Previous refined sections JSON:\n${JSON.stringify(previousSections, null, 2)}` : `Original Resume Text:\n${resumeText}`;
      const templateGuide = template === 'classic-ats' ? 'Classic ATS Single-Column' : 'Two-Column Teal';
      const prompt = `Rebuild and optimize resume for target role (Attempt ${attempt}/3).
Target Job Title: ${jobTitle} ${company ? `Company: ${company}` : ''} Template: ${templateGuide} Length: ${pageCount === 2 ? '2 Pages' : '1 Page'}
Keywords to highlight: ${appliedKeywords.length > 0 ? appliedKeywords.join(', ') : 'None'}
Suggestions: ${appliedSuggestions.length > 0 ? appliedSuggestions.join(' | ') : 'General ATS optimization'}
${previousScores ? `Previous scores: Overall=${previousScores.overall}, ATS=${previousScores.ats}, Matching=${previousScores.matching}. Improve to >=85 overall.` : ''}
Job Description:\n${jobDescription}\n${sourceMaterial}\n
Rules: NEVER invent fake jobs/degrees/metrics. Only strengthen real experience. Extract Header (name,title,email,phone,address,linkedin,github,portfolio) use "" if missing. Return sections: Summary, Skills, Experience, Projects, Education, Certifications, Languages. Experience format: Role Title | Company | Dates | Location + bullets with action verbs. Score new resume in newScores.`;

      const schema = {
        type: Type.OBJECT,
        properties: {
          header: { type: Type.OBJECT, properties: { name: { type: Type.STRING }, title: { type: Type.STRING }, email: { type: Type.STRING }, phone: { type: Type.STRING }, address: { type: Type.STRING }, linkedin: { type: Type.STRING }, github: { type: Type.STRING }, portfolio: { type: Type.STRING } }, required: ['name','title','email','phone','address','linkedin','github','portfolio'] },
          sections: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { type: { type: Type.STRING }, title: { type: Type.STRING }, content: { type: Type.STRING } }, required: ['type','title','content'] } },
          newScores: { type: Type.OBJECT, properties: { overall: { type: Type.INTEGER }, ats: { type: Type.INTEGER }, matching: { type: Type.INTEGER } }, required: ['overall','ats','matching'] },
          improvementSummary: { type: Type.STRING },
        },
        required: ['header', 'sections', 'newScores', 'improvementSummary'],
      };

      const raw = await generateWithFallback(prompt, schema, 'refine');
      const parsed = parseJsonSafe<any>(raw, 'Empty response during refinement.');
      res.json({
        header: parsed.header,
        sections: (parsed.sections || []).map((sec: any, idx: number) => ({ id: `sec-${idx}-${Date.now()}`, type: sec.type || 'Summary', title: sec.title || sec.type || 'Section', content: sec.content || '' })),
        newScores: { overall: Math.max(0, Math.min(100, Math.round(parsed.newScores?.overall ?? 0))), ats: Math.max(0, Math.min(100, Math.round(parsed.newScores?.ats ?? 0))), matching: Math.max(0, Math.min(100, Math.round(parsed.newScores?.matching ?? 0))) },
        improvementSummary: parsed.improvementSummary || 'Optimized resume phrasing, ATS structure, and keyword alignment.',
      });
    } catch (error) {
      console.error('Refine error:', error);
      res.status(500).json({ error: error instanceof Error ? error.message : 'Failed to refine resume.' });
    }
  });

  // ---------- REWRITE ----------
  app.post('/api/rewrite', async (req, res) => {
    try {
      const { sectionTitle, sectionContent, jobTitle, company, jobDescription } = req.body ?? {};
      if (!sectionTitle || !sectionContent) {
        res.status(400).json({ error: 'sectionTitle and sectionContent are required.' });
        return;
      }
      const prompt = `Rewrite this resume section for ATS + target role. Never invent fake jobs. Keep clean formatting (use "- " bullets).
Target: ${jobTitle || 'Target Role'} ${company ? `Company: ${company}` : ''} JD: ${(jobDescription || '').slice(0, 1500)}
Section: ${sectionTitle}\nContent:\n${sectionContent}`;
      const schema = { type: Type.OBJECT, properties: { improvedText: { type: Type.STRING } }, required: ['improvedText'] };
      const raw = await generateWithFallback(prompt, schema, 'rewrite');
      const parsed = parseJsonSafe<any>(raw, 'Empty response during rewrite.');
      res.json({ improvedText: parsed.improvedText });
    } catch (error) {
      console.error('Rewrite error:', error);
      res.status(500).json({ error: error instanceof Error ? error.message : 'Failed to rewrite section.' });
    }
  });

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({ server: { middlewareMode: true }, appType: 'spa' });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => { res.sendFile(path.join(distPath, 'index.html')); });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`ResumeAI server running on http://localhost:${PORT}`);
    console.log(`Providers: Groq=${!!process.env.GROQ_API_KEY} OpenRouter=${!!process.env.OPENROUTER_API_KEY} Gemini=${!!process.env.GEMINI_API_KEY}`);
  });
}

startServer();
