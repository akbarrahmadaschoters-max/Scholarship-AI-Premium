/**
 * Frontend-safe Gemini helper.
 * All actual Gemini API calls are proxied through the Vite dev server
 * (configured in vite.config.ts). The GEMINI_API_KEY is NEVER exposed here.
 *
 * Use the fetch endpoints below from React components:
 *  - POST /api/gemini/diagnostic   { messages: [{role, content}] }
 *  - POST /api/gemini/speaking-eval { transcript: string }
 */

export type GeminiMessage = {
  role: 'user' | 'model';
  content: string;
};

/**
 * Safe JSON parser that attempts to extract JSON from markdown or text
 */
function safeParseJSON(text: string, fallback: any): any {
  try {
    if (!text) return fallback;
    // Attempt direct parse
    return JSON.parse(text);
  } catch {
    try {
      // Attempt to extract JSON from markdown code block or embedded string
      const match = text.match(/\{[\s\S]*\}/);
      if (match) {
        return JSON.parse(match[0]);
      }
    } catch {
      // Fallback below
    }
  }
  return fallback;
}

const MOCK_WRITING_EVAL = {
  band: 6.0,
  taskResponse: 'The essay addresses the prompt but lacks depth.',
  coherence: 'Paragraphs are somewhat organized.',
  lexical: 'Vocabulary is adequate but repetitive.',
  grammar: 'Some grammatical errors are present.',
  strengths: ['Clear introduction', 'Basic structure'],
  improvements: ['Use more advanced vocabulary', 'Develop arguments further']
};

const MOCK_SPEAKING_EVAL = {
  band: 6.0,
  fluency: 'Pauses occasionally to search for words.',
  lexical: 'Uses common words, lacks idiomatic expressions.',
  grammar: 'Simple sentences are mostly correct.',
  pronunciation: 'Generally clear but some mispronunciations.',
  strengths: ['Speaks at length', 'Answers the prompt'],
  improvements: ['Reduce hesitations', 'Use wider range of grammar']
};

const MOCK_SPEAKING_FEEDBACK = {
  feedback: 'Good effort, but try to speak more fluently and expand your answers.',
  band: 6.0,
  strengths: ['Good vocabulary'],
  improvements: ['Speak longer']
};

/** Call the server-side Gemini diagnostic proxy. */
export async function callGeminiDiagnostic(messages: GeminiMessage[]): Promise<string> {
  try {
    const res = await fetch('/api/gemini/diagnostic', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages }),
    });
    if (!res.ok) throw new Error('Diagnostic failed');
    const data = await res.json();
    return data?.candidates?.[0]?.content?.parts?.[0]?.text ?? 'AI analysis unavailable.';
  } catch (err) {
    console.error('Safe Diagnostic Fallback Triggered:', err);
    return 'AI analysis could not be performed – showing mock results.';
  }
}

/** Call the server-side speaking evaluation proxy. */
export async function callGeminiSpeakingEval(transcript: string): Promise<any> {
  try {
    const res = await fetch('/api/gemini/speaking-eval', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ transcript }),
    });
    if (!res.ok) throw new Error('Eval failed');
    const text = await res.text();
    return safeParseJSON(text, MOCK_SPEAKING_EVAL);
  } catch (err) {
    console.error('Safe Speaking Eval Fallback Triggered:', err);
    return MOCK_SPEAKING_EVAL;
  }
}

/** Call the server-side writing evaluation proxy. */
export async function callGeminiWritingEval(essay: string): Promise<any> {
  try {
    const res = await fetch('/api/gemini/writing-eval', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ essay }),
    });
    if (!res.ok) throw new Error(`Failed to fetch: ${res.status}`);
    const text = await res.text();
    return safeParseJSON(text, MOCK_WRITING_EVAL);
  } catch (err) {
    console.error('Safe Writing Eval Fallback Triggered:', err);
    return MOCK_WRITING_EVAL;
  }
}

/** Call the server-side speaking feedback proxy. */
export async function callGeminiSpeakingFeedback(part: number, prompt: string, transcript: string): Promise<any> {
  try {
    const res = await fetch('/api/gemini/speaking-feedback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ part, prompt, transcript }),
    });
    if (!res.ok) throw new Error('Feedback failed');
    const text = await res.text();
    return safeParseJSON(text, MOCK_SPEAKING_FEEDBACK);
  } catch (err) {
    console.error('Safe Speaking Feedback Fallback Triggered:', err);
    return MOCK_SPEAKING_FEEDBACK;
  }
}
