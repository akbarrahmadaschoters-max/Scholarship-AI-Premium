const AI_PROVIDER = "gemini"
const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

export async function callAI({ systemPrompt, messages }) {

  if (AI_PROVIDER === "gemini") {
    
    const geminiMessages = messages.map(m => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }]
    }))

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          system_instruction: {
            parts: [{ text: systemPrompt }]
          },
          contents: geminiMessages,
          generationConfig: {
            maxOutputTokens: 1000,
            temperature: 0.7
          }
        })
      }
    )

    if (!res.ok) {
      const errData = await res.json()
      
      // Fallback for Quota Exceeded (429) during prototyping
      if (res.status === 429) {
        console.warn("Gemini Quota Exceeded! Returning mock response for prototyping.");
        return "*(Mock Response: Gemini API quota exceeded)*\n\nThat's an interesting point. Can you elaborate more on how that experience prepared you for this scholarship?";
      }

      throw new Error(errData?.error?.message ?? "Gemini API error: " + res.status)
    }

    const data = await res.json()

    if (!data.candidates || data.candidates.length === 0) {
      throw new Error("No response from Gemini API")
    }

    return data.candidates[0].content.parts[0].text
  }
}
