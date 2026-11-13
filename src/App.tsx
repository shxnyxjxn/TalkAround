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
import { ActivitySummaryPage } from './components/ActivitySummaryPage';
import { SettingsModal } from './components/SettingsModal';
import { LearnerHeader } from './components/LearnerHeader';
import { GoogleSheetSyncModal } from './components/GoogleSheetSyncModal';
import { AuthModal } from './components/AuthModal';
import { createClient } from '@/lib/supabase/client';
import type { User as SupabaseUser } from '@supabase/supabase-js';
import { saveActivityToSupabase, updateActivityCounts } from './utils/activityTracker';
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
  nickname: '익명',
  name: '익명',
  avatar: '🗽',
  play_count: 0,
};

export default function App() {
  // Navigation Screens
  const [currentScreen, setCurrentScreen] = useState<'start' | 'game' | 'result' | 'summary'>('start');
  const [activeEpisode, setActiveEpisode] = useState<Episode>(EPISODES[0]);
  const [sessionResult, setSessionResult] = useState<SessionResult | null>(null);

  // Modals & Frame Settings
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isSheetModalOpen, setIsSheetModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authUser, setAuthUser] = useState<SupabaseUser | null>(null);
  const [isPhoneFrame, setIsPhoneFrame] = useState(true);

  // Learner Profile & Google Sheet sync records
  const [learnerProfile, setLearnerProfile] = useState<LearnerProfile>(() => {
    try {
      const saved = localStorage.getItem('talk_around_learner_profile');
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          ...DEFAULT_LEARNER_PROFILE,
          ...parsed,
          nickname: parsed.nickname || parsed.name || '익명',
        };
      }
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

  // Sync Supabase auth session state
  useEffect(() => {
    let subscription: { unsubscribe: () => void } | null = null;
    try {
      const supabase = createClient();
      supabase.auth.getUser().then(({ data }) => {
        setAuthUser(data.user ?? null);
      }).catch(() => {});

      const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
        setAuthUser(session?.user ?? null);
      });
      subscription = listener.subscription;
    } catch {
      // Supabase env vars unavailable
    }

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  // Update Learner Nickname
  const handleUpdateNickname = (newNickname: string) => {
    const cleanNickname = newNickname.trim() || '익명';
    setLearnerProfile(prev => {
      const updated: LearnerProfile = {
        ...prev,
        nickname: cleanNickname,
        name: cleanNickname,
      };
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
   * Finishes simulation game, updates cumulative play count & last appropriateness score,
   * and automatically sends records to the Google Apps Script Web App URL.
   * Required 5 payload keys (A~E): timestamp, nickname, scenario_name, play_count, appropriateness_score
   */
  const handleFinishGame = async (result: SessionResult) => {
    const nextPlayCount = (learnerProfile.play_count || 0) + 1;
    const categoryTag =
      activeEpisode.category === 'campus'
        ? '캠퍼스'
        : activeEpisode.category === 'business'
        ? '비즈니스'
        : '여행';
    const scenarioName = `[${categoryTag}] ${activeEpisode.titleKo} (${activeEpisode.npc.name})`;
    const appropriatenessScore = `${result.finalAffinity}%`;

    const sessionListening = result.listeningCount || 0;
    const sessionShadowing = result.shadowingCount || 0;

    const updatedProfile: LearnerProfile = {
      ...learnerProfile,
      nickname: learnerProfile.nickname || learnerProfile.name || '익명',
      play_count: nextPlayCount,
      total_listening_count: (learnerProfile.total_listening_count || 0) + sessionListening,
      total_shadowing_count: (learnerProfile.total_shadowing_count || 0) + sessionShadowing,
      last_appropriateness_score: result.finalAffinity,
      last_scenario_name: scenarioName,
      lastPlayed: new Date().toISOString(),
    };

    setLearnerProfile(updatedProfile);
    try {
      localStorage.setItem('talk_around_learner_profile', JSON.stringify(updatedProfile));
    } catch (e) {
      console.warn('Failed to persist profile:', e);
    }

    const timestamp = formatCurrentTimestamp();
    const studentName = updatedProfile.nickname || updatedProfile.name || '익명';
    const payload = {
      timestamp,
      name: studentName,
      nickname: studentName,
      scenario_name: scenarioName,
      play_count: nextPlayCount,
      appropriateness_score: appropriatenessScore,
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

    // Save listening & shadowing activity record to Supabase with ISO timestamp
    const recordedAt = result.completedAt || new Date().toISOString();
    const activityRes = await saveActivityToSupabase({
      nickname: studentName,
      scenario_id: activeEpisode.id,
      scenario_name: scenarioName,
      listening_count: sessionListening,
      shadowing_count: sessionShadowing,
      appropriateness_score: result.finalAffinity,
      cefr_level: result.achievedCefr,
      recorded_at: recordedAt,
    });

    // Update session result with sync status
    const finalSessionResult: SessionResult = {
      ...result,
      supabaseLogId: activityRes.log.id,
      supabaseSyncStatus: activityRes.status,
      supabaseSyncMessage: activityRes.message,
      sheetSyncStatus: syncStatus,
      sheetSyncMessage: syncMessage,
    };

    setSessionResult(finalSessionResult);
    setCurrentScreen('result');
  };

  const handleExtraActivityUpdate = (newListening: number, newShadowing: number) => {
    if (!sessionResult) return;
    const deltaListening = Math.max(0, newListening - (sessionResult.listeningCount || 0));
    const deltaShadowing = Math.max(0, newShadowing - (sessionResult.shadowingCount || 0));
    if (deltaListening === 0 && deltaShadowing === 0) return;

    setSessionResult(prev =>
      prev
        ? {
            ...prev,
            listeningCount: newListening,
            shadowingCount: newShadowing,
          }
        : prev
    );

    setLearnerProfile(prev => {
      const updated: LearnerProfile = {
        ...prev,
        total_listening_count: (prev.total_listening_count || 0) + deltaListening,
        total_shadowing_count: (prev.total_shadowing_count || 0) + deltaShadowing,
      };
      try {
        localStorage.setItem('talk_around_learner_profile', JSON.stringify(updated));
      } catch {
        // ignore
      }
      return updated;
    });

    updateActivityCounts(sessionResult.supabaseLogId, newListening, newShadowing);
  };

  const handleRetrySheetSync = async () => {
    if (!sessionResult) return;
    const timestamp = formatCurrentTimestamp();
    const categoryTag =
      activeEpisode.category === 'campus'
        ? '캠퍼스'
        : activeEpisode.category === 'business'
        ? '비즈니스'
        : '여행';
    const scenarioName = `[${categoryTag}] ${activeEpisode.titleKo} (${activeEpisode.npc.name})`;
    const appropriatenessScore = `${sessionResult.finalAffinity}%`;

    const studentName = learnerProfile.nickname || learnerProfile.name || '익명';
    const payload = {
      timestamp,
      name: studentName,
      nickname: studentName,
      scenario_name: scenarioName,
      play_count: learnerProfile.play_count || 1,
      appropriateness_score: appropriatenessScore,
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
            ? 'max-w-md sm:max-w-lg h-[100dvh] sm:h-[900px] sm:max-h-[94vh] sm:my-auto sm:rounded-[40px] sm:border-[8px] sm:border-stone-800/90 sm:shadow-2xl sm:shadow-black/80 bg-stone-900/95 overflow-hidden flex flex-col'
            : 'max-w-2xl min-h-screen py-6 px-4 bg-stone-900/95 flex flex-col justify-center'
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
          authUser={authUser}
          isSummaryActive={currentScreen === 'summary'}
          onUpdateNickname={handleUpdateNickname}
          onOpenSheetModal={() => setIsSheetModalOpen(true)}
          onOpenAuthModal={() => setIsAuthModalOpen(true)}
          onOpenSummary={() => setCurrentScreen('summary')}
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
              onOpenSummary={() => setCurrentScreen('summary')}
              onExtraActivityUpdate={handleExtraActivityUpdate}
            />
          )}

          {currentScreen === 'summary' && (
            <ActivitySummaryPage
              profile={learnerProfile}
              authUser={authUser}
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

      {/* Google Sheet Sync Modal */}
      <GoogleSheetSyncModal
        isOpen={isSheetModalOpen}
        onClose={() => setIsSheetModalOpen(false)}
        profile={learnerProfile}
        records={sheetRecords}
        onRefreshRecords={() => setSheetRecords(getSavedRecords())}
        onSaveUrl={(url) => saveWebAppUrl(url)}
      />

      {/* In-Page Login Modal (never navigates away from main page) */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        user={authUser}
        onAuthSuccess={(user) => {
          setAuthUser(user);
          if (user) {
            const metaNick = user.user_metadata?.nickname;
            if (metaNick && (learnerProfile.nickname === '익명' || !learnerProfile.nickname)) {
              handleUpdateNickname(metaNick);
            }
          }
        }}
      />
    </main>
  );
}
