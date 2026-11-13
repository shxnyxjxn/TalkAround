import React, { useState } from 'react';
import { RotateCcw, Sheet, Info, Edit3, Target, LogIn, UserCheck, BarChart3 } from 'lucide-react';
import type { User as SupabaseUser } from '@supabase/supabase-js';
import { LearnerProfile } from '../types';

interface LearnerHeaderProps {
  profile: LearnerProfile;
  hasSheetUrl: boolean;
  authUser: SupabaseUser | null;
  isSummaryActive?: boolean;
  onUpdateNickname: (newNickname: string) => void;
  onOpenSheetModal: () => void;
  onOpenAuthModal: () => void;
  onOpenSummary: () => void;
}

export const LearnerHeader: React.FC<LearnerHeaderProps> = ({
  profile,
  hasSheetUrl,
  authUser,
  isSummaryActive = false,
  onUpdateNickname,
  onOpenSheetModal,
  onOpenAuthModal,
  onOpenSummary,
}) => {
  const currentNickname = profile.nickname || profile.name || '익명';
  const [isEditingNickname, setIsEditingNickname] = useState(false);
  const [tempNickname, setTempNickname] = useState(currentNickname);

  const handleSaveNickname = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = tempNickname.trim() || '익명';
    onUpdateNickname(clean);
    setIsEditingNickname(false);
  };

  return (
    <header className="bg-stone-900/95 backdrop-blur-md border-b border-stone-800 sticky top-0 z-30 px-3 sm:px-4 py-2.5 space-y-2.5 select-none">
      {/* Row 1: Learner Nickname on Left, Sheet Sync & Login Link on Right */}
      <div className="flex items-center justify-between gap-2">
        {/* Left: Nickname Input / Display Card */}
        <div className="flex items-center min-w-0">
          {!isEditingNickname ? (
            <button
              type="button"
              onClick={() => {
                setTempNickname(currentNickname === '익명' ? '' : currentNickname);
                setIsEditingNickname(true);
              }}
              className="flex items-center gap-2 px-2.5 py-1.5 rounded-2xl bg-stone-950 hover:bg-stone-850 border border-stone-800 hover:border-amber-500/50 transition-all text-left group cursor-pointer shadow-sm"
              title="닉네임 변경하기 (클릭)"
            >
              <span className="text-lg sm:text-xl shrink-0" role="img" aria-label="avatar">
                {profile.avatar || '🗽'}
              </span>
              <div className="leading-tight min-w-0">
                <div className="flex items-center gap-1">
                  <span className="text-xs sm:text-sm font-bold text-white group-hover:text-amber-300 transition-colors truncate max-w-[90px] sm:max-w-[130px]">
                    {currentNickname}
                  </span>
                  <Edit3 className="w-3 h-3 text-stone-500 group-hover:text-amber-400 shrink-0" />
                </div>
                <span className="text-[10px] text-amber-400/90 font-medium block">
                  닉네임 수정
                </span>
              </div>
            </button>
          ) : (
            <form onSubmit={handleSaveNickname} className="flex items-center gap-1.5">
              <input
                type="text"
                autoFocus
                maxLength={20}
                value={tempNickname}
                onChange={e => setTempNickname(e.target.value)}
                placeholder="닉네임 (미입력 시 익명)"
                className="px-2.5 py-1.5 rounded-xl bg-stone-950 border border-amber-500 text-xs text-white focus:outline-none w-28 sm:w-36 font-semibold"
              />
              <button
                type="submit"
                className="px-2 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs cursor-pointer shrink-0 shadow-sm transition-all"
              >
                저장
              </button>
              <button
                type="button"
                onClick={() => setIsEditingNickname(false)}
                className="px-1.5 py-1.5 text-stone-400 hover:text-white text-xs cursor-pointer"
              >
                취소
              </button>
            </form>
          )}
        </div>

        {/* Right: Google Sheet Sync Button & Login Link */}
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={onOpenSheetModal}
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-2xl text-[11px] sm:text-xs font-bold transition-all cursor-pointer shadow-sm ${
              hasSheetUrl
                ? 'bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/50 text-amber-300'
                : 'bg-stone-850 hover:bg-stone-800 border border-stone-700 text-stone-300 animate-pulse'
            }`}
            title="구글 스프레드시트 연동 설정 및 전송 로그 확인"
          >
            <Sheet className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span className="hidden sm:inline">
              {hasSheetUrl ? '시트 연동 ✅' : '시트 연동'}
            </span>
            <span className="sm:hidden">시트</span>
          </button>

          {/* Top-right Login Link (no page navigation) */}
          <a
            href="#login"
            onClick={e => {
              e.preventDefault();
              onOpenAuthModal();
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-2xl text-[11px] sm:text-xs font-bold transition-all cursor-pointer shadow-sm border ${
              authUser
                ? 'bg-emerald-950/60 hover:bg-emerald-900/70 border-emerald-500/50 text-emerald-300'
                : 'bg-amber-500 hover:bg-amber-400 border-amber-400 text-stone-950'
            }`}
            title={authUser ? `${authUser.email} (클릭하여 계정 관리)` : '로그인'}
          >
            {authUser ? (
              <>
                <UserCheck className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate max-w-[70px]">계정</span>
              </>
            ) : (
              <>
                <LogIn className="w-3.5 h-3.5 shrink-0" />
                <span>로그인</span>
              </>
            )}
          </a>
        </div>
      </div>

      {/* Row 2: Live Metrics Cards & Activity Summary Shortcut */}
      <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
        {/* Metric 1: Cumulative Play Count */}
        <div
          className="flex items-center justify-between px-2.5 py-2 rounded-2xl bg-stone-950/90 border border-stone-800/90 text-xs shadow-inner"
          title="누적 시뮬레이션 플레이 횟수 (play_count)"
        >
          <div className="flex items-center gap-1 min-w-0">
            <div className="p-1 rounded-lg bg-stone-900 border border-stone-800 text-stone-400 shrink-0 hidden sm:block">
              <RotateCcw className="w-3 h-3" />
            </div>
            <span className="text-stone-400 text-[10px] sm:text-[11px] font-medium truncate">
              누적
            </span>
          </div>
          <div className="flex items-baseline gap-0.5 shrink-0">
            <span className="font-mono font-black text-amber-400 text-xs sm:text-sm">
              {profile.play_count || 0}
            </span>
            <span className="text-[9px] sm:text-[10px] text-stone-500">회</span>
          </div>
        </div>

        {/* Metric 2: Recent Appropriateness Score */}
        <div
          className="flex items-center justify-between px-2.5 py-2 rounded-2xl bg-stone-950/90 border border-amber-500/30 text-xs shadow-inner"
          title="최근 시나리오 대화 적합도 퍼센트/점수 (appropriateness_score)"
        >
          <div className="flex items-center gap-1 min-w-0">
            <div className="p-1 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400 shrink-0 hidden sm:block">
              <Target className="w-3 h-3" />
            </div>
            <span className="text-stone-300 text-[10px] sm:text-[11px] font-medium truncate">
              적합도
            </span>
          </div>
          <div className="flex items-baseline gap-0.5 shrink-0">
            {profile.last_appropriateness_score !== undefined ? (
              <>
                <span className="font-mono font-black text-amber-400 text-xs sm:text-sm">
                  {profile.last_appropriateness_score}
                </span>
                <span className="text-[9px] sm:text-[10px] text-amber-300 font-bold">%</span>
              </>
            ) : (
              <span className="text-stone-500 text-[10px] font-medium">대기</span>
            )}
          </div>
        </div>

        {/* Shortcut 3: Activity Summary Page */}
        <button
          type="button"
          onClick={onOpenSummary}
          className={`flex items-center justify-between px-2.5 py-2 rounded-2xl border text-xs transition-all cursor-pointer shadow-inner ${
            isSummaryActive
              ? 'bg-amber-500/20 border-amber-400 text-amber-200'
              : 'bg-stone-950/90 hover:bg-stone-850 border-emerald-500/30 hover:border-emerald-400/60 text-emerald-200'
          }`}
          title="듣기·쉐도잉 활동 기록 요약 페이지 보기"
        >
          <div className="flex items-center gap-1 min-w-0">
            <BarChart3 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span className="text-[10px] sm:text-[11px] font-bold truncate">
              활동 요약
            </span>
          </div>
          <span className="font-mono text-[10px] text-emerald-300 font-bold shrink-0">
            {(profile.total_listening_count || 0) + (profile.total_shadowing_count || 0)}
          </span>
        </button>
      </div>

      {/* Row 3: Mandatory Notice Text (개인정보 수집 및 학습 기록 안내 문구) */}
      <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-[10px] sm:text-[11px] text-amber-200">
        <Info className="w-3.5 h-3.5 text-amber-400 shrink-0" />
        <p className="leading-tight truncate">
          학습 참여도 및 피드백 제공을 위해 닉네임, 플레이한 시나리오, 대화 적합도 점수가 구글 시트에 자동 기록됩니다.
        </p>
      </div>
    </header>
  );
};
