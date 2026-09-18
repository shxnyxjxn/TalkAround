import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Send, Volume2, Sparkles, AlertCircle, RefreshCw, Check, Lightbulb } from 'lucide-react';
import { Turn, Episode, StrategicHint } from '../types';
import { speechRecognitionService } from '../utils/speechRecognition';
import { speechService } from '../utils/speech';

interface SpeechInputPanelProps {
  currentTurn: Turn;
  episode: Episode;
  isEvaluating: boolean;
  playbackSpeed: number;
  onSubmitSpeech: (text: string) => void;
  onSwitchToChoiceMode: () => void;
}

export const SpeechInputPanel: React.FC<SpeechInputPanelProps> = ({
  currentTurn,
  episode,
  isEvaluating,
  playbackSpeed,
  onSubmitSpeech,
  onSwitchToChoiceMode,
}) => {
  const [spokenText, setSpokenText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copiedHint, setCopiedHint] = useState<string | null>(null);
  const [isListeningModel, setIsListeningModel] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const bestChoice = currentTurn.choices.find(c => c.isBest) || currentTurn.choices[0];
  const isSpeechSupported = speechRecognitionService.isSupported();

  // Reset speech text when turn changes
  useEffect(() => {
    setSpokenText('');
    setIsRecording(false);
    setErrorMessage(null);
    speechRecognitionService.stop();
  }, [currentTurn.turnNumber]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      speechRecognitionService.stop();
    };
  }, []);

  const toggleRecording = () => {
    if (isRecording) {
      speechRecognitionService.stop();
      setIsRecording(false);
    } else {
      setErrorMessage(null);
      const started = speechRecognitionService.start({
        onInterim: (interimText) => {
          setSpokenText(interimText);
        },
        onResult: (finalText) => {
          if (finalText) {
            setSpokenText(prev => {
              if (!prev.trim()) return finalText;
              if (prev.endsWith(finalText)) return prev;
              return `${prev} ${finalText}`.trim();
            });
          }
          setIsRecording(false);
        },
        onError: (err) => {
          setIsRecording(false);
          setErrorMessage(err);
        },
        onEnd: () => {
          setIsRecording(false);
        },
      });

      if (started) {
        setIsRecording(true);
      }
    }
  };

  const handleHintClick = (hint: StrategicHint) => {
    setSpokenText(prev => {
      const trimmed = prev.trim();
      if (!trimmed) return hint.phrase;
      if (trimmed.includes(hint.phrase)) return trimmed;
      return `${trimmed}, ${hint.phrase}`;
    });
    setCopiedHint(hint.phrase);
    setTimeout(() => setCopiedHint(null), 2000);
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };

  const handleListenModel = () => {
    if (isListeningModel) {
      speechService.stop();
      setIsListeningModel(false);
      return;
    }

    setIsListeningModel(true);
    speechService.speak(bestChoice.text, playbackSpeed, {
      onEnd: () => setIsListeningModel(false),
      onError: () => setIsListeningModel(false),
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!spokenText.trim() || isEvaluating) return;
    if (isRecording) {
      speechRecognitionService.stop();
      setIsRecording(false);
    }
    onSubmitSpeech(spokenText.trim());
  };

  return (
    <div className="rounded-2xl sm:rounded-3xl bg-stone-900/90 border border-stone-800 p-4 sm:p-5 shadow-xl space-y-3.5">
      {/* Header: Mode Badge + Switch */}
      <div className="flex items-center justify-between gap-2 border-b border-stone-800/80 pb-2.5">
        <div className="flex items-center gap-2">
          <span className="flex h-2.5 w-2.5 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500" />
          </span>
          <h4 className="text-xs sm:text-sm font-bold text-white flex items-center gap-1.5">
            🎙️ 실전 영어 직접 발화 모드
            <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
              {episode.targetCefr}
            </span>
          </h4>
        </div>

        <button
          type="button"
          onClick={onSwitchToChoiceMode}
          className="text-[11px] text-stone-400 hover:text-stone-200 transition-colors underline underline-offset-2"
        >
          📝 5개 선택지로 보기
        </button>
      </div>

      {/* Strategic Hints (협상 전략 키워드 칩) */}
      {currentTurn.strategicHints && currentTurn.strategicHints.length > 0 && (
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-[11px] text-stone-400">
            <span className="flex items-center gap-1 font-semibold text-amber-400/90">
              <Lightbulb className="w-3.5 h-3.5" />
              협상 전략 핵심 표현 (클릭 시 문장에 추가)
            </span>
            {copiedHint && (
              <span className="text-emerald-400 text-[10px] font-mono animate-pulse">
                문장에 추가됨 ✓
              </span>
            )}
          </div>
          <div className="flex flex-wrap gap-1.5">
            {currentTurn.strategicHints.map((hint, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleHintClick(hint)}
                className="group inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-stone-950 border border-stone-800 hover:border-amber-500/60 text-[11px] text-stone-300 hover:text-white transition-all text-left"
                title={`${hint.phrase}: ${hint.meaningKo}`}
              >
                <span className="font-mono text-amber-400/80 group-hover:text-amber-300 font-semibold">
                  + {hint.phrase}
                </span>
                <span className="text-[10px] text-stone-500 group-hover:text-stone-400">
                  ({hint.meaningKo})
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Speech Text Input Box & Microphone Control */}
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="relative">
          <textarea
            ref={textareaRef}
            value={spokenText}
            onChange={(e) => setSpokenText(e.target.value)}
            disabled={isEvaluating}
            rows={3}
            placeholder='마이크 버튼을 눌러 영어로 말씀하시거나, 직접 타이핑해 보세요... (예: "We recognize the pressure on landed costs, but $36 compromises quality. If you scale to 80,000 units, we can meet halfway at $38.50.")'
            className="w-full rounded-2xl bg-stone-950/80 border border-stone-800 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 text-stone-100 placeholder-stone-500 text-xs sm:text-sm p-3.5 resize-none leading-relaxed transition-colors outline-none"
          />

          {spokenText && (
            <button
              type="button"
              onClick={() => setSpokenText('')}
              className="absolute right-3 top-3 text-[10px] px-1.5 py-0.5 rounded bg-stone-800 hover:bg-stone-700 text-stone-400 hover:text-white transition-colors"
            >
              지우기
            </button>
          )}
        </div>

        {/* Live status or Error message */}
        {isRecording && (
          <div className="flex items-center gap-2 p-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500" />
            </span>
            <span className="font-medium animate-pulse">
              마이크가 켜졌습니다. 영어로 자유롭게 말씀해 보세요...
            </span>
          </div>
        )}

        {errorMessage && (
          <div className="flex items-start gap-2 p-2.5 rounded-xl bg-rose-950/40 border border-rose-800/50 text-rose-300 text-xs">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
            <div className="space-y-0.5">
              <p className="font-semibold text-rose-200">{errorMessage}</p>
              <p className="text-[11px] text-stone-400">
                마이크 권한 문제인 경우 텍스트 박스에 직접 영어로 작성하셔도 동일하게 AI 협상 평가가 진행됩니다.
              </p>
            </div>
          </div>
        )}

        {/* Bottom Control Bar */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
          {/* Left Actions: Mic Toggle + Listen to Model */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={toggleRecording}
              disabled={isEvaluating}
              className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shadow-sm ${
                isRecording
                  ? 'bg-rose-600 hover:bg-rose-500 text-white animate-pulse ring-2 ring-rose-400/50'
                  : 'bg-stone-800 hover:bg-stone-700 text-stone-200 border border-stone-700'
              }`}
            >
              {isRecording ? (
                <>
                  <MicOff className="w-4 h-4 text-white" />
                  <span>녹음 멈추기</span>
                </>
              ) : (
                <>
                  <Mic className="w-4 h-4 text-amber-400" />
                  <span>마이크로 말하기</span>
                </>
              )}
            </button>

            {/* Listen to Benchmark C1 Speech */}
            <button
              type="button"
              onClick={handleListenModel}
              disabled={isEvaluating}
              className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-stone-950 hover:bg-stone-800 border border-stone-800 transition-colors ${
                isListeningModel ? 'text-amber-400 border-amber-500/50' : 'text-stone-300'
              }`}
              title="C1 원어민 모범 답변 미리듣기"
            >
              <Volume2 className="w-3.5 h-3.5 text-amber-400" />
              <span>모범 답변 미리듣기</span>
            </button>
          </div>

          {/* Right Action: Submit & Evaluate */}
          <button
            type="submit"
            disabled={!spokenText.trim() || isEvaluating}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-md ${
              spokenText.trim() && !isEvaluating
                ? 'bg-amber-500 hover:bg-amber-400 text-stone-950 hover:shadow-amber-500/20 active:scale-95'
                : 'bg-stone-800 text-stone-500 cursor-not-allowed'
            }`}
          >
            {isEvaluating ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>AI 협상 평가 중...</span>
              </>
            ) : (
              <>
                <Send className="w-3.5 h-3.5" />
                <span>답변 제출 및 평가</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
