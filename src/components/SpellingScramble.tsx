import React, { useState, useEffect } from 'react';
import { Volume2, RotateCcw, Check, Delete, Sparkles, CheckCircle2, XCircle, Lightbulb } from 'lucide-react';
import { Grade5Word } from '../types';
import { soundEffects } from '../utils/audioEffects';
import { speechService } from '../utils/speech';
import confetti from 'canvas-confetti';

interface SpellingScrambleProps {
  word: Grade5Word;
  questionNumber: number;
  totalQuestions: number;
  streak: number;
  onAnswer: (isCorrect: boolean) => void;
}

interface LetterTile {
  id: number;
  letter: string;
  isUsed: boolean;
}

export const SpellingScramble: React.FC<SpellingScrambleProps> = ({
  word,
  questionNumber,
  totalQuestions,
  streak,
  onAnswer,
}) => {
  const targetWord = word.word.toLowerCase().replace(/[^a-z]/g, '');
  const [tiles, setTiles] = useState<LetterTile[]>([]);
  const [selectedTiles, setSelectedTiles] = useState<LetterTile[]>([]);
  const [hasChecked, setHasChecked] = useState(false);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);

  // Initialize and shuffle letters
  useEffect(() => {
    setHasChecked(false);
    setIsCorrect(null);
    setSelectedTiles([]);

    const letters = targetWord.split('');
    // Fisher-Yates shuffle
    const shuffled = [...letters];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    setTiles(
      shuffled.map((letter, index) => ({
        id: index,
        letter,
        isUsed: false,
      }))
    );

    // Play word audio
    const timer = setTimeout(() => {
      speechService.speak(word.word, 0.9);
    }, 200);
    return () => clearTimeout(timer);
  }, [word]);

  const handleTileClick = (tile: LetterTile) => {
    if (tile.isUsed || hasChecked) return;
    soundEffects.playPop();

    // Mark as used
    setTiles(prev => prev.map(t => (t.id === tile.id ? { ...t, isUsed: true } : t)));
    setSelectedTiles(prev => [...prev, tile]);
  };

  const handleRemoveTile = (tile: LetterTile) => {
    if (hasChecked) return;
    soundEffects.playPop();

    setSelectedTiles(prev => prev.filter(t => t.id !== tile.id));
    setTiles(prev => prev.map(t => (t.id === tile.id ? { ...t, isUsed: false } : t)));
  };

  const handleReset = () => {
    if (hasChecked) return;
    soundEffects.playPop();
    setSelectedTiles([]);
    setTiles(prev => prev.map(t => ({ ...t, isUsed: false })));
  };

  const handleCheck = () => {
    if (hasChecked || selectedTiles.length === 0) return;

    const spelled = selectedTiles.map(t => t.letter).join('');
    const correct = spelled === targetWord;

    setHasChecked(true);
    setIsCorrect(correct);

    if (correct) {
      soundEffects.playCorrect();
      if (streak + 1 >= 3) {
        confetti({ particleCount: 35, spread: 60, origin: { y: 0.7 } });
      }
    } else {
      soundEffects.playWrong();
    }

    setTimeout(() => {
      onAnswer(correct);
    }, 1400);
  };

  // Auto-check when all slots filled
  useEffect(() => {
    if (selectedTiles.length === targetWord.length && !hasChecked && targetWord.length > 0) {
      handleCheck();
    }
  }, [selectedTiles, targetWord.length, hasChecked]);

  return (
    <div className="w-full max-w-xl mx-auto space-y-4 animate-in fade-in zoom-in-95 duration-200">
      {/* Top Question Progress */}
      <div className="flex items-center justify-between text-xs px-1">
        <div className="flex items-center gap-2">
          <span className="font-mono font-bold text-amber-400 bg-stone-900 border border-stone-800 px-3 py-1 rounded-xl">
            스펠링 Q {questionNumber} / {totalQuestions}
          </span>
          <span className="px-2.5 py-1 rounded-xl bg-stone-900 border border-stone-800 text-stone-300 font-medium">
            {word.categoryEmoji} {word.categoryNameKo}
          </span>
        </div>

        {streak >= 2 && (
          <div className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold text-[11px]">
            <Sparkles className="w-3.5 h-3.5" />
            <span>{streak}연속 성공!</span>
          </div>
        )}
      </div>

      {/* Main Target Card */}
      <div className="p-5 sm:p-6 rounded-3xl bg-stone-900/90 border border-stone-800 shadow-xl space-y-4 text-center">
        <div className="space-y-1">
          <span className="text-[11px] text-stone-400 font-medium">이 단어의 철자를 순서대로 맞춰보세요!</span>
          <div className="flex items-center justify-center gap-2">
            <h3 className="text-2xl sm:text-3xl font-extrabold text-amber-300">
              &ldquo;{word.meaning}&rdquo;
            </h3>
            <button
              onClick={() => speechService.speak(word.word, 0.9)}
              className="p-2 rounded-xl bg-stone-800 text-amber-400 hover:bg-stone-700 transition-colors cursor-pointer"
              title="발음 듣기"
            >
              <Volume2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Selected Letter Slots (Target Spelled Word) */}
        <div className="flex flex-wrap items-center justify-center gap-1.5 min-h-[3.25rem] p-2.5 rounded-2xl bg-stone-950/70 border border-stone-800/80">
          {Array.from({ length: targetWord.length }).map((_, idx) => {
            const tile = selectedTiles[idx];
            return (
              <button
                key={idx}
                onClick={() => tile && handleRemoveTile(tile)}
                disabled={hasChecked}
                className={`w-9 h-11 sm:w-11 sm:h-12 rounded-xl border text-base sm:text-lg font-black font-mono flex items-center justify-center transition-all ${
                  tile
                    ? hasChecked
                      ? isCorrect
                        ? 'bg-emerald-600 border-emerald-400 text-white shadow-md'
                        : 'bg-rose-600 border-rose-400 text-white shadow-md'
                      : 'bg-amber-500 border-amber-400 text-stone-950 shadow-md cursor-pointer hover:bg-amber-400'
                    : 'bg-stone-900/40 border-dashed border-stone-700 text-transparent'
                }`}
              >
                {tile ? tile.letter.toUpperCase() : ''}
              </button>
            );
          })}
        </div>

        {/* Status Message */}
        {hasChecked && (
          <div className={`p-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 ${
            isCorrect ? 'bg-emerald-950/60 border-emerald-500/60 text-emerald-300' : 'bg-rose-950/60 border-rose-500/60 text-rose-300'
          }`}>
            {isCorrect ? (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span>정답입니다! 완벽한 스펠링이에요 👏</span>
              </>
            ) : (
              <>
                <XCircle className="w-4 h-4" />
                <span>아쉬워요! 올바른 철자는 <strong>{word.word.toUpperCase()}</strong> 입니다.</span>
              </>
            )}
          </div>
        )}
      </div>

      {/* Scrambled Letter Tiles to Pick */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <span className="text-xs font-bold text-stone-300">알파벳 조각을 클릭하세요</span>
          <button
            onClick={handleReset}
            disabled={hasChecked || selectedTiles.length === 0}
            className="text-[11px] text-stone-400 hover:text-stone-200 flex items-center gap-1 cursor-pointer disabled:opacity-30"
          >
            <RotateCcw className="w-3 h-3" />
            <span>처음부터 다시</span>
          </button>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-2 p-3 rounded-2xl bg-stone-900/60 border border-stone-800">
          {tiles.map(tile => (
            <button
              key={tile.id}
              onClick={() => handleTileClick(tile)}
              disabled={tile.isUsed || hasChecked}
              className={`w-10 h-12 sm:w-12 sm:h-14 rounded-2xl border text-lg sm:text-xl font-black font-mono flex items-center justify-center transition-all cursor-pointer ${
                tile.isUsed
                  ? 'bg-stone-950/40 border-stone-800/40 text-stone-700 opacity-40 cursor-not-allowed scale-90'
                  : 'bg-stone-800 hover:bg-stone-700 border-stone-700 text-stone-100 shadow-md hover:border-amber-400 hover:scale-105 active:scale-95'
              }`}
            >
              {tile.letter.toUpperCase()}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
