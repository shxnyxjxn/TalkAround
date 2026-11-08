import React, { useState } from 'react';
import { Play, Sliders, Sparkles, MapPin, Clock, Award, Compass, Coffee, Briefcase, Plane, ChevronRight } from 'lucide-react';
import { Episode, EpisodeCategory, UserSettings } from '../types';
import { EPISODES } from '../data/episodes';
import { NpcAvatar } from './NpcAvatar';

interface StartScreenProps {
  onStartGame: (episode: Episode) => void;
  onOpenSettings: () => void;
  settings: UserSettings;
}

export const StartScreen: React.FC<StartScreenProps> = ({
  onStartGame,
  onOpenSettings,
  settings,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<EpisodeCategory | 'all'>('all');
  const [selectedEpisodeId, setSelectedEpisodeId] = useState<string>(EPISODES[0].id);

  const filteredEpisodes = selectedCategory === 'all'
    ? EPISODES
    : EPISODES.filter(ep => ep.category === selectedCategory);

  const currentEpisode = EPISODES.find(e => e.id === selectedEpisodeId) || EPISODES[0];

  return (
    <div className="flex flex-col min-h-full max-w-md mx-auto px-4 py-4 sm:py-5 select-none justify-between space-y-4">
      {/* Top Bar / App Logo */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 rounded-full text-[11px] font-extrabold uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/30">
              NYC Simulator
            </span>
            <span className="text-[11px] text-stone-400 font-medium flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-amber-400" />
              하루 20분 실전 훈련
            </span>
          </div>

          <button
            onClick={onOpenSettings}
            className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold text-stone-300 bg-stone-800/80 hover:bg-stone-800 border border-stone-700/60 transition-colors"
          >
            <Sliders className="w-3.5 h-3.5 text-amber-400" />
            <span>설정 / 레벨</span>
          </button>
        </div>

        {/* Brand Headline */}
        <div className="space-y-1 text-center pt-2">
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white flex items-center justify-center gap-2">
            <span>토크어라운드</span>
            <span className="text-amber-400 text-2xl sm:text-3xl font-mono">Talk Around</span>
          </h1>
          <p className="text-xs sm:text-sm text-stone-400 max-w-xs mx-auto leading-relaxed">
            해외 출국·유학을 앞둔 당신을 위한<br />
            <strong className="text-amber-300 font-semibold">진짜 뉴요커 원어민 뉘앙스</strong> 실전 시뮬레이션 게임
          </p>
        </div>

        {/* Hero Character Card: Highlighted Scenario */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-b from-stone-800/90 to-stone-900 border border-amber-500/30 p-5 shadow-xl shadow-amber-500/5 mt-4">
          <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />
          
          <div className="flex items-center gap-4">
            <NpcAvatar
              seed={currentEpisode.npc.avatarSeed}
              name={currentEpisode.npc.name}
              mood="happy"
              accentColor={currentEpisode.npc.accentColor}
              size="lg"
            />
            <div className="flex-1 min-w-0 space-y-1">
              <div className="flex items-center gap-1.5 text-xs text-amber-400 font-semibold">
                <MapPin className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">{currentEpisode.locationTag}</span>
              </div>
              <h2 className="text-base sm:text-lg font-bold text-white leading-snug truncate">
                {currentEpisode.npc.name}
              </h2>
              <p className="text-xs text-stone-300 line-clamp-1">{currentEpisode.npc.role}</p>
              <div className="flex items-center gap-2 pt-1">
                <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-md bg-stone-950 text-amber-400 border border-stone-800">
                  <Award className="w-3 h-3" />
                  목표 {currentEpisode.targetCefr}
                </span>
                <span className="inline-flex items-center gap-1 text-[11px] text-stone-400">
                  <Clock className="w-3 h-3" />
                  약 {currentEpisode.estimatedMinutes}분
                </span>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3.5 border-t border-stone-800/80">
            <p className="text-xs text-stone-300 font-medium leading-relaxed">
              &ldquo;{currentEpisode.subtitle}&rdquo;
            </p>
          </div>
        </div>

        {/* Scenario Selection Tabs */}
        <div className="space-y-2.5 pt-2">
          <div className="flex items-center justify-between text-xs font-semibold px-1">
            <span className="text-stone-300">원하는 실전 상황 선택</span>
            <span className="text-[11px] text-amber-400 font-normal">총 {EPISODES.length}개 시나리오</span>
          </div>

          {/* Category Chips */}
          <div className="grid grid-cols-4 gap-1.5 p-1 bg-stone-950 rounded-2xl border border-stone-800/80">
            {[
              { id: 'all', label: '전체' },
              { id: 'campus', label: '캠퍼스' },
              { id: 'business', label: '비즈니스' },
              { id: 'travel', label: '입국·여행' },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setSelectedCategory(tab.id as any)}
                className={`py-1.5 text-xs font-bold rounded-xl transition-all ${
                  selectedCategory === tab.id
                    ? 'bg-amber-500 text-stone-950 shadow-sm'
                    : 'text-stone-400 hover:text-stone-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Episode List */}
          <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
            {filteredEpisodes.map(ep => {
              const isSelected = ep.id === currentEpisode.id;
              return (
                <button
                  key={ep.id}
                  onClick={() => setSelectedEpisodeId(ep.id)}
                  className={`w-full text-left p-3 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                    isSelected
                      ? 'bg-stone-800/90 border-amber-500 shadow-md ring-1 ring-amber-500/50'
                      : 'bg-stone-900/60 border-stone-800 hover:bg-stone-800/50 hover:border-stone-700'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-stone-950 border border-stone-800 flex items-center justify-center shrink-0">
                      {ep.category === 'campus' ? (
                        <Coffee className="w-4.5 h-4.5 text-amber-400" />
                      ) : ep.category === 'business' ? (
                        <Briefcase className="w-4.5 h-4.5 text-emerald-400" />
                      ) : (
                        <Plane className="w-4.5 h-4.5 text-sky-400" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-stone-100 truncate">
                        {ep.titleKo}
                      </div>
                      <div className="text-[11px] text-stone-400 truncate">
                        NPC {ep.npc.name} · {ep.locationTag}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-stone-950 text-amber-400 border border-stone-800">
                      {ep.targetCefr}
                    </span>
                    <ChevronRight className={`w-4 h-4 transition-transform ${isSelected ? 'text-amber-400 translate-x-0.5' : 'text-stone-600'}`} />
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Bottom Action Area (PRD Specified: Large rectangular [게임 시작] button at bottom center) */}
      <div className="pt-6 pb-2 space-y-3">
        <button
          onClick={() => onStartGame(currentEpisode)}
          className="w-full py-4 px-6 rounded-2xl bg-amber-500 hover:bg-amber-400 active:scale-[0.98] text-stone-950 font-black text-lg shadow-lg shadow-amber-500/25 flex items-center justify-center gap-2 transition-all cursor-pointer"
        >
          <Play className="w-5 h-5 fill-stone-950" />
          <span>게임 시작 ({currentEpisode.npc.name}와 대화)</span>
        </button>

        <div className="flex items-center justify-between px-2 text-[11px] text-stone-400">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block animate-pulse" />
            원어민 음성 오디오 지원
          </span>
          <button
            onClick={onOpenSettings}
            className="text-stone-400 hover:text-amber-300 transition-colors underline underline-offset-2"
          >
            설정 및 CEFR 테스트 &rarr;
          </button>
        </div>
      </div>
    </div>
  );
};
