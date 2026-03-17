import { BestScoreEntry } from "@/features/game/types";

export const sortLeaderboard = (entries: BestScoreEntry[]) =>
  [...entries].sort(
    (first, second) =>
      second.score - first.score || first.finishedAt - second.finishedAt
  );

export const shouldUpdateBestScore = (
  currentBest: BestScoreEntry | null,
  nextScore: number
) => !currentBest || nextScore > currentBest.score;

export const computeSessionPosition = (
  leaderboard: BestScoreEntry[],
  currentEntry: BestScoreEntry
) => {
  const withoutCurrentRegistration = leaderboard.filter(
    (entry) => entry.registration !== currentEntry.registration
  );
  const withCurrentEntry = sortLeaderboard([
    ...withoutCurrentRegistration,
    currentEntry,
  ]);

  return (
    withCurrentEntry.findIndex(
      (entry) =>
        entry.registration === currentEntry.registration &&
        entry.sessionId === currentEntry.sessionId
    ) + 1
  );
};
