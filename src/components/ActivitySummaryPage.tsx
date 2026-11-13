import React, { useEffect, useState, useCallback } from 'react';
import {
  ArrowLeft,
  BarChart3,
  Headphones,
  Mic,
  Heart,
  Clock,
  RefreshCw,
  Database,
  CheckCircle2,
  AlertTriangle,
  Copy,
  Check,
  Sparkles,
  ChevronDown,
  ChevronUp,
  User,
} from 'lucide-react';
import type { User as SupabaseUser } from '@supabase/supabase-js';
import { LearnerProfile, UserActivityLog } from '../types';
import {
  ACTIVITY_TABLE_SQL,
  fetchActivityLogs,
  formatActivityTimestamp,
} from '../utils/activityTracker';

interface ActivitySummaryPageProps {
  profile: LearnerProfile;
  authUser: SupabaseUser | null;
  onBackToHome: () => void;
}

export const ActivitySummaryPage: React.FC<ActivitySummaryPageProps> = ({
  profile,
  authUser,
  onBackToHome,
}) => {
  const [logs, setLogs] = useState<UserActivityLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [syncedWithSupabase, setSyncedWithSupabase] = useState(false);
  const [needsTableSetup, setNeedsTableSetup] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | undefined>();
  const [copiedSql, setCopiedSql] = useState(false);
  const [showSqlPreview, setShowSqlPreview] = useState(false);

  const loadLogs = useCallback(async () => {
    setIsLoading(true);
    const result = await fetchActivityLogs();
    setLogs(result.logs);
    setSyncedWithSupabase(result.syncedWithSupabase);
    setNeedsTableSetup(result.needsTableSetup);
    setStatusMessage(result.message);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    loadLogs();
  }, [loadLogs]);

  const handleCopySql = async () => {
    try {
      await navigator.clipboard.writeText(ACTIVITY_TABLE_SQL);
      setCopiedSql(true);
      setTimeout(() => setCopiedSql(false), 2500);
    } catch {
      setShowSqlPreview(true);
    }
  };

  // Aggregate KPI metrics
  const totalSessions = logs.length;
  const totalListening = logs.reduce((acc, item) => acc + (Number(item.listening_count) || 0), 0);
  const totalShadowing = logs.reduce((acc, item) => acc + (Number(item.shadowing_count) || 0), 0);
  const avgScore =
    totalSessions > 0
      ? Math.round(
          logs.reduce((acc, item) => acc + (Number(item.appropriateness_score) || 0), 0) /
            totalSessions
        )
      : 0;

  return (
    <div className="flex flex-col min-h-full w-full max-w-lg sm:max-w-xl mx-auto px-3.5 sm:px-5 py-4 space-y-4 select-none">
      {/* Top Navigation Row */}
      <div className="flex items-center justify-between gap-2 shrink-0">
        <button
          type="button"
          onClick={onBackToHome}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-stone-950 hover:bg-stone-800 border border-stone-800 text-xs font-semibold text-stone-300 hover:text-amber-300 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>메인으로</span>
        </button>

        <button
          type="button"
          onClick={loadLogs}
          disabled={isLoading}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-stone-950 hover:bg-stone-800 border border-stone-800 text-xs font-semibold text-amber-300 transition-colors cursor-pointer disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          <span>새로고침</span>
        </button>
      </div>

      {/* Page Title Card */}
      <div className="rounded-3xl bg-gradient-to-b from-stone-850 to-stone-900 border border-amber-500/30 p-4 sm:p-5 shadow-xl space-y-3 shrink-0">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-[10px] font-bold text-amber-300 uppercase tracking-wider">
              <BarChart3 className="w-3 h-3" />
              <span>Supabase Activity Summary</span>
            </div>
            <h2 className="text-lg sm:text-xl font-black text-white">
              나의 듣기 · 쉐도잉 활동 요약
            </h2>
            <p className="text-xs text-stone-400">
              {authUser
                ? `${authUser.email} 계정의 Supabase 활동 기록입니다.`
                : `${profile.nickname || '익명'} 학습자의 세션별 듣기·쉐도잉 기록입니다.`}
            </p>
          </div>
          <div className="p-2.5 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-400 shrink-0">
            <Sparkles className="w-5 h-5" />
          </div>
        </div>

        {/* 4 KPI Summary Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
          <div className="p-3 rounded-2xl bg-stone-950/80 border border-stone-800 space-y-1">
            <div className="flex items-center gap-1 text-[10px] text-stone-400 font-semibold">
              <BarChart3 className="w-3 h-3 text-amber-400" />
              <span>완료 세션</span>
            </div>
            <div className="text-lg sm:text-xl font-black font-mono text-white">
              {totalSessions}
              <span className="text-[11px] font-normal text-stone-500 ml-0.5">회</span>
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-stone-950/80 border border-amber-500/30 space-y-1">
            <div className="flex items-center gap-1 text-[10px] text-amber-300 font-semibold">
              <Headphones className="w-3 h-3 text-amber-400" />
              <span>듣기 학습</span>
            </div>
            <div className="text-lg sm:text-xl font-black font-mono text-amber-400">
              {totalListening}
              <span className="text-[11px] font-normal text-stone-400 ml-0.5">회</span>
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-stone-950/80 border border-emerald-500/30 space-y-1">
            <div className="flex items-center gap-1 text-[10px] text-emerald-300 font-semibold">
              <Mic className="w-3 h-3 text-emerald-400" />
              <span>쉐도잉</span>
            </div>
            <div className="text-lg sm:text-xl font-black font-mono text-emerald-400">
              {totalShadowing}
              <span className="text-[11px] font-normal text-stone-400 ml-0.5">회</span>
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-stone-950/80 border border-rose-500/25 space-y-1">
            <div className="flex items-center gap-1 text-[10px] text-rose-300 font-semibold">
              <Heart className="w-3 h-3 text-rose-400" />
              <span>평균 적합도</span>
            </div>
            <div className="text-lg sm:text-xl font-black font-mono text-rose-400">
              {avgScore}
              <span className="text-[11px] font-normal text-stone-400 ml-0.5">%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Supabase Sync Status / Table Setup Banner */}
      {syncedWithSupabase ? (
        <div className="flex items-center justify-between gap-2 px-3.5 py-2.5 rounded-2xl bg-emerald-950/40 border border-emerald-500/40 text-xs text-emerald-200 shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="font-semibold truncate">
              Supabase (<code className="font-mono text-emerald-300">user_activity_logs</code>) 실시간 연동 완료
            </span>
          </div>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono shrink-0">
            CONNECTED
          </span>
        </div>
      ) : needsTableSetup ? (
        <div className="rounded-2xl bg-amber-500/10 border border-amber-500/40 p-3.5 space-y-2.5 text-xs shrink-0">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <p className="font-bold text-amber-200">
                  Supabase 테이블 생성 SQL 실행 필요
                </p>
                <p className="text-[11px] text-stone-300 leading-relaxed">
                  현재 활동 기록은 브라우저에 안전하게 임시 저장되어 있습니다. Supabase SQL Editor에서{' '}
                  <code className="text-amber-300 font-mono">user_activity_logs</code> 테이블 SQL을 1회 실행하면 영구 저장됩니다.
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopySql}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-[11px] transition-all cursor-pointer"
            >
              {copiedSql ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedSql ? 'SQL 복사 완료!' : '테이블 생성 SQL 복사'}</span>
            </button>
            <button
              type="button"
              onClick={() => setShowSqlPreview(prev => !prev)}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-stone-900 hover:bg-stone-800 border border-stone-700 text-stone-300 text-[11px] font-semibold transition-colors cursor-pointer"
            >
              <span>{showSqlPreview ? 'SQL 접기' : 'SQL 보기'}</span>
              {showSqlPreview ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
          </div>

          {showSqlPreview && (
            <pre className="p-3 rounded-xl bg-stone-950 border border-stone-800 text-[10px] font-mono text-amber-200/90 overflow-x-auto max-h-48 custom-scrollbar">
              {ACTIVITY_TABLE_SQL}
            </pre>
          )}
        </div>
      ) : statusMessage ? (
        <div className="flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-stone-950 border border-stone-800 text-[11px] text-stone-400 shrink-0">
          <Database className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          <span className="truncate">{statusMessage}</span>
        </div>
      ) : null}

      {/* Scrollable Activity Records Timeline */}
      <div className="flex-1 flex flex-col min-h-[260px] space-y-2.5 overflow-hidden">
        <div className="flex items-center justify-between px-1 shrink-0">
          <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
            <Clock className="w-4 h-4 text-amber-400" />
            <span>활동 기록 타임라인</span>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-stone-800 text-amber-300 border border-stone-700">
              {logs.length}건
            </span>
          </h3>
          <span className="text-[10px] text-stone-500 font-mono">최신순 (timestamp)</span>
        </div>

        <div className="flex-1 overflow-y-auto space-y-3 pr-1 custom-scrollbar touch-pan-y pb-2">
          {isLoading ? (
            <div className="py-12 text-center space-y-2">
              <RefreshCw className="w-6 h-6 text-amber-400 animate-spin mx-auto" />
              <p className="text-xs text-stone-400">활동 기록을 불러오는 중입니다...</p>
            </div>
          ) : logs.length === 0 ? (
            <div className="rounded-3xl bg-stone-950/70 border border-stone-800 p-8 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center mx-auto">
                <Headphones className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-bold text-white">아직 기록된 학습 활동이 없습니다</p>
                <p className="text-xs text-stone-400 leading-relaxed">
                  시나리오를 플레이하면서 원어민 음성을 듣고 따라 말하면
                  <br />
                  듣기 횟수와 쉐도잉 횟수가 타임스탬프와 함께 자동 저장됩니다.
                </p>
              </div>
              <button
                type="button"
                onClick={onBackToHome}
                className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs transition-all cursor-pointer"
              >
                시나리오 시작하기
              </button>
            </div>
          ) : (
            logs.map(log => (
              <div
                key={log.id}
                className="p-3.5 sm:p-4 rounded-2xl bg-stone-950/85 border border-stone-800 hover:border-amber-500/40 transition-all space-y-2.5 shadow-md"
              >
                {/* Row 1: Scenario Name + CEFR + Sync Source */}
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 space-y-0.5">
                    <h4 className="text-xs sm:text-sm font-bold text-white truncate">
                      {log.scenario_name}
                    </h4>
                    <div className="flex items-center gap-2 text-[10px] text-stone-400 font-mono">
                      <span className="inline-flex items-center gap-1">
                        <Clock className="w-3 h-3 text-stone-500" />
                        {formatActivityTimestamp(log.recorded_at)}
                      </span>
                      <span className="inline-flex items-center gap-1 text-stone-300">
                        <User className="w-3 h-3 text-stone-500" />
                        {log.nickname || '익명'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    {log.cefr_level && (
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-lg bg-amber-500/15 text-amber-300 border border-amber-500/30">
                        {log.cefr_level}
                      </span>
                    )}
                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-lg border ${
                        log.source === 'supabase'
                          ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                          : 'bg-stone-800 text-stone-400 border-stone-700'
                      }`}
                    >
                      {log.source === 'supabase' ? 'Supabase' : '로컬'}
                    </span>
                  </div>
                </div>

                {/* Row 2: Listening Count, Shadowing Count, Appropriateness Score */}
                <div className="grid grid-cols-3 gap-2 pt-1.5 border-t border-stone-800/80">
                  <div className="flex items-center justify-between px-2.5 py-1.5 rounded-xl bg-stone-900/90 border border-stone-800/80 text-[11px]">
                    <span className="text-stone-400 flex items-center gap-1">
                      <Headphones className="w-3 h-3 text-amber-400" />
                      듣기
                    </span>
                    <span className="font-mono font-bold text-amber-300">
                      {log.listening_count}회
                    </span>
                  </div>

                  <div className="flex items-center justify-between px-2.5 py-1.5 rounded-xl bg-stone-900/90 border border-stone-800/80 text-[11px]">
                    <span className="text-stone-400 flex items-center gap-1">
                      <Mic className="w-3 h-3 text-emerald-400" />
                      쉐도잉
                    </span>
                    <span className="font-mono font-bold text-emerald-300">
                      {log.shadowing_count}회
                    </span>
                  </div>

                  <div className="flex items-center justify-between px-2.5 py-1.5 rounded-xl bg-stone-900/90 border border-stone-800/80 text-[11px]">
                    <span className="text-stone-400 flex items-center gap-1">
                      <Heart className="w-3 h-3 text-rose-400" />
                      적합도
                    </span>
                    <span className="font-mono font-bold text-rose-300">
                      {log.appropriateness_score}%
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
