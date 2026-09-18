import React, { useState } from 'react';
import { X, Sliders, Volume2, Globe, Sparkles, CheckCircle2, Award } from 'lucide-react';
import { UserSettings, CefrLevel } from '../types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: UserSettings;
  onUpdateSettings: (newSettings: UserSettings) => void;
}

interface DiagnosticQuestion {
  question: string;
  context: string;
  options: {
    text: string;
    level: CefrLevel;
    feedback: string;
  }[];
}

const DIAGNOSTIC_QUESTIONS: DiagnosticQuestion[] = [
  {
    context: '뉴욕 카페에서 아이스 라떼를 테이크아웃으로 주문할 때:',
    question: '어떤 표현이 가장 입에 먼저 맴도나요?',
    options: [
      {
        text: "I want iced latte, take out please.",
        level: 'A2',
        feedback: '직관적이지만 한국어 번역투의 A2 기초 표현입니다.',
      },
      {
        text: "Can I get an iced latte to go, please?",
        level: 'B1',
        feedback: '미국 전역에서 통하는 깔끔하고 자연스러운 B1 표준 표현입니다.',
      },
      {
        text: "Could I grab a large iced latte to go with oat milk?",
        level: 'B2',
        feedback: 'grab 동사와 디테일 옵션을 물 흐르듯 조합하는 B2 원어민 감각입니다.',
      },
    ],
  },
  {
    context: '공항에서 상대방이 너무 빠르게 말해서 못 알아들었을 때:',
    question: '어떻게 다시 말해달라고 요청하시겠어요?',
    options: [
      {
        text: "What? Again please.",
        level: 'A2',
        feedback: 'A2 단답형으로, 자칫 공격적이거나 당황한 인상을 줄 수 있습니다.',
      },
      {
        text: "Could you repeat that more slowly, please?",
        level: 'B1',
        feedback: '정중하고 교과서적인 B1 에티켓 표현입니다.',
      },
      {
        text: "Sorry, I didn't quite catch that—could you say that one more time?",
        level: 'B2',
        feedback: "'didn't quite catch that'으로 완곡하게 되묻는 세련된 B2 표현입니다.",
      },
    ],
  },
  {
    context: '현지인 동료가 금요일 퇴근길에 "Have a great weekend!"라고 인사할 때:',
    question: '가장 자연스러운 대답은?',
    options: [
      {
        text: "Yes, thank you. You also have good weekend.",
        level: 'A2',
        feedback: '의미는 통하지만 문장이 다소 경직된 A2 스타일입니다.',
      },
      {
        text: "Thanks, you too! Have a good one.",
        level: 'B1',
        feedback: '스몰토크의 정석인 B1 자연스러운 맞장구입니다.',
      },
      {
        text: "Thanks Chloe, you too! Catch you on Monday.",
        level: 'B2',
        feedback: '동료의 이름을 부르며 월요일 약속을 짚어주는 쿨한 B2 뉴요커 바이브입니다.',
      },
    ],
  },
];

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
}) => {
  const [activeTab, setActiveTab] = useState<'settings' | 'diagnostic'>('settings');
  
  // Diagnostic state
  const [diagStep, setDiagStep] = useState(0);
  const [diagAnswers, setDiagAnswers] = useState<CefrLevel[]>([]);
  const [diagResult, setDiagResult] = useState<CefrLevel | null>(null);

  if (!isOpen) return null;

  const handleDiagnosticSelect = (level: CefrLevel) => {
    const updated = [...diagAnswers, level];
    setDiagAnswers(updated);

    if (diagStep + 1 < DIAGNOSTIC_QUESTIONS.length) {
      setDiagStep(diagStep + 1);
    } else {
      // Calculate recommended level
      const countB2 = updated.filter(l => l === 'B2').length;
      const countB1 = updated.filter(l => l === 'B1').length;
      let finalLevel: CefrLevel = 'A2';
      if (countB2 >= 2) finalLevel = 'B2';
      else if (countB1 + countB2 >= 2) finalLevel = 'B1';
      else finalLevel = 'A2';

      setDiagResult(finalLevel);
      onUpdateSettings({ ...settings, targetCefr: finalLevel });
    }
  };

  const resetDiagnostic = () => {
    setDiagStep(0);
    setDiagAnswers([]);
    setDiagResult(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-md bg-stone-900 border border-stone-800 rounded-3xl p-6 shadow-2xl text-stone-100 flex flex-col max-h-[90vh] overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-stone-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-lg text-stone-100">환경 설정 & 실력 진단</h2>
              <p className="text-xs text-stone-400">나에게 꼭 맞는 실전 연습 세팅</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-stone-400 hover:text-white hover:bg-stone-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 my-4 p-1 bg-stone-950/80 rounded-2xl border border-stone-800/80">
          <button
            onClick={() => setActiveTab('settings')}
            className={`flex-1 py-2 text-xs font-semibold rounded-xl transition-all ${
              activeTab === 'settings'
                ? 'bg-amber-500 text-stone-950 shadow-sm'
                : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            기본 설정
          </button>
          <button
            onClick={() => setActiveTab('diagnostic')}
            className={`flex-1 py-2 text-xs font-semibold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'diagnostic'
                ? 'bg-amber-500 text-stone-950 shadow-sm'
                : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            30초 CEFR 간이 진단
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto space-y-5 pr-1 text-sm">
          {activeTab === 'settings' ? (
            <>
              {/* Voice Speed */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-stone-300 flex items-center gap-2">
                  <Volume2 className="w-4 h-4 text-amber-400" />
                  오디오 말하기 속도
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { val: 0.85, label: '0.85x (초보용)', desc: '또박또박' },
                    { val: 1.0, label: '1.0x (표준)', desc: '자연스러움' },
                    { val: 1.2, label: '1.2x (현지인)', desc: '실전 뉴요커' },
                  ].map(item => (
                    <button
                      key={item.val}
                      onClick={() => onUpdateSettings({ ...settings, playbackSpeed: item.val as 0.85 | 1.0 | 1.2 })}
                      className={`p-2.5 rounded-2xl border text-center transition-all ${
                        settings.playbackSpeed === item.val
                          ? 'border-amber-500 bg-amber-500/10 text-amber-300 font-bold ring-1 ring-amber-500'
                          : 'border-stone-800 bg-stone-950/40 text-stone-400 hover:border-stone-700'
                      }`}
                    >
                      <div className="text-xs font-bold">{item.label}</div>
                      <div className="text-[10px] text-stone-400 mt-0.5">{item.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Toggles */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between p-3.5 rounded-2xl bg-stone-950/60 border border-stone-800">
                  <div>
                    <div className="font-semibold text-stone-200 text-xs sm:text-sm">대사 시작 시 오디오 자동 재생</div>
                    <div className="text-stone-400 text-xs mt-0.5">NPC가 말할 때 즉시 음성을 재생합니다</div>
                  </div>
                  <button
                    onClick={() => onUpdateSettings({ ...settings, autoPlayAudio: !settings.autoPlayAudio })}
                    className={`w-12 h-6 rounded-full transition-colors relative p-0.5 ${
                      settings.autoPlayAudio ? 'bg-amber-500' : 'bg-stone-700'
                    }`}
                  >
                    <div
                      className={`w-5 h-5 rounded-full bg-white transition-transform ${
                        settings.autoPlayAudio ? 'translate-x-6' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                <div className="flex items-center justify-between p-3.5 rounded-2xl bg-stone-950/60 border border-stone-800">
                  <div>
                    <div className="font-semibold text-stone-200 text-xs sm:text-sm">실전 몰입 모드 (English Only)</div>
                    <div className="text-stone-400 text-xs mt-0.5">실전 회화 훈련을 위해 대화 및 선택지는 100% 영어로만 진행됩니다</div>
                  </div>
                  <span className="px-2.5 py-1 rounded-xl bg-amber-500/20 text-amber-300 font-mono text-[11px] font-bold border border-amber-500/30">
                    ON
                  </span>
                </div>
              </div>

              {/* CEFR Level Target */}
              <div className="space-y-2 pt-2">
                <label className="text-xs font-semibold text-stone-300 flex items-center gap-2">
                  <Globe className="w-4 h-4 text-amber-400" />
                  현재 목표 영어 레벨 (CEFR)
                </label>
                <div className="grid grid-cols-4 gap-1.5">
                  {(['A2', 'B1', 'B2', 'C1'] as CefrLevel[]).map(lvl => (
                    <button
                      key={lvl}
                      onClick={() => onUpdateSettings({ ...settings, targetCefr: lvl })}
                      className={`p-2 rounded-2xl border text-center transition-all ${
                        settings.targetCefr === lvl
                          ? 'border-amber-500 bg-amber-500/10 text-amber-300 font-bold ring-1 ring-amber-500'
                          : 'border-stone-800 bg-stone-950/40 text-stone-400 hover:border-stone-700'
                      }`}
                    >
                      <div className="text-xs font-bold">{lvl}</div>
                      <div className="text-[9px] text-stone-400 mt-0.5">
                        {lvl === 'A2' ? '초급 생존' : lvl === 'B1' ? '일상 소통' : lvl === 'B2' ? '실전 유창' : '고급 비즈니스'}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </>
          ) : (
            /* CEFR 30초 진단 */
            <div className="space-y-4">
              {!diagResult ? (
                <>
                  <div className="flex items-center justify-between text-xs text-stone-400">
                    <span>질문 {diagStep + 1} / {DIAGNOSTIC_QUESTIONS.length}</span>
                    <span className="text-amber-400 font-semibold">간이 실력 진단</span>
                  </div>

                  <div className="p-4 rounded-2xl bg-stone-950 border border-stone-800 space-y-2">
                    <p className="text-xs text-amber-400 font-medium">{DIAGNOSTIC_QUESTIONS[diagStep].context}</p>
                    <p className="text-sm font-bold text-stone-100">{DIAGNOSTIC_QUESTIONS[diagStep].question}</p>
                  </div>

                  <div className="space-y-2.5">
                    {DIAGNOSTIC_QUESTIONS[diagStep].options.map((opt, i) => (
                      <button
                        key={i}
                        onClick={() => handleDiagnosticSelect(opt.level)}
                        className="w-full text-left p-3.5 rounded-2xl bg-stone-800/60 hover:bg-stone-800 border border-stone-700/60 hover:border-amber-500/50 transition-all group"
                      >
                        <div className="text-xs font-semibold text-stone-200 group-hover:text-amber-300">
                          {opt.text}
                        </div>
                      </button>
                    ))}
                  </div>
                </>
              ) : (
                <div className="py-4 text-center space-y-4">
                  <div className="w-16 h-16 mx-auto rounded-3xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
                    <Award className="w-8 h-8" />
                  </div>
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-amber-400">진단 결과</span>
                    <h3 className="text-2xl font-black text-white mt-1">
                      추천 레벨: <span className="text-amber-400">{diagResult} Level</span>
                    </h3>
                    <p className="text-xs text-stone-400 mt-2 max-w-xs mx-auto">
                      {diagResult === 'B2'
                        ? '원어민 뉘앙스 구사력이 뛰어납니다! B2 에피소드에서 현지 특유의 관용 표현을 완벽 마스터해 보세요.'
                        : diagResult === 'B1'
                        ? '기본적인 의사소통이 매우 원활합니다! 교과서 표현에서 원어민 감각으로 업그레이드할 최적의 타이밍입니다.'
                        : '기본 단어와 문장 구조를 이해하고 계십니다! 토크어라운드와 함께 직역투를 탈피하고 현지 표현을 익혀보세요.'}
                    </p>
                  </div>

                  <div className="pt-2 flex gap-2">
                    <button
                      onClick={resetDiagnostic}
                      className="flex-1 py-3 rounded-2xl bg-stone-800 text-xs font-semibold text-stone-300 hover:bg-stone-700 transition-colors"
                    >
                      다시 테스트
                    </button>
                    <button
                      onClick={() => setActiveTab('settings')}
                      className="flex-1 py-3 rounded-2xl bg-amber-500 text-xs font-bold text-stone-950 hover:bg-amber-400 transition-colors"
                    >
                      설정 반영 완료
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="pt-4 mt-auto border-t border-stone-800 flex justify-end">
          <button
            onClick={onClose}
            className="w-full py-3 rounded-2xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-sm shadow-md transition-colors"
          >
            저장하고 닫기
          </button>
        </div>
      </div>
    </div>
  );
};
