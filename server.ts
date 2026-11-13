import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import type { SupabaseClient } from '@supabase/supabase-js';
import { createAdminClient } from './lib/supabase/server';
import dotenv from 'dotenv';

dotenv.config();
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

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

// Lazy-initialized Supabase Admin client (server-side only)
let supabaseAdminClient: SupabaseClient | null = null;
export function getSupabaseAdmin(): SupabaseClient | null {
  if (!supabaseAdminClient) {
    try {
      supabaseAdminClient = createAdminClient();
    } catch {
      return null;
    }
  }
  return supabaseAdminClient;
}

// Health check endpoint & Public Config
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    hasGeminiKey: !!process.env.GEMINI_API_KEY,
    hasSupabase: !!(
      (process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL) &&
      process.env.SUPABASE_SERVICE_ROLE_KEY
    ),
  });
});

app.get('/api/config', (req, res) => {
  const googleScriptUrl = process.env.NEXT_PUBLIC_GOOGLE_SCRIPT_URL || process.env.VITE_GOOGLE_SCRIPT_URL || '';
  res.json({ googleScriptUrl });
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

// Endpoint to proxy Google Apps Script Web App sync requests (avoids browser CORS issues)
app.post('/api/sync-sheet', async (req, res) => {
  try {
    const targetUrl = 
      req.body.webAppUrl || 
      process.env.NEXT_PUBLIC_GOOGLE_SCRIPT_URL || 
      process.env.VITE_GOOGLE_SCRIPT_URL || 
      'https://script.google.com/macros/s/AKfycbyYMVPq49LQnGqU2b6pWfiytR5Rt2gg1NUD6IkcXWrvDH-ScdE6p5DlMQHF2eKT_o4wbw/exec';

    if (!targetUrl || !targetUrl.startsWith('http')) {
      return res.status(400).json({ success: false, message: 'Valid Google Apps Script Web App URL is required.' });
    }

    const payload = req.body.payload || {};
    const { 
      timestamp, 
      name,
      nickname,
      scenario_name,
      play_count, 
      appropriateness_score,
    } = payload;
    
    // Call Google Apps Script Web App with the 5 exact keys (A~E):
    // timestamp, name, scenario_name, play_count, appropriateness_score
    const studentName = name || nickname || '익명';
    const cleanScenario = scenario_name || 'NYC 실전 회화 시뮬레이션';
    const cleanScore = appropriateness_score !== undefined ? appropriateness_score : '100%';

    const fetchResponse = await fetch(targetUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8',
      },
      body: JSON.stringify({
        timestamp: timestamp || new Date().toISOString(),
        name: studentName,
        scenario_name: cleanScenario,
        play_count: Number(play_count) || 1,
        appropriateness_score: cleanScore,
        nickname: studentName, // alias for backwards compatibility
      }),
      redirect: 'follow',
    });

    const text = await fetchResponse.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      data = { raw: text };
    }

    return res.json({
      success: true,
      status: fetchResponse.status,
      data,
    });
  } catch (error: any) {
    console.error('Proxy Google Sheet sync error:', error);
    return res.status(500).json({
      success: false,
      message: error?.message || 'Failed to sync with Google Sheet',
    });
  }
});

// Helper: detect missing Supabase table error
function isMissingTableError(error: any): boolean {
  if (!error) return false;
  const code = String(error.code || '');
  const msg = String(error.message || '').toLowerCase();
  return (
    code === '42P01' ||
    code === 'PGRST205' ||
    msg.includes('does not exist') ||
    msg.includes('could not find the table')
  );
}

// Helper: optionally resolve authenticated Supabase user id from Bearer token
async function resolveUserIdFromRequest(req: express.Request, admin: SupabaseClient): Promise<string | null> {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.slice(7).trim();
    if (token) {
      try {
        const { data } = await admin.auth.getUser(token);
        if (data?.user?.id) return data.user.id;
      } catch {
        // ignore invalid token
      }
    }
  }
  return null;
}

// GET /api/activity - Fetch activity summary logs from Supabase
app.get('/api/activity', async (req, res) => {
  const admin = getSupabaseAdmin();
  if (!admin) {
    return res.status(503).json({
      success: false,
      needsConfig: true,
      logs: [],
      message: 'Supabase 서버 환경변수가 설정되지 않았습니다.',
    });
  }

  try {
    const authedUserId = await resolveUserIdFromRequest(req, admin);
    const filterUserId = typeof req.query.userId === 'string' && req.query.userId.trim()
      ? req.query.userId.trim()
      : authedUserId;

    let query = admin
      .from('user_activity_logs')
      .select('*')
      .order('recorded_at', { ascending: false })
      .limit(100);

    if (filterUserId) {
      query = query.eq('user_id', filterUserId);
    }

    const { data, error } = await query;

    if (error) {
      if (isMissingTableError(error)) {
        return res.json({
          success: false,
          needsTableSetup: true,
          logs: [],
          message: 'Supabase에 user_activity_logs 테이블이 아직 생성되지 않았습니다.',
        });
      }
      return res.status(500).json({
        success: false,
        logs: [],
        message: error.message || '활동 기록 조회에 실패했습니다.',
      });
    }

    return res.json({
      success: true,
      logs: data || [],
    });
  } catch (err: any) {
    console.error('GET /api/activity error:', err);
    return res.status(500).json({
      success: false,
      logs: [],
      message: err?.message || '활동 기록 조회 중 오류가 발생했습니다.',
    });
  }
});

// POST /api/activity - Record a completed learning session (listening & shadowing counts + timestamp)
app.post('/api/activity', async (req, res) => {
  const admin = getSupabaseAdmin();
  if (!admin) {
    return res.status(503).json({
      success: false,
      needsConfig: true,
      message: 'Supabase 서버 환경변수가 설정되지 않았습니다.',
    });
  }

  try {
    const authedUserId = await resolveUserIdFromRequest(req, admin);
    const {
      user_id,
      nickname,
      scenario_id,
      scenario_name,
      listening_count,
      shadowing_count,
      appropriateness_score,
      cefr_level,
      recorded_at,
    } = req.body || {};

    if (!scenario_name || typeof scenario_name !== 'string') {
      return res.status(400).json({ success: false, message: 'scenario_name is required.' });
    }

    const safeListening = Math.max(0, Math.round(Number(listening_count) || 0));
    const safeShadowing = Math.max(0, Math.round(Number(shadowing_count) || 0));
    const safeScore = Math.max(0, Math.min(100, Math.round(Number(appropriateness_score) || 0)));
    const safeTimestamp = recorded_at || new Date().toISOString();

    const insertRow = {
      user_id: authedUserId || (typeof user_id === 'string' && user_id.trim() ? user_id.trim() : null),
      nickname: typeof nickname === 'string' && nickname.trim() ? nickname.trim() : '익명',
      scenario_id: typeof scenario_id === 'string' ? scenario_id : null,
      scenario_name: scenario_name.trim(),
      listening_count: safeListening,
      shadowing_count: safeShadowing,
      appropriateness_score: safeScore,
      cefr_level: typeof cefr_level === 'string' ? cefr_level : null,
      recorded_at: safeTimestamp,
    };

    const { data, error } = await admin
      .from('user_activity_logs')
      .insert([insertRow])
      .select()
      .single();

    if (error) {
      if (isMissingTableError(error)) {
        return res.json({
          success: false,
          needsTableSetup: true,
          message: 'Supabase에 user_activity_logs 테이블 생성이 필요합니다.',
        });
      }
      return res.status(500).json({
        success: false,
        message: error.message || 'Supabase 활동 기록 저장에 실패했습니다.',
      });
    }

    return res.json({
      success: true,
      record: data,
      message: 'Supabase에 학습 활동 기록이 저장되었습니다.',
    });
  } catch (err: any) {
    console.error('POST /api/activity error:', err);
    return res.status(500).json({
      success: false,
      message: err?.message || '활동 기록 저장 중 오류가 발생했습니다.',
    });
  }
});

// PATCH /api/activity/:id - Increment listening/shadowing counts from ResultScreen practice
app.patch('/api/activity/:id', async (req, res) => {
  const admin = getSupabaseAdmin();
  if (!admin) {
    return res.status(503).json({ success: false, message: 'Supabase unavailable' });
  }

  try {
    const { id } = req.params;
    const { listening_count, shadowing_count } = req.body || {};
    if (!id) return res.status(400).json({ success: false, message: 'id is required' });

    const { data, error } = await admin
      .from('user_activity_logs')
      .update({
        listening_count: Math.max(0, Math.round(Number(listening_count) || 0)),
        shadowing_count: Math.max(0, Math.round(Number(shadowing_count) || 0)),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      if (isMissingTableError(error)) {
        return res.json({ success: false, needsTableSetup: true });
      }
      return res.status(500).json({ success: false, message: error.message });
    }

    return res.json({ success: true, record: data });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err?.message || 'Update failed' });
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
