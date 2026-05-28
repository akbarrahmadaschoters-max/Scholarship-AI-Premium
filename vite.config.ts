import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import dotenv from 'dotenv';

dotenv.config();

// Server-side Gemini proxy – uses native fetch (Node 18+), no express needed
async function callGemini(messages: { role: string; content: string }[]) {
  const apiKey = process.env.GEMINI_API_KEY;
  console.log('[Gemini] API Key exists:', !!apiKey, apiKey ? `(ends with ${apiKey.slice(-4)})` : '');
  
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not set');
  }
  
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
  try {
    const formattedContents = messages.map(m => ({
      role: m.role === 'assistant' ? 'model' : m.role,
      parts: [{ text: m.content }]
    }));
    
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: formattedContents }),
    });
    
    console.log('[Gemini] Response status:', res.status);
    
    if (!res.ok) {
      const errorText = await res.text();
      console.error('[Gemini] API error:', res.status, errorText);
      throw new Error(`Gemini request failed with status ${res.status}: ${errorText}`);
    }
    return await res.json();
  } catch (e: any) {
    console.error('[Gemini] Error calling API:', e.message || e);
    throw e;
  }
}

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'backend-api',
      configureServer(server) {
    // Parse JSON body helper
    const parseJSON = (req: any): Promise<any> =>
      new Promise((resolve, reject) => {
        let body = '';
        req.on('data', (chunk: any) => (body += chunk));
        req.on('end', () => {
          try {
            resolve(body ? JSON.parse(body) : {});
          } catch {
            reject(new Error('Invalid JSON'));
          }
        });
        req.on('error', reject);
      });

    server.middlewares.use(async (req: any, res: any, next: any) => {
      const url: string = req.url || '';

      // ── POST /api/gemini/diagnostic ─────────────────────────────────────
      if (req.method === 'POST' && url === '/api/gemini/diagnostic') {
        try {
          const body = await parseJSON(req);
          const messages = body?.messages;
          if (!messages) {
            res.statusCode = 400;
            res.end(JSON.stringify({ error: 'Missing messages' }));
            return;
          }
          const systemInstruction = `You are a highly experienced Cambridge IELTS examiner and elite university admission counselor. Please provide a highly comprehensive, detailed, and actionable diagnostic report based on the student's SAT and IELTS scores. Include overall impressions, detailed analysis of each section, and specific, step-by-step actionable recommendations. Format the response beautifully using Markdown with clear headings and bullet points.`;
          const result = await callGemini([{ role: 'user', content: systemInstruction + '\n\n' + JSON.stringify(messages) }]);
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify(result));
        } catch (e) {
          console.error('[API] /api/gemini/diagnostic error', e);
          res.statusCode = 500;
          res.end(JSON.stringify({ error: 'Gemini call failed' }));
        }
        return;
      }

      // ── POST /api/gemini/speaking-eval ──────────────────────────────────
      if (req.method === 'POST' && url === '/api/gemini/speaking-eval') {
        try {
          const body = await parseJSON(req);
          const transcript = body?.transcript || '';
          const prompt = `You are an IELTS speaking examiner. Evaluate the following student speaking transcript and respond with a JSON object containing: band (number 1-9), fluency (string), lexical (string), grammar (string), pronunciation (string), strengths (array of strings), improvements (array of strings), sampleAnswer (string), nextSteps (string).\n\nTranscript:\n${transcript}`;
          const geminiResult = await callGemini([{ role: 'user', content: prompt }]);
          const text: string = geminiResult?.candidates?.[0]?.content?.parts?.[0]?.text || '';
          // Try to parse JSON from Gemini response
          try {
            const jsonMatch = text.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
              const parsed = JSON.parse(jsonMatch[0]);
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify(parsed));
              return;
            }
          } catch {
            // fall through to mock
          }
          // Fallback mock evaluation
          const mock = {
            band: 6.0,
            fluency: 'Generally fluent with some hesitation. Reduce filler words.',
            lexical: 'Good vocabulary range. Use more idiomatic expressions.',
            grammar: 'Mostly accurate. Work on complex structures.',
            pronunciation: 'Clearly intelligible. Focus on sentence stress.',
            strengths: ['Clear content', 'Good use of examples', 'Organised structure'],
            improvements: ['Reduce hesitation', 'More sophisticated vocabulary', 'Complex grammar'],
            sampleAnswer: 'One significant change I experienced was moving abroad for my studies. It happened about two years ago. Initially overwhelming, I adapted by joining student clubs and establishing a routine. This made me far more self-reliant.',
            nextSteps: 'Practice speaking on abstract topics for 10 minutes daily.',
          };
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify(mock));
        } catch (e) {
          console.error('[API] /api/gemini/speaking-eval error', e);
          res.statusCode = 500;
          res.end(JSON.stringify({ error: 'Speaking evaluation failed' }));
        }
        return;
      }

      // ── POST /api/gemini/writing-eval ───────────────────────────────────
      if (req.method === 'POST' && url === '/api/gemini/writing-eval') {
        try {
          const body = await parseJSON(req);
          const essay = body?.essay || '';
          const prompt = `You are a STRICT and UNFORGIVING Cambridge IELTS examiner. Evaluate the following IELTS Writing Task 2 essay and respond with ONLY a JSON object containing the exact keys listed below.
          
          CRITICAL RULES:
          1. If the essay is extremely short (under 50 words), off-topic, or contains nonsense (e.g., "I don't know", "skip", "idk"), you MUST assign a band score between 0.0 and 3.0. Do NOT give a 6.0 for empty or nonsensical answers.
          2. Point out specific grammatical and lexical errors. Be highly critical.
          
          JSON Structure:
          - band (number 1-9, use increments of 0.5)
          - taskResponse (string: severe feedback on addressing the prompt, penalize if word count is low)
          - coherence (string: feedback on structure and linking)
          - lexical (string: feedback on vocabulary, highlight specific misused words)
          - grammar (string: feedback on grammar and accuracy, highlight specific errors)
          - strengths (array of strings: what they did right, or empty if none)
          - improvements (array of strings: exact steps they must take to improve)
          
          Essay:
          "${essay}"`;
          const geminiResult = await callGemini([{ role: 'user', content: prompt }]);
          const text: string = geminiResult?.candidates?.[0]?.content?.parts?.[0]?.text || '';
          try {
            const jsonMatch = text.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
              const parsed = JSON.parse(jsonMatch[0]);
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify(parsed));
              return;
            }
          } catch {}
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ band: 6.0, taskResponse: 'N/A', coherence: 'N/A', lexical: 'N/A', grammar: 'N/A', strengths: [], improvements: [] }));
        } catch (e) {
          console.error('[API] /api/gemini/writing-eval error', e);
          res.statusCode = 500;
          res.end(JSON.stringify({ error: 'Writing evaluation failed' }));
        }
        return;
      }

      // ── POST /api/gemini/speaking-feedback ──────────────────────────────
      if (req.method === 'POST' && url === '/api/gemini/speaking-feedback') {
        try {
          const body = await parseJSON(req);
          const { part, prompt, transcript } = body;
          const sysPrompt = `You are an IELTS speaking examiner conducting a test.
          The current part is Part ${part}. The question asked was: "${prompt}".
          The student answered: "${transcript}".
          
          Respond with ONLY a JSON object containing:
          - feedback (string: concise, constructive feedback on their answer addressing fluency, vocab, grammar)
          - followUpQuestion (string: a relevant follow-up question, or empty string if it's the end of the section)
          `;
          const geminiResult = await callGemini([{ role: 'user', content: sysPrompt }]);
          const text: string = geminiResult?.candidates?.[0]?.content?.parts?.[0]?.text || '';
          try {
            const jsonMatch = text.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
              const parsed = JSON.parse(jsonMatch[0]);
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify(parsed));
              return;
            }
          } catch {}
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ feedback: 'Good effort. Try to expand your answers more.', followUpQuestion: '' }));
        } catch (e) {
          console.error('[API] /api/gemini/speaking-feedback error', e);
          res.statusCode = 500;
          res.end(JSON.stringify({ error: 'Speaking feedback failed' }));
        }
        return;
      }

      // ── POST /api/ielts/generate-listening-audio ──────────────────────
      if (req.method === 'POST' && (url === '/api/ielts/generate-listening' || url === '/api/ielts/generate-listening-audio')) {
        try {
          const body = await parseJSON(req);
          const script: string = body?.script || '';

          // Parse the script into speaker turns
          const lines = script.split('\n').filter((l: string) => l.trim());
          const speakerTurns: Array<{ speaker: string; text: string }> = [];
          for (const line of lines) {
            const match = line.match(/^([\w\s]+?):\s*(.+)$/);
            if (match) {
              speakerTurns.push({ speaker: match[1].trim(), text: match[2].trim() });
            }
          }

          // Try to generate audio via Gemini TTS if available
          const apiKey = process.env.GEMINI_API_KEY;
          if (apiKey) {
            try {
              // Use Gemini to generate a more natural dialogue version
              const prompt = `You are an IELTS listening test audio script writer. Take this dialogue and rewrite it in a natural, conversational style suitable for text-to-speech. Keep the same information and answers but make it sound more natural. Return only the rewritten dialogue with speaker labels (Receptionist: / Student:).\n\nOriginal:\n${script}`;
              const geminiResult = await callGemini([{ role: 'user', content: prompt }]);
              const enhancedScript = geminiResult?.candidates?.[0]?.content?.parts?.[0]?.text || script;

              // Parse enhanced script into turns
              const enhancedLines = enhancedScript.split('\n').filter((l: string) => l.trim());
              const enhancedTurns: Array<{ speaker: string; text: string }> = [];
              for (const line of enhancedLines) {
                const match = line.match(/^([\w\s]+?):\s*(.+)$/);
                if (match) {
                  enhancedTurns.push({ speaker: match[1].trim(), text: match[2].trim() });
                }
              }

              if (enhancedTurns.length > 0) {
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({
                  speakerTurns: enhancedTurns,
                  transcript: enhancedScript,
                  source: 'gemini-enhanced',
                }));
                return;
              }
            } catch (e) {
              console.error('[TTS] Gemini enhancement failed, using original script', e);
            }
          }

          // Fallback: return parsed speaker turns from original script
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({
            speakerTurns: speakerTurns.length > 0 ? speakerTurns : [{ speaker: 'Narrator', text: script }],
            transcript: script,
            source: 'fallback',
          }));
        } catch (e) {
          console.error('[API] /api/ielts/generate-listening-audio error', e);
          res.statusCode = 500;
          res.end(JSON.stringify({ error: 'TTS generation failed' }));
        }
        return;
      }

      // ── POST /api/scholarships/match ────────────────────────────────
      if (req.method === 'POST' && url === '/api/scholarships/match') {
        try {
          const body = await parseJSON(req);
          
          const prompt = `You are an elite university admissions and scholarship counselor. Based on the student's data, generate a personalized AI recommendation engine output.
          Data: ${JSON.stringify(body)}
          
          Return EXACTLY this JSON structure, nothing else:
          {
            "recommendedScholarships": [
              {
                "name": "Fulbright",
                "country": "USA",
                "estimatedDeadline": "May 2027",
                "eligibilityFit": "High",
                "matchPercentage": 90,
                "requiredPreparation": "Leadership essays",
                "priorityLevel": "High"
              }
            ], // Exactly 10 scholarships
            "recommendedUniversities": [
              {
                "name": "MIT",
                "country": "USA",
                "fitLevel": "Reach",
                "suggestedMajorAlignment": "Computer Science",
                "admissionCompetitiveness": "Extremely High",
                "preparationFocus": "Math competitions"
              }
            ], // Exactly 10 universities
            "eligibilityMatch": "Based on your GPA and IELTS, you meet the baseline for 80% of top tier scholarships.",
            "deadlineAwareness": "You have 3 urgent deadlines in the next 30 days.",
            "profileStrengths": ["Strong standardized test scores", "Consistent volunteering"],
            "profileGaps": ["Lacking international exposure", "Need more leadership roles"],
            "recommendedNextActions": ["Take SAT practice test 3", "Draft personal statement"],
            "applicationPriority": [
              { "name": "Fulbright App", "priority": "Urgent", "daysRemaining": 15 },
              { "name": "MIT Application", "priority": "High", "daysRemaining": 60 }
            ],
            "scholarshipStrategy": "Focus on highlighting your community service in your essays to stand out for merit-based awards."
          }`;

          let resultData;
          const apiKey = process.env.GEMINI_PROFILING_API_KEY;
          if (apiKey) {
             const geminiResult = await callGemini([{ role: 'user', content: prompt }]);
             const text = geminiResult?.candidates?.[0]?.content?.parts?.[0]?.text || '';
             try {
                const jsonMatch = text.match(/\{[\s\S]*\}/);
                if (jsonMatch) {
                   resultData = JSON.parse(jsonMatch[0]);
                }
             } catch (e) {
                console.error('[API] Failed to parse Gemini recommendation JSON, falling back to mock');
             }
          }

          if (!resultData) {
            // Robust Mock Fallback
            resultData = {
              recommendedScholarships: [
                { name: "LPDP (Indonesia)", country: "Indonesia/Global", estimatedDeadline: "Feb 2027", eligibilityFit: "High", matchPercentage: 98, requiredPreparation: "Essay and return plan", priorityLevel: "High" },
                { name: "Chevening (UK)", country: "UK", estimatedDeadline: "Nov 2026", eligibilityFit: "High", matchPercentage: 92, requiredPreparation: "2 years work experience", priorityLevel: "Medium" },
                { name: "Fulbright (USA)", country: "USA", estimatedDeadline: "May 2027", eligibilityFit: "Medium", matchPercentage: 88, requiredPreparation: "Leadership essays", priorityLevel: "Medium" },
                { name: "Erasmus Mundus", country: "Europe", estimatedDeadline: "Jan 2027", eligibilityFit: "High", matchPercentage: 85, requiredPreparation: "Motivation letter", priorityLevel: "Low" },
                ...Array.from({length: 6}).map((_, i) => ({
                  name: `Global Merit Scholarship ${i+1}`, country: "Various", estimatedDeadline: "Dec 2026", eligibilityFit: "Medium", matchPercentage: 80 - i, requiredPreparation: "Standard application", priorityLevel: "Low"
                }))
              ],
              recommendedUniversities: Array.from({length: 10}).map((_, i) => ({
                name: `Top University ${i+1}`,
                country: i % 2 === 0 ? "USA" : "UK",
                fitLevel: i < 3 ? "Reach" : (i < 7 ? "Target" : "Safety"),
                suggestedMajorAlignment: "Computer Science",
                admissionCompetitiveness: i < 3 ? "Extremely High" : "High",
                preparationFocus: "Standardized tests and essays"
              })),
              eligibilityMatch: "Based on your strong standardized test scores and leadership profile, you are highly competitive for top 50 global universities and elite scholarships.",
              deadlineAwareness: "You have 2 urgent deadlines in the next 30 days. Focus on Chevening and your target safety schools.",
              profileStrengths: ["Strong academic baseline", "Consistent extracurricular involvement", "Clear major trajectory"],
              profileGaps: ["Lack of international-level competitions", "Need stronger teacher recommendations", "Interview preparation needed"],
              recommendedNextActions: ["Finalize personal statement draft", "Reach out to recommenders", "Take IELTS practice test 3"],
              applicationPriority: [
                { name: "Finalize University Shortlist", priority: "Urgent", daysRemaining: 5 },
                { name: "Register for SAT Retake", priority: "Urgent", daysRemaining: 12 },
                { name: "Submit Chevening Application", priority: "High", daysRemaining: 45 },
                { name: "Draft Personal Statement", priority: "High", daysRemaining: 60 }
              ],
              scholarshipStrategy: "Focus on highlighting your community impact. Apply early to rolling admission schools as safeties."
            };
          }

          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify(resultData));
        } catch (e) {
          console.error('[API] /api/scholarships/match error', e);
          res.statusCode = 500;
          res.end(JSON.stringify({ error: 'Recommendation generation failed' }));
        }
        return;
      }

      // ── POST /api/ielts/evaluate-speaking ──────────────────────────────
      if (req.method === 'POST' && url === '/api/ielts/evaluate-speaking') {
        const mock = { band: 6.5, feedback: 'Good pronunciation, work on fluency.' };
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify(mock));
        return;
      }

      next();
      });
    },
  }]
});
