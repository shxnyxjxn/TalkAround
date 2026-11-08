export type CefrLevel = 'A2' | 'B1' | 'B2' | 'B2+' | 'C1';

export type EpisodeCategory = 'campus' | 'business' | 'travel';

export type NpcMood = 'neutral' | 'happy' | 'confused' | 'annoyed' | 'impressed';

export type FeedbackType = 
  | 'native_perfect'      // 100% 현지인 바이브
  | 'textbook_awkward'    // 문법은 맞지만 교과서식/어색함
  | 'too_blunt'           // 너무 직설적이거나 명령조
  | 'cultural_mismatch';  // 문화적/에티켓 맥락 오해

export interface Choice {
  id: string;
  text: string;
  textKo: string;
  isBest: boolean;
  cefrLevel: CefrLevel;
  affinityChange: number; // e.g. +20, +5, -15
  feedbackType: FeedbackType;
  feedbackTitle: string;
  feedbackDetail: string;
  nativeAlternative: string;
  nativeAlternativeKo: string;
  npcReactionDialogue: string;
  npcReactionDialogueKo: string;
  npcReactionMood: NpcMood;
}

export interface StrategicHint {
  phrase: string;
  meaningKo: string;
}

export interface Turn {
  turnNumber: number;
  npcDialogue: string;
  npcDialogueKo: string;
  npcMood: NpcMood;
  contextNote: string;
  choices: Choice[];
  strategicHints?: StrategicHint[];
}

export interface NpcProfile {
  name: string;
  role: string;
  location: string;
  avatarSeed: string; // for stylized avatar
  accentColor: string;
  personality: string;
}

export interface Episode {
  id: string;
  title: string;
  titleKo: string;
  subtitle: string;
  category: EpisodeCategory;
  locationTag: string;
  targetCefr: CefrLevel;
  estimatedMinutes: number;
  npc: NpcProfile;
  turns: Turn[];
}

export interface SpeechEvaluation {
  cefrLevel: CefrLevel;
  isBest: boolean;
  affinityChange: number;
  feedbackTitle: string;
  feedbackDetail: string;
  strengths?: string;
  improvements?: string;
  npcReactionDialogue: string;
  npcReactionDialogueKo: string;
  npcReactionMood: NpcMood;
  nativePolish: string;
  nativePolishKo: string;
}

export interface TurnRecord {
  turnNumber: number;
  npcDialogue: string;
  chosenChoice: Choice;
  wasBest: boolean;
  affinityChange: number;
  userSpokenText?: string;
  speechEvaluation?: SpeechEvaluation;
}

export interface SessionResult {
  episodeId: string;
  episodeTitle: string;
  completedAt: string;
  totalScore: number;
  finalAffinity: number; // 0 to 100
  bestChoicesCount: number;
  totalTurns: number;
  achievedCefr: CefrLevel;
  affinityRank: {
    title: string;
    description: string;
    emoji: string;
  };
  turnRecords: TurnRecord[];
  sheetSyncStatus?: 'synced' | 'failed' | 'not_configured';
  sheetSyncMessage?: string;
}

export interface UserSettings {
  playbackSpeed: 0.85 | 1.0 | 1.2;
  autoPlayAudio: boolean;
  showKoreanHints: boolean;
  targetCefr: CefrLevel;
}

// ==========================================
// Talk Around Learner Profile & Google Sheet
// ==========================================

export interface LearnerProfile {
  name: string;           // 학습자 닉네임 (기본값: '익명 학습자')
  avatar: string;         // 아바타 이모지 (예: 🗽, 💼, ☕, 🌟)
  play_count: number;     // 누적 시뮬레이션 플레이 횟수
  correct_count: number;  // 적절한 원어민 표현 선택 수 (Best choice)
  wrong_count: number;    // 부적절한 표현 / 실수 선택 수
  lastPlayed?: string;
}

export type StudentProfile = LearnerProfile;

export interface SentenceTapItem {
  sentence: string;
  sentenceKo?: string;
  category?: string;
  tapCount: number;
  lastTappedAt: string;
}

export interface SentenceTapStats {
  items: Record<string, SentenceTapItem>;
  totalTaps: number;
  uniqueSentencesCount: number;
  averageTaps: number; // e.g. 2.45
  topSentence?: SentenceTapItem;
}

export interface GoogleSheetRecord {
  id: string;
  timestamp: string;      // "YYYY-MM-DD HH:mm:ss"
  name: string;           // Student Name
  play_count: number;     // Total plays
  correct_count: number;  // Correct count
  wrong_count: number;    // Wrong count
  average_taps?: number;  // 각 문장별 탭 평균
  sentence_summary?: string; // 각 문장별 탭 빈도 요약
  total_sentence_taps?: number;
  status: 'synced' | 'pending' | 'failed';
  errorMessage?: string;
  mode?: string;
}
