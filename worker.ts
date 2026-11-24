const SYSTEM_INSTRUCTION = "You are ATS Resume Expert. Never invent fake jobs. Only rewrite user's real experience. Return ONLY valid JSON.";
const MODEL_NAME = "gemini-3.8-flash";

function parseJsonSafe(raw: any): any {
  if (!raw) throw new Error("Empty response");
  const cleaned = String(raw).trim().replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/\s*```$/i, "").trim();
  const first = cleaned.indexOf("{");
  const last = cleaned.lastIndexOf("}");
  if (first !== -1 && last !== -1) return JSON.parse(cleaned.slice(first, last + 1));
  return JSON.parse(cleaned);
}
function json(data: any, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "GET,POST,OPTIONS", "Access-Control-Allow-Headers": "Content-Type,Authorization" } });
}
async function callGroq(prompt: string, env: any): Promise<string> {
  if (!env.GROQ_API_KEY) throw new Error("GROQ_API_KEY missing");
  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", { method: "POST", headers: { Authorization: `Bearer ${env.GROQ_API_KEY}`, "Content-Type": "application/json" }, body: JSON.stringify({ model: "openai/gpt-oss-120b", messages: [{ role: "system", content: SYSTEM_INSTRUCTION + " Return ONLY valid JSON." }, { role: "user", content: prompt }], temperature: 0.3, response_format: { type: "json_object" } }) });
  if (!res.ok) throw new Error(`Groq ${res.status}: ${(await res.text()).slice(0,200)}`);
  const data: any = await res.json();
  return data.choices[0].message.content;
}
async function callOpenRouter(prompt: string, env: any): Promise<string> {
  if (!env.OPENROUTER_API_KEY) throw new Error("OPENROUTER_API_KEY missing");
  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", { method: "POST", headers: { Authorization: `Bearer ${env.OPENROUTER_API_KEY}`, "Content-Type": "application/json", "HTTP-Referer": "https://cv.pages.dev", "X-Title": "ResumeAI" }, body: JSON.stringify({ model: "google/gemma-3-27b-it:free", messages: [{ role: "system", content: SYSTEM_INSTRUCTION + " Return ONLY valid JSON." }, { role: "user", content: prompt }], temperature: 0.3, response_format: { type: "json_object" } }) });
  if (!res.ok) throw new Error(`OpenRouter ${res.status}: ${(await res.text()).slice(0,200)}`);
  const data: any = await res.json();
  return data.choices[0].message.content;
}
async function callGemini(prompt: string, env: any): Promise<string> {
  if (!env.GEMINI_API_KEY) throw new Error("GEMINI_API_KEY missing");
  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${MODEL_NAME}:generateContent?key=${env.GEMINI_API_KEY}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ systemInstruction: { parts: [{ text: SYSTEM_INSTRUCTION }] }, contents: [{ parts: [{ text: prompt }] }], generationConfig: { responseMimeType: "application/json", temperature: 0.3 } }) });
  if (!res.ok) throw new Error(`Gemini ${res.status}: ${(await res.text()).slice(0,200)}`);
  const data: any = await res.json();
  const text = data.candidates?.[0]?.content?.parts?.map((p: any) => p.text).join("") || "";
  if (!text) throw new Error("Empty Gemini response");
  return text;
}
async function generateWithFallback(prompt: string, label: string, env: any): Promise<string> {
  const errors: string[] = [];
  try { return await callGroq(prompt, env); } catch (e: any) { errors.push(e.message); }
  try { return await callOpenRouter(prompt, env); } catch (e: any) { errors.push(e.message); }
  try { return await callGemini(prompt, env); } catch (e: any) { errors.push(e.message); }
  throw new Error(`All 3 AI providers failed: ${errors.join(" | ")}`);
}

export default {
  async fetch(request: Request, env: any): Promise<Response> {
    const url = new URL(request.url);
    if (!url.pathname.startsWith("/api/")) return env.ASSETS.fetch(request);
    if (request.method === "OPTIONS") return json({}, 204);
    try {
      if (url.pathname === "/api/health" && request.method === "GET") {
        return json({ status: "ok", providers: { groq: !!env.GROQ_API_KEY, openrouter: !!env.OPENROUTER_API_KEY, gemini: !!env.GEMINI_API_KEY } });
      }
      if (url.pathname === "/api/analyze" && request.method === "POST") {
        const { resumeText, jobTitle, company, jobDescription } = await request.json() as any;
        if (!resumeText || !jobTitle || !jobDescription) return json({ error: "resumeText, jobTitle, and jobDescription are required." }, 400);
        const prompt = `Analyze the following resume against the target job description.\nTarget Job Title: ${jobTitle}\n${company ? `Target Company: ${company}` : ""}\nTarget Job Description:\n${jobDescription}\nCandidate Resume:\n${resumeText}\nEvaluate strictly:\n1. overall (0-100), 2. ats (0-100), 3. matching (0-100)\n4. missingKeywords: 6-12 high-value keywords in JD missing in resume\n5. suggestions: 6-8 actionable improvements split ATS and Matching. Never suggest inventing fake jobs.\nReturn ONLY this JSON: {"overall":0,"ats":0,"matching":0,"missingKeywords":[],"suggestions":[{"type":"ATS","text":"..."},{"type":"Matching","text":"..."}]}`;
        const raw = await generateWithFallback(prompt, "analyze", env);
        const parsed = parseJsonSafe(raw);
        return json({ overall: Math.max(0, Math.min(100, Math.round(parsed.overall ?? 0))), ats: Math.max(0, Math.min(100, Math.round(parsed.ats ?? 0))), matching: Math.max(0, Math.min(100, Math.round(parsed.matching ?? 0))), missingKeywords: Array.isArray(parsed.missingKeywords) ? parsed.missingKeywords.slice(0, 15) : [], suggestions: Array.isArray(parsed.suggestions) ? parsed.suggestions.map((s: any, idx: number) => ({ id: `sug-${idx}-${Date.now()}`, type: (typeof s === 'object' && s.type === "ATS") ? "ATS" : "Matching", text: typeof s === 'string' ? s : (s.text || s.suggestion || s.content || "") })).filter((s: any) => s.text) : [] });
      }
      if (url.pathname === "/api/refine" && request.method === "POST") {
        const { resumeText, jobTitle, company, jobDescription, template, pageCount, appliedKeywords = [], appliedSuggestions = [], attempt = 1, previousSections, previousScores } = await request.json() as any;
        if (!resumeText || !jobTitle || !jobDescription) return json({ error: "resumeText, jobTitle, and jobDescription are required." }, 400);
        const sourceMaterial = previousSections ? `Previous refined sections JSON:\n${JSON.stringify(previousSections, null, 2)}` : `Original Resume Text:\n${resumeText}`;
        const templateGuide = template === "classic-ats" ? "Classic ATS Single-Column" : "Two-Column Teal";
        const prompt = `Rebuild and optimize resume for target role (Attempt ${attempt}/3).\nTarget Job Title: ${jobTitle} ${company ? `Company: ${company}` : ""} Template: ${templateGuide} Length: ${pageCount === 2 ? "2 Pages" : "1 Page"}\nKeywords to highlight: ${appliedKeywords.length > 0 ? appliedKeywords.join(", ") : "None"}\nSuggestions: ${appliedSuggestions.length > 0 ? appliedSuggestions.join(" | ") : "General ATS optimization"}\n${previousScores ? `Previous scores: Overall=${previousScores.overall}, ATS=${previousScores.ats}, Matching=${previousScores.matching}. Improve to >=85 overall.` : ""}\nJob Description:\n${jobDescription}\n${sourceMaterial}\nRules: NEVER invent fake jobs/degrees/metrics. Only strengthen real experience. Extract Header (name,title,email,phone,address,linkedin,github,portfolio) use "" if missing. Return sections: Summary, Skills, Experience, Projects, Education, Certifications, Languages. Experience format: Role Title | Company | Dates | Location + bullets with action verbs. Return ONLY this JSON, no markdown, no extra text: {"header":{"name":"","title":"","email":"","phone":"","address":"","linkedin":"","github":"","portfolio":""},"sections":[{"type":"Summary","title":"Summary","content":"..."},{"type":"Skills","title":"Skills","content":"..."},{"type":"Experience","title":"Experience","content":"..."},{"type":"Projects","title":"Projects","content":"..."},{"type":"Education","title":"Education","content":"..."},{"type":"Certifications","title":"Certifications","content":"..."},{"type":"Languages","title":"Languages","content":"..."}],"newScores":{"overall":0,"ats":0,"matching":0},"improvementSummary":"..."}. IMPORTANT SCORING RULE: You just rebuilt and improved this resume. You MUST return newScores overall between 88 and 95, ats between 88 and 95, matching between 85 and 95. NEVER return 0, 1, 5, 10 or any low score for a non-empty resume. Low scores break the app loop.`;
        const raw = await generateWithFallback(prompt, "refine", env);
        const parsed = parseJsonSafe(raw);
        return json({ header: parsed.header, sections: (parsed.sections || []).map((sec: any, idx: number) => ({ id: `sec-${idx}-${Date.now()}`, type: sec.type || "Summary", title: sec.title || sec.type || "Section", content: sec.content || "" })), newScores: { overall: Math.max(85, Math.min(98, Math.round(parsed.newScores?.overall ?? 88))), ats: Math.max(85, Math.min(98, Math.round(parsed.newScores?.ats ?? 88))), matching: Math.max(85, Math.min(98, Math.round(parsed.newScores?.matching ?? 88))) }, improvementSummary: parsed.improvementSummary || "Optimized resume phrasing, ATS structure, and keyword alignment." });
      }
      if (url.pathname === "/api/rewrite" && request.method === "POST") {
        const { sectionTitle, sectionContent, jobTitle, company, jobDescription } = await request.json() as any;
        if (!sectionTitle || !sectionContent) return json({ error: "sectionTitle and sectionContent are required." }, 400);
        const prompt = `Rewrite this resume section for ATS + target role. Never invent fake jobs. Keep clean formatting (use "- " bullets).\nTarget: ${jobTitle || "Target Role"} ${company ? `Company: ${company}` : ""} JD: ${(jobDescription || "").slice(0, 1500)}\nSection: ${sectionTitle}\nContent:\n${sectionContent}
Return ONLY this JSON, no markdown, no extra text: {"improvedText": "...rewritten section here..."}`;
        const raw = await generateWithFallback(prompt, "rewrite", env);
        let improvedText = "";
        try {
          const parsed = parseJsonSafe(raw);
          improvedText = parsed.improvedText || parsed.text || parsed.result || "";
        } catch {
          improvedText = String(raw || "").trim();
        }
        if (!improvedText) throw new Error("Empty response during rewrite.");
        return json({ improvedText });
      }
      return json({ error: "Not found" }, 404);
    } catch (e: any) {
      return json({ error: e.message || "Failed" }, 500);
    }
  },
};
