import React, { useState } from 'react';
import { Volume2, VolumeX, Sparkles } from 'lucide-react';
import { speechService } from '../utils/speech';

interface AudioButtonProps {
  text: string;
  speed?: number;
  label?: string;
  className?: string;
  variant?: 'primary' | 'ghost' | 'pill';
  size?: 'sm' | 'md';
}

export const AudioButton: React.FC<AudioButtonProps> = ({
  text,
  speed = 1.0,
  label,
  className = '',
  variant = 'ghost',
  size = 'md',
}) => {
  const [isPlaying, setIsPlaying] = useState(false);

  const handlePlay = (e: React.MouseEvent) => {
    e.stopPropagation();

    if (isPlaying) {
      speechService.stop();
      setIsPlaying(false);
      return;
    }

    const success = speechService.speak(text, speed, {
      onStart: () => setIsPlaying(true),
      onEnd: () => setIsPlaying(false),
      onError: () => setIsPlaying(false),
    });

    if (!success) {
      setIsPlaying(false);
    }
  };

  const isPill = variant === 'pill';
  const isPrimary = variant === 'primary';

  return (
    <button
      type="button"
      onClick={handlePlay}
      className={`relative inline-flex items-center justify-center gap-1.5 font-medium transition-all active:scale-95 select-none ${
        isPill
          ? 'px-3 py-1.5 rounded-full text-xs bg-amber-500/10 text-amber-300 border border-amber-500/30 hover:bg-amber-500/20'
          : isPrimary
          ? 'px-4 py-2 rounded-xl text-sm bg-amber-500 text-stone-950 font-semibold shadow-md shadow-amber-500/20 hover:bg-amber-400'
          : 'p-2 rounded-xl text-stone-300 hover:text-amber-300 hover:bg-stone-800/80'
      } ${size === 'sm' ? 'text-xs' : 'text-sm'} ${className}`}
      title="원어민 발음 듣기"
      aria-label="원어민 오디오 발음 듣기"
    >
      {isPlaying ? (
        <span className="flex items-center gap-1">
          <span className="w-1.5 h-3.5 bg-amber-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
          <span className="w-1.5 h-4.5 bg-amber-400 rounded-full animate-bounce [animation-delay:-0.15s]" />
          <span className="w-1.5 h-3 bg-amber-400 rounded-full animate-bounce" />
        </span>
      ) : (
        <Volume2 className={size === 'sm' ? 'w-4 h-4' : 'w-4.5 h-4.5'} />
      )}

      {label && <span className="whitespace-nowrap">{label}</span>}
      
      {speed !== 1.0 && (
        <span className="text-[10px] px-1 py-0.5 rounded bg-stone-800 text-stone-300 font-mono">
          {speed}x
        </span>
      )}
    </button>
  );
};
