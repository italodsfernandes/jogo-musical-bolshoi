import "server-only";

import * as admin from "firebase-admin";

import {
  computeSessionPosition,
  shouldUpdateBestScore,
  sortLeaderboard,
} from "@/features/game/leaderboard";
import {
  BestScoreEntry,
  GameSessionRecord,
  PersistedResultResponse,
  PlayerType,
  ResultSnapshot,
  StudentAttemptEntry,
  StudentAttemptSummary,
  StudentStatsRecord,
} from "@/features/game/types";
import { getScoreTitle, normalizeRegistration } from "@/features/game/scoring";

const scoreNamespace = process.env.FIREBASE_SCORE_NAMESPACE?.trim();

export const MAX_STUDENT_ATTEMPTS = 3;

const getApp = (): admin.app.App => {
  if (admin.apps.length > 0) {
    return admin.apps[0]!;
  }

  const databaseURL = process.env.FIREBASE_DATABASE_URL;
  if (!databaseURL) {
    throw new Error("Firebase database URL is not configured.");
  }

  const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  const credential = serviceAccountKey
    ? admin.credential.cert(
        JSON.parse(serviceAccountKey) as admin.ServiceAccount,
      )
    : admin.credential.applicationDefault();

  return admin.initializeApp({ credential, databaseURL });
};

const getDatabase = () => admin.database(getApp());

const normalizeDatabasePath = (path: string) =>
  path.replace(/^\/+/, "").replace(/\/+$/, "");

const resolveScorePath = (path: string) => {
  const normalizedPath = normalizeDatabasePath(path);

  if (!scoreNamespace) {
    return normalizedPath;
  }

  return `${normalizeDatabasePath(scoreNamespace)}/${normalizedPath}`;
};

const dbGet = async <T>(path: string): Promise<T | null> => {
  const snapshot = await getDatabase().ref(path).once("value");
  return snapshot.val() as T | null;
};

const dbSet = async <T>(path: string, value: T): Promise<void> => {
  await getDatabase().ref(path).set(value);
};

const dbDelete = async (path: string): Promise<void> => {
  await getDatabase().ref(path).remove();
};

const getPlayerType = (playerType: PlayerType | undefined): PlayerType =>
  playerType === "visitor" ? "visitor" : "student";

const toFiniteNumber = (value: unknown, fallback: number) =>
  typeof value === "number" && Number.isFinite(value) ? value : fallback;

const toNullableFiniteNumber = (value: unknown): number | null =>
  typeof value === "number" && Number.isFinite(value) ? value : null;

const normalizePlayerRegistration = (
  registration: string,
  playerType: PlayerType,
) => {
  if (playerType === "visitor") {
    return registration.trim().toLowerCase();
  }

  return normalizeRegistration(registration);
};

const toBestScoreEntry = (entry: BestScoreEntry) => ({
  ...entry,
  playerType: getPlayerType(entry.playerType),
});

const toResultSnapshot = (entry: ResultSnapshot): ResultSnapshot => ({
  ...entry,
  playerType: getPlayerType(entry.playerType),
});

const sanitizeGameSession = (session: GameSessionRecord): GameSessionRecord => ({
  ...session,
  playerType: getPlayerType(session.playerType),
  currentRound: toFiniteNumber(session.currentRound, 1),
  totalRounds: toFiniteNumber(session.totalRounds, 0),
  score: toFiniteNumber(session.score, 0),
  streak: toFiniteNumber(session.streak, 0),
  finishedAt: toNullableFiniteNumber(session.finishedAt),
  resultSessionId:
    typeof session.resultSessionId === "string" && session.resultSessionId
      ? session.resultSessionId
      : null,
  currentRoundState: session.currentRoundState
    ? {
        ...session.currentRoundState,
        roundStartedAt: toNullableFiniteNumber(
          session.currentRoundState.roundStartedAt,
        ),
        answeredAt: toNullableFiniteNumber(session.currentRoundState.answeredAt),
        selectedOptionId:
          typeof session.currentRoundState.selectedOptionId === "string"
            ? session.currentRoundState.selectedOptionId
            : null,
      }
    : null,
});

const sanitizeAttemptEntry = (
  sessionId: string,
  entry: Partial<StudentAttemptEntry> | null | undefined,
): StudentAttemptEntry => ({
  sessionId,
  attemptNumber: Math.max(1, toFiniteNumber(entry?.attemptNumber, 1)),
  startedAt: toFiniteNumber(entry?.startedAt, 0),
  finishedAt: toNullableFiniteNumber(entry?.finishedAt),
  score:
    typeof entry?.score === "number" && Number.isFinite(entry.score)
      ? entry.score
      : null,
});

const sanitizeStudentStatsRecord = (
  stats: Partial<StudentStatsRecord> | null | undefined,
): StudentStatsRecord => {
  const rawAttempts =
    stats?.attemptsBySessionId &&
    typeof stats.attemptsBySessionId === "object" &&
    !Array.isArray(stats.attemptsBySessionId)
      ? stats.attemptsBySessionId
      : {};

  const attemptsBySessionId = Object.fromEntries(
    Object.entries(rawAttempts).map(([sessionId, entry]) => [
      sessionId,
      sanitizeAttemptEntry(sessionId, entry),
    ]),
  );
  const attemptsUsed = Math.min(
    MAX_STUDENT_ATTEMPTS,
    Math.max(
      Object.keys(attemptsBySessionId).length,
      toFiniteNumber(stats?.attemptsUsed, 0),
    ),
  );

  return {
    attemptsUsed,
    maxAttempts: MAX_STUDENT_ATTEMPTS,
    attemptsBySessionId,
  };
};

const emptyAttemptSummary = (): StudentAttemptSummary => ({
  attemptsUsed: 0,
  attemptsRemaining: MAX_STUDENT_ATTEMPTS,
  maxAttempts: MAX_STUDENT_ATTEMPTS,
  isBlocked: false,
  bestScore: null,
  rankingPosition: null,
  attemptHistory: [],
});

const buildStudentAttemptSummary = ({
  stats,
  leaderboard,
  registration,
}: {
  stats: StudentStatsRecord | null;
  leaderboard: BestScoreEntry[];
  registration: string;
}): StudentAttemptSummary => {
  if (!registration) {
    return emptyAttemptSummary();
  }

  const safeStats = sanitizeStudentStatsRecord(stats);
  const attemptsUsed = Math.min(safeStats.attemptsUsed, MAX_STUDENT_ATTEMPTS);
  const attemptHistory = Object.values(safeStats.attemptsBySessionId)
    .sort(
      (first, second) =>
        first.attemptNumber - second.attemptNumber ||
        first.startedAt - second.startedAt,
    )
    .slice(0, MAX_STUDENT_ATTEMPTS);
  const bestEntry =
    leaderboard.find((entry) => entry.registration === registration) ?? null;

  return {
    attemptsUsed,
    attemptsRemaining: Math.max(0, MAX_STUDENT_ATTEMPTS - attemptsUsed),
    maxAttempts: MAX_STUDENT_ATTEMPTS,
    isBlocked: attemptsUsed >= MAX_STUDENT_ATTEMPTS,
    bestScore: bestEntry?.score ?? null,
    rankingPosition: bestEntry
      ? leaderboard.findIndex((entry) => entry.registration === registration) + 1
      : null,
    attemptHistory,
  };
};

export const getLeaderboard = async (filter: "all" | "student" = "student") => {
  const data = await dbGet<Record<string, BestScoreEntry>>(
    resolveScorePath("bestScores"),
  );

  if (!data) {
    return [];
  }

  const entries = Object.values(data).map(toBestScoreEntry);
  const filteredEntries =
    filter === "student"
      ? entries.filter((entry) => entry.playerType === "student")
      : entries;

  return sortLeaderboard(filteredEntries);
};

export const getResultSnapshot = async (sessionId: string) => {
  const result = await dbGet<ResultSnapshot>(
    resolveScorePath(`results/${sessionId}`),
  );

  if (result || !scoreNamespace) {
    return result ? toResultSnapshot(result) : result;
  }

  const fallbackResult = await dbGet<ResultSnapshot>(`results/${sessionId}`);
  return fallbackResult ? toResultSnapshot(fallbackResult) : fallbackResult;
};

export const getGameSession = async (sessionId: string) => {
  const session = await dbGet<GameSessionRecord>(
    resolveScorePath(`gameSessions/${sessionId}`),
  );

  return session ? sanitizeGameSession(session) : session;
};

export const saveGameSession = async (session: GameSessionRecord) => {
  await dbSet(
    resolveScorePath(`gameSessions/${session.sessionId}`),
    sanitizeGameSession(session),
  );
};

export const deleteGameSession = async (sessionId: string) => {
  await dbDelete(resolveScorePath(`gameSessions/${sessionId}`));
};

export const getStudentAttemptSummary = async (registration: string) => {
  const normalizedRegistration = normalizeRegistration(registration);

  if (!normalizedRegistration) {
    return emptyAttemptSummary();
  }

  const [stats, leaderboard] = await Promise.all([
    dbGet<StudentStatsRecord>(
      resolveScorePath(`studentStats/${normalizedRegistration}`),
    ),
    getLeaderboard("student"),
  ]);

  return buildStudentAttemptSummary({
    stats,
    leaderboard,
    registration: normalizedRegistration,
  });
};

export const reserveStudentAttempt = async ({
  registration,
  sessionId,
  startedAt = Date.now(),
}: {
  registration: string;
  sessionId: string;
  startedAt?: number;
}) => {
  const normalizedRegistration = normalizeRegistration(registration);

  if (!normalizedRegistration) {
    throw new Error("Matricula de aluno invalida.");
  }

  const statsRef = getDatabase().ref(
    resolveScorePath(`studentStats/${normalizedRegistration}`),
  );
  let reservedAttempt: StudentAttemptEntry | null = null;

  const transaction = await statsRef.transaction((currentValue) => {
    const currentStats = sanitizeStudentStatsRecord(
      currentValue as Partial<StudentStatsRecord> | null | undefined,
    );

    if (currentStats.attemptsUsed >= MAX_STUDENT_ATTEMPTS) {
      return;
    }

    const existingAttempt = currentStats.attemptsBySessionId[sessionId];
    if (existingAttempt) {
      reservedAttempt = existingAttempt;
      return currentStats;
    }

    reservedAttempt = {
      sessionId,
      attemptNumber: currentStats.attemptsUsed + 1,
      startedAt,
      finishedAt: null,
      score: null,
    };

    return {
      attemptsUsed: currentStats.attemptsUsed + 1,
      maxAttempts: MAX_STUDENT_ATTEMPTS,
      attemptsBySessionId: {
        ...currentStats.attemptsBySessionId,
        [sessionId]: reservedAttempt,
      },
    };
  });

  const summary = await getStudentAttemptSummary(normalizedRegistration);

  if (!transaction.committed || !reservedAttempt) {
    return {
      reserved: false,
      summary,
      attempt: null,
    };
  }

  return {
    reserved: true,
    summary,
    attempt: reservedAttempt,
  };
};

export const releaseReservedStudentAttempt = async ({
  registration,
  sessionId,
}: {
  registration: string;
  sessionId: string;
}) => {
  const normalizedRegistration = normalizeRegistration(registration);

  if (!normalizedRegistration) {
    return;
  }

  const statsRef = getDatabase().ref(
    resolveScorePath(`studentStats/${normalizedRegistration}`),
  );

  await statsRef.transaction((currentValue) => {
    const currentStats = sanitizeStudentStatsRecord(
      currentValue as Partial<StudentStatsRecord> | null | undefined,
    );
    const currentAttempt = currentStats.attemptsBySessionId[sessionId];

    if (
      !currentAttempt ||
      currentAttempt.finishedAt !== null ||
      currentAttempt.score !== null
    ) {
      return currentStats;
    }

    const nextAttempts = { ...currentStats.attemptsBySessionId };
    delete nextAttempts[sessionId];

    return {
      attemptsUsed: Math.max(0, currentStats.attemptsUsed - 1),
      maxAttempts: MAX_STUDENT_ATTEMPTS,
      attemptsBySessionId: nextAttempts,
    };
  });
};

export const finalizeStudentAttempt = async ({
  registration,
  sessionId,
  score,
  finishedAt = Date.now(),
}: {
  registration: string;
  sessionId: string;
  score: number;
  finishedAt?: number;
}) => {
  const normalizedRegistration = normalizeRegistration(registration);

  if (!normalizedRegistration) {
    return;
  }

  const safeScore = toFiniteNumber(score, 0);
  const statsRef = getDatabase().ref(
    resolveScorePath(`studentStats/${normalizedRegistration}`),
  );

  await statsRef.transaction((currentValue) => {
    const currentStats = sanitizeStudentStatsRecord(
      currentValue as Partial<StudentStatsRecord> | null | undefined,
    );
    const currentAttempt = currentStats.attemptsBySessionId[sessionId];

    if (!currentAttempt) {
      return currentStats;
    }

    return {
      attemptsUsed: currentStats.attemptsUsed,
      maxAttempts: MAX_STUDENT_ATTEMPTS,
      attemptsBySessionId: {
        ...currentStats.attemptsBySessionId,
        [sessionId]: {
          ...currentAttempt,
          score: safeScore,
          finishedAt,
        },
      },
    };
  });
};

export const persistResultSnapshot = async ({
  registration,
  studentName,
  playerType,
  score,
  sessionId,
  origin,
}: {
  registration: string;
  studentName: string;
  playerType: PlayerType;
  score: number;
  sessionId: string;
  origin: string;
}): Promise<PersistedResultResponse> => {
  const safeScore = toFiniteNumber(score, 0);
  const normalizedRegistration = normalizePlayerRegistration(
    registration,
    playerType,
  );

  if (!normalizedRegistration) {
    throw new Error("Identificador de jogador invalido.");
  }

  const finishedAt = Date.now();
  const shareUrl = `${origin}/resultado/${sessionId}`;

  const existingBest = await dbGet<BestScoreEntry>(
    resolveScorePath(`bestScores/${normalizedRegistration}`),
  );
  const isPersonalBest = shouldUpdateBestScore(existingBest, safeScore);

  if (isPersonalBest) {
    const bestEntry: BestScoreEntry = {
      registration: normalizedRegistration,
      studentName,
      playerType,
      score: safeScore,
      finishedAt,
      sessionId,
    };

    await dbSet(resolveScorePath(`bestScores/${normalizedRegistration}`), bestEntry);
  }

  const leaderboardFilter = playerType === "student" ? "student" : "all";
  const leaderboard = await getLeaderboard(leaderboardFilter);
  const currentEntry = {
    registration: normalizedRegistration,
    studentName,
    playerType,
    score: safeScore,
    finishedAt,
    sessionId,
  };
  const position = computeSessionPosition(leaderboard, currentEntry);

  const snapshot: PersistedResultResponse = {
    sessionId,
    registration: normalizedRegistration,
    studentName,
    playerType,
    score: safeScore,
    title: getScoreTitle(safeScore),
    position: position || leaderboard.length + 1,
    shareUrl,
    finishedAt,
    isPersonalBest,
    leaderboardSize: leaderboard.length + (existingBest ? 0 : 1),
  };

  await dbSet(resolveScorePath(`results/${sessionId}`), snapshot);

  return snapshot;
};
