import React, { useState } from 'react';
import { X, Sparkles, ShieldCheck, Loader2, LogOut, User } from 'lucide-react';
import type { User as SupabaseUser } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/client';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: SupabaseUser | null;
  onAuthSuccess?: (user: SupabaseUser | null) => void;
}

const GoogleLogo: React.FC = () => (
  <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
    <path
      fill="#4285F4"
      d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17Z"
    />
    <path
      fill="#34A853"
      d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.11-6.72-4.96H1.29v3.14C3.26 21.3 7.31 24 12 24Z"
    />
    <path
      fill="#FBBC05"
      d="M5.28 14.24c-.24-.72-.38-1.49-.38-2.24s.14-1.52.38-2.24V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.99-3.14Z"
    />
    <path
      fill="#EA4335"
      d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.99 3.14c.95-2.85 3.6-4.96 6.72-4.96Z"
    />
  </svg>
);

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  user,
  onAuthSuccess,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [noticeMsg, setNoticeMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleGoogleLoginClick = () => {
    setNoticeMsg(null);
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      setNoticeMsg('Google 로그인 UI가 준비되었습니다. 추후 OAuth 연동 시 바로 로그인됩니다.');
    }, 350);
  };

  const handleSignOut = async () => {
    setIsLoading(true);
    setNoticeMsg(null);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      onAuthSuccess?.(null);
      onClose();
    } catch (err: any) {
      setNoticeMsg(err?.message || '로그아웃 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm relative overflow-hidden rounded-3xl bg-gradient-to-b from-stone-800/95 via-stone-900 to-stone-950 border border-amber-500/30 shadow-2xl shadow-black/80 select-none"
        onClick={e => e.stopPropagation()}
      >
        {/* Subtle NYC Nightglow Ambience matching main page */}
        <div className="absolute -top-20 -right-20 w-44 h-44 bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -left-20 w-44 h-44 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

        {/* Top Bar */}
        <div className="relative z-10 px-5 pt-5 pb-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/30">
              NYC Simulator
            </span>
            <span className="text-[11px] text-stone-400 font-medium flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-amber-400" />
              간편 로그인
            </span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-stone-400 hover:text-white hover:bg-stone-800/80 transition-colors cursor-pointer"
            aria-label="로그인 팝업 닫기"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="relative z-10 px-6 pt-3 pb-7 space-y-6">
          {user ? (
            <div className="space-y-5">
              <div className="text-center space-y-1.5">
                <div className="w-12 h-12 mx-auto rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 mb-2">
                  <User className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-black text-white">현재 로그인된 계정</h3>
                <p className="text-xs text-stone-400">토크어라운드 학습 기록이 연동됩니다</p>
              </div>

              <div className="p-4 rounded-2xl bg-stone-950/90 border border-stone-800 space-y-1.5 text-center">
                <div className="text-[11px] text-stone-400">Google 계정</div>
                <div className="text-sm font-bold text-amber-300 break-all">{user.email}</div>
              </div>

              {noticeMsg && (
                <div className="p-3 rounded-2xl bg-stone-950/80 border border-amber-500/30 text-xs text-amber-200 text-center">
                  {noticeMsg}
                </div>
              )}

              <button
                type="button"
                onClick={handleSignOut}
                disabled={isLoading}
                className="w-full py-3.5 rounded-2xl bg-stone-800 hover:bg-rose-950/70 hover:border-rose-500/40 border border-stone-700 text-stone-200 hover:text-rose-200 font-bold text-sm flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <LogOut className="w-4 h-4" />
                )}
                <span>로그아웃</span>
              </button>
            </div>
          ) : (
            <>
              {/* Brand Headline matching StartScreen */}
              <div className="text-center space-y-2 pt-1">
                <h2 className="text-2xl font-black tracking-tight text-white flex items-center justify-center gap-1.5">
                  <span>토크어라운드</span>
                  <span className="text-amber-400 text-xl font-mono">Talk Around</span>
                </h2>
                <p className="text-xs sm:text-sm text-stone-300 leading-relaxed">
                  뉴요커 원어민 뉘앙스 실전 훈련을<br />
                  <strong className="text-amber-300 font-semibold">Google 계정</strong> 하나로 바로 시작해 보세요.
                </p>
              </div>

              {/* Highlight Box + Single Google Login Action */}
              <div className="p-4 rounded-2xl bg-stone-950/80 border border-stone-800/90 space-y-3.5 shadow-inner">
                <button
                  type="button"
                  onClick={handleGoogleLoginClick}
                  disabled={isLoading}
                  className="w-full py-3.5 px-4 rounded-2xl bg-white hover:bg-stone-100 active:scale-[0.98] text-stone-900 font-bold text-sm flex items-center justify-center gap-3 shadow-lg shadow-black/40 border border-stone-200 transition-all cursor-pointer disabled:opacity-60"
                >
                  {isLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin text-stone-700" />
                  ) : (
                    <GoogleLogo />
                  )}
                  <span>Google로 계속하기</span>
                </button>

                {noticeMsg && (
                  <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-[11px] text-amber-200 text-center leading-relaxed">
                    {noticeMsg}
                  </div>
                )}
              </div>

              {/* Clean Footer Note */}
              <div className="flex items-center justify-center gap-1.5 text-[11px] text-stone-400">
                <ShieldCheck className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span>별도의 회원가입 없이 Google 계정으로 통합 로그인됩니다</span>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
