import React, { useEffect, useState } from 'react';
import { Sparkles, Trophy, CheckCircle2, XCircle, RotateCcw, ArrowRight, Sheet, Volume2, Download, Check, AlertCircle, RefreshCw, BarChart2, Activity } from 'lucide-react';
import { GameSessionSummary, StudentProfile, GoogleSheetRecord, SentenceTapStats } from '../types';
import { soundEffects } from '../utils/audioEffects';
import { speechService } from '../utils/speech';
import { sendRecordToGoogleSheet, formatCurrentTimestamp, getSavedWebAppUrl, saveRecords, getSavedRecords } from '../utils/googleSheetSync';
import { sentenceTracker } from '../utils/sentenceTapTracker';
import confetti from 'canvas-confetti';

interface WordGameResultViewProps {
  summary: GameSessionSummary;
  profile: StudentProfile;
  onPlayAgain: () => void;
  onGoHome: () => void;
  onOpenSheetModal: () => void;
  onRecordSynced: (record: GoogleSheetRecord) => void;
}

export const WordGameResultView: React.FC<WordGameResultViewProps> = ({
  summary,
  profile,
  onPlayAgain,
  onGoHome,
  onOpenSheetModal,
  onRecordSynced,
}) => {
  const [syncStatus, setSyncStatus] = useState<'syncing' | 'synced' | 'not_configured' | 'failed'>('syncing');
  const [syncMessage, setSyncMessage] = useState<string>('');
  const [isRetrying, setIsRetrying] = useState(false);
  const [tapStats, setTapStats] = useState<SentenceTapStats>(() => sentenceTracker.getStats());

  const total = summary.totalQuestions;
  const accuracy = total > 0 ? Math.round((summary.correctAnswers / total) * 100) : 100;
  const isPerfect = summary.wrongAnswers === 0 && total >= 5;

  // Trigger celebration & auto-sync to Google Sheet on mount
  useEffect(() => {
    soundEffects.playVictory();

    confetti({
      particleCount: isPerfect ? 100 : 50,
      spread: 70,
      origin: { y: 0.6 },
    });

    handleSyncToSheet();
  }, []);

  const handleSyncToSheet = async () => {
    const webAppUrl = getSavedWebAppUrl();
    const timestamp = formatCurrentTimestamp();
    const currentTapStats = sentenceTracker.getStats();
    const sentenceSummary = sentenceTracker.formatSummaryString();
    const sentenceDetails = sentenceTracker.getDetailsArray();
    setTapStats(currentTapStats);

    const record: GoogleSheetRecord = {
      id: `rec-${Date.now()}`,
      timestamp,
      name: profile.name,
      play_count: profile.play_count,
      correct_count: profile.correct_count,
      wrong_count: profile.wrong_count,
      average_taps: currentTapStats.averageTaps,
      sentence_summary: sentenceSummary,
      total_sentence_taps: currentTapStats.totalTaps,
      status: 'pending',
      mode: summary.mode,
    };

    if (!webAppUrl) {
      setSyncStatus('not_configured');
      setSyncMessage('구글 시트 웹 앱 URL이 설정되지 않아 로컬에만 저장되었습니다.');
      // Save locally
      const existing = getSavedRecords();
      saveRecords([record, ...existing]);
      onRecordSynced(record);
      return;
    }

    setSyncStatus('syncing');
    setSyncMessage('구글 시트로 학생 기록과 문장별 탭 빈도/평균을 전송하는 중...');

    const result = await sendRecordToGoogleSheet(
      {
        timestamp,
        name: profile.name,
        play_count: profile.play_count,
        correct_count: profile.correct_count,
        wrong_count: profile.wrong_count,
        average_taps: currentTapStats.averageTaps,
        sentence_summary: sentenceSummary,
        total_sentence_taps: currentTapStats.totalTaps,
        sentence_tap_details: sentenceDetails,
      },
      webAppUrl
    );

    if (result.success) {
      setSyncStatus('synced');
      setSyncMessage(result.message);
      record.status = 'synced';
    } else {
      setSyncStatus('failed');
      setSyncMessage(result.message);
      record.status = 'failed';
      record.errorMessage = result.message;
    }

    // Save in local history
    const existing = getSavedRecords();
    saveRecords([record, ...existing]);
    onRecordSynced(record);
  };

  const handleRetrySync = async () => {
    setIsRetrying(true);
    await handleSyncToSheet();
    setIsRetrying(false);
  };

  return (
    <div className="w-full max-w-xl mx-auto space-y-5 animate-in fade-in zoom-in-95 duration-300">
      {/* Top Banner */}
      <div className="p-6 sm:p-7 rounded-3xl bg-gradient-to-b from-stone-900 to-stone-950 border border-stone-800 shadow-2xl text-center space-y-4 relative overflow-hidden">
        {/* Glow */}
        <div className="absolute top-0 center w-48 h-48 bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />

        <div className="w-16 h-16 mx-auto rounded-3xl bg-amber-500/20 border border-amber-500/30 text-amber-400 flex items-center justify-center text-3xl shadow-inner">
          {isPerfect ? '👑' : accuracy >= 80 ? '🏆' : '🌟'}
        </div>

        <div className="space-y-1">
          <span className="text-xs font-bold text-amber-400">
            {profile.name} 학생, 훌륭해요!
          </span>
          <h2 className="text-2xl sm:text-3xl font-black text-white">
            {isPerfect ? '100점 만점 챔피언!' : accuracy >= 80 ? '아주 잘했어요!' : '열심히 도전했어요!'}
          </h2>
          <p className="text-xs text-stone-400">
            초등 5학년 필수 단어를 멋지게 학습했습니다
          </p>
        </div>

        {/* 3 Metric Cards */}
        <div className="grid grid-cols-3 gap-2.5 pt-2">
          <div className="p-3 rounded-2xl bg-stone-900/80 border border-stone-800">
            <span className="text-[10px] text-stone-400 block font-medium">이번 게임 정답</span>
            <div className="text-xl sm:text-2xl font-black text-emerald-400 font-mono mt-0.5">
              {summary.correctAnswers}<span className="text-xs font-normal text-stone-500">/{total}</span>
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-stone-900/80 border border-stone-800">
            <span className="text-[10px] text-stone-400 block font-medium">정답률</span>
            <div className="text-xl sm:text-2xl font-black text-indigo-400 font-mono mt-0.5">
              {accuracy}%
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-stone-900/80 border border-stone-800">
            <span className="text-[10px] text-stone-400 block font-medium">누적 플레이</span>
            <div className="text-xl sm:text-2xl font-black text-amber-400 font-mono mt-0.5">
              {profile.play_count}<span className="text-xs font-normal text-stone-500">회</span>
            </div>
          </div>
        </div>
      </div>

      {/* Google Sheet Sync Live Status Card (The core requirement!) */}
      <div className={`p-4 rounded-3xl border transition-all ${
        syncStatus === 'synced'
          ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-200'
          : syncStatus === 'not_configured'
          ? 'bg-amber-950/40 border-amber-500/40 text-amber-200'
          : syncStatus === 'failed'
          ? 'bg-rose-950/40 border-rose-500/40 text-rose-200'
          : 'bg-stone-900 border-stone-800 text-stone-300'
      }`}>
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-2.5">
            <div className="p-2 rounded-xl bg-stone-950/80 border border-stone-800 shrink-0 mt-0.5">
              <Sheet className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-bold text-xs sm:text-sm">
                  {syncStatus === 'synced' && '구글 시트 자동 저장 완료! ✅'}
                  {syncStatus === 'not_configured' && '구글 시트 연동 설정 필요'}
                  {syncStatus === 'failed' && '구글 시트 저장 실패 (재시도 필요)'}
                  {syncStatus === 'syncing' && '구글 시트 저장 중...'}
                </span>
              </div>
              <p className="text-xs opacity-90 leading-snug">
                {syncMessage}
              </p>
              <div className="text-[11px] font-mono opacity-80 pt-1 space-y-0.5">
                <div>
                  전송 데이터: <span className="font-bold text-white">{profile.name}</span> (플레이 {profile.play_count}회, 정답 {profile.correct_count}, 오답 {profile.wrong_count})
                </div>
                <div className="text-amber-300 font-semibold">
                  📌 문장 탭 평균: <span className="underline">{tapStats.averageTaps}회</span> | 총 문장 탭: {tapStats.totalTaps}회 ({tapStats.uniqueSentencesCount}개 문장)
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-1.5 shrink-0">
            {syncStatus === 'not_configured' ? (
              <button
                onClick={onOpenSheetModal}
                className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs transition-colors cursor-pointer"
              >
                연동 설정
              </button>
            ) : (
              <button
                onClick={handleRetrySync}
                disabled={isRetrying}
                className="px-2.5 py-1.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-stone-200 border border-stone-700 font-bold text-xs flex items-center gap-1 transition-colors cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isRetrying ? 'animate-spin' : ''}`} />
                <span>재전송</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Sentence Tap Frequency & Average Card (Core User Requirement) */}
      <div className="p-5 rounded-3xl bg-stone-900/90 border border-stone-800 space-y-3.5 shadow-xl">
        <div className="flex items-center justify-between pb-2 border-b border-stone-800">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-purple-500/20 text-purple-400 border border-purple-500/30">
              <BarChart2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                각 문장별 탭 빈도 & 평균 통계
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono">
                  시트 저장 완료 ✅
                </span>
              </h3>
              <p className="text-[11px] text-stone-400">
                학생이 예문 문장을 탭하여 발음을 듣고 학습한 빈도와 평균입니다
              </p>
            </div>
          </div>
        </div>

        {/* 3 Metric Pills */}
        <div className="grid grid-cols-3 gap-2">
          <div className="p-3 rounded-2xl bg-stone-950/70 border border-stone-800 text-center">
            <span className="text-[10px] text-stone-400 block font-medium">문장당 평균 탭</span>
            <div className="text-lg sm:text-xl font-black text-purple-400 font-mono mt-0.5">
              {tapStats.averageTaps}<span className="text-xs font-normal text-stone-500">회</span>
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-stone-950/70 border border-stone-800 text-center">
            <span className="text-[10px] text-stone-400 block font-medium">총 문장 탭 횟수</span>
            <div className="text-lg sm:text-xl font-black text-amber-400 font-mono mt-0.5">
              {tapStats.totalTaps}<span className="text-xs font-normal text-stone-500">회</span>
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-stone-950/70 border border-stone-800 text-center">
            <span className="text-[10px] text-stone-400 block font-medium">연습한 문장 수</span>
            <div className="text-lg sm:text-xl font-black text-indigo-400 font-mono mt-0.5">
              {tapStats.uniqueSentencesCount}<span className="text-xs font-normal text-stone-500">개</span>
            </div>
          </div>
        </div>

        {/* Top Sentence or Detailed List */}
        {tapStats.uniqueSentencesCount > 0 ? (
          <div className="space-y-2 pt-1">
            <span className="text-xs font-bold text-stone-300 block">
              문장별 탭 빈도 상세 (구글 시트 기록 내역)
            </span>
            <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
              {Object.values(tapStats.items)
                .sort((a, b) => b.tapCount - a.tapCount)
                .map((item, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 rounded-xl bg-stone-950/60 border border-stone-800 flex items-center justify-between gap-2"
                  >
                    <div className="space-y-0.5 min-w-0 flex-1">
                      <p className="text-xs font-medium text-stone-200 truncate">
                        &ldquo;{item.sentence}&rdquo;
                      </p>
                      {item.sentenceKo && (
                        <p className="text-[10px] text-stone-400 truncate">
                          {item.sentenceKo}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className="px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 font-mono font-bold text-xs">
                        {item.tapCount}회 탭
                      </span>
                      <button
                        onClick={() => speechService.speak(item.sentence, 0.9)}
                        className="p-1 rounded-lg bg-stone-800 hover:bg-stone-700 text-amber-400 transition-colors"
                        title="예문 다시 듣기"
                      >
                        <Volume2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        ) : (
          <div className="p-3 text-center text-[11px] text-stone-400 bg-stone-950/40 rounded-2xl border border-stone-800/80">
            문장 예문 힌트를 탭하거나 단어장에서 예문을 클릭하면 문장별 탭 빈도가 실시간 누적됩니다.
          </div>
        )}
      </div>

      {/* Review of Wrong Words (오답 복습 노트) */}
      {summary.wrongWords.length > 0 && (
        <div className="p-4 sm:p-5 rounded-3xl bg-stone-900/80 border border-stone-800 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-stone-200 flex items-center gap-1.5">
              <XCircle className="w-4 h-4 text-rose-400" />
              <span>오답 단어 복습하기 ({summary.wrongWords.length}개)</span>
            </span>
            <span className="text-[11px] text-stone-400">발음 버튼을 눌러 들어보세요</span>
          </div>

          <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
            {summary.wrongWords.map(word => (
              <div
                key={word.id}
                className="p-3 rounded-2xl bg-stone-950/70 border border-stone-800 flex items-center justify-between gap-2"
              >
                <div className="space-y-0.5 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-stone-100 text-sm font-sans">
                      {word.word}
                    </span>
                    <span className="text-[10px] text-stone-400 font-mono">
                      [{word.pronunciation}]
                    </span>
                  </div>
                  <p className="text-xs text-amber-300 font-medium">
                    {word.meaning}
                  </p>
                </div>

                <button
                  onClick={() => speechService.speak(word.word, 0.9)}
                  className="p-2 rounded-xl bg-stone-800 text-amber-400 hover:bg-stone-700 transition-colors shrink-0 cursor-pointer"
                  title="원어민 발음"
                >
                  <Volume2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-2.5 pt-1">
        <button
          onClick={onPlayAgain}
          className="flex-1 py-3.5 rounded-2xl bg-amber-500 hover:bg-amber-400 active:scale-[0.98] text-stone-950 font-black text-sm sm:text-base flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 transition-all cursor-pointer"
        >
          <RotateCcw className="w-4 h-4" />
          <span>한 번 더 플레이하기</span>
        </button>

        <button
          onClick={onGoHome}
          className="flex-1 py-3.5 rounded-2xl bg-stone-800 hover:bg-stone-700 active:scale-[0.98] text-stone-100 font-bold text-sm sm:text-base flex items-center justify-center gap-2 transition-all cursor-pointer"
        >
          <span>다른 게임 모드 선택</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
