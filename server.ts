import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Lazy-initialized Gemini client
let geminiClient: GoogleGenAI | null = null;
function getGemini(): GoogleGenAI | null {
  if (!geminiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (key) {
      geminiClient = new GoogleGenAI({ apiKey: key });
    }
  }
  return geminiClient;
}

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', hasGeminiKey: !!process.env.GEMINI_API_KEY });
});

// Endpoint to evaluate user's freely spoken or written English in scenario context
app.post('/api/evaluate-speech', async (req, res) => {
  try {
    const {
      userSpokenText,
      npcDialogue,
      contextNote,
      npcName,
      npcRole,
      targetCefr,
      turnNumber,
      episodeTitle,
      referenceBestChoice,
    } = req.body;

    if (!userSpokenText || typeof userSpokenText !== 'string' || !userSpokenText.trim()) {
      return res.status(400).json({ error: 'userSpokenText is required' });
    }

    const ai = getGemini();
    if (!ai) {
      return res.json({
        fallback: true,
        message: 'No GEMINI_API_KEY configured. Fallback to client smart evaluator.',
      });
    }

    const systemPrompt = `You are Arthur Vance (${npcRole || 'Executive Procurement VP'}) and a world-class executive communication & negotiation coach.
Context:
- Scenario: ${episodeTitle || 'Executive Negotiation'}
- Target CEFR Level: ${targetCefr || 'C1'} (Advanced Business Negotiation)
- Turn Number: ${turnNumber || 1}
- NPC Dialogue to user: "${npcDialogue}"
- Context/Background: "${contextNote}"
- Gold Standard Reference (Best C1 Choice): "${referenceBestChoice?.text || ''}"

The user is playing the role of the foreign manufacturer's senior negotiation lead and directly spoke/inputted:
"${userSpokenText.trim()}"

Evaluate the user's spoken response objectively and professionally. Consider:
1. Business Strategy & Negotiation Leverage (Did they offer a win-win, conditional concession, protect margins, or did they fold too easily or become confrontational?)
2. English Fluency & Nuance (CEFR rating: C1, B2, B1, or A2. Note register, tone, diplomacy, and vocabulary).
3. Arthur Vance's In-Character Reaction (Realistic reaction from a sharp, experienced corporate executive).
4. Concrete feedback in polite Korean explaining why, highlighting strengths, and polishing the sentence into top-tier C1 executive phrasing.

You MUST respond strictly with a valid JSON object matching this schema:
{
  "cefrLevel": "C1" | "B2" | "B1" | "A2",
  "isBest": boolean, // true if C1 level and strategic win-win
  "affinityChange": number, // integer between -25 and +20 based on how Arthur feels
  "feedbackTitle": string, // Catchy Korean title (e.g. "완벽한 C1급 조건부 양보와 유연한 협상술!", "정중하지만 마진 방어 논리가 다소 부족합니다")
  "feedbackDetail": string, // 2-3 sentences in Korean explaining the negotiation psychology and business nuance
  "strengths": string, // What was expressed well in Korean
  "improvements": string, // What could be improved or polished in Korean
  "npcReactionDialogue": string, // Arthur Vance's direct spoken English response to the user's sentence (1-2 sentences)
  "npcReactionDialogueKo": string, // Korean translation of Arthur's response
  "npcReactionMood": "impressed" | "neutral" | "confused" | "annoyed",
  "nativePolish": string, // An impeccably phrased C1/C2 alternative sentence capturing the user's core intent
  "nativePolishKo": string // Korean translation of the polished sentence
}
Do not include markdown fences like \`\`\`json or any extra commentary outside JSON.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: systemPrompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const rawText = response.text?.trim() || '{}';
    let parsedData: any = {};
    try {
      parsedData = JSON.parse(rawText);
    } catch {
      const cleaned = rawText
        .replace(/^```json/i, '')
        .replace(/^```/, '')
        .replace(/```$/, '')
        .trim();
      parsedData = JSON.parse(cleaned);
    }

    return res.json({
      success: true,
      evaluation: parsedData,
    });
  } catch (err: any) {
    console.error('Gemini speech evaluation error:', err);
    return res.status(500).json({
      error: err?.message || 'Gemini evaluation failed',
      fallback: true,
    });
  }
});

// Vite middleware & Static serving
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
