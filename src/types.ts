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
  listeningCount?: number;
  shadowingCount?: number;
  supabaseLogId?: string;
  sheetSyncStatus?: 'synced' | 'failed' | 'not_configured';
  sheetSyncMessage?: string;
  supabaseSyncStatus?: 'synced' | 'needs_table' | 'failed';
  supabaseSyncMessage?: string;
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
  nickname: string;           // 학습자 닉네임 (기본값: '익명')
  name?: string;              // 하위 호환성용
  avatar: string;             // 아바타 이모지 (예: 🗽, 💼, ☕, 🌟)
  play_count: number;         // 누적 시뮬레이션 플레이 횟수
  total_listening_count?: number; // 누적 듣기 학습 횟수
  total_shadowing_count?: number; // 누적 쉐도잉 횟수
  last_appropriateness_score?: number; // 최근 획득 대화 적합도 점수 (%)
  last_scenario_name?: string; // 최근 플레이 시나리오
  correct_count?: number;     // 참고용 카운트
  wrong_count?: number;       // 참고용 카운트
  lastPlayed?: string;
}

export type StudentProfile = LearnerProfile;

export interface GoogleSheetRecord {
  id: string;
  timestamp: string;                      // 완료 일시
  name: string;                           // 학습자 이름/닉네임 (미입력 시 '익명')
  nickname?: string;                      // 별칭
  scenario_name: string;                  // 선택하여 플레이한 시나리오 제목 및 카테고리
  play_count: number;                     // 누적 플레이 횟수
  appropriateness_score: number | string; // 대화 적합도 퍼센트/점수 (예: "92%")
  status: 'synced' | 'pending' | 'failed';
  errorMessage?: string;
}

export interface UserActivityLog {
  id: string;
  user_id?: string | null;
  nickname: string;
  scenario_id?: string;
  scenario_name: string;
  listening_count: number;
  shadowing_count: number;
  appropriateness_score: number;
  cefr_level?: string;
  recorded_at: string; // ISO timestamp
  created_at?: string;
  source?: 'supabase' | 'local';
}

