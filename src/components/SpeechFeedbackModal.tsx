import React from 'react';
import { CheckCircle2, AlertCircle, Sparkles, ArrowRight, Volume2, ShieldCheck, TrendingUp, TrendingDown } from 'lucide-react';
import { SpeechEvaluation, Episode, Turn } from '../types';
import { AudioButton } from './AudioButton';
import { NpcAvatar } from './NpcAvatar';

interface SpeechFeedbackModalProps {
  evaluation: SpeechEvaluation;
  userSpokenText: string;
  currentTurn: Turn;
  episode: Episode;
  playbackSpeed: number;
  onProceed: () => void;
}

export const SpeechFeedbackModal: React.FC<SpeechFeedbackModalProps> = ({
  evaluation,
  userSpokenText,
  currentTurn,
  episode,
  playbackSpeed,
  onProceed,
}) => {
  const isPositive = evaluation.affinityChange >= 10;
  const isNegative = evaluation.affinityChange < 0;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/85 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="w-full max-w-lg bg-stone-900 border-t sm:border border-stone-800 rounded-t-3xl sm:rounded-3xl p-5 sm:p-6 shadow-2xl space-y-4 max-h-[88vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header: CEFR & Affinity Delta */}
        <div className="flex items-center justify-between pb-3 border-b border-stone-800">
          <div className="flex items-center gap-2.5">
            {isPositive ? (
              <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                <CheckCircle2 className="w-5 h-5" />
              </div>
            ) : isNegative ? (
              <div className="p-2 rounded-xl bg-rose-500/20 text-rose-400 border border-rose-500/40">
                <AlertCircle className="w-5 h-5" />
              </div>
            ) : (
              <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/40">
                <Sparkles className="w-5 h-5" />
              </div>
            )}
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-sm sm:text-base font-bold text-white leading-tight">
                  {evaluation.feedbackTitle}
                </h4>
              </div>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  평가 등급: {evaluation.cefrLevel}
                </span>
                <span className="text-[11px] text-stone-400">
                  AI 실전 발화 진단 리포트
                </span>
              </div>
            </div>
          </div>

          {/* Affinity Delta Badge */}
          <div
            className={`flex items-center gap-1 px-3 py-1.5 rounded-xl font-mono text-xs font-extrabold border ${
              isPositive
                ? 'bg-emerald-950/60 border-emerald-500/50 text-emerald-400'
                : isNegative
                ? 'bg-rose-950/60 border-rose-500/50 text-rose-400'
                : 'bg-stone-800 border-stone-700 text-stone-300'
            }`}
          >
            {isPositive ? <TrendingUp className="w-3.5 h-3.5" /> : isNegative ? <TrendingDown className="w-3.5 h-3.5" /> : null}
            <span>{evaluation.affinityChange >= 0 ? `+${evaluation.affinityChange}%` : `${evaluation.affinityChange}%`}</span>
          </div>
        </div>

        {/* User's Actual Spoken Speech */}
        <div className="p-3.5 rounded-2xl bg-stone-950/90 border border-stone-800 space-y-1.5">
          <div className="flex items-center justify-between text-[11px] text-stone-400">
            <span className="font-semibold text-stone-300">🗣️ 내가 직접 말한 영어 (Your Speech)</span>
            <AudioButton text={userSpokenText} speed={playbackSpeed} label="내 발음 듣기" size="sm" variant="pill" />
          </div>
          <p className="text-xs sm:text-sm font-mono text-stone-200 leading-relaxed italic bg-stone-900/60 p-2.5 rounded-xl border border-stone-800/60">
            &ldquo;{userSpokenText}&rdquo;
          </p>
        </div>

        {/* NPC Real-time Verbal Reaction */}
        <div className="p-3.5 rounded-2xl bg-amber-950/20 border border-amber-800/40 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <NpcAvatar
                seed={episode.npc.avatarSeed}
                name={episode.npc.name}
                mood={evaluation.npcReactionMood}
                accentColor={episode.npc.accentColor}
                size="sm"
              />
              <span className="text-xs font-bold text-amber-300">
                {episode.npc.name}의 실시간 현장 반응
              </span>
            </div>
            <AudioButton
              text={evaluation.npcReactionDialogue}
              speed={playbackSpeed}
              label="바이어 음성 듣기"
              size="sm"
              variant="pill"
            />
          </div>
          <p className="text-xs sm:text-sm font-semibold text-stone-100 leading-relaxed pl-1">
            &ldquo;{evaluation.npcReactionDialogue}&rdquo;
          </p>
          <p className="text-[11px] text-stone-400 pl-1 border-t border-amber-800/30 pt-1.5">
            {evaluation.npcReactionDialogueKo}
          </p>
        </div>

        {/* Detailed Feedback & Coaching */}
        <div className="p-3.5 rounded-2xl bg-stone-950/60 border border-stone-800 space-y-2">
          <p className="text-xs sm:text-sm text-stone-200 leading-relaxed">
            {evaluation.feedbackDetail}
          </p>

          {(evaluation.strengths || evaluation.improvements) && (
            <div className="grid grid-cols-1 gap-2 pt-1 border-t border-stone-800/60 text-xs">
              {evaluation.strengths && (
                <div className="p-2 rounded-xl bg-emerald-950/30 border border-emerald-800/30 text-emerald-300 space-y-0.5">
                  <span className="font-bold flex items-center gap-1 text-[11px]">
                    <ShieldCheck className="w-3 h-3" /> 잘한 점 (Strengths)
                  </span>
                  <p className="text-stone-300 text-[11px] leading-snug">{evaluation.strengths}</p>
                </div>
              )}
              {evaluation.improvements && (
                <div className="p-2 rounded-xl bg-amber-950/30 border border-amber-800/30 text-amber-300 space-y-0.5">
                  <span className="font-bold flex items-center gap-1 text-[11px]">
                    <Sparkles className="w-3 h-3" /> 프로페셔널 팁 (Pro Tip)
                  </span>
                  <p className="text-stone-300 text-[11px] leading-snug">{evaluation.improvements}</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Native Executive Polish (C1 골드 스탠다드 모범 문장) */}
        {evaluation.nativePolish && (
          <div className="p-3.5 rounded-2xl bg-stone-950 border border-stone-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                C1 최고 협상가 리라이팅 (Executive Polish)
              </span>
              <AudioButton
                text={evaluation.nativePolish}
                speed={playbackSpeed}
                label="모범 발음 듣기"
                size="sm"
                variant="pill"
              />
            </div>
            <p className="text-xs sm:text-sm font-semibold text-stone-100 leading-relaxed pl-1">
              &ldquo;{evaluation.nativePolish}&rdquo;
            </p>
            {evaluation.nativePolishKo && (
              <p className="text-[11px] text-stone-400 pl-1 border-t border-stone-800/60 pt-1">
                {evaluation.nativePolishKo}
              </p>
            )}
          </div>
        )}

        {/* Proceed Button */}
        <button
          onClick={onProceed}
          className="w-full flex items-center justify-center gap-2 py-3 sm:py-3.5 px-4 rounded-xl sm:rounded-2xl font-bold text-xs sm:text-sm text-stone-950 bg-amber-500 hover:bg-amber-400 active:scale-[0.98] transition-all shadow-lg shadow-amber-500/20 cursor-pointer"
        >
          <span>다음 대화로 계속 진행하기</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
