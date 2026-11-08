import React, { useState } from 'react';
import { User, Sparkles, Check, RotateCcw, X } from 'lucide-react';
import { StudentProfile } from '../types';

interface StudentProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: StudentProfile;
  onSaveProfile: (updated: Partial<StudentProfile>) => void;
  onResetStats: () => void;
}

const AVATAR_OPTIONS = ['🐰', '🦁', '🚀', '🐱', '🐶', '🌟', '🐼', '🐬', '🦊', '👑', '⚽', '🎨'];

export const StudentProfileModal: React.FC<StudentProfileModalProps> = ({
  isOpen,
  onClose,
  profile,
  onSaveProfile,
  onResetStats,
}) => {
  const [name, setName] = useState(profile.name);
  const [avatar, setAvatar] = useState(profile.avatar || '⭐');
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    onSaveProfile({ name: trimmed, avatar });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="w-full max-w-md bg-stone-900 border border-stone-800 rounded-3xl p-5 sm:p-6 shadow-2xl space-y-5"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-white">
                학생 프로필 등록
              </h3>
              <p className="text-xs text-stone-400">
                구글 시트에 기록될 학생 이름을 입력하세요
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-stone-400 hover:text-white hover:bg-stone-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Avatar Picker */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-stone-300">
              내 캐릭터 아바타 선택
            </label>
            <div className="grid grid-cols-6 gap-2">
              {AVATAR_OPTIONS.map(emo => (
                <button
                  type="button"
                  key={emo}
                  onClick={() => setAvatar(emo)}
                  className={`h-11 rounded-2xl text-xl flex items-center justify-center transition-all cursor-pointer ${
                    avatar === emo
                      ? 'bg-amber-500/30 border-2 border-amber-500 scale-105 shadow-md'
                      : 'bg-stone-950/70 border border-stone-800 hover:bg-stone-800'
                  }`}
                >
                  {emo}
                </button>
              ))}
            </div>
          </div>

          {/* Student Name */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-stone-300 flex items-center justify-between">
              <span>학생 이름 (name)</span>
              <span className="text-[11px] text-stone-500 font-normal">초등 5학년</span>
            </label>
            <input
              type="text"
              required
              maxLength={20}
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="예: 김민준, 이지우, Sarah"
              className="w-full px-4 py-3 rounded-2xl bg-stone-950 border border-stone-800 text-stone-100 placeholder:text-stone-600 focus:outline-none focus:border-amber-500 text-sm font-semibold"
            />
            <p className="text-[11px] text-stone-400">
              * 구글 스프레드시트의 <code className="text-amber-300">name</code> 열에 이 이름으로 저장됩니다.
            </p>
          </div>

          {/* Accumulated Stats Preview */}
          <div className="p-3 rounded-2xl bg-stone-950/60 border border-stone-800 flex items-center justify-around text-xs">
            <div className="text-center">
              <div className="text-[10px] text-stone-500">누적 플레이</div>
              <div className="font-mono font-bold text-amber-400 text-sm">{profile.play_count}회</div>
            </div>
            <div className="text-center">
              <div className="text-[10px] text-stone-500">누적 정답</div>
              <div className="font-mono font-bold text-emerald-400 text-sm">{profile.correct_count}개</div>
            </div>
            <div className="text-center">
              <div className="text-[10px] text-stone-500">누적 오답</div>
              <div className="font-mono font-bold text-rose-400 text-sm">{profile.wrong_count}개</div>
            </div>
          </div>

          {/* Reset Stats Option for new student */}
          <div className="pt-1">
            {!showResetConfirm ? (
              <button
                type="button"
                onClick={() => setShowResetConfirm(true)}
                className="text-[11px] text-stone-500 hover:text-stone-400 flex items-center gap-1 cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" />
                <span>새로운 학생으로 시작 (기록 0으로 초기화)</span>
              </button>
            ) : (
              <div className="p-2.5 rounded-xl bg-rose-950/40 border border-rose-800/60 flex items-center justify-between text-xs">
                <span className="text-rose-300 text-[11px]">누적 점수를 0으로 리셋할까요?</span>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      onResetStats();
                      setShowResetConfirm(false);
                    }}
                    className="px-2.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold text-[11px] cursor-pointer"
                  >
                    초기화
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowResetConfirm(false)}
                    className="px-2 py-1 rounded-lg bg-stone-800 text-stone-300 text-[11px] cursor-pointer"
                  >
                    취소
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Submit Button */}
          <div className="pt-2">
            <button
              type="submit"
              className="w-full py-3.5 rounded-2xl bg-amber-500 hover:bg-amber-400 active:scale-[0.98] text-stone-950 font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 transition-all cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>프로필 저장하고 게임 시작하기</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
