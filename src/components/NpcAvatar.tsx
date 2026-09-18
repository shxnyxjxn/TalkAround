import React from 'react';
import { NpcMood } from '../types';

interface NpcAvatarProps {
  seed: string;
  name: string;
  mood: NpcMood;
  accentColor: string;
  size?: 'sm' | 'md' | 'lg';
}

export const NpcAvatar: React.FC<NpcAvatarProps> = ({
  seed,
  name,
  mood,
  accentColor,
  size = 'md',
}) => {
  const sizeClasses = {
    sm: 'w-10 h-10 text-xs',
    md: 'w-16 h-16 sm:w-20 sm:h-20 text-sm',
    lg: 'w-24 h-24 sm:w-28 sm:h-28 text-base',
  };

  // Get mood emoji and mood ring color
  const getMoodDetails = () => {
    switch (mood) {
      case 'happy':
        return { emoji: '😊', badge: 'bg-emerald-500 text-white', label: '호감' };
      case 'impressed':
        return { emoji: '🤩', badge: 'bg-amber-500 text-stone-900', label: '감탄' };
      case 'confused':
        return { emoji: '🤔', badge: 'bg-indigo-500 text-white', label: '의아' };
      case 'annoyed':
        return { emoji: '😅', badge: 'bg-rose-500 text-white', label: '당황' };
      default:
        return { emoji: '🙂', badge: 'bg-stone-500 text-white', label: '평온' };
    }
  };

  const moodDetails = getMoodDetails();

  // Pick character avatar based on seed
  const getAvatarIllustration = () => {
    if (seed.includes('barista')) {
      return (
        <svg viewBox="0 0 100 100" className="w-full h-full">
          <circle cx="50" cy="50" r="48" fill="#FDE68A" />
          {/* Hair */}
          <path d="M22 45 C22 25, 78 25, 78 45 C78 60, 75 75, 75 75 L25 75 Z" fill="#78350F" />
          {/* Face */}
          <circle cx="50" cy="52" r="28" fill="#FED7AA" />
          {/* Eyes depending on mood */}
          {mood === 'impressed' ? (
            <>
              <circle cx="40" cy="48" r="4.5" fill="#1E293B" />
              <circle cx="60" cy="48" r="4.5" fill="#1E293B" />
              <path d="M37 40 Q40 37 43 40" stroke="#78350F" strokeWidth="2.5" strokeLinecap="round" fill="none" />
              <path d="M57 40 Q60 37 63 40" stroke="#78350F" strokeWidth="2.5" strokeLinecap="round" fill="none" />
            </>
          ) : mood === 'annoyed' ? (
            <>
              <line x1="36" y1="46" x2="44" y2="50" stroke="#1E293B" strokeWidth="3" strokeLinecap="round" />
              <line x1="64" y1="46" x2="56" y2="50" stroke="#1E293B" strokeWidth="3" strokeLinecap="round" />
            </>
          ) : (
            <>
              <circle cx="41" cy="49" r="3.5" fill="#1E293B" />
              <circle cx="59" cy="49" r="3.5" fill="#1E293B" />
            </>
          )}
          {/* Smile / Mouth */}
          {mood === 'happy' || mood === 'impressed' ? (
            <path d="M42 61 Q50 69 58 61" stroke="#9A3412" strokeWidth="3" strokeLinecap="round" fill="none" />
          ) : mood === 'annoyed' ? (
            <path d="M43 64 Q50 60 57 64" stroke="#9A3412" strokeWidth="2.5" strokeLinecap="round" fill="none" />
          ) : (
            <path d="M44 62 Q50 65 56 62" stroke="#9A3412" strokeWidth="2.5" strokeLinecap="round" fill="none" />
          )}
          {/* Barista Apron Top */}
          <path d="M28 85 L35 70 L65 70 L72 85 Z" fill="#92400E" />
          <circle cx="50" cy="78" r="3" fill="#FCD34D" />
        </svg>
      );
    }

    if (seed.includes('roommate')) {
      return (
        <svg viewBox="0 0 100 100" className="w-full h-full">
          <circle cx="50" cy="50" r="48" fill="#BFDBFE" />
          {/* Brad's Hair & Beanie */}
          <path d="M20 48 Q50 15 80 48 Z" fill="#1E3A8A" />
          <rect x="22" y="44" width="56" height="10" rx="4" fill="#3B82F6" />
          {/* Face */}
          <circle cx="50" cy="58" r="26" fill="#FDE68A" />
          {/* Eyes */}
          <circle cx="42" cy="56" r="3.5" fill="#0F172A" />
          <circle cx="58" cy="56" r="3.5" fill="#0F172A" />
          {/* Beard / Smile */}
          <path d="M40 70 Q50 78 60 70" stroke="#B45309" strokeWidth="2" strokeLinecap="round" fill="none" />
          {mood === 'happy' || mood === 'impressed' ? (
            <path d="M43 65 Q50 72 57 65" stroke="#9A3412" strokeWidth="3" strokeLinecap="round" fill="none" />
          ) : (
            <path d="M44 66 L56 66" stroke="#9A3412" strokeWidth="2.5" strokeLinecap="round" fill="none" />
          )}
          {/* Hoodie */}
          <path d="M24 88 L34 78 L66 78 L76 88 Z" fill="#1E40AF" />
        </svg>
      );
    }

    if (seed.includes('designer')) {
      return (
        <svg viewBox="0 0 100 100" className="w-full h-full">
          <circle cx="50" cy="50" r="48" fill="#A7F3D0" />
          {/* Hair Bob */}
          <path d="M22 50 C22 25, 78 25, 78 50 C78 72, 70 75, 70 75 L30 75 C30 75, 22 72, 22 50 Z" fill="#111827" />
          {/* Face */}
          <circle cx="50" cy="52" r="27" fill="#FCE7F3" />
          {/* Stylish Glasses */}
          <rect x="34" y="44" width="13" height="11" rx="3" fill="none" stroke="#047857" strokeWidth="2.5" />
          <rect x="53" y="44" width="13" height="11" rx="3" fill="none" stroke="#047857" strokeWidth="2.5" />
          <line x1="47" y1="49" x2="53" y2="49" stroke="#047857" strokeWidth="2" />
          {/* Eyes behind glasses */}
          <circle cx="40.5" cy="49.5" r="2.5" fill="#111827" />
          <circle cx="59.5" cy="49.5" r="2.5" fill="#111827" />
          {/* Lip */}
          <path d="M43 64 Q50 70 57 64" stroke="#BE185D" strokeWidth="3" strokeLinecap="round" fill="none" />
          {/* Blazer */}
          <path d="M25 86 L38 76 L62 76 L75 86 Z" fill="#065F46" />
        </svg>
      );
    }

    // Default: Officer / Official
    return (
      <svg viewBox="0 0 100 100" className="w-full h-full">
        <circle cx="50" cy="50" r="48" fill="#CBD5E1" />
        {/* Officer Cap */}
        <path d="M20 42 Q50 20 80 42 Z" fill="#1E293B" />
        <rect x="18" y="40" width="64" height="6" rx="2" fill="#0F172A" />
        <circle cx="50" cy="34" r="4" fill="#F59E0B" />
        {/* Face */}
        <circle cx="50" cy="56" r="26" fill="#FDE68A" />
        {/* Sharp Eyes */}
        <line x1="38" y1="52" x2="45" y2="52" stroke="#0F172A" strokeWidth="3" strokeLinecap="round" />
        <line x1="55" y1="52" x2="62" y2="52" stroke="#0F172A" strokeWidth="3" strokeLinecap="round" />
        {/* Neutral mouth */}
        {mood === 'happy' || mood === 'impressed' ? (
          <path d="M44 67 Q50 71 56 67" stroke="#334155" strokeWidth="2.5" strokeLinecap="round" fill="none" />
        ) : (
          <line x1="43" y1="67" x2="57" y2="67" stroke="#334155" strokeWidth="2.5" strokeLinecap="round" />
        )}
        {/* Uniform Collar */}
        <path d="M25 88 L36 78 L64 78 L75 88 Z" fill="#334155" />
      </svg>
    );
  };

  return (
    <div className="relative inline-flex flex-col items-center select-none">
      <div 
        className={`relative ${sizeClasses[size]} rounded-2xl p-1 shadow-md transition-all duration-300 transform`}
        style={{
          boxShadow: `0 0 0 3px ${accentColor}40`,
        }}
      >
        <div className="w-full h-full rounded-xl overflow-hidden bg-stone-800">
          {getAvatarIllustration()}
        </div>

        {/* Mood Emoji Indicator */}
        <div 
          className={`absolute -bottom-1 -right-1 flex items-center justify-center w-6 h-6 rounded-full border-2 border-stone-900 shadow-sm ${moodDetails.badge} text-xs transition-transform duration-300 scale-100 hover:scale-110`}
          title={`현재 표정: ${moodDetails.label}`}
        >
          <span>{moodDetails.emoji}</span>
        </div>
      </div>
    </div>
  );
};
