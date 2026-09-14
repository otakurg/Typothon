export type DifficultyLevel = 'easy' | 'medium' | 'hard';

export type RaceMode = 
  | { type: 'time'; duration: 15 | 30 | 60 }
  | { type: 'words'; count: 25 | 50 | 100 }
  | { type: 'passage' }
  | { type: 'quote' };

export type ThemeId = 'cyberpunk' | 'amber' | 'dracula';

export type RaceStatus = 'idle' | 'countdown' | 'racing' | 'finished';

export interface Racer {
  id: string;
  name: string;
  isUser: boolean;
  color: string;
  avatar: string;
  progress: number; // 0 - 100
  currentWpm: number;
  targetWpm?: number;
  rank?: number;
  finishTime?: number; // timestamp or elapsed seconds
  difficulty?: 'easy' | 'medium' | 'hard';
  isHost?: boolean;
  isAfk?: boolean;
  isDnf?: boolean;
  chatBubble?: { message: string; timestamp: number };
}

export interface KeystrokeRecord {
  char: string;
  expected: string;
  timestamp: number;
  isCorrect: boolean;
  wpmAtPoint: number;
}

export interface SecondTelemetry {
  second: number;
  netWpm: number;
  rawWpm: number;
  errors: number;
  accuracy: number;
}

export interface RaceResults {
  netWpm: number;
  grossWpm: number;
  rawWpm: number;
  accuracy: number;
  consistency: number;
  totalErrors: number;
  uncorrectedErrors: number;
  correctChars: number;
  incorrectChars: number;
  extraChars: number;
  missedChars: number;
  totalKeystrokes: number;
  durationSeconds: number;
  keyLatencyMs: number;
  timeline: SecondTelemetry[];
  rank: number;
  racers: Racer[];
  seriesScores?: Record<string, number>;
}

export interface MultiTabMessage {
  msgId?: string;
  type: 
    | 'PLAYER_JOIN' 
    | 'PLAYER_PONG' 
    | 'PLAYER_READY' 
    | 'PLAYER_AFK'
    | 'START_COUNTDOWN' 
    | 'LOBBY_COUNTDOWN_START' 
    | 'LOBBY_COUNTDOWN_CANCEL' 
    | 'RACE_UPDATE' 
    | 'PLAYER_FINISH' 
    | 'PLAYER_LEAVE' 
    | 'RESET_RACE'
    | 'QUICK_CHAT'
    | 'HOST_SETTINGS';
  roomId: string;
  senderId: string;
  senderName: string;
  payload?: any;
}

export interface ToastNotification {
  id: string;
  text: string;
  type: 'info' | 'warn' | 'success';
  timestamp: number;
}
