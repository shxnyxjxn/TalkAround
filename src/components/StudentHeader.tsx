import React from 'react';
import { Volume2, VolumeX, User, Sparkles, CheckCircle2, XCircle, RotateCcw, Sheet, Settings } from 'lucide-react';
import { StudentProfile } from '../types';
import { soundEffects } from '../utils/audioEffects';
import { sentenceTracker } from '../utils/sentenceTapTracker';

interface StudentHeaderProps {
  profile: StudentProfile;
  hasSheetUrl: boolean;
  onEditProfile: () => void;
  onOpenSheetModal: () => void;
  isMuted: boolean;
  onToggleMute: () => void;
}

export const StudentHeader: React.FC<StudentHeaderProps> = ({
  profile,
  hasSheetUrl,
  onEditProfile,
  onOpenSheetModal,
  isMuted,
  onToggleMute,
}) => {
  const totalAnswers = profile.correct_count + profile.wrong_count;
  const accuracy = totalAnswers > 0 ? Math.round((profile.correct_count / totalAnswers) * 100) : 100;

  return (
    <header className="bg-stone-900/90 backdrop-blur-md border-b border-stone-800 sticky top-0 z-30 px-3 sm:px-6 py-2.5">
      <div className="max-w-4xl mx-auto flex items-center justify-between gap-3">
        {/* Left: Student Profile */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={onEditProfile}
            className="flex items-center gap-2 px-2.5 py-1.5 rounded-2xl bg-stone-800/90 hover:bg-stone-700/90 border border-stone-700 transition-all text-left group cursor-pointer"
            title="학생 프로필 변경"
          >
            <span className="text-xl sm:text-2xl" role="img" aria-label="avatar">
              {profile.avatar || '⭐'}
            </span>
            <div className="leading-tight">
              <div className="flex items-center gap-1.5">
                <span className="text-xs sm:text-sm font-bold text-white group-hover:text-amber-300 transition-colors">
                  {profile.name}
                </span>
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-blue-500/20 text-blue-300 font-semibold">
                  초등 5학년
                </span>
              </div>
              <span className="text-[10px] text-stone-400 group-hover:text-stone-300">
                이름 변경 ✏️
              </span>
            </div>
          </button>
        </div>

        {/* Center: Live Stats Badges */}
        <div className="hidden sm:flex items-center gap-3">
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-stone-950/70 border border-stone-800 text-xs">
            <span className="text-stone-400">플레이</span>
            <span className="font-mono font-black text-amber-400">{profile.play_count}</span>
            <span className="text-[10px] text-stone-500">회</span>
          </div>

          <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-emerald-950/40 border border-emerald-800/40 text-xs">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-emerald-300 font-medium">정답</span>
            <span className="font-mono font-black text-emerald-300">{profile.correct_count}</span>
          </div>

          <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-rose-950/40 border border-rose-800/40 text-xs">
            <XCircle className="w-3.5 h-3.5 text-rose-400" />
            <span className="text-rose-300 font-medium">오답</span>
            <span className="font-mono font-black text-rose-300">{profile.wrong_count}</span>
          </div>

          <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-indigo-950/40 border border-indigo-800/40 text-xs">
            <span className="text-indigo-300 font-medium">정답률</span>
            <span className="font-mono font-black text-indigo-300">{accuracy}%</span>
          </div>

          <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-purple-950/40 border border-purple-800/40 text-xs" title="각 문장별 평균 탭 횟수">
            <span className="text-purple-300 font-medium">문장 탭 평균</span>
            <span className="font-mono font-black text-purple-300">{sentenceTracker.getStats().averageTaps}회</span>
          </div>
        </div>

        {/* Right: Google Sheet & Controls */}
        <div className="flex items-center gap-2">
          {/* Google Sheet Sync Button */}
          <button
            onClick={onOpenSheetModal}
            className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              hasSheetUrl
                ? 'bg-emerald-900/60 hover:bg-emerald-800/80 border border-emerald-500/60 text-emerald-200'
                : 'bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/50 text-amber-200 animate-pulse'
            }`}
            title="구글 시트 연동 설정 및 Apps Script 코드 확인"
          >
            <Sheet className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">
              {hasSheetUrl ? '구글 시트 연동 중 ✅' : '구글 시트 연동하기'}
            </span>
            <span className="sm:hidden">시트 연동</span>
          </button>

          {/* Sound Mute Toggle */}
          <button
            onClick={onToggleMute}
            className={`p-2 rounded-xl border transition-all cursor-pointer ${
              isMuted
                ? 'bg-stone-800 text-stone-500 border-stone-700'
                : 'bg-stone-800 text-amber-400 border-amber-500/40 hover:bg-stone-700'
            }`}
            title={isMuted ? '음소거 해제' : '음소거'}
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Mobile Stat Bar */}
      <div className="flex sm:hidden items-center justify-around gap-2 pt-2 border-t border-stone-800/60 mt-2 text-[11px]">
        <div className="flex items-center gap-1 text-stone-300">
          <span className="text-stone-500">플레이:</span>
          <span className="font-mono font-bold text-amber-400">{profile.play_count}회</span>
        </div>
        <div className="flex items-center gap-1 text-emerald-400">
          <span>정답:</span>
          <span className="font-mono font-bold">{profile.correct_count}</span>
        </div>
        <div className="flex items-center gap-1 text-rose-400">
          <span>오답:</span>
          <span className="font-mono font-bold">{profile.wrong_count}</span>
        </div>
        <div className="flex items-center gap-1 text-indigo-400">
          <span>정답률:</span>
          <span className="font-mono font-bold">{accuracy}%</span>
        </div>
      </div>
    </header>
  );
};
