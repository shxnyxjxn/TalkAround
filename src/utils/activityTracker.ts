import { createClient } from '@/lib/supabase/client';
import { UserActivityLog } from '../types';

const LOCAL_ACTIVITY_KEY = 'talk_around_activity_logs';

export const ACTIVITY_TABLE_SQL = `-- Talk Around: User Activity Logs Table (AGENTS.md 보안 규칙 준수)
CREATE TABLE IF NOT EXISTS public.user_activity_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  nickname text NOT NULL DEFAULT '익명',
  scenario_id text,
  scenario_name text NOT NULL,
  listening_count integer NOT NULL DEFAULT 0 CHECK (listening_count >= 0),
  shadowing_count integer NOT NULL DEFAULT 0 CHECK (shadowing_count >= 0),
  appropriateness_score integer NOT NULL DEFAULT 0 CHECK (appropriateness_score >= 0 AND appropriateness_score <= 100),
  cefr_level text,
  recorded_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_user_activity_logs_recorded_at
  ON public.user_activity_logs (recorded_at DESC);

CREATE INDEX IF NOT EXISTS idx_user_activity_logs_user_id
  ON public.user_activity_logs (user_id);

-- 1. PostgREST Role 권한 부여 (GRANT SQL)
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.user_activity_logs TO anon, authenticated;

-- 2. Row Level Security (RLS) 활성화 및 authenticated 정책 작성
ALTER TABLE public.user_activity_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can select" ON public.user_activity_logs;
CREATE POLICY "Authenticated users can select"
  ON public.user_activity_logs
  FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Authenticated users can insert" ON public.user_activity_logs;
CREATE POLICY "Authenticated users can insert"
  ON public.user_activity_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated users can update" ON public.user_activity_logs;
CREATE POLICY "Authenticated users can update"
  ON public.user_activity_logs
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated users can delete" ON public.user_activity_logs;
CREATE POLICY "Authenticated users can delete"
  ON public.user_activity_logs
  FOR DELETE
  TO authenticated
  USING (true);`;

export function formatActivityTimestamp(isoString?: string): string {
  const date = isoString ? new Date(isoString) : new Date();
  if (Number.isNaN(date.getTime())) return String(isoString || '');
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(
    date.getHours()
  )}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

export function getLocalActivityLogs(): UserActivityLog[] {
  try {
    const raw = localStorage.getItem(LOCAL_ACTIVITY_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveLocalActivityLogs(logs: UserActivityLog[]) {
  try {
    localStorage.setItem(LOCAL_ACTIVITY_KEY, JSON.stringify(logs.slice(0, 100)));
  } catch (e) {
    console.warn('Failed to persist local activity logs:', e);
  }
}

async function getAuthHeaders(): Promise<{ headers: Record<string, string>; userId: string | null }> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  let userId: string | null = null;
  try {
    const supabase = createClient();
    const { data } = await supabase.auth.getSession();
    const token = data?.session?.access_token;
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
      userId = data.session?.user?.id || null;
    }
  } catch {
    // Supabase client optional when unauthenticated
  }
  return { headers, userId };
}

export interface SaveActivityInput {
  nickname: string;
  scenario_id: string;
  scenario_name: string;
  listening_count: number;
  shadowing_count: number;
  appropriateness_score: number;
  cefr_level: string;
  recorded_at?: string;
}

export interface SaveActivityResult {
  log: UserActivityLog;
  status: 'synced' | 'needs_table' | 'failed';
  message: string;
}

export async function saveActivityToSupabase(input: SaveActivityInput): Promise<SaveActivityResult> {
  const recordedAt = input.recorded_at || new Date().toISOString();
  const { headers, userId } = await getAuthHeaders();

  const localFallback: UserActivityLog = {
    id: `local_${Date.now()}`,
    user_id: userId,
    nickname: input.nickname || '익명',
    scenario_id: input.scenario_id,
    scenario_name: input.scenario_name,
    listening_count: Math.max(0, Math.round(input.listening_count)),
    shadowing_count: Math.max(0, Math.round(input.shadowing_count)),
    appropriateness_score: Math.max(0, Math.min(100, Math.round(input.appropriateness_score))),
    cefr_level: input.cefr_level,
    recorded_at: recordedAt,
    source: 'local',
  };

  try {
    const res = await fetch('/api/activity', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        user_id: userId,
        nickname: localFallback.nickname,
        scenario_id: localFallback.scenario_id,
        scenario_name: localFallback.scenario_name,
        listening_count: localFallback.listening_count,
        shadowing_count: localFallback.shadowing_count,
        appropriateness_score: localFallback.appropriateness_score,
        cefr_level: localFallback.cefr_level,
        recorded_at: recordedAt,
      }),
    });

    const data = await res.json();

    if (res.ok && data?.success && data?.record) {
      const syncedLog: UserActivityLog = {
        ...data.record,
        source: 'supabase',
      };
      const existing = getLocalActivityLogs();
      saveLocalActivityLogs([syncedLog, ...existing.filter(item => item.id !== syncedLog.id)]);
      return {
        log: syncedLog,
        status: 'synced',
        message: 'Supabase 활동 기록(듣기/쉐도잉/타임스탬프)이 안전하게 저장되었습니다.',
      };
    }

    const existing = getLocalActivityLogs();
    saveLocalActivityLogs([localFallback, ...existing]);

    if (data?.needsTableSetup) {
      return {
        log: localFallback,
        status: 'needs_table',
        message: '활동 요약 페이지에서 Supabase 테이블 생성 SQL을 실행하면 클라우드에 저장됩니다.',
      };
    }

    return {
      log: localFallback,
      status: 'failed',
      message: data?.message || 'Supabase 저장 실패 (로컬에 임시 저장됨)',
    };
  } catch (err: any) {
    const existing = getLocalActivityLogs();
    saveLocalActivityLogs([localFallback, ...existing]);
    return {
      log: localFallback,
      status: 'failed',
      message: err?.message || '네트워크 오류로 로컬에 임시 저장되었습니다.',
    };
  }
}

export async function updateActivityCounts(
  logId: string | undefined,
  listeningCount: number,
  shadowingCount: number
): Promise<void> {
  if (!logId) return;

  const existing = getLocalActivityLogs();
  const updatedLocal = existing.map(item =>
    item.id === logId
      ? { ...item, listening_count: listeningCount, shadowing_count: shadowingCount }
      : item
  );
  saveLocalActivityLogs(updatedLocal);

  if (logId.startsWith('local_')) return;

  try {
    const { headers } = await getAuthHeaders();
    await fetch(`/api/activity/${encodeURIComponent(logId)}`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify({
        listening_count: listeningCount,
        shadowing_count: shadowingCount,
      }),
    });
  } catch {
    // ignore background patch errors
  }
}

export interface FetchActivityResult {
  logs: UserActivityLog[];
  syncedWithSupabase: boolean;
  needsTableSetup: boolean;
  message?: string;
}

export async function fetchActivityLogs(): Promise<FetchActivityResult> {
  const localLogs = getLocalActivityLogs();

  try {
    const { headers } = await getAuthHeaders();
    const res = await fetch('/api/activity', { headers });
    const data = await res.json();

    if (data?.needsTableSetup) {
      return {
        logs: localLogs.sort(
          (a, b) => new Date(b.recorded_at).getTime() - new Date(a.recorded_at).getTime()
        ),
        syncedWithSupabase: false,
        needsTableSetup: true,
        message: data.message,
      };
    }

    if (res.ok && data?.success && Array.isArray(data.logs)) {
      const remoteLogs: UserActivityLog[] = data.logs.map((row: any) => ({
        ...row,
        source: 'supabase',
      }));

      // Merge unsynced local-only items that aren't in Supabase yet
      const remoteKeys = new Set(
        remoteLogs.map(r => `${r.recorded_at}::${r.scenario_name}`)
      );
      const localOnly = localLogs.filter(
        l => l.source !== 'supabase' && !remoteKeys.has(`${l.recorded_at}::${l.scenario_name}`)
      );

      const merged = [...remoteLogs, ...localOnly].sort(
        (a, b) => new Date(b.recorded_at).getTime() - new Date(a.recorded_at).getTime()
      );
      saveLocalActivityLogs(merged);

      return {
        logs: merged,
        syncedWithSupabase: true,
        needsTableSetup: false,
      };
    }

    return {
      logs: localLogs.sort(
        (a, b) => new Date(b.recorded_at).getTime() - new Date(a.recorded_at).getTime()
      ),
      syncedWithSupabase: false,
      needsTableSetup: false,
      message: data?.message,
    };
  } catch (err: any) {
    return {
      logs: localLogs.sort(
        (a, b) => new Date(b.recorded_at).getTime() - new Date(a.recorded_at).getTime()
      ),
      syncedWithSupabase: false,
      needsTableSetup: false,
      message: err?.message,
    };
  }
}
