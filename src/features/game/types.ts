export interface StudentRecord {
  registration: string;
  name: string;
  active: boolean;
}

export type PlayerType = "student" | "visitor";

export interface PlayerRecord {
  registration: string;
  name: string;
  playerType: PlayerType;
}

export interface Question {
  id: string;
  composer: string;
  music: string;
  audioSrc: string;
}

export interface AnswerBreakdown {
  baseCorrect: number;
  speedBonus: number;
  streakBonus: number;
  total: number;
}

export interface AnswerResult {
  status: "correct" | "wrong";
  correctComposer: string;
  correctMusic: string;
  selectedComposer: string;
  selectedMusic: string;
  breakdown: AnswerBreakdown;
  streak: number;
}

export type GamePhase =
  | "idle"
  | "player-ready"
  | "playing"
  | "revealed"
  | "submitting"
  | "finished";

export interface GameSessionState {
  registration: string;
  studentName: string;
  playerType: PlayerType | null;
  score: number;
  streak: number;
  phase: GamePhase;
  currentRound: number;
  questionOrder: string[];
  currentQuestionId: string | null;
  answerResult: AnswerResult | null;
  sessionId: string | null;
  hasSavedScore: boolean;
  resultSessionId: string | null;
}

export interface BestScoreEntry {
  registration: string;
  studentName: string;
  playerType: PlayerType;
  score: number;
  finishedAt: number;
  sessionId: string;
}

export interface ResultSnapshot {
  sessionId: string;
  registration: string;
  studentName: string;
  playerType: PlayerType;
  score: number;
  title: string;
  position: number;
  shareUrl: string;
  finishedAt: number;
  isPersonalBest: boolean;
}

export interface PersistedResultResponse extends ResultSnapshot {
  leaderboardSize: number;
}
