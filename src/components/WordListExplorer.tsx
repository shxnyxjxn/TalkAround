import React, { useState } from 'react';
import { Volume2, Search, ArrowLeft, BookOpen, Sparkles } from 'lucide-react';
import { Grade5Word, WordCategory } from '../types';
import { WORD_CATEGORIES, GRADE_5_WORDS } from '../data/grade5Words';
import { speechService } from '../utils/speech';
import { sentenceTracker } from '../utils/sentenceTapTracker';

interface WordListExplorerProps {
  onBack: () => void;
}

export const WordListExplorer: React.FC<WordListExplorerProps> = ({ onBack }) => {
  const [selectedCategory, setSelectedCategory] = useState<WordCategory | 'all'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [tapTick, setTapTick] = useState(0);

  const filteredWords = GRADE_5_WORDS.filter(w => {
    const matchCategory = selectedCategory === 'all' || w.category === selectedCategory;
    const matchSearch =
      w.word.toLowerCase().includes(searchTerm.toLowerCase()) ||
      w.meaning.includes(searchTerm);
    return matchCategory && matchSearch;
  });

  const handleTapSentence = (word: Grade5Word) => {
    sentenceTracker.recordTap(word.exampleEn, word.exampleKo, word.categoryNameKo);
    speechService.speak(word.exampleEn, 0.9);
    setTapTick(prev => prev + 1);
  };

  return (
    <div className="w-full max-w-2xl mx-auto space-y-4 animate-in fade-in duration-200">
      {/* Top Bar */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-stone-900 border border-stone-800 text-stone-300 hover:text-white text-xs font-bold transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>게임 홈으로 돌아가기</span>
        </button>

        <span className="text-xs font-bold text-amber-400 flex items-center gap-1">
          <BookOpen className="w-4 h-4" />
          <span>초등 5학년 필수 단어장 ({filteredWords.length}개)</span>
        </span>
      </div>

      {/* Search Input */}
      <div className="relative">
        <Search className="w-4 h-4 text-stone-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          placeholder="단어(classroom) 또는 뜻(교실)으로 검색..."
          className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-stone-900 border border-stone-800 text-xs sm:text-sm text-stone-100 placeholder:text-stone-500 focus:outline-none focus:border-amber-500 font-medium"
        />
      </div>

      {/* Category Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs">
        <button
          onClick={() => setSelectedCategory('all')}
          className={`px-3 py-1.5 rounded-xl font-bold transition-all shrink-0 cursor-pointer ${
            selectedCategory === 'all'
              ? 'bg-amber-500 text-stone-950 shadow-sm'
              : 'bg-stone-900 text-stone-400 hover:text-stone-200 border border-stone-800'
          }`}
        >
          전체 단어 ({GRADE_5_WORDS.length})
        </button>
        {WORD_CATEGORIES.map(cat => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat.id)}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all shrink-0 flex items-center gap-1 cursor-pointer ${
              selectedCategory === cat.id
                ? 'bg-amber-500 text-stone-950 shadow-sm'
                : 'bg-stone-900 text-stone-400 hover:text-stone-200 border border-stone-800'
            }`}
          >
            <span>{cat.emoji}</span>
            <span>{cat.nameKo}</span>
          </button>
        ))}
      </div>

      {/* Words Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-[65vh] overflow-y-auto pr-1">
        {filteredWords.map(word => (
          <div
            key={word.id}
            className="p-3.5 rounded-2xl bg-stone-900/90 border border-stone-800 hover:border-amber-500/50 transition-all space-y-1.5 group"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="font-bold text-base text-white font-sans group-hover:text-amber-300 transition-colors">
                  {word.word}
                </span>
                {word.pronunciation && (
                  <span className="text-[11px] text-stone-400 font-mono">
                    [{word.pronunciation}]
                  </span>
                )}
              </div>

              <button
                onClick={() => speechService.speak(word.word, 0.9)}
                className="p-1.5 rounded-lg bg-stone-800 text-amber-400 hover:bg-stone-700 transition-colors cursor-pointer"
                title="발음 듣기"
              >
                <Volume2 className="w-3.5 h-3.5" />
              </button>
            </div>

            <p className="text-xs font-semibold text-emerald-400">
              {word.meaning}
            </p>

            {/* Example sentence: clickable to listen and record sentence tap */}
            <div 
              onClick={() => handleTapSentence(word)}
              className="pt-2 border-t border-stone-800/80 text-[11px] text-stone-400 space-y-0.5 cursor-pointer hover:bg-stone-800/40 p-1.5 -mx-1.5 rounded-xl transition-all group/ex"
              title="예문 문장 탭하여 듣기 (탭 빈도 카운트)"
            >
              <div className="flex items-center justify-between text-[10px] text-amber-400 font-semibold mb-0.5">
                <span className="flex items-center gap-1">
                  <Volume2 className="w-3 h-3" />
                  예문 문장
                </span>
                <span className="font-mono text-[9px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300">
                  탭 {sentenceTracker.getStats().items[word.exampleEn]?.tapCount || 0}회
                </span>
              </div>
              <p className="italic text-stone-200 group-hover/ex:text-amber-200 leading-tight">
                &ldquo;{word.exampleEn}&rdquo;
              </p>
              <p className="text-[10px] text-stone-400">
                {word.exampleKo}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
