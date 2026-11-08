/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Episode, SessionResult, UserSettings } from './types';
import { EPISODES } from './data/episodes';
import { StartScreen } from './components/StartScreen';
import { GameScreen } from './components/GameScreen';
import { ResultScreen } from './components/ResultScreen';
import { SettingsModal } from './components/SettingsModal';
import { Grade5WordGameHub } from './components/Grade5WordGameHub';
import { Smartphone, Monitor, BookOpen, MessageSquareText } from 'lucide-react';

const DEFAULT_SETTINGS: UserSettings = {
  playbackSpeed: 1.0,
  autoPlayAudio: true,
  showKoreanHints: true,
  targetCefr: 'B1',
};

export default function App() {
  // App Mode: Grade 5 Word Game (Default as requested) vs Conversation Simulation
  const [appMode, setAppMode] = useState<'grade5_word_game' | 'conversation_sim'>('grade5_word_game');

  // Conversation sim states
  const [currentScreen, setCurrentScreen] = useState<'start' | 'game' | 'result'>('start');
  const [activeEpisode, setActiveEpisode] = useState<Episode>(EPISODES[0]);
  const [sessionResult, setSessionResult] = useState<SessionResult | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isPhoneFrame, setIsPhoneFrame] = useState(true);

  const [settings, setSettings] = useState<UserSettings>(() => {
    try {
      const saved = localStorage.getItem('talk_around_settings');
      return saved ? JSON.parse(saved) : DEFAULT_SETTINGS;
    } catch {
      return DEFAULT_SETTINGS;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('talk_around_settings', JSON.stringify(settings));
    } catch (e) {
      console.warn('Failed to save settings:', e);
    }
  }, [settings]);

  // Screen handlers for conversation sim
  const handleStartGame = (episode: Episode) => {
    setActiveEpisode(episode);
    setCurrentScreen('game');
  };

  const handleFinishGame = (result: SessionResult) => {
    setSessionResult(result);
    setCurrentScreen('result');
  };

  const handleRestartGame = () => {
    setCurrentScreen('game');
  };

  const handleNextEpisode = (nextEp: Episode) => {
    setActiveEpisode(nextEp);
    setCurrentScreen('game');
  };

  const handleBackToHome = () => {
    setCurrentScreen('start');
  };

  // Render Grade 5 Elementary English Word Game by default
  if (appMode === 'grade5_word_game') {
    return (
      <div className="relative min-h-screen bg-stone-950">
        <Grade5WordGameHub />

        {/* Floating Quick Switcher to Conversation Sim */}
        <div className="fixed bottom-3 right-3 z-40">
          <button
            onClick={() => setAppMode('conversation_sim')}
            className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-stone-900/90 hover:bg-stone-800 border border-stone-800 text-stone-400 hover:text-stone-200 text-xs backdrop-blur-md transition-all shadow-lg cursor-pointer"
            title="뉴욕 회화 시뮬레이션 모드로 전환"
          >
            <MessageSquareText className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">실전 회화 시뮬레이션 전환</span>
          </button>
        </div>
      </div>
    );
  }

  // Conversation Simulation Mode
  return (
    <main className="min-h-screen w-full bg-stone-950 text-stone-100 flex flex-col items-center justify-center relative font-sans selection:bg-amber-500 selection:text-stone-900">
      {/* Background Ambience / Subtle NYC Nightglow */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-amber-600/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl" />
      </div>

      {/* Mode Switcher & Desktop view frame switcher toggle */}
      <div className="fixed top-3 right-4 z-40 flex items-center gap-2">
        <button
          onClick={() => setAppMode('grade5_word_game')}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs shadow-md transition-all cursor-pointer"
        >
          <BookOpen className="w-3.5 h-3.5" />
          <span>초등 5학년 영단어 퀴즈</span>
        </button>

        <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-stone-900/90 border border-stone-800 text-xs text-stone-400 backdrop-blur-md shadow-sm">
          <span>뷰:</span>
          <button
            onClick={() => setIsPhoneFrame(true)}
            className={`flex items-center gap-1 px-2 py-0.5 rounded-md transition-colors ${
              isPhoneFrame ? 'bg-amber-500 text-stone-950 font-bold' : 'hover:text-white'
            }`}
            title="모바일 프레임으로 보기"
          >
            <Smartphone className="w-3.5 h-3.5" />
            모바일
          </button>
          <button
            onClick={() => setIsPhoneFrame(false)}
            className={`flex items-center gap-1 px-2 py-0.5 rounded-md transition-colors ${
              !isPhoneFrame ? 'bg-amber-500 text-stone-950 font-bold' : 'hover:text-white'
            }`}
            title="전체 화면으로 보기"
          >
            <Monitor className="w-3.5 h-3.5" />
            와이드
          </button>
        </div>
      </div>

      {/* Main Container: Mobile Frame on Desktop or Responsive Fluid Container */}
      <div
        className={`w-full relative z-10 transition-all duration-300 ${
          isPhoneFrame
            ? 'max-w-md h-[100dvh] sm:h-[880px] sm:max-h-[92vh] sm:my-auto sm:rounded-[36px] sm:border-[8px] sm:border-stone-800/90 sm:shadow-2xl sm:shadow-black/80 bg-stone-900/95 overflow-hidden flex flex-col'
            : 'max-w-xl min-h-screen py-6 px-4 bg-stone-900/95 flex flex-col justify-center'
        }`}
      >
        {/* Top Phone Speaker notch on desktop frame */}
        {isPhoneFrame && (
          <div className="hidden sm:flex justify-center pt-2.5 pb-1 bg-stone-900/90 shrink-0">
            <div className="w-20 h-1 rounded-full bg-stone-800" />
          </div>
        )}

        {/* View Router */}
        <div className="flex-1 overflow-y-auto flex flex-col">
          {currentScreen === 'start' && (
            <StartScreen
              onStartGame={handleStartGame}
              onOpenSettings={() => setIsSettingsOpen(true)}
              settings={settings}
            />
          )}

          {currentScreen === 'game' && (
            <GameScreen
              episode={activeEpisode}
              settings={settings}
              onFinishGame={handleFinishGame}
              onExitToMenu={handleBackToHome}
              onOpenSettings={() => setIsSettingsOpen(true)}
            />
          )}

          {currentScreen === 'result' && sessionResult && (
            <ResultScreen
              result={sessionResult}
              onRestart={handleRestartGame}
              onNextEpisode={handleNextEpisode}
              onBackToHome={handleBackToHome}
            />
          )}
        </div>

        {/* Bottom Phone Bar line indicator on desktop frame */}
        {isPhoneFrame && (
          <div className="hidden sm:flex justify-center pb-2 pt-1 bg-stone-900/90 shrink-0">
            <div className="w-32 h-1 rounded-full bg-stone-800" />
          </div>
        )}
      </div>

      {/* Settings & CEFR Diagnostic Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onUpdateSettings={setSettings}
      />
    </main>
  );
}
