import React, { useState, useEffect, useRef } from 'react';
import {
  Award,
  RotateCcw,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Heart,
  Sparkles,
  Volume2,
  BookmarkCheck,
  ChevronRight,
  Sheet,
  FileSpreadsheet,
  RefreshCw,
  MessageSquare,
  ThumbsUp,
  HelpCircle,
  Headphones,
  Mic,
  Database,
  BarChart3,
} from 'lucide-react';
import { SessionResult, Episode } from '../types';
import { EPISODES } from '../data/episodes';
import { AudioButton } from './AudioButton';
import { speechService } from '../utils/speech';
import { speechRecognitionService } from '../utils/speechRecognition';
import { formatActivityTimestamp } from '../utils/activityTracker';

interface ResultScreenProps {
  result: SessionResult;
  onRestart: () => void;
  onNextEpisode: (nextEpisode: Episode) => void;
  onBackToHome: () => void;
  onOpenSheetModal?: () => void;
  onRetrySheetSync?: () => void;
  onOpenSummary?: () => void;
  onExtraActivityUpdate?: (listeningCount: number, shadowingCount: number) => void;
}

export const ResultScreen: React.FC<ResultScreenProps> = ({
  result,
  onRestart,
  onNextEpisode,
  onBackToHome,
  onOpenSheetModal,
  onRetrySheetSync,
  onOpenSummary,
  onExtraActivityUpdate,
}) => {
  const [isRetrying, setIsRetrying] = useState(false);
  const [listeningCount, setListeningCount] = useState<number>(result.listeningCount || 0);
  const [shadowingCount, setShadowingCount] = useState<number>(result.shadowingCount || 0);
  const [activeShadowIndex, setActiveShadowIndex] = useState<number | null>(null);
  const countsRef = useRef({
    listening: result.listeningCount || 0,
    shadowing: result.shadowingCount || 0,
  });

  useEffect(() => {
    countsRef.current = {
      listening: result.listeningCount || 0,
      shadowing: result.shadowingCount || 0,
    };
    setListeningCount(result.listeningCount || 0);
    setShadowingCount(result.shadowingCount || 0);
  }, [result.completedAt, result.listeningCount, result.shadowingCount]);

  // Count additional review listening replays on ResultScreen
  useEffect(() => {
    const unsub = speechService.subscribeSpeak(() => {
      countsRef.current.listening += 1;
      setListeningCount(countsRef.current.listening);
      onExtraActivityUpdate?.(countsRef.current.listening, countsRef.current.shadowing);
    });
    return () => {
      unsub();
      speechRecognitionService.stop();
    };
  }, [onExtraActivityUpdate]);

  const handleReviewShadowing = (index: number) => {
    if (activeShadowIndex === index) {
      speechRecognitionService.stop();
      setActiveShadowIndex(null);
      return;
    }

    const recordPractice = () => {
      countsRef.current.shadowing += 1;
      setShadowingCount(countsRef.current.shadowing);
      onExtraActivityUpdate?.(countsRef.current.listening, countsRef.current.shadowing);
    };

    if (!speechRecognitionService.isSupported()) {
      recordPractice();
      return;
    }

    setActiveShadowIndex(index);
    let recorded = false;
    const started = speechRecognitionService.start({
      onResult: () => {
        if (!recorded) {
          recorded = true;
          recordPractice();
        }
        setActiveShadowIndex(null);
      },
      onError: () => {
        if (!recorded) {
          recorded = true;
          recordPractice();
        }
        setActiveShadowIndex(null);
      },
      onEnd: () => {
        setActiveShadowIndex(null);
      },
    });

    if (!started) {
      setActiveShadowIndex(null);
      recordPractice();
    }
  };

  // Find next episode
  const currentIndex = EPISODES.findIndex(e => e.id === result.episodeId);
  const nextEpisode =
    currentIndex !== -1 && currentIndex + 1 < EPISODES.length
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
    <div className="flex flex-col min-h-full w-full max-w-lg sm:max-w-xl mx-auto px-3.5 sm:px-5 py-4 sm:py-5 select-none justify-between space-y-4">
      {/* Top Banner: Navigation & Summary */}
      <div className="space-y-3 shrink-0">
        <div className="flex items-center justify-between text-xs text-stone-400 px-1">
          <button
            onClick={onBackToHome}
            className="hover:text-amber-300 transition-colors flex items-center gap-1 font-medium cursor-pointer"
          >
            &larr; <span>메인 화면으로</span>
          </button>
          <span className="font-mono text-[11px] text-stone-400">
            {new Date(result.completedAt).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </span>
        </div>

        {/* Central CEFR Achievement Badge & Score */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-b from-stone-850 to-stone-900 border border-amber-500/30 p-4 sm:p-5 text-center shadow-xl space-y-3">
          <div
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider border shadow-sm mx-auto animate-bounce [animation-duration:2.5s] ${getCefrBadgeStyle(
              result.achievedCefr
            )}`}
          >
            <Award className="w-4 h-4 text-amber-400" />
            <span>CEFR {result.achievedCefr} 달성!</span>
          </div>

          <div>
            <h2 className="text-xl sm:text-2xl font-black text-white">
              {result.affinityRank.title}
            </h2>
            <p className="text-xs sm:text-sm text-stone-300 mt-1 max-w-sm mx-auto leading-relaxed">
              {result.affinityRank.description}
            </p>
          </div>

          {/* Key Metrics Grid */}
          <div className="grid grid-cols-3 gap-2 pt-2 border-t border-stone-800/80">
            <div className="p-2 sm:p-2.5 rounded-2xl bg-stone-950/70 border border-stone-800 text-center">
              <div className="text-[10px] sm:text-[11px] text-stone-400 font-medium">에피소드 총점</div>
              <div className="text-lg sm:text-xl font-black text-amber-400 font-mono">
                {result.totalScore}
                <span className="text-xs text-stone-500 font-normal ml-0.5">점</span>
              </div>
            </div>

            <div className="p-2 sm:p-2.5 rounded-2xl bg-stone-950/70 border border-stone-800 text-center">
              <div className="text-[10px] sm:text-[11px] text-stone-400 font-medium">대화 적합도</div>
              <div className="text-lg sm:text-xl font-black text-rose-400 font-mono flex items-center justify-center gap-1">
                <Heart className="w-3.5 h-3.5 fill-rose-500" />
                {result.finalAffinity}%
              </div>
            </div>

            <div className="p-2 sm:p-2.5 rounded-2xl bg-stone-950/70 border border-stone-800 text-center">
              <div className="text-[10px] sm:text-[11px] text-stone-400 font-medium">원어민 만점 표현</div>
              <div className="text-lg sm:text-xl font-black text-emerald-400 font-mono">
                {result.bestChoicesCount}/{result.totalTurns}
              </div>
            </div>
          </div>

          {/* Listening & Shadowing Activity Metrics Strip */}
          <div className="grid grid-cols-2 gap-2 pt-1">
            <div className="flex items-center justify-between px-3 py-2 rounded-2xl bg-stone-950/80 border border-amber-500/25 text-xs">
              <span className="text-stone-300 flex items-center gap-1.5 font-medium">
                <Headphones className="w-3.5 h-3.5 text-amber-400" />
                듣기 학습 횟수
              </span>
              <span className="font-mono font-black text-amber-300">{listeningCount}회</span>
            </div>
            <div className="flex items-center justify-between px-3 py-2 rounded-2xl bg-stone-950/80 border border-emerald-500/25 text-xs">
              <span className="text-stone-300 flex items-center gap-1.5 font-medium">
                <Mic className="w-3.5 h-3.5 text-emerald-400" />
                쉐도잉 횟수
              </span>
              <span className="font-mono font-black text-emerald-300">{shadowingCount}회</span>
            </div>
          </div>
        </div>

        {/* Google Sheet Automatic Sync Confirmation Card */}
        <div
          className={`p-3 rounded-2xl border transition-all text-xs ${
            result.sheetSyncStatus === 'synced'
              ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-200'
              : result.sheetSyncStatus === 'failed'
              ? 'bg-rose-950/40 border-rose-500/40 text-rose-200'
              : 'bg-stone-900/90 border-stone-800 text-stone-300'
          }`}
        >
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <Sheet
                className={`w-4 h-4 shrink-0 ${
                  result.sheetSyncStatus === 'synced' ? 'text-emerald-400' : 'text-amber-400'
                }`}
              />
              <div className="truncate">
                <span className="font-bold text-[11px] sm:text-xs">
                  {result.sheetSyncStatus === 'synced'
                    ? '구글 시트 학습 기록 자동 저장 완료! ✅'
                    : result.sheetSyncStatus === 'failed'
                    ? '구글 시트 자동 저장 실패'
                    : '구글 시트 연동 대기 중'}
                </span>
                <p className="text-[10px] text-stone-400 truncate">
                  {result.sheetSyncMessage ||
                    '5개 열: timestamp, name, scenario_name, play_count, appropriateness_score'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              {result.sheetSyncStatus === 'failed' && onRetrySheetSync && (
                <button
                  onClick={async () => {
                    setIsRetrying(true);
                    await onRetrySheetSync();
                    setIsRetrying(false);
                  }}
                  disabled={isRetrying}
                  className="px-2.5 py-1 rounded-xl bg-rose-800 hover:bg-rose-700 text-white text-[10px] font-bold flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <RefreshCw className={`w-3 h-3 ${isRetrying ? 'animate-spin' : ''}`} />
                  재전송
                </button>
              )}
              {onOpenSheetModal && (
                <button
                  onClick={onOpenSheetModal}
                  className="px-2.5 py-1 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 text-[10px] font-medium border border-stone-700/60 transition-colors cursor-pointer"
                >
                  설정/로그
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Supabase Activity Log Confirmation + Summary Page Button */}
        <div
          className={`p-3 rounded-2xl border transition-all text-xs ${
            result.supabaseSyncStatus === 'synced'
              ? 'bg-emerald-950/35 border-emerald-500/35 text-emerald-200'
              : 'bg-amber-500/10 border-amber-500/35 text-amber-200'
          }`}
        >
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <Database
                className={`w-4 h-4 shrink-0 ${
                  result.supabaseSyncStatus === 'synced' ? 'text-emerald-400' : 'text-amber-400'
                }`}
              />
              <div className="min-w-0">
                <span className="font-bold text-[11px] sm:text-xs block truncate">
                  {result.supabaseSyncStatus === 'synced'
                    ? 'Supabase 활동 기록 저장 완료'
                    : '학습 활동 기록 저장됨 (요약 페이지 확인)'}
                </span>
                <p className="text-[10px] text-stone-400 truncate font-mono">
                  {formatActivityTimestamp(result.completedAt)} · 듣기 {listeningCount} · 쉐도잉 {shadowingCount}
                </p>
              </div>
            </div>

            {onOpenSummary && (
              <button
                type="button"
                onClick={onOpenSummary}
                className="px-2.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 text-[10px] sm:text-[11px] font-black flex items-center gap-1 shrink-0 transition-colors cursor-pointer"
              >
                <BarChart3 className="w-3.5 h-3.5" />
                <span>활동 요약 보기</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Expanded & Highly Readable Review Section: '원어민 피드백 및 복습 노트' */}
      <div className="flex-1 flex flex-col min-h-[380px] sm:min-h-[460px] space-y-2.5 overflow-hidden">
        {/* Section Header */}
        <div className="flex items-center justify-between px-1 shrink-0">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-400">
              <BookmarkCheck className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-white flex items-center gap-1.5">
                <span>원어민 피드백 및 복습 노트</span>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-stone-800 text-amber-300 border border-stone-700">
                  총 {result.turnRecords.length}개 턴
                </span>
              </h3>
              <p className="text-[11px] text-stone-400 hidden sm:block">
                턴별 발음 리플레이와 뉘앙스 분석 코칭을 확인하세요
              </p>
            </div>
          </div>
          <span className="text-[11px] text-stone-400">
            🎧 원어민 발음 리플레이 지원
          </span>
        </div>

        {/* Scrollable Feedback Cards Container with Sleek Amber Scrollbar */}
        <div className="flex-1 overflow-y-auto space-y-4 pr-1.5 sm:pr-2 custom-scrollbar touch-pan-y overscroll-contain pb-2">
          {result.turnRecords.map((record, index) => {
            const wasBest = record.wasBest;

            return (
              <div
                key={index}
                className={`p-4 sm:p-5 rounded-3xl border transition-all space-y-3 shadow-lg ${
                  wasBest
                    ? 'bg-stone-900/90 border-stone-800 shadow-stone-950/60'
                    : 'bg-stone-900/95 border-amber-500/40 shadow-amber-500/5'
                }`}
              >
                {/* Turn Header Row: Turn Number + Status Badge + Pronunciation Button */}
                <div className="flex items-center justify-between gap-2 pb-1 border-b border-stone-800/80">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-black text-stone-300 text-xs sm:text-sm px-2.5 py-1 rounded-xl bg-stone-950 border border-stone-800 shadow-inner">
                      Turn {record.turnNumber}
                    </span>
                    <span
                      className={`text-xs font-bold px-2.5 py-1 rounded-xl flex items-center gap-1 border shadow-sm ${
                        wasBest
                          ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                          : 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                      }`}
                    >
                      {wasBest ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                          <span>원어민 적합도 100% 모범 답변</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                          <span>원어민 뉘앙스 업그레이드 추천</span>
                        </>
                      )}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <AudioButton
                      text={
                        record.speechEvaluation?.nativePolish ||
                        record.chosenChoice.nativeAlternative
                      }
                      speed={1.0}
                      label="듣기"
                      variant="pill"
                      size="sm"
                    />
                    <button
                      type="button"
                      onClick={() => handleReviewShadowing(index)}
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border transition-all cursor-pointer ${
                        activeShadowIndex === index
                          ? 'bg-rose-600 border-rose-400 text-white animate-pulse'
                          : 'bg-stone-800/80 hover:bg-stone-700 border-stone-700 text-emerald-300'
                      }`}
                      title="원어민 표현 따라 말하기 (쉐도잉 +1)"
                    >
                      <Mic className="w-3.5 h-3.5" />
                      <span>{activeShadowIndex === index ? '말하는 중' : '쉐도잉'}</span>
                    </button>
                  </div>
                </div>

                {/* NPC Dialogue Reminder */}
                {record.npcDialogue && (
                  <div className="flex items-start gap-2 px-3 py-2 rounded-2xl bg-stone-950/60 border border-stone-800/80 text-xs">
                    <MessageSquare className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                    <div className="min-w-0">
                      <span className="text-[10px] text-stone-500 font-semibold block">상대방 대사:</span>
                      <p className="text-stone-300 font-medium leading-relaxed italic">
                        &ldquo;{record.npcDialogue}&rdquo;
                      </p>
                    </div>
                  </div>
                )}

                {/* Main Comparison: My Spoken/Chosen Text vs Native Alternative */}
                <div className="space-y-2.5">
                  {/* Card 1: User's Response */}
                  <div className="p-3.5 sm:p-4 rounded-2xl bg-stone-950/85 border border-stone-800/90 space-y-1.5 shadow-inner">
                    <div className="text-xs text-stone-400 font-semibold flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-stone-500" />
                        {record.userSpokenText ? '🎙️ 내가 직접 말한 답변:' : '내가 선택한 답변:'}
                      </span>
                      {record.speechEvaluation && (
                        <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/30">
                          {record.speechEvaluation.cefrLevel} 판정
                        </span>
                      )}
                    </div>
                    <div className="text-sm sm:text-base font-semibold text-stone-100 leading-relaxed">
                      &ldquo;{record.userSpokenText || record.chosenChoice.text}&rdquo;
                    </div>
                    <div className="text-xs sm:text-sm text-stone-400 leading-normal pt-0.5">
                      {record.chosenChoice.textKo}
                    </div>
                  </div>

                  {/* Card 2: Native Polish / Alternative */}
                  <div className="p-3.5 sm:p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 space-y-1.5 shadow-inner">
                    <div className="text-xs text-amber-400 font-bold flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                      <span>
                        {record.speechEvaluation
                          ? '💎 최고 협상가(C1) 리라이팅:'
                          : '💎 현지인 추천 100% 모범 표현:'}
                      </span>
                    </div>
                    <div className="text-sm sm:text-base font-bold text-white leading-relaxed">
                      &ldquo;
                      {record.speechEvaluation?.nativePolish ||
                        record.chosenChoice.nativeAlternative}
                      &rdquo;
                    </div>
                    <div className="text-xs sm:text-sm text-amber-200/90 leading-normal pt-0.5">
                      {record.speechEvaluation?.nativePolishKo ||
                        record.chosenChoice.nativeAlternativeKo}
                    </div>
                  </div>
                </div>

                {/* 1-Line Key Nuance & Psychological Insight Box */}
                <div className="p-3 sm:p-3.5 rounded-2xl bg-stone-950/70 border border-stone-800 text-xs sm:text-sm text-stone-200 leading-relaxed flex items-start gap-2">
                  <span className="text-base shrink-0 leading-none mt-0.5" role="img" aria-label="lightbulb">
                    💡
                  </span>
                  <p className="leading-relaxed">
                    <strong className="text-amber-300 font-semibold mr-1.5">원어민 코칭 포인트:</strong>
                    {record.chosenChoice.feedbackDetail}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Bottom Action Area: [다시 하기] on left, [다음 스테이지] on right */}
      <div className="pt-3 pb-1 grid grid-cols-2 gap-3 shrink-0">
        <button
          onClick={onRestart}
          className="py-3.5 sm:py-4 px-4 rounded-2xl bg-stone-850 hover:bg-stone-800 active:scale-[0.98] text-stone-200 font-bold text-sm sm:text-base flex items-center justify-center gap-2 transition-all cursor-pointer border border-stone-700/60 shadow-md"
        >
          <RotateCcw className="w-4 h-4 text-stone-400" />
          <span>다시 하기</span>
        </button>

        <button
          onClick={() => onNextEpisode(nextEpisode)}
          className="py-3.5 sm:py-4 px-4 rounded-2xl bg-amber-500 hover:bg-amber-400 active:scale-[0.98] text-stone-950 font-black text-sm sm:text-base flex items-center justify-center gap-2 shadow-lg shadow-amber-500/25 transition-all cursor-pointer"
        >
          <span>다음 스테이지</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
