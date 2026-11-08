import React, { useState } from 'react';
import { User, CheckCircle2, XCircle, RotateCcw, Sheet, Info, Edit3, Sparkles } from 'lucide-react';
import { LearnerProfile } from '../types';

interface LearnerHeaderProps {
  profile: LearnerProfile;
  hasSheetUrl: boolean;
  onUpdateName: (newName: string) => void;
  onOpenSheetModal: () => void;
  onResetStats?: () => void;
}

export const LearnerHeader: React.FC<LearnerHeaderProps> = ({
  profile,
  hasSheetUrl,
  onUpdateName,
  onOpenSheetModal,
  onResetStats,
}) => {
  const [isEditingName, setIsEditingName] = useState(false);
  const [tempName, setTempName] = useState(profile.name);

  const handleSaveName = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = tempName.trim() || '익명 학습자';
    onUpdateName(clean);
    setIsEditingName(false);
  };

  return (
    <div className="bg-stone-900/95 backdrop-blur-md border-b border-stone-800 sticky top-0 z-30 px-3 sm:px-4 py-2.5 space-y-2">
      {/* Top Main Row */}
      <div className="flex items-center justify-between gap-2">
        {/* Left: Learner Profile & Nickname */}
        <div className="flex items-center gap-2 min-w-0">
          {!isEditingName ? (
            <button
              onClick={() => {
                setTempName(profile.name === '익명 학습자' ? '' : profile.name);
                setIsEditingName(true);
              }}
              className="flex items-center gap-2 px-2.5 py-1 rounded-2xl bg-stone-850 hover:bg-stone-800 border border-stone-700/80 transition-all text-left group cursor-pointer"
              title="닉네임 변경하기 (클릭)"
            >
              <span className="text-lg sm:text-xl" role="img" aria-label="avatar">
                {profile.avatar || '🗽'}
              </span>
              <div className="leading-tight min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs sm:text-sm font-bold text-white group-hover:text-amber-300 transition-colors truncate max-w-[110px] sm:max-w-[150px]">
                    {profile.name || '익명 학습자'}
                  </span>
                  <Edit3 className="w-3 h-3 text-stone-500 group-hover:text-amber-400 shrink-0" />
                </div>
                <span className="text-[10px] text-stone-400 group-hover:text-stone-300 block">
                  닉네임 변경
                </span>
              </div>
            </button>
          ) : (
            <form onSubmit={handleSaveName} className="flex items-center gap-1.5">
              <input
                type="text"
                autoFocus
                maxLength={20}
                value={tempName}
                onChange={e => setTempName(e.target.value)}
                placeholder="닉네임 입력 (미입력 시 익명)"
                className="px-2.5 py-1 rounded-xl bg-stone-950 border border-amber-500/80 text-xs text-white focus:outline-none w-28 sm:w-36 font-semibold"
              />
              <button
                type="submit"
                className="px-2 py-1 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs cursor-pointer shrink-0"
              >
                저장
              </button>
              <button
                type="button"
                onClick={() => setIsEditingName(false)}
                className="px-1.5 py-1 text-stone-400 hover:text-white text-xs cursor-pointer"
              >
                취소
              </button>
            </form>
          )}
        </div>

        {/* Center: Live Stats Badges */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Play count */}
          <div className="flex items-center gap-1 px-2 sm:px-2.5 py-1 rounded-xl bg-stone-950/80 border border-stone-800 text-[11px] sm:text-xs" title="시뮬레이션 완료 횟수">
            <span className="text-stone-400 hidden sm:inline">플레이</span>
            <span className="font-mono font-black text-amber-400">{profile.play_count}</span>
            <span className="text-[10px] text-stone-500">회</span>
          </div>

          {/* Correct count */}
          <div className="flex items-center gap-1 px-2 sm:px-2.5 py-1 rounded-xl bg-emerald-950/40 border border-emerald-800/40 text-[11px] sm:text-xs" title="원어민 100% 모범 표현 선택 수">
            <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
            <span className="text-emerald-300 font-medium hidden sm:inline">정답</span>
            <span className="font-mono font-black text-emerald-300">{profile.correct_count}</span>
          </div>

          {/* Wrong count */}
          <div className="flex items-center gap-1 px-2 sm:px-2.5 py-1 rounded-xl bg-rose-950/40 border border-rose-800/40 text-[11px] sm:text-xs" title="부적절하거나 어색한 표현 / 실수 선택 수">
            <XCircle className="w-3 h-3 text-rose-400 shrink-0" />
            <span className="text-rose-300 font-medium hidden sm:inline">실수</span>
            <span className="font-mono font-black text-rose-300">{profile.wrong_count}</span>
          </div>
        </div>

        {/* Right: Google Sheet Sync Button */}
        <div className="flex items-center shrink-0">
          <button
            onClick={onOpenSheetModal}
            className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              hasSheetUrl
                ? 'bg-emerald-950/80 hover:bg-emerald-900/90 border border-emerald-500/60 text-emerald-300 shadow-sm'
                : 'bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/50 text-amber-300 animate-pulse'
            }`}
            title="구글 스프레드시트 연동 설정 및 전송 로그 확인"
          >
            <Sheet className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">
              {hasSheetUrl ? '구글 시트 연동 중 ✅' : '시트 연동 설정'}
            </span>
            <span className="sm:hidden">시트</span>
          </button>
        </div>
      </div>

      {/* Mandatory Notice Text (교수님 수업 지침 반영 문구) */}
      <div className="flex items-center gap-1.5 px-2 py-1 rounded-xl bg-stone-950/60 border border-stone-800/80 text-[10px] sm:text-[11px] text-stone-400">
        <Info className="w-3 h-3 text-amber-400 shrink-0" />
        <p className="leading-tight truncate">
          학습 참여도 및 피드백 제공을 위해 닉네임과 시뮬레이션 플레이 기록이 구글 시트에 자동 기록됩니다.
        </p>
      </div>
    </div>
  );
};
