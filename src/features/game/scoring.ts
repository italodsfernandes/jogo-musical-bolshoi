import { AnswerBreakdown, Question } from "@/features/game/types";

const BASE_CORRECT_SCORE = 500;
const MAX_SPEED_BONUS = 300;
const SPEED_DECAY_PER_SECOND = 10;

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

const shuffleArray = <T,>(items: T[]) => {
  const shuffled = [...items];

  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [shuffled[index], shuffled[randomIndex]] = [
      shuffled[randomIndex],
      shuffled[index],
    ];
  }

  return shuffled;
};

export const buildQuestionOrder = (questionIds: string[]) =>
  shuffleArray(questionIds);

export const createAnswerOptions = (
  currentQuestionId: string,
  allQuestions: Question[],
  optionCount = 4
): Question[] => {
  const currentQuestion = allQuestions.find(
    (question) => question.id === currentQuestionId
  );

  if (!currentQuestion) {
    return [];
  }

  const uniqueOtherQuestionsById = new Map(
    allQuestions
      .filter((question) => question.id !== currentQuestionId)
      .map((question) => [question.id, question])
  );
  const otherQuestions = shuffleArray([...uniqueOtherQuestionsById.values()]);

  return shuffleArray([
    currentQuestion,
    ...otherQuestions.slice(0, optionCount - 1),
  ]);
};

const calculateSpeedBonus = (elapsedMs: number) => {
  const safeElapsedMs = Math.max(elapsedMs, 0);
  const elapsedSeconds = Math.floor(safeElapsedMs / 1000);

  return Math.max(0, MAX_SPEED_BONUS - elapsedSeconds * SPEED_DECAY_PER_SECOND);
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
  hasReplayed,
  currentStreak,
}: {
  isCorrect: boolean;
  elapsedMs: number;
  hasReplayed: boolean;
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
  const speedBonus = hasReplayed ? 0 : calculateSpeedBonus(elapsedMs);
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
