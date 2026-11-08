import React, { useState, useEffect } from 'react';
import { Timer, Zap, Sparkles, CheckCircle2, XCircle, Volume2 } from 'lucide-react';
import { Grade5Word } from '../types';
import { soundEffects } from '../utils/audioEffects';
import { speechService } from '../utils/speech';
import confetti from 'canvas-confetti';

interface WordSpeedChallengeProps {
  words: Grade5Word[];
  onFinish: (correctCount: number, wrongCount: number, wrongWords: Grade5Word[]) => void;
}

export const WordSpeedChallenge: React.FC<WordSpeedChallengeProps> = ({ words, onFinish }) => {
  const [timeLeft, setTimeLeft] = useState(60);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [wrongCount, setWrongCount] = useState(0);
  const [wrongWords, setWrongWords] = useState<Grade5Word[]>([]);
  const [streak, setStreak] = useState(0);
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);

  const currentWord = words[currentIndex % words.length];

  // 60-second countdown
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // When time expires, finish game
  useEffect(() => {
    if (timeLeft === 0) {
      onFinish(correctCount, wrongCount, wrongWords);
    }
  }, [timeLeft]);

  const handleSelectOption = (option: string) => {
    if (timeLeft <= 0) return;

    const isCorrect = option === currentWord.meaning;
    if (isCorrect) {
      soundEffects.playCorrect();
      setCorrectCount(prev => prev + 1);
      const newStreak = streak + 1;
      setStreak(newStreak);
      setFeedback('correct');

      if (newStreak >= 5 && newStreak % 5 === 0) {
        confetti({ particleCount: 30, spread: 60, origin: { y: 0.7 } });
      }
    } else {
      soundEffects.playWrong();
      setWrongCount(prev => prev + 1);
      setWrongWords(prev => [...prev, currentWord]);
      setStreak(0);
      setFeedback('wrong');
    }

    setTimeout(() => {
      setFeedback(null);
      setCurrentIndex(prev => prev + 1);
    }, 350);
  };

  const progressPercent = (timeLeft / 60) * 100;

  return (
    <div className="w-full max-w-xl mx-auto space-y-4 animate-in fade-in zoom-in-95 duration-200">
      {/* Top Timer & Stats */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs px-1">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/40 font-mono font-bold text-sm">
              <Timer className="w-4 h-4 animate-spin text-amber-400" />
              <span>{timeLeft}초 남음</span>
            </div>
            {streak >= 3 && (
              <span className="px-2.5 py-1 rounded-xl bg-rose-500/20 text-rose-300 border border-rose-500/40 font-bold text-xs flex items-center gap-1 animate-pulse">
                <Zap className="w-3.5 h-3.5" />
                <span>{streak}콤보!</span>
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 font-mono text-xs">
            <span className="text-emerald-400 font-bold">정답 {correctCount}</span>
            <span className="text-stone-500">|</span>
            <span className="text-rose-400 font-bold">오답 {wrongCount}</span>
          </div>
        </div>

        {/* Timer Bar */}
        <div className="w-full h-2.5 rounded-full bg-stone-800 overflow-hidden">
          <div
            className={`h-full transition-all duration-1000 rounded-full ${
              timeLeft > 20 ? 'bg-amber-500' : timeLeft > 10 ? 'bg-orange-500' : 'bg-rose-500 animate-pulse'
            }`}
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Word Question Card */}
      <div className="p-6 rounded-3xl bg-stone-900/90 border border-stone-800 shadow-xl space-y-3 text-center relative overflow-hidden">
        <div className="flex items-center justify-center gap-2">
          <h2 className="text-3xl sm:text-4xl font-black text-white font-sans">
            {currentWord.word}
          </h2>
          <button
            onClick={() => speechService.speak(currentWord.word, 0.95)}
            className="p-2 rounded-xl bg-stone-800 text-amber-400 hover:bg-stone-700 transition-colors cursor-pointer"
          >
            <Volume2 className="w-4 h-4" />
          </button>
        </div>
        <p className="text-xs text-stone-400">
          {currentWord.categoryEmoji} {currentWord.categoryNameKo}
        </p>

        {feedback && (
          <div className="absolute inset-0 bg-stone-950/85 backdrop-blur-sm flex items-center justify-center animate-in fade-in duration-100">
            {feedback === 'correct' ? (
              <div className="flex items-center gap-2 text-emerald-400 font-black text-lg">
                <CheckCircle2 className="w-6 h-6" />
                <span>정답! (+1)</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-rose-400 font-black text-lg">
                <XCircle className="w-6 h-6" />
                <span>오답! ({currentWord.meaning})</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 4 Choices */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        {currentWord.options.map((option, idx) => (
          <button
            key={idx}
            onClick={() => handleSelectOption(option)}
            disabled={feedback !== null}
            className="p-4 rounded-2xl bg-stone-900 hover:bg-stone-800 active:scale-95 border border-stone-800 hover:border-amber-400 text-stone-100 font-bold text-sm sm:text-base transition-all text-left flex items-center gap-3 cursor-pointer"
          >
            <span className="w-6 h-6 rounded-lg bg-stone-950 border border-stone-800 text-xs font-mono font-bold flex items-center justify-center text-stone-400">
              {idx + 1}
            </span>
            <span>{option}</span>
          </button>
        ))}
      </div>
    </div>
  );
};
