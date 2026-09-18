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
}

export interface UserSettings {
  playbackSpeed: 0.85 | 1.0 | 1.2;
  autoPlayAudio: boolean;
  showKoreanHints: boolean;
  targetCefr: CefrLevel;
}
