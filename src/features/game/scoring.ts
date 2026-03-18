import { AnswerBreakdown } from "@/features/game/types";

const BASE_CORRECT_SCORE = 500;
const MAX_SPEED_BONUS = 300;
export const MAX_SPEED_BONUS_WINDOW_MS = 30_000;
const SPEED_DECAY_STEP_MS = 100;

export const createSessionId = () => {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `session-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
};

export const normalizeRegistration = (value: string) =>
  value.replace(/\D/g, "").trim();

export const normalizeStudentName = (value: string) =>
  value.trim().replace(/\s+/g, " ");

export const calculateSpeedBonus = (elapsedMs: number) => {
  const safeElapsedMs = Math.max(elapsedMs, 0);
  const elapsedSteps = Math.floor(safeElapsedMs / SPEED_DECAY_STEP_MS);

  return Math.max(0, MAX_SPEED_BONUS - elapsedSteps);
};

const calculateStreakBonus = (nextStreak: number) => {
  if (nextStreak <= 0) {
    return 0;
  }

  if (nextStreak === 1) {
    return 100;
  }

  if (nextStreak === 2) {
    return 200;
  }

  return 300;
};

export const calculateRoundBreakdown = ({
  isCorrect,
  elapsedMs,
  currentStreak,
}: {
  isCorrect: boolean;
  elapsedMs: number;
  currentStreak: number;
}): AnswerBreakdown => {
  if (!isCorrect) {
    return {
      baseCorrect: 0,
      speedBonus: 0,
      streakBonus: 0,
      total: 0,
    };
  }

  const nextStreak = currentStreak + 1;
  const speedBonus = calculateSpeedBonus(elapsedMs);
  const streakBonus = calculateStreakBonus(nextStreak);

  return {
    baseCorrect: BASE_CORRECT_SCORE,
    speedBonus,
    streakBonus,
    total: BASE_CORRECT_SCORE + speedBonus + streakBonus,
  };
};

export const getScoreTitle = (score: number) => {
  if (score >= 8000) {
    return "Estrela do Piano Day";
  }

  if (score >= 5000) {
    return "Virtuose em Ascensão";
  }

  return "Aprendiz das Teclas";
};
