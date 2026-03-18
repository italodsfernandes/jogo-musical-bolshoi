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

export interface CurrentQuestionPayload {
  audioToken: string;
}

export interface QuestionOption {
  optionId: string;
  composer: string;
  music: string;
}

export interface GameRoundData {
  currentQuestion: CurrentQuestionPayload;
  options: QuestionOption[];
  roundStartedAt: number | null;
}

export interface GameRoundState {
  answerKey: string;
  audioToken: string;
  options: QuestionOption[];
  roundStartedAt: number | null;
  answeredAt: number | null;
  selectedOptionId: string | null;
}

export interface StartGamePayload {
  sessionId: string;
  totalRounds: number;
  currentRound: number;
  roundData: GameRoundData;
  player: PlayerRecord;
}

export interface NextRoundPayload {
  currentRound: number;
  roundData: GameRoundData | null;
  finished: boolean;
}

export interface AnswerBreakdown {
  baseCorrect: number;
  speedBonus: number;
  streakBonus: number;
  total: number;
}

export interface AnswerResult {
  status: "correct" | "wrong" | "skipped";
  correctComposer: string;
  correctMusic: string;
  selectedComposer: string | null;
  selectedMusic: string | null;
  breakdown: AnswerBreakdown;
  streak: number;
}

export interface SubmitAnswerPayload {
  currentRound: number;
  score: number;
  answerResult: AnswerResult;
  finished: boolean;
  result: PersistedResultResponse | null;
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
  totalRounds: number;
  currentRoundData: GameRoundData | null;
  answerResult: AnswerResult | null;
  sessionId: string | null;
  hasSavedScore: boolean;
  resultSessionId: string | null;
  pendingResult: PersistedResultResponse | null;
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

export interface GameSessionRecord {
  sessionId: string;
  registration: string;
  studentName: string;
  playerType: PlayerType;
  questionOrder: string[];
  totalRounds: number;
  currentRound: number;
  currentRoundState: GameRoundState | null;
  score: number;
  streak: number;
  status: "active" | "finished";
  finishedAt: number | null;
  resultSessionId: string | null;
}
