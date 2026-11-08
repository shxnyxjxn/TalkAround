import React, { useState } from 'react';
import { RotateCcw, Sheet, Info, Edit3, Sparkles, Target, Compass } from 'lucide-react';
import { LearnerProfile } from '../types';

interface LearnerHeaderProps {
  profile: LearnerProfile;
  hasSheetUrl: boolean;
  onUpdateNickname: (newNickname: string) => void;
  onOpenSheetModal: () => void;
}

export const LearnerHeader: React.FC<LearnerHeaderProps> = ({
  profile,
  hasSheetUrl,
  onUpdateNickname,
  onOpenSheetModal,
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
      {/* Row 1: Learner Nickname on Left, Google Sheet Sync Button on Right */}
      <div className="flex items-center justify-between gap-2.5">
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
              <span className="text-xl shrink-0" role="img" aria-label="avatar">
                {profile.avatar || '🗽'}
              </span>
              <div className="leading-tight min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs sm:text-sm font-bold text-white group-hover:text-amber-300 transition-colors truncate max-w-[120px] sm:max-w-[160px]">
                    {currentNickname}
                  </span>
                  <Edit3 className="w-3 h-3 text-stone-500 group-hover:text-amber-400 shrink-0" />
                </div>
                <span className="text-[10px] text-amber-400/90 font-medium block">
                  학습자 닉네임 수정
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
                placeholder="닉네임 입력 (미입력 시 '익명')"
                className="px-2.5 py-1.5 rounded-xl bg-stone-950 border border-amber-500 text-xs text-white focus:outline-none w-32 sm:w-40 font-semibold"
              />
              <button
                type="submit"
                className="px-2.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs cursor-pointer shrink-0 shadow-sm transition-all"
              >
                저장
              </button>
              <button
                type="button"
                onClick={() => setIsEditingNickname(false)}
                className="px-2 py-1.5 text-stone-400 hover:text-white text-xs cursor-pointer"
              >
                취소
              </button>
            </form>
          )}
        </div>

        {/* Right: Google Sheet Sync Button */}
        <div className="flex items-center shrink-0">
          <button
            type="button"
            onClick={onOpenSheetModal}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-2xl text-xs font-bold transition-all cursor-pointer shadow-sm ${
              hasSheetUrl
                ? 'bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/50 text-amber-300'
                : 'bg-stone-850 hover:bg-stone-800 border border-stone-700 text-stone-300 animate-pulse'
            }`}
            title="구글 스프레드시트 연동 설정 및 전송 로그 확인"
          >
            <Sheet className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-[11px] sm:text-xs">
              {hasSheetUrl ? '구글 시트 연동 중 ✅' : '구글 시트 연동 설정'}
            </span>
          </button>
        </div>
      </div>

      {/* Row 2: Live Metrics Cards (다크 & 옐로우 테마: 플레이 횟수 & 최근 대화 적합도 점수) */}
      <div className="grid grid-cols-2 gap-2">
        {/* Metric 1: Cumulative Play Count */}
        <div
          className="flex items-center justify-between px-3 py-2 rounded-2xl bg-stone-950/90 border border-stone-800/90 text-xs shadow-inner"
          title="누적 시뮬레이션 플레이 횟수 (play_count)"
        >
          <div className="flex items-center gap-1.5">
            <div className="p-1 rounded-lg bg-stone-900 border border-stone-800 text-stone-400">
              <RotateCcw className="w-3.5 h-3.5" />
            </div>
            <span className="text-stone-400 text-[11px] font-medium">누적 플레이</span>
          </div>
          <div className="flex items-baseline gap-0.5">
            <span className="font-mono font-black text-amber-400 text-sm sm:text-base">
              {profile.play_count || 0}
            </span>
            <span className="text-[10px] text-stone-500">회</span>
          </div>
        </div>

        {/* Metric 2: Recent Appropriateness Score */}
        <div
          className="flex items-center justify-between px-3 py-2 rounded-2xl bg-stone-950/90 border border-amber-500/30 text-xs shadow-inner"
          title="최근 시나리오 대화 적합도 퍼센트/점수 (appropriateness_score)"
        >
          <div className="flex items-center gap-1.5">
            <div className="p-1 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400">
              <Target className="w-3.5 h-3.5" />
            </div>
            <span className="text-stone-300 text-[11px] font-medium">최근 대화 적합도</span>
          </div>
          <div className="flex items-baseline gap-0.5">
            {profile.last_appropriateness_score !== undefined ? (
              <>
                <span className="font-mono font-black text-amber-400 text-sm sm:text-base">
                  {profile.last_appropriateness_score}
                </span>
                <span className="text-[10px] text-amber-300 font-bold">%</span>
              </>
            ) : (
              <span className="text-stone-500 text-[11px] font-medium">측정 대기</span>
            )}
          </div>
        </div>
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
