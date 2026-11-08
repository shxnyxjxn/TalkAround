/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Episode, SessionResult, UserSettings, LearnerProfile, GoogleSheetRecord } from './types';
import { EPISODES } from './data/episodes';
import { StartScreen } from './components/StartScreen';
import { GameScreen } from './components/GameScreen';
import { ResultScreen } from './components/ResultScreen';
import { SettingsModal } from './components/SettingsModal';
import { LearnerHeader } from './components/LearnerHeader';
import { GoogleSheetSyncModal } from './components/GoogleSheetSyncModal';
import {
  getSavedWebAppUrl,
  saveWebAppUrl,
  formatCurrentTimestamp,
  sendRecordToGoogleSheet,
  saveRecordLocally,
  getSavedRecords,
} from './utils/googleSheetSync';
import { Smartphone, Monitor } from 'lucide-react';

const DEFAULT_SETTINGS: UserSettings = {
  playbackSpeed: 1.0,
  autoPlayAudio: true,
  showKoreanHints: true,
  targetCefr: 'B1',
};

const DEFAULT_LEARNER_PROFILE: LearnerProfile = {
  name: '익명 학습자',
  avatar: '🗽',
  play_count: 0,
  correct_count: 0,
  wrong_count: 0,
};

export default function App() {
  // Navigation Screens
  const [currentScreen, setCurrentScreen] = useState<'start' | 'game' | 'result'>('start');
  const [activeEpisode, setActiveEpisode] = useState<Episode>(EPISODES[0]);
  const [sessionResult, setSessionResult] = useState<SessionResult | null>(null);

  // Modals & Frame Settings
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isSheetModalOpen, setIsSheetModalOpen] = useState(false);
  const [isPhoneFrame, setIsPhoneFrame] = useState(true);

  // Learner Profile & Google Sheet sync records
  const [learnerProfile, setLearnerProfile] = useState<LearnerProfile>(() => {
    try {
      const saved = localStorage.getItem('talk_around_learner_profile');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn('Failed to load learner profile:', e);
    }
    return DEFAULT_LEARNER_PROFILE;
  });

  const [sheetRecords, setSheetRecords] = useState<GoogleSheetRecord[]>(() => getSavedRecords());

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

  // Update Learner Name
  const handleUpdateName = (newName: string) => {
    const cleanName = newName.trim() || '익명 학습자';
    setLearnerProfile(prev => {
      const updated = { ...prev, name: cleanName };
      try {
        localStorage.setItem('talk_around_learner_profile', JSON.stringify(updated));
      } catch (e) {
        console.warn('Failed to save profile:', e);
      }
      return updated;
    });
  };

  // Screen handlers for conversation sim
  const handleStartGame = (episode: Episode) => {
    setActiveEpisode(episode);
    setCurrentScreen('game');
  };

  /**
   * Finishes simulation game, updates cumulative play/correct/wrong counts,
   * and automatically sends records to the Google Apps Script Web App URL.
   * Required payload keys: timestamp, name, play_count, correct_count, wrong_count
   */
  const handleFinishGame = async (result: SessionResult) => {
    const sessionCorrect = result.bestChoicesCount;
    const sessionWrong = Math.max(0, result.totalTurns - result.bestChoicesCount);

    const nextPlayCount = (learnerProfile.play_count || 0) + 1;
    const nextCorrectCount = (learnerProfile.correct_count || 0) + sessionCorrect;
    const nextWrongCount = (learnerProfile.wrong_count || 0) + sessionWrong;

    const updatedProfile: LearnerProfile = {
      ...learnerProfile,
      play_count: nextPlayCount,
      correct_count: nextCorrectCount,
      wrong_count: nextWrongCount,
      lastPlayed: new Date().toISOString(),
    };

    setLearnerProfile(updatedProfile);
    try {
      localStorage.setItem('talk_around_learner_profile', JSON.stringify(updatedProfile));
    } catch (e) {
      console.warn('Failed to persist profile:', e);
    }

    const timestamp = formatCurrentTimestamp();
    const payload = {
      timestamp,
      name: updatedProfile.name || '익명 학습자',
      play_count: nextPlayCount,
      correct_count: nextCorrectCount,
      wrong_count: nextWrongCount,
    };

    // Auto transmit to Google Sheets
    let syncStatus: 'synced' | 'failed' | 'not_configured' = 'synced';
    let syncMessage = '구글 스프레드시트에 성공적으로 자동 저장되었습니다! ✅';

    const webAppUrl = getSavedWebAppUrl();
    if (!webAppUrl) {
      syncStatus = 'not_configured';
      syncMessage = '구글 시트 연동 URL이 설정되지 않았습니다.';
    } else {
      try {
        const syncRes = await sendRecordToGoogleSheet(payload, webAppUrl);
        if (syncRes.success) {
          syncStatus = 'synced';
          syncMessage = syncRes.message;
        } else {
          syncStatus = 'failed';
          syncMessage = syncRes.message;
        }
      } catch (err: any) {
        syncStatus = 'failed';
        syncMessage = err?.message || '구글 시트 전송 중 오류가 발생했습니다.';
      }
    }

    // Save record to local list
    const sheetRecord: GoogleSheetRecord = {
      id: 'rec_' + Date.now(),
      ...payload,
      status: syncStatus === 'synced' ? 'synced' : 'failed',
      errorMessage: syncStatus === 'failed' ? syncMessage : undefined,
    };
    saveRecordLocally(sheetRecord);
    setSheetRecords(getSavedRecords());

    // Update session result with sync status
    const finalSessionResult: SessionResult = {
      ...result,
      sheetSyncStatus: syncStatus,
      sheetSyncMessage: syncMessage,
    };

    setSessionResult(finalSessionResult);
    setCurrentScreen('result');
  };

  const handleRetrySheetSync = async () => {
    if (!sessionResult) return;
    const timestamp = formatCurrentTimestamp();
    const payload = {
      timestamp,
      name: learnerProfile.name || '익명 학습자',
      play_count: learnerProfile.play_count,
      correct_count: learnerProfile.correct_count,
      wrong_count: learnerProfile.wrong_count,
    };

    const syncRes = await sendRecordToGoogleSheet(payload);
    const updated: SessionResult = {
      ...sessionResult,
      sheetSyncStatus: syncRes.success ? 'synced' : 'failed',
      sheetSyncMessage: syncRes.message,
    };
    setSessionResult(updated);

    if (syncRes.success) {
      const sheetRecord: GoogleSheetRecord = {
        id: 'rec_' + Date.now(),
        ...payload,
        status: 'synced',
      };
      saveRecordLocally(sheetRecord);
      setSheetRecords(getSavedRecords());
    }
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

  return (
    <main className="min-h-screen w-full bg-stone-950 text-stone-100 flex flex-col items-center justify-center relative font-sans selection:bg-amber-500 selection:text-stone-900">
      {/* Background Ambience / Subtle NYC Nightglow */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-amber-600/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl" />
      </div>

      {/* Desktop View Frame Toggle */}
      <div className="fixed top-3 right-4 z-40 hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-stone-900/90 border border-stone-800 text-xs text-stone-400 backdrop-blur-md shadow-sm">
        <span>뷰 모드:</span>
        <button
          onClick={() => setIsPhoneFrame(true)}
          className={`flex items-center gap-1 px-2 py-0.5 rounded-md transition-colors cursor-pointer ${
            isPhoneFrame ? 'bg-amber-500 text-stone-950 font-bold' : 'hover:text-white'
          }`}
          title="모바일 프레임으로 보기"
        >
          <Smartphone className="w-3.5 h-3.5" />
          모바일
        </button>
        <button
          onClick={() => setIsPhoneFrame(false)}
          className={`flex items-center gap-1 px-2 py-0.5 rounded-md transition-colors cursor-pointer ${
            !isPhoneFrame ? 'bg-amber-500 text-stone-950 font-bold' : 'hover:text-white'
          }`}
          title="전체 화면으로 보기"
        >
          <Monitor className="w-3.5 h-3.5" />
          와이드
        </button>
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

        {/* Global Learner Profile Header & Google Sheet Status Bar */}
        <LearnerHeader
          profile={learnerProfile}
          hasSheetUrl={!!getSavedWebAppUrl()}
          onUpdateName={handleUpdateName}
          onOpenSheetModal={() => setIsSheetModalOpen(true)}
        />

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
              onOpenSheetModal={() => setIsSheetModalOpen(true)}
              onRetrySheetSync={handleRetrySheetSync}
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

      {/* Google Sheet Sync Modal */}
      <GoogleSheetSyncModal
        isOpen={isSheetModalOpen}
        onClose={() => setIsSheetModalOpen(false)}
        profile={learnerProfile}
        records={sheetRecords}
        onRefreshRecords={() => setSheetRecords(getSavedRecords())}
        onSaveUrl={(url) => saveWebAppUrl(url)}
      />
    </main>
  );
}
