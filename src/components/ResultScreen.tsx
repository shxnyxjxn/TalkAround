import React, { useState } from 'react';
import { Award, RotateCcw, ArrowRight, CheckCircle2, AlertCircle, Heart, Sparkles, Volume2, BookmarkCheck, ChevronRight } from 'lucide-react';
import { SessionResult, Episode } from '../types';
import { EPISODES } from '../data/episodes';
import { AudioButton } from './AudioButton';

interface ResultScreenProps {
  result: SessionResult;
  onRestart: () => void;
  onNextEpisode: (nextEpisode: Episode) => void;
  onBackToHome: () => void;
}

export const ResultScreen: React.FC<ResultScreenProps> = ({
  result,
  onRestart,
  onNextEpisode,
  onBackToHome,
}) => {
  const [activeTab, setActiveTab] = useState<'review' | 'analysis'>('review');

  // Find next episode
  const currentIndex = EPISODES.findIndex(e => e.id === result.episodeId);
  const nextEpisode = currentIndex !== -1 && currentIndex + 1 < EPISODES.length
    ? EPISODES[currentIndex + 1]
    : EPISODES[0];

  // CEFR Badge styling
  const getCefrBadgeStyle = (level: string) => {
    switch (level) {
      case 'C1':
        return 'bg-purple-500/20 text-purple-300 border-purple-500/40';
      case 'B2+':
      case 'B2':
        return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';
      case 'B1':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/40';
      default:
        return 'bg-blue-500/20 text-blue-300 border-blue-500/40';
    }
  };

  return (
    <div className="flex flex-col min-h-full max-w-md mx-auto px-4 py-5 sm:py-6 select-none justify-between space-y-4">
      {/* Top Banner: Episode Finished */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs text-stone-400">
          <button
            onClick={onBackToHome}
            className="hover:text-amber-300 transition-colors"
          >
            &larr; 메인 화면
          </button>
          <span className="font-mono text-[11px] text-stone-500">
            {new Date(result.completedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>

        {/* Central CEFR Achievement Badge & Score (PRD Central Element) */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-b from-stone-800/90 to-stone-900 border border-amber-500/30 p-5 text-center shadow-xl space-y-3">
          <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider border shadow-sm mx-auto animate-bounce [animation-duration:2.5s] ${getCefrBadgeStyle(result.achievedCefr)}`}>
            <Award className="w-4 h-4 text-amber-400" />
            <span>CEFR {result.achievedCefr} 달성!</span>
          </div>

          <div>
            <h2 className="text-xl sm:text-2xl font-black text-white">
              {result.affinityRank.title}
            </h2>
            <p className="text-xs text-stone-300 mt-1 max-w-xs mx-auto leading-relaxed">
              {result.affinityRank.description}
            </p>
          </div>

          {/* Key Metrics Grid */}
          <div className="grid grid-cols-3 gap-2 pt-2 border-t border-stone-800/80">
            <div className="p-2 rounded-2xl bg-stone-950/60 border border-stone-800">
              <div className="text-[10px] text-stone-400 font-medium">에피소드 총점</div>
              <div className="text-lg font-black text-amber-400 font-mono">
                {result.totalScore}<span className="text-xs text-stone-500 font-normal">점</span>
              </div>
            </div>

            <div className="p-2 rounded-2xl bg-stone-950/60 border border-stone-800">
              <div className="text-[10px] text-stone-400 font-medium">최종 호감도</div>
              <div className="text-lg font-black text-rose-400 font-mono flex items-center justify-center gap-1">
                <Heart className="w-3.5 h-3.5 fill-rose-500" />
                {result.finalAffinity}%
              </div>
            </div>

            <div className="p-2 rounded-2xl bg-stone-950/60 border border-stone-800">
              <div className="text-[10px] text-stone-400 font-medium">원어민 만점 표현</div>
              <div className="text-lg font-black text-emerald-400 font-mono">
                {result.bestChoicesCount}/{result.totalTurns}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Review Section: '원어민 피드백 및 틀린 표현 노트' (PRD Core Feature ③) */}
      <div className="flex-1 space-y-3 overflow-hidden flex flex-col min-h-0">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-1.5 text-xs font-bold text-stone-200">
            <BookmarkCheck className="w-4 h-4 text-amber-400" />
            <span>원어민 피드백 및 복습 노트</span>
          </div>
          <span className="text-[11px] text-stone-400">
            각 턴별 발음 리플레이 지원
          </span>
        </div>

        {/* Note Scroll Container */}
        <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 max-h-64 sm:max-h-72">
          {result.turnRecords.map((record, index) => {
            const wasBest = record.wasBest;

            return (
              <div
                key={index}
                className={`p-3.5 rounded-2xl border transition-all space-y-2.5 ${
                  wasBest
                    ? 'bg-stone-900/80 border-stone-800'
                    : 'bg-stone-900/90 border-amber-500/30'
                }`}
              >
                {/* Turn Header */}
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-stone-400 text-[11px]">
                      Turn {record.turnNumber}
                    </span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                      wasBest
                        ? 'bg-emerald-500/20 text-emerald-300'
                        : 'bg-amber-500/20 text-amber-300'
                    }`}>
                      {wasBest ? '원어민 느낌 100%' : '뉘앙스 복습 추천'}
                    </span>
                  </div>

                  <AudioButton
                    text={record.speechEvaluation?.nativePolish || record.chosenChoice.nativeAlternative}
                    speed={1.0}
                    label="추천 발음"
                    variant="pill"
                    size="sm"
                  />
                </div>

                {/* My choice / spoken text vs Native alternative */}
                <div className="space-y-1.5 text-xs">
                  <div className="p-2 rounded-xl bg-stone-950/70 border border-stone-800/80">
                    <div className="text-[10px] text-stone-400 font-medium flex items-center justify-between">
                      <span>{record.userSpokenText ? '🎙️ 내가 직접 말한 답변:' : '내가 선택한 답변:'}</span>
                      {record.speechEvaluation && (
                        <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-amber-500/20 text-amber-300">
                          {record.speechEvaluation.cefrLevel} 판정
                        </span>
                      )}
                    </div>
                    <div className="text-stone-200 font-medium">
                      &ldquo;{record.userSpokenText || record.chosenChoice.text}&rdquo;
                    </div>
                    <div className="text-[11px] text-stone-400 mt-0.5">
                      {record.chosenChoice.textKo}
                    </div>
                  </div>

                  <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20">
                    <div className="text-[10px] text-amber-300 font-semibold">
                      {record.speechEvaluation ? '💎 C1 최고 협상가 리라이팅:' : '현지인 추천 표현:'}
                    </div>
                    <div className="text-white font-bold">
                      &ldquo;{record.speechEvaluation?.nativePolish || record.chosenChoice.nativeAlternative}&rdquo;
                    </div>
                    <div className="text-[11px] text-amber-200/90 mt-0.5">
                      {record.speechEvaluation?.nativePolishKo || record.chosenChoice.nativeAlternativeKo}
                    </div>
                  </div>
                </div>

                {/* 1-line key nuance takeaway */}
                <p className="text-[11px] text-stone-300 leading-relaxed italic border-t border-stone-800/60 pt-2">
                  💡 {record.chosenChoice.feedbackDetail}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Bottom Buttons (PRD Specified: [다시 하기] on left, [다음 스테이지] on right) */}
      <div className="pt-2 pb-1 grid grid-cols-2 gap-3">
        <button
          onClick={onRestart}
          className="py-3.5 px-4 rounded-2xl bg-stone-800 hover:bg-stone-700 active:scale-[0.98] text-stone-200 font-bold text-sm flex items-center justify-center gap-1.5 transition-all cursor-pointer border border-stone-700/60"
        >
          <RotateCcw className="w-4 h-4 text-stone-400" />
          <span>다시 하기</span>
        </button>

        <button
          onClick={() => onNextEpisode(nextEpisode)}
          className="py-3.5 px-4 rounded-2xl bg-amber-500 hover:bg-amber-400 active:scale-[0.98] text-stone-950 font-black text-sm flex items-center justify-center gap-1.5 shadow-lg shadow-amber-500/20 transition-all cursor-pointer"
        >
          <span>다음 스테이지</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
