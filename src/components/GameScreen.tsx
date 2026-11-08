import React, { useState, useEffect, useRef } from 'react';
import { Volume2, Heart, ArrowRight, Sparkles, AlertCircle, CheckCircle2, RotateCcw, XCircle, Sliders, ChevronDown, ChevronUp, Mic, MessageSquare } from 'lucide-react';
import { Episode, Turn, Choice, TurnRecord, UserSettings, SessionResult, CefrLevel, SpeechEvaluation } from '../types';
import { NpcAvatar } from './NpcAvatar';
import { AudioButton } from './AudioButton';
import { speechService } from '../utils/speech';
import { SpeechInputPanel } from './SpeechInputPanel';
import { SpeechFeedbackModal } from './SpeechFeedbackModal';
import { evaluateUserSpeech } from '../utils/speechEvaluator';
import { shuffleOptionsWithRandomCorrectIndex } from '../utils/shuffle';

interface GameScreenProps {
  episode: Episode;
  settings: UserSettings;
  onFinishGame: (result: SessionResult) => void;
  onExitToMenu: () => void;
  onOpenSettings: () => void;
}

export const GameScreen: React.FC<GameScreenProps> = ({
  episode,
  settings,
  onFinishGame,
  onExitToMenu,
  onOpenSettings,
}) => {
  const [currentTurnIndex, setCurrentTurnIndex] = useState(0);
  const [affinity, setAffinity] = useState(50); // initial 50%
  const [selectedChoice, setSelectedChoice] = useState<Choice | null>(null);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [turnRecords, setTurnRecords] = useState<TurnRecord[]>([]);
  const [localSpeed, setLocalSpeed] = useState<number>(settings.playbackSpeed);

  // Direct Speech Mode state (default to speech for C1 high-difficulty scenarios)
  const [inputMode, setInputMode] = useState<'speech' | 'choice'>(
    episode.targetCefr === 'C1' ? 'speech' : 'choice'
  );
  const [isEvaluatingSpeech, setIsEvaluatingSpeech] = useState(false);
  const [speechEvaluation, setSpeechEvaluation] = useState<SpeechEvaluation | null>(null);
  const [userSpokenText, setUserSpokenText] = useState('');
  const [showSpeechFeedbackModal, setShowSpeechFeedbackModal] = useState(false);
  const [shuffledChoices, setShuffledChoices] = useState<Choice[]>([]);
  const lastBestIndexRef = useRef<number>(-1);

  const currentTurn: Turn = episode.turns[currentTurnIndex];
  const isLastTurn = currentTurnIndex === episode.turns.length - 1;

  // Shuffle choices so the best answer is not fixed to choice #1 and doesn't repeat same position
  useEffect(() => {
    if (!currentTurn) return;
    const bestChoice = currentTurn.choices.find(c => c.isBest) || currentTurn.choices[0];
    const shuffled = shuffleOptionsWithRandomCorrectIndex(
      currentTurn.choices,
      bestChoice,
      lastBestIndexRef.current
    );
    lastBestIndexRef.current = shuffled.findIndex(c => c.isBest);
    setShuffledChoices(shuffled);
  }, [currentTurnIndex, currentTurn]);

  // Auto-play NPC audio when a new turn loads (if user enabled it)
  useEffect(() => {
    if (settings.autoPlayAudio && currentTurn) {
      const timer = setTimeout(() => {
        speechService.speak(currentTurn.npcDialogue, localSpeed);
      }, 350);
      return () => clearTimeout(timer);
    }
  }, [currentTurnIndex, settings.autoPlayAudio, localSpeed]);

  const finishGameWithRecords = (finalRecords: TurnRecord[]) => {
    const bestCount = finalRecords.filter(r => r.wasBest).length;
    const totalTurns = episode.turns.length;

    let achievedCefr: CefrLevel = 'A2';
    if (episode.targetCefr === 'C1') {
      if (bestCount >= 4) {
        achievedCefr = 'C1';
      } else if (bestCount >= 3) {
        achievedCefr = 'B2+';
      } else if (bestCount >= 2) {
        achievedCefr = 'B2';
      } else {
        achievedCefr = 'B1';
      }
    } else {
      if (bestCount >= 4) {
        achievedCefr = 'B2+';
      } else if (bestCount >= 3) {
        achievedCefr = 'B2';
      } else if (bestCount >= 2) {
        achievedCefr = 'B1';
      } else {
        achievedCefr = 'A2';
      }
    }

    let affinityRank = {
      title: episode.targetCefr === 'C1' ? '💼 글로벌 탑 비즈니스 협상가 (Elite Negotiator)' : '🗽 찐 뉴요커 인정 (Local Bestie)',
      description: episode.targetCefr === 'C1' 
        ? '날카로운 바이어의 요구를 전략적으로 유도하고 상호 윈윈을 이끌어낸 C1 마스터 협상력!' 
        : '현지인들이 감탄하는 센스 있는 뉘앙스와 완벽한 스몰토크 실력!',
      emoji: episode.targetCefr === 'C1' ? '💼' : '🗽',
    };
    if (affinity < 40) {
      affinityRank = {
        title: episode.targetCefr === 'C1' ? '📉 협상 결렬 위기 (Deal at Risk)' : '💦 어색한 여행자 (Awkward First-Timer)',
        description: episode.targetCefr === 'C1'
          ? '너무 직설적이거나 수세적인 태도로 바이어와의 신뢰가 흔들렸습니다. 뉘앙스 노트를 복습해 보세요!'
          : '교과서 표현이나 직설적인 표현이 많았어요. 복습 노트를 확인해 보세요!',
        emoji: '📉',
      };
    } else if (affinity < 70) {
      affinityRank = {
        title: episode.targetCefr === 'C1' ? '🤝 전략적 파트너 (Promising Partner)' : '☕ 친절한 이웃 (Friendly Neighbor)',
        description: episode.targetCefr === 'C1'
          ? '핵심 쟁점을 무난하게 방어했습니다. C1급 조건부 양보와 완곡 화법을 더 다듬어보세요!'
          : '기본적인 소통이 무난하게 통했습니다. 원어민 관용구를 조금만 더 얹어보세요!',
        emoji: '🤝',
      };
    }

    const sessionResult: SessionResult = {
      episodeId: episode.id,
      episodeTitle: episode.titleKo,
      completedAt: new Date().toISOString(),
      totalScore: Math.round((affinity * 0.7) + ((bestCount / totalTurns) * 30)),
      finalAffinity: affinity,
      bestChoicesCount: bestCount,
      totalTurns,
      achievedCefr,
      affinityRank,
      turnRecords: finalRecords,
    };

    onFinishGame(sessionResult);
  };

  // Handle choice selection
  const handleSelectChoice = (choice: Choice) => {
    if (selectedChoice) return; // prevent double click

    setSelectedChoice(choice);
    const newAffinity = Math.max(0, Math.min(100, affinity + choice.affinityChange));
    setAffinity(newAffinity);

    const record: TurnRecord = {
      turnNumber: currentTurn.turnNumber,
      npcDialogue: currentTurn.npcDialogue,
      chosenChoice: choice,
      wasBest: choice.isBest,
      affinityChange: choice.affinityChange,
    };
    setTurnRecords(prev => [...prev, record]);

    // Speak NPC's reaction audio
    if (settings.autoPlayAudio) {
      setTimeout(() => {
        speechService.speak(choice.npcReactionDialogue, localSpeed);
      }, 200);
    }

    setShowFeedbackModal(true);
  };

  // Handle user's direct spoken input
  const handleSubmitSpeech = async (text: string) => {
    setIsEvaluatingSpeech(true);
    try {
      const evaluation = await evaluateUserSpeech({
        userSpokenText: text,
        currentTurn,
        episode,
      });

      const newAffinity = Math.max(0, Math.min(100, affinity + evaluation.affinityChange));
      setAffinity(newAffinity);

      const bestChoice = currentTurn.choices.find(c => c.isBest) || currentTurn.choices[0];
      const dummyChoice: Choice = {
        ...bestChoice,
        id: `spoken-${currentTurn.turnNumber}`,
        text: text,
        textKo: evaluation.feedbackTitle,
        isBest: evaluation.isBest,
        cefrLevel: evaluation.cefrLevel,
        affinityChange: evaluation.affinityChange,
        feedbackTitle: evaluation.feedbackTitle,
        feedbackDetail: evaluation.feedbackDetail,
        npcReactionDialogue: evaluation.npcReactionDialogue,
        npcReactionDialogueKo: evaluation.npcReactionDialogueKo,
        npcReactionMood: evaluation.npcReactionMood,
        nativeAlternative: evaluation.nativePolish || bestChoice.nativeAlternative,
        nativeAlternativeKo: evaluation.nativePolishKo || bestChoice.nativeAlternativeKo,
      };

      const record: TurnRecord = {
        turnNumber: currentTurn.turnNumber,
        npcDialogue: currentTurn.npcDialogue,
        chosenChoice: dummyChoice,
        wasBest: evaluation.isBest,
        affinityChange: evaluation.affinityChange,
        userSpokenText: text,
        speechEvaluation: evaluation,
      };
      setTurnRecords(prev => [...prev, record]);

      setUserSpokenText(text);
      setSpeechEvaluation(evaluation);

      // Speak NPC's reaction audio
      if (settings.autoPlayAudio) {
        setTimeout(() => {
          speechService.speak(evaluation.npcReactionDialogue, localSpeed);
        }, 200);
      }

      setShowSpeechFeedbackModal(true);
    } catch (err) {
      console.error('Speech submit error:', err);
    } finally {
      setIsEvaluatingSpeech(false);
    }
  };

  // Move to next turn or finish game from choice modal
  const handleProceed = () => {
    setShowFeedbackModal(false);
    setSelectedChoice(null);

    if (isLastTurn) {
      finishGameWithRecords(turnRecords);
    } else {
      setCurrentTurnIndex(prev => prev + 1);
    }
  };

  // Move to next turn or finish game from speech modal
  const handleProceedFromSpeech = () => {
    setShowSpeechFeedbackModal(false);
    setSpeechEvaluation(null);
    setUserSpokenText('');

    if (isLastTurn) {
      finishGameWithRecords(turnRecords);
    } else {
      setCurrentTurnIndex(prev => prev + 1);
    }
  };

  // Determine current NPC mood (reactive to user answer if selected or evaluated)
  const currentNpcMood = speechEvaluation
    ? speechEvaluation.npcReactionMood
    : selectedChoice
    ? selectedChoice.npcReactionMood
    : currentTurn.npcMood;

  return (
    <div className="flex flex-col min-h-full max-w-md mx-auto px-4 py-4 sm:py-6 select-none justify-between">
      {/* Top Bar: Progress, Turn Counter, Affinity Gauge, Audio Speed */}
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          {/* Left: Turn Counter (e.g. 3/5 형식) */}
          <div className="flex items-center gap-2">
            <button
              onClick={onExitToMenu}
              className="px-2.5 py-1 rounded-xl text-xs font-semibold text-stone-400 hover:text-white bg-stone-900 border border-stone-800 transition-colors"
              title="나가기"
            >
              나가기
            </button>
            <div className="px-2.5 py-1 rounded-xl bg-stone-900 border border-stone-800 font-mono text-xs font-bold text-amber-400">
              Turn {currentTurn.turnNumber}/{episode.turns.length}
            </div>
          </div>

          {/* Right: Affinity Gauge (호감도 게이지) */}
          <div className="flex items-center gap-2">
            {/* Speed toggle chip */}
            <button
              onClick={() => setLocalSpeed(prev => prev === 1.0 ? 1.2 : prev === 1.2 ? 0.85 : 1.0)}
              className="px-2 py-1 rounded-xl text-[11px] font-mono font-bold bg-stone-900 border border-stone-800 text-stone-300 hover:text-amber-300 transition-colors"
              title="오디오 재생 속도 전환"
            >
              {localSpeed}x
            </button>

            {/* Affinity Meter */}
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-stone-900 border border-stone-800">
              <Heart className={`w-3.5 h-3.5 ${affinity >= 60 ? 'text-rose-500 fill-rose-500' : 'text-stone-500 fill-stone-500'} transition-colors`} />
              <div className="w-16 h-2 rounded-full bg-stone-800 overflow-hidden relative">
                <div
                  className={`h-full transition-all duration-500 rounded-full ${
                    affinity >= 70 ? 'bg-emerald-500' : affinity >= 40 ? 'bg-amber-500' : 'bg-rose-500'
                  }`}
                  style={{ width: `${affinity}%` }}
                />
              </div>
              <span className="font-mono text-xs font-bold text-stone-200 min-w-[2.2rem] text-right">
                {affinity}%
              </span>
            </div>
          </div>
        </div>

        {/* Mini progress segments */}
        <div className="grid grid-cols-5 gap-1.5 px-0.5">
          {episode.turns.map((_, idx) => (
            <div
              key={idx}
              className={`h-1.5 rounded-full transition-colors ${
                idx < currentTurnIndex
                  ? 'bg-amber-500'
                  : idx === currentTurnIndex
                  ? 'bg-amber-400/80 animate-pulse'
                  : 'bg-stone-800'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Main Dialogue Stage: NPC Card & Speech Balloon */}
      <div className="my-auto py-3 space-y-3">
        {/* Context Badge */}
        <div className="flex items-center justify-between text-xs px-1 text-stone-400">
          <span className="truncate text-[11px] text-amber-400 font-medium">
            📍 {episode.locationTag}
          </span>
          <span className="text-[11px] text-stone-500 font-medium">
            English Immersion Mode
          </span>
        </div>

        {/* NPC Profile & Dialogue Balloon */}
        <div className="relative rounded-3xl bg-stone-900/90 border border-stone-800 p-4 sm:p-5 shadow-xl space-y-3">
          {/* NPC Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <NpcAvatar
                seed={episode.npc.avatarSeed}
                name={episode.npc.name}
                mood={currentNpcMood}
                accentColor={episode.npc.accentColor}
                size="md"
              />
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm sm:text-base font-bold text-white">
                    {episode.npc.name}
                  </h3>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-stone-800 text-stone-400 font-mono">
                    NPC
                  </span>
                </div>
                <p className="text-xs text-stone-400">{episode.npc.role}</p>
              </div>
            </div>

            {/* Audio Replay Button (Left top beside dialogue / PRD requirement) */}
            <div className="flex items-center gap-1">
              <AudioButton
                text={currentTurn.npcDialogue}
                speed={localSpeed}
                label="다시 듣기"
                variant="pill"
                size="sm"
              />
            </div>
          </div>

          {/* NPC Speech Balloon - English Only */}
          <div className="relative p-3.5 sm:p-4 rounded-2xl bg-stone-950/70 border border-stone-800/80 space-y-2">
            <p className="text-sm sm:text-base font-semibold text-stone-100 leading-relaxed">
              &ldquo;{currentTurn.npcDialogue}&rdquo;
            </p>
          </div>

          {/* Situation Context Note */}
          <div className="text-[11px] text-stone-400 italic px-1">
            💡 {currentTurn.contextNote}
          </div>
        </div>

        {/* Mode Selector Tab & Input Zone */}
        <div className="space-y-2.5 pt-1">
          {/* Mode Switch Tabs */}
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-1 p-1 rounded-xl bg-stone-900 border border-stone-800">
              <button
                type="button"
                onClick={() => setInputMode('speech')}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  inputMode === 'speech'
                    ? 'bg-amber-500 text-stone-950 shadow-sm'
                    : 'text-stone-400 hover:text-stone-200'
                }`}
              >
                <Mic className="w-3.5 h-3.5" />
                <span>직접 말하기</span>
                {episode.targetCefr === 'C1' && (
                  <span className="text-[9px] px-1 py-0.2 rounded bg-stone-950/40 text-stone-900 font-extrabold">
                    추천
                  </span>
                )}
              </button>
              <button
                type="button"
                onClick={() => setInputMode('choice')}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  inputMode === 'choice'
                    ? 'bg-amber-500 text-stone-950 shadow-sm'
                    : 'text-stone-400 hover:text-stone-200'
                }`}
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>5개 선택지</span>
              </button>
            </div>

            <span className="text-[11px] text-stone-400">
              {inputMode === 'speech' ? '🎙️ 직접 음성/텍스트 발화' : '5가지 선택지 중 선택'}
            </span>
          </div>

          {/* Render Active Input Mode */}
          {inputMode === 'speech' ? (
            <SpeechInputPanel
              currentTurn={currentTurn}
              episode={episode}
              isEvaluating={isEvaluatingSpeech}
              playbackSpeed={localSpeed}
              onSubmitSpeech={handleSubmitSpeech}
              onSwitchToChoiceMode={() => setInputMode('choice')}
            />
          ) : (
            <div className="space-y-2">
              {(shuffledChoices.length > 0 ? shuffledChoices : currentTurn.choices).map((choice, idx) => {
                const isSelected = selectedChoice?.id === choice.id;

                return (
                  <button
                    key={choice.id}
                    onClick={() => handleSelectChoice(choice)}
                    disabled={!!selectedChoice}
                    className={`w-full text-left p-3 sm:p-3.5 rounded-xl border transition-all duration-200 relative group active:scale-[0.99] cursor-pointer ${
                      isSelected
                        ? choice.isBest
                        ? 'bg-emerald-950/60 border-emerald-500 shadow-md ring-1 ring-emerald-500'
                        : 'bg-rose-950/60 border-rose-500 shadow-md ring-1 ring-rose-500'
                        : 'bg-stone-900/80 hover:bg-stone-800/90 border-stone-800 hover:border-amber-500/50'
                    }`}
                  >
                    <div className="flex items-start gap-2.5">
                      <span className="flex items-center justify-center w-5 h-5 rounded-md bg-stone-950 border border-stone-800 text-[11px] font-bold font-mono text-stone-400 group-hover:text-amber-400 shrink-0 mt-0.5">
                        {idx + 1}
                      </span>

                      <div className="flex-1 min-w-0 space-y-0.5">
                        <p className="text-xs sm:text-sm font-semibold text-stone-100 leading-snug group-hover:text-amber-200">
                          {choice.text}
                        </p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Bottom info helper */}
      <div className="pt-2 text-center text-[11px] text-stone-400">
        {inputMode === 'speech'
          ? '마이크로 직접 말하거나 문장을 작성하여 실전 비즈니스 영어 피드백을 받아보세요.'
          : '선택 즉시 NPC의 실시간 뉘앙스 피드백과 원어민 꿀팁이 공개됩니다.'}
      </div>

      {/* Immediate Real-time Nuance & Feedback Sheet (PRD Core Feature ②) */}
      {showFeedbackModal && selectedChoice && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/85 backdrop-blur-sm animate-in fade-in duration-200">
          <div 
            className="w-full max-w-md bg-stone-900 border-t sm:border border-stone-800 rounded-t-3xl sm:rounded-3xl p-5 sm:p-6 shadow-2xl space-y-4 max-h-[85vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}
          >
            {/* Feedback Header with Affinity Delta */}
            <div className="flex items-center justify-between pb-3 border-b border-stone-800">
              <div className="flex items-center gap-2">
                {selectedChoice.isBest ? (
                  <div className="p-1.5 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                ) : (
                  <div className="p-1.5 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/40">
                    <AlertCircle className="w-5 h-5" />
                  </div>
                )}
                <div>
                  <h4 className="text-sm font-bold text-white leading-tight">
                    {selectedChoice.feedbackTitle}
                  </h4>
                  <span className="text-[11px] text-stone-400">
                    {selectedChoice.isBest ? '원어민 100% 현지 감각' : '뉘앙스 교정 꿀팁'}
                  </span>
                </div>
              </div>

              {/* Affinity Change Badge */}
              <div className={`px-2.5 py-1 rounded-xl text-xs font-mono font-bold flex items-center gap-1 ${
                selectedChoice.affinityChange > 0
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
              }`}>
                <Heart className="w-3 h-3 fill-current" />
                {selectedChoice.affinityChange > 0 ? `+${selectedChoice.affinityChange}` : selectedChoice.affinityChange}%
              </div>
            </div>

            {/* 1. NPC's Dialogue & Korean Translation */}
            <div className="p-3.5 rounded-2xl bg-stone-950/80 border border-stone-800 space-y-1.5">
              <div className="flex items-center justify-between text-[11px]">
                <span className="font-bold text-amber-400 flex items-center gap-1.5">
                  <Volume2 className="w-3.5 h-3.5" />
                  <span>{episode.npc.name}의 말</span>
                </span>
                <AudioButton
                  text={currentTurn.npcDialogue}
                  speed={localSpeed}
                  size="sm"
                  variant="ghost"
                  label="다시 듣기"
                />
              </div>
              <p className="text-xs sm:text-sm font-semibold text-stone-100 leading-relaxed">
                &ldquo;{currentTurn.npcDialogue}&rdquo;
              </p>
              <div className="pt-1.5 border-t border-stone-800/80 text-xs text-amber-300/95 font-medium leading-relaxed">
                <span className="text-[10px] text-stone-400 block mb-0.5">상대방 말 번역:</span>
                {currentTurn.npcDialogueKo}
              </div>
            </div>

            {/* 2. User's Chosen Choice & Korean Translation */}
            <div className={`p-3.5 rounded-2xl border space-y-1.5 ${
              selectedChoice.isBest
                ? 'bg-emerald-950/30 border-emerald-500/40'
                : 'bg-stone-950/80 border-stone-800'
            }`}>
              <div className="flex items-center justify-between text-[11px]">
                <span className="font-bold text-stone-300">
                  내가 선택한 답변
                </span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                  selectedChoice.isBest
                    ? 'bg-emerald-500/20 text-emerald-300'
                    : 'bg-amber-500/20 text-amber-300'
                }`}>
                  {selectedChoice.isBest ? '원어민 추천 표현' : '뉘앙스 주의'}
                </span>
              </div>
              <p className="text-xs sm:text-sm font-semibold text-stone-100 leading-relaxed">
                &ldquo;{selectedChoice.text}&rdquo;
              </p>
              <div className="pt-1.5 border-t border-stone-800/80 text-xs text-stone-300 leading-relaxed">
                <span className="text-[10px] text-stone-400 block mb-0.5">내 답변 번역:</span>
                {selectedChoice.textKo}
              </div>
            </div>

            {/* 3. NPC Immediate Reaction Box */}
            <div className="p-3.5 rounded-2xl bg-stone-950/80 border border-stone-800 space-y-1.5">
              <div className="flex items-center justify-between text-[11px] text-stone-400">
                <span className="font-bold text-amber-400">{episode.npc.name}의 실시간 반응:</span>
                <AudioButton
                  text={selectedChoice.npcReactionDialogue}
                  speed={localSpeed}
                  size="sm"
                  variant="ghost"
                  label="음성"
                />
              </div>
              <p className="text-xs sm:text-sm font-medium text-stone-100 leading-relaxed">
                &ldquo;{selectedChoice.npcReactionDialogue}&rdquo;
              </p>
              <p className="text-xs text-stone-400 pt-1.5 border-t border-stone-800/80 leading-relaxed">
                <span className="text-[10px] text-stone-500 block mb-0.5">반응 번역:</span>
                {selectedChoice.npcReactionDialogueKo}
              </p>
            </div>

            {/* 4. Nuance & Cultural Explanation */}
            <div className="space-y-1.5 text-xs sm:text-sm leading-relaxed text-stone-300 bg-stone-800/40 p-3.5 rounded-2xl border border-stone-800">
              <div className="flex items-center gap-1.5 text-amber-400 font-bold text-xs">
                <Sparkles className="w-3.5 h-3.5" />
                <span>왜 이 표현일까요? (원어민 시크릿)</span>
              </div>
              <p className="text-stone-300 text-xs leading-relaxed">
                {selectedChoice.feedbackDetail}
              </p>
            </div>

            {/* 5. Native Golden Alternative (현지인 추천 표현) */}
            <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-amber-300 flex items-center gap-1">
                  ⭐ 현지 뉴요커 추천 원어민 표현
                </span>
                <AudioButton
                  text={selectedChoice.nativeAlternative}
                  speed={localSpeed}
                  size="sm"
                  variant="pill"
                  label="원어민 발음"
                />
              </div>
              <p className="text-xs sm:text-sm font-bold text-white">
                &ldquo;{selectedChoice.nativeAlternative}&rdquo;
              </p>
              <p className="text-xs text-amber-200/90 pt-1.5 border-t border-amber-500/20 leading-relaxed">
                <span className="text-[10px] text-amber-400/80 block mb-0.5">추천 표현 번역:</span>
                {selectedChoice.nativeAlternativeKo}
              </p>
            </div>

            {/* Action Continue Button */}
            <div className="pt-2">
              <button
                onClick={handleProceed}
                className="w-full py-3.5 rounded-2xl bg-amber-500 hover:bg-amber-400 active:scale-[0.98] text-stone-950 font-black text-sm sm:text-base flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 transition-all cursor-pointer"
              >
                <span>{isLastTurn ? '에피소드 결과 확인하기' : '다음 턴으로 계속하기'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Speech Evaluation Feedback Modal (when user answers via direct speech) */}
      {showSpeechFeedbackModal && speechEvaluation && (
        <SpeechFeedbackModal
          evaluation={speechEvaluation}
          userSpokenText={userSpokenText}
          currentTurn={currentTurn}
          episode={episode}
          playbackSpeed={localSpeed}
          onProceed={handleProceedFromSpeech}
        />
      )}
    </div>
  );
};
