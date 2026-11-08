import React, { useState, useEffect, useRef } from 'react';
import { Volume2, Sparkles, CheckCircle2, XCircle, ArrowRight, Lightbulb } from 'lucide-react';
import { Grade5Word } from '../types';
import { soundEffects } from '../utils/audioEffects';
import { speechService } from '../utils/speech';
import { sentenceTracker } from '../utils/sentenceTapTracker';
import { shuffleOptionsWithRandomCorrectIndex } from '../utils/shuffle';
import confetti from 'canvas-confetti';

interface WordQuizCardProps {
  word: Grade5Word;
  questionNumber: number;
  totalQuestions: number;
  streak: number;
  onAnswer: (isCorrect: boolean, selectedOption: string) => void;
  isListeningMode?: boolean;
}

export const WordQuizCard: React.FC<WordQuizCardProps> = ({
  word,
  questionNumber,
  totalQuestions,
  streak,
  onAnswer,
  isListeningMode = false,
}) => {
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [hasAnswered, setHasAnswered] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [shuffledOptions, setShuffledOptions] = useState<string[]>([]);
  const lastCorrectIndexRef = useRef<number>(-1);

  // Shuffle options and play word pronunciation on question load
  useEffect(() => {
    setSelectedOption(null);
    setHasAnswered(false);
    setShowHint(false);

    // Shuffle options so correct answer is NOT always #1 and doesn't repeat the same number
    const shuffled = shuffleOptionsWithRandomCorrectIndex(
      word.options,
      word.meaning,
      lastCorrectIndexRef.current
    );
    lastCorrectIndexRef.current = shuffled.indexOf(word.meaning);
    setShuffledOptions(shuffled);

    const timer = setTimeout(() => {
      speechService.speak(word.word, 0.95);
    }, 250);

    return () => clearTimeout(timer);
  }, [word]);

  const handleSelect = (option: string) => {
    if (hasAnswered) return;

    const isCorrect = option === word.meaning;
    setSelectedOption(option);
    setHasAnswered(true);

    if (isCorrect) {
      soundEffects.playCorrect();
      if (streak + 1 >= 3 && (streak + 1) % 3 === 0) {
        confetti({
          particleCount: 40,
          spread: 60,
          origin: { y: 0.7 },
        });
      }
    } else {
      soundEffects.playWrong();
    }

    // Auto advance or wait for user to click next
    setTimeout(() => {
      onAnswer(isCorrect, option);
    }, 1200);
  };

  const handlePlayAudio = (e: React.MouseEvent) => {
    e.stopPropagation();
    speechService.speak(word.word, 0.9);
  };

  return (
    <div className="w-full max-w-xl mx-auto space-y-4 animate-in fade-in zoom-in-95 duration-200">
      {/* Top Question Progress & Streak Indicator */}
      <div className="flex items-center justify-between text-xs px-1">
        <div className="flex items-center gap-2">
          <span className="font-mono font-bold text-amber-400 bg-stone-900 border border-stone-800 px-3 py-1 rounded-xl">
            Q {questionNumber} / {totalQuestions}
          </span>
          <span className="px-2.5 py-1 rounded-xl bg-stone-900 border border-stone-800 text-stone-300 font-medium">
            {word.categoryEmoji} {word.categoryNameKo}
          </span>
        </div>

        {streak >= 2 && (
          <div className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold animate-bounce text-[11px]">
            <Sparkles className="w-3.5 h-3.5" />
            <span>{streak}연속 정답! 🔥</span>
          </div>
        )}
      </div>

      {/* Main Word Card */}
      <div className="p-5 sm:p-7 rounded-3xl bg-stone-900/90 border border-stone-800 shadow-xl space-y-4 text-center relative overflow-hidden">
        {/* Decorative background glow */}
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-36 h-36 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-36 h-36 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Word Display */}
        <div className="space-y-2">
          {isListeningMode ? (
            <div className="py-4 space-y-2">
              <button
                onClick={handlePlayAudio}
                className="w-20 h-20 mx-auto rounded-3xl bg-gradient-to-tr from-amber-500 to-amber-400 text-stone-950 flex items-center justify-center shadow-lg shadow-amber-500/30 hover:scale-105 active:scale-95 transition-all cursor-pointer group"
                title="발음 다시 듣기"
              >
                <Volume2 className="w-10 h-10 group-hover:scale-110 transition-transform" />
              </button>
              <p className="text-xs text-amber-300 font-bold">
                🎧 원어민 발음을 잘 듣고 알맞은 뜻을 고르세요!
              </p>
            </div>
          ) : (
            <div className="space-y-1.5">
              <div className="flex items-center justify-center gap-2.5">
                <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-wide font-sans">
                  {word.word}
                </h2>
                <button
                  onClick={handlePlayAudio}
                  className="p-2.5 rounded-2xl bg-stone-800 hover:bg-stone-700 text-amber-400 border border-stone-700 transition-all cursor-pointer hover:scale-105 active:scale-95"
                  title="발음 듣기"
                >
                  <Volume2 className="w-5 h-5" />
                </button>
              </div>

              {word.pronunciation && (
                <p className="text-xs font-mono text-stone-400">
                  [{word.pronunciation}]
                </p>
              )}
            </div>
          )}
        </div>

        {/* Example Sentence / Hint (Tracks Sentence Tap Frequency) */}
        <div className="pt-2 border-t border-stone-800/80">
          {!showHint ? (
            <button
              onClick={() => {
                setShowHint(true);
                sentenceTracker.recordTap(word.exampleEn, word.exampleKo, word.categoryNameKo);
                speechService.speak(word.exampleEn, 0.9);
              }}
              className="text-[11px] text-stone-400 hover:text-amber-300 transition-colors inline-flex items-center gap-1 cursor-pointer bg-stone-950/60 px-3 py-1.5 rounded-xl border border-stone-800"
            >
              <Lightbulb className="w-3.5 h-3.5 text-amber-400" />
              <span>힌트 예문 보기 & 듣기 (탭 빈도 기록)</span>
            </button>
          ) : (
            <div 
              onClick={() => {
                sentenceTracker.recordTap(word.exampleEn, word.exampleKo, word.categoryNameKo);
                speechService.speak(word.exampleEn, 0.9);
              }}
              className="p-3 rounded-2xl bg-stone-950/80 border border-stone-800/90 text-xs space-y-1 animate-in fade-in duration-150 cursor-pointer hover:border-amber-500/50 transition-colors group"
              title="클릭하여 예문 다시 듣기 (탭 빈도 카운트)"
            >
              <div className="flex items-center justify-between text-[10px] text-stone-400 mb-0.5">
                <span className="text-amber-400 font-semibold flex items-center gap-1">
                  <Volume2 className="w-3 h-3" />
                  예문 문장 (클릭 시 발음 재생 & 탭 기록)
                </span>
                <span className="font-mono text-[9px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300">
                  탭 {sentenceTracker.getStats().items[word.exampleEn]?.tapCount || 1}회
                </span>
              </div>
              <p className="font-medium text-stone-100 italic group-hover:text-amber-200 transition-colors">
                &ldquo;{word.exampleEn}&rdquo;
              </p>
              <p className="text-[11px] text-stone-400">
                {word.exampleKo}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* 4 Choices Grid (Randomized order so correct answer is not fixed to #1) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
        {(shuffledOptions.length > 0 ? shuffledOptions : word.options).map((option, idx) => {
          const isSelected = selectedOption === option;
          const isCorrect = option === word.meaning;

          let btnClass = 'bg-stone-900/90 hover:bg-stone-800 border-stone-800 text-stone-100 hover:border-amber-500/50';

          if (hasAnswered) {
            if (isCorrect) {
              btnClass = 'bg-emerald-950/80 border-emerald-500 text-emerald-200 ring-2 ring-emerald-500/50';
            } else if (isSelected) {
              btnClass = 'bg-rose-950/80 border-rose-500 text-rose-200 ring-2 ring-rose-500/50';
            } else {
              btnClass = 'bg-stone-900/40 border-stone-800/40 text-stone-500 opacity-60';
            }
          }

          return (
            <button
              key={idx}
              onClick={() => handleSelect(option)}
              disabled={hasAnswered}
              className={`p-3.5 sm:p-4 rounded-2xl border text-left transition-all duration-200 flex items-center justify-between group active:scale-[0.98] cursor-pointer ${btnClass}`}
            >
              <div className="flex items-center gap-3">
                <span className="w-7 h-7 rounded-xl bg-stone-950 border border-stone-800 text-xs font-mono font-bold flex items-center justify-center text-stone-400 group-hover:text-amber-400 transition-colors">
                  {idx + 1}
                </span>
                <span className="font-bold text-sm sm:text-base">
                  {option}
                </span>
              </div>

              {hasAnswered && isCorrect && (
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
              )}
              {hasAnswered && isSelected && !isCorrect && (
                <XCircle className="w-5 h-5 text-rose-400 shrink-0" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
