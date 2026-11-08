import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  Trophy, 
  BookOpen, 
  Zap, 
  Headphones, 
  SpellCheck, 
  Play, 
  Sheet, 
  User, 
  Volume2, 
  CheckCircle2, 
  XCircle, 
  Flame, 
  Layers, 
  HelpCircle,
  ExternalLink,
  ChevronRight,
  ArrowRight
} from 'lucide-react';
import { 
  Grade5Word, 
  WordGameMode, 
  WordCategory, 
  StudentProfile, 
  GoogleSheetRecord, 
  GameSessionSummary 
} from '../types';
import { GRADE_5_WORDS, WORD_CATEGORIES } from '../data/grade5Words';
import { StudentHeader } from './StudentHeader';
import { WordQuizCard } from './WordQuizCard';
import { SpellingScramble } from './SpellingScramble';
import { WordSpeedChallenge } from './WordSpeedChallenge';
import { WordGameResultView } from './WordGameResultView';
import { WordListExplorer } from './WordListExplorer';
import { StudentProfileModal } from './StudentProfileModal';
import { GoogleSheetSyncModal } from './GoogleSheetSyncModal';
import { soundEffects } from '../utils/audioEffects';
import { getSavedWebAppUrl, getSavedRecords } from '../utils/googleSheetSync';

const STORAGE_KEY_PROFILE = 'grade5_student_profile_v1';

const DEFAULT_PROFILE: StudentProfile = {
  name: '김민준',
  avatar: '🌟',
  play_count: 0,
  correct_count: 0,
  wrong_count: 0,
};

export const Grade5WordGameHub: React.FC = () => {
  // Student Profile state
  const [profile, setProfile] = useState<StudentProfile>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_PROFILE);
      return saved ? JSON.parse(saved) : DEFAULT_PROFILE;
    } catch {
      return DEFAULT_PROFILE;
    }
  });

  // Google Sheet Web App URL state
  const [hasSheetUrl, setHasSheetUrl] = useState<boolean>(() => {
    return !!getSavedWebAppUrl();
  });

  // Modals
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isSheetModalOpen, setIsSheetModalOpen] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

  // Active Screen View
  const [view, setView] = useState<'home' | 'game' | 'result' | 'dictionary'>('home');
  const [selectedMode, setSelectedMode] = useState<WordGameMode>('meaning');
  const [selectedCategory, setSelectedCategory] = useState<WordCategory | 'all'>('all');

  // Game Session State
  const [sessionWords, setSessionWords] = useState<Grade5Word[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [sessionCorrectCount, setSessionCorrectCount] = useState(0);
  const [sessionWrongCount, setSessionWrongCount] = useState(0);
  const [sessionWrongWords, setSessionWrongWords] = useState<Grade5Word[]>([]);
  const [sessionStreak, setSessionStreak] = useState(0);
  const [sessionStartTime, setSessionStartTime] = useState<number>(0);
  const [lastSummary, setLastSummary] = useState<GameSessionSummary | null>(null);
  const [sheetRecords, setSheetRecords] = useState<GoogleSheetRecord[]>(getSavedRecords());

  // Save profile to localStorage on change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_PROFILE, JSON.stringify(profile));
    } catch (e) {
      console.warn('Failed to save profile:', e);
    }
  }, [profile]);

  const handleToggleMute = () => {
    const next = !isMuted;
    setIsMuted(next);
    soundEffects.setMuted(next);
  };

  const handleSaveProfile = (updated: Partial<StudentProfile>) => {
    setProfile(prev => ({ ...prev, ...updated }));
  };

  const handleResetStats = () => {
    setProfile(prev => ({
      ...prev,
      play_count: 0,
      correct_count: 0,
      wrong_count: 0,
    }));
  };

  // Start a new game session with 10 random words
  const handleStartGame = (mode: WordGameMode, category: WordCategory | 'all' = selectedCategory) => {
    setSelectedMode(mode);
    setSelectedCategory(category);

    const pool = category === 'all' 
      ? [...GRADE_5_WORDS] 
      : GRADE_5_WORDS.filter(w => w.category === category);

    // Shuffle pool
    const shuffled = [...pool].sort(() => Math.random() - 0.5);
    const selected = shuffled.slice(0, mode === 'speed' ? 30 : 10);

    setSessionWords(selected);
    setCurrentIndex(0);
    setSessionCorrectCount(0);
    setSessionWrongCount(0);
    setSessionWrongWords([]);
    setSessionStreak(0);
    setSessionStartTime(Date.now());
    setView('game');
  };

  // Called after each question in meaning/listening/spelling modes
  const handleQuestionAnswer = (isCorrect: boolean) => {
    const currentWord = sessionWords[currentIndex];

    if (isCorrect) {
      setSessionCorrectCount(prev => prev + 1);
      setSessionStreak(prev => prev + 1);
    } else {
      setSessionWrongCount(prev => prev + 1);
      setSessionWrongWords(prev => [...prev, currentWord]);
      setSessionStreak(0);
    }

    const nextIndex = currentIndex + 1;
    if (nextIndex < sessionWords.length) {
      setCurrentIndex(nextIndex);
    } else {
      // Game session complete
      finishGameSession(
        isCorrect ? sessionCorrectCount + 1 : sessionCorrectCount,
        !isCorrect ? sessionWrongCount + 1 : sessionWrongCount,
        !isCorrect ? [...sessionWrongWords, currentWord] : sessionWrongWords
      );
    }
  };

  // Finish game session, update student's cumulative counts, and show results
  const finishGameSession = (
    finalCorrect: number,
    finalWrong: number,
    finalWrongWords: Grade5Word[]
  ) => {
    const totalQ = finalCorrect + finalWrong;
    const timeSpent = Math.max(1, Math.round((Date.now() - sessionStartTime) / 1000));
    const score = Math.round((finalCorrect / totalQ) * 100);

    // Increment student's cumulative counts:
    // 1. play_count: increments by 1
    // 2. correct_count: adds this session's correct answers
    // 3. wrong_count: adds this session's wrong answers
    const updatedProfile: StudentProfile = {
      ...profile,
      play_count: profile.play_count + 1,
      correct_count: profile.correct_count + finalCorrect,
      wrong_count: profile.wrong_count + finalWrong,
      lastPlayed: new Date().toISOString(),
    };
    setProfile(updatedProfile);

    const summary: GameSessionSummary = {
      mode: selectedMode,
      totalQuestions: totalQ,
      correctAnswers: finalCorrect,
      wrongAnswers: finalWrong,
      score,
      timeSpentSeconds: timeSpent,
      wrongWords: finalWrongWords,
      timestamp: new Date().toISOString(),
    };
    setLastSummary(summary);
    setView('result');
  };

  const handleRecordSynced = (newRecord: GoogleSheetRecord) => {
    setSheetRecords(prev => [newRecord, ...prev.filter(r => r.id !== newRecord.id)]);
  };

  return (
    <div className="min-h-screen bg-stone-950 text-stone-100 flex flex-col font-sans select-none selection:bg-amber-500 selection:text-stone-950">
      {/* Student Profile & Live Stats Header */}
      <StudentHeader
        profile={profile}
        hasSheetUrl={hasSheetUrl}
        onEditProfile={() => setIsProfileModalOpen(true)}
        onOpenSheetModal={() => setIsSheetModalOpen(true)}
        isMuted={isMuted}
        onToggleMute={handleToggleMute}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-4xl w-full mx-auto p-4 sm:p-6 flex flex-col justify-center">
        {/* VIEW 1: HOME DASHBOARD & MODE SELECTION */}
        {view === 'home' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* Google Sheet Sync Notice Banner */}
            {!hasSheetUrl ? (
              <div className="p-3.5 sm:p-4 rounded-3xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between gap-3 text-xs sm:text-sm">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-2xl bg-amber-500/20 text-amber-400 shrink-0">
                    <Sheet className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="font-bold text-amber-300 block">
                      구글 스프레드시트에 학생 학습 기록을 자동으로 저장하세요!
                    </span>
                    <span className="text-stone-400 text-xs">
                      열 구성: <code className="text-amber-200 font-mono">timestamp, name, play_count, correct_count, wrong_count</code>
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setIsSheetModalOpen(true)}
                  className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs shrink-0 transition-colors shadow-md shadow-amber-500/20 cursor-pointer"
                >
                  1분 연동하기
                </button>
              </div>
            ) : (
              <div className="p-3 rounded-2xl bg-emerald-950/40 border border-emerald-500/30 flex items-center justify-between text-xs text-emerald-200">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>구글 스프레드시트 자동 기록 활성화됨 (게임 종료 시 실시간 전송)</span>
                </div>
                <button
                  onClick={() => setIsSheetModalOpen(true)}
                  className="text-[11px] underline text-emerald-300 hover:text-white cursor-pointer"
                >
                  시트 설정 관리
                </button>
              </div>
            )}

            {/* Hero Welcome Banner */}
            <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-blue-600/20 via-indigo-600/20 to-purple-600/20 border border-stone-800 shadow-xl relative overflow-hidden text-center sm:text-left flex flex-col sm:flex-row items-center justify-between gap-6">
              <div className="space-y-2 z-10">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 text-xs font-bold border border-blue-500/30">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>초등학교 5학년 영어 교과서 필수 영단어</span>
                </div>
                <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-white tracking-tight">
                  신나는 <span className="text-amber-400">초등 5학년</span> 영단어 퀴즈 🎮
                </h1>
                <p className="text-xs sm:text-sm text-stone-300 max-h-16 leading-relaxed">
                  재미있는 퀴즈를 풀고 스펠링을 맞추면, <span className="text-amber-300 font-semibold">{profile.name}</span> 학생의 
                  플레이 횟수와 정답·오답 기록이 구글 시트에 차곡차곡 저장돼요!
                </p>
              </div>

              {/* Big Quick Start Button */}
              <div className="shrink-0 z-10">
                <button
                  onClick={() => handleStartGame('meaning')}
                  className="px-6 py-4 rounded-3xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-stone-950 font-black text-base sm:text-lg flex items-center gap-2.5 shadow-xl shadow-amber-500/30 hover:scale-105 active:scale-95 transition-all cursor-pointer"
                >
                  <Play className="w-6 h-6 fill-stone-950" />
                  <span>지금 바로 퀴즈 시작!</span>
                </button>
              </div>
            </div>

            {/* Category Filter Pills */}
            <div className="space-y-2">
              <div className="flex items-center justify-between px-1">
                <span className="text-xs font-bold text-stone-300">
                  학습 테마 선택
                </span>
                <span className="text-[11px] text-stone-500">
                  총 60개 필수 초등 어휘
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
                <button
                  onClick={() => setSelectedCategory('all')}
                  className={`p-3 rounded-2xl border text-center transition-all cursor-pointer ${
                    selectedCategory === 'all'
                      ? 'bg-amber-500/20 border-amber-500 text-amber-300 font-bold shadow-md'
                      : 'bg-stone-900/80 border-stone-800 text-stone-400 hover:text-stone-200'
                  }`}
                >
                  <div className="text-xl mb-1">🌈</div>
                  <div className="text-xs font-bold">전체 테마</div>
                  <div className="text-[10px] text-stone-500">모든 단어 믹스</div>
                </button>

                {WORD_CATEGORIES.map(cat => (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`p-3 rounded-2xl border text-center transition-all cursor-pointer ${
                      selectedCategory === cat.id
                        ? 'bg-amber-500/20 border-amber-500 text-amber-300 font-bold shadow-md'
                        : 'bg-stone-900/80 border-stone-800 text-stone-400 hover:text-stone-200'
                    }`}
                  >
                    <div className="text-xl mb-1">{cat.emoji}</div>
                    <div className="text-xs font-bold">{cat.nameKo}</div>
                    <div className="text-[10px] text-stone-500">10개 단어</div>
                  </button>
                ))}
              </div>
            </div>

            {/* 4 Interactive Game Modes */}
            <div className="space-y-3">
              <span className="text-xs font-bold text-stone-300 px-1">
                도전할 게임 모드를 선택하세요
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {/* Mode 1: Meaning Quiz */}
                <button
                  onClick={() => handleStartGame('meaning')}
                  className="p-5 rounded-3xl bg-stone-900/90 hover:bg-stone-850 border border-stone-800 hover:border-blue-500/60 transition-all text-left group active:scale-[0.99] cursor-pointer shadow-lg space-y-2 relative overflow-hidden"
                >
                  <div className="flex items-center justify-between">
                    <div className="p-3 rounded-2xl bg-blue-500/20 text-blue-400 border border-blue-500/30">
                      <HelpCircle className="w-6 h-6" />
                    </div>
                    <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-blue-500/20 text-blue-300">
                      10문제 퀴즈
                    </span>
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white group-hover:text-blue-300 transition-colors flex items-center gap-1.5">
                      <span>단어 뜻 맞히기</span>
                      <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </h3>
                    <p className="text-xs text-stone-400 mt-1">
                      영단어와 원어민 발음을 듣고 4가지 뜻 중에서 알맞은 정답을 골라보세요.
                    </p>
                  </div>
                </button>

                {/* Mode 2: Spelling Scramble */}
                <button
                  onClick={() => handleStartGame('spelling')}
                  className="p-5 rounded-3xl bg-stone-900/90 hover:bg-stone-850 border border-stone-800 hover:border-emerald-500/60 transition-all text-left group active:scale-[0.99] cursor-pointer shadow-lg space-y-2 relative overflow-hidden"
                >
                  <div className="flex items-center justify-between">
                    <div className="p-3 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                      <SpellCheck className="w-6 h-6" />
                    </div>
                    <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300">
                      철자 조각 맞추기
                    </span>
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white group-hover:text-emerald-300 transition-colors flex items-center gap-1.5">
                      <span>스펠링 퍼즐 챌린지</span>
                      <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </h3>
                    <p className="text-xs text-stone-400 mt-1">
                      뒤섞인 알파벳 블록을 순서대로 눌러 정확한 영단어 철자를 완성하세요.
                    </p>
                  </div>
                </button>

                {/* Mode 3: Listening Quiz */}
                <button
                  onClick={() => handleStartGame('listening')}
                  className="p-5 rounded-3xl bg-stone-900/90 hover:bg-stone-850 border border-stone-800 hover:border-purple-500/60 transition-all text-left group active:scale-[0.99] cursor-pointer shadow-lg space-y-2 relative overflow-hidden"
                >
                  <div className="flex items-center justify-between">
                    <div className="p-3 rounded-2xl bg-purple-500/20 text-purple-400 border border-purple-500/30">
                      <Headphones className="w-6 h-6" />
                    </div>
                    <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-purple-500/20 text-purple-300">
                      귀로 쏙쏙 듣기
                    </span>
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white group-hover:text-purple-300 transition-colors flex items-center gap-1.5">
                      <span>리스닝 귀트기 퀴즈</span>
                      <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </h3>
                    <p className="text-xs text-stone-400 mt-1">
                      글자 없이 원어민의 음성 발음만 귀 기울여 듣고 뜻을 맞혀보세요.
                    </p>
                  </div>
                </button>

                {/* Mode 4: Speed 60s Challenge */}
                <button
                  onClick={() => handleStartGame('speed')}
                  className="p-5 rounded-3xl bg-stone-900/90 hover:bg-stone-850 border border-stone-800 hover:border-amber-500/60 transition-all text-left group active:scale-[0.99] cursor-pointer shadow-lg space-y-2 relative overflow-hidden"
                >
                  <div className="flex items-center justify-between">
                    <div className="p-3 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
                      <Zap className="w-6 h-6" />
                    </div>
                    <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-300">
                      60초 스피드
                    </span>
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white group-hover:text-amber-300 transition-colors flex items-center gap-1.5">
                      <span>60초 스피드 챌린지</span>
                      <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </h3>
                    <p className="text-xs text-stone-400 mt-1">
                      제한 시간 60초 동안 얼마나 많은 영단어를 맞힐 수 있을까요? 콤보 기록 도전!
                    </p>
                  </div>
                </button>
              </div>
            </div>

            {/* Bottom Dictionary Explorer Quick Button */}
            <div className="pt-2 flex justify-center">
              <button
                onClick={() => setView('dictionary')}
                className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-stone-900 hover:bg-stone-850 border border-stone-800 text-stone-300 hover:text-white text-xs sm:text-sm font-bold transition-all cursor-pointer shadow-sm"
              >
                <BookOpen className="w-4 h-4 text-amber-400" />
                <span>초등 5학년 필수 단어장 전체 보기 (발음 & 예문 사전)</span>
                <ChevronRight className="w-4 h-4 text-stone-500" />
              </button>
            </div>
          </div>
        )}

        {/* VIEW 2: ACTIVE GAME PLAYING */}
        {view === 'game' && sessionWords.length > 0 && (
          <div className="py-2">
            {/* Top Exit button */}
            <div className="mb-4 flex items-center justify-between">
              <button
                onClick={() => setView('home')}
                className="px-3 py-1.5 rounded-xl bg-stone-900 border border-stone-800 text-stone-400 hover:text-white text-xs font-semibold cursor-pointer"
              >
                ← 그만하고 홈으로
              </button>
              <div className="flex items-center gap-2 text-xs">
                <span className="text-stone-400">학생:</span>
                <span className="font-bold text-amber-300">{profile.name}</span>
              </div>
            </div>

            {/* Render selected mode component */}
            {selectedMode === 'meaning' && (
              <WordQuizCard
                word={sessionWords[currentIndex]}
                questionNumber={currentIndex + 1}
                totalQuestions={sessionWords.length}
                streak={sessionStreak}
                onAnswer={handleQuestionAnswer}
              />
            )}

            {selectedMode === 'listening' && (
              <WordQuizCard
                word={sessionWords[currentIndex]}
                questionNumber={currentIndex + 1}
                totalQuestions={sessionWords.length}
                streak={sessionStreak}
                onAnswer={handleQuestionAnswer}
                isListeningMode={true}
              />
            )}

            {selectedMode === 'spelling' && (
              <SpellingScramble
                word={sessionWords[currentIndex]}
                questionNumber={currentIndex + 1}
                totalQuestions={sessionWords.length}
                streak={sessionStreak}
                onAnswer={handleQuestionAnswer}
              />
            )}

            {selectedMode === 'speed' && (
              <WordSpeedChallenge
                words={sessionWords}
                onFinish={(correct, wrong, wrongWords) => {
                  finishGameSession(correct, wrong, wrongWords);
                }}
              />
            )}
          </div>
        )}

        {/* VIEW 3: GAME RESULT & GOOGLE SHEET SYNC */}
        {view === 'result' && lastSummary && (
          <WordGameResultView
            summary={lastSummary}
            profile={profile}
            onPlayAgain={() => handleStartGame(selectedMode)}
            onGoHome={() => setView('home')}
            onOpenSheetModal={() => setIsSheetModalOpen(true)}
            onRecordSynced={handleRecordSynced}
          />
        )}

        {/* VIEW 4: DICTIONARY / VOCABULARY EXPLORER */}
        {view === 'dictionary' && (
          <WordListExplorer onBack={() => setView('home')} />
        )}
      </main>

      {/* Student Profile Modal */}
      <StudentProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        profile={profile}
        onSaveProfile={handleSaveProfile}
        onResetStats={handleResetStats}
      />

      {/* Google Sheet Sync & GAS Code Modal */}
      <GoogleSheetSyncModal
        isOpen={isSheetModalOpen}
        onClose={() => setIsSheetModalOpen(false)}
        profile={profile}
        records={sheetRecords}
        onRefreshRecords={() => setSheetRecords(getSavedRecords())}
        onSaveUrl={(url) => setHasSheetUrl(!!url)}
      />
    </div>
  );
};
