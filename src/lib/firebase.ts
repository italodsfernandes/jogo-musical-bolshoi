import "server-only";

import * as admin from "firebase-admin";

import {
  computeSessionPosition,
  shouldUpdateBestScore,
  sortLeaderboard,
} from "@/features/game/leaderboard";
import {
  BestScoreEntry,
  PersistedResultResponse,
  PlayerType,
  ResultSnapshot,
} from "@/features/game/types";
import { getScoreTitle, normalizeRegistration } from "@/features/game/scoring";

const scoreNamespace = process.env.FIREBASE_SCORE_NAMESPACE?.trim();

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
    ? admin.credential.cert(JSON.parse(serviceAccountKey) as admin.ServiceAccount)
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

const getPlayerType = (playerType: PlayerType | undefined): PlayerType =>
  playerType === "visitor" ? "visitor" : "student";

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

export const getLeaderboard = async (filter: "all" | "student" = "all") => {
  const data = await dbGet<Record<string, BestScoreEntry>>(
    resolveScorePath("bestScores")
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
    resolveScorePath(`results/${sessionId}`)
  );

  if (result || !scoreNamespace) {
    return result ? toResultSnapshot(result) : result;
  }

  const fallbackResult = await dbGet<ResultSnapshot>(`results/${sessionId}`);
  return fallbackResult ? toResultSnapshot(fallbackResult) : fallbackResult;
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
    resolveScorePath(`bestScores/${normalizedRegistration}`)
  );
  const isPersonalBest = shouldUpdateBestScore(existingBest, score);

  if (isPersonalBest) {
    const bestEntry: BestScoreEntry = {
      registration: normalizedRegistration,
      studentName,
      playerType,
      score,
      finishedAt,
      sessionId,
    };

    await dbSet(
      resolveScorePath(`bestScores/${normalizedRegistration}`),
      bestEntry
    );
  }

  const leaderboard = await getLeaderboard("all");
  const currentEntry = {
    registration: normalizedRegistration,
    studentName,
    playerType,
    score,
    finishedAt,
    sessionId,
  };
  const position = computeSessionPosition(leaderboard, currentEntry);

  const snapshot: PersistedResultResponse = {
    sessionId,
    registration: normalizedRegistration,
    studentName,
    playerType,
    score,
    title: getScoreTitle(score),
    position: position || leaderboard.length + 1,
    shareUrl,
    finishedAt,
    isPersonalBest,
    leaderboardSize: leaderboard.length + (existingBest ? 0 : 1),
  };

  await dbSet(resolveScorePath(`results/${sessionId}`), snapshot);

  return snapshot;
};
